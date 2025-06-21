namespace ResumeAI.API.Services
{
    public class TemplateService : ITemplateService
    {
        private readonly IWebHostEnvironment _environment;

        public TemplateService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public string GetTemplateCss(string templateId, string? color = null)
        {
            // Default color if none provided
            var templateColor = color ?? "#315389";
            
            switch (templateId.ToLower())
            {
                case "navy-column-modern":
                    return GenerateNavyColumnModernCss(templateColor);
                default:
                    throw new ArgumentException($"Template '{templateId}' not found");
            }
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

        private string GenerateNavyColumnModernCss(string templateColor)
        {
            var borderColor = GetDarkerShade(templateColor);
            
            return $@"
/* UNIFIED NAVY COLUMN MODERN CSS - SINGLE SOURCE OF TRUTH */
/* This CSS is used across backend, preview, and PDF export */

* {{
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
}}

body {{
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #f5f6fa;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}}

.resume-container {{
  max-width: 7.3in;
  width: 100%;
  margin: 0.5in auto;
  background: #fff;
  border-radius: 18px;
  display: flex;
  box-shadow: 0 2px 28px rgba(30,40,90,.13), 0 0.5px 3px rgba(30,64,175,.09);
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
}}

/* SIDEBAR - SINGLE SOURCE OF TRUTH */
.sidebar,
div.sidebar,
.resume-container .sidebar,
.resume-container div.sidebar,
body .sidebar,
html .sidebar {{
  background: {templateColor} !important;
  background-color: {templateColor} !important;
  color: #fff !important;
  width: 250px !important;
  min-width: 250px !important;
  min-height: 100% !important;
  padding: 36px 24px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  box-sizing: border-box !important;
  position: relative !important;
  flex-shrink: 0 !important;
  border-right: none !important;
  overflow: visible !important;
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
}}

/* All sidebar text elements */
.sidebar *,
.sidebar h1, .sidebar h2, .sidebar h3, .sidebar h4, .sidebar h5, .sidebar h6,
.sidebar p, .sidebar div, .sidebar span, .sidebar li, .sidebar a,
.sidebar strong, .sidebar em,
.sidebar .sidebar-section-title,
.sidebar .sidebar-details,
.sidebar .sidebar-skills-list li {{
  color: #ffffff !important;
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
}}

.photo {{
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 20px;
  border: 3px solid #f1f3fa;
  background: #fff;
}}

.photo-placeholder {{
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-bottom: 20px;
  border: 3px solid #f1f3fa;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #315389;
}}

.sidebar-section {{
  margin-bottom: 36px;
  width: 100%;
}}

.sidebar-section-title {{
  font-size: 17px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 10px;
  color: #e6eaf5 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 4px;
}}

.sidebar-details {{
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  color: #fff !important;
}}

.sidebar-details a {{
  color: #d0e6fd !important;
  text-decoration: none;
  font-size: 14px;
  word-break: break-all;
}}

.sidebar-skills-list {{
  list-style: none;
  padding: 0;
  margin: 0;
}}

.sidebar-skills-list li {{
  font-size: 13.5px;
  font-weight: 400;
  color: #e6eaf5 !important;
  margin-bottom: 7px;
  border-left: 4px solid rgba(255, 255, 255, 0.4);
  padding-left: 7px;
}}

/* CONTENT AREA */
.content {{
  flex: 1;
  padding: 48px 44px 46px 44px;
  color: #272d3a;
  background: #fff;
  min-height: 1040px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: visible;
  word-wrap: break-word;
  overflow-wrap: break-word;
}}

.content h1 {{
  font-size: 2.04rem;
  font-weight: 700;
  color: #21355e;
  letter-spacing: 0.5px;
  margin: 0 0 2px 0;
  line-height: 1.1;
}}

.content h2 {{
  font-size: 1.29rem;
  font-weight: 700;
  margin: 32px 0 13px 0;
  color: {templateColor};
  border-bottom: 2px solid #f1f3fa;
  padding-bottom: 2px;
}}

.content .title {{
  font-size: 1.13rem;
  color: {templateColor};
  font-weight: 500;
  margin-bottom: 22px;
}}

.profile-section, .employment-section, .education-section {{
  margin-bottom: 22px;
}}

.section-label {{
  font-weight: 700;
  color: {templateColor};
  font-size: 1.08em;
  margin-bottom: 8px;
}}

.profile-summary {{
  font-size: 1.01rem;
  color: #232c47;
  margin-bottom: 7px;
  line-height: 1.6;
}}

.employment-history-role {{
  font-weight: bold;
  font-size: 1.07rem;
  color: #193461;
  margin-bottom: 2px;
}}

.employment-history-company {{
  font-weight: 400;
  color: #293e60;
}}

.employment-history-dates {{
  font-size: 0.94rem;
  color: #749ed9;
  margin-bottom: 2px;
  font-weight: 400;
}}

.employment-history-list {{
  margin: 0 0 6px 0;
  padding: 0 0 0 18px;
  font-size: 1.01rem;
  color: #242e45;
}}

.education-degree {{
  font-weight: 700;
  font-size: 1.05rem;
  color: #22396e;
}}

.education-institution {{
  font-size: 1.01rem;
  margin-bottom: 2px;
  color: #385886;
}}

.education-dates {{
  font-size: 0.98rem;
  color: #738dab;
  margin-bottom: 4px;
}}

.certifications-section {{
  margin-bottom: 22px;
}}

.certification-name {{
  font-weight: 700;
  font-size: 1.05rem;
  color: #22396e;
}}

.certification-issuer {{
  font-size: 1.01rem;
  margin-bottom: 2px;
  color: #385886;
}}

.certification-date {{
  font-size: 0.98rem;
  color: #738dab;
  margin-bottom: 4px;
}}

.projects-section {{
  margin-bottom: 22px;
}}

.project-name {{
  font-weight: 700;
  font-size: 1.05rem;
  color: #22396e;
  margin-bottom: 4px;
}}

.project-description {{
  font-size: 1.01rem;
  color: #242e45;
  margin-bottom: 4px;
  line-height: 1.5;
}}

.project-technologies {{
  font-size: 0.95rem;
  color: #738dab;
  margin-bottom: 8px;
  font-style: italic;
}}

.references-label {{
  color: #22396e;
  font-size: 1.03rem;
  font-weight: 500;
  margin-top: 15px;
}}

.other-section {{
  margin-bottom: 22px;
}}

.reference-item {{
  margin-bottom: 12px;
}}

.reference-name {{
  font-weight: 700;
  font-size: 1.05rem;
  color: #22396e;
  margin-bottom: 2px;
}}

.reference-title {{
  font-size: 0.98rem;
  color: #385886;
  margin-bottom: 2px;
}}

.reference-contact {{
  font-size: 0.95rem;
  color: #738dab;
  margin-bottom: 4px;
}}

.achievement-item {{
  margin-bottom: 8px;
  font-size: 1.01rem;
  color: #242e45;
  line-height: 1.5;
}}

.achievement-item::before {{
  content: ""•"";
  color: {templateColor};
  font-weight: bold;
  margin-right: 8px;
}}

/* PDF EXPORT OPTIMIZATIONS */
@media print {{
  body {{
    background: white;
    padding: 0;
    margin: 0;
  }}
  
  .resume-container {{
    box-shadow: none;
    border-radius: 0;
    max-width: none;
    width: 794px;
    margin: 0;
    overflow: visible;
    page-break-inside: avoid;
  }}
  
  .sidebar {{
    width: 250px !important;
    min-width: 250px !important;
    background: {templateColor} !important;
    background-color: {templateColor} !important;
    color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    overflow: visible !important;
    /* Remove any borders or pseudo-elements that might cause issues */
    border: none !important;
  }}
  
  .sidebar::after,
  .sidebar::before {{
    display: none !important;
  }}
  
  .content {{
    flex: 1;
    min-width: 0;
    page-break-inside: auto;
    break-inside: auto;
    overflow: visible;
  }}
  
  /* Ensure all sidebar elements maintain color in print */
  .sidebar *,
  .sidebar-section-title,
  .sidebar-details,
  .sidebar-skills-list li {{
    color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  
  /* Page break handling */
  .content > div,
  .content > section,
  .profile-section,
  .employment-section,
  .education-section {{
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  
  .employment-history-role,
  .education-entry {{
    page-break-inside: avoid;
    break-inside: avoid;
    margin-bottom: 15px;
  }}
}}

/* Responsive design for smaller screens */
@media (max-width: 768px) {{
  body {{
    padding: 0.25in;
  }}
  
  .resume-container {{
    flex-direction: column;
    border-radius: 8px;
  }}
  
  .sidebar {{
    width: 100% !important;
    min-height: auto !important;
    padding: 24px !important;
  }}
  
  .content {{
    padding: 24px;
    min-height: auto;
  }}
}}
";
        }

        private string GetDarkerShade(string color)
        {
            // Remove # if present
            var hex = color.Replace("#", "");
            
            if (hex.Length != 6) return color; // Return original if invalid
            
            try
            {
                // Parse RGB values
                var r = Convert.ToInt32(hex.Substring(0, 2), 16);
                var g = Convert.ToInt32(hex.Substring(2, 2), 16);
                var b = Convert.ToInt32(hex.Substring(4, 2), 16);
                
                // Darken by reducing each component by 20%
                var darkerR = Math.Max(0, (int)(r * 0.8));
                var darkerG = Math.Max(0, (int)(g * 0.8));
                var darkerB = Math.Max(0, (int)(b * 0.8));
                
                // Convert back to hex
                return $"#{darkerR:X2}{darkerG:X2}{darkerB:X2}";
            }
            catch
            {
                return color; // Return original if parsing fails
            }
        }
    }
}