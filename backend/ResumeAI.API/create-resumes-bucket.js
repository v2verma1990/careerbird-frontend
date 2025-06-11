// Simple script to create a Supabase bucket
import fetch from 'node-fetch';

// Replace these with your actual values from appsettings.json
const SUPABASE_URL = 'https://snbbzjcgtjdjdovurxjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYmJ6amNndGpkamRvdnVyeGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE4Mzg4MiwiZXhwIjoyMDYwNzU5ODgyfQ.tzAbjYcuFrJ5vHMlneMXOvtI3teJY1wNcmx9hlH3UOE'; // Use the service key
const BUCKET_NAME = 'resumes';

async function createBucket() {
  try {
    // First check if the bucket exists
    console.log(`Checking if bucket '${BUCKET_NAME}' exists...`);
    
    const checkResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET_NAME}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    });
    
    if (checkResponse.status === 200) {
      console.log(`Bucket '${BUCKET_NAME}' already exists.`);
      const bucketInfo = await checkResponse.json();
      console.log('Bucket details:', bucketInfo);
      return;
    }
    
    // Continue even if we get an error checking the bucket
    console.log(`Bucket check returned status: ${checkResponse.status}`);
    console.log(await checkResponse.text());
    
    // Create the bucket
    console.log(`Creating bucket '${BUCKET_NAME}'...`);
    
    const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: BUCKET_NAME,
        name: BUCKET_NAME,
        public: true  // Setting to public so files can be accessed directly
      })
    });
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log(`Bucket '${BUCKET_NAME}' created successfully.`);
      const result = await createResponse.json();
      console.log('Result:', result);
    } else {
      console.error(`Failed to create bucket: ${createResponse.status}`);
      console.error(await createResponse.text());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createBucket();