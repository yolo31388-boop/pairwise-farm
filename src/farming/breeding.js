const { Genetics } = require('./genetics.js');
const { Crop } = require('./crop.js');

function cloneGenotype(genotype) {
  const copy = {};
  for (const locus of Object.keys(genotype)) {
    copy[locus] = [...genotype[locus]];
  }
  return copy;
}

class Breeding {
  constructor() {
    this.genetics = new Genetics();
    this.lineage = [];
  }

  relatedness(crop1, crop2) {
    const a1 = new Set([...(crop1.ancestors || []), crop1.id]);
    const a2 = new Set([...(crop2.ancestors || []), crop2.id]);
    let shared = 0;
    for (const id of a1) {
      if (a2.has(id)) shared += 1;
    }
    return shared / Math.max(a1.size, a2.size);
  }

  // 近交系数：自交 F' = (1 + F) / 2；非自交按共同祖先比例估算
  computeInbreeding(crop1, crop2) {
    if (crop1.id === crop2.id) {
      return (1 + (crop1.inbreeding || 0)) / 2;
    }
    const r = this.relatedness(crop1, crop2);
    const parental = ((crop1.inbreeding || 0) + (crop2.inbreeding || 0)) / 4;
    return Math.min(0.95, r * 0.5 + parental);
  }

  breed(crop1, crop2) {
    const childGenes = this.genetics.cross(crop1, crop2);
    const inbreeding = this.computeInbreeding(crop1, crop2);
    const ancestors = new Set([
      ...(crop1.ancestors || []),
      ...(crop2.ancestors || []),
      crop1.id,
      crop2.id,
    ]);
    const child = new Crop(childGenes.genes, {
      genetics: this.genetics,
      inbreeding,
      ancestors,
      parents: [crop1.id, crop2.id],
    });
    this.lineage.push({
      parents: [
        { id: crop1.id, genotype: cloneGenotype(crop1.genotype) },
        { id: crop2.id, genotype: cloneGenotype(crop2.genotype) },
      ],
      child: { id: child.id, genotype: cloneGenotype(child.genotype) },
      inbreeding,
    });
    return child;
  }
}

module.exports = { Breeding };
