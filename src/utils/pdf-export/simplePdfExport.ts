import { resumeBuilderApi } from '../resumeBuilderApi';

/**
 * SIMPLE PDF EXPORT - Send resume data to backend for rendering and PDF generation
 * Backend handles template rendering, styling, and PDF generation
 */
export const exportResumeAsSimplePDF = async (
  elementId: string,
  filename: string,
  templateId: string,
  color: string,
  resumeData?: any
): Promise<void> => {
  try {
    console.log('Simple PDF Export - Starting:', { elementId, filename, templateId, color });

    // If no resume data provided, we need to extract it from the page
    if (!resumeData) {
      throw new Error('Resume data is required for backend PDF generation');
    }

    console.log('Simple PDF Export - Resume data available:', !!resumeData);
    console.log('Simple PDF Export - Sending to backend...');
    
    // Prepare payload with resume data for backend rendering
    const payload = {
      resumeData: resumeData,
      templateId: templateId,
      color: color,
      filename: filename
    };
    
    console.log('Simple PDF Export - Payload size:', JSON.stringify(payload).length);

    // Send to backend for template rendering and PDF generation
    const { data: pdfBlob, error } = await resumeBuilderApi.generatePDFFromData(payload);

    if (error) {
      throw new Error(`Backend PDF generation failed: ${error}`);
    }

    if (!pdfBlob) {
      throw new Error('No PDF data received from backend');
    }

    // Download the PDF
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Simple PDF Export - Success!');
  } catch (error) {
    console.error('Simple PDF Export - Error:', error);
    throw error;
  }
};