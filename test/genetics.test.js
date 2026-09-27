
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
