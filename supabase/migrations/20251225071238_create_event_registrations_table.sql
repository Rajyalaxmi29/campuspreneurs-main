-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own event registrations"
  ON public.event_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert own event registrations"
  ON public.event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all event registrations"
  ON public.event_registrations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all registrations
CREATE POLICY "Admins can manage all event registrations"
  ON public.event_registrations
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
