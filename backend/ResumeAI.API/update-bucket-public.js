// Script to update the bucket to be public and disable RLS
import fetch from 'node-fetch';

// Replace these with your actual values from appsettings.json
const SUPABASE_URL = 'https://snbbzjcgtjdjdovurxjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYmJ6amNndGpkamRvdnVyeGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE4Mzg4MiwiZXhwIjoyMDYwNzU5ODgyfQ.tzAbjYcuFrJ5vHMlneMXOvtI3teJY1wNcmx9hlH3UOE'; // Use the service key
const BUCKET_NAME = 'resumes';

async function updateBucket() {
  try {
    console.log(`Updating bucket '${BUCKET_NAME}'...`);
    
    const updateResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET_NAME}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public: true,
        file_size_limit: 5242880, // 5MB
        allowed_mime_types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      })
    });
    
    if (updateResponse.status === 200) {
      console.log(`Bucket '${BUCKET_NAME}' updated successfully.`);
      const result = await updateResponse.json();
      console.log('Result:', result);
    } else {
      console.error(`Failed to update bucket: ${updateResponse.status}`);
      console.error(await updateResponse.text());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateBucket();