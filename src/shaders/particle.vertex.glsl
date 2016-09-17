/**
* Copyright 2015 Nick Stanish
*
*/


attribute vec3 inCoord;
// attribute vec3 inColor;
attribute float inAlive;
attribute float inAge;
attribute float inType;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform float intensity;
uniform vec3 inColors[8];
uniform float inFreqs[8];
uniform float isPlaying;


varying vec2 coord;
varying float alive;
varying vec3 color;
varying float age;
varying float particleType;

// const vec3 colorWhite = vec3(1., 1., 1.);

void main(void) {
  alive = inAlive;
  age = inAge / 1000.0;
  particleType = inType;

  gl_Position = uPMatrix * uMVMatrix * vec4(inCoord, 1.0);
  float value = 0.0;
  // if (intensity >= 0.0) {
  //  value = intensity;
  // }
  if (isPlaying > 0.0) {
    value = inFreqs[int(particleType)];
    gl_PointSize = 10.0 + (value * 90.0);

  } else {
    gl_PointSize = 50.0;
  }

  coord = inCoord.xy;
  color = inColors[int(particleType)];


}
