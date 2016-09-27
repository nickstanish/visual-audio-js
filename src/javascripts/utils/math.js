export function degreesToRadians (degrees) {
  return degrees * (Math.PI / 180.0);
}

export function radiansToDegrees (radians) {
  return radians * (180.0 / Math.PI);
}

/**
* Inclusive [min, max]
*/
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}


// construct a couple small arrays used for packing variables into floats etc
const UINT8_VIEW = new Uint8Array(4);
const FLOAT_VIEW = new Float32Array(UINT8_VIEW.buffer);

export function decodeFloat(x, y, z, w) {
  UINT8_VIEW[0] = Math.floor(w);
  UINT8_VIEW[1] = Math.floor(z);
  UINT8_VIEW[2] = Math.floor(y);
  UINT8_VIEW[3] = Math.floor(x);
  return FLOAT_VIEW[0]
}

export function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function rgbToValue(r, g, b) {
  return (r << 16) + (g << 8) + b;
}

export function hexToRgb(hex) {
  let r = hex >> 16;
  let g = (hex & 0x00FF00) >> 8;
  let b = hex & 0x0000FF;

  if (r > 0) r--;
  if (g > 0) g--;
  if (b > 0) b--;

  return [r, g, b];
}


/**
 * normalize - scales the number to be between 0 and 1
 *
 * @param  {Number} value number between min and max
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
export function normalize(value, min = 0, max = 0) {
  if (min === max) {
    return 1;
  }
  return (value - min) / (max - min);
}
export function clamp(value, min = 0, max = 1) {
  if (value >= max) {
    return max;
  } else if (value <= min){
    return min;
  } else {
    return value;
  }
}
