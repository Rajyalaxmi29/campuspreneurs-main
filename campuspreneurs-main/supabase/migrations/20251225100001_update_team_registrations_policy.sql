-- Create policy for team_registrations to allow admins to view registrations
DROP POLICY IF EXISTS "Admins can view team registrations" ON public.team_registrations;

CREATE POLICY "Admins can view team registrations"
ON public.team_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
