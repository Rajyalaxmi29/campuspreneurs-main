-- Create department_messages table for chat between admin and departments
BEGIN;

CREATE TABLE IF NOT EXISTS public.department_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  sender_id uuid NULL,
  sender_name text NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_department_messages_department ON public.department_messages(department);

COMMIT;
