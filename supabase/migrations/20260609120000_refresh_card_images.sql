-- Refresh course & job card images with curated Unsplash URLs (verified 2026-06).
-- Safe to re-run: only updates rows matched by title/company.

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Parcours Full-Stack JavaScript';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Fondamentaux PostgreSQL & SQL';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Docker & déploiement cloud';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'API REST & sécurité (Node.js)';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title IN (
  'Introduction à l''IA générative pour développeurs',
  'Introduction à l’IA générative pour développeurs'
);

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Scrum & gestion de projet agile';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Communication professionnelle & prise de parole';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Leadership & travail en équipe';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Anglais professionnel (B2 → C1)';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Français rédactionnel — CV & entretien';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title IN (
  'Personal branding LinkedIn',
  'Introduction au marché de l''emploi tunisien',
  'Introduction au marché de l’emploi tunisien'
);

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Gestion du temps & productivité';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Négociation salariale (marché tunisien)';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Design UX/UI — Figma';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Marketing digital & réseaux sociaux';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Comptabilité & finance pour non-financiers';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Cybersécurité — bonnes pratiques';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Data Analyst — Power BI & Excel';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Entrepreneuriat & création de startup';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'React.js avancé — hooks & performance';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title IN ('Python pour l''automatisation', 'Python pour l’automatisation');

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title IN (
  'Préparer son entretien d''embauche avec l''IA',
  'Préparer son entretien d’embauche avec l’IA'
);

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Optimiser son CV pour les ATS';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Google Analytics 4 — Formation officielle';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'AWS Cloud Practitioner Essentials';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'Microsoft Azure Fundamentals (AZ-900)';

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title IN (
  'Machine Learning Specialization',
  'Meta Front-End Developer Certificate'
);

UPDATE public.courses SET image_url = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&h=450&q=80'
WHERE title = 'CS50: Introduction to Computer Science';

-- Platform catalogue jobs (match by company + title)
UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Vermeg' AND position_title = 'Développeur Full Stack Java / React';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Focus Corporation' AND position_title = 'Ingénieur DevOps';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Expensya' AND position_title = 'Développeur Frontend React';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Orange Tunisie' AND position_title = 'Chef de projet digital';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'InstaDeep' AND position_title = 'Machine Learning Engineer';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Talabat (Delivery Hero)' AND position_title = 'Backend Developer Node.js';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'BIAT' AND position_title = 'Analyste données junior';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Digimytch' AND position_title = 'Stagiaire PFE — Talent Hub';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Société Générale' AND position_title = 'Développeur Java confirmé';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Beekeeper' AND position_title = 'Développeur mobile Flutter';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Proxym Group' AND position_title = 'Ingénieur QA / Test automation';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Wally' AND position_title = 'Data Engineer';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Stark Industries' AND position_title = 'Product Owner junior';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Cloudflare (partenaire)' AND position_title = 'Site Reliability Engineer';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'Ooredoo Tunisie' AND position_title = 'Consultant CRM Salesforce';

UPDATE public.jobs SET image_url = 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&h=450&q=80'
WHERE company_name = 'DEPT®' AND position_title = 'UX/UI Designer';
