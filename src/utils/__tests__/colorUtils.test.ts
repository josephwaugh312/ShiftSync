import {
  hexToRgb,
  rgbToHex,
  adjustColor,
  getColorPalette,
  applyThemeColor,
} from '../colorUtils';

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('should convert valid hex colors to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle hex colors without # prefix', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should handle lowercase hex colors', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#abcdef')).toEqual({ r: 171, g: 205, b: 239 });
    });

    it('should handle mixed case hex colors', () => {
      expect(hexToRgb('#Ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#AbCdEf')).toEqual({ r: 171, g: 205, b: 239 });
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB values to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should handle edge cases for RGB values', () => {
      expect(rgbToHex(171, 205, 239)).toBe('#abcdef');
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
    });

    it('should produce hex values that can round-trip through hexToRgb', () => {
      const testCases = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [171, 205, 239],
        [128, 64, 192],
      ];

      testCases.forEach(([r, g, b]) => {
        const hex = rgbToHex(r, g, b);
        const backToRgb = hexToRgb(hex);
        expect(backToRgb).toEqual({ r, g, b });
      });
    });
  });

  describe('adjustColor', () => {
    it('should lighten colors with positive amounts', () => {
      const result = adjustColor('#808080', 50);
      const { r, g, b } = hexToRgb(result);
      expect(r).toBe(178); // 128 + 50
      expect(g).toBe(178);
      expect(b).toBe(178);
    });

    it('should darken colors with negative amounts', () => {
      const result = adjustColor('#808080', -50);
      const { r, g, b } = hexToRgb(result);
      expect(r).toBe(78); // 128 - 50
      expect(g).toBe(78);
      expect(b).toBe(78);
    });

    it('should not exceed maximum RGB values (255)', () => {
      const result = adjustColor('#FFFFFF', 50);
      const { r, g, b } = hexToRgb(result);
      expect(r).toBe(255);
      expect(g).toBe(255);
      expect(b).toBe(255);
    });

    it('should not go below minimum RGB values (0)', () => {
      const result = adjustColor('#000000', -50);
      const { r, g, b } = hexToRgb(result);
      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it('should handle individual RGB channels hitting limits', () => {
      // Test red channel hitting max while others don't
      const result = adjustColor('#FF8080', 50);
      const { r, g, b } = hexToRgb(result);
      expect(r).toBe(255); // Was 255, stays 255
      expect(g).toBe(178); // Was 128, becomes 178
      expect(b).toBe(178); // Was 128, becomes 178
    });

    it('should handle zero adjustment', () => {
      const original = '#808080';
      const result = adjustColor(original, 0);
      expect(result).toBe(original);
    });
  });

  describe('getColorPalette', () => {
    it('should generate a complete color palette from base color', () => {
      const palette = getColorPalette('#808080');
      
      // Should have all expected levels
      const expectedLevels = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      expectedLevels.forEach(level => {
        expect(palette[level]).toBeDefined();
        expect(typeof palette[level]).toBe('string');
        expect(palette[level]).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should keep base color at level 500', () => {
      const baseColor = '#ff6b35';
      const palette = getColorPalette(baseColor);
      expect(palette[500]).toBe(baseColor);
    });

    it('should generate progressively lighter shades for 100-400', () => {
      const palette = getColorPalette('#808080');
      
      // Extract RGB values for comparison
      const getRgbSum = (hex: string) => {
        const { r, g, b } = hexToRgb(hex);
        return r + g + b;
      };

      // Lower levels should be lighter (higher RGB sum)
      expect(getRgbSum(palette[100])).toBeGreaterThan(getRgbSum(palette[200]));
      expect(getRgbSum(palette[200])).toBeGreaterThan(getRgbSum(palette[300]));
      expect(getRgbSum(palette[300])).toBeGreaterThan(getRgbSum(palette[400]));
      expect(getRgbSum(palette[400])).toBeGreaterThan(getRgbSum(palette[500]));
    });

    it('should generate progressively darker shades for 600-900', () => {
      const palette = getColorPalette('#808080');
      
      // Extract RGB values for comparison
      const getRgbSum = (hex: string) => {
        const { r, g, b } = hexToRgb(hex);
        return r + g + b;
      };

      // Higher levels should be darker (lower RGB sum)
      expect(getRgbSum(palette[500])).toBeGreaterThan(getRgbSum(palette[600]));
      expect(getRgbSum(palette[600])).toBeGreaterThan(getRgbSum(palette[700]));
      expect(getRgbSum(palette[700])).toBeGreaterThan(getRgbSum(palette[800]));
      expect(getRgbSum(palette[800])).toBeGreaterThan(getRgbSum(palette[900]));
    });

    it('should handle extreme colors appropriately', () => {
      // Test with very light color
      const lightPalette = getColorPalette('#f0f0f0');
      expect(lightPalette[100]).toBeDefined();
      expect(lightPalette[900]).toBeDefined();

      // Test with very dark color
      const darkPalette = getColorPalette('#101010');
      expect(darkPalette[100]).toBeDefined();
      expect(darkPalette[900]).toBeDefined();
    });
  });

  describe('applyThemeColor', () => {
    let mockSetProperty: jest.SpyInstance;
    let mockGetPropertyValue: jest.SpyInstance;

    beforeEach(() => {
      // Mock document.documentElement.style.setProperty
      mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: {
          setProperty: mockSetProperty,
        },
        writable: true,
      });

      // Mock getComputedStyle
      mockGetPropertyValue = jest.fn().mockReturnValue('#808080');
      global.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: mockGetPropertyValue,
      });

      // Mock console.log to reduce test noise
      jest.spyOn(console, 'log').mockImplementation(() => {});

      // Mock setTimeout
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should set CSS custom properties for all palette levels', () => {
      const testColor = '#ff6b35';
      applyThemeColor(testColor);

      // Should call setProperty for each palette level
      const expectedLevels = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      expect(mockSetProperty).toHaveBeenCalledTimes(expectedLevels.length);

      expectedLevels.forEach(level => {
        expect(mockSetProperty).toHaveBeenCalledWith(
          `--color-primary-${level}`,
          expect.stringMatching(/^#[0-9a-f]{6}$/i)
        );
      });
    });

    it('should set the base color at level 500', () => {
      const testColor = '#ff6b35';
      applyThemeColor(testColor);

      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary-500', testColor);
    });

    it('should verify CSS variables after timeout', () => {
      const testColor = '#ff6b35';
      applyThemeColor(testColor);

      // Fast-forward past the setTimeout
      jest.advanceTimersByTime(100);

      // Should call getComputedStyle to verify variables
      expect(global.getComputedStyle).toHaveBeenCalledWith(document.documentElement);
    });

    it('should log the color application process', () => {
      const testColor = '#ff6b35';
      const consoleSpy = jest.spyOn(console, 'log');

      applyThemeColor(testColor);

      expect(consoleSpy).toHaveBeenCalledWith('Applying theme color:', testColor);
      expect(consoleSpy).toHaveBeenCalledWith('Generated palette:', expect.any(Object));
    });

    it('should handle different color formats', () => {
      // Test with different valid hex formats
      const testCases = ['#FF0000', '#ff0000', 'FF0000'];
      
      testCases.forEach(color => {
        mockSetProperty.mockClear();
        applyThemeColor(color);
        
        // Should still set all palette levels
        expect(mockSetProperty).toHaveBeenCalledTimes(9);
      });
    });
  });

  describe('integration tests', () => {
    it('should maintain color relationships through the complete pipeline', () => {
      const baseColor = '#3b82f6'; // A nice blue
      const palette = getColorPalette(baseColor);
      
      // Test that we can convert colors back and forth
      Object.values(palette).forEach(color => {
        const rgb = hexToRgb(color);
        const backToHex = rgbToHex(rgb.r, rgb.g, rgb.b);
        
        // Should round-trip successfully
        expect(hexToRgb(backToHex)).toEqual(rgb);
      });
    });

    it('should produce valid CSS color values', () => {
      const palette = getColorPalette('#ff6b35');
      
      Object.values(palette).forEach(color => {
        // Should be valid hex format
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        
        // Should be parseable as RGB
        const rgb = hexToRgb(color);
        expect(rgb.r).toBeGreaterThanOrEqual(0);
        expect(rgb.r).toBeLessThanOrEqual(255);
        expect(rgb.g).toBeGreaterThanOrEqual(0);
        expect(rgb.g).toBeLessThanOrEqual(255);
        expect(rgb.b).toBeGreaterThanOrEqual(0);
        expect(rgb.b).toBeLessThanOrEqual(255);
      });
    });
  });
}); 