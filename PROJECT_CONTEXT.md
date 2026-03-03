# Project Context Document: Campuspreneurs (Incamp Chapter 1)

## 1. Project Overview
**Campuspreneurs (Incamp Chapter 1)** is a platform designed to manage a campus-wide problem-solving event or hackathon. It allows students to browse real-world "problem statements," form teams, and register their solutions. Administrators can manage the problem statements, track registrations, and review pending_review documents.

- **Target Users:** 
  - Students (participants)
  - Administrators (organizers/jury)
  - Department Admins (reviewers for specific departments)
- **Core Purpose:** To streamline the hackathon lifecycle—from presenting problem statements and rules, to team formation, registration, document submission, and admin evaluation.

---

## 2. Tech Stack
- **Frontend Framework:** React 18 with Vite using TypeScript.
- **Styling & UI:** Tailwind CSS, `shadcn-ui` components (Radix UI primitives), `framer-motion`/`tailwindcss-animate` for animations.
- **Form Handling & Validation:** `react-hook-form` with `zod`.
- **State & Data Fetching:** `@tanstack/react-query` for asynchronous state, context API for global Auth state.
- **Routing:** `react-router-dom`.
- **Backend & Database:** Supabase (PostgreSQL for relation DB, Supabase Auth for identity, Supabase Storage for files).
- **Hosting/Deployment:** Built for Vercel / Lovable.

---

## 3. Database Architecture
The application uses PostgreSQL (via Supabase) with the following core tables:

- **`profiles`**: Linked directly to `auth.users`. Stores `id`, `name`, `email`, and a default `role`.
- **`user_roles`**: Links a `user_id` to a specific role. Used for robust role checking (avoids relying solely on JWT meta-data).
- **`problem_statements`**: Stores the available challenges.
  - Columns: `id`, `problem_statement_id` (e.g., PS001), `title`, `description`, `category`, `theme`, `department`, `status`.
- **`team_registrations`**: Stores team sign-ups.
  - Columns: `id`, `user_id` (who registered), `team_name`, `problem_id` (references problem_statement_id), member details (1-4 members with names and roll numbers), `year`, `department`, `phone`, `email`, and `document_url`.
- **`page_content`**: A simple CMS structure for dynamic page content (e.g., event phases, contact info coordinators).
- **`resources`**: Stores metadata for downloadable guidelines/templates.
- **Storage Buckets**: 
  - `resources` (Public): For PPT templates, rubrics, rules.
  - `team-documents` (Private): For uploaded team presentations/documents.

---

## 4. Authorization & Security Model
The system uses **Supabase Row Level Security (RLS)** to enforce access control.

- **Roles:**
  - **`student`**: Default role. Can view problem statements, manage their own profile, register a team, and upload/manage their own team's documents.
  - **`admin`**: Full access. Can view/delete all registrations, manage problem statements, upload to `resources`, and view/download all `team-documents`.
  - **`deptadmin`**: Department-level administrators. (Note: These users are identified during login and routed to an external `depart-admin-portal`).
- **Data Security Strategy:**
  - `team_registrations` and `team-documents` storage are locked down so students can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` rows/files where `auth.uid() = user_id`.
  - Admins bypass this via a `has_role(auth.uid(), 'admin')` secure Postgres function.

---

## 5. Core Workflows
- **Authentication & Authorization:** 
  - Users sign up with an email and password. Email verification is enforced. 
  - **Important:** Only emails ending in `@gcet.edu.in` are permitted to register.
  - Post-login, the code queries `user_roles`. If the user is a `deptadmin`, they are immediately redirected to `https://depart-admin-portal.vercel.app/dashboard` with their session tokens appended to the URL hash for SSO-like behavior.
- **Team Registration Flow:**
  - Authenticated students go to the Registration page.
  - The form dynamically validates the 10-digit phone number and checks if the selected Problem ID exists in the database.
  - An RPC function `check_team_name_exists` ensures the chosen team name hasn't been taken.
  - The registering student fills out details for 1 to 4 members.
  - An optional pitch document/presentation (up to 10MB limit) is uploaded to the secure `team-documents` bucket.
  - Upon success, the registration is committed to the database.
- **Admin Review Flow:**
  - Admins access the `/admin` dashboard to view statistics (Recharts pie charts).
  - They can filter registrations by problem or theme, view uploaded documents via securely generated blob URLs, and accept/reject/delete team registrations or problem statements.

---

## 6. Folder Structure Explanation
- `/src/pages/`: Contains the main route views.
  - `Auth.tsx`: Login/Signup logic, GCET email validation, and deptadmin routing.
  - `Registration.tsx`: The complex multi-step team registration form.
  - `AdminDashboard.tsx`: Comprehensive dashboard for admins to manage the event.
  - `Problems.tsx` / `ProblemDetails.tsx`: Listing and detail views for the challenges.
  - `Departments.tsx`: View to manage problems categorized by departments.
- `/src/components/`: Reusable specific UI parts. `admin/` contains dialogs for editing teams and problems. `layout/` contains wrappers like `AdminLayout` and `Layout`.
- `/src/contexts/AuthContext.tsx`: The global state provider for the Supabase session and user details.
- `/supabase/migrations/`: Contains the SQL files that define the entire schema, seed data, storage buckets, triggers, and RLS policies. It is the absolute source of truth for the database architecture.

---

## 7. Important Business Rules
- **Domain Restriction:** Students *must* use a `@gcet.edu.in` email to register.
- **Unique Teams:** Team names must be universally unique across the platform.
- **Registration Constraints:** 
  - A team must have at least 1 member (the registrant represents Member 1).
  - Maximum of 4 members per team.
  - Phone numbers are strictly validated (10 digits, starts with 6-9).
- **Document Constraints:** Uploads are limited to `.pdf`, `.ppt`, and `.pptx` formats, with a maximum file size of 10MB.

---

## 8. Environment Configuration
The application requires the standard Supabase credentials to function:
- `VITE_SUPABASE_URL`: The URL of the Supabase instance.
- `VITE_SUPABASE_ANON_KEY`: The anonymous API key for the Supabase instance.
  
These values must be present in a `.env` file at the root. 

---

## 9. Known Limitations or TODOs
1. **Department Admin Portal Auth Flow Issue:** 
   - A `TODO.md` file notes that the redirection to the external `deptadmin` portal is currently resulting in the user seeing a login page instead of the dashboard. The hash-based token passing (`#access_token=...`) isn't being consumed correctly by the target application, requiring improvements to `Auth.tsx` UX and the target portal's auth ingestion logic.
2. **Postgres Enum vs String:**
   - The Postgres `app_role` enum defined in the schema technically only includes `'admin'` and `'student'`, but the codebase checks for `'deptadmin'` as a string. Depending on how the production database was updated, this enum may need an `ALTER TYPE` to officially support `'deptadmin'`.
3. **Delete Cascades for Storage Objects:**
   - When a team registration is deleted by an admin, the app manually triggers a storage delete for the associated document. If that frontend request fails, orphaned files could be left in the `team-documents` bucket.
