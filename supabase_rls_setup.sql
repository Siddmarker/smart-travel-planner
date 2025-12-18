-- 1. Enable RLS on trips table
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 2. Allow Authenticated Users to INSERT their own trips
-- Drop existing policy if it exists to avoid errors (optional, but good practice if re-running)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON trips;
CREATE POLICY "Enable insert for authenticated users only"
ON trips FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- 3. Allow Users to SEE their own trips
DROP POLICY IF EXISTS "Enable read access for owning users" ON trips;
CREATE POLICY "Enable read access for owning users"
ON trips FOR SELECT
TO authenticated
USING (auth.uid() = created_by);
