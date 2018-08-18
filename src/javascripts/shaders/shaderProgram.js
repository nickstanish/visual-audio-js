function compileShader(gl, name, source, type) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log("An error occurred compiling the shaders: ", gl.getShaderInfoLog(shader), name);
    return null;
  }

  return shader;
}

class ShaderProgram {
  constructor(config = {}) {
    this.config = config;
    this.attribute = {};
    this.uniform = {};
    this.program = null;
  }

  compile (gl) {
    const { config } = this;
    const { vertex: vertexSource, fragment: fragmentSource } = config;

    const vertexShader = compileShader(gl, config.vertex, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, config.fragment, fragmentSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    this.program = program;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    if (config.attributes) {
      Object.keys(config.attributes).forEach(key => {
        const attributeName = config.attributes[key];
        const attribute = gl.getAttribLocation(program, attributeName);
        this.attribute[attributeName] = attribute;
      });
    }

    if (config.uniforms) {
      Object.keys(config.uniforms).forEach(key => {
        const uniformName = config.uniforms[key];
        const uniform = gl.getUniformLocation(program, uniformName);
        this.uniform[uniformName] = uniform;
      });
    }
  }

  getUniformLocation (name) {
    return this.uniform[name];
  }

  getAttribLocation (name) {
    return this.attribute[name];
  }

  getProgram () {
    return this.program;
  }
}

export default ShaderProgram;
