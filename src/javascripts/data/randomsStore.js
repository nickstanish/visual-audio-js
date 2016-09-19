// generate a bunch of randoms and keep in memory

export const DEFAULT_MAX_RANDOMS = 1e4;

// function defaultRandomGenerator() {
//   return Math.random() - 0.5;
// }



class RandomsStore {
  constructor (generator = Math.random, maxRandoms = DEFAULT_MAX_RANDOMS) {
    this.MAX_RANDOMS = maxRandoms;
    this.randoms = new Float32Array(this.MAX_RANDOMS);
    this.init(generator);
    this.cursor = 0;
  }

  init (generator) {
    for (let i = 0; i < this.randoms.length; i++) {
      this.randoms[i] = generator();
    }
  }

  random() {
    if (this.cursor >= this.randoms.length) {
      this.cursor = 0;
    }
    return this.randoms[this.cursor++];
  }
}

export default RandomsStore;
