using Microsoft.AspNetCore.Mvc;
using ResumeAI.API.Services;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplateController : ControllerBase
    {
        private readonly ITemplateService _templateService;

        public TemplateController(ITemplateService templateService)
        {
            _templateService = templateService;
        }

        [HttpGet("{templateId}/html")]
        public IActionResult GetTemplateHtml(string templateId)
        {
            try
            {
                var html = _templateService.GetTemplateHtml(templateId);
                return Content(html, "text/html");
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}