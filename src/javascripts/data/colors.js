import { rgbToHex, rgbToValue } from 'utils/math';

class RGBColor {
  constructor(red, green, blue) {
    this.r = red;
    this.g = green;
    this.b = blue;
  }

  toHexString() {
    const { r, g, b } = this;
    return rgbToHex(r, g, b);
  }

  toValue() {
    const { r, g, b } = this;
    return rgbToValue(r, g, b);
  }

  toArray() {
    const { r, g, b } = this;
    return [r, g, b];
  }
}

export const COLOR_MAP = {
  red: new RGBColor(244, 67, 54),
  purple: new RGBColor(156, 39, 176),
  blue: new RGBColor(33, 150, 243),
  green: new RGBColor(76, 175, 80),
  yellow: new RGBColor(255, 235, 59),
  orange: new RGBColor(255, 152, 0),
  cyan: new RGBColor(0, 172, 193),
  pink: new RGBColor(233, 30, 99)
  // nightVision: 0x3EF1A5
};

export const COLORS = Object.keys(COLOR_MAP).map(key => COLOR_MAP[key]);
