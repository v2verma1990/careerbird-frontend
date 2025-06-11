// Script to update the RLS policies for the resumes bucket
import fetch from 'node-fetch';

// Replace these with your actual values from appsettings.json
const SUPABASE_URL = 'https://snbbzjcgtjdjdovurxjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYmJ6amNndGpkamRvdnVyeGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE4Mzg4MiwiZXhwIjoyMDYwNzU5ODgyfQ.tzAbjYcuFrJ5vHMlneMXOvtI3teJY1wNcmx9hlH3UOE'; // Use the service key
const BUCKET_NAME = 'resumes';

async function createPolicy(policyName, definition) {
  try {
    console.log(`Creating policy '${policyName}'...`);
    
    const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: policyName,
        bucket_id: BUCKET_NAME,
        ...definition
      })
    });
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log(`Policy '${policyName}' created successfully.`);
      const result = await createResponse.json();
      console.log('Result:', result);
      return true;
    } else {
      console.error(`Failed to create policy: ${createResponse.status}`);
      console.error(await createResponse.text());
      return false;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function updateBucketPolicies() {
  // Create a policy for INSERT operations (upload files)
  await createPolicy('Allow uploads for authenticated users', {
    operation: 'INSERT',
    expression: 'auth.role() = \'authenticated\'',
    allowed_mime_types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    file_size_limit: 5242880 // 5MB
  });
  
  // Create a policy for SELECT operations (download/view files)
  await createPolicy('Allow downloads for file owners', {
    operation: 'SELECT',
    expression: 'auth.uid()::text = (storage.foldername(name))[1]'
  });
  
  // Create a policy for UPDATE operations (replace files)
  await createPolicy('Allow updates for file owners', {
    operation: 'UPDATE',
    expression: 'auth.uid()::text = (storage.foldername(name))[1]'
  });
  
  // Create a policy for DELETE operations (delete files)
  await createPolicy('Allow deletes for file owners', {
    operation: 'DELETE',
    expression: 'auth.uid()::text = (storage.foldername(name))[1]'
  });
}

updateBucketPolicies();