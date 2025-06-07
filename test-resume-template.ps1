# Test script to verify the resume template rendering

# Get the current directory
$currentDir = Get-Location

# Copy the response.txt data to a test file
$responseData = Get-Content -Path "$currentDir\backend\ResumeAI.API\html\error\response.txt" -Raw
$testData = $responseData | ConvertFrom-Json

# Extract the data portion
$resumeData = $testData.data | ConvertTo-Json -Depth 10

# Create a test HTML file
$testHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>Resume Test</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Resume Data Test</h1>
        <p>This is a test to verify the resume data is properly formatted.</p>
        <h2>Resume Data:</h2>
        <pre>$resumeData</pre>
    </div>
</body>
</html>
"@

# Save the test HTML file
$testHtml | Out-File -FilePath "$currentDir\backend\ResumeAI.API\html\test-resume-data.html" -Encoding utf8

Write-Host "Test file created at: $currentDir\backend\ResumeAI.API\html\test-resume-data.html"
Write-Host "Please restart the backend API and try generating a resume again."