const TRAIT_MAP = {
  color: { dominant: 'red', recessive: 'white' },
  size: { dominant: 'large', recessive: 'small' },
};

const DEFAULT_MUTATION_RATE = 0.001;

function isDominant(allele) {
  return typeof allele === 'string' && /^[A-Z]/.test(allele);
}

function sortedLoci(obj) {
  return Object.keys(obj).sort();
}

function genotypeKey(genes) {
  return sortedLoci(genes)
    .map((locus) => `${locus}=${[...genes[locus]].sort().join(',')}`)
    .join('|');
}

function phenotypeKey(phenotype) {
  return sortedLoci(phenotype)
    .map((locus) => `${locus}=${phenotype[locus]}`)
    .join('|');
}

class Genetics {
  constructor(options = {}) {
    this.mutationRate = options.mutationRate !== undefined ? options.mutationRate : DEFAULT_MUTATION_RATE;
    this.traitMap = options.traitMap || TRAIT_MAP;
  }

  genotypeOf(parent) {
    const genes = parent && (parent.genes || parent.genotype);
    if (!genes) throw new Error('parent must carry a genotype (paired alleles)');
    return genes;
  }

  validateGenotype(genotype) {
    for (const locus of Object.keys(genotype)) {
      const pair = genotype[locus];
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error(`locus "${locus}" must have exactly two alleles`);
      }
    }
    return genotype;
  }

  mutateAllele(allele) {
    if (Math.random() < 0.5) {
      const head = allele[0];
      const flipped = head === head.toLowerCase() ? head.toUpperCase() : head.toLowerCase();
      return flipped + allele.slice(1);
    }
    const base = allele.replace(/\d+$/, '');
    return `${base}m${Math.floor(Math.random() * 1e6)}`;
  }

  // 孟德尔分离定律：每个基因座随机分离一个等位基因进入配子，各基因座自由组合
  makeGamete(genotype) {
    this.validateGenotype(genotype);
    const gamete = {};
    for (const locus of Object.keys(genotype)) {
      const pair = genotype[locus];
      let allele = pair[Math.random() < 0.5 ? 0 : 1];
      if (Math.random() < this.mutationRate) {
        allele = this.mutateAllele(allele);
      }
      gamete[locus] = allele;
    }
    return gamete;
  }

  cross(parent1, parent2) {
    const g1 = this.genotypeOf(parent1);
    const g2 = this.genotypeOf(parent2);
    const gamete1 = this.makeGamete(g1);
    const gamete2 = this.makeGamete(g2);
    const genes = {};
    const loci = [...new Set([...Object.keys(gamete1), ...Object.keys(gamete2)])];
    for (const locus of loci) {
      const a1 = gamete1[locus] !== undefined ? gamete1[locus] : gamete2[locus];
      const a2 = gamete2[locus] !== undefined ? gamete2[locus] : gamete1[locus];
      genes[locus] = [a1, a2];
    }
    return { genes };
  }

  // 枚举配子分布（每个等位基因 1/2，基因座间独立）
  gameteDistribution(genotype) {
    this.validateGenotype(genotype);
    let dist = [{ gamete: {}, probability: 1 }];
    for (const locus of sortedLoci(genotype)) {
      const next = [];
      for (const entry of dist) {
        for (const allele of genotype[locus]) {
          next.push({
            gamete: { ...entry.gamete, [locus]: allele },
            probability: entry.probability * 0.5,
          });
        }
      }
      const merged = new Map();
      for (const entry of next) {
        const key = JSON.stringify(entry.gamete);
        merged.set(key, (merged.get(key) || 0) + entry.probability);
      }
      dist = [...merged.entries()].map(([key, probability]) => ({
        gamete: JSON.parse(key),
        probability,
      }));
    }
    return dist;
  }

  // 多基因组合概率：基于配子枚举的精确庞纳特方格
  predictCross(parent1, parent2) {
    const d1 = this.gameteDistribution(this.genotypeOf(parent1));
    const d2 = this.gameteDistribution(this.genotypeOf(parent2));
    const genotypeProbabilities = {};
    const phenotypeProbabilities = {};
    for (const e1 of d1) {
      for (const e2 of d2) {
        const genes = {};
        for (const locus of Object.keys(e1.gamete)) {
          genes[locus] = [e1.gamete[locus], e2.gamete[locus]];
        }
        const probability = e1.probability * e2.probability;
        const gKey = genotypeKey(genes);
        genotypeProbabilities[gKey] = (genotypeProbabilities[gKey] || 0) + probability;
        const pKey = phenotypeKey(this.getPhenotype(genes));
        phenotypeProbabilities[pKey] = (phenotypeProbabilities[pKey] || 0) + probability;
      }
    }
    return { genotypeProbabilities, phenotypeProbabilities };
  }

  // 显性/隐性表达：存在显性等位基因则表现显性性状，纯合隐性才表现隐性性状
  getPhenotype(genotype) {
    const phenotype = {};
    for (const locus of Object.keys(genotype)) {
      const pair = genotype[locus];
      const hasDominant = pair.some(isDominant);
      const map = this.traitMap[locus] || { dominant: 'dominant', recessive: 'recessive' };
      phenotype[locus] = hasDominant ? map.dominant : map.recessive;
    }
    return phenotype;
  }

  // 表型 -> 视觉外观
  getAppearance(genotype) {
    const phenotype = this.getPhenotype(genotype);
    const appearance = { ...phenotype };
    if (phenotype.size !== undefined) {
      appearance.height = phenotype.size === 'large' ? 1.5 : phenotype.size === 'small' ? 0.5 : 1;
    }
    return appearance;
  }

  // 表型 -> 属性值
  getAttributes(genotype) {
    const phenotype = this.getPhenotype(genotype);
    const attributes = { yield: 2, quality: 1 };
    if (phenotype.size !== undefined) {
      attributes.yield = phenotype.size === 'large' ? 3 : phenotype.size === 'small' ? 1 : 2;
    }
    if (phenotype.color !== undefined) {
      attributes.quality = phenotype.color === 'red' ? 2 : 1;
    }
    return attributes;
  }
}

module.exports = { Genetics, TRAIT_MAP, DEFAULT_MUTATION_RATE };
