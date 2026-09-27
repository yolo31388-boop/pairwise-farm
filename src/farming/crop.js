const { Genetics } = require('./genetics.js');

let nextCropId = 1;

class Crop {
  constructor(genotype, options = {}) {
    this.genetics = options.genetics || new Genetics();
    this.genotype = this.genetics.validateGenotype(genotype);
    this.id = options.id !== undefined ? options.id : nextCropId++;
    this.growth = 0;
    this.inbreeding = options.inbreeding || 0;
    this.vigor = options.vigor !== undefined ? options.vigor : Math.max(0.1, 1 - this.inbreeding);
    this.ancestors = options.ancestors || new Set();
    this.parents = options.parents || [];
    this.phenotype = this.genetics.getPhenotype(this.genotype);
    this.appearance = this.genetics.getAppearance(this.genotype);
    this.attributes = this.genetics.getAttributes(this.genotype);
  }

  // 生长 = 基因型 x 环境（光照/水分/土壤）交互，再乘活力（近交衰退）
  update(dt, environment = {}) {
    const light = environment.light !== undefined ? environment.light : 0.5;
    const water = environment.water !== undefined ? environment.water : 0.5;
    const soil = environment.soil !== undefined ? environment.soil : 0.5;
    // 基因-环境交互：小型植株（纯合隐性 ss）需水更少，耐旱
    const droughtTolerant = this.phenotype.size === 'small';
    const effectiveWater = droughtTolerant ? Math.min(1, water + 0.3) : water;
    const envQuality = (light + effectiveWater + soil) / 3;
    this.growth += dt * this.vigor * envQuality;
    return this.growth;
  }

  // 收获的种子完整保留本株基因型
  harvest() {
    const genotype = {};
    for (const locus of Object.keys(this.genotype)) {
      genotype[locus] = [...this.genotype[locus]];
    }
    return { genotype, vigor: this.vigor };
  }
}

module.exports = { Crop };
