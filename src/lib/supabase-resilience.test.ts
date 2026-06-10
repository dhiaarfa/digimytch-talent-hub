import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAuthTimeoutForRequest,
  getAuthUserWithTimeout,
  hasSupabaseAuthCookieFromRequest,
  isDataPassthroughRequest,
  isPublicAppRoute,
} from "./supabase-resilience";

function mockRequest(
  init: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: { name: string; value: string }[];
    search?: string;
  } = {}
) {
  const headers = new Headers(init.headers ?? {});
  const url = new URL(`http://localhost:3000/path${init.search ?? ""}`);
  return {
    method: init.method ?? "GET",
    nextUrl: url,
    headers: {
      get(name: string) {
        return headers.get(name);
      },
      has(name: string) {
        return headers.has(name);
      },
    },
    cookies: {
      getAll() {
        return init.cookies ?? [];
      },
    },
  } as Parameters<typeof isDataPassthroughRequest>[0];
}

describe("isDataPassthroughRequest", () => {
  it("detects Server Action POSTs", () => {
    assert.equal(
      isDataPassthroughRequest(
        mockRequest({
          method: "POST",
          headers: { "Next-Action": "abc123" },
        })
      ),
      true
    );
  });

  it("detects RSC GET requests", () => {
    assert.equal(
      isDataPassthroughRequest(
        mockRequest({ method: "GET", headers: { rsc: "1" } })
      ),
      true
    );
  });

  it("detects flight requests via Accept header", () => {
    assert.equal(
      isDataPassthroughRequest(
        mockRequest({
          method: "GET",
          headers: { accept: "text/x-component, application/json" },
        })
      ),
      true
    );
  });

  it("detects _rsc query param", () => {
    assert.equal(
      isDataPassthroughRequest(mockRequest({ search: "?_rsc=abc" })),
      true
    );
  });

  it("detects Next-Router-State-Tree header", () => {
    assert.equal(
      isDataPassthroughRequest(
        mockRequest({
          headers: { "Next-Router-State-Tree": "%5B%5D" },
        })
      ),
      true
    );
  });

  it("does not treat normal navigation as passthrough", () => {
    assert.equal(isDataPassthroughRequest(mockRequest({ method: "GET" })), false);
  });

  it("detects router prefetch requests", () => {
    assert.equal(
      isDataPassthroughRequest(
        mockRequest({ headers: { "Next-Router-Prefetch": "1" } })
      ),
      true
    );
    assert.equal(
      isDataPassthroughRequest(
        mockRequest({ headers: { "x-router-prefetch": "1" } })
      ),
      true
    );
  });
});

describe("isPublicAppRoute", () => {
  it("allows landing and auth routes without session", () => {
    assert.equal(isPublicAppRoute("/"), true);
    assert.equal(isPublicAppRoute("/auth/login"), true);
    assert.equal(isPublicAppRoute("/home"), false);
    assert.equal(isPublicAppRoute("/jobs"), false);
  });
});

describe("getAuthTimeoutForRequest", () => {
  it("uses shorter timeout for passthrough requests", () => {
    const normal = getAuthTimeoutForRequest(mockRequest({ method: "GET" }));
    const rsc = getAuthTimeoutForRequest(
      mockRequest({ method: "GET", headers: { rsc: "1" } })
    );
    assert.ok(rsc < normal);
  });
});

describe("getAuthUserWithTimeout", () => {
  it("returns user when getUser resolves within timeout", async () => {
    const result = await getAuthUserWithTimeout(
      async () => ({ data: { user: { id: "u1" } as import("@supabase/supabase-js").User } }),
      500
    );
    assert.equal(result.user?.id, "u1");
    assert.equal(result.unavailable, false);
  });

  it("marks unavailable on timeout (fast-fail for middleware)", async () => {
    const result = await getAuthUserWithTimeout(
      () => new Promise(() => {}),
      30
    );
    assert.equal(result.user, null);
    assert.equal(result.unavailable, true);
  });
});

describe("hasSupabaseAuthCookieFromRequest", () => {
  it("returns true when sb- cookie exists", () => {
    assert.equal(
      hasSupabaseAuthCookieFromRequest(
        mockRequest({ cookies: [{ name: "sb-localhost-auth-token", value: "x" }] })
      ),
      true
    );
  });

  it("returns false without sb- cookies", () => {
    assert.equal(
      hasSupabaseAuthCookieFromRequest(
        mockRequest({ cookies: [{ name: "other", value: "y" }] })
      ),
      false
    );
  });
});
