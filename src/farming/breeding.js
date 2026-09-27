const { Genetics } = require('./genetics.js');
const { Crop } = require('./crop.js');

class Breeding {
  constructor(genetics) {
    this.genetics = genetics || new Genetics();
    this.lineage = [];
    this.registry = new Map();
  }

  register(crop) {
    if (!this.registry.has(crop.id)) {
      this.registry.set(crop.id, {
        parents: crop.parents ? [...crop.parents] : [],
        inbreeding: crop.inbreeding ?? 0,
      });
    }
  }

  // 系谱共祖度（kinship）；子代近交系数 F = φ(父, 母)。
  kinship(idA, idB, memo = new Map()) {
    if (idA === idB) {
      const rec = this.registry.get(idA);
      return (1 + (rec ? rec.inbreeding : 0)) / 2;
    }
    if (idA > idB) return this.kinship(idB, idA, memo);
    const key = `${idA}|${idB}`;
    if (memo.has(key)) return memo.get(key);
    const recB = this.registry.get(idB);
    let value = 0;
    if (recB && recB.parents.length === 2) {
      value =
        (this.kinship(idA, recB.parents[0], memo) +
          this.kinship(idA, recB.parents[1], memo)) /
        2;
    }
    memo.set(key, value);
    return value;
  }

  breed(crop1, crop2) {
    this.register(crop1);
    this.register(crop2);
    const inbreeding = this.kinship(crop1.id, crop2.id);
    const childGenes = this.genetics.cross({ genes: crop1.genotype }, { genes: crop2.genotype });
    const generation = Math.max(crop1.generation ?? 0, crop2.generation ?? 0) + 1;
    const child = new Crop(childGenes.genes, {
      genetics: this.genetics,
      generation,
      inbreeding,
      parents: [crop1.id, crop2.id],
    });
    this.register(child);
    this.lineage.push({
      parents: [
        { id: crop1.id, genotype: Breeding.cloneGenotype(crop1.genotype) },
        { id: crop2.id, genotype: Breeding.cloneGenotype(crop2.genotype) },
      ],
      child: { id: child.id, genotype: Breeding.cloneGenotype(child.genotype) },
      generation,
      inbreeding,
    });
    return child;
  }

  getLineage(cropOrId) {
    const id = typeof cropOrId === 'object' ? cropOrId.id : cropOrId;
    return this.lineage.find((entry) => entry.child.id === id) || null;
  }

  static cloneGenotype(genotype) {
    const copy = {};
    for (const trait of Object.keys(genotype)) copy[trait] = [...genotype[trait]];
    return copy;
  }
}

module.exports = { Breeding };
