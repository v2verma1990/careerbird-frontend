const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

export const templateService = {
  async getTemplateCss(templateId: string, color?: string): Promise<string> {
    try {
      console.log('templateService.getTemplateCss - Called with:', { templateId, color });
      const url = new URL(`${API_BASE_URL}/template/${templateId}/css`);
      if (color) {
        url.searchParams.append('color', color);
        console.log('templateService.getTemplateCss - Added color parameter:', color);
      }
      
      console.log('Fetching template CSS from:', url.toString());
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch template CSS: ${response.status} ${response.statusText}`);
      }
      
      const css = await response.text();
      console.log('Successfully fetched template CSS, length:', css.length);
      
      // Log if the CSS contains the color we sent
      if (color) {
        const containsColor = css.includes(color);
        console.log('templateService.getTemplateCss - CSS contains sent color:', containsColor);
        if (!containsColor) {
          console.warn('templateService.getTemplateCss - CSS does not contain the sent color!', { sentColor: color });
          // Log a snippet of the CSS to see what colors are actually in it
          const cssSnippet = css.substring(0, 1000);
          console.log('templateService.getTemplateCss - CSS snippet:', cssSnippet);
        }
      }
      
      return css;
    } catch (error) {
      console.error('Template CSS fetch error:', error);
      throw error;
    }
  },

  async getTemplateHtml(templateId: string): Promise<string> {
    try {
      const url = `${API_BASE_URL}/template/${templateId}/html`;
      console.log('Fetching template HTML from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch template HTML: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log('Successfully fetched template HTML, length:', html.length);
      return html;
    } catch (error) {
      console.error('Template HTML fetch error:', error);
      throw error;
    }
  }
};