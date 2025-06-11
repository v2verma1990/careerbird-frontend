-- Disable RLS for storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);