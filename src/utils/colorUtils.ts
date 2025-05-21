/**
 * Utility functions for working with colors
 */

// Helper to convert hex to RGB
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  // Remove # if it exists
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
};

// Helper to convert RGB to hex
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Adjust color lightness/darkness
export const adjustColor = (color: string, amount: number): string => {
  const { r, g, b } = hexToRgb(color);
  
  // Adjust each RGB component by the amount
  const limitValue = (value: number) => Math.min(255, Math.max(0, value));
  
  return rgbToHex(
    limitValue(r + amount),
    limitValue(g + amount),
    limitValue(b + amount)
  );
};

// Get color levels from base color
export const getColorPalette = (baseColor: string): Record<number, string> => {
  // Ensure baseColor is at the middle (500) level
  const palette: Record<number, string> = {
    500: baseColor
  };
  
  // Generate lighter shades (100-400)
  palette[100] = adjustColor(baseColor, 150);
  palette[200] = adjustColor(baseColor, 110);
  palette[300] = adjustColor(baseColor, 70);
  palette[400] = adjustColor(baseColor, 30);
  
  // Generate darker shades (600-900)
  palette[600] = adjustColor(baseColor, -30);
  palette[700] = adjustColor(baseColor, -60);
  palette[800] = adjustColor(baseColor, -90);
  palette[900] = adjustColor(baseColor, -120);
  
  return palette;
};

// Apply theme colors to CSS variables
export const applyThemeColor = (color: string): void => {
  const root = document.documentElement;
  const palette = getColorPalette(color);
  
  console.log('Applying theme color:', color);
  console.log('Generated palette:', palette);
  
  // Set the CSS variables for each color level
  Object.entries(palette).forEach(([level, colorValue]) => {
    const variableName = `--color-primary-${level}`;
    root.style.setProperty(variableName, colorValue);
    console.log(`Setting ${variableName} to ${colorValue}`);
  });

  // Verify variables were set
  setTimeout(() => {
    console.log('Verifying CSS variables:');
    Object.keys(palette).forEach(level => {
      const variableName = `--color-primary-${level}`;
      const computedValue = getComputedStyle(root).getPropertyValue(variableName);
      console.log(`${variableName} = ${computedValue}`);
    });
  }, 100);
}; 