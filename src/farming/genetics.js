
class Genetics {
  constructor() {}
  // BUG: 随机选择而不是孟德尔遗传
  cross(parent1, parent2) {
    const child = {};
    for (const trait of Object.keys(parent1.genes)) {
      child[trait] = Math.random() > 0.5 ? parent1.genes[trait] : parent2.genes[trait];
    }
    return {genes: child};
  }
  getPhenotype(genotype) {
    // BUG: 不区分显隐性
    return genotype;
  }
}

module.exports = { Genetics };
