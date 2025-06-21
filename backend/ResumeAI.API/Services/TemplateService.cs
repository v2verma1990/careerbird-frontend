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
                case "modern-executive":
                    return GenerateModernExecutiveCss(templateColor);
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

        private string GenerateModernExecutiveCss(string templateColor)
        {
            var lighterShade = GetLighterShade(templateColor);
            var darkerShade = GetDarkerShade(templateColor);
            
            return $@"
/* UNIFIED MODERN EXECUTIVE CSS - SINGLE SOURCE OF TRUTH */
/* This CSS is used across backend, preview, and PDF export */

* {{
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}}

body {{
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  color: #333;
  background: #fff;
  padding: 0;
  margin: 0;
}}

.container {{
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.5in;
  min-height: 11in;
  background: #fff;
}}

/* HEADER SECTION */
.header {{
  background: linear-gradient(135deg, {templateColor}, {darkerShade});
  color: white;
  padding: 2.5rem 2rem;
  text-align: center;
  margin-bottom: 2rem;
  border-radius: 8px;
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
}}

.header h1 {{
  font-size: 2.8rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
  color: white !important;
}}

.header .title {{
  font-size: 1.3rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  font-weight: 300;
  color: white !important;
}}

.contact-info {{
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  font-size: 0.95rem;
}}

.contact-info span {{
  opacity: 0.95;
  color: white !important;
}}

/* SECTIONS */
.section {{
  margin-bottom: 2.5rem;
}}

.section-title {{
  font-size: 1.5rem;
  color: {templateColor};
  border-bottom: 3px solid {templateColor};
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}}

.summary {{
  font-size: 1rem;
  line-height: 1.8;
  text-align: justify;
  color: #374151;
  padding: 0.5rem 0;
}}

/* EXPERIENCE AND EDUCATION */
.experience-item, .education-item {{
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}}

.experience-item:last-child, .education-item:last-child {{
  border-bottom: none;
}}

.experience-header {{
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}}

.job-title {{
  font-weight: bold;
  font-size: 1.2rem;
  color: {templateColor};
  margin-bottom: 0.3rem;
}}

.company {{
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
}}

.date-location {{
  color: #6b7280;
  font-style: italic;
  text-align: right;
  font-size: 0.9rem;
}}

.description {{
  margin-top: 1rem;
  line-height: 1.7;
  color: #374151;
}}

.description ul {{
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}}

.description li {{
  margin-bottom: 0.5rem;
}}

/* SKILLS */
.skills-list {{
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}}

.skill-tag {{
  background: {lighterShade};
  color: {templateColor};
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid {templateColor}88;
}}

/* CERTIFICATIONS */
.certifications ul {{
  list-style: none;
  padding: 0;
}}

.certifications li {{
  background: #f8fafc;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid {templateColor};
  border-radius: 4px;
}}

/* PROJECTS */
.projects-section {{
  margin-bottom: 22px;
}}

.project-name {{
  font-weight: 700;
  font-size: 1.05rem;
  color: {templateColor};
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

/* ACHIEVEMENTS */
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

/* REFERENCES */
.reference-item {{
  margin-bottom: 12px;
}}

.reference-name {{
  font-weight: 700;
  font-size: 1.05rem;
  color: {templateColor};
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

/* PDF EXPORT OPTIMIZATIONS */
@media print {{
  body {{
    background: white;
    padding: 0;
    margin: 0;
  }}
  
  .container {{
    max-width: none;
    padding: 0;
    margin: 0;
    box-shadow: none;
  }}
  
  .header {{
    border-radius: 0;
    background: linear-gradient(135deg, {templateColor}, {darkerShade}) !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  
  .header h1,
  .header .title,
  .header .contact-info span {{
    color: white !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  
  .section-title {{
    color: {templateColor} !important;
    border-bottom-color: {templateColor} !important;
  }}
  
  .job-title,
  .project-name,
  .reference-name {{
    color: {templateColor} !important;
  }}
  
  .skill-tag {{
    background: {lighterShade} !important;
    color: {templateColor} !important;
    border-color: {templateColor}88 !important;
  }}
  
  .certifications li {{
    border-left-color: {templateColor} !important;
  }}
  
  .achievement-item::before {{
    color: {templateColor} !important;
  }}
  
  /* Page break handling */
  .section {{
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  
  .experience-item,
  .education-item {{
    page-break-inside: avoid;
    break-inside: avoid;
  }}
}}

/* Responsive design for smaller screens */
@media (max-width: 768px) {{
  .container {{
    padding: 0.25in;
  }}
  
  .header {{
    padding: 1.5rem 1rem;
    border-radius: 4px;
  }}
  
  .header h1 {{
    font-size: 2rem;
  }}
  
  .header .title {{
    font-size: 1.1rem;
  }}
  
  .contact-info {{
    gap: 1rem;
    font-size: 0.9rem;
  }}
  
  .experience-header {{
    flex-direction: column;
    align-items: flex-start;
  }}
  
  .date-location {{
    text-align: left;
    margin-top: 0.5rem;
  }}
}}
";
        }

        private string GetLighterShade(string color)
        {
            // Remove # if present
            var hex = color.Replace("#", "");
            
            if (hex.Length != 6) return color + "33"; // Return original with opacity if invalid
            
            try
            {
                // Parse RGB values
                var r = Convert.ToInt32(hex.Substring(0, 2), 16);
                var g = Convert.ToInt32(hex.Substring(2, 2), 16);
                var b = Convert.ToInt32(hex.Substring(4, 2), 16);
                
                // Lighten by increasing each component towards 255
                var lighterR = Math.Min(255, r + (255 - r) * 0.8);
                var lighterG = Math.Min(255, g + (255 - g) * 0.8);
                var lighterB = Math.Min(255, b + (255 - b) * 0.8);
                
                // Convert back to hex
                return $"#{(int)lighterR:X2}{(int)lighterG:X2}{(int)lighterB:X2}";
            }
            catch
            {
                return color + "33"; // Return original with opacity if parsing fails
            }
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