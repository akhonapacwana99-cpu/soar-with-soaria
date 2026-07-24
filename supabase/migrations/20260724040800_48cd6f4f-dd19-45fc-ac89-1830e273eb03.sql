
-- Device-scoped storage (no auth). Every table keyed by device_id text.

CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_threads_device_updated_idx ON public.chat_threads(device_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO anon, authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read threads" ON public.chat_threads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public write threads" ON public.chat_threads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update threads" ON public.chat_threads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete threads" ON public.chat_threads FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
CREATE INDEX chat_messages_device_content_idx ON public.chat_messages USING gin (to_tsvector('simple', content));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw messages" ON public.chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.doc_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_folders TO anon, authenticated;
GRANT ALL ON public.doc_folders TO service_role;
ALTER TABLE public.doc_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw folders" ON public.doc_folders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  folder_id uuid REFERENCES public.doc_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  mime text NOT NULL DEFAULT 'application/octet-stream',
  size integer NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  extracted_text text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_device_idx ON public.documents(device_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon, authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw documents" ON public.documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.career_dna (
  device_id text PRIMARY KEY,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  core_values jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_style jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_dna TO anon, authenticated;
GRANT ALL ON public.career_dna TO service_role;
ALTER TABLE public.career_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw dna" ON public.career_dna FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  mood integer,
  prompt text,
  entry text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reflections_device_idx ON public.reflections(device_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO anon, authenticated;
GRANT ALL ON public.reflections TO service_role;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw reflections" ON public.reflections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
