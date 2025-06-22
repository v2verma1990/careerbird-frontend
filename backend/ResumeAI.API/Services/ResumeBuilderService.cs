using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using ResumeAI.API.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;
using Handlebars = HandlebarsDotNet.Handlebars;
using System.Net.Http.Headers;
using PdfSharpCore.Pdf;
using PdfSharpCore.Drawing;
using System.Drawing;
using System.Runtime.InteropServices;

namespace ResumeAI.API.Services
{
    public class ResumeBuilderService
    {
        private readonly HttpClient _httpClient;
        private readonly string _pythonApiBaseUrl;
        private readonly string _templatesPath;
        private readonly string _htmlTemplatesPath;
        private readonly ResumeService _resumeService;

        public ResumeBuilderService(IHttpClientFactory httpClientFactory, AppSettings appSettings, ResumeService resumeService)
        {
            _httpClient = httpClientFactory.CreateClient();
            _pythonApiBaseUrl = appSettings.PythonApiBaseUrl;
            _resumeService = resumeService;
            // Use absolute path to the resume templates
            _templatesPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "public", "resume-templates"));
            _htmlTemplatesPath = Path.Combine(_templatesPath, "html");
            
            Console.WriteLine($"Templates path: {_templatesPath}");
            Console.WriteLine($"HTML templates path: {_htmlTemplatesPath}");
            Console.WriteLine($"Current directory: {Directory.GetCurrentDirectory()}");
            
            // Ensure directories exist
            try {
                if (!Directory.Exists(_templatesPath)) {
                    Console.WriteLine($"Creating templates directory: {_templatesPath}");
                    Directory.CreateDirectory(_templatesPath);
                }
                
                if (!Directory.Exists(_htmlTemplatesPath)) {
                    Console.WriteLine($"Creating HTML templates directory: {_htmlTemplatesPath}");
                    Directory.CreateDirectory(_htmlTemplatesPath);
                }
                
                string thumbnailsPath = Path.Combine(_templatesPath, "thumbnails");
                if (!Directory.Exists(thumbnailsPath)) {
                    Console.WriteLine($"Creating thumbnails directory: {thumbnailsPath}");
                    Directory.CreateDirectory(thumbnailsPath);
                }
                
                // List all template files for debugging
                Console.WriteLine("Available template files:");
                if (Directory.Exists(_htmlTemplatesPath)) {
                    string[] templateFiles = Directory.GetFiles(_htmlTemplatesPath, "*.html");
                    foreach (string file in templateFiles) {
                        Console.WriteLine($"  - {Path.GetFileName(file)}");
                    }
                    Console.WriteLine($"Found {templateFiles.Length} template files");
                } else {
                    Console.WriteLine("HTML templates directory does not exist");
                }
            } catch (Exception ex) {
                Console.WriteLine($"Error setting up template directories: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
            
            // Register Handlebars helpers
            Handlebars.RegisterHelper("debug", (writer, context, parameters) => {
                writer.Write($"<!-- DEBUG: {JsonConvert.SerializeObject(context)} -->");
            });
            
            Handlebars.RegisterHelper("log", (context, parameters) => {
                Console.WriteLine($"Handlebars Log: {JsonConvert.SerializeObject(context)}");
                return "";
            });
        }

        public async Task<List<ResumeTemplateModel>> GetTemplatesAsync()
        {
            try
            {
                string templatesJsonPath = Path.Combine(_templatesPath, "templates.json");
                Console.WriteLine($"Looking for templates.json at: {templatesJsonPath}");
                Console.WriteLine($"Directory exists: {Directory.Exists(_templatesPath)}");
                
                // List all files in the templates directory
                if (Directory.Exists(_templatesPath))
                {
                    Console.WriteLine("Files in templates directory:");
                    foreach (var file in Directory.GetFiles(_templatesPath))
                    {
                        Console.WriteLine($"  - {file}");
                    }
                }
                
                // Check for templates.json in the current directory as a fallback
                if (!File.Exists(templatesJsonPath))
                {
                    string fallbackPath = Path.Combine(Directory.GetCurrentDirectory(), "templates.json");
                    Console.WriteLine($"Checking fallback path: {fallbackPath}, exists: {File.Exists(fallbackPath)}");
                    
                    if (File.Exists(fallbackPath))
                    {
                        templatesJsonPath = fallbackPath;
                        Console.WriteLine($"Using fallback templates.json at: {templatesJsonPath}");
                    }
                }
                
                if (!File.Exists(templatesJsonPath))
                {
                    Console.WriteLine($"Templates file not found at {templatesJsonPath}");
                    
                    // Create a hardcoded templates.json file if it doesn't exist
                    var hardcodedTemplates = new TemplatesData
                    {
                        Templates = new List<ResumeTemplateModel>
                        {
                            new ResumeTemplateModel
                            {
                                Id = "modern-clean",
                                Name = "Modern Clean",
                                Description = "A clean, modern design with a professional look",
                                Thumbnail = "/resume-templates/thumbnails/modern-clean.png",
                                Category = "professional"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "minimal",
                                Name = "Minimal",
                                Description = "A minimalist design focusing on content",
                                Thumbnail = "/resume-templates/thumbnails/minimal.png",
                                Category = "minimal"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "creative",
                                Name = "Creative",
                                Description = "A creative design for design and creative professionals",
                                Thumbnail = "/resume-templates/thumbnails/creative.png",
                                Category = "creative"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "professional",
                                Name = "Professional",
                                Description = "A traditional professional resume layout",
                                Thumbnail = "/resume-templates/thumbnails/professional.png",
                                Category = "professional"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "executive",
                                Name = "Executive",
                                Description = "An executive-level resume design",
                                Thumbnail = "/resume-templates/thumbnails/executive.png",
                                Category = "professional"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "tech",
                                Name = "Tech",
                                Description = "A modern design for tech professionals",
                                Thumbnail = "/resume-templates/thumbnails/tech.png",
                                Category = "professional"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "elegant",
                                Name = "Elegant",
                                Description = "An elegant design with a touch of sophistication",
                                Thumbnail = "/resume-templates/thumbnails/elegant.png",
                                Category = "professional"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "academic",
                                Name = "Academic",
                                Description = "A design suited for academic and research positions",
                                Thumbnail = "/resume-templates/thumbnails/academic.png",
                                Category = "specialized"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "entry-level",
                                Name = "Entry Level",
                                Description = "Perfect for recent graduates and entry-level positions",
                                Thumbnail = "/resume-templates/thumbnails/entry-level.png",
                                Category = "simple"
                            },
                            new ResumeTemplateModel
                            {
                                Id = "chronological",
                                Name = "Chronological",
                                Description = "A traditional chronological resume layout",
                                Thumbnail = "/resume-templates/thumbnails/chronological.png",
                                Category = "simple"
                            }
                        }
                    };
                    
                    // Return all templates, even if HTML files don't exist yet
                    // This ensures all templates are visible in the UI
                    Console.WriteLine($"Returning all {hardcodedTemplates.Templates.Count} hardcoded templates");
                    
                    // Log which HTML files are missing
                    foreach (var template in hardcodedTemplates.Templates)
                    {
                        string htmlPath = Path.Combine(_htmlTemplatesPath, $"{template.Id}.html");
                        bool exists = File.Exists(htmlPath);
                        Console.WriteLine($"Template {template.Id}: HTML file exists: {exists} at {htmlPath}");
                        
                        // If HTML file doesn't exist, we'll use a default template when needed
                        if (!exists)
                        {
                            Console.WriteLine($"Warning: HTML file for template {template.Id} not found at {htmlPath}");
                        }
                    }
                    
                    return hardcodedTemplates.Templates;
                }

                Console.WriteLine("Reading templates.json file");
                string templatesJson = await File.ReadAllTextAsync(templatesJsonPath);
                Console.WriteLine($"Templates JSON content: {templatesJson.Substring(0, Math.Min(100, templatesJson.Length))}...");
                
                var templatesData = JsonConvert.DeserializeObject<TemplatesData>(templatesJson);
                
                // Filter templates to only include those that have HTML files
                var templates = templatesData?.Templates ?? new List<ResumeTemplateModel>();
                
                Console.WriteLine($"Found {templates.Count} templates in templates.json");
                
                // Check if thumbnail images exist
                foreach (var template in templates)
                {
                    string thumbnailPath = Path.Combine(_templatesPath, "thumbnails", $"{template.Id}.png");
                    bool thumbnailExists = File.Exists(thumbnailPath);
                    Console.WriteLine($"Template {template.Id}: Thumbnail exists: {thumbnailExists} at {thumbnailPath}");
                    
                    // Check for JPG if PNG doesn't exist
                    if (!thumbnailExists)
                    {
                        string jpgPath = Path.Combine(_templatesPath, "thumbnails", $"{template.Id}.jpg");
                        thumbnailExists = File.Exists(jpgPath);
                        Console.WriteLine($"Template {template.Id}: JPG Thumbnail exists: {thumbnailExists} at {jpgPath}");
                    }
                }
                
                // Return all templates from the JSON file, even if HTML files don't exist yet
                // This ensures all templates are visible in the UI
                foreach (var template in templates)
                {
                    string htmlPath = Path.Combine(_htmlTemplatesPath, $"{template.Id}.html");
                    bool exists = File.Exists(htmlPath);
                    Console.WriteLine($"Template {template.Id}: HTML file exists: {exists} at {htmlPath}");
                    
                    // Check in current directory if not found in html directory
                    if (!exists)
                    {
                        string currentDirPath = Path.Combine(Directory.GetCurrentDirectory(), "html", $"{template.Id}.html");
                        exists = File.Exists(currentDirPath);
                        Console.WriteLine($"Template {template.Id}: HTML file exists in current directory: {exists} at {currentDirPath}");
                        
                        // If HTML file doesn't exist, we'll use a default template when needed
                        if (!exists)
                        {
                            Console.WriteLine($"Warning: HTML file for template {template.Id} not found");
                        }
                    }
                }
                
                var filteredTemplates = templates;
                
                Console.WriteLine($"Returning {filteredTemplates.Count} templates from JSON file");
                return filteredTemplates;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting templates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                // Return empty list instead of throwing exception
                return new List<ResumeTemplateModel>();
            }
        }

        // Normalize resume data to ensure consistent format for frontend
        private ResumeDataModel NormalizeResumeData(Dictionary<string, object> data)
        {
            if (data == null) return new ResumeDataModel();
            
            // Convert Dictionary to ResumeDataModel
            var resumeData = new ResumeDataModel();
            
            // Map basic properties
            if (data.TryGetValue("name", out var name)) resumeData.Name = name?.ToString() ?? string.Empty;
            if (data.TryGetValue("title", out var title)) resumeData.Title = title?.ToString() ?? string.Empty;
            if (data.TryGetValue("email", out var email)) resumeData.Email = email?.ToString() ?? string.Empty;
            if (data.TryGetValue("phone", out var phone)) resumeData.Phone = phone?.ToString() ?? string.Empty;
            if (data.TryGetValue("location", out var location)) resumeData.Location = location?.ToString() ?? string.Empty;
            if (data.TryGetValue("linkedin", out var linkedin)) resumeData.LinkedIn = linkedin?.ToString() ?? string.Empty;
            if (data.TryGetValue("website", out var website)) resumeData.Website = website?.ToString() ?? string.Empty;
            if (data.TryGetValue("summary", out var summary)) resumeData.Summary = summary?.ToString() ?? string.Empty;
            
            // Map skills (array of strings)
            if (data.TryGetValue("skills", out var skillsObj) && skillsObj is IEnumerable<object> skills)
            {
                resumeData.Skills = skills.Select(s => s?.ToString() ?? string.Empty).ToList();
            }
            
            // Map complex objects (education, experience, certifications, projects)
            // These would need to be converted from dictionaries to their respective types
            if (data.TryGetValue("education", out var educationObj) && educationObj is IEnumerable<object> educationItems)
            {
                resumeData.Education = new List<EducationItem>();
                foreach (var item in educationItems)
                {
                    if (item is IDictionary<string, object> eduDict)
                    {
                        var eduItem = new EducationItem();
                        if (eduDict.TryGetValue("institution", out var institution)) eduItem.Institution = institution?.ToString() ?? string.Empty;
                        if (eduDict.TryGetValue("degree", out var degree)) eduItem.Degree = degree?.ToString() ?? string.Empty;
                        if (eduDict.TryGetValue("location", out var eduLocation)) eduItem.Location = eduLocation?.ToString() ?? string.Empty;
                        if (eduDict.TryGetValue("startDate", out var eduStartDate)) eduItem.StartDate = eduStartDate?.ToString() ?? string.Empty;
                        if (eduDict.TryGetValue("endDate", out var eduEndDate)) eduItem.EndDate = eduEndDate?.ToString() ?? string.Empty;
                        if (eduDict.TryGetValue("gpa", out var gpa)) eduItem.GPA = gpa?.ToString() ?? string.Empty;
                        resumeData.Education.Add(eduItem);
                    }
                }
            }
            
            // Map experience items
            if (data.TryGetValue("experience", out var experienceObj) && experienceObj is IEnumerable<object> experienceItems)
            {
                resumeData.Experience = new List<ExperienceItem>();
                foreach (var item in experienceItems)
                {
                    if (item is IDictionary<string, object> expDict)
                    {
                        var expItem = new ExperienceItem();
                        if (expDict.TryGetValue("company", out var company)) expItem.Company = company?.ToString() ?? string.Empty;
                        if (expDict.TryGetValue("title", out var expTitle)) expItem.Title = expTitle?.ToString() ?? string.Empty;
                        if (expDict.TryGetValue("position", out var position) && string.IsNullOrEmpty(expItem.Title)) expItem.Title = position?.ToString() ?? string.Empty;
                        if (expDict.TryGetValue("location", out var expLocation)) expItem.Location = expLocation?.ToString() ?? string.Empty;
                        if (expDict.TryGetValue("startDate", out var expStartDate)) expItem.StartDate = expStartDate?.ToString() ?? string.Empty;
                        if (expDict.TryGetValue("endDate", out var expEndDate)) expItem.EndDate = expEndDate?.ToString() ?? string.Empty;
                        
                        // Handle description - could be string or array
                        if (expDict.TryGetValue("description", out var description))
                        {
                            if (description is string descStr && !string.IsNullOrEmpty(descStr))
                            {
                                expItem.Description = descStr;
                            }
                            else if (description is IEnumerable<object> descList)
                            {
                                // Join all description items into a single string
                                var descStrings = new List<string>();
                                foreach (var desc in descList)
                                {
                                    if (desc != null)
                                    {
                                        string descString = desc.ToString() ?? string.Empty;
                                        if (!string.IsNullOrEmpty(descString))
                                        {
                                            descStrings.Add(descString);
                                        }
                                    }
                                }
                                expItem.Description = string.Join(". ", descStrings);
                            }
                        }
                        
                        // Handle bullet points if they exist
                        if (expDict.TryGetValue("bulletPoints", out var bulletPointsObj) && bulletPointsObj is IEnumerable<object> bulletPoints)
                        {
                            foreach (var bp in bulletPoints)
                            {
                                if (bp != null)
                                {
                                    string bpString = bp.ToString() ?? string.Empty;
                                    if (!string.IsNullOrEmpty(bpString))
                                    {
                                        if (string.IsNullOrEmpty(expItem.Description))
                                            expItem.Description = bpString;
                                        else
                                            expItem.Description += ". " + bpString;
                                    }
                                }
                            }
                        }
                        
                        // Handle projects within this experience
                        if (expDict.TryGetValue("projects", out var expProjectsObj) && expProjectsObj is IEnumerable<object> expProjectItems)
                        {
                            expItem.Projects = new List<ProjectItem>();
                            foreach (var projItem in expProjectItems)
                            {
                                if (projItem is IDictionary<string, object> projDict)
                                {
                                    var project = new ProjectItem();
                                    if (projDict.TryGetValue("name", out var projName)) project.Name = projName?.ToString() ?? string.Empty;
                                    if (projDict.TryGetValue("description", out var projDesc)) project.Description = projDesc?.ToString() ?? string.Empty;
                                    if (projDict.TryGetValue("technologies", out var projTech)) project.Technologies = projTech?.ToString() ?? string.Empty;
                                    
                                    // Only add project if it has meaningful content
                                    if (!string.IsNullOrEmpty(project.Name) || !string.IsNullOrEmpty(project.Description))
                                    {
                                        expItem.Projects.Add(project);
                                    }
                                }
                            }
                        }
                        
                        resumeData.Experience.Add(expItem);
                    }
                }
            }
            
            // Map certifications
            if (data.TryGetValue("certifications", out var certificationsObj) && certificationsObj is IEnumerable<object> certificationItems)
            {
                resumeData.Certifications = new List<CertificationItem>();
                foreach (var item in certificationItems)
                {
                    if (item is IDictionary<string, object> certDict)
                    {
                        var certItem = new CertificationItem();
                        if (certDict.TryGetValue("name", out var certName)) certItem.Name = certName?.ToString() ?? string.Empty;
                        if (certDict.TryGetValue("issuer", out var issuer)) certItem.Issuer = issuer?.ToString() ?? string.Empty;
                        if (certDict.TryGetValue("date", out var date)) certItem.Date = date?.ToString() ?? string.Empty;
                        resumeData.Certifications.Add(certItem);
                    }
                }
            }
            
            // Map projects
            if (data.TryGetValue("projects", out var projectsObj) && projectsObj is IEnumerable<object> projectItems)
            {
                resumeData.Projects = new List<ProjectItem>();
                foreach (var item in projectItems)
                {
                    if (item is IDictionary<string, object> projDict)
                    {
                        var projItem = new ProjectItem();
                        if (projDict.TryGetValue("name", out var projName)) projItem.Name = projName?.ToString() ?? string.Empty;
                        if (projDict.TryGetValue("description", out var description)) projItem.Description = description?.ToString() ?? string.Empty;
                        if (projDict.TryGetValue("technologies", out var technologies)) projItem.Technologies = technologies?.ToString() ?? string.Empty;
                        // For backward compatibility
                        if (projDict.TryGetValue("url", out var url) && string.IsNullOrEmpty(projItem.Technologies)) projItem.Technologies = url?.ToString() ?? string.Empty;
                        resumeData.Projects.Add(projItem);
                    }
                }
            }
            
            return resumeData;
        }
        
        // Normalize resume data to ensure consistent format for frontend
        private ResumeDataModel NormalizeResumeData(ResumeDataModel data)
        {
            if (data == null) return new ResumeDataModel();
            
            // Create a new instance to avoid modifying the original
            var normalizedData = new ResumeDataModel
            {
                Name = data.Name,
                Title = data.Title,
                Email = data.Email,
                Phone = data.Phone,
                Location = data.Location,
                LinkedIn = data.LinkedIn,
                Website = data.Website,
                Summary = data.Summary,
                Skills = new List<string>(data.Skills ?? new List<string>()),
                Education = new List<EducationItem>(data.Education ?? new List<EducationItem>()),
                Certifications = new List<CertificationItem>(data.Certifications ?? new List<CertificationItem>()),
                Projects = new List<ProjectItem>(data.Projects ?? new List<ProjectItem>()),
                Experience = new List<ExperienceItem>()
            };
            
            // Normalize experience items
            if (data.Experience != null)
            {
                foreach (var exp in data.Experience)
                {
                    var normalizedExp = new ExperienceItem
                    {
                        Title = exp.Title,
                        Company = exp.Company,
                        Location = exp.Location,
                        StartDate = exp.StartDate,
                        EndDate = exp.EndDate,
                        Description = string.Empty,
                        Projects = new List<ProjectItem>(exp.Projects ?? new List<ProjectItem>())
                    };
                    
                    // Normalize description - ensure it's not empty and properly formatted
                    if (!string.IsNullOrWhiteSpace(exp.Description))
                    {
                        // Split the description by periods or line breaks to create bullet points
                        var descLines = exp.Description
                            .Split(new[] { '.', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                            .Select(line => line.Trim())
                            .Where(line => !string.IsNullOrWhiteSpace(line))
                            .ToList();
                        
                        // Format each line with a bullet point if needed
                        for (int i = 0; i < descLines.Count; i++)
                        {
                            string line = descLines[i];
                            if (!line.StartsWith("•") && !line.StartsWith("-") && !line.StartsWith("*"))
                            {
                                descLines[i] = "• " + line;
                            }
                        }
                        
                        // Join the lines with line breaks
                        normalizedExp.Description = string.Join("\n", descLines);
                    }
                    
                    normalizedData.Experience.Add(normalizedExp);
                }
            }
            
            return normalizedData;
        }

        public async Task<object> BuildResumeAsync(ResumeBuilderRequestModel request, string userId)
        {
            try
            {
                // Log the request details
                Console.WriteLine($"BuildResumeAsync called with templateId: {request.TemplateId}");
                Console.WriteLine($"Has resume file: {request.ResumeFile != null}");
                Console.WriteLine($"Has resume data: {!string.IsNullOrEmpty(request.ResumeData)}");
                Console.WriteLine($"✓ COLOR PARAMETER FROM REQUEST: '{request.Color ?? "not provided"}'");
                if (string.IsNullOrEmpty(request.Color))
                {
                    Console.WriteLine("✗ WARNING: Color parameter is null or empty - will use default color");
                }
                else
                {
                    Console.WriteLine($"✓ Color parameter is valid: '{request.Color}'");
                }
                
                // Get resume data either from file or from provided JSON
                ResumeDataModel resumeData;
                if (request.ResumeFile != null)
                {
                    // Extract data from resume file using Python microservice
                    Console.WriteLine($"Extracting data from resume file: {request.ResumeFile.FileName}");
                    resumeData = await ExtractResumeDataFromFileAsync(request.ResumeFile);
                }
                else if (!string.IsNullOrEmpty(request.ResumeData))
                {
                    // Use provided resume data
                    Console.WriteLine($"Resume data from request: {request.ResumeData.Substring(0, Math.Min(500, request.ResumeData.Length))}");
                    
                    try
                    {
                        // Parse the JSON data with specific settings
                        var settings = new JsonSerializerSettings
                        {
                            NullValueHandling = NullValueHandling.Ignore,
                            DefaultValueHandling = DefaultValueHandling.Populate,
                            ObjectCreationHandling = ObjectCreationHandling.Replace,
                            Error = (sender, args) => {
                                Console.WriteLine($"JSON Error: {args.ErrorContext.Error.Message}");
                                args.ErrorContext.Handled = true;
                            }
                        };
                        
                        resumeData = JsonConvert.DeserializeObject<ResumeDataModel>(request.ResumeData, settings) ?? 
                            new ResumeDataModel(); // Use empty model if deserialization fails
                    }
                    catch (Exception jsonEx)
                    {
                        Console.WriteLine($"Error deserializing resume data: {jsonEx.Message}");
                        Console.WriteLine($"Stack trace: {jsonEx.StackTrace}");
                        resumeData = new ResumeDataModel(); // Use empty model if deserialization fails
                    }
                    
                    // Log the parsed data
                    Console.WriteLine($"Parsed resume data: Name={resumeData.Name}, Email={resumeData.Email}, Skills count={resumeData.Skills?.Count ?? 0}");
                }
                else
                {
                    throw new ArgumentException("Either resume file or resume data must be provided");
                }

                // Get the template HTML
                Console.WriteLine($"Getting template HTML for templateId: {request.TemplateId}");
                string templateHtml;
                try {
                    templateHtml = await GetTemplateHtmlAsync(request.TemplateId);
                    Console.WriteLine($"Successfully retrieved template HTML, length: {templateHtml?.Length ?? 0} bytes");
                } catch (Exception ex) {
                    Console.WriteLine($"Error getting template HTML: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    throw;
                }
                
                // Log the raw resume data for debugging
                string rawDataJson = JsonConvert.SerializeObject(resumeData);
                Console.WriteLine($"Raw resume data: {rawDataJson}");
                Console.WriteLine($"Raw resume data type: {resumeData?.GetType().Name ?? "null"}");
                
                // Log this to a file for debugging
                File.WriteAllText(Path.Combine(Directory.GetCurrentDirectory(), "debug_resume_data.json"), rawDataJson);
                
                // Simplified check for empty data
                bool hasEmptyData = false;
                
                // Check if the data is in PascalCase format (from frontend)
                if (resumeData != null)
                {
                    // Check for Name, Email, Phone
                    bool hasBasicInfo = 
                        !string.IsNullOrWhiteSpace(resumeData.Name) || 
                        !string.IsNullOrWhiteSpace(resumeData.Email) || 
                        !string.IsNullOrWhiteSpace(resumeData.Phone);
                    
                    // Check for Experience
                    bool hasExperience = resumeData.Experience != null && resumeData.Experience.Count > 0 && 
                        resumeData.Experience.Any(e => 
                            !string.IsNullOrWhiteSpace(e.Title) || 
                            !string.IsNullOrWhiteSpace(e.Company) || 
                            !string.IsNullOrWhiteSpace(e.Description));
                    
                    // Check for Education
                    bool hasEducation = resumeData.Education != null && resumeData.Education.Count > 0 && 
                        resumeData.Education.Any(e => 
                            !string.IsNullOrWhiteSpace(e.Degree) || 
                            !string.IsNullOrWhiteSpace(e.Institution));
                    
                    // Check for Skills
                    bool hasSkills = resumeData.Skills != null && resumeData.Skills.Count > 0;
                    
                    // If any of these are true, we have data
                    hasEmptyData = !(hasBasicInfo || hasExperience || hasEducation || hasSkills);
                    
                    Console.WriteLine($"Data check results: hasBasicInfo={hasBasicInfo}, hasExperience={hasExperience}, hasEducation={hasEducation}, hasSkills={hasSkills}");
                }
                else
                {
                    hasEmptyData = true;
                }
                
                Console.WriteLine($"Data is empty: {hasEmptyData}");
                
                // If data is empty, return an empty HTML
                if (hasEmptyData)
                {
                    Console.WriteLine("Resume data is empty, returning empty HTML");
                    
                    // Instead of returning an empty object, return a properly structured empty object
                    // that matches the expected format in the frontend
                    return new
                    {
                        html = "<div>No resume data available. Please fill in your resume details.</div>",
                        data = new ResumeDataModel() // Return an empty but properly structured object
                    };
                }
                
                // Generate the resume HTML using Handlebars
                // Add null check for templateHtml
                if (templateHtml == null)
                {
                    Console.WriteLine("Warning: Template HTML is null. Using empty template.");
                    templateHtml = "<html><body><p>No template available. Please select a different template.</p></body></html>";
                }
                
                string resumeHtml = GenerateResumeHtml(templateHtml, resumeData ?? new object(), request.Color);
                
                // Log the first part of the generated HTML
                Console.WriteLine($"Generated HTML (first 500 chars): {resumeHtml.Substring(0, Math.Min(500, resumeHtml.Length))}");
                
                // Normalize experience descriptions before returning to frontend
                var normalizedData = resumeData != null ? NormalizeResumeData(resumeData) : new ResumeDataModel();
                
                return new
                {
                    html = resumeHtml,
                    data = normalizedData
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error building resume: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Error building resume: {ex.Message}", ex);
            }
        }

        public async Task<byte[]> BuildResumePdfAsync(ResumeBuilderRequestModel request, string userId)
        {
            try
            {
                // Log the request details
                Console.WriteLine($"BuildResumePdfAsync called with templateId: {request.TemplateId}");
                Console.WriteLine($"Has resume file: {request.ResumeFile != null}");
                Console.WriteLine($"Has resume data: {!string.IsNullOrEmpty(request.ResumeData)}");
                
                // Get resume data either from file or from provided JSON
                ResumeDataModel resumeData;
                if (request.ResumeFile != null)
                {
                    // Extract data from resume file using Python microservice
                    Console.WriteLine($"Extracting data from resume file: {request.ResumeFile.FileName}");
                    resumeData = await ExtractResumeDataFromFileAsync(request.ResumeFile);
                }
                else if (!string.IsNullOrEmpty(request.ResumeData))
                {
                    // Use provided resume data
                    Console.WriteLine($"Resume data from request: {request.ResumeData.Substring(0, Math.Min(500, request.ResumeData.Length))}");
                    
                    try
                    {
                        // Parse the JSON data with specific settings
                        var settings = new JsonSerializerSettings
                        {
                            NullValueHandling = NullValueHandling.Ignore,
                            DefaultValueHandling = DefaultValueHandling.Populate,
                            ObjectCreationHandling = ObjectCreationHandling.Replace,
                            Error = (sender, args) => {
                                Console.WriteLine($"JSON Error: {args.ErrorContext.Error.Message}");
                                args.ErrorContext.Handled = true;
                            }
                        };
                        
                        resumeData = JsonConvert.DeserializeObject<ResumeDataModel>(request.ResumeData, settings) ?? 
                            new ResumeDataModel(); // Use empty model if deserialization fails
                    }
                    catch (Exception jsonEx)
                    {
                        Console.WriteLine($"Error deserializing resume data: {jsonEx.Message}");
                        Console.WriteLine($"Stack trace: {jsonEx.StackTrace}");
                        resumeData = new ResumeDataModel(); // Use empty model if deserialization fails
                    }
                    
                    // Log the parsed data
                    Console.WriteLine($"Parsed resume data: Name={resumeData.Name}, Email={resumeData.Email}, Skills count={resumeData.Skills?.Count ?? 0}");
                }
                else
                {
                    throw new ArgumentException("Either resume file or resume data must be provided");
                }

                // Get the template HTML
                Console.WriteLine($"Getting template HTML for templateId: {request.TemplateId}");
                string templateHtml;
                try {
                    templateHtml = await GetTemplateHtmlAsync(request.TemplateId);
                    Console.WriteLine($"Successfully retrieved template HTML, length: {templateHtml?.Length ?? 0} bytes");
                } catch (Exception ex) {
                    Console.WriteLine($"Error getting template HTML: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    throw;
                }
                
                // Check if we have any data
                bool hasEmptyData = false;
                
                if (resumeData != null)
                {
                    // Check for basic information
                    bool hasBasicInfo = !string.IsNullOrWhiteSpace(resumeData.Name) || 
                                       !string.IsNullOrWhiteSpace(resumeData.Email) || 
                                       !string.IsNullOrWhiteSpace(resumeData.Phone);
                    
                    // Check for Experience
                    bool hasExperience = resumeData.Experience != null && resumeData.Experience.Count > 0 && 
                        resumeData.Experience.Any(e => 
                            !string.IsNullOrWhiteSpace(e.Title) || 
                            !string.IsNullOrWhiteSpace(e.Company) || 
                            !string.IsNullOrWhiteSpace(e.Description));
                    
                    // Check for Education
                    bool hasEducation = resumeData.Education != null && resumeData.Education.Count > 0 && 
                        resumeData.Education.Any(e => 
                            !string.IsNullOrWhiteSpace(e.Degree) || 
                            !string.IsNullOrWhiteSpace(e.Institution));
                    
                    // Check for Skills
                    bool hasSkills = resumeData.Skills != null && resumeData.Skills.Count > 0;
                    
                    // If any of these are true, we have data
                    hasEmptyData = !(hasBasicInfo || hasExperience || hasEducation || hasSkills);
                }
                else
                {
                    hasEmptyData = true;
                }
                
                // If data is empty, throw an exception
                if (hasEmptyData)
                {
                    throw new ArgumentException("No resume data available. Please fill in your resume details.");
                }
                
                // Generate the resume HTML using Handlebars
                if (templateHtml == null)
                {
                    Console.WriteLine("Warning: Template HTML is null. Using empty template.");
                    templateHtml = "<html><body><p>No template available. Please select a different template.</p></body></html>";
                }
                
                string resumeHtml = GenerateResumeHtml(templateHtml, resumeData ?? new object(), request.Color);
                
                // Generate a PDF from the HTML
                // Since we don't have a PDF library integrated directly, we'll use a workaround
                // We'll add proper PDF metadata and structure to the HTML
                
                // Add PDF-specific CSS for better printing
                string pdfCss = @"
                @page {
                    size: letter;
                    margin: 0.5in;
                }
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.5;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .resume-container {
                    max-width: 100%;
                    margin: 0 auto;
                }
                ";
                
                // Check if there's already a style tag
                if (resumeHtml.Contains("<style>"))
                {
                    // Insert our PDF CSS into the existing style tag
                    resumeHtml = resumeHtml.Replace("<style>", "<style>" + pdfCss);
                }
                else
                {
                    // Add a new style tag with our PDF CSS
                    resumeHtml = resumeHtml.Replace("<head>", "<head><style>" + pdfCss + "</style>");
                }
                
                // Add PDF metadata
                string pdfMetadata = $@"
                <meta name=""pdfkit-page-size"" content=""Letter""/>
                <meta name=""pdfkit-orientation"" content=""Portrait""/>
                <meta name=""pdfkit-title"" content=""{resumeData?.Name ?? "Resume"} - Resume""/>
                <meta name=""pdfkit-author"" content=""{resumeData?.Name ?? "User"}""/>
                <meta name=""pdfkit-subject"" content=""Resume""/>
                <meta name=""pdfkit-keywords"" content=""resume, cv, job application""/>
                ";
                
                // Insert metadata into head
                if (resumeHtml.Contains("<head>"))
                {
                    resumeHtml = resumeHtml.Replace("<head>", "<head>" + pdfMetadata);
                }
                
                // Create a more comprehensive PDF using PdfSharpCore
                using (var memoryStream = new MemoryStream())
                {
                    try
                    {
                        // Create a PDF document
                        var document = new PdfSharpCore.Pdf.PdfDocument();
                        document.Info.Title = resumeData?.Name != null ? $"{resumeData.Name} - Resume" : "Resume";
                        document.Info.Author = resumeData?.Name ?? "User";
                        document.Info.Subject = "Resume";
                        document.Info.Keywords = "resume, cv, job application";
                        
                        // Create a PDF page
                        var page = document.AddPage();
                        page.Size = PdfSharpCore.PageSize.Letter;
                        page.Orientation = PdfSharpCore.PageOrientation.Portrait;
                        
                        // Create a graphics object for drawing
                        var gfx = PdfSharpCore.Drawing.XGraphics.FromPdfPage(page);
                        
                        // Create fonts
                        var titleFont = new PdfSharpCore.Drawing.XFont("Arial", 24, PdfSharpCore.Drawing.XFontStyle.Bold);
                        var subtitleFont = new PdfSharpCore.Drawing.XFont("Arial", 16, PdfSharpCore.Drawing.XFontStyle.Italic);
                        var headerFont = new PdfSharpCore.Drawing.XFont("Arial", 14, PdfSharpCore.Drawing.XFontStyle.Bold);
                        var normalFont = new PdfSharpCore.Drawing.XFont("Arial", 12);
                        var smallFont = new PdfSharpCore.Drawing.XFont("Arial", 10);
                        
                        // Set margins
                        double marginLeft = 50;
                        double marginTop = 50;
                        double contentWidth = page.Width - (marginLeft * 2);
                        
                        // Current Y position for drawing
                        double currentY = marginTop;
                        
                        // Draw name
                        string name = resumeData?.Name ?? "Resume";
                        gfx.DrawString(name, titleFont, PdfSharpCore.Drawing.XBrushes.Black, 
                            new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 30), 
                            PdfSharpCore.Drawing.XStringFormats.TopLeft);
                        currentY += 40;
                        
                        // Draw title/position
                        if (!string.IsNullOrEmpty(resumeData?.Title))
                        {
                            gfx.DrawString(resumeData.Title, subtitleFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                PdfSharpCore.Drawing.XStringFormats.TopLeft);
                            currentY += 30;
                        }
                        
                        // Draw contact info
                        var contactInfo = new StringBuilder();
                        if (!string.IsNullOrEmpty(resumeData?.Email))
                            contactInfo.Append($"Email: {resumeData.Email}  ");
                        if (!string.IsNullOrEmpty(resumeData?.Phone))
                            contactInfo.Append($"Phone: {resumeData.Phone}  ");
                        if (!string.IsNullOrEmpty(resumeData?.Location))
                            contactInfo.Append($"Location: {resumeData.Location}");
                            
                        if (contactInfo.Length > 0)
                        {
                            gfx.DrawString(contactInfo.ToString(), normalFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                PdfSharpCore.Drawing.XStringFormats.TopLeft);
                            currentY += 30;
                        }
                        
                        // Draw summary if available
                        if (!string.IsNullOrEmpty(resumeData?.Summary))
                        {
                            // Draw section header
                            gfx.DrawString("SUMMARY", headerFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                PdfSharpCore.Drawing.XStringFormats.TopLeft);
                            currentY += 25;
                            
                            // Draw summary text (with word wrapping)
                            var summaryText = resumeData.Summary;
                            var summaryLines = WrapText(summaryText, normalFont, contentWidth);
                            foreach (var line in summaryLines)
                            {
                                gfx.DrawString(line, normalFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                    new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                    PdfSharpCore.Drawing.XStringFormats.TopLeft);
                                currentY += 20;
                            }
                            currentY += 10;
                        }
                        
                        // Draw experience section if available
                        if (resumeData?.Experience != null && resumeData.Experience.Count > 0)
                        {
                            // Draw section header
                            gfx.DrawString("EXPERIENCE", headerFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                PdfSharpCore.Drawing.XStringFormats.TopLeft);
                            currentY += 25;
                            
                            // Draw each experience item
                            foreach (var exp in resumeData.Experience)
                            {
                                // Check if we need a new page
                                if (currentY > page.Height - 100)
                                {
                                    page = document.AddPage();
                                    gfx = PdfSharpCore.Drawing.XGraphics.FromPdfPage(page);
                                    currentY = marginTop;
                                }
                                
                                // Draw job title and company
                                string jobInfo = $"{exp.Title ?? ""} at {exp.Company ?? ""}";
                                gfx.DrawString(jobInfo, normalFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                    new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                    PdfSharpCore.Drawing.XStringFormats.TopLeft);
                                currentY += 20;
                                
                                // Draw dates and location
                                string dateLocation = $"{exp.StartDate ?? ""} - {exp.EndDate ?? ""}, {exp.Location ?? ""}";
                                gfx.DrawString(dateLocation, smallFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                    new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                    PdfSharpCore.Drawing.XStringFormats.TopLeft);
                                currentY += 20;
                                
                                // Draw description if available
                                if (!string.IsNullOrEmpty(exp.Description))
                                {
                                    var descLines = WrapText(exp.Description, normalFont, contentWidth);
                                    foreach (var line in descLines)
                                    {
                                        // Check if we need a new page
                                        if (currentY > page.Height - 100)
                                        {
                                            page = document.AddPage();
                                            gfx = PdfSharpCore.Drawing.XGraphics.FromPdfPage(page);
                                            currentY = marginTop;
                                        }
                                        
                                        gfx.DrawString(line, normalFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                            new PdfSharpCore.Drawing.XRect(marginLeft, currentY, contentWidth, 20), 
                                            PdfSharpCore.Drawing.XStringFormats.TopLeft);
                                        currentY += 20;
                                    }
                                }
                                
                                currentY += 10;
                            }
                        }
                        
                        // Save the document to the memory stream
                        document.Save(memoryStream);
                        
                        // Return the PDF bytes
                        return memoryStream.ToArray();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error generating PDF with PdfSharpCore: {ex.Message}");
                        Console.WriteLine($"Stack trace: {ex.StackTrace}");
                        
                        // Use a simpler PDF generation approach as fallback
                        Console.WriteLine("Using fallback PDF generation method");
                        
                        try 
                        {
                            // Create a new PDF document with a simpler approach
                            using (var fallbackMemoryStream = new MemoryStream())
                            {
                                var fallbackDocument = new PdfDocument();
                                var fallbackPage = fallbackDocument.AddPage();
                                var fallbackGfx = PdfSharpCore.Drawing.XGraphics.FromPdfPage(fallbackPage);
                                
                                // Create fonts
                                var titleFont = new PdfSharpCore.Drawing.XFont("Arial", 18, PdfSharpCore.Drawing.XFontStyle.Bold);
                                var normalFont = new PdfSharpCore.Drawing.XFont("Arial", 12, PdfSharpCore.Drawing.XFontStyle.Regular);
                                
                                // Add a title
                                fallbackGfx.DrawString("Resume", titleFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                    new PdfSharpCore.Drawing.XRect(50, 50, fallbackPage.Width - 100, 30), 
                                    PdfSharpCore.Drawing.XStringFormats.TopLeft);
                                
                                // Add a note about using the HTML version
                                fallbackGfx.DrawString("PDF generation encountered an issue. Please use the HTML version for better results.", 
                                    normalFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                    new PdfSharpCore.Drawing.XRect(50, 100, fallbackPage.Width - 100, 30), 
                                    PdfSharpCore.Drawing.XStringFormats.TopLeft);
                                
                                // Add name if available
                                if (resumeData != null && !string.IsNullOrEmpty(resumeData.Name))
                                {
                                    fallbackGfx.DrawString($"Name: {resumeData.Name}", 
                                        normalFont, PdfSharpCore.Drawing.XBrushes.Black, 
                                        new PdfSharpCore.Drawing.XRect(50, 150, fallbackPage.Width - 100, 30), 
                                        PdfSharpCore.Drawing.XStringFormats.TopLeft);
                                }
                                
                                fallbackDocument.Save(fallbackMemoryStream);
                                return fallbackMemoryStream.ToArray();
                            }
                        }
                        catch (Exception fallbackEx)
                        {
                            Console.WriteLine($"Fallback PDF generation also failed: {fallbackEx.Message}");
                            throw new Exception("Unable to generate PDF document", fallbackEx);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error building resume PDF: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Error building resume PDF: {ex.Message}", ex);
            }
        }
        
        public async Task<ResumeDataModel> ExtractResumeDataFromFileAsync(IFormFile resumeFile)
        {
            try
            {
                // Create multipart form content
                using var formContent = new MultipartFormDataContent();
                using var fileStream = resumeFile.OpenReadStream();
                using var fileContent = new StreamContent(fileStream);
                
                // Set content type for the file
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetContentType(resumeFile.FileName));
                
                formContent.Add(fileContent, "resume", resumeFile.FileName);
                formContent.Add(new StringContent("free"), "plan");

                Console.WriteLine($"Sending request to Python API: {_pythonApiBaseUrl}/candidate/extract_resume_data");
                
                // Send request to Python microservice
                var response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/candidate/extract_resume_data", formContent);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error response from Python API: {errorContent}");
                    throw new HttpRequestException($"Error from Python API: {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Raw response from Python API: {responseContent.Substring(0, Math.Min(500, responseContent.Length))}...");
                
                // Create a new ResumeDataModel
                var resumeData = new ResumeDataModel();
                
                try
                {
                    // Use System.Text.Json for deserialization
                    var options = new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        AllowTrailingCommas = true,
                        ReadCommentHandling = System.Text.Json.JsonCommentHandling.Skip
                    };
                    
                    // Try to deserialize directly to our model
                    resumeData = System.Text.Json.JsonSerializer.Deserialize<ResumeDataModel>(responseContent, options);
                    Console.WriteLine("Successfully deserialized to ResumeDataModel using System.Text.Json");
                    
                    // Check if resumeData is null before accessing its properties
                    if (resumeData != null)
                    {
                        // Log the result
                        Console.WriteLine($"Extracted resume data: Name={resumeData.Name}, Email={resumeData.Email}, Skills count={resumeData.Skills.Count}");
                    }
                    else
                    {
                        Console.WriteLine("Warning: Deserialized resumeData is null");
                        resumeData = new ResumeDataModel(); // Create a new instance with default values
                    }
                    
                    return resumeData;
                }
                catch (System.Text.Json.JsonException jsonEx)
                {
                    Console.WriteLine($"Error deserializing with System.Text.Json: {jsonEx.Message}");
                    
                    // Try with Newtonsoft.Json as a fallback
                    try
                    {
                        var settings = new JsonSerializerSettings
                        {
                            NullValueHandling = NullValueHandling.Ignore,
                            DefaultValueHandling = DefaultValueHandling.Populate,
                            ObjectCreationHandling = ObjectCreationHandling.Replace,
                            Error = (sender, args) => {
                                Console.WriteLine($"JSON Error: {args.ErrorContext.Error.Message}");
                                args.ErrorContext.Handled = true;
                            }
                        };
                        
                        resumeData = JsonConvert.DeserializeObject<ResumeDataModel>(responseContent, settings);
                        Console.WriteLine("Successfully deserialized to ResumeDataModel using Newtonsoft.Json");
                        
                        // Check if resumeData is null before accessing its properties
                        if (resumeData != null)
                        {
                            // Log the result
                            Console.WriteLine($"Extracted resume data: Name={resumeData.Name}, Email={resumeData.Email}, Skills count={resumeData.Skills.Count}");
                        }
                        else
                        {
                            Console.WriteLine("Warning: Deserialized resumeData is null");
                            resumeData = new ResumeDataModel(); // Create a new instance with default values
                        }
                        
                        return resumeData;
                    }
                    catch (Newtonsoft.Json.JsonException newtonsoftEx)
                    {
                        Console.WriteLine($"Error deserializing with Newtonsoft.Json: {newtonsoftEx.Message}");
                        
                        // Manual parsing as a last resort
                        try
                        {
                            // Parse the JSON manually using JObject
                            var jObject = JObject.Parse(responseContent);
                            
                            // Ensure resumeData is not null before accessing its properties
                            if (resumeData == null)
                            {
                                resumeData = new ResumeDataModel();
                                Console.WriteLine("Created new ResumeDataModel instance for manual parsing");
                            }
                            
                            // Map the properties from the JObject to our model
                            resumeData.Name = jObject["name"]?.ToString() ?? "";
                            resumeData.Title = jObject["title"]?.ToString() ?? "";
                            resumeData.Email = jObject["email"]?.ToString() ?? "";
                            resumeData.Phone = jObject["phone"]?.ToString() ?? "";
                            resumeData.Location = jObject["location"]?.ToString() ?? "";
                            resumeData.LinkedIn = jObject["linkedin"]?.ToString() ?? "";
                            resumeData.Website = jObject["website"]?.ToString() ?? "";
                            resumeData.Summary = jObject["summary"]?.ToString() ?? "";
                            
                            // Handle skills array
                            var skillsToken = jObject["skills"];
                            if (skillsToken != null && skillsToken.Type == JTokenType.Array)
                            {
                                foreach (var skill in skillsToken)
                                {
                                    if (skill != null && skill.Type == JTokenType.String && !string.IsNullOrEmpty(skill.ToString()))
                                    {
                                        resumeData.Skills.Add(skill.ToString());
                                    }
                                }
                            }
                            
                            // Handle experience array
                            var experienceToken = jObject["experience"];
                            if (experienceToken != null && experienceToken.Type == JTokenType.Array)
                            {
                                foreach (var exp in experienceToken)
                                {
                                    if (exp == null) continue;
                                    
                                    var expItem = new ExperienceItem
                                    {
                                        Title = exp["title"]?.ToString() ?? "",
                                        Company = exp["company"]?.ToString() ?? "",
                                        Location = exp["location"]?.ToString() ?? "",
                                        StartDate = exp["startDate"]?.ToString() ?? "",
                                        EndDate = exp["endDate"]?.ToString() ?? ""
                                    };
                                    
                                    // Handle description array or string
                                    var descriptionToken = exp["description"];
                                    
                                    // First, check if there's a string description directly in the JSON
                                    // This handles the case where the Python API returns a string description
                                    if (exp is JObject expObj && expObj.TryGetValue("description", out JToken? directDesc) && 
                                        directDesc != null && 
                                        directDesc.Type == JTokenType.String)
                                    {
                                        string stringDesc = directDesc.ToString();
                                        if (!string.IsNullOrWhiteSpace(stringDesc))
                                        {
                                            expItem.Description = stringDesc;
                                        }
                                    }
                                    // If description is an array, process it
                                    else if (descriptionToken != null && descriptionToken.Type == JTokenType.Array)
                                    {
                                        var jArray = descriptionToken as JArray;
                                        
                                        // If it's an empty array but we have a non-empty string representation
                                        // (This can happen with some JSON serialization quirks)
                                        if (jArray == null)
                                        {
                                            // Skip processing if jArray is null
                                            // This prevents the null reference exception
                                        }
                                        else if (jArray.Count == 0)
                                        {
                                            // Try to get the raw description string from the parent object
                                            string rawDesc = exp.ToString();
                                            if (rawDesc.Contains("\"description\":") && !rawDesc.Contains("\"description\":[]"))
                                            {
                                                // Extract the description using regex
                                                var match = Regex.Match(rawDesc, "\"description\":\"([^\"]+)\"");
                                                if (match.Success)
                                                {
                                                    string value = match.Groups[1].Value ?? string.Empty;
                                                    expItem.Description = value;
                                                }
                                            }
                                        }
                                        else
                                        {
                                            // Process array items
                                            foreach (var desc in jArray)
                                            {
                                                if (desc != null)
                                                {
                                                    // Collect all descriptions and join them later
                                                    if (string.IsNullOrEmpty(expItem.Description))
                                                        expItem.Description = desc.ToString();
                                                    else
                                                        expItem.Description += ". " + desc.ToString();
                                                }
                                            }
                                        }
                                    }
                                    
                                    // If we still don't have a description but have a raw string in the original JSON
                                    // This is a fallback for unusual JSON formats
                                    if (string.IsNullOrEmpty(expItem.Description))
                                    {
                                        // Try to extract from the original Python API response
                                        string originalDesc = exp["description"]?.ToString() ?? "";
                                        if (!string.IsNullOrWhiteSpace(originalDesc) && originalDesc != "[]")
                                        {
                                            expItem.Description = originalDesc;
                                        }
                                    }
                                    
                                    resumeData.Experience.Add(expItem);
                                }
                            }
                            
                            // Handle education array
                            var educationToken = jObject["education"];
                            if (educationToken != null && educationToken.Type == JTokenType.Array)
                            {
                                foreach (var edu in educationToken)
                                {
                                    if (edu == null) continue;
                                    
                                    resumeData.Education.Add(new EducationItem
                                    {
                                        Degree = edu["degree"]?.ToString() ?? "",
                                        Institution = edu["institution"]?.ToString() ?? "",
                                        Location = edu["location"]?.ToString() ?? "",
                                        StartDate = edu["startDate"]?.ToString() ?? "",
                                        EndDate = edu["endDate"]?.ToString() ?? "",
                                        GPA = edu["gpa"]?.ToString() ?? ""
                                    });
                                }
                            }
                            
                            // Handle certifications array
                            var certificationsToken = jObject["certifications"];
                            if (certificationsToken != null && certificationsToken.Type == JTokenType.Array)
                            {
                                foreach (var cert in certificationsToken)
                                {
                                    if (cert == null) continue;
                                    
                                    resumeData.Certifications.Add(new CertificationItem
                                    {
                                        Name = cert["name"]?.ToString() ?? "",
                                        Issuer = cert["issuer"]?.ToString() ?? "",
                                        Date = cert["date"]?.ToString() ?? ""
                                    });
                                }
                            }
                            
                            // Handle projects array
                            var projectsToken = jObject["projects"];
                            if (projectsToken != null && projectsToken.Type == JTokenType.Array)
                            {
                                foreach (var proj in projectsToken)
                                {
                                    if (proj == null) continue;
                                    
                                    resumeData.Projects.Add(new ProjectItem
                                    {
                                        Name = proj["name"]?.ToString() ?? "",
                                        Description = proj["description"]?.ToString() ?? "",
                                        Technologies = proj["technologies"]?.ToString() ?? ""
                                    });
                                }
                            }
                            
                            Console.WriteLine("Successfully parsed resume data manually");
                            
                            // Check if resumeData is null before accessing its properties
                            if (resumeData != null)
                            {
                                // Log the result
                                Console.WriteLine($"Extracted resume data: Name={resumeData.Name}, Email={resumeData.Email}, Skills count={resumeData.Skills.Count}");
                            }
                            else
                            {
                                Console.WriteLine("Warning: Manually parsed resumeData is null");
                                resumeData = new ResumeDataModel(); // Create a new instance with default values
                            }
                            
                            return resumeData;
                        }
                        catch (Exception manualEx)
                        {
                            Console.WriteLine($"Error parsing JSON manually: {manualEx.Message}");
                            // Continue to return the default model
                        }
                    }
                }
                
                // Log the result
                Console.WriteLine($"Returning default resume data model");
                
                // Ensure we don't return null
                if (resumeData == null)
                {
                    Console.WriteLine("Creating new ResumeDataModel instance as resumeData was null");
                    resumeData = new ResumeDataModel();
                }
                
                return resumeData;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting resume data: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // Return an empty model instead of throwing an exception
                return new ResumeDataModel();
            }
        }
        
        private string GetContentType(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
                return "application/octet-stream";
                
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc" => "application/msword",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }
        
        private string GetStringValue(JObject obj, string propertyName)
        {
            // First check if the property exists to avoid null reference exceptions
            if (obj == null || !obj.ContainsKey(propertyName) || obj[propertyName] == null)
                return string.Empty;
            
            // Get the token once to avoid multiple lookups
            JToken? token = obj[propertyName];
            
            // Additional null check after retrieving the token
            if (token == null)
                return string.Empty;
                
            if (token.Type == JTokenType.String)
                return token.ToString();
                
            if (token.Type == JTokenType.Array)
            {
                var array = token as JArray;
                if (array != null && array.Count > 0 && array[0].Type == JTokenType.String)
                    return array[0].ToString();
            }
            
            return string.Empty;
        }

        private async Task<string> GetTemplateHtmlAsync(string templateId)
        {
            try
            {
                // Log the template ID and paths for debugging
                Console.WriteLine($"GetTemplateHtmlAsync called with templateId: {templateId}");
                Console.WriteLine($"HTML templates path: {_htmlTemplatesPath}");
                Console.WriteLine($"Current directory: {Directory.GetCurrentDirectory()}");
                
                // Check if the templates directory exists
                if (!Directory.Exists(_htmlTemplatesPath))
                {
                    Console.WriteLine($"WARNING: HTML templates directory does not exist: {_htmlTemplatesPath}");
                    Directory.CreateDirectory(_htmlTemplatesPath);
                    Console.WriteLine($"Created HTML templates directory: {_htmlTemplatesPath}");
                }
                
                // List all available templates for debugging
                Console.WriteLine("Available templates:");
                try
                {
                    string[] templateFiles = Directory.GetFiles(_htmlTemplatesPath, "*.html");
                    foreach (string file in templateFiles)
                    {
                        Console.WriteLine($"  - {Path.GetFileName(file)}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error listing template files: {ex.Message}");
                }
                
                // Check if the template exists in the html directory
                string templatePath = Path.Combine(_htmlTemplatesPath, $"{templateId}.html");
                Console.WriteLine($"Looking for template at: {templatePath}");
                
                if (File.Exists(templatePath))
                {
                    Console.WriteLine($"Found template at: {templatePath}");
                    string content = await File.ReadAllTextAsync(templatePath);
                    Console.WriteLine($"Template content length: {content.Length} bytes");
                    return content;
                }
                
                // Check if the template exists in the current directory
                string currentDirPath = Path.Combine(Directory.GetCurrentDirectory(), "html", $"{templateId}.html");
                Console.WriteLine($"Checking current directory: {currentDirPath}");
                
                if (File.Exists(currentDirPath))
                {
                    Console.WriteLine($"Found template in current directory: {currentDirPath}");
                    string content = await File.ReadAllTextAsync(currentDirPath);
                    Console.WriteLine($"Template content length: {content.Length} bytes");
                    return content;
                }
                
                // If the requested template doesn't exist, use a default template
                Console.WriteLine($"Template not found: {templateId}, using default template");
                
                // Try to use modern-clean as the default template
                string defaultTemplatePath = Path.Combine(_htmlTemplatesPath, "modern-clean.html");
                if (File.Exists(defaultTemplatePath))
                {
                    Console.WriteLine($"Using default template: modern-clean");
                    string content = await File.ReadAllTextAsync(defaultTemplatePath);
                    Console.WriteLine($"Default template content length: {content.Length} bytes");
                    return content;
                }
                
                // If modern-clean doesn't exist, try to use any available template
                string[] availableTemplates = Directory.GetFiles(_htmlTemplatesPath, "*.html");
                if (availableTemplates.Length > 0)
                {
                    string firstTemplate = availableTemplates[0];
                    Console.WriteLine($"Using first available template: {Path.GetFileName(firstTemplate)}");
                    string content = await File.ReadAllTextAsync(firstTemplate);
                    Console.WriteLine($"First available template content length: {content.Length} bytes");
                    return content;
                }
                
                // Try to use our fixed template
                string fixedTemplatePath = Path.Combine(Directory.GetCurrentDirectory(), "html", "fixed-template.html");
                if (File.Exists(fixedTemplatePath))
                {
                    Console.WriteLine($"Using fixed template: {fixedTemplatePath}");
                    string content = await File.ReadAllTextAsync(fixedTemplatePath);
                    Console.WriteLine($"Fixed template content length: {content.Length} bytes");
                    return content;
                }
                
                // If no templates are found, use a built-in default template
                Console.WriteLine("No templates found in any location, using built-in default template");
                
                // Create a basic default template
                string defaultTemplate = @"<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Resume</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.5;
        }
        .resume-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .contact-info {
            font-size: 14px;
            margin-bottom: 15px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin: 20px 0 10px;
        }
        .experience-item, .education-item {
            margin-bottom: 15px;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .item-title {
            font-weight: bold;
        }
        .item-date {
            color: #666;
        }
        .item-subtitle {
            font-style: italic;
            margin-bottom: 5px;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .skill-item {
            background-color: #f0f0f0;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class='resume-container'>
        <div class='header'>
            <div class='name'>{{name}}</div>
            <div class='contact-info'>
                {{#if email}}{{email}} | {{/if}}
                {{#if phone}}{{phone}} | {{/if}}
                {{#if location}}{{location}}{{/if}}
                {{#if linkedin}}<br>{{linkedin}}{{/if}}
                {{#if website}}{{#if linkedin}} | {{/if}}{{website}}{{/if}}
            </div>
        </div>

        {{#if summary}}
        <div class='section'>
            <div class='section-title'>Summary</div>
            <div>{{summary}}</div>
        </div>
        {{/if}}

        {{#if experience.length}}
        <div class='section'>
            <div class='section-title'>Experience</div>
            {{#each experience}}
            <div class='experience-item'>
                <div class='item-header'>
                    <div class='item-title'>{{title}}</div>
                    <div class='item-date'>{{startDate}} - {{endDate}}</div>
                </div>
                <div class='item-subtitle'>{{company}}{{#if location}} | {{location}}{{/if}}</div>
                <div>{{description}}</div>
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if education.length}}
        <div class='section'>
            <div class='section-title'>Education</div>
            {{#each education}}
            <div class='education-item'>
                <div class='item-header'>
                    <div class='item-title'>{{degree}}</div>
                    <div class='item-date'>{{startDate}} - {{endDate}}</div>
                </div>
                <div class='item-subtitle'>{{institution}}{{#if location}} | {{location}}{{/if}}</div>
                {{#if description}}<div>{{description}}</div>{{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if skills.length}}
        <div class='section'>
            <div class='section-title'>Skills</div>
            <div class='skills-list'>
                {{#each skills}}
                <div class='skill-item'>{{this}}</div>
                {{/each}}
            </div>
        </div>
        {{/if}}

        {{#if certifications.length}}
        <div class='section'>
            <div class='section-title'>Certifications</div>
            {{#each certifications}}
            <div class='certification-item'>
                <div class='item-title'>{{name}}</div>
                <div class='item-subtitle'>{{issuer}}{{#if date}} | {{date}}{{/if}}</div>
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if projects.length}}
        <div class='section'>
            <div class='section-title'>Projects</div>
            {{#each projects}}
            <div class='project-item'>
                <div class='item-title'>{{name}}</div>
                <div>{{description}}</div>
                {{#if technologies}}<div><strong>Technologies:</strong> {{technologies}}</div>{{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}
    </div>
</body>
</html>";

                // Create the template file if it doesn't exist
                string builtInTemplatePath = Path.Combine(_htmlTemplatesPath, "default-template.html");
                try
                {
                    // Create the directory if it doesn't exist
                    Directory.CreateDirectory(_htmlTemplatesPath);
                    
                    // Write the default template to a file
                    await File.WriteAllTextAsync(builtInTemplatePath, defaultTemplate);
                    Console.WriteLine($"Created default template at: {builtInTemplatePath}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error creating default template file: {ex.Message}");
                }
                
                return defaultTemplate;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTemplateHtmlAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Error getting template HTML: {ex.Message}", ex);
            }
        }

        private string GenerateResumeHtml(string? templateHtml, object? data, string? color = null)
        {
            try
            {
                // Ensure data is not null
                data ??= new object();
                
                // Ensure templateHtml is not null
                if (string.IsNullOrEmpty(templateHtml))
                {
                    Console.WriteLine("Warning: Empty template HTML provided to GenerateResumeHtml");
                    templateHtml = "<html><body><p>No template available. Please select a different template.</p></body></html>";
                }
                
                Console.WriteLine("=== GENERATE RESUME HTML DEBUG ===");
                Console.WriteLine("Template HTML first 100 chars: " + templateHtml.Substring(0, Math.Min(100, templateHtml.Length)));
                Console.WriteLine("Data type: " + data.GetType().Name);
                Console.WriteLine($"Color parameter received: '{color ?? "null"}'");
                
                // Check if template contains {{color}} placeholders
                if (templateHtml.Contains("{{color}}"))
                {
                    Console.WriteLine("✓ Template contains {{color}} placeholders - this is CORRECT");
                    int colorCount = templateHtml.Split("{{color}}").Length - 1;
                    Console.WriteLine($"✓ Found {colorCount} {{color}} placeholders in template");
                }
                else
                {
                    Console.WriteLine("✗ Template does NOT contain {{color}} placeholders - this might be an issue");
                }
                
                // Convert data to dictionary if it's a JObject
                object templateData = data;
                
                // If data is a ResumeDataModel, convert it to a dictionary
                if (data is ResumeDataModel resumeDataModel)
                {
                    Console.WriteLine("Converting ResumeDataModel to Dictionary");
                    
                    // Create a dictionary to store the processed data
                    var processedDict = new Dictionary<string, object>();
                    
                    // Add basic information
                    processedDict["name"] = resumeDataModel.Name ?? "";
                    processedDict["title"] = resumeDataModel.Title ?? "";
                    processedDict["email"] = resumeDataModel.Email ?? "";
                    processedDict["phone"] = resumeDataModel.Phone ?? "";
                    processedDict["location"] = resumeDataModel.Location ?? "";
                    processedDict["linkedin"] = resumeDataModel.LinkedIn ?? "";
                    processedDict["website"] = resumeDataModel.Website ?? "";
                    processedDict["summary"] = resumeDataModel.Summary ?? "";
                    processedDict["photo"] = resumeDataModel.Photo ?? "";
                    
                    // Add experience
                    if (resumeDataModel.Experience != null && resumeDataModel.Experience.Count > 0)
                    {
                        processedDict["experience"] = resumeDataModel.Experience
                            .Where(e => e != null)
                            .Select(e => new Dictionary<string, object>
                            {
                                ["title"] = e.Title ?? "",
                                ["company"] = e.Company ?? "",
                                ["location"] = e.Location ?? "",
                                ["startDate"] = e.StartDate ?? "",
                                ["endDate"] = e.EndDate ?? "",
                                ["description"] = e.Description ?? ""
                            })
                            .ToList();
                    }
                    else
                    {
                        processedDict["experience"] = new List<object>();
                    }
                    
                    // Add education
                    if (resumeDataModel.Education != null && resumeDataModel.Education.Count > 0)
                    {
                        processedDict["education"] = resumeDataModel.Education
                            .Where(e => e != null)
                            .Select(e => new Dictionary<string, object>
                            {
                                ["degree"] = e.Degree ?? "",
                                ["institution"] = e.Institution ?? "",
                                ["location"] = e.Location ?? "",
                                ["startDate"] = e.StartDate ?? "",
                                ["endDate"] = e.EndDate ?? "",
                                ["gpa"] = e.GPA ?? ""
                            })
                            .ToList();
                    }
                    else
                    {
                        processedDict["education"] = new List<object>();
                    }
                    
                    // Add skills
                    processedDict["skills"] = resumeDataModel.Skills?.Where(s => !string.IsNullOrWhiteSpace(s)).ToList() ?? new List<string>();
                    
                    // Add color parameter (both cases for template compatibility)
                    string finalColor = color ?? "#315389"; // Default navy color
                    processedDict["color"] = finalColor;
                    processedDict["Color"] = finalColor;
                    Console.WriteLine($"Added color to processedDict: color='{finalColor}', Color='{finalColor}'");
                    
                    // Add certifications
                    if (resumeDataModel.Certifications != null && resumeDataModel.Certifications.Count > 0)
                    {
                        processedDict["certifications"] = resumeDataModel.Certifications
                            .Where(c => c != null)
                            .Select(c => new Dictionary<string, object>
                            {
                                ["name"] = c.Name ?? "",
                                ["issuer"] = c.Issuer ?? "",
                                ["date"] = c.Date ?? ""
                            })
                            .ToList();
                    }
                    else
                    {
                        processedDict["certifications"] = new List<object>();
                    }
                    
                    // Add projects
                    if (resumeDataModel.Projects != null && resumeDataModel.Projects.Count > 0)
                    {
                        processedDict["projects"] = resumeDataModel.Projects
                            .Where(p => p != null)
                            .Select(p => new Dictionary<string, object>
                            {
                                ["name"] = p.Name ?? "",
                                ["description"] = p.Description ?? "",
                                ["technologies"] = p.Technologies ?? ""
                            })
                            .ToList();
                    }
                    else
                    {
                        processedDict["projects"] = new List<object>();
                    }
                    
                    // Add references
                    if (resumeDataModel.References != null && resumeDataModel.References.Count > 0)
                    {
                        processedDict["references"] = resumeDataModel.References
                            .Where(r => r != null)
                            .Select(r => new Dictionary<string, object>
                            {
                                ["name"] = r.Name ?? "",
                                ["title"] = r.Title ?? "",
                                ["contact"] = r.Contact ?? ""
                            })
                            .ToList();
                    }
                    else
                    {
                        processedDict["references"] = new List<object>();
                    }
                    
                    // Add achievements
                    processedDict["achievements"] = resumeDataModel.Achievements?.Where(a => !string.IsNullOrWhiteSpace(a)).ToList() ?? new List<string>();
                    
                    // Add PascalCase versions for templates that use PascalCase
                    processedDict["Name"] = processedDict["name"];
                    processedDict["Title"] = processedDict["title"];
                    processedDict["Email"] = processedDict["email"];
                    processedDict["Phone"] = processedDict["phone"];
                    processedDict["Location"] = processedDict["location"];
                    processedDict["LinkedIn"] = processedDict["linkedin"];
                    processedDict["Website"] = processedDict["website"];
                    processedDict["Summary"] = processedDict["summary"];
                    processedDict["Photo"] = processedDict["photo"];
                    processedDict["Experience"] = processedDict["experience"];
                    processedDict["Education"] = processedDict["education"];
                    processedDict["Skills"] = processedDict["skills"];
                    processedDict["Certifications"] = processedDict["certifications"];
                    processedDict["Projects"] = processedDict["projects"];
                    processedDict["References"] = processedDict["references"];
                    processedDict["Achievements"] = processedDict["achievements"];
                    
                    templateData = processedDict;
                }
                else if (data is JObject jObject)
                {
                    Console.WriteLine("Converting JObject to Dictionary");
                    // Create a new dictionary to store the processed data
                    var processedDict = new Dictionary<string, object>();
                    
                    // Process each property in the JObject
                    foreach (var property in jObject.Properties())
                    {
                        string key = property.Name;
                        JToken? value = property.Value;
                        
                        // Handle arrays specifically to ensure they're properly converted
                        if (value is JArray jArray)
                        {
                            Console.WriteLine($"Processing array: {key} with {jArray.Count} items");
                            
                            // Convert JArray to List<object> or List<string> based on content
                            if (key.ToLower() == "skills" && jArray.Count > 0)
                            {
                                // For skills, convert to List<string>
                                var skillsList = new List<string>();
                                foreach (var item in jArray)
                                {
                                    if (item.Type == JTokenType.String)
                                    {
                                        skillsList.Add(item.ToString());
                                    }
                                    else
                                    {
                                        // If it's not a string, convert to string
                                        skillsList.Add(item.ToString());
                                    }
                                }
                                processedDict[key] = skillsList;
                            }
                            else
                            {
                                // For other arrays (experience, education, etc.), convert to List<object>
                                var itemsList = new List<object>();
                                foreach (var item in jArray)
                                {
                                    if (item is JObject itemObj)
                                    {
                                        // Convert JObject to Dictionary
                                        var itemDict = itemObj.ToObject<Dictionary<string, object>>();
                                        if (itemDict != null)
                                        {
                                            itemsList.Add(itemDict);
                                        }
                                        else
                                        {
                                            // Add an empty dictionary if conversion failed
                                            itemsList.Add(new Dictionary<string, object>());
                                        }
                                    }
                                    else
                                    {
                                        // Add primitive values directly, with null check
                                        var objValue = item.ToObject<object>();
                                        itemsList.Add(objValue ?? new object());
                                    }
                                }
                                processedDict[key] = itemsList;
                            }
                        }
                        else
                        {
                            // For non-array values, convert normally
                            processedDict[key] = value.ToObject<object>() ?? string.Empty;
                        }
                    }
                    
                    // Add color parameter for JObject processing (both cases for template compatibility)
                    string finalColor = color ?? "#315389"; // Default navy color
                    processedDict["color"] = finalColor;
                    processedDict["Color"] = finalColor;
                    Console.WriteLine($"Added color to JObject processedDict: color='{finalColor}', Color='{finalColor}'");
                    
                    // Add PascalCase versions for templates that use PascalCase
                    if (processedDict.ContainsKey("name")) processedDict["Name"] = processedDict["name"];
                    if (processedDict.ContainsKey("title")) processedDict["Title"] = processedDict["title"];
                    if (processedDict.ContainsKey("email")) processedDict["Email"] = processedDict["email"];
                    if (processedDict.ContainsKey("phone")) processedDict["Phone"] = processedDict["phone"];
                    if (processedDict.ContainsKey("location")) processedDict["Location"] = processedDict["location"];
                    if (processedDict.ContainsKey("linkedin")) processedDict["LinkedIn"] = processedDict["linkedin"];
                    if (processedDict.ContainsKey("website")) processedDict["Website"] = processedDict["website"];
                    if (processedDict.ContainsKey("summary")) processedDict["Summary"] = processedDict["summary"];
                    if (processedDict.ContainsKey("experience")) processedDict["Experience"] = processedDict["experience"];
                    if (processedDict.ContainsKey("education")) processedDict["Education"] = processedDict["education"];
                    if (processedDict.ContainsKey("skills")) processedDict["Skills"] = processedDict["skills"];
                    if (processedDict.ContainsKey("certifications")) processedDict["Certifications"] = processedDict["certifications"];
                    if (processedDict.ContainsKey("projects")) processedDict["Projects"] = processedDict["projects"];
                    
                    templateData = processedDict;
                }
                
                // Ensure all required fields are present
                if (templateData is Dictionary<string, object> dict)
                {
                    Console.WriteLine("Ensuring all required fields are present");
                    
                    // Ensure color is always present (both cases for template compatibility)
                    string finalColor = color ?? "#315389"; // Default navy color
                    if (!dict.ContainsKey("color"))
                    {
                        dict["color"] = finalColor;
                    }
                    if (!dict.ContainsKey("Color"))
                    {
                        dict["Color"] = finalColor;
                    }
                    Console.WriteLine($"✓ ENSURED COLOR IN TEMPLATE DATA: color='{dict["color"]}', Color='{dict["Color"]}'");
                    Console.WriteLine($"✓ Final color value that will be used in template: '{finalColor}'");
                    
                    // Ensure PascalCase versions are present for templates that use PascalCase
                    if (dict.ContainsKey("name") && !dict.ContainsKey("Name")) dict["Name"] = dict["name"];
                    if (dict.ContainsKey("title") && !dict.ContainsKey("Title")) dict["Title"] = dict["title"];
                    if (dict.ContainsKey("email") && !dict.ContainsKey("Email")) dict["Email"] = dict["email"];
                    if (dict.ContainsKey("phone") && !dict.ContainsKey("Phone")) dict["Phone"] = dict["phone"];
                    if (dict.ContainsKey("location") && !dict.ContainsKey("Location")) dict["Location"] = dict["location"];
                    if (dict.ContainsKey("linkedin") && !dict.ContainsKey("LinkedIn")) dict["LinkedIn"] = dict["linkedin"];
                    if (dict.ContainsKey("website") && !dict.ContainsKey("Website")) dict["Website"] = dict["website"];
                    if (dict.ContainsKey("summary") && !dict.ContainsKey("Summary")) dict["Summary"] = dict["summary"];
                    if (dict.ContainsKey("experience") && !dict.ContainsKey("Experience")) dict["Experience"] = dict["experience"];
                    if (dict.ContainsKey("education") && !dict.ContainsKey("Education")) dict["Education"] = dict["education"];
                    if (dict.ContainsKey("skills") && !dict.ContainsKey("Skills")) dict["Skills"] = dict["skills"];
                    if (dict.ContainsKey("certifications") && !dict.ContainsKey("Certifications")) dict["Certifications"] = dict["certifications"];
                    if (dict.ContainsKey("projects") && !dict.ContainsKey("Projects")) dict["Projects"] = dict["projects"];
                    
                    // Check if name is empty or null and set it to empty string
                    if (!dict.ContainsKey("name") || dict["name"] == null || IsEmptyOrEmptyArray(dict["name"]))
                    {
                        dict["name"] = "";
                    }
                    
                    // Check if title is empty or null and set it to empty string
                    if (!dict.ContainsKey("title") || dict["title"] == null || IsEmptyOrEmptyArray(dict["title"]))
                    {
                        dict["title"] = "";
                    }
                    
                    // Check if email is empty or null and set it to empty string
                    if (!dict.ContainsKey("email") || dict["email"] == null || IsEmptyOrEmptyArray(dict["email"]))
                    {
                        dict["email"] = "";
                    }
                    
                    // Check if phone is empty or null and set it to empty string
                    if (!dict.ContainsKey("phone") || dict["phone"] == null || IsEmptyOrEmptyArray(dict["phone"]))
                    {
                        dict["phone"] = "";
                    }
                    
                    // Check if location is empty or null and set it to empty string
                    if (!dict.ContainsKey("location") || dict["location"] == null || IsEmptyOrEmptyArray(dict["location"]))
                    {
                        dict["location"] = "";
                    }
                    
                    // Check if summary is empty or null and set it to empty string
                    if (!dict.ContainsKey("summary") || dict["summary"] == null || IsEmptyOrEmptyArray(dict["summary"]))
                    {
                        dict["summary"] = "";
                    }
                    
                    // Ensure experience is an array
                    if (!dict.ContainsKey("experience") || dict["experience"] == null)
                    {
                        Console.WriteLine("Adding empty experience array");
                        dict["experience"] = new List<object>();
                    }
                    else if (dict["experience"] is JArray expArray)
                    {
                        // Convert JArray to List<object>
                        var expList = new List<object>();
                        foreach (var item in expArray)
                        {
                            if (item is JObject jObj)
                            {
                                var expDictObj = jObj.ToObject<Dictionary<string, object>>();
                                if (expDictObj != null)
                                    expList.Add(expDictObj);
                            }
                            else
                            {
                                Console.WriteLine($"Experience item is of unexpected type: {item?.GetType().Name ?? "null"}");
                            }
                        }
                        dict["experience"] = expList;
                        Console.WriteLine($"Converted experience to List<Dictionary<string, object>>, count: {expList.Count}");
                    }
                    
                    // Ensure education is an array
                    if (!dict.ContainsKey("education") || dict["education"] == null)
                    {
                        Console.WriteLine("Adding empty education array");
                        dict["education"] = new List<object>();
                    }
                    else if (dict["education"] is JArray eduArray)
                    {
                        // Convert JArray to List<object>
                        var eduList = new List<object>();
                        foreach (var item in eduArray)
                        {
                            if (item is JObject jObj)
                            {
                                var eduDictObj = jObj.ToObject<Dictionary<string, object>>();
                                if (eduDictObj != null)
                                    eduList.Add(eduDictObj);
                            }
                        }
                        dict["education"] = eduList;
                        Console.WriteLine($"Converted education to List<Dictionary<string, object>>, count: {eduList.Count}");
                    }
                    
                    // Ensure skills is an array
                    if (!dict.ContainsKey("skills") || dict["skills"] == null)
                    {
                        Console.WriteLine("Adding empty skills array");
                        dict["skills"] = new List<string>();
                    }
                    else if (dict["skills"] is JArray skillsArray)
                    {
                        // Convert JArray to List<string>
                        var skillsList = new List<string>();
                        foreach (var item in skillsArray)
                        {
                            skillsList.Add(item.ToString());
                        }
                        dict["skills"] = skillsList;
                    }
                    
                    // Ensure certifications is an array
                    if (!dict.ContainsKey("certifications") || dict["certifications"] == null)
                    {
                        Console.WriteLine("Adding empty certifications array");
                        dict["certifications"] = new List<object>();
                    }
                    else if (dict["certifications"] is JArray certArray)
                    {
                        // Convert JArray to List<object>
                        var certList = new List<object>();
                        foreach (var item in certArray)
                        {
                            if (item is JObject jObj)
                            {
                                var certDictObj = jObj.ToObject<Dictionary<string, object>>();
                                if (certDictObj != null)
                                    certList.Add(certDictObj);
                            }
                        }
                        dict["certifications"] = certList;
                    }
                    
                    // Ensure projects is an array
                    if (!dict.ContainsKey("projects") || dict["projects"] == null)
                    {
                        Console.WriteLine("Adding empty projects array");
                        dict["projects"] = new List<object>();
                    }
                    else if (dict["projects"] is JArray projArray)
                    {
                        // Convert JArray to List<object>
                        var projList = new List<object>();
                        foreach (var item in projArray)
                        {
                            if (item is JObject jObj)
                            {
                                var projDictObj = jObj.ToObject<Dictionary<string, object>>();
                                if (projDictObj != null)
                                    projList.Add(projDictObj);
                            }
                        }
                        dict["projects"] = projList;
                    }
                }
                
                // Log the template data for debugging
                Console.WriteLine($"Template data: {JsonConvert.SerializeObject(templateData).Substring(0, Math.Min(500, JsonConvert.SerializeObject(templateData).Length))}");
                
                try {
                    // Check if the template uses single braces instead of double braces for Handlebars
                    if (templateHtml.Contains("<h1>{name}</h1>") || 
                        templateHtml.Contains("<div class=\"title\">{title}</div>") ||
                        templateHtml.Contains("<span>{email}</span>"))
                    {
                        Console.WriteLine("Converting single-brace template to Handlebars format");
                        
                        // Convert single braces to double braces for Handlebars
                        templateHtml = templateHtml.Replace("{name}", "{{name}}");
                        templateHtml = templateHtml.Replace("{title}", "{{title}}");
                        templateHtml = templateHtml.Replace("{email}", "{{email}}");
                        templateHtml = templateHtml.Replace("{phone}", "{{phone}}");
                        templateHtml = templateHtml.Replace("{location}", "{{location}}");
                        templateHtml = templateHtml.Replace("{summary}", "{{summary}}");
                        
                        // Also handle arrays and nested objects
                        templateHtml = templateHtml.Replace("{experience.", "{{experience.");
                        templateHtml = templateHtml.Replace("{education.", "{{education.");
                        templateHtml = templateHtml.Replace("{skills.", "{{skills.");
                        templateHtml = templateHtml.Replace("{certifications.", "{{certifications.");
                        templateHtml = templateHtml.Replace("{projects.", "{{projects.");
                        
                        Console.WriteLine("Template converted to Handlebars format");
                    }
                    
                    // Add Handlebars block helpers for collections if they don't exist
                    // Only add blocks for simple templates that don't have proper structure
                    bool isStructuredTemplate = templateHtml.Contains("{{#each Experience}}") || 
                                              templateHtml.Contains("{{#each Skills}}") ||
                                              templateHtml.Contains("sidebar") ||
                                              templateHtml.Contains("column");
                    
                    if (!isStructuredTemplate)
                    {
                        if (!templateHtml.Contains("{{#each experience}}") && templateData is Dictionary<string, object> expDataDict && 
                            expDataDict.ContainsKey("experience") && expDataDict["experience"] is System.Collections.ICollection expColl && expColl.Count > 0)
                        {
                            Console.WriteLine("Adding experience block helper to simple template");
                            
                            // Find a good insertion point - after the summary section
                            int insertPoint = templateHtml.IndexOf("</div>", templateHtml.IndexOf("summary")) + 6;
                            if (insertPoint < 6) // If summary not found
                                insertPoint = templateHtml.IndexOf("</div>", templateHtml.IndexOf("container")) - 10; // Before container closing
                                
                            string experienceBlock = @"
            {{#if experience}}
            <div class=""section"">
                <h2 class=""section-title"">Experience</h2>
                {{#each experience}}
                <div class=""experience-item"">
                    <div class=""experience-header"">
                        <div>
                            <div class=""job-title"">{{title}}</div>
                            <div class=""company"">{{company}}</div>
                        </div>
                        <div class=""date-location"">
                            {{startDate}} - {{endDate}}
                            <br>{{location}}
                        </div>
                    </div>
                    <div class=""description"">{{description}}</div>
                </div>
                {{/each}}
            </div>
            {{/if}}";
                            
                            templateHtml = templateHtml.Insert(insertPoint, experienceBlock);
                        }
                        
                        // Add skills block if needed
                        if (!templateHtml.Contains("{{#each skills}}") && templateData is Dictionary<string, object> skillsDataDict && 
                            skillsDataDict.ContainsKey("skills") && skillsDataDict["skills"] is System.Collections.ICollection skillsColl && skillsColl.Count > 0)
                        {
                            Console.WriteLine("Adding skills block helper to simple template");
                            
                            // Find insertion point - before container closing
                            int insertPoint = templateHtml.LastIndexOf("</div>", templateHtml.LastIndexOf("</body>"));
                            
                            string skillsBlock = @"
            {{#if skills}}
            <div class=""section"">
                <h2 class=""section-title"">Skills</h2>
                <div class=""skills-list"">
                    {{#each skills}}
                    <span class=""skill-tag"">{{this}}</span>
                    {{/each}}
                </div>
            </div>
            {{/if}}";
                            
                            templateHtml = templateHtml.Insert(insertPoint, skillsBlock);
                            
                            // Add CSS for skills if not present
                            if (!templateHtml.Contains(".skill-tag"))
                            {
                                int styleEnd = templateHtml.IndexOf("</style>");
                                string skillsCSS = @"
            .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .skill-tag { background: #e2e8f0; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.9rem; }";
                                
                                templateHtml = templateHtml.Insert(styleEnd, skillsCSS);
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine("Structured template detected - skipping auto-block addition");
                    }
                    
                    // Debug: Log the final template data before compilation
                    Console.WriteLine("=== FINAL TEMPLATE DATA BEFORE HANDLEBARS COMPILATION ===");
                    if (templateData is Dictionary<string, object> finalDict)
                    {
                        Console.WriteLine($"Template data keys: {string.Join(", ", finalDict.Keys)}");
                        if (finalDict.ContainsKey("color"))
                            Console.WriteLine($"color value: '{finalDict["color"]}'");
                        if (finalDict.ContainsKey("Color"))
                            Console.WriteLine($"Color value: '{finalDict["Color"]}'");
                        if (finalDict.ContainsKey("name"))
                            Console.WriteLine($"name value: '{finalDict["name"]}'");
                    }
                    else
                    {
                        Console.WriteLine($"Template data type: {templateData?.GetType().Name ?? "null"}");
                        Console.WriteLine($"Template data: {JsonConvert.SerializeObject(templateData)}");
                    }
                    
                    // Compile the template
                    var template = Handlebars.Compile(templateHtml);
                    
                    // Generate the HTML
                    string result = template(templateData);
                    
                    // Log the first part of the generated HTML
                    Console.WriteLine($"Generated HTML (first 100 chars): {result.Substring(0, Math.Min(100, result.Length))}");
                    
                    // Check if color placeholders were properly replaced
                    if (result.Contains("{{color}}"))
                    {
                        Console.WriteLine("✗ ERROR: Generated HTML still contains {{color}} placeholders - Handlebars did NOT replace them!");
                        int remainingColorCount = result.Split("{{color}}").Length - 1;
                        Console.WriteLine($"✗ Found {remainingColorCount} unreplaced {{color}} placeholders in generated HTML");
                    }
                    else
                    {
                        Console.WriteLine("✓ SUCCESS: All {{color}} placeholders were replaced by Handlebars");
                    }
                    
                    // Check if the final color value appears in the generated HTML
                    string finalColorToCheck = color ?? "#315389";
                    if (result.Contains(finalColorToCheck))
                    {
                        Console.WriteLine($"✓ SUCCESS: Final color '{finalColorToCheck}' appears in generated HTML");
                    }
                    else
                    {
                        Console.WriteLine($"✗ WARNING: Final color '{finalColorToCheck}' does NOT appear in generated HTML");
                    }
                    
                    // Check if the HTML still has empty tags despite data being present
                    if (result.Contains("<h1></h1>") && templateData is Dictionary<string, object> resultDataDict && !string.IsNullOrEmpty(resultDataDict["name"]?.ToString()))
                    {
                        Console.WriteLine("Warning: HTML still contains empty tags. Template might need additional fixes.");
                        
                        // We'll add proper Handlebars helpers and partials in a future update
                        // For now, we'll return the result as is
                    }
                    
                    return result;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error generating HTML: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    
                    // Fallback to a simple HTML template
                    if (templateData is Dictionary<string, object> fallbackDict)
                    {
                        string name = fallbackDict["name"]?.ToString() ?? "";
                        string title = fallbackDict["title"]?.ToString() ?? "";
                        string email = fallbackDict["email"]?.ToString() ?? "";
                        string phone = fallbackDict["phone"]?.ToString() ?? "";
                        string location = fallbackDict["location"]?.ToString() ?? "";
                        string summary = fallbackDict["summary"]?.ToString() ?? "";
                        
                        string fallbackHtml = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{{name}} - Resume</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #fff; }}
        .container {{ max-width: 8.5in; margin: 0 auto; padding: 0.5in; min-height: 11in; }}
        .header {{ background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 2rem; text-align: center; margin-bottom: 2rem; }}
        .header h1 {{ font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }}
        .header .title {{ font-size: 1.2rem; opacity: 0.9; margin-bottom: 1rem; }}
        .contact-info {{ display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; }}
        .section {{ margin-bottom: 2rem; }}
        .section-title {{ font-size: 1.4rem; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 0.5rem; margin-bottom: 1rem; font-weight: bold; }}
        .summary {{ font-size: 1rem; line-height: 1.7; text-align: justify; }}
        .experience-item {{ margin-bottom: 1.5rem; }}
        .experience-header {{ display: flex; justify-content: space-between; margin-bottom: 0.5rem; }}
        .job-title {{ font-weight: bold; font-size: 1.1rem; }}
        .company {{ font-style: italic; }}
        .date-location {{ text-align: right; font-size: 0.9rem; }}
        .description {{ text-align: justify; }}
        .skills-list {{ display: flex; flex-wrap: wrap; gap: 0.5rem; }}
        .skill-tag {{ background: #e2e8f0; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.9rem; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>{{name}}</h1>
            <div class=""title"">{{title}}</div>
            <div class=""contact-info"">
                <span>{{email}}</span>
                <span>{{phone}}</span>
                <span>{{location}}</span>
            </div>
        </div>

        <div class=""section"">
            <h2 class=""section-title"">Professional Summary</h2>
            <p class=""summary"">{{summary}}</p>
        </div>

        {{#if experience}}
        <div class=""section"">
            <h2 class=""section-title"">Experience</h2>
            {{#each experience}}
            <div class=""experience-item"">
                <div class=""experience-header"">
                    <div>
                        <div class=""job-title"">{{title}}</div>
                        <div class=""company"">{{company}}</div>
                    </div>
                    <div class=""date-location"">
                        {{startDate}} - {{endDate}}
                        <br>{{location}}
                    </div>
                </div>
                <div class=""description"">{{description}}</div>
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if education}}
        <div class=""section"">
            <h2 class=""section-title"">Education</h2>
            {{#each education}}
            <div class=""experience-item"">
                <div class=""experience-header"">
                    <div>
                        <div class=""job-title"">{{degree}}</div>
                        <div class=""company"">{{institution}}</div>
                    </div>
                    <div class=""date-location"">
                        {{startDate}} - {{endDate}}
                        <br>{{location}}
                    </div>
                </div>
                {{#if gpa}}<div>GPA: {{gpa}}</div>{{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if skills}}
        <div class=""section"">
            <h2 class=""section-title"">Skills</h2>
            <div class=""skills-list"">
                {{#each skills}}
                <span class=""skill-tag"">{{this}}</span>
                {{/each}}
            </div>
        </div>
        {{/if}}
    </div>
</body>
</html>";
                        
                        return fallbackHtml;
                    }
                    
                    return "<html><body><p>Error generating resume. Please try again with a different template.</p></body></html>";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating resume HTML: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Error generating resume HTML: {ex.Message}", ex);
            }
        }

        public async Task<object> OptimizeResumeAsync(string resumeData, string templateId, string userId, string plan)
        {
            try
            {
                // Parse the resume data
                var resumeDataObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(resumeData) ?? 
                    throw new ArgumentException("Invalid resume data JSON format");
                
                // Create a temporary file with the resume content
                string tempFilePath = Path.GetTempFileName();
                try
                {
                    // Generate a simple text version of the resume for optimization
                    StringBuilder resumeText = new StringBuilder();
                    
                    // Add personal information
                    if (resumeDataObj.TryGetValue("name", out var name) && name != null)
                        resumeText.AppendLine($"Name: {name}");
                    
                    if (resumeDataObj.TryGetValue("title", out var title) && title != null)
                        resumeText.AppendLine($"Title: {title}");
                    
                    if (resumeDataObj.TryGetValue("email", out var email) && email != null)
                        resumeText.AppendLine($"Email: {email}");
                    
                    if (resumeDataObj.TryGetValue("phone", out var phone) && phone != null)
                        resumeText.AppendLine($"Phone: {phone}");
                    
                    if (resumeDataObj.TryGetValue("location", out var location) && location != null)
                        resumeText.AppendLine($"Location: {location}");
                    
                    // Add summary
                    if (resumeDataObj.TryGetValue("summary", out var summary) && summary != null)
                    {
                        resumeText.AppendLine("\nSUMMARY");
                        resumeText.AppendLine(summary.ToString());
                    }
                    
                    // Add experience
                    if (resumeDataObj.TryGetValue("experience", out var experienceObj) && experienceObj != null)
                    {
                        resumeText.AppendLine("\nEXPERIENCE");
                        if (experienceObj is JArray experienceArray)
                        {
                            foreach (var exp in experienceArray)
                            {
                                if (exp is JObject expObj)
                                {
                                    string jobTitle = expObj["title"]?.ToString() ?? "";
                                    string company = expObj["company"]?.ToString() ?? "";
                                    string expLocation = expObj["location"]?.ToString() ?? "";
                                    string startDate = expObj["startDate"]?.ToString() ?? "";
                                    string endDate = expObj["endDate"]?.ToString() ?? "";
                                    string description = expObj["description"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{jobTitle} at {company}, {expLocation}");
                                    resumeText.AppendLine($"{startDate} - {endDate}");
                                    resumeText.AppendLine(description);
                                    resumeText.AppendLine();
                                }
                            }
                        }
                    }
                    
                    // Add education
                    if (resumeDataObj.TryGetValue("education", out var educationObj) && educationObj != null)
                    {
                        resumeText.AppendLine("\nEDUCATION");
                        if (educationObj is JArray educationArray)
                        {
                            foreach (var edu in educationArray)
                            {
                                if (edu is JObject eduObj)
                                {
                                    string degree = eduObj["degree"]?.ToString() ?? "";
                                    string institution = eduObj["institution"]?.ToString() ?? "";
                                    string eduLocation = eduObj["location"]?.ToString() ?? "";
                                    string startDate = eduObj["startDate"]?.ToString() ?? "";
                                    string endDate = eduObj["endDate"]?.ToString() ?? "";
                                    string description = eduObj["description"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{degree} at {institution}, {eduLocation}");
                                    resumeText.AppendLine($"{startDate} - {endDate}");
                                    if (!string.IsNullOrEmpty(description))
                                        resumeText.AppendLine(description);
                                    resumeText.AppendLine();
                                }
                            }
                        }
                    }
                    
                    // Add skills
                    if (resumeDataObj.TryGetValue("skills", out var skillsObj) && skillsObj != null)
                    {
                        resumeText.AppendLine("\nSKILLS");
                        if (skillsObj is JArray skillsArray)
                        {
                            foreach (var skill in skillsArray)
                            {
                                resumeText.AppendLine($"- {skill}");
                            }
                        }
                    }
                    
                    // Add certifications
                    if (resumeDataObj.TryGetValue("certifications", out var certificationsObj) && certificationsObj != null)
                    {
                        resumeText.AppendLine("\nCERTIFICATIONS");
                        if (certificationsObj is JArray certificationsArray)
                        {
                            foreach (var cert in certificationsArray)
                            {
                                if (cert is JObject certObj)
                                {
                                    string certName = certObj["name"]?.ToString() ?? "";
                                    string issuer = certObj["issuer"]?.ToString() ?? "";
                                    string date = certObj["date"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{certName} from {issuer}, {date}");
                                }
                            }
                        }
                    }
                    
                    // Add projects
                    if (resumeDataObj.TryGetValue("projects", out var projectsObj) && projectsObj != null)
                    {
                        resumeText.AppendLine("\nPROJECTS");
                        if (projectsObj is JArray projectsArray)
                        {
                            foreach (var proj in projectsArray)
                            {
                                if (proj is JObject projObj)
                                {
                                    string projName = projObj["name"]?.ToString() ?? "";
                                    string date = projObj["date"]?.ToString() ?? "";
                                    string description = projObj["description"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{projName}, {date}");
                                    resumeText.AppendLine(description);
                                    resumeText.AppendLine();
                                }
                            }
                        }
                    }
                    
                    // Write the resume text to the temporary file
                    await System.IO.File.WriteAllTextAsync(tempFilePath, resumeText.ToString());
                    
                    // Create a FormFile from the temporary file
                    using var fileStream = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read);
                    var formFile = new FormFile(fileStream, 0, fileStream.Length, "resume", "resume.txt")
                    {
                        Headers = new HeaderDictionary(),
                        ContentType = "text/plain"
                    };
                    
                    // Call the ResumeService to optimize the resume
                    var optimizationResult = await _resumeService.OptimizeResume(formFile, plan, userId, "resume_builder_ai_optimization");
                    
                    // Apply the optimization suggestions to the resume data
                    var updatedResumeData = ApplyOptimizationSuggestions(resumeDataObj, optimizationResult);
                    
                    // Generate the resume HTML using the updated data
                    string templateHtml = await GetTemplateHtmlAsync(templateId);
                    
                    // Add null check for templateHtml
                    if (templateHtml == null)
                    {
                        Console.WriteLine("Warning: Template HTML is null. Using empty template.");
                        templateHtml = "<html><body><p>No template available. Please select a different template.</p></body></html>";
                    }
                    
                    string resumeHtml = GenerateResumeHtml(templateHtml, updatedResumeData, null);
                    
                    // Normalize experience descriptions before returning to frontend
                    var normalizedData = NormalizeResumeData(updatedResumeData);
                    
                    return new
                    {
                        html = resumeHtml,
                        data = normalizedData,
                        optimizationReport = optimizationResult
                    };
                }
                finally
                {
                    // Clean up the temporary file
                    if (System.IO.File.Exists(tempFilePath))
                    {
                        System.IO.File.Delete(tempFilePath);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error optimizing resume: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Error optimizing resume: {ex.Message}", ex);
            }
        }
        
        public async Task<object> EnhanceResumeAsync(string resumeData, string templateId, string userId, string plan)
        {
            // This is a copy of OptimizeResumeAsync, but with a new prompt/featureType for 100% ATS
            // 1. Parse resumeData as before
            // 2. Write resume text to temp file as before
            // 3. Call _resumeService.OptimizeResume with featureType = "resume_builder_ai_enhance_100_ats"
            // 4. In the Python microservice, use a prompt like:
            //    "Rewrite and enhance this resume to maximize ATS score to 100%. Use all relevant keywords, optimize formatting, and ensure it is tailored for ATS systems. Do not remove any important information."
            // 5. Apply suggestions and render as HTML with the selected template (same as OptimizeResumeAsync)
            // 6. Return the result (html, data, optimizationReport)
            // (You can copy-paste OptimizeResumeAsync and adjust the featureType and comments)
            
            try
            {
                // Parse the resume data
                var resumeDataObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(resumeData) ?? 
                    throw new ArgumentException("Invalid resume data JSON format");
                
                // Create a temporary file with the resume content
                string tempFilePath = Path.GetTempFileName();
                try
                {
                    // Generate a simple text version of the resume for optimization
                    StringBuilder resumeText = new StringBuilder();
                    
                    // Add personal information
                    if (resumeDataObj.TryGetValue("name", out var name) && name != null)
                        resumeText.AppendLine($"Name: {name}");
                    
                    if (resumeDataObj.TryGetValue("title", out var title) && title != null)
                        resumeText.AppendLine($"Title: {title}");
                    
                    if (resumeDataObj.TryGetValue("email", out var email) && email != null)
                        resumeText.AppendLine($"Email: {email}");
                    
                    if (resumeDataObj.TryGetValue("phone", out var phone) && phone != null)
                        resumeText.AppendLine($"Phone: {phone}");
                    
                    if (resumeDataObj.TryGetValue("location", out var location) && location != null)
                        resumeText.AppendLine($"Location: {location}");
                    
                    // Add summary
                    if (resumeDataObj.TryGetValue("summary", out var summary) && summary != null)
                    {
                        resumeText.AppendLine("\nSUMMARY");
                        resumeText.AppendLine(summary.ToString());
                    }
                    
                    // Add experience
                    if (resumeDataObj.TryGetValue("experience", out var experienceObj) && experienceObj != null)
                    {
                        resumeText.AppendLine("\nEXPERIENCE");
                        if (experienceObj is JArray experienceArray)
                        {
                            foreach (var exp in experienceArray)
                            {
                                if (exp is JObject expObj)
                                {
                                    string jobTitle = expObj["title"]?.ToString() ?? "";
                                    string company = expObj["company"]?.ToString() ?? "";
                                    string expLocation = expObj["location"]?.ToString() ?? "";
                                    string startDate = expObj["startDate"]?.ToString() ?? "";
                                    string endDate = expObj["endDate"]?.ToString() ?? "";
                                    string description = expObj["description"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{jobTitle} at {company}, {expLocation}");
                                    resumeText.AppendLine($"{startDate} - {endDate}");
                                    resumeText.AppendLine(description);
                                    resumeText.AppendLine();
                                }
                            }
                        }
                    }
                    
                    // Add education
                    if (resumeDataObj.TryGetValue("education", out var educationObj) && educationObj != null)
                    {
                        resumeText.AppendLine("\nEDUCATION");
                        if (educationObj is JArray educationArray)
                        {
                            foreach (var edu in educationArray)
                            {
                                if (edu is JObject eduObj)
                                {
                                    string degree = eduObj["degree"]?.ToString() ?? "";
                                    string institution = eduObj["institution"]?.ToString() ?? "";
                                    string eduLocation = eduObj["location"]?.ToString() ?? "";
                                    string startDate = eduObj["startDate"]?.ToString() ?? "";
                                    string endDate = eduObj["endDate"]?.ToString() ?? "";
                                    string description = eduObj["description"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{degree} at {institution}, {eduLocation}");
                                    resumeText.AppendLine($"{startDate} - {endDate}");
                                    if (!string.IsNullOrEmpty(description))
                                        resumeText.AppendLine(description);
                                    resumeText.AppendLine();
                                }
                            }
                        }
                    }
                    
                    // Add skills
                    if (resumeDataObj.TryGetValue("skills", out var skillsObj) && skillsObj != null)
                    {
                        resumeText.AppendLine("\nSKILLS");
                        if (skillsObj is JArray skillsArray)
                        {
                            foreach (var skill in skillsArray)
                            {
                                resumeText.AppendLine($"- {skill}");
                            }
                        }
                    }
                    
                    // Add certifications
                    if (resumeDataObj.TryGetValue("certifications", out var certificationsObj) && certificationsObj != null)
                    {
                        resumeText.AppendLine("\nCERTIFICATIONS");
                        if (certificationsObj is JArray certificationsArray)
                        {
                            foreach (var cert in certificationsArray)
                            {
                                if (cert is JObject certObj)
                                {
                                    string certName = certObj["name"]?.ToString() ?? "";
                                    string issuer = certObj["issuer"]?.ToString() ?? "";
                                    string date = certObj["date"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{certName} from {issuer}, {date}");
                                }
                            }
                        }
                    }
                    
                    // Add projects
                    if (resumeDataObj.TryGetValue("projects", out var projectsObj) && projectsObj != null)
                    {
                        resumeText.AppendLine("\nPROJECTS");
                        if (projectsObj is JArray projectsArray)
                        {
                            foreach (var proj in projectsArray)
                            {
                                if (proj is JObject projObj)
                                {
                                    string projName = projObj["name"]?.ToString() ?? "";
                                    string date = projObj["date"]?.ToString() ?? "";
                                    string description = projObj["description"]?.ToString() ?? "";
                                    
                                    resumeText.AppendLine($"{projName}, {date}");
                                    resumeText.AppendLine(description);
                                    resumeText.AppendLine();
                                }
                            }
                        }
                    }
                    
                    // Write the resume text to the temporary file
                    await System.IO.File.WriteAllTextAsync(tempFilePath, resumeText.ToString());
                    
                    // Create a FormFile from the temporary file
                    using var fileStream = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read);
                    var formFile = new FormFile(fileStream, 0, fileStream.Length, "resume", "resume.txt")
                    {
                        Headers = new HeaderDictionary(),
                        ContentType = "text/plain"
                    };
                    
                    // Call the ResumeService to optimize the resume
                    var optimizationResult = await _resumeService.OptimizeResume(formFile, plan, userId, "resume_builder_ai_enhance_100_ats");
                    
                    // Apply the optimization suggestions to the resume data
                    var updatedResumeData = ApplyOptimizationSuggestions(resumeDataObj, optimizationResult);
                    
                    // Generate the resume HTML using the updated data
                    string templateHtml = await GetTemplateHtmlAsync(templateId);
                    
                    // Add null check for templateHtml
                    if (templateHtml == null)
                    {
                        Console.WriteLine("Warning: Template HTML is null. Using empty template.");
                        templateHtml = "<html><body><p>No template available. Please select a different template.</p></body></html>";
                    }
                    
                    string resumeHtml = GenerateResumeHtml(templateHtml, updatedResumeData, null);
                    
                    // Normalize experience descriptions before returning to frontend
                    var normalizedData = NormalizeResumeData(updatedResumeData);
                    
                    return new
                    {
                        html = resumeHtml,
                        data = normalizedData,
                        optimizationReport = optimizationResult
                    };
                }
                finally
                {
                    // Clean up the temporary file
                    if (System.IO.File.Exists(tempFilePath))
                    {
                        System.IO.File.Delete(tempFilePath);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error enhancing resume: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Error enhancing resume: {ex.Message}", ex);
            }
        }
        
        // Helper method to wrap text for PDF generation
        private List<string> WrapText(string text, XFont font, double maxWidth)
        {
            var result = new List<string>();
            if (string.IsNullOrEmpty(text))
                return result;
                
            // Split the text into words
            var words = text.Split(' ');
            var currentLine = new StringBuilder();
            
            foreach (var word in words)
            {
                // Check if adding this word would exceed the max width
                string testLine = currentLine.Length == 0 ? word : currentLine.ToString() + " " + word;
                var size = MeasureString(testLine, font);
                
                if (size.Width <= maxWidth)
                {
                    // Add the word to the current line
                    if (currentLine.Length > 0)
                        currentLine.Append(" ");
                    currentLine.Append(word);
                }
                else
                {
                    // Line is full, add it to the result and start a new line
                    if (currentLine.Length > 0)
                    {
                        result.Add(currentLine.ToString());
                        currentLine.Clear();
                    }
                    
                    // If the word itself is too long, we need to break it
                    if (MeasureString(word, font).Width > maxWidth)
                    {
                        // For simplicity, just add the word as is
                        // In a real implementation, you might want to break the word
                        result.Add(word);
                    }
                    else
                    {
                        currentLine.Append(word);
                    }
                }
            }
            
            // Add the last line if there's anything left
            if (currentLine.Length > 0)
                result.Add(currentLine.ToString());
                
            return result;
        }
        
        // Helper method to measure string width for PDF generation
        private XSize MeasureString(string text, XFont font)
        {
            // Use PdfSharpCore's built-in text measurement
            // This is an approximation based on the font metrics
            double width = text.Length * font.Size * 0.6; // Approximate width based on character count
            double height = font.Size * 1.2; // Approximate height based on font size
            
            return new XSize(width, height);
        }
        
        // Helper method to check if a JToken is empty
        private bool IsEmptyValue(JToken? token)
        {
            if (token == null)
                return true;
                
            if (token.Type == JTokenType.Array)
            {
                var arr = (JArray)token;
                return arr.Count == 0 || arr.All(item => IsEmptyValue(item));
            }
            
            if (token.Type == JTokenType.Object)
            {
                var obj = (JObject)token;
                return obj.Count == 0 || obj.Properties().All(p => IsEmptyValue(p.Value));
            }
            
            if (token.Type == JTokenType.String)
                return string.IsNullOrWhiteSpace(token.ToString());
                
            return false;
        }
        
        // Helper method to check if an object is an empty array or empty string
        private bool IsEmptyOrEmptyArray(object value)
        {
            if (value == null)
                return true;
                
            if (value is string str)
                return string.IsNullOrWhiteSpace(str);
                
            if (value is JToken jtoken)
                return IsEmptyValue(jtoken);
                
            if (value is System.Collections.ICollection collection)
                return collection.Count == 0;
                
            // Check if it's a nested array structure like we're seeing in the data
            if (value is System.Collections.IEnumerable enumerable && !(value is string))
            {
                bool hasNonEmptyItems = false;
                foreach (var item in enumerable)
                {
                    if (!IsEmptyOrEmptyArray(item))
                    {
                        hasNonEmptyItems = true;
                        break;
                    }
                }
                return !hasNonEmptyItems;
            }
                
            return string.IsNullOrWhiteSpace(value.ToString());
        }
        
        private Dictionary<string, object> ApplyOptimizationSuggestions(Dictionary<string, object> resumeData, ResumeOptimizationResult optimizationResult)
        {
            // Create a copy of the resume data to avoid modifying the original
            var updatedResumeData = new Dictionary<string, object>(resumeData);
            
            // Apply section feedback if available
            if (optimizationResult.SectionFeedback != null && optimizationResult.SectionFeedback.Count > 0)
            {
                // Update summary if feedback is available
                if (optimizationResult.SectionFeedback.TryGetValue("Summary", out var summaryFeedback) || 
                    optimizationResult.SectionFeedback.TryGetValue("Professional Summary", out summaryFeedback))
                {
                    if (updatedResumeData.ContainsKey("summary"))
                    {
                        // Append the feedback to the summary
                        string currentSummary = updatedResumeData["summary"]?.ToString() ?? "";
                        updatedResumeData["summary"] = $"{currentSummary}\n\nImproved version based on AI suggestions:\n{summaryFeedback}";
                    }
                }
                
                // Update experience descriptions if feedback is available
                if (optimizationResult.SectionFeedback.TryGetValue("Experience", out var experienceFeedback) ||
                    optimizationResult.SectionFeedback.TryGetValue("Work Experience", out experienceFeedback))
                {
                    if (updatedResumeData.TryGetValue("experience", out var experienceObj) && experienceObj is JArray experienceArray)
                    {
                        // Add a note to the first experience item
                        if (experienceArray.Count > 0 && experienceArray[0] is JObject firstExpObj)
                        {
                            // Handle both string and array descriptions
                            if (firstExpObj["description"] is JArray descArray)
                            {
                                // If it's an array, create a new array with the feedback
                                var newArray = new JArray();
                                
                                // Add existing descriptions
                                foreach (var item in descArray)
                                {
                                    newArray.Add(item);
                                }
                                
                                // Add the feedback as a new item
                                newArray.Add($"AI Suggestion for improving experience descriptions:\n{experienceFeedback}");
                                
                                firstExpObj["description"] = newArray;
                            }
                            else
                            {
                                // If it's a string or other type, convert to string and append
                                string currentDescription = firstExpObj["description"]?.ToString() ?? "";
                                
                                // Don't add brackets if it's an empty array representation
                                if (currentDescription == "[]")
                                    currentDescription = "";
                                    
                                firstExpObj["description"] = $"{currentDescription}\n\nAI Suggestion for improving experience descriptions:\n{experienceFeedback}";
                            }
                        }
                    }
                }
                
                // Update skills if feedback is available
                if (optimizationResult.SectionFeedback.TryGetValue("Skills", out var skillsFeedback))
                {
                    if (updatedResumeData.ContainsKey("skills"))
                    {
                        // Extract skills from the feedback
                        var skillsMatch = Regex.Match(skillsFeedback, @"Consider adding skills like: (.+)");
                        if (skillsMatch.Success)
                        {
                            string skillsText = skillsMatch.Groups[1].Value;
                            var suggestedSkills = skillsText.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(s => s.Trim())
                                .ToList();
                            
                            // Add the suggested skills to the existing skills
                            if (updatedResumeData["skills"] is JArray skillsArray)
                            {
                                var currentSkills = skillsArray.Select(s => s.ToString()).ToList();
                                foreach (var skill in suggestedSkills)
                                {
                                    if (!currentSkills.Contains(skill))
                                    {
                                        skillsArray.Add(skill);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            return updatedResumeData;
        }

        internal async Task<(byte[] fileBytes, string fileName, string contentType)> DownloadResumeAsync(string resumeText, string format, string userId)
        {
            // Prepare the request to the Python microservice
            var requestContent = new MultipartFormDataContent();
            requestContent.Add(new StringContent(resumeText), "resume_text");
            requestContent.Add(new StringContent(format), "format");

            // Build the Python API URL
            var pythonUrl = $"{_pythonApiBaseUrl}/candidate/download-resume";
            using var response = await _httpClient.PostAsync(pythonUrl, requestContent);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Python download-resume failed: {error}");
            }

            var fileBytes = await response.Content.ReadAsByteArrayAsync();
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
            var contentDisposition = response.Content.Headers.ContentDisposition?.FileName ?? null;
            string fileName = contentDisposition ?? $"resume_{userId}.{format}";
            fileName = fileName.Trim('"');
            return (fileBytes, fileName, contentType);
        }

        /// <summary>
        /// Generate PDF from HTML and CSS using Python microservice
        /// </summary>
        public async Task<byte[]> GeneratePDFFromHtmlAsync(string html, string css, string filename)
        {
            try
            {
                Console.WriteLine($"GeneratePDFFromHtmlAsync called with filename: {filename}");
                Console.WriteLine($"HTML length: {html?.Length ?? 0} characters");
                Console.WriteLine($"CSS length: {css?.Length ?? 0} characters");

                // Combine HTML and CSS into a complete document
                string completeHtml = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{filename}</title>
    <style>
        {css}
    </style>
</head>
<body>
    {html}
</body>
</html>";

                Console.WriteLine($"Complete HTML length: {completeHtml.Length} characters");

                // Prepare the request to Python microservice
                var requestData = new
                {
                    html_content = completeHtml,
                    filename = filename
                };

                var jsonContent = JsonConvert.SerializeObject(requestData);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                Console.WriteLine($"Sending request to Python microservice: {_pythonApiBaseUrl}/candidate/generate-pdf");

                // Send request to Python microservice
                var response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/candidate/generate-pdf", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Python microservice error: {response.StatusCode} - {errorContent}");
                    throw new Exception($"Python microservice returned error: {response.StatusCode} - {errorContent}");
                }

                // Get the PDF bytes
                var pdfBytes = await response.Content.ReadAsByteArrayAsync();
                Console.WriteLine($"Received PDF bytes: {pdfBytes.Length} bytes");

                if (pdfBytes.Length == 0)
                {
                    throw new Exception("Python microservice returned empty PDF");
                }

                return pdfBytes;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GeneratePDFFromHtmlAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Failed to generate PDF from HTML: {ex.Message}", ex);
            }
        }

        private class TemplatesData
        {
            [JsonProperty("templates")]
            public List<ResumeTemplateModel> Templates { get; set; } = new List<ResumeTemplateModel>();
        }
    }
}