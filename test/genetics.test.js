
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
  test('基因型必须成对，非成对基因型被拒绝', () => {
    const g = new Genetics(0);
    expect(() => g.cross({ genes: { color: ['R'] } }, { genes: { color: ['r', 'r'] } })).toThrow();
    expect(() => g.cross({ genes: { color: 'Rr' } }, { genes: { color: ['r', 'r'] } })).toThrow();
    const child = g.cross({ genes: { color: ['R', 'r'] } }, { genes: { color: ['r', 'r'] } });
    expect(child.genes.color).toHaveLength(2);
  });

  test('孟德尔分离：Rr 自交基因型比约 1:2:1，配子各含一个等位基因', () => {
    const g = new Genetics(0);
    const gametes = g.getGametes({ genes: { color: ['R', 'r'] } });
    expect(gametes.map((x) => x.color).sort()).toEqual(['R', 'r']);
    const counts = { RR: 0, Rr: 0, rr: 0 };
    const trials = 4000;
    for (let i = 0; i < trials; i++) {
      const c = g.cross({ genes: { color: ['R', 'r'] } }, { genes: { color: ['R', 'r'] } });
      counts[[...c.genes.color].sort().join('')] += 1;
    }
    expect(counts.RR / trials).toBeGreaterThan(0.19);
    expect(counts.RR / trials).toBeLessThan(0.31);
    expect(counts.Rr / trials).toBeGreaterThan(0.44);
    expect(counts.Rr / trials).toBeLessThan(0.56);
    expect(counts.rr / trials).toBeGreaterThan(0.19);
    expect(counts.rr / trials).toBeLessThan(0.31);
  });

  test('显性隐性表达：显性等位基因存在即显性，纯合隐性才表现隐性', () => {
    const g = new Genetics(0);
    expect(g.getPhenotype({ color: ['R', 'R'] }).color).toBe('red');
    expect(g.getPhenotype({ color: ['R', 'r'] }).color).toBe('red');
    expect(g.getPhenotype({ color: ['r', 'r'] }).color).toBe('white');
    let sawRecessive = false;
    for (let i = 0; i < 200 && !sawRecessive; i++) {
      const c = g.cross({ genes: { color: ['R', 'r'] } }, { genes: { color: ['R', 'r'] } });
      if (g.getPhenotype(c.genes).color === 'white') sawRecessive = true;
    }
    expect(sawRecessive).toBe(true);
  });

  test('多基因组合：双杂合自交表型比 9:3:3:1', () => {
    const g = new Genetics(0);
    const p = { genes: { color: ['R', 'r'], size: ['S', 's'] } };
    const dist = g.getOffspringDistribution(p, p);
    expect(dist['color:red|size:large']).toBeCloseTo(9 / 16, 10);
    expect(dist['color:red|size:small']).toBeCloseTo(3 / 16, 10);
    expect(dist['color:white|size:large']).toBeCloseTo(3 / 16, 10);
    expect(dist['color:white|size:small']).toBeCloseTo(1 / 16, 10);
    let doubleRecessive = 0;
    const trials = 4000;
    for (let i = 0; i < trials; i++) {
      const c = g.cross(p, p);
      const ph = g.getPhenotype(c.genes);
      if (ph.color === 'white' && ph.size === 'small') doubleRecessive += 1;
    }
    expect(doubleRecessive / trials).toBeGreaterThan(0.03);
    expect(doubleRecessive / trials).toBeLessThan(0.1);
  });

  test('基因环境交互：同基因型不同环境生长不同，环境改变基因型优劣排序', () => {
    const g = new Genetics(0);
    const lowLight = { light: 0.2, water: 0.6, soil: 1 };
    const highLight = { light: 1.0, water: 0.6, soil: 1 };
    const redLow = new Crop({ color: ['R', 'R'] }, { genetics: g });
    redLow.update(1, lowLight);
    const redHigh = new Crop({ color: ['R', 'R'] }, { genetics: g });
    redHigh.update(1, highLight);
    expect(redHigh.growth).toBeGreaterThan(redLow.growth);
    const whiteLow = new Crop({ color: ['r', 'r'] }, { genetics: g });
    whiteLow.update(1, lowLight);
    expect(whiteLow.growth).toBeGreaterThan(redLow.growth);
    const whiteHigh = new Crop({ color: ['r', 'r'] }, { genetics: g });
    whiteHigh.update(1, highLight);
    expect(redHigh.growth).toBeGreaterThan(whiteHigh.growth);
    const barren = new Crop({ color: ['R', 'R'] }, { genetics: g });
    barren.update(1, { light: 0, water: 0, soil: 0 });
    expect(barren.growth).toBe(0);
  });

  test('种子保留基因型：收获不退化且为独立副本', () => {
    const crop = new Crop({ color: ['R', 'r'], size: ['s', 's'] });
    const seed = crop.harvest();
    expect(seed.genotype).toEqual({ color: ['R', 'r'], size: ['s', 's'] });
    seed.genotype.color[0] = 'X';
    expect(crop.genotype.color[0]).toBe('R');
  });

  test('突变概率：默认极低，rate=0 不发生，rate=1 必发生且产生新等位基因', () => {
    const g0 = new Genetics(0);
    let mutated = 0;
    for (let i = 0; i < 500; i++) {
      const c = g0.cross({ genes: { color: ['R', 'R'] } }, { genes: { color: ['R', 'R'] } });
      if (c.genes.color[0] !== 'R' || c.genes.color[1] !== 'R') mutated += 1;
    }
    expect(mutated).toBe(0);
    const g1 = new Genetics(1);
    const c1 = g1.cross({ genes: { color: ['R', 'R'] } }, { genes: { color: ['R', 'R'] } });
    expect(c1.genes.color[0]).not.toBe('R');
    expect(c1.genes.color[1]).not.toBe('R');
    const gDefault = new Genetics();
    expect(gDefault.mutationRate).toBeGreaterThan(0);
    expect(gDefault.mutationRate).toBeLessThan(0.01);
  });

  test('近交衰退：连续自交活力逐代下降并拖累生长', () => {
    const b = new Breeding(new Genetics(0));
    let c = new Crop({ color: ['R', 'r'] });
    const vigors = [c.vigor];
    for (let i = 0; i < 3; i++) {
      c = b.breed(c, c);
      vigors.push(c.vigor);
    }
    expect(vigors[1]).toBeLessThan(vigors[0]);
    expect(vigors[2]).toBeLessThan(vigors[1]);
    expect(vigors[3]).toBeLessThan(vigors[2]);
    const env = { light: 0.9, water: 0.9, soil: 1 };
    const inbred = new Crop({ color: ['R', 'R'] }, { inbreeding: vigors.length ? c.inbreeding : 0 });
    const outbred = new Crop({ color: ['R', 'R'] });
    inbred.update(1, env);
    outbred.update(1, env);
    expect(inbred.growth).toBeLessThan(outbred.growth);
  });

  test('表型映射：表型正确映射到外观与属性值', () => {
    const g = new Genetics(0);
    const white = new Crop({ color: ['r', 'r'], size: ['s', 's'] }, { genetics: g });
    expect(white.getAppearance().color).toBe('white');
    expect(white.getAppearance().size).toBe('small');
    const large = new Crop({ color: ['R', 'R'], size: ['S', 'S'] }, { genetics: g });
    expect(large.getAppearance().color).toBe('red');
    expect(large.getAttributes().yield).toBeGreaterThan(white.getAttributes().yield);
  });

  test('谱系追踪：记录父母本 id 与基因型，多代可追溯', () => {
    const b = new Breeding(new Genetics(0));
    const c1 = new Crop({ color: ['R', 'R'] });
    const c2 = new Crop({ color: ['r', 'r'] });
    const child = b.breed(c1, c2);
    const entry = b.getLineage(child);
    expect(entry.parents.map((p) => p.id)).toEqual([c1.id, c2.id]);
    expect(entry.parents[0].genotype).toEqual({ color: ['R', 'R'] });
    expect(entry.child.genotype).toEqual({ color: ['R', 'r'] });
    const grandchild = b.breed(child, c1);
    expect(b.getLineage(grandchild).parents[0].id).toBe(child.id);
    expect(b.getLineage(child).child.id).toBe(child.id);
  });

  test('测交验证：杂合测交隐性约 1/2，纯合测交全为显性', () => {
    const g = new Genetics(0);
    const dist = g.getOffspringDistribution(
      { genes: { color: ['R', 'r'] } },
      { genes: { color: ['r', 'r'] } }
    );
    expect(dist['color:red']).toBeCloseTo(0.5, 10);
    expect(dist['color:white']).toBeCloseTo(0.5, 10);
    let white = 0;
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      const c = g.cross({ genes: { color: ['R', 'r'] } }, { genes: { color: ['r', 'r'] } });
      if (g.getPhenotype(c.genes).color === 'white') white += 1;
    }
    expect(white / trials).toBeGreaterThan(0.4);
    expect(white / trials).toBeLessThan(0.6);
    for (let i = 0; i < 100; i++) {
      const c = g.cross({ genes: { color: ['R', 'R'] } }, { genes: { color: ['r', 'r'] } });
      expect(g.getPhenotype(c.genes).color).toBe('red');
    }
  });

  test('连续多代遗传：F1 一致为杂合，F2 发生 3:1 性状分离', () => {
    const g = new Genetics(0);
    const b = new Breeding(g);
    const f1 = b.breed(new Crop({ color: ['R', 'R'] }), new Crop({ color: ['r', 'r'] }));
    expect(f1.genotype.color).toEqual(['R', 'r']);
    expect(f1.generation).toBe(1);
    const counts = { red: 0, white: 0 };
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      const f2 = b.breed(f1, f1);
      counts[g.getPhenotype(f2.genotype).color] += 1;
    }
    expect(counts.red / trials).toBeGreaterThan(0.65);
    expect(counts.red / trials).toBeLessThan(0.85);
    expect(counts.white).toBeGreaterThan(0);
  });
});
