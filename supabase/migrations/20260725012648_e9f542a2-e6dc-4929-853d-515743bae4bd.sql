CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  overall_rating INTEGER,
  ease_rating INTEGER,
  ai_useful TEXT,
  most_helpful_feature TEXT,
  issues TEXT,
  wishes TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
-- No policies: all reads/writes go through server functions using the service role.