using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System;
using System.IO;
using System.Threading.Tasks;
using ResumeAI.API.Services;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/templates")]
    public class TemplatesController : ControllerBase
    {
        private readonly ResumeBuilderService _resumeBuilderService;
        private readonly string _htmlTemplatesPath;

        public TemplatesController(ResumeBuilderService resumeBuilderService)
        {
            _resumeBuilderService = resumeBuilderService;
            // Use the same path as in ResumeBuilderService
            _htmlTemplatesPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "public", "resume-templates", "html"));
        }

        [HttpGet("{templateId}.html")]
        [AllowAnonymous] // Allow anonymous access for template previews
        public async Task<IActionResult> GetTemplateHtml(string templateId)
        {
            try
            {
                // Log the request for debugging
                Console.WriteLine($"Template request received for: {templateId}");
                
                // Check if the template exists
                string templatePath = Path.Combine(_htmlTemplatesPath, $"{templateId}.html");
                
                if (!System.IO.File.Exists(templatePath))
                {
                    // Check if the template exists in the current directory as fallback
                    string currentDirPath = Path.Combine(Directory.GetCurrentDirectory(), "html", $"{templateId}.html");
                    
                    if (System.IO.File.Exists(currentDirPath))
                    {
                        templatePath = currentDirPath;
                    }
                    else
                    {
                        return NotFound($"Template '{templateId}' not found");
                    }
                }
                
                // Read the template file
                string templateContent = await System.IO.File.ReadAllTextAsync(templatePath);
                
                // Return the template content as HTML
                return Content(templateContent, "text/html");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error serving template: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Error serving template: {ex.Message}");
            }
        }
    }
}