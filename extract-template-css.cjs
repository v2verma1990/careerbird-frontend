const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'backend', 'ResumeAI.API', 'html');
const cssOutDir = path.join(__dirname, 'src', 'styles', 'templates');

if (!fs.existsSync(cssOutDir)) {
  fs.mkdirSync(cssOutDir, { recursive: true });
}

fs.readdirSync(templatesDir).forEach(file => {
  if (file.endsWith('.html')) {
    const filePath = path.join(templatesDir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    // Extract all <style>...</style> blocks
    const styleBlocks = [...html.matchAll(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi)];
    if (styleBlocks.length > 0) {
      const css = styleBlocks.map(match => match[1]).join('\n\n');
      const cssFileName = file.replace(/\.html$/, '.css');
      const cssFilePath = path.join(cssOutDir, cssFileName);
      fs.writeFileSync(cssFilePath, css, 'utf8');
      console.log(`Extracted CSS from ${file} to ${cssFileName}`);
    }
    // Remove <style>...</style> and <link rel="stylesheet" ...> and inline style attributes
    let cleaned = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
    cleaned = cleaned.replace(/ style="[^"]*"/gi, '');
    // Remove <script>...</script> blocks
    cleaned = cleaned.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log(`Cleaned HTML and removed <script> from ${file}`);
  }
});