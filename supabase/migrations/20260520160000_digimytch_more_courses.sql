-- Catalogue élargi : soft skills, carrière, langues, management (pas que hard skills)

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Communication professionnelle & prise de parole', 'Digimytch Academy', ARRAY['communication','presentation','soft skills'], 'Débutant', 'https://example.org/courses/communication'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Communication professionnelle & prise de parole');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Leadership & travail en équipe', 'Digimytch Academy', ARRAY['leadership','teamwork','management'], 'Intermédiaire', 'https://example.org/courses/leadership'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Leadership & travail en équipe');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Anglais professionnel (B2 → C1)', 'British Council Tunisie', ARRAY['english','communication','soft skills'], 'Intermédiaire', 'https://example.org/courses/english-pro'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Anglais professionnel (B2 → C1)');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Français rédactionnel — CV & entretien', 'Digimytch Academy', ARRAY['french','writing','career'], 'Débutant', 'https://example.org/courses/french-career'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Français rédactionnel — CV & entretien');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Personal branding LinkedIn', 'Digimytch Academy', ARRAY['linkedin','personal branding','networking'], 'Débutant', 'https://example.org/courses/linkedin'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Personal branding LinkedIn');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Gestion du temps & productivité', 'OpenClassrooms', ARRAY['productivity','organization','soft skills'], 'Débutant', 'https://example.org/courses/productivity'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Gestion du temps & productivité');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Négociation salariale (marché tunisien)', 'Digimytch Academy', ARRAY['negotiation','career','soft skills'], 'Intermédiaire', 'https://example.org/courses/negotiation'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Négociation salariale (marché tunisien)');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Design UX/UI — Figma', 'GoMyCode', ARRAY['figma','ux','ui design'], 'Débutant', 'https://example.org/courses/figma-ux'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Design UX/UI — Figma');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Marketing digital & réseaux sociaux', 'Digimytch Academy', ARRAY['marketing','seo','social media'], 'Intermédiaire', 'https://example.org/courses/digital-marketing'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Marketing digital & réseaux sociaux');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Comptabilité & finance pour non-financiers', 'ESAA Tunis', ARRAY['finance','accounting','business'], 'Débutant', 'https://example.org/courses/finance-basics'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Comptabilité & finance pour non-financiers');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Cybersécurité — bonnes pratiques', 'Digimytch Academy', ARRAY['security','cybersecurity','awareness'], 'Débutant', 'https://example.org/courses/cyber-awareness'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Cybersécurité — bonnes pratiques');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Data Analyst — Power BI & Excel', 'Digimytch Academy', ARRAY['power bi','excel','data analysis'], 'Intermédiaire', 'https://example.org/courses/powerbi'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Data Analyst — Power BI & Excel');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Entrepreneuriat & création de startup', 'Flat6Labs', ARRAY['entrepreneurship','startup','business plan'], 'Débutant', 'https://example.org/courses/startup'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Entrepreneuriat & création de startup');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'React.js avancé — hooks & performance', 'Digimytch Academy', ARRAY['react','javascript','frontend'], 'Avancé', 'https://example.org/courses/react-advanced'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'React.js avancé — hooks & performance');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Python pour l''automatisation', 'GoMyCode', ARRAY['python','automation','scripting'], 'Intermédiaire', 'https://example.org/courses/python-auto'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Python pour l''automatisation');
