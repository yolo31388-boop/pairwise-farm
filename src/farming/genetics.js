// 孟德尔遗传引擎：基因型为成对等位基因，杂交经配子分离与自由组合产生后代。

const TRAITS = {
  color: { dominant: 'R', recessive: 'r', dominantPhenotype: 'red', recessivePhenotype: 'white' },
  size: { dominant: 'S', recessive: 's', dominantPhenotype: 'large', recessivePhenotype: 'small' },
};

const DEFAULT_MUTATION_RATE = 0.0001;

class Genetics {
  constructor(mutationRate = DEFAULT_MUTATION_RATE) {
    this.mutationRate = mutationRate;
    this.mutationCounter = 0;
  }

  normalizeGenes(parent) {
    if (!parent || typeof parent !== 'object') {
      throw new Error('亲本必须携带基因型');
    }
    return parent.genes || parent.genotype || parent;
  }

  assertPair(trait, pair) {
    if (!Array.isArray(pair) || pair.length !== 2) {
      throw new Error(`性状 ${trait} 的基因型必须是成对等位基因`);
    }
  }

  isDominantAllele(trait, allele) {
    const def = TRAITS[trait];
    if (def) return allele === def.dominant;
    return typeof allele === 'string' && /^[A-Z]/.test(allele);
  }

  // 分离定律：成对等位基因分离进入配子；多基因按自由组合产生全部配子类型。
  getGametes(parent) {
    const genes = this.normalizeGenes(parent);
    let gametes = [{}];
    for (const trait of Object.keys(genes)) {
      const pair = genes[trait];
      this.assertPair(trait, pair);
      const next = [];
      for (const gamete of gametes) {
        for (const allele of pair) next.push({ ...gamete, [trait]: allele });
      }
      gametes = next;
    }
    return gametes;
  }

  // 突变：极低概率产生新等位基因。
  mutateAllele(allele) {
    if (Math.random() >= this.mutationRate) return allele;
    this.mutationCounter += 1;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const base = letters[Math.floor(Math.random() * letters.length)];
    return `${base}*${this.mutationCounter}`;
  }

  // 杂交：每个亲本按分离定律随机贡献一个配子等位基因，组合成子代成对基因型。
  cross(parent1, parent2) {
    const genes1 = this.normalizeGenes(parent1);
    const genes2 = this.normalizeGenes(parent2);
    const traits = [...new Set([...Object.keys(genes1), ...Object.keys(genes2)])];
    const child = {};
    for (const trait of traits) {
      const pair1 = genes1[trait] || genes2[trait];
      const pair2 = genes2[trait] || genes1[trait];
      this.assertPair(trait, pair1);
      this.assertPair(trait, pair2);
      const allele1 = this.mutateAllele(pair1[Math.floor(Math.random() * 2)]);
      const allele2 = this.mutateAllele(pair2[Math.floor(Math.random() * 2)]);
      child[trait] = [allele1, allele2];
    }
    return { genes: child };
  }

  // 显隐性表达：携带显性等位基因表现显性性状，纯合隐性才表现隐性性状。
  getPhenotype(genotype) {
    const genes = this.normalizeGenes(genotype);
    const phenotype = {};
    for (const trait of Object.keys(genes)) {
      const pair = genes[trait];
      this.assertPair(trait, pair);
      const def = TRAITS[trait];
      const dominant = this.isDominantAllele(trait, pair[0]) || this.isDominantAllele(trait, pair[1]);
      if (def) phenotype[trait] = dominant ? def.dominantPhenotype : def.recessivePhenotype;
      else phenotype[trait] = dominant ? 'dominant' : 'recessive';
    }
    return phenotype;
  }

  // 多基因组合概率：逐基因庞纳特方格，再按自由组合定律相乘。
  getOffspringDistribution(parent1, parent2) {
    const genes1 = this.normalizeGenes(parent1);
    const genes2 = this.normalizeGenes(parent2);
    let distribution = { '': 1 };
    for (const trait of Object.keys(genes1)) {
      const pair1 = genes1[trait];
      const pair2 = genes2[trait] || pair1;
      this.assertPair(trait, pair1);
      this.assertPair(trait, pair2);
      const counts = {};
      for (const a1 of pair1) {
        for (const a2 of pair2) {
          const phen = this.getPhenotype({ [trait]: [a1, a2] })[trait];
          counts[phen] = (counts[phen] || 0) + 1;
        }
      }
      const total = pair1.length * pair2.length;
      const next = {};
      for (const [key, prob] of Object.entries(distribution)) {
        for (const [phen, count] of Object.entries(counts)) {
          const newKey = key ? `${key}|${trait}:${phen}` : `${trait}:${phen}`;
          next[newKey] = (next[newKey] || 0) + (prob * count) / total;
        }
      }
      distribution = next;
    }
    return distribution;
  }
}

module.exports = { Genetics, TRAITS, DEFAULT_MUTATION_RATE };
