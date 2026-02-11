-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view problem statements" ON public.problem_statements;

-- Create a new policy allowing anyone (including anonymous) to view
CREATE POLICY "Anyone can view problem statements" 
ON public.problem_statements 
FOR SELECT 
USING (true);

-- Create user_queries table for the Resources page queries feature
CREATE TABLE public.user_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_queries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a query (both logged in and anonymous users need to be able to submit)
CREATE POLICY "Anyone can submit queries"
ON public.user_queries
FOR INSERT
WITH CHECK (true);

-- Users can view their own queries
CREATE POLICY "Users can view their own queries"
ON public.user_queries
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all queries
CREATE POLICY "Admins can view all queries"
ON public.user_queries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update queries (to mark as resolved)
CREATE POLICY "Admins can update queries"
ON public.user_queries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete queries (for auto-cleanup)
CREATE POLICY "Admins can delete queries"
ON public.user_queries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));