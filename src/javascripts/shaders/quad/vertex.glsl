attribute vec2 inCoord;

varying vec2 coord;

void main(void) {
  gl_Position = vec4((inCoord * 2.0) - vec2(1.0), 0.0, 1.0);
  coord = inCoord;
}
