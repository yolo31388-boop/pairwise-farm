const { Genetics, TRAITS } = require('./genetics.js');

// 基因型与环境的交互：显性与隐性表型对环境因子有不同的最适需求。
const TRAIT_ENVIRONMENT = {
  color: { factor: 'light', dominantNeed: 0.8, recessiveNeed: 0.3 },
  size: { factor: 'water', dominantNeed: 0.7, recessiveNeed: 0.4 },
};

let nextCropId = 1;

class Crop {
  constructor(genotype, options = {}) {
    const genes = (genotype && (genotype.genes || genotype.genotype)) || genotype || {};
    this.genotype = {};
    for (const trait of Object.keys(genes)) {
      const pair = genes[trait];
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error(`性状 ${trait} 的基因型必须是成对等位基因`);
      }
      this.genotype[trait] = [...pair];
    }
    this.id = options.id ?? nextCropId++;
    this.genetics = options.genetics || new Genetics();
    this.growth = 0;
    this.generation = options.generation ?? 0;
    this.inbreeding = options.inbreeding ?? 0;
    this.vigor = options.vigor ?? Math.max(0.2, 1 - 0.5 * this.inbreeding);
    this.parents = options.parents ? [...options.parents] : [];
  }

  // 生长 = 基因型表达与环境因子的匹配度 × 土壤 × 活力（近交衰退）。
  update(dt, environment = {}) {
    const phenotype = this.genetics.getPhenotype(this.genotype);
    const soil = environment.soil ?? 0.5;
    let matchSum = 0;
    let matchCount = 0;
    for (const trait of Object.keys(this.genotype)) {
      const spec = TRAIT_ENVIRONMENT[trait];
      if (!spec) continue;
      const def = TRAITS[trait];
      const isDominantExpression = def
        ? phenotype[trait] === def.dominantPhenotype
        : phenotype[trait] === 'dominant';
      const need = isDominantExpression ? spec.dominantNeed : spec.recessiveNeed;
      const envValue = environment[spec.factor] ?? 0.5;
      matchSum += 1 - Math.abs(need - envValue);
      matchCount += 1;
    }
    const genotypeEnvironmentMatch = matchCount > 0 ? matchSum / matchCount : 1;
    this.growth += dt * this.vigor * soil * genotypeEnvironmentMatch;
    return this.growth;
  }

  // 收获的种子完整保留亲本基因型（独立副本，不退化为默认品种）。
  harvest() {
    const genotype = {};
    for (const trait of Object.keys(this.genotype)) genotype[trait] = [...this.genotype[trait]];
    return { genotype, vigor: this.vigor, generation: this.generation };
  }

  // 表型 → 视觉外观。
  getAppearance() {
    const phenotype = this.genetics.getPhenotype(this.genotype);
    return { ...phenotype, vigor: this.vigor, growth: this.growth };
  }

  // 表型 → 属性值。
  getAttributes() {
    const phenotype = this.genetics.getPhenotype(this.genotype);
    return {
      yield: (phenotype.size === 'large' ? 2 : 1) * this.vigor,
      quality: (phenotype.color === 'red' ? 1 : 0.6) * this.vigor,
      vigor: this.vigor,
    };
  }
}

module.exports = { Crop, TRAIT_ENVIRONMENT };
