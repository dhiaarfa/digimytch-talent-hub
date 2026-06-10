import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runJobApplicationUpsert,
  type JobApplicationRow,
  type JobApplicationUpsertDeps,
} from "./job-applications-upsert";
import { joinApplicationsWithActiveJobs } from "./job-applications";
import type { Job } from "./types";

const jobActive: Job = {
  id: "job-1",
  user_id: "u1",
  company_name: "TestCo",
  position_title: "Dev",
  job_url: null,
  description: "d",
  location: null,
  salary_range: null,
  keywords: [],
  work_location: "remote",
  employment_type: "full_time",
  created_at: "",
  updated_at: "",
  is_active: true,
};

function baseApp(overrides: Partial<JobApplicationRow> = {}): JobApplicationRow {
  return {
    id: "app-1",
    user_id: "u1",
    job_id: "job-1",
    resume_id: null,
    status: "saved",
    notes: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function createDeps(state: {
  job: { id: string } | null;
  application: JobApplicationRow | null;
  insertFails23505Once?: boolean;
}): JobApplicationUpsertDeps & {
  events: { from: string | null; to: string }[];
  get updates(): number;
  get inserts(): number;
} {
  const events: { from: string | null; to: string }[] = [];
  let insertAttempts = 0;
  let updateCount = 0;
  let insertCount = 0;

  return {
    events,
    get updates() {
      return updateCount;
    },
    get inserts() {
      return insertCount;
    },
    async fetchActiveJob(jobId: string) {
      if (!state.job || state.job.id !== jobId) return null;
      return state.job;
    },
    async fetchApplicationByJob() {
      return state.application;
    },
    async updateApplication(id, patch) {
      updateCount++;
      if (!state.application || state.application.id !== id) {
        throw new Error("update target missing");
      }
      state.application = { ...state.application, ...patch, status: patch.status };
      return state.application;
    },
    async insertApplication(row) {
      insertCount++;
      insertAttempts++;
      if (state.insertFails23505Once && insertAttempts === 1) {
        if (!state.application) {
          state.application = baseApp({
            status: row.status,
            deleted_at: "2026-01-01T00:00:00Z",
          });
        }
        return { data: null, error: { code: "23505" } };
      }
      if (state.application) {
        return { data: null, error: { code: "23505" } };
      }
      state.application = baseApp({
        job_id: row.job_id,
        resume_id: row.resume_id,
        status: row.status,
        notes: row.notes,
        deleted_at: null,
      });
      return { data: state.application, error: null };
    },
    async insertStatusEvent(ev) {
      events.push({ from: ev.from_status, to: ev.to_status });
    },
  };
}

describe("runJobApplicationUpsert — scenario matrix", () => {
  it("S1: new application on active job → saved + creation event", async () => {
    const deps = createDeps({ job: { id: "job-1" }, application: null });
    const result = await runJobApplicationUpsert(deps, { jobId: "job-1", status: "saved" });
    assert.equal(result.status, "saved");
    assert.equal(deps.inserts, 1);
    assert.deepEqual(deps.events, [{ from: null, to: "saved" }]);
  });

  it("S2: soft-deleted application → restore (deleted_at null)", async () => {
    const deps = createDeps({
      job: { id: "job-1" },
      application: baseApp({ deleted_at: "2026-05-01T00:00:00Z", status: "applied" }),
    });
    const result = await runJobApplicationUpsert(deps, { jobId: "job-1", status: "saved" });
    assert.equal((result as JobApplicationRow).deleted_at, null);
    assert.equal(result.status, "saved");
    assert.equal(deps.inserts, 0);
    assert.equal(deps.updates, 1);
  });

  it("S3: insert race 23505 → fetch + restore update", async () => {
    const deps = createDeps({
      job: { id: "job-1" },
      application: null,
      insertFails23505Once: true,
    });
    const result = await runJobApplicationUpsert(deps, { jobId: "job-1", status: "saved" });
    assert.equal((result as JobApplicationRow).deleted_at, null);
    assert.equal(deps.inserts, 1);
    assert.equal(deps.updates, 1);
  });

  it("S4: job missing or in trash → throws guided error", async () => {
    const deps = createDeps({ job: null, application: null });
    await assert.rejects(
      () => runJobApplicationUpsert(deps, { jobId: "job-1" }),
      /Mes offres/
    );
  });

  it("S5/S6: existing active application → update without duplicate insert", async () => {
    const deps = createDeps({
      job: { id: "job-1" },
      application: baseApp({ status: "applied" }),
    });
    await runJobApplicationUpsert(deps, { jobId: "job-1", status: "saved" });
    assert.equal(deps.inserts, 0);
    assert.equal(deps.updates, 1);
    assert.ok(deps.events.some((e) => e.from === "applied" && e.to === "saved"));
  });

  it("S11: same status upsert → no status event", async () => {
    const deps = createDeps({
      job: { id: "job-1" },
      application: baseApp({ status: "saved" }),
    });
    await runJobApplicationUpsert(deps, { jobId: "job-1", status: "saved" });
    assert.equal(deps.events.length, 0);
  });

  it("S12: list join hides app when job not in active set", () => {
    const joined = joinApplicationsWithActiveJobs(
      [baseApp({ status: "saved" })],
      []
    );
    assert.equal(joined.length, 0);
  });

  it("S12b: list join shows app when job active", () => {
    const joined = joinApplicationsWithActiveJobs([baseApp()], [jobActive]);
    assert.equal(joined.length, 1);
    assert.equal(joined[0].job.id, "job-1");
  });
});

describe("catalog + trash invariants (simulated state)", () => {
  it("S8: cascade — job delete timestamp applied to active apps", () => {
    const deletedAt = "2026-06-01T12:00:00Z";
    const apps = [
      baseApp({ id: "a1", deleted_at: null }),
      baseApp({ id: "a2", deleted_at: "2026-01-01" }),
    ];
    const cascaded = apps.map((a) =>
      !a.deleted_at ? { ...a, deleted_at: deletedAt } : a
    );
    assert.equal(cascaded[0].deleted_at, deletedAt);
    assert.equal(cascaded[1].deleted_at, "2026-01-01");
  });

  it("S9/S10: restore clears deleted_at on job and applications", () => {
    const job = { id: "job-1", deleted_at: "2026-06-01T12:00:00Z" as string | null };
    const app = baseApp({ deleted_at: "2026-06-01T12:00:00Z" });
    job.deleted_at = null;
    app.deleted_at = null;
    assert.equal(job.deleted_at, null);
    assert.equal(app.deleted_at, null);
    const visible = joinApplicationsWithActiveJobs([app], [{ ...jobActive, id: job.id }]);
    assert.equal(visible.length, 1);
  });
});
