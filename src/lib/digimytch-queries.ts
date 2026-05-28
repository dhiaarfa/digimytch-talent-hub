import { cache } from "react";
import { getJobsWithMatchScores } from "@/utils/actions/digimytch/actions";
import { listJobApplications } from "@/utils/actions/applications/actions";

/** Dedupe les requêtes lourdes dans un même rendu serveur (navigation plus rapide). */
export const getCachedJobsWithMatch = cache(getJobsWithMatchScores);
export const getCachedApplications = cache(listJobApplications);
