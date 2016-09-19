
class Clock {
  constructor (shouldAutoStart = true) {
    this.autoStart = shouldAutoStart;
    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;
    this.running = false;
  }

  start() {
    this.startTime = Date.now();
    this.oldTime = this.startTime;
    this.running = true;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
  }

  getElapsedTime() {
    this.elapsedTime += this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    let diff = 0;

    if (this.autoStart && !this.running ) {
      this.start();
    }

    if (this.running ) {
      const newTime = Date.now();
      diff = 0.001 * ( newTime - this.oldTime );
      this.oldTime = newTime;
      this.elapsedTime += diff;
    }

    return diff;
  }

}

export default Clock;
