import { generateNames } from './src/utils/namingUtils.js';

console.log('=== 단일 vs 중복 선택: 실제 이름 비교 ===\n');

// 시나리오 A: 단일 선택 (Fire 집중)
console.log('📌 시나리오 A: 용/호랑이 단일 선택 (Fire:32 Metal:8)');
const fireWeights = { Fire: 32, Metal: 8, Water: 0, Wood: 0, Earth: 0 };
const fireNames = generateNames('김', [], null, fireWeights);

console.log('상위 10개 이름:');
fireNames.slice(0, 10).forEach((n, i) => {
    console.log(`  ${i + 1}. ${n.fullName.hangul} (${n.elements.join('+')} ) - ${n.score}점`);
});

// 시나리오 B: 중복 선택 (Water+Fire 분산)
console.log('\n📌 시나리오 B: 용+물 중복 선택 (Water:20 Fire:16)');
const mixedWeights = { Fire: 16, Metal: 4, Water: 20, Wood: 0, Earth: 0 };
const mixedNames = generateNames('김', [], null, mixedWeights);

console.log('상위 10개 이름:');
mixedNames.slice(0, 10).forEach((n, i) => {
    console.log(`  ${i + 1}. ${n.fullName.hangul} (${n.elements.join('+')} ) - ${n.score}점`);
});

// 시나리오 C: Wood 단일
console.log('\n📌 시나리오 C: 꽃/과일 단일 선택 (Wood:40)');
const woodWeights = { Fire: 0, Metal: 0, Water: 0, Wood: 40, Earth: 0 };
const woodNames = generateNames('김', [], null, woodWeights);

console.log('상위 10개 이름:');
woodNames.slice(0, 10).forEach((n, i) => {
    console.log(`  ${i + 1}. ${n.fullName.hangul} (${n.elements.join('+')} ) - ${n.score}점`);
});

console.log('\n=== 비교 요약 ===');
console.log('Fire 집중 상위 5:', fireNames.slice(0, 5).map(n => n.fullName.hangul).join(', '));
console.log('Water+Fire 상위 5:', mixedNames.slice(0, 5).map(n => n.fullName.hangul).join(', '));
console.log('Wood 집중 상위 5:', woodNames.slice(0, 5).map(n => n.fullName.hangul).join(', '));
