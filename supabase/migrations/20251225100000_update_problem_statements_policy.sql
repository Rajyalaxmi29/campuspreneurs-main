-- Update the policy to allow both anonymous and authenticated users to view problem statements
DROP POLICY IF EXISTS "Anyone can view problem statements" ON public.problem_statements;

CREATE POLICY "Anyone can view problem statements"
ON public.problem_statements
FOR SELECT
TO anon, authenticated
USING (true);
