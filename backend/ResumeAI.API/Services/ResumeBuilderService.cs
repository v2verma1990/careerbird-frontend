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
            
            // Ensure directories exist
            Directory.CreateDirectory(_templatesPath);
            Directory.CreateDirectory(_htmlTemplatesPath);
            Directory.CreateDirectory(Path.Combine(_templatesPath, "thumbnails"));
            
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
                        Description = string.Empty
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
                // Get resume data either from file or from provided JSON
                ResumeDataModel resumeData;
                if (request.ResumeFile != null)
                {
                    // Extract data from resume file using Python microservice
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
                        resumeData = new ResumeDataModel(); // Use empty model if deserialization fails
                    }
                    
                    // Log the parsed data
                    Console.WriteLine($"Parsed resume data: Name={resumeData.Name}, Email={resumeData.Email}, Skills count={resumeData.Skills.Count}");
                }
                else
                {
                    throw new ArgumentException("Either resume file or resume data must be provided");
                }

                // Get the template HTML
                string templateHtml = await GetTemplateHtmlAsync(request.TemplateId);
                
                // Check if the resume data contains empty arrays
                bool hasEmptyData = false;
                
                // Log the raw resume data for debugging
                string rawDataJson = JsonConvert.SerializeObject(resumeData);
                Console.WriteLine($"Raw resume data: {rawDataJson}");
                Console.WriteLine($"Raw resume data type: {resumeData?.GetType().Name ?? "null"}");
                
                // Log this to a file for debugging
                File.WriteAllText(Path.Combine(Directory.GetCurrentDirectory(), "debug_resume_data.json"), rawDataJson);
                
                // Check if the data is in the specific format we're seeing in the issue
                var jObj = JObject.Parse(rawDataJson);
                
                // Special check for the specific nested array structure we're seeing in the issue
                if (jObj.TryGetValue("name", out JToken? nameToken) && nameToken is JArray nameArray && nameArray.Count == 0 &&
                    jObj.TryGetValue("experience", out JToken? expToken) && expToken is JArray expArray && expArray.Count > 0 &&
                    expArray[0] != null && expArray[0] is JArray expInnerArray && expInnerArray.Count > 0 &&
                    expInnerArray[0] != null && expInnerArray[0] is JArray expInnerInnerArray && expInnerInnerArray.Count == 0)
                {
                    Console.WriteLine("Detected specific nested empty array structure");
                    hasEmptyData = true;
                    
                    // Log the structure for debugging
                    File.WriteAllText(Path.Combine(Directory.GetCurrentDirectory(), "nested_array_structure.json"), rawDataJson);
                }
                    
                    // Check if the data matches the empty structure pattern
                    bool isEmptyStructure = true;
                    
                    // Check name, title, email, phone, location fields
                    foreach (var field in new[] { "name", "title", "email", "phone", "location", "summary" })
                    {
                        if (jObj.TryGetValue(field, out JToken? value))
                        {
                            if (value is JArray arr)
                            {
                                // If it's not empty or contains non-empty values
                                if (arr.Count > 0 && arr.Any(item => !IsEmptyValue(item)))
                                {
                                    isEmptyStructure = false;
                                    break;
                                }
                            }
                            else if (!IsEmptyValue(value))
                            {
                                isEmptyStructure = false;
                                break;
                            }
                        }
                    }
                    
                    // Check experience, education, skills arrays
                    foreach (var field in new[] { "experience", "education", "skills" })
                    {
                        if (jObj.TryGetValue(field, out JToken? value) && value is JArray arr)
                        {
                            if (arr.Count > 0)
                            {
                                bool hasContent = false;
                                
                                // Check if any item in the array has content
                                foreach (var item in arr)
                                {
                                    if (item is JArray innerArr)
                                    {
                                        if (innerArr.Count > 0 && innerArr.Any(i => !IsEmptyValue(i)))
                                        {
                                            hasContent = true;
                                            break;
                                        }
                                    }
                                    else if (!IsEmptyValue(item))
                                    {
                                        hasContent = true;
                                        break;
                                    }
                                }
                                
                                if (hasContent)
                                {
                                    isEmptyStructure = false;
                                    break;
                                }
                            }
                        }
                    }
                    
                    hasEmptyData = isEmptyStructure;
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
                string resumeHtml = GenerateResumeHtml(templateHtml, resumeData ?? new object());
                
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
            string templatePath = Path.Combine(_htmlTemplatesPath, $"{templateId}.html");
            Console.WriteLine($"Looking for template at: {templatePath}");
            
            // Check if the template exists in the html directory
            if (File.Exists(templatePath))
            {
                Console.WriteLine($"Found template at: {templatePath}");
                return await File.ReadAllTextAsync(templatePath);
            }
            
            // Check if the template exists in the current directory
            string currentDirPath = Path.Combine(Directory.GetCurrentDirectory(), "html", $"{templateId}.html");
            Console.WriteLine($"Checking current directory: {currentDirPath}");
            
            if (File.Exists(currentDirPath))
            {
                Console.WriteLine($"Found template in current directory: {currentDirPath}");
                return await File.ReadAllTextAsync(currentDirPath);
            }
            
            // If the requested template doesn't exist, use a default template
            Console.WriteLine($"Template not found: {templateId}, using default template");
            
            // Try to use modern-clean as the default template
            string defaultTemplatePath = Path.Combine(_htmlTemplatesPath, "modern-clean.html");
            if (File.Exists(defaultTemplatePath))
            {
                Console.WriteLine($"Using default template: modern-clean");
                return await File.ReadAllTextAsync(defaultTemplatePath);
            }
            
            // If modern-clean doesn't exist, try to use any available template
            foreach (string templateFile in Directory.GetFiles(_htmlTemplatesPath, "*.html"))
            {
                Console.WriteLine($"Using available template: {Path.GetFileName(templateFile)}");
                return await File.ReadAllTextAsync(templateFile);
            }
            
            // If no templates are found, throw an exception
            Console.WriteLine("No templates found");
            throw new FileNotFoundException("No resume templates found. Please ensure at least one template HTML file exists.");
        }

        private string GenerateResumeHtml(string templateHtml, object? data)
        {
            try
            {
                // Ensure data is not null
                data ??= new object();
                
                Console.WriteLine("Template HTML first 100 chars: " + templateHtml.Substring(0, Math.Min(100, templateHtml.Length)));
                Console.WriteLine("Data type: " + data.GetType().Name);
                
                // Convert data to dictionary if it's a JObject
                object templateData = data;
                if (data is JObject jObject)
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
                            if (key == "skills" && jArray.Count > 0)
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
                    
                    templateData = processedDict;
                }
                
                // Ensure all required fields are present
                if (templateData is Dictionary<string, object> dict)
                {
                    Console.WriteLine("Ensuring all required fields are present");
                    
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
                            if (item is JObject itemObj)
                            {
                                var expItem = itemObj.ToObject<Dictionary<string, object>>();
                                if (expItem != null)
                                {
                                    expList.Add(expItem);
                                }
                                else
                                {
                                    expList.Add(new Dictionary<string, object>());
                                }
                            }
                        }
                        dict["experience"] = expList;
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
                            if (item is JObject itemObj)
                            {
                                var eduItem = itemObj.ToObject<Dictionary<string, object>>();
                                if (eduItem != null)
                                {
                                    eduList.Add(eduItem);
                                }
                                else
                                {
                                    eduList.Add(new Dictionary<string, object>());
                                }
                            }
                        }
                        dict["education"] = eduList;
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
                            if (item is JObject itemObj)
                            {
                                var certItem = itemObj.ToObject<Dictionary<string, object>>();
                                if (certItem != null)
                                {
                                    certList.Add(certItem);
                                }
                                else
                                {
                                    certList.Add(new Dictionary<string, object>());
                                }
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
                            if (item is JObject itemObj)
                            {
                                var projItem = itemObj.ToObject<Dictionary<string, object>>();
                                if (projItem != null)
                                {
                                    projList.Add(projItem);
                                }
                                else
                                {
                                    projList.Add(new Dictionary<string, object>());
                                }
                            }
                        }
                        dict["projects"] = projList;
                    }
                }
                
                // Log the data being passed to the template
                string dataJson = JsonConvert.SerializeObject(templateData, Formatting.Indented);
                Console.WriteLine("Template data (first 500 chars): " + dataJson.Substring(0, Math.Min(500, dataJson.Length)));
                
                // Log specific sections to verify they're properly formatted
                if (templateData is Dictionary<string, object> dataDict)
                {
                    // Log experience section
                    if (dataDict.ContainsKey("experience"))
                    {
                        Console.WriteLine($"Experience type: {dataDict["experience"].GetType().Name}");
                        if (dataDict["experience"] is System.Collections.ICollection expColl)
                        {
                            Console.WriteLine($"Experience count: {expColl.Count}");
                            
                            // Log the first experience item if available
                            if (expColl.Count > 0)
                            {
                                var expArray = dataDict["experience"] as System.Collections.IList;
                                if (expArray != null && expArray.Count > 0)
                                {
                                    Console.WriteLine($"First experience item type: {expArray[0]?.GetType().Name ?? "null"}");
                                    Console.WriteLine($"First experience item: {JsonConvert.SerializeObject(expArray[0])}");
                                }
                            }
                            
                            // Ensure experience is properly formatted for Handlebars
                            if (expColl.Count > 0 && !(dataDict["experience"] is List<Dictionary<string, object>>))
                            {
                                // Convert to the correct format
                                var expList = new List<Dictionary<string, object>>();
                                foreach (var item in (System.Collections.IEnumerable)dataDict["experience"])
                                {
                                    if (item is Dictionary<string, object> expDict)
                                    {
                                        expList.Add(expDict);
                                    }
                                    else if (item is JObject jObj)
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
                                dataDict["experience"] = expList;
                                Console.WriteLine($"Converted experience to List<Dictionary<string, object>>, count: {expList.Count}");
                            }
                        }
                    }
                    
                    // Log education section
                    if (dataDict.ContainsKey("education"))
                    {
                        Console.WriteLine($"Education type: {dataDict["education"].GetType().Name}");
                        if (dataDict["education"] is System.Collections.ICollection eduColl)
                        {
                            Console.WriteLine($"Education count: {eduColl.Count}");
                            
                            // Ensure education is properly formatted for Handlebars
                            if (eduColl.Count > 0 && !(dataDict["education"] is List<Dictionary<string, object>>))
                            {
                                // Convert to the correct format
                                var eduList = new List<Dictionary<string, object>>();
                                foreach (var item in (System.Collections.IEnumerable)dataDict["education"])
                                {
                                    if (item is Dictionary<string, object> eduDict)
                                    {
                                        eduList.Add(eduDict);
                                    }
                                    else if (item is JObject jObj)
                                    {
                                        var eduDictObj = jObj.ToObject<Dictionary<string, object>>();
                                        if (eduDictObj != null)
                                            eduList.Add(eduDictObj);
                                    }
                                }
                                dataDict["education"] = eduList;
                                Console.WriteLine($"Converted education to List<Dictionary<string, object>>, count: {eduList.Count}");
                            }
                        }
                    }
                    
                    // Log skills section
                    if (dataDict.ContainsKey("skills"))
                    {
                        Console.WriteLine($"Skills type: {dataDict["skills"].GetType().Name}");
                        if (dataDict["skills"] is System.Collections.ICollection skillsColl)
                        {
                            Console.WriteLine($"Skills count: {skillsColl.Count}");
                            
                            // Ensure skills is properly formatted for Handlebars
                            if (skillsColl.Count > 0 && !(dataDict["skills"] is List<string>))
                            {
                                // Convert to the correct format
                                var skillsList = new List<string>();
                                foreach (var item in (System.Collections.IEnumerable)dataDict["skills"])
                                {
                                    skillsList.Add(item?.ToString() ?? "");
                                }
                                dataDict["skills"] = skillsList;
                                Console.WriteLine($"Converted skills to List<string>, count: {skillsList.Count}");
                            }
                        }
                    }
                    
                    // Ensure certifications is properly formatted
                    if (dataDict.ContainsKey("certifications") && dataDict["certifications"] is System.Collections.ICollection certColl && certColl.Count > 0)
                    {
                        if (!(dataDict["certifications"] is List<Dictionary<string, object>>))
                        {
                            // Convert to the correct format
                            var certList = new List<Dictionary<string, object>>();
                            foreach (var item in (System.Collections.IEnumerable)dataDict["certifications"])
                            {
                                if (item is Dictionary<string, object> certDict)
                                {
                                    certList.Add(certDict);
                                }
                                else if (item is JObject jObj)
                                {
                                    var certDictObj = jObj.ToObject<Dictionary<string, object>>();
                                    if (certDictObj != null)
                                        certList.Add(certDictObj);
                                }
                            }
                            dataDict["certifications"] = certList;
                            Console.WriteLine($"Converted certifications to List<Dictionary<string, object>>, count: {certList.Count}");
                        }
                    }
                    
                    // Ensure projects is properly formatted
                    if (dataDict.ContainsKey("projects") && dataDict["projects"] is System.Collections.ICollection projColl && projColl.Count > 0)
                    {
                        if (!(dataDict["projects"] is List<Dictionary<string, object>>))
                        {
                            // Convert to the correct format
                            var projList = new List<Dictionary<string, object>>();
                            foreach (var item in (System.Collections.IEnumerable)dataDict["projects"])
                            {
                                if (item is Dictionary<string, object> projDict)
                                {
                                    projList.Add(projDict);
                                }
                                else if (item is JObject jObj)
                                {
                                    var projDictObj = jObj.ToObject<Dictionary<string, object>>();
                                    if (projDictObj != null)
                                        projList.Add(projDictObj);
                                }
                            }
                            dataDict["projects"] = projList;
                            Console.WriteLine($"Converted projects to List<Dictionary<string, object>>, count: {projList.Count}");
                        }
                    }
                }
                
                // Compile the template
                var template = Handlebars.Compile(templateHtml);
                
                // Generate HTML
                string result = template(templateData);
                Console.WriteLine("Generated HTML first 100 chars: " + result.Substring(0, Math.Min(100, result.Length)));
                return result;
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
                    var optimizationResult = await _resumeService.OptimizeResume(formFile, plan, userId, "resume_optimization");
                    
                    // Apply the optimization suggestions to the resume data
                    var updatedResumeData = ApplyOptimizationSuggestions(resumeDataObj, optimizationResult);
                    
                    // Generate the resume HTML using the updated data
                    string templateHtml = await GetTemplateHtmlAsync(templateId);
                    string resumeHtml = GenerateResumeHtml(templateHtml, updatedResumeData);
                    
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

        private class TemplatesData
        {
            [JsonProperty("templates")]
            public List<ResumeTemplateModel> Templates { get; set; } = new List<ResumeTemplateModel>();
        }
    }
}