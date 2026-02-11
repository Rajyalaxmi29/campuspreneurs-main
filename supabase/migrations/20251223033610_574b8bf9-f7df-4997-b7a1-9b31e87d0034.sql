-- Create page_content table for CMS-style editable pages
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name TEXT NOT NULL,
  section_key TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_name, section_key)
);

-- Enable RLS on page_content
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read page content
CREATE POLICY "Anyone can view page content"
  ON public.page_content
  FOR SELECT
  USING (true);

-- Only admins can modify page content
CREATE POLICY "Admins can manage page content"
  ON public.page_content
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create resources table for document management
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  section_key TEXT NOT NULL UNIQUE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Everyone can view resources
CREATE POLICY "Anyone can view resources"
  ON public.resources
  FOR SELECT
  USING (true);

-- Only admins can manage resources
CREATE POLICY "Admins can manage resources"
  ON public.resources
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resources bucket
CREATE POLICY "Public can view resource files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resources');

CREATE POLICY "Admins can upload resource files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resource files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resource files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

-- Seed problem statements (12 problems across 3 themes)
INSERT INTO public.problem_statements (problem_statement_id, title, description, category, theme) VALUES
('25001', 'Smart Attendance Management System', 'Develop an automated attendance tracking system using facial recognition or RFID technology to reduce manual effort and ensure accurate attendance records for students and faculty.', 'Software', 'Academic'),
('25002', 'AI-Powered Exam Proctoring Solution', 'Create an AI-based remote proctoring system that can detect suspicious behavior during online examinations while ensuring student privacy and reducing false positives.', 'Software', 'Academic'),
('25003', 'Interactive Learning Management Platform', 'Build a comprehensive LMS that supports multimedia content, real-time collaboration, progress tracking, and personalized learning paths for diverse student needs.', 'Software', 'Academic'),
('25004', 'Digital Laboratory Booking System', 'Design a smart scheduling system for laboratory resources that optimizes utilization, reduces conflicts, and allows students to book equipment and workstations efficiently.', 'Software', 'Academic'),
('25005', 'Smart Campus Navigation App', 'Develop an indoor navigation system using AR or beacons to help new students, visitors, and faculty navigate the campus buildings and find classrooms, offices, and facilities.', 'Hardware/Software', 'Non-Academic'),
('25006', 'Automated Lost & Found Management', 'Create a platform where students can report and claim lost items with image recognition matching, reducing the manual effort of campus security in managing found items.', 'Software', 'Non-Academic'),
('25007', 'Campus Food Waste Reduction System', 'Build a predictive system that helps the campus cafeteria optimize food preparation quantities, track waste, and redistribute excess food to minimize environmental impact.', 'Hardware/Software', 'Non-Academic'),
('25008', 'Student Mental Health Support Platform', 'Design a confidential platform that provides mental health resources, peer support networks, and connects students with counselors while maintaining privacy.', 'Software', 'Non-Academic'),
('25009', 'Rural Healthcare Awareness App', 'Create a multilingual mobile application that educates rural communities about preventive healthcare, connects them with local health workers, and tracks health indicators.', 'Software', 'Community Innovation'),
('25010', 'Water Quality Monitoring System', 'Develop a low-cost IoT-based solution for monitoring water quality in local water bodies and providing real-time alerts to authorities about contamination levels.', 'Hardware/Software', 'Community Innovation'),
('25011', 'Skill Development for Rural Youth', 'Build an offline-capable platform that provides vocational training content, connects rural youth with job opportunities, and tracks their skill development progress.', 'Software', 'Community Innovation'),
('25012', 'Smart Waste Segregation Assistant', 'Design an AI-powered waste classification system that helps households and communities properly segregate waste for recycling and composting.', 'Hardware/Software', 'Community Innovation');

-- Seed initial resources
INSERT INTO public.resources (title, description, file_type, section_key) VALUES
('PPT Template', 'Official presentation template with guidelines for your final pitch.', 'PPTX', 'ppt_template'),
('Evaluation Rubrics', 'Detailed scoring criteria used by the jury for assessment.', 'PDF', 'evaluation_rubrics'),
('Rules & Guidelines', 'Complete rulebook covering eligibility, conduct, and submission rules.', 'PDF', 'rules_guidelines'),
('Timeline PDF', 'Detailed schedule with important dates and deadlines.', 'PDF', 'timeline_pdf');

-- Seed initial page content for Event Structure
INSERT INTO public.page_content (page_name, section_key, content) VALUES
('event_structure', 'phases', '[
  {"id": 0, "name": "Phase 0", "title": "Problem Discovery", "icon": "Target", "points": ["Observe and identify real campus challenges", "Document problem areas with evidence", "Validate problem significance through surveys", "Select problem statement for submission", "Form initial understanding of stakeholders"]},
  {"id": 1, "name": "Phase 1", "title": "Team Formation & Registration", "icon": "Users", "points": ["Form cross-functional teams (3-5 members)", "Assign roles and responsibilities", "Complete online registration", "Submit initial problem selection", "Receive confirmation and guidelines", "Access to mentorship resources"]},
  {"id": 2, "name": "Phase 2", "title": "Solution Ideation", "icon": "Lightbulb", "points": ["Brainstorm multiple solution approaches", "Conduct feasibility analysis", "Validate ideas with potential users", "Refine solution based on feedback", "Prepare initial solution proposal"]},
  {"id": 3, "name": "Phase 3", "title": "Prototype Development", "icon": "Rocket", "points": ["Build minimum viable prototype", "Document development process", "Test prototype with target users", "Iterate based on testing feedback", "Prepare comprehensive documentation", "Create presentation materials"]},
  {"id": 4, "name": "Phase 4", "title": "Final Pitch & Evaluation", "icon": "Award", "points": ["Present solution to jury panel", "Demonstrate working prototype", "Answer evaluator questions", "Receive feedback and scores", "Award ceremony and recognition", "Opportunity for incubation support"]}
]'),
('event_structure', 'framework', '[
  {"letter": "D", "word": "Discover", "description": "Identify and understand the problem"},
  {"letter": "D", "word": "Define", "description": "Clearly articulate the challenge"},
  {"letter": "D", "word": "Design", "description": "Ideate and plan the solution"},
  {"letter": "D", "word": "Develop", "description": "Build and test the prototype"},
  {"letter": "D", "word": "Deliver", "description": "Present and implement the solution"}
]');

-- Seed initial page content for Contact page
INSERT INTO public.page_content (page_name, section_key, content) VALUES
('contact', 'coordinators', '[
  {"role": "Head Coordinator", "name": "Rahul Sharma", "email": "rahul.sharma@gcet.edu.in", "phone": "+91 98765 43210"},
  {"role": "Co-Coordinator", "name": "Priya Verma", "email": "priya.verma@gcet.edu.in", "phone": "+91 98765 43211"},
  {"role": "Co-Coordinator", "name": "Amit Kumar", "email": "amit.kumar@gcet.edu.in", "phone": "+91 98765 43212"},
  {"role": "Co-Coordinator", "name": "Neha Singh", "email": "neha.singh@gcet.edu.in", "phone": "+91 98765 43213"},
  {"role": "Co-Coordinator", "name": "Vikram Joshi", "email": "vikram.joshi@gcet.edu.in", "phone": "+91 98765 43214"},
  {"role": "Co-Coordinator", "name": "Sunita Rao", "email": "sunita.rao@gcet.edu.in", "phone": "+91 98765 43215"}
]'),
('contact', 'general_info', '{
  "email": "campuspreneurs@gcet.edu.in",
  "phone": "+91 12345 67890",
  "address": "GCET Campus, Knowledge Park II, Greater Noida, Uttar Pradesh 201310, India"
}');