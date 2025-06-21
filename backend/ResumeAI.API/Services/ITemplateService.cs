namespace ResumeAI.API.Services
{
    public interface ITemplateService
    {
        string GetTemplateCss(string templateId, string? color = null);
        string GetTemplateHtml(string templateId);
    }
}