export const TUNISIAN_INSTITUTIONS = [
  "INSAT — Institut National des Sciences Appliquées et de la Technologie",
  "ESPRIT — École Supérieure Privée d'Ingénierie et de Technologies",
  "SUP'COM — École Supérieure des Communications de Tunis",
  "ENSI — École Nationale des Sciences de l'Informatique",
  "IHEC — Institut des Hautes Études Commerciales",
  "TBS — Tunis Business School",
  "FST — Faculté des Sciences de Tunis",
  "ISIM — Institut Supérieur d'Informatique de Mahdia",
  "ISG — Institut Supérieur de Gestion",
  "Université de Carthage",
  "Université de Tunis El Manar",
  "Université de Sfax",
  "Université de Sousse",
] as const;

export const CONTRACT_TYPES_TN = [
  "CDI",
  "CDD",
  "CIVP — Contrat d'Initiation à la Vie Professionnelle",
  "Stage PFE",
  "Stage d'été",
  "Freelance / Mission",
  "Alternance",
  "Télétravail",
] as const;

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  saved: "Ajoutée aux sauvegardées",
  applied: "Candidature envoyée",
  interview: "Entretien programmé",
  rejected: "Candidature refusée",
  accepted: "Offre acceptée",
};

export const KANBAN_COLUMNS = [
  { id: "saved" as const, label: "À traiter", color: "var(--digi-muted)" },
  { id: "applied" as const, label: "Candidature envoyée", color: "var(--digi-navy)" },
  { id: "interview" as const, label: "Entretien", color: "var(--digi-orange)" },
  { id: "accepted" as const, label: "Offre reçue", color: "var(--digi-green)" },
];
