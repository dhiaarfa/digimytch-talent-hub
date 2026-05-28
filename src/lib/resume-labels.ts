import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import { RESUME_LABELS_FR } from "@/lib/resume-labels-fr";

const RESUME_LABELS_EN = {
  identity: "Identity",
  experiences: "Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
  layout: "Layout",
  scoreCV: "Score",
  coverLetter: "Cover Letter",
  baseResume: "Base Resume",
  tailoredResume: "Tailored Resume",
  fillFromProfile: "Fill from Profile",
  importFromProfile: "Import from Profile",
  addExperience: "Add Experience",
  addProject: "Add Project",
  addEducation: "Add Education",
  addSkill: "Add Skill",
  addPoint: "Add Point",
  addTechnology: "Add Technology",
  writeWithAI: "Write with AI",
  writePointsWithAI: "Write points with AI",
  clearChatHistory: "Clear Chat History",
  createCoverLetter: "Create Cover Letter",
  createTailoredResume: "Create Tailored Resume",
  newBaseResume: "New Base Resume",
  newTailoredResume: "New Tailored Resume",
  savedStyles: "Saved Styles",
  defaultLayout: "Default Layout",
  compactLayout: "Compact Layout",
  import: "Import",
  download: "Download",
  save: "Save",
  unsavedChanges: "Unsaved Changes",
  saveChanges: "Save Changes",
  leave: "Leave",
  cancel: "Cancel",
  projectName: "Project Name",
  liveUrl: "Live URL",
  githubUrl: "GitHub URL",
  date: "Date",
  keyFeatures: "Key Features & Technical Achievements",
  technologiesUsed: "Technologies & Tools Used",
  selectContentToInclude: "Select Content to Include",
  establishment: "Establishment",
  city: "City",
  country: "Country",
  degree: "Degree",
  fieldOfStudy: "Field of Study",
  gpa: "GPA (optional)",
  achievementsActivities: "Achievements & Activities",
  fontSize: "Font Size",
  lineHeight: "Line Height",
  verticalMargins: "Vertical Margins",
  horizontalMargins: "Horizontal Margins",
  spaceAboveSection: "Space Above Section",
  spaceBelowSection: "Space Below Section",
  spaceBetweenItems: "Space Between Items",
  nameSize: "Name Size",
  spaceBelowName: "Space Below Name",
  aiSuggestion: "AI Suggestion",
  accept: "Accept",
  reject: "Reject",
  askAboutResume: "Ask me anything about your resume...",
  startWritingCoverLetter: "Start writing your cover letter...",
  createCVTailoredFirst: "Create a tailored resume linked to a job first.",
  successSaved: "Saved successfully",
  errorApiKey: "API Key Error",
  errorGeneric: "An error occurred",
  noBaseResumes: "No Base Resumes Found",
  createBaseResumeFirst: "Create a base resume first.",
  placeholderDate: "e.g. Jan 2023 - Present",
  emptySection: "empty",
  copyBaseResume: "Copy Base Resume",
  leaveWithoutSaving: "Leave Without Saving",
  clearChatHistoryTitle: "Clear Chat History",
  clearChatHistoryDesc: "This will permanently delete all your chat conversations. This action cannot be undone.",
  chooseBaseResume: "Choose a base resume to start with",
  configureJobDetails: "Configure job details and tailoring method",
  noBaseResumesDesc: "You need to create a base resume first before you can create a tailored version.",
  aiSuggestions: "AI Suggestions",
  logout: "Logout",
  signingOut: "Signing out...",
  errorSigningOut: "Error signing out",
  tryAgain: "Please try again",
  coverLetterLabel: "Cover Letter",
  nameSizeLabel: "Name Size",
} as const;

export type ResumeLabels = typeof RESUME_LABELS_FR;

function readDigiLang(): "fr" | "en" | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("digi-lang");
  return stored === "en" || stored === "fr" ? stored : null;
}

export function resumeLabels(): ResumeLabels {
  const lang = readDigiLang();
  if (lang === "en") return RESUME_LABELS_EN as unknown as ResumeLabels;
  return (isDigimytchTalentHub() ? RESUME_LABELS_FR : RESUME_LABELS_EN) as ResumeLabels;
}

/** Libellés CV réactifs au changement FR/EN (composants client). */
export { useResumeLabels } from "@/hooks/use-resume-labels";

/** Libellé bilingue selon digi-lang (FR/EN) */
export function tResume(en: string, fr: string): string {
  const lang = readDigiLang();
  if (lang === "en") return en;
  if (lang === "fr") return fr;
  return isDigimytchTalentHub() ? fr : en;
}
