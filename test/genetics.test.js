
const { Genetics } = require('../src/farming/genetics.js');
const { Crop } = require('../src/farming/crop.js');
const { Breeding } = require('../src/farming/breeding.js');

describe('农场种植杂交', () => {
  test('基因型成对', () => {
    const g = new Genetics();
    const p = {genes: {color: ['R','r']}};
    expect(p.genes.color.length).toBe(2);
  });
  test('孟德尔分离', () => {
    const g = new Genetics();
    const p1 = {genes: {color: ['R','R']}};
    const p2 = {genes: {color: ['r','r']}};
    const child = g.cross(p1, p2);
    expect(child.genes.color).toEqual(['R','r']);
  });
  test('显性隐性表达', () => {
    const g = new Genetics();
    const genotype = {color: ['R','r']};
    const phenotype = g.getPhenotype(genotype);
    expect(phenotype.color).toBe('red');
  });
  test('多基因组合', () => {
    const g = new Genetics();
    const p1 = {genes: {color:['R','r'], size:['S','s']}};
    const p2 = {genes: {color:['r','r'], size:['s','s']}};
    const child = g.cross(p1, p2);
    expect(child.genes.color.length).toBe(2);
    expect(child.genes.size.length).toBe(2);
  });
  test('基因环境交互', () => {
    const crop = new Crop({color:['R','r']});
    crop.update(1, {light: 0, water: 0});
    expect(crop.growth).toBeLessThan(10);
  });
  test('种子保留基因型', () => {
    const crop = new Crop({color:['R','r'], size:['S','s']});
    const seed = crop.harvest();
    expect(seed.genotype.color).toEqual(['R','r']);
  });
  test('突变概率', () => {
    const g = new Genetics();
    g.mutationRate = 1;
    const p1 = {genes: {color:['R','R']}};
    const p2 = {genes: {color:['R','R']}};
    const child = g.cross(p1, p2);
    expect(child.genes.color).not.toEqual(['R','R']);
  });
  test('近交衰退', () => {
    const b = new Breeding();
    const c1 = new Crop({color:['R','r']});
    const c2 = new Crop({color:['R','r']});
    const child = b.breed(c1, c2);
    expect(child.vigor).toBeDefined();
  });
  test('表型映射', () => {
    const g = new Genetics();
    expect(g.getPhenotype({color:['r','r']}).color).toBe('white');
  });
  test('谱系追踪', () => {
    const b = new Breeding();
    const c1 = new Crop({color:['R','R']});
    const c2 = new Crop({color:['r','r']});
    b.breed(c1, c2);
    expect(b.lineage.length).toBe(1);
  });
  test('测交验证', () => {
    const g = new Genetics();
    const unknown = {genes: {color:['R','R']}};
    const tester = {genes: {color:['r','r']}};
    const child = g.cross(unknown, tester);
    expect(g.getPhenotype(child.genes).color).toBe('red');
  });
  test('连续多代遗传', () => {
    const b = new Breeding();
    let c1 = new Crop({color:['R','R']});
    let c2 = new Crop({color:['r','r']});
    let child = b.breed(c1, c2);
    child = b.breed(child, child);
    expect(child.genotype.color.length).toBe(2);
  });
});

describe('孟德尔遗传不变量（新增）', () => {
  test('基因型必须成对：单等位基因作物被拒绝', () => {
    expect(() => new Crop({ color: ['R'] })).toThrow(/two alleles/);
    expect(() => new Crop({ color: 'red' })).toThrow(/two alleles/);
  });

  test('纯合亲本杂交后代仍为成对基因型', () => {
    const g = new Genetics({ mutationRate: 0 });
    const child = g.cross({ genes: { color: ['R', 'R'] } }, { genes: { color: ['R', 'R'] } });
    expect(child.genes.color).toEqual(['R', 'R']);
  });

  test('孟德尔分离：Rr x Rr 基因型比例约 1:2:1', () => {
    const g = new Genetics({ mutationRate: 0 });
    const p = { genes: { color: ['R', 'r'] } };
    const counts = { RR: 0, Rr: 0, rr: 0 };
    const trials = 4000;
    for (let i = 0; i < trials; i++) {
      const child = g.cross(p, p);
      const [a, b] = child.genes.color;
      expect(['R', 'r']).toContain(a);
      expect(['R', 'r']).toContain(b);
      const key = [a, b].sort().join('');
      counts[key === 'RR' ? 'RR' : key === 'rr' ? 'rr' : 'Rr'] += 1;
    }
    expect(counts.RR / trials).toBeGreaterThan(0.19);
    expect(counts.RR / trials).toBeLessThan(0.31);
    expect(counts.Rr / trials).toBeGreaterThan(0.43);
    expect(counts.Rr / trials).toBeLessThan(0.57);
    expect(counts.rr / trials).toBeGreaterThan(0.19);
    expect(counts.rr / trials).toBeLessThan(0.31);
  });

  test('配子形成：杂合子产生两种配子各 1/2，双杂合子四种配子各 1/4', () => {
    const g = new Genetics({ mutationRate: 0 });
    const single = g.gameteDistribution({ color: ['R', 'r'] });
    expect(single).toHaveLength(2);
    single.forEach((e) => expect(e.probability).toBeCloseTo(0.5));
    const dbl = g.gameteDistribution({ color: ['R', 'r'], size: ['S', 's'] });
    expect(dbl).toHaveLength(4);
    dbl.forEach((e) => expect(e.probability).toBeCloseTo(0.25));
  });

  test('显性隐性表达：RR/Rr/rR 均为显性表型，仅 rr 为隐性', () => {
    const g = new Genetics();
    expect(g.getPhenotype({ color: ['R', 'R'] }).color).toBe('red');
    expect(g.getPhenotype({ color: ['R', 'r'] }).color).toBe('red');
    expect(g.getPhenotype({ color: ['r', 'R'] }).color).toBe('red');
    expect(g.getPhenotype({ color: ['r', 'r'] }).color).toBe('white');
  });

  test('多基因组合：RrSs x RrSs 表型比精确为 9:3:3:1', () => {
    const g = new Genetics({ mutationRate: 0 });
    const p = { genes: { color: ['R', 'r'], size: ['S', 's'] } };
    const { phenotypeProbabilities } = g.predictCross(p, p);
    expect(phenotypeProbabilities['color=red|size=large']).toBeCloseTo(9 / 16);
    expect(phenotypeProbabilities['color=red|size=small']).toBeCloseTo(3 / 16);
    expect(phenotypeProbabilities['color=white|size=large']).toBeCloseTo(3 / 16);
    expect(phenotypeProbabilities['color=white|size=small']).toBeCloseTo(1 / 16);
  });

  test('基因环境交互：基因型差异随水分水平变化（非简单加性）', () => {
    const large = new Crop({ color: ['R', 'R'], size: ['S', 'S'] });
    const small = new Crop({ color: ['R', 'R'], size: ['s', 's'] });
    const dryLarge = large.update(1, { light: 1, water: 0, soil: 1 });
    const drySmall = small.update(1, { light: 1, water: 0, soil: 1 });
    const wetLarge = new Crop({ color: ['R', 'R'], size: ['S', 'S'] }).update(1, { light: 1, water: 1, soil: 1 });
    const wetSmall = new Crop({ color: ['R', 'R'], size: ['s', 's'] }).update(1, { light: 1, water: 1, soil: 1 });
    expect(drySmall).toBeGreaterThan(dryLarge);
    expect(wetLarge).toBeCloseTo(wetSmall);
    expect(drySmall - dryLarge).toBeGreaterThan(Math.abs(wetLarge - wetSmall));
    const c = new Crop({ color: ['R', 'r'] });
    const poor = c.update(1, { light: 0, water: 0, soil: 0 });
    expect(poor).toBe(0);
    expect(new Crop({ color: ['R', 'r'] }).update(1, { light: 1, water: 1, soil: 1 })).toBeGreaterThan(poor);
  });

  test('种子保留完整基因型且可复现表型', () => {
    const crop = new Crop({ color: ['R', 'r'], size: ['S', 's'] });
    const seed = crop.harvest();
    expect(seed.genotype).toEqual({ color: ['R', 'r'], size: ['S', 's'] });
    expect(seed.genotype).not.toBe(crop.genotype);
    const replanted = new Crop(seed.genotype);
    expect(replanted.phenotype).toEqual(crop.phenotype);
    expect(seed.genotype).not.toEqual({ color: 'red', size: 'medium' });
  });

  test('突变：默认概率极低，强制突变产生新等位基因', () => {
    const g = new Genetics();
    expect(g.mutationRate).toBeLessThan(0.01);
    const stable = new Genetics({ mutationRate: 0 });
    const p = { genes: { color: ['R', 'R'] } };
    for (let i = 0; i < 200; i++) {
      expect(stable.cross(p, p).genes.color).toEqual(['R', 'R']);
    }
    const forced = new Genetics({ mutationRate: 1 });
    const mutant = forced.cross(p, p);
    expect(mutant.genes.color).toHaveLength(2);
    expect(mutant.genes.color.some((a) => a !== 'R')).toBe(true);
  });

  test('近交衰退：连续自交活力逐代下降并拖累生长', () => {
    const b = new Breeding();
    b.genetics.mutationRate = 0;
    let current = new Crop({ color: ['R', 'r'] }, { genetics: b.genetics });
    const vigors = [current.vigor];
    const growths = [];
    for (let gen = 0; gen < 3; gen++) {
      current = b.breed(current, current);
      vigors.push(current.vigor);
      const clone = new Crop(current.genotype, { vigor: current.vigor, genetics: b.genetics });
      growths.push(clone.update(1, { light: 1, water: 1, soil: 1 }));
    }
    for (let i = 1; i < vigors.length; i++) {
      expect(vigors[i]).toBeLessThan(vigors[i - 1]);
    }
    for (let i = 1; i < growths.length; i++) {
      expect(growths[i]).toBeLessThan(growths[i - 1]);
    }
  });

  test('表型映射：外观与属性值由表型决定', () => {
    const g = new Genetics();
    const tall = g.getAppearance({ size: ['S', 's'] });
    const dwarf = g.getAppearance({ size: ['s', 's'] });
    expect(tall.height).toBeGreaterThan(dwarf.height);
    expect(g.getAppearance({ color: ['R', 'r'] }).color).toBe('red');
    expect(g.getAppearance({ color: ['r', 'r'] }).color).toBe('white');
    const bigYield = g.getAttributes({ size: ['S', 'S'] }).yield;
    const smallYield = g.getAttributes({ size: ['s', 's'] }).yield;
    expect(bigYield).toBeGreaterThan(smallYield);
    const crop = new Crop({ color: ['r', 'r'], size: ['s', 's'] });
    expect(crop.appearance.color).toBe('white');
    expect(crop.attributes.yield).toBe(1);
  });

  test('谱系追踪：记录父母本基因型且可回溯多代', () => {
    const b = new Breeding();
    b.genetics.mutationRate = 0;
    const c1 = new Crop({ color: ['R', 'R'] }, { genetics: b.genetics });
    const c2 = new Crop({ color: ['r', 'r'] }, { genetics: b.genetics });
    const f1 = b.breed(c1, c2);
    expect(b.lineage).toHaveLength(1);
    const record = b.lineage[0];
    expect(record.parents[0].genotype.color).toEqual(['R', 'R']);
    expect(record.parents[1].genotype.color).toEqual(['r', 'r']);
    expect(record.child.id).toBe(f1.id);
    expect(f1.parents).toEqual([c1.id, c2.id]);
    const f2 = b.breed(f1, f1);
    expect(b.lineage).toHaveLength(2);
    expect(b.lineage[1].parents[0].id).toBe(f1.id);
    expect(f2.ancestors.has(c1.id)).toBe(true);
    expect(f2.ancestors.has(c2.id)).toBe(true);
  });

  test('测交验证：Rr x rr 分离 1:1，RR x rr 全部显性', () => {
    const g = new Genetics({ mutationRate: 0 });
    const tester = { genes: { color: ['r', 'r'] } };
    const hetero = g.predictCross({ genes: { color: ['R', 'r'] } }, tester);
    expect(hetero.phenotypeProbabilities['color=red']).toBeCloseTo(0.5);
    expect(hetero.phenotypeProbabilities['color=white']).toBeCloseTo(0.5);
    const homo = g.predictCross({ genes: { color: ['R', 'R'] } }, tester);
    expect(homo.phenotypeProbabilities['color=red']).toBeCloseTo(1);
    expect(homo.phenotypeProbabilities['color=white']).toBeUndefined();
  });

  test('连续多代遗传：F1 一致杂合，F2 出现三种基因型且始终成对', () => {
    const b = new Breeding();
    b.genetics.mutationRate = 0;
    const p1 = new Crop({ color: ['R', 'R'] }, { genetics: b.genetics });
    const p2 = new Crop({ color: ['r', 'r'] }, { genetics: b.genetics });
    const f1a = b.breed(p1, p2);
    const f1b = b.breed(p1, p2);
    expect(f1a.genotype.color).toEqual(['R', 'r']);
    expect(f1b.genotype.color).toEqual(['R', 'r']);
    expect(f1a.phenotype.color).toBe('red');
    const seen = new Set();
    for (let i = 0; i < 300; i++) {
      const f2 = b.breed(f1a, f1b);
      expect(f2.genotype.color).toHaveLength(2);
      seen.add([...f2.genotype.color].sort().join(''));
    }
    expect(seen.has('RR')).toBe(true);
    expect(seen.has('Rr')).toBe(true);
    expect(seen.has('rr')).toBe(true);
  });
});
