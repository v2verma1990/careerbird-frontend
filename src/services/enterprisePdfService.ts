/**
 * ENTERPRISE PDF SERVICE
 * Handles all PDF generation through backend to ensure 100% consistency
 * between preview and downloaded PDF
 */

import { resumeBuilderApi } from '../utils/resumeBuilderApi';

export interface EnterprisePDFOptions {
  templateId: string;
  templateColor: string;
  filename: string;
  resumeData?: any;
  elementId?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  error?: string;
  blob?: Blob;
}

/**
 * Enterprise PDF Service Class
 * Manages all PDF generation through backend services
 */
export class EnterprisePDFService {
  private static instance: EnterprisePDFService;

  public static getInstance(): EnterprisePDFService {
    if (!EnterprisePDFService.instance) {
      EnterprisePDFService.instance = new EnterprisePDFService();
    }
    return EnterprisePDFService.instance;
  }

  /**
   * Generate PDF using backend service
   * This ensures the PDF is identical to the preview
   */
  public async generatePDF(options: EnterprisePDFOptions): Promise<PDFGenerationResult> {
    try {
      console.log('Enterprise PDF Service - Starting generation:', options);

      // Validate required options
      if (!options.templateId) {
        return { success: false, error: 'Template ID is required' };
      }

      if (!options.templateColor) {
        return { success: false, error: 'Template color is required' };
      }

      if (!options.filename) {
        return { success: false, error: 'Filename is required' };
      }

      let resumeData = options.resumeData;

      // If no resume data provided, extract from DOM
      if (!resumeData && options.elementId) {
        console.log('Enterprise PDF Service - Extracting data from DOM');
        resumeData = this.extractResumeDataFromDOM(options.elementId);
      }

      if (!resumeData) {
        return { success: false, error: 'Resume data is required for PDF generation' };
      }

      // Prepare payload for backend
      const payload = {
        resumeData: resumeData,
        templateId: options.templateId,
        color: options.templateColor,
        filename: options.filename
      };

      console.log('Enterprise PDF Service - Sending to backend for processing');
      console.log('Enterprise PDF Service - Using existing two-step process (build + generate)');

      // Generate PDF using backend API (two-step process)
      const { data: pdfBlob, error } = await resumeBuilderApi.generatePDFFromData(payload);

      if (error) {
        console.error('Enterprise PDF Service - Backend error:', error);
        return { success: false, error: this.formatErrorMessage(error) };
      }

      if (!pdfBlob) {
        return { success: false, error: 'No PDF data received from backend' };
      }

      console.log('Enterprise PDF Service - PDF generated successfully');
      return { success: true, blob: pdfBlob };

    } catch (error) {
      console.error('Enterprise PDF Service - Generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: this.formatErrorMessage(errorMessage) };
    }
  }

  /**
   * Download PDF blob to user's device
   */
  public downloadPDF(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Enterprise PDF Service - PDF downloaded successfully');
    } catch (error) {
      console.error('Enterprise PDF Service - Download failed:', error);
      throw new Error('Failed to download PDF file');
    }
  }

  /**
   * Generate and download PDF in one operation
   */
  public async generateAndDownloadPDF(options: EnterprisePDFOptions): Promise<void> {
    const result = await this.generatePDF(options);
    
    if (!result.success) {
      throw new Error(result.error || 'PDF generation failed');
    }

    if (!result.blob) {
      throw new Error('No PDF data available for download');
    }

    this.downloadPDF(result.blob, options.filename);
  }

  /**
   * Extract resume data from DOM element
   */
  private extractResumeDataFromDOM(elementId: string): any {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    console.log('Enterprise PDF Service - Extracting data from DOM element:', elementId);

    const extractedData: any = {};

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

      console.log('Enterprise PDF Service - Extracted data:', extractedData);
      return extractedData;

    } catch (error) {
      console.error('Enterprise PDF Service - Data extraction failed:', error);
      throw new Error(`Failed to extract resume data from DOM: ${error}`);
    }
  }

  /**
   * Format error messages for user display
   */
  private formatErrorMessage(error: string): string {
    // IMPORTANT: Don't modify backend endpoint errors - they need to trigger fallback
    if (error.includes('Backend PDF endpoint not implemented')) {
      return error; // Return original error to trigger fallback
    }
    
    if (error.includes('network') || error.includes('fetch') || error.includes('NetworkError')) {
      return 'PDF generation service is temporarily unavailable. Please check your internet connection and try again.';
    }
    
    if (error.includes('auth') || error.includes('unauthorized') || error.includes('401')) {
      return 'Authentication required for PDF generation. Please log in and try again.';
    }
    
    if (error.includes('limit') || error.includes('quota') || error.includes('429')) {
      return 'PDF generation limit reached. Please upgrade your plan or try again later.';
    }
    
    if (error.includes('timeout')) {
      return 'PDF generation timed out. Please try again with a simpler resume or contact support.';
    }
    
    if (error.includes('500') || error.includes('Internal Server Error')) {
      return 'PDF generation service is experiencing issues. Please try again in a few minutes.';
    }
    
    return `PDF generation failed: ${error}. Please contact support if the issue persists.`;
  }

  /**
   * Validate template configuration
   */
  public validateTemplate(templateId: string, templateColor: string): boolean {
    const supportedTemplates = [
      'modern-executive',
      'navy-column-modern',
      'creative-designer',
      'tech-minimalist',
      'academic-scholar',
      'startup-founder',
      'fresh-graduate',
      'grey-classic-profile',
      'blue-sidebar-profile',
      'green-sidebar-receptionist',
      'classic-profile-orange',
      'classic-law-bw',
      'green-sidebar-customer-service'
    ];

    if (!supportedTemplates.includes(templateId)) {
      console.warn('Enterprise PDF Service - Unsupported template:', templateId);
      return false;
    }

    if (!templateColor || !templateColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      console.warn('Enterprise PDF Service - Invalid color format:', templateColor);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const enterprisePdfService = EnterprisePDFService.getInstance();

// Export default for convenience
export default enterprisePdfService;