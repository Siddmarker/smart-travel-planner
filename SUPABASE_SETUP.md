# Supabase Setup Guide for "2wards" Travel Planner

Follow these steps to connect your project to Supabase.

## 1. Create a Supabase Project
1.  Go to [supabase.com](https://supabase.com/) and Sign Up/Log In.
2.  Click **"New Project"**.
3.  Choose your Organization.
4.  Enter a **Name** (e.g., "Smart Travel Planner") and **Database Password** (save this password safely).
5.  Select a **Region** close to you (e.g., Mumbai, Singapore).
6.  Click **"Create new project"**.
7.  Wait a minute for the database to provision.

## 2. Get API Keys
1.  Once the project is ready, go to **Project Settings** (Cog icon at the bottom left) -> **API**.
2.  Look for the **Project URL** and **Project API Keys** (anon / public).
3.  Update your local `.env.local` file with these values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
```

> **Note**: Do NOT use the `service_role` key in your `.env.local` or client-side code.

## 3. Setup Database Schema
We need to create the tables (`trips`, `profiles`, `user_credentials`, etc.).

1.  In your Supabase Dashboard, go to the **SQL Editor** (icon looking like `[>_]` on the left sidebar).
2.  Click **"New query"**.
3.  Copy and paste the entire content of the file `src/database_schema.sql` from this project.
    - You can find this file in your code editor at: `smart-travel-planner/src/database_schema.sql`.
4.  Click **"Run"** (bottom right of the query window).
5.  Ensure you see "Success" in the results.

## 4. Verify Connection
1.  Restart your local development server:
    ```bash
    npm run dev
    ```
2.  Go to `http://localhost:3000/test-planner`.
3.  Click **"Create Trip Shell"**. If it returns a `trip_id`, your connection works!
4.  Go to `http://localhost:3000/signup` and create an account. Check your Supabase **Table Editor** -> `profiles` table to see the new user.
