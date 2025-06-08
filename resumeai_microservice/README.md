# ResumeAI Microservice

## System Dependencies for PDF/DOCX Export

This microservice uses WeasyPrint (for PDF) and mammoth (for DOCX) to generate downloadable resumes. Some system dependencies are required, especially for PDF export.

### For Linux (Docker/VM/Cloud):
Add these lines to your Dockerfile or install on your server:

```sh
apt-get update && apt-get install -y \
    build-essential \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libxml2 \
    libgobject-2.0-0 \
    libglib2.0-0 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
```

### For Windows:
- Download and install the [GTK3 runtime for Windows](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases).
- Add the GTK `bin` folder (e.g., `C:\Program Files\GTK3-Runtime Win64\bin`) to your system PATH.
- Restart your terminal and FastAPI server.

### For Azure, AWS, Heroku, etc.:
- Use a custom Dockerfile (recommended) and include the Linux dependencies above.
- Or, use your cloud provider's build/startup scripts to install the required packages.

### Python Packages
Install Python dependencies in your virtual environment:

```sh
pip install -r requirements.txt
```

---

**If you see errors about missing `libgobject-2.0-0` or similar, your system dependencies are not installed.**

For more details, see the [WeasyPrint installation guide](https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#installation).
