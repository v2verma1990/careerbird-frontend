
import api from './apiClient';

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
