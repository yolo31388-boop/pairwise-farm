

class Breeding {
  constructor() { this.genetics = new Genetics(); this.lineage = []; }
  breed(crop1, crop2) {
    const child = this.genetics.cross(crop1, crop2);
    this.lineage.push({parents: [crop1, crop2], child});
    return new Crop(child);
  }
}

module.exports = { Breeding };
