-- Create team_registrations table
CREATE TABLE public.team_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  member1_name TEXT NOT NULL,
  member1_roll TEXT NOT NULL,
  member2_name TEXT,
  member2_roll TEXT,
  member3_name TEXT,
  member3_roll TEXT,
  member4_name TEXT,
  member4_roll TEXT,
  year TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on team_registrations
ALTER TABLE public.team_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own team registrations"
  ON public.team_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert own team registrations"
  ON public.team_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own team registrations"
  ON public.team_registrations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all team registrations"
  ON public.team_registrations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all registrations
CREATE POLICY "Admins can manage all team registrations"
  ON public.team_registrations
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for team documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-documents', 'team-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for team-documents bucket
CREATE POLICY "Users can view their own team document files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own team document files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'team-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own team document files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'team-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own team document files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'team-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all team document files
CREATE POLICY "Admins can view all team document files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-documents' AND public.has_role(auth.uid(), 'admin'));

-- Admins can manage all team document files
CREATE POLICY "Admins can manage all team document files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'team-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'team-documents' AND public.has_role(auth.uid(), 'admin'));
