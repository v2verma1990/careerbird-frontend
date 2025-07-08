import api from './apiClient';
import { exportResumeAsPDF as exportResumeAsPDFNew, PDFExportOptions as NewPDFExportOptions } from './pdf-export';

/**
 * Download a text file to the user's device
 * @param content The text content to download
 * @param filename The name of the file to download
 */
export const downloadTextFile = (content: string, filename: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Export data to a CSV file
 * @param data The data to export
 * @param filename The name of the file to download (without extension)
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Create and download CSV file
  const csvContent = csvRows.join('\n');
  const element = document.createElement("a");
  const file = new Blob([csvContent], {type: 'text/csv'});
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Log user activity to the backend
 * @param actionType Type of action being logged
 * @param description Optional description of the activity
 */
export const logActivity = async (actionType: string, description?: string) => {
  try {
    await api.usage.logActivity({
      actionType,
      description
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

/**
 * Compatibility function for older code using Supabase directly
 * @param actionType Type of action being logged
 * @param description Optional description of the activity
 */
export const logActivity2 = async (actionType: string, description?: string) => {
  try {
    // Get user ID from current session
    const currentUser = api.auth.getCurrentUser();
    if (currentUser?.userId) {
      await api.usage.logActivity({
        actionType, 
        description
      });
    } else {
      console.warn("Cannot log activity: No user is logged in");
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

/**
 * PDF Export Options Interface
 */
export interface PDFExportOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number; // 0.1 to 1.0
  scale?: number; // Scale factor for rendering
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  includeBackground?: boolean;
  optimizeForPrint?: boolean;
  templateColor?: string; // Selected color for the template
  templateId?: string; // Template identifier for proper styling
  resumeData?: any; // Resume data for backend rendering
}

/**
 * Export resume as PDF using template-specific optimizations
 * This function routes to the appropriate template-specific exporter
 * @param elementId The ID of the DOM element to convert to PDF
 * @param filename The name of the PDF file (without extension)
 * @param options Configuration options for PDF generation
 */
export const exportResumeAsPDF = async (
  elementId: string, 
  filename: string = 'resume',
  options: PDFExportOptions = {}
): Promise<void> => {
  // Use the new template-specific PDF export system
  const newOptions: NewPDFExportOptions = {
    templateColor: options.templateColor || '#315389',
    templateId: options.templateId || 'navy-column-modern',
    resumeData: options.resumeData
  };

  console.log('ExportUtils - Routing to new PDF export system with options:', newOptions);
  
  try {
    await exportResumeAsPDFNew(elementId, filename, newOptions);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};

/**
 * Export resume using backend API (fallback method)
 * @param resumeData The resume data to export
 * @param format The export format ('pdf' | 'docx')
 * @param filename The filename for the export
 */
export const exportResumeViaAPI = async (
  resumeData: any,
  format: 'pdf' | 'docx' = 'pdf',
  filename: string = 'resume'
): Promise<void> => {
  try {
    const response = await api.resumeBuilder.downloadResume({
      resumeText: JSON.stringify(resumeData),
      format
    });

    if (response.ok) {
      // Get the blob data from the response
      const blob = await response.blob();

      // Download the file
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `${filename}.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);

      await logActivity('resume_export_api', `Exported resume via API: ${filename}.${format}`);
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to export resume via API: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('API export failed:', error);
    throw error;
  }
};