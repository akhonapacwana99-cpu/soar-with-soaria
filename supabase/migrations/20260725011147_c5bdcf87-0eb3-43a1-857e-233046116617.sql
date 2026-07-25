-- Security hardening: revoke direct client access to all data tables.
-- All access is routed through server functions using the service role key,
-- so anon/authenticated must not be able to reach these tables directly.

-- Drop existing permissive "USING (true)" policies
DROP POLICY IF EXISTS "public rw dna" ON public.career_dna;
DROP POLICY IF EXISTS "public rw messages" ON public.chat_messages;
DROP POLICY IF EXISTS "public delete threads" ON public.chat_threads;
DROP POLICY IF EXISTS "public read threads" ON public.chat_threads;
DROP POLICY IF EXISTS "public update threads" ON public.chat_threads;
DROP POLICY IF EXISTS "public write threads" ON public.chat_threads;
DROP POLICY IF EXISTS "public rw folders" ON public.doc_folders;
DROP POLICY IF EXISTS "public rw documents" ON public.documents;
DROP POLICY IF EXISTS "public rw reflections" ON public.reflections;

-- Revoke all direct grants from anon and authenticated on data tables
REVOKE ALL ON public.career_dna FROM anon, authenticated;
REVOKE ALL ON public.chat_messages FROM anon, authenticated;
REVOKE ALL ON public.chat_threads FROM anon, authenticated;
REVOKE ALL ON public.doc_folders FROM anon, authenticated;
REVOKE ALL ON public.documents FROM anon, authenticated;
REVOKE ALL ON public.reflections FROM anon, authenticated;

-- Ensure service_role retains full access (used by server functions)
GRANT ALL ON public.career_dna TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.chat_threads TO service_role;
GRANT ALL ON public.doc_folders TO service_role;
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.reflections TO service_role;

-- Keep RLS enabled as defense in depth. With no policies and no grants,
-- anon/authenticated clients cannot read or write these tables at all.
ALTER TABLE public.career_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Lock down the private storage bucket: only service_role can read/write objects.
DROP POLICY IF EXISTS "documents anon rw" ON storage.objects;
DROP POLICY IF EXISTS "documents public read" ON storage.objects;
DROP POLICY IF EXISTS "documents public write" ON storage.objects;
DROP POLICY IF EXISTS "documents public update" ON storage.objects;
DROP POLICY IF EXISTS "documents public delete" ON storage.objects;