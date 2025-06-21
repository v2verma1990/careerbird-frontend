/**
 * Legacy Template Service - DEPRECATED
 * Use templateRenderingService instead for all new implementations
 * This is kept for backward compatibility only
 */

import { templateRenderingService } from './templateRenderingService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

export const templateService = {
  /**
   * @deprecated Use templateRenderingService.getTemplateCss() instead
   */
  async getTemplateCss(templateId: string, color?: string): Promise<string> {
    console.warn('templateService.getTemplateCss is deprecated. Use templateRenderingService.getTemplateCss() instead');
    
    if (color) {
      return templateRenderingService.getTemplateCss(templateId, color);
    }
    
    // Fallback for backward compatibility
    try {
      const url = new URL(`${API_BASE_URL}/template/${templateId}/css`);
      if (color) {
        url.searchParams.append('color', color);
        url.searchParams.append('timestamp', Date.now().toString());
      }
      
      const response = await fetch(url.toString(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template CSS: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Template CSS fetch error:', error);
      throw error;
    }
  },

  /**
   * @deprecated Use templateRenderingService for complete template rendering
   */
  async getTemplateHtml(templateId: string): Promise<string> {
    console.warn('templateService.getTemplateHtml is deprecated. Use templateRenderingService.renderResume() instead');
    
    try {
      const url = `${API_BASE_URL}/template/${templateId}/html`;
      
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template HTML: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Template HTML fetch error:', error);
      throw error;
    }
  }
};