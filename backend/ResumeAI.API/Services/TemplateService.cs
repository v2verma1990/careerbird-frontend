namespace ResumeAI.API.Services
{
    public class TemplateService : ITemplateService
    {
        private readonly IWebHostEnvironment _environment;

        public TemplateService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public string GetTemplateHtml(string templateId)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "html", $"{templateId}.html");
            
            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException($"Template file not found: {templateId}");
            }
            
            return File.ReadAllText(templatePath);
        }
    }
}