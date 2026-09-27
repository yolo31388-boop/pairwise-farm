

class Crop {
  constructor(genotype) { this.genotype = genotype; this.growth = 0; this.genetics = new Genetics(); }
  update(dt, environment) {
    // BUG: 只看基因不看环境
    this.growth += 1;
  }
  harvest() {
    // BUG: 种子退化成默认
    return {genotype: {color: 'red', size: 'medium'}};
  }
}

module.exports = { Crop };
