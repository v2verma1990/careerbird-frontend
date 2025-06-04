@echo off
echo Starting local HTTP server at http://localhost:8000
echo.
echo Once the server starts, open your browser and go to:
echo http://localhost:8000/public/resume-templates/simple-test.html
echo.
echo Press Ctrl+C to stop the server when you're done
echo.
python -m http.server 8000
pause