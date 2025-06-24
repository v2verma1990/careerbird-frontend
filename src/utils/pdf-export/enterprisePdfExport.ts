import { resumeBuilderApi } from '../resumeBuilderApi';

/**
 * ENTERPRISE PDF EXPORT - Advanced backend PDF generation with data extraction
 * Ensures text-based PDFs identical to preview with enterprise-grade quality
 */

interface ResumeData {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  photo?: string;
  initials?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string;
    }>;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
  }>;
  achievements?: string[];
  references?: Array<{
    name: string;
    title: string;
    contact: string;
  }>;
  color?: string;
}

/**
 * Extract resume data from DOM element for backend processing
 */
const extractResumeDataFromDOM = (elementId: string): ResumeData => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID '${elementId}' not found`);
  }

  console.log('ENTERPRISE PDF - Extracting data from DOM element:', elementId);

  const extractedData: ResumeData = {};

  try {
    // Extract basic information
    const nameElement = element.querySelector('[data-field="name"], .name, .candidate-name, h1') as HTMLElement;
    if (nameElement) {
      extractedData.name = nameElement.textContent?.trim() || '';
    }

    const titleElement = element.querySelector('[data-field="title"], .title, .job-title, .position') as HTMLElement;
    if (titleElement) {
      extractedData.title = titleElement.textContent?.trim() || '';
    }

    const emailElement = element.querySelector('[data-field="email"], .email, [href^="mailto:"]') as HTMLElement;
    if (emailElement) {
      extractedData.email = emailElement.textContent?.trim() || emailElement.getAttribute('href')?.replace('mailto:', '') || '';
    }

    const phoneElement = element.querySelector('[data-field="phone"], .phone, [href^="tel:"]') as HTMLElement;
    if (phoneElement) {
      extractedData.phone = phoneElement.textContent?.trim() || phoneElement.getAttribute('href')?.replace('tel:', '') || '';
    }

    const locationElement = element.querySelector('[data-field="location"], .location, .address') as HTMLElement;
    if (locationElement) {
      extractedData.location = locationElement.textContent?.trim() || '';
    }

    const linkedinElement = element.querySelector('[data-field="linkedin"], .linkedin, [href*="linkedin.com"]') as HTMLElement;
    if (linkedinElement) {
      extractedData.linkedin = linkedinElement.textContent?.trim() || linkedinElement.getAttribute('href') || '';
    }

    const websiteElement = element.querySelector('[data-field="website"], .website, .portfolio') as HTMLElement;
    if (websiteElement) {
      extractedData.website = websiteElement.textContent?.trim() || websiteElement.getAttribute('href') || '';
    }

    // Extract summary/profile
    const summaryElement = element.querySelector('[data-field="summary"], .summary, .profile, .about') as HTMLElement;
    if (summaryElement) {
      extractedData.summary = summaryElement.textContent?.trim() || '';
    }

    // Extract skills
    const skillsElements = element.querySelectorAll('[data-field="skill"], .skill, .skills li, .skill-item');
    if (skillsElements.length > 0) {
      extractedData.skills = Array.from(skillsElements).map(el => el.textContent?.trim() || '').filter(skill => skill);
    }

    // Extract experience
    const experienceElements = element.querySelectorAll('[data-section="experience"] .experience-item, .experience-entry, .job-entry');
    if (experienceElements.length > 0) {
      extractedData.experience = Array.from(experienceElements).map(expEl => {
        const titleEl = expEl.querySelector('.job-title, .position, .title') as HTMLElement;
        const companyEl = expEl.querySelector('.company, .employer, .organization') as HTMLElement;
        const locationEl = expEl.querySelector('.location, .job-location') as HTMLElement;
        const startDateEl = expEl.querySelector('.start-date, .date-start') as HTMLElement;
        const endDateEl = expEl.querySelector('.end-date, .date-end') as HTMLElement;
        const descriptionEl = expEl.querySelector('.description, .job-description, .responsibilities') as HTMLElement;

        return {
          title: titleEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || '',
          startDate: startDateEl?.textContent?.trim() || '',
          endDate: endDateEl?.textContent?.trim() || '',
          description: descriptionEl?.textContent?.trim() || ''
        };
      });
    }

    // Extract education
    const educationElements = element.querySelectorAll('[data-section="education"] .education-item, .education-entry');
    if (educationElements.length > 0) {
      extractedData.education = Array.from(educationElements).map(eduEl => {
        const degreeEl = eduEl.querySelector('.degree, .qualification') as HTMLElement;
        const institutionEl = eduEl.querySelector('.institution, .school, .university') as HTMLElement;
        const locationEl = eduEl.querySelector('.location, .edu-location') as HTMLElement;
        const startDateEl = eduEl.querySelector('.start-date, .date-start') as HTMLElement;
        const endDateEl = eduEl.querySelector('.end-date, .date-end') as HTMLElement;

        return {
          degree: degreeEl?.textContent?.trim() || '',
          institution: institutionEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || '',
          startDate: startDateEl?.textContent?.trim() || '',
          endDate: endDateEl?.textContent?.trim() || ''
        };
      });
    }

    // Generate initials if name is available
    if (extractedData.name) {
      const names = extractedData.name.trim().split(/\s+/).filter(n => n.length > 0);
      if (names.length > 0) {
        if (names.length === 1) {
          extractedData.initials = names[0].substring(0, 2).toUpperCase();
        } else {
          extractedData.initials = names.map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
        }
      }
    }

    console.log('ENTERPRISE PDF - Extracted data:', extractedData);
    return extractedData;

  } catch (error) {
    console.error('ENTERPRISE PDF - Data extraction failed:', error);
    throw new Error(`Failed to extract resume data from DOM: ${error}`);
  }
};

/**
 * ENTERPRISE PDF EXPORT - Main function
 * Generates text-based PDFs identical to preview using backend processing
 */
export const exportResumeAsEnterprisePDF = async (
  elementId: string,
  filename: string,
  templateId: string,
  color: string,
  resumeData?: any
): Promise<void> => {
  try {
    console.log('ENTERPRISE PDF Export - Starting:', { elementId, filename, templateId, color });

    let finalResumeData = resumeData;

    // If no resume data provided, extract it from the DOM
    if (!finalResumeData) {
      console.log('ENTERPRISE PDF Export - No data provided, extracting from DOM');
      finalResumeData = extractResumeDataFromDOM(elementId);
    }

    // Ensure we have valid data
    if (!finalResumeData || (typeof finalResumeData === 'object' && Object.keys(finalResumeData).length === 0)) {
      throw new Error('No resume data available for PDF generation');
    }

    console.log('ENTERPRISE PDF Export - Resume data available, size:', JSON.stringify(finalResumeData).length);
    
    // Prepare payload for backend processing
    const payload = {
      resumeData: finalResumeData,
      templateId: templateId,
      color: color,
      filename: filename
    };
    
    console.log('ENTERPRISE PDF Export - Sending to backend for text-based PDF generation');

    // Generate PDF using backend (produces text-based PDF identical to preview)
    const { data: pdfBlob, error } = await resumeBuilderApi.generatePDFFromData(payload);

    if (error) {
      throw new Error(`Backend PDF generation failed: ${error}`);
    }

    if (!pdfBlob) {
      throw new Error('No PDF data received from backend');
    }

    // Download the text-based PDF
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('ENTERPRISE PDF Export - Success! Text-based PDF generated and downloaded');
  } catch (error) {
    console.error('ENTERPRISE PDF Export - Error:', error);
    throw error;
  }
};

/**
 * Validate resume data structure
 */
export const validateResumeData = (data: any): boolean => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for at least basic information
  const hasBasicInfo = data.name || data.title || data.email;
  const hasContent = data.experience?.length > 0 || data.education?.length > 0 || data.summary;

  return hasBasicInfo && hasContent;
};

/**
 * Sanitize resume data for backend processing
 */
export const sanitizeResumeData = (data: any): ResumeData => {
  const sanitized: ResumeData = {};

  if (data.name) sanitized.name = String(data.name).trim();
  if (data.title) sanitized.title = String(data.title).trim();
  if (data.email) sanitized.email = String(data.email).trim();
  if (data.phone) sanitized.phone = String(data.phone).trim();
  if (data.location) sanitized.location = String(data.location).trim();
  if (data.linkedin) sanitized.linkedin = String(data.linkedin).trim();
  if (data.website) sanitized.website = String(data.website).trim();
  if (data.summary) sanitized.summary = String(data.summary).trim();
  if (data.initials) sanitized.initials = String(data.initials).trim();
  if (data.color) sanitized.color = String(data.color).trim();

  if (Array.isArray(data.skills)) {
    sanitized.skills = data.skills.map(skill => String(skill).trim()).filter(skill => skill);
  }

  if (Array.isArray(data.experience)) {
    sanitized.experience = data.experience.map(exp => ({
      title: String(exp.title || '').trim(),
      company: String(exp.company || '').trim(),
      location: String(exp.location || '').trim(),
      startDate: String(exp.startDate || '').trim(),
      endDate: String(exp.endDate || '').trim(),
      description: String(exp.description || '').trim(),
      projects: Array.isArray(exp.projects) ? exp.projects.map(proj => ({
        name: String(proj.name || '').trim(),
        description: String(proj.description || '').trim(),
        technologies: String(proj.technologies || '').trim()
      })) : []
    }));
  }

  if (Array.isArray(data.education)) {
    sanitized.education = data.education.map(edu => ({
      degree: String(edu.degree || '').trim(),
      institution: String(edu.institution || '').trim(),
      location: String(edu.location || '').trim(),
      startDate: String(edu.startDate || '').trim(),
      endDate: String(edu.endDate || '').trim(),
      gpa: edu.gpa ? String(edu.gpa).trim() : undefined
    }));
  }

  return sanitized;
};