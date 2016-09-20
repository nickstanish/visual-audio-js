
import * as MathUtils from 'utils/math';
import RandomsStore from 'data/RandomsStore'

const DEFAULT_MAX_PARTICLES = 1e5;
const DPR = window.devicePixelRatio;


// adapted from http://threejs.org/examples/webgl_gpu_particle_system.html - http://charliehoey.com/
class GPUParticleContainer {
  constructor(maxParticles) {
    this.PARTICLE_COUNT = maxParticles || DEFAULT_MAX_PARTICLES;
    this.PARTICLE_CURSOR = 0;
    this.time = 0;
    this.randomsStore = new RandomsStore(() => MathUtils.getRandom(-1, 1));

    // const particlesPerArray = Math.floor(this.PARTICLE_COUNT / this.MAX_ATTRIBUTES);
    this.particles = [];
    this.deadParticles = [];
    this.particlesAvailableSlot = [];

    // create a container for particles
    this.particleUpdate = false;

    // new hyper compressed attributes
    this.particleBuffers = {
      vertices: new Float32Array(this.PARTICLE_COUNT * 3),
      positionsStartTime: new Float32Array(this.PARTICLE_COUNT * 4),
      velColSizeLife: new Float32Array(this.PARTICLE_COUNT * 4)
    };

    this.geometryPosStart = new Float32Array(this.PARTICLE_COUNT * 4);
    this.geometryVelCol = new Float32Array(this.PARTICLE_COUNT * 4);

    this.offset = 0;
    this.count = 0;
  }

  init (gl) {

    this.geometryPosStartBuffer = gl.createBuffer();
    this.geometryVelColBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryPosStartBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.geometryPosStart, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryVelColBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.geometryVelCol, gl.DYNAMIC_DRAW);


    const { vertices, positionsStartTime, velColSizeLife } = this.particleBuffers;
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const ix4 = i * 4;
      const ix3 = i * 3;
      positionsStartTime[ix4] = 0; //x
      positionsStartTime[ix4 + 1] = 0; //y
      positionsStartTime[ix4 + 2] = 0; //z
      positionsStartTime[ix4 + 3] = 0; //startTime

      vertices[ix3] = 0; //x
      vertices[ix3 + 1] = 0; //y
      vertices[ix3 + 2] = 0; //z

      velColSizeLife[ix4] = MathUtils.decodeFloat(128, 128, 0, 0); //vel
      velColSizeLife[ix4 + 1] = MathUtils.decodeFloat(0, 255, 0, 255); //color
      velColSizeLife[ix4 + 2] = 1.0; //size
      velColSizeLife[ix4 + 3] = 0; //lifespan
    }
  }

  spawnParticle (options) {
    options = options || {};

    let position = [0,0,0],
      velocity = [0,0,0],
      positionRandomness = 0.,
      velocityRandomness = 0.,
      color = 0xffffff,
      colorRandomness = 0.,
      turbulence = 0.,
      lifetime = 0.,
      size = 0.,
      sizeRandomness = 0.,
      smoothPosition;

    const maxVel = 2;
    const maxSource = 250;

    // setup reasonable default values for all arguments
    position = options.position !== undefined ? options.position : position;
    velocity = options.velocity !== undefined ? options.velocity : velocity;
    positionRandomness = options.positionRandomness !== undefined ? options.positionRandomness : 0.0;
    velocityRandomness = options.velocityRandomness !== undefined ? options.velocityRandomness : 0.0;
    color = options.color !== undefined ? options.color : 0xffffff;
    colorRandomness = options.colorRandomness !== undefined ? options.colorRandomness : 1.0;
    turbulence = options.turbulence !== undefined ? options.turbulence : 1.0;
    lifetime = options.lifetime !== undefined ? options.lifetime : 5.0;
    size = options.size !== undefined ? options.size : 10;
    sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 0.0,
      smoothPosition = options.smoothPosition !== undefined ? options.smoothPosition : false;

    if (DPR !== undefined) size *= DPR;

    const i = this.PARTICLE_CURSOR;

    this.geometryPosStart[i * 4 + 0] = position[0] + ((this.randomsStore.random()) * positionRandomness); // - ( velocity.x * this.randomsStore.random() ); //x
    this.geometryPosStart[i * 4 + 1] = position[1] + ((this.randomsStore.random()) * positionRandomness); // - ( velocity.y * this.randomsStore.random() ); //y
    this.geometryPosStart[i * 4 + 2] = position[2] + ((this.randomsStore.random()) * positionRandomness); // - ( velocity.z * this.randomsStore.random() ); //z
    this.geometryPosStart[i * 4 + 3] = this.time; //startTime

    if (smoothPosition === true) {
      this.geometryPosStart[i * 4 + 0] += -(velocity[0] * this.randomsStore.random()); //x
      this.geometryPosStart[i * 4 + 1] += -(velocity[1] * this.randomsStore.random()); //y
      this.geometryPosStart[i * 4 + 2] += -(velocity[2] * this.randomsStore.random()); //z
    }

    let velX = velocity[0] + (this.randomsStore.random()) * velocityRandomness;
    let velY = velocity[1] + (this.randomsStore.random()) * velocityRandomness;
    let velZ = velocity[2] + (this.randomsStore.random()) * velocityRandomness;
    // convert turbulence rating to something we can pack into a vec4
    turbulence = Math.floor(turbulence * 255);

    // clamp our value to between 0. and 1.
    velX = Math.floor(maxSource * ((velX - -maxVel) / (maxVel - -maxVel)));
    velY = Math.floor(maxSource * ((velY - -maxVel) / (maxVel - -maxVel)));
    velZ = Math.floor(maxSource * ((velZ - -maxVel) / (maxVel - -maxVel)));



    this.geometryVelCol[i * 4 + 0] = MathUtils.decodeFloat(velX, velY, velZ, turbulence); //vel

    const rgb = MathUtils.hexToRgb(color);

    for (let c = 0; c < rgb.length; c++) {
      rgb[c] = Math.floor(rgb[c] + ((this.randomsStore.random()) * colorRandomness) * 255);
      if (rgb[c] >= 255) rgb[c] = 255;
      if (rgb[c] <= 0) rgb[c] = 0;
    }

    this.geometryVelCol[i * 4 + 1] = MathUtils.decodeFloat(rgb[0], rgb[1], rgb[2], 255); //color
    this.geometryVelCol[i * 4 + 2] = size + (this.randomsStore.random()) * sizeRandomness; //size
    this.geometryVelCol[i * 4 + 3] = lifetime; //lifespan

    if (this.offset == 0) {
      this.offset = this.PARTICLE_CURSOR;
    }

    this.count++;

    this.PARTICLE_CURSOR++;

    if (this.PARTICLE_CURSOR >= this.PARTICLE_COUNT) {
      this.PARTICLE_CURSOR = 0;
    }

    this.particleUpdate = true;
  }

  update (time, gl) {
    this.time = time;
    // this.particleShaderMat.uniforms['uTime'].value = time;

    this.geometryUpdate(gl);
  }

  geometryUpdate (gl) {
    if (this.particleUpdate == true) {
      this.particleUpdate = false;

      // if we can get away with a partial buffer update, do so

      if (this.count < this.PARTICLE_COUNT) {
        const beginIndex = this.offset * 4;
        const endIndex = beginIndex + (this.count * 4);
        const bufferOffset = beginIndex * 4; // 4 bytes per Float32

        gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryPosStartBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, bufferOffset, this.geometryPosStart.subarray(beginIndex, endIndex));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryVelColBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, bufferOffset, this.geometryVelCol.subarray(beginIndex, endIndex));

      } else {
        gl.bufferData(gl.ARRAY_BUFFER, this.geometryPosStart, gl.DYNAMIC_DRAW);
        gl.bufferData(gl.ARRAY_BUFFER, this.geometryVelColBuffer, gl.DYNAMIC_DRAW);
      }

      this.offset = 0;
      this.count = 0;
    }
  }
}

export default GPUParticleContainer;
