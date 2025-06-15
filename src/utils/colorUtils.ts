/**
 * Converts a hex color code to an RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    // For shorthand hex (e.g., #ABC)
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 6) {
    // For full hex (e.g., #AABBCC)
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return null; // Invalid hex
  }

  return { r, g, b };
}

/**
 * Converts an RGB object to a hex color code
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Lightens a color by a given percentage
 */
export function lightenColor(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const { r, g, b } = rgb;
  const amount = Math.floor(255 * (percent / 100));

  const newR = Math.min(r + amount, 255);
  const newG = Math.min(g + amount, 255);
  const newB = Math.min(b + amount, 255);

  return rgbToHex(newR, newG, newB);
}

/**
 * Darkens a color by a given percentage
 */
export function darkenColor(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const { r, g, b } = rgb;
  const amount = Math.floor(255 * (percent / 100));

  const newR = Math.max(r - amount, 0);
  const newG = Math.max(g - amount, 0);
  const newB = Math.max(b - amount, 0);

  return rgbToHex(newR, newG, newB);
}

/**
 * Determines if a color is light or dark
 * Returns true if the color is light
 */
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return true;

  const { r, g, b } = rgb;
  // Calculate the perceived brightness using the formula:
  // (0.299*R + 0.587*G + 0.114*B)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If brightness is greater than 0.5, the color is considered light
  return brightness > 0.5;
}

/**
 * Generates a contrasting text color (black or white) based on the background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Generates a color palette based on a primary color
 */
export function generateColorPalette(primaryColor: string) {
  const primary = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;
  
  return {
    primary,
    primaryLight: lightenColor(primary, 20),
    primaryDark: darkenColor(primary, 20),
    secondary: lightenColor(primary, 40),
    accent: darkenColor(primary, 10),
    text: getContrastingTextColor(primary),
    textLight: isLightColor(primary) ? '#666666' : '#cccccc',
    background: isLightColor(primary) ? '#ffffff' : '#121212',
  };
}

/**
 * Converts a color to rgba format with specified opacity
 */
export function toRgba(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return `rgba(0, 0, 0, ${opacity})`;
  
  const { r, g, b } = rgb;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}