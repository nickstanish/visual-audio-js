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
