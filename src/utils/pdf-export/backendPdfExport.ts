import { resumeBuilderApi } from '../resumeBuilderApi';

/**
 * BACKEND PDF EXPORT - Send only resume data to backend
 * Backend handles template rendering and PDF generation
 */
export const exportResumeAsBackendPDF = async (
  resumeData: any,
  filename: string,
  templateId: string,
  color: string
): Promise<void> => {
  try {
    console.log('Backend PDF Export - Starting:', { filename, templateId, color });

    // Prepare payload with just the data
    const payload = {
      resumeData: resumeData,
      templateId: templateId,
      color: color,
      filename: filename
    };
    
    console.log('Backend PDF Export - Payload size:', JSON.stringify(payload).length);

    // Send to backend for PDF generation
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

    console.log('Backend PDF Export - Success!');
  } catch (error) {
    console.error('Backend PDF Export - Error:', error);
    throw error;
  }
};