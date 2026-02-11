-- Add status column to problem_statements to support review workflow
ALTER TABLE public.problem_statements
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Optional: create an index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_problem_statements_status ON public.problem_statements(status);
