CREATE TABLE public.resume_profiles (
  device_id text PRIMARY KEY,
  target_role text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  education text NOT NULL DEFAULT '',
  skills text NOT NULL DEFAULT '',
  extras text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.resume_profiles TO service_role;

ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_resume_profiles_updated_at
BEFORE UPDATE ON public.resume_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();