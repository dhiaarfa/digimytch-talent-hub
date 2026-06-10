import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  activeTrackedJobIds,
  applicationIdsToCascadeOnJobDelete,
  buildApplicationUpsertPatch,
  findApplicationByJobId,
  isCatalogJobOwned,
  joinApplicationsWithActiveJobs,
  jobMissingForApplicationMessage,
  shouldRecordStatusChange,
  upsertInsertErrorMessage,
} from "./job-applications";
import type { Job, JobApplication } from "./types";

const jobA: Job = {
  id: "job-a",
  user_id: "u1",
  company_name: "Acme",
  position_title: "Dev",
  job_url: null,
  description: "x",
  location: null,
  salary_range: null,
  keywords: [],
  work_location: "remote",
  employment_type: "full_time",
  created_at: "",
  updated_at: "",
  is_active: true,
};

const jobB: Job = { ...jobA, id: "job-b", position_title: "PM" };

const baseApp: JobApplication = {
  id: "app-1",
  user_id: "u1",
  job_id: "job-a",
  resume_id: "cv-1",
  status: "applied",
  notes: "note",
  created_at: "",
  updated_at: "",
};

describe("buildApplicationUpsertPatch", () => {
  it("restores soft-deleted row and defaults status to saved", () => {
    const patch = buildApplicationUpsertPatch(
      { ...baseApp, deleted_at: "2026-01-01T00:00:00Z" },
      { jobId: "job-a", status: "saved" }
    );
    assert.equal(patch.deleted_at, null);
    assert.equal(patch.status, "saved");
    assert.equal(patch.resume_id, "cv-1");
    assert.equal(patch.notes, "note");
  });

  it("keeps existing resume when input omits resumeId", () => {
    const patch = buildApplicationUpsertPatch(baseApp, { jobId: "job-a", status: "interview" });
    assert.equal(patch.resume_id, "cv-1");
    assert.equal(patch.status, "interview");
  });

  it("overrides resume and notes when provided", () => {
    const patch = buildApplicationUpsertPatch(baseApp, {
      jobId: "job-a",
      resumeId: "cv-2",
      notes: "new",
      status: "saved",
    });
    assert.equal(patch.resume_id, "cv-2");
    assert.equal(patch.notes, "new");
  });
});

describe("shouldRecordStatusChange", () => {
  it("records when status changes", () => {
    assert.equal(shouldRecordStatusChange("saved", "applied"), true);
  });

  it("skips when status unchanged", () => {
    assert.equal(shouldRecordStatusChange("saved", "saved"), false);
  });
});

describe("joinApplicationsWithActiveJobs", () => {
  it("returns apps only when job exists and is loaded", () => {
    const joined = joinApplicationsWithActiveJobs(
      [baseApp, { ...baseApp, id: "app-2", job_id: "job-missing" }],
      [jobA]
    );
    assert.equal(joined.length, 1);
    assert.equal(joined[0].job.id, "job-a");
  });

  it("excludes soft-deleted applications even if job exists", () => {
    const joined = joinApplicationsWithActiveJobs(
      [{ ...baseApp, deleted_at: "2026-05-01T00:00:00Z" }],
      [jobA]
    );
    assert.equal(joined.length, 0);
  });

  it("excludes apps when job was soft-deleted (not in jobs list)", () => {
    const joined = joinApplicationsWithActiveJobs([baseApp], []);
    assert.equal(joined.length, 0);
  });

  it("supports multiple columns worth of apps", () => {
    const joined = joinApplicationsWithActiveJobs(
      [
        { ...baseApp, status: "saved" },
        { ...baseApp, id: "app-2", job_id: "job-b", status: "applied" },
      ],
      [jobA, jobB]
    );
    assert.equal(joined.length, 2);
  });
});

describe("activeTrackedJobIds", () => {
  it("ignores trashed applications for jobs page button state", () => {
    const ids = activeTrackedJobIds([
      { job_id: "job-a", deleted_at: null },
      { job_id: "job-b", deleted_at: "2026-01-01" },
    ]);
    assert.deepEqual(ids, ["job-a"]);
  });
});

describe("upsertInsertErrorMessage", () => {
  it("maps unique violation to user-facing French message", () => {
    assert.match(upsertInsertErrorMessage("23505"), /déjà/);
  });

  it("uses generic message for other errors", () => {
    assert.equal(upsertInsertErrorMessage("42501"), "Création candidature impossible");
  });
});

describe("jobMissingForApplicationMessage", () => {
  it("guides user back to jobs list", () => {
    assert.match(jobMissingForApplicationMessage(), /Mes offres/);
  });
});

describe("isCatalogJobOwned", () => {
  it("ignores soft-deleted jobs so catalog entry stays available", () => {
    const owned = isCatalogJobOwned(
      [{ company_name: "Acme", position_title: "Dev", deleted_at: "2026-01-01" }],
      { company_name: "Acme", position_title: "Dev" }
    );
    assert.equal(owned, false);
  });

  it("matches case-insensitively on company and title", () => {
    const owned = isCatalogJobOwned(
      [{ company_name: "ACME", position_title: "dev", deleted_at: null }],
      { company_name: "acme", position_title: "Dev" }
    );
    assert.equal(owned, true);
  });
});

describe("findApplicationByJobId", () => {
  it("finds trashed row for upsert restore (no deleted_at filter)", () => {
    const row = findApplicationByJobId(
      [{ job_id: "job-a", id: "x" as unknown as string } as { job_id: string }],
      "job-a"
    );
    assert.ok(row);
  });
});

describe("applicationIdsToCascadeOnJobDelete", () => {
  it("returns only active applications for the job", () => {
    const ids = applicationIdsToCascadeOnJobDelete(
      [
        { id: "a1", job_id: "job-a", deleted_at: null },
        { id: "a2", job_id: "job-a", deleted_at: "2026-01-01" },
        { id: "a3", job_id: "job-b", deleted_at: null },
      ],
      "job-a"
    );
    assert.deepEqual(ids, ["a1"]);
  });
});

/**
 * Scenario matrix (manual / E2E):
 *
 * | # | Action | Expected |
 * |---|--------|----------|
 * | 1 | « Ajouter à Mes candidatures » on active job | saved column, toast, button → link |
 * | 2 | Re-click after trashing candidature only | restore app, visible again |
 * | 3 | Re-click after UNIQUE race (23505) | restore via retry update, no silent fail |
 * | 4 | Add while job in corbeille | error: offre introuvable |
 * | 5 | « Analyser cette offre » catalogue (new) | job + candidature saved |
 * | 6 | Catalogue when job exists, no candidature | upsert only |
 * | 7 | Catalogue when job was soft-deleted | restore job + upsert |
 * | 8 | Delete job from /jobs | job + linked candidatures in corbeille |
 * | 9 | Restore job from corbeille | job + linked candidatures active |
 * | 10 | Restore candidature from corbeille | candidature + job active |
 * | 11 | Kanban drag saved → applied | status + event |
 * | 12 | /candidatures with job deleted, app active | hidden until job restored |
 */
