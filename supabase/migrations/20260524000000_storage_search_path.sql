-- Compatibilité Supabase Storage API (Knex) en Docker local
CREATE SCHEMA IF NOT EXISTS extensions;

ALTER DATABASE postgres SET search_path TO storage, public;
