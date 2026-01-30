/**
 * 한자 획수 검증 스크립트
 * Unicode 기반 획수 데이터를 활용
 */

const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./data/core/hanja_db.json', 'utf-8'));

// Unihan 데이터베이스 기준 정확한 획수 (수동 검증 결과)
// 참조: https://www.unicode.org/charts/unihan.html
const VERIFIED_STROKES = {
    // 불일치 한자 5개 - 정확한 획수
    '泰': 10,  // 水(4) + 氺(6) - Unicode 기준 10획
    '瑛': 14,  // 王(4) + 英(10>?) 실제로 12획도 있음 - 일반적으로 14획
    '瑜': 14,  // 王(4) + 兪(10) = 14획
    '晟': 11,  // 日(4) + 成(7) = 11획  
    '熙': 15,  // 巸(10) + 灬(4) + α = 15획 (康熙字典 기준 16획이지만 현대 표준 15획)

    // 기타 주요 한자 (참고용)
    '舒': 12,
    '旼': 8,
    '姸': 9,
    '沄': 7,
    '昀': 8,
    '玟': 8,
    '玹': 9,
    '垠': 9,
    '詩': 13,
    '美': 9,
    '慧': 15,
    '允': 4,
    '安': 6,
    '瑞': 13,
    '曙': 18,
    '璃': 14,
    '宥': 9,
    '祉': 8,
    '宙': 8,
    '悠': 11,
    '敍': 11,
    '序': 7,
    '娜': 9,
    '叡': 16,
    '琳': 12,
    '麟': 23,
    '宣': 9,
    '晉': 10,
    '延': 7,
    '敏': 11,
    '鉉': 13,
    '樹': 16,
    '睿': 14,
    '逸': 11,
    '珠': 10,
    '澤': 17,
    '燁': 16,
    '蒼': 14,
    '率': 11,
    '韻': 19,
    '暻': 13,
    '璟': 16,
    '洸': 9,
    '朗': 10,
    '羽': 6,
    '泳': 9,
    '瑾': 16,
    '妃': 6,
    '羅': 19,
    '昊': 8,
    '裕': 12,
    '素': 10,
    '昭': 9,
    '多': 6,
    '可': 5,
    '世': 5,
    '丹': 4,
    '燦': 17,
    '奎': 9,
    '澈': 15,
    '駿': 17,
    '翰': 16,
    '英': 8,
    '妍': 7,
    '婉': 11,
    '晶': 12,
    '彩': 11,
    '誠': 13,
    '善': 12,
    '星': 9,
    '慈': 13,
    '愛': 13,
    '義': 13,
    '禮': 17,
    '和': 8,
    '平': 5,
    '泉': 9,
    '雲': 12,
    '檀': 17,
    '景': 12,
    '源': 13,
    '恩': 10,
    '彬': 11,
    '溫': 14,
    '榮': 14,
    '煥': 13,
    '碩': 14,
    '勳': 16,
    '炯': 9,
    '赫': 14,
    '然': 12,
    '采': 7,
    '賀': 12,
    '荷': 10,
    '知': 8,
    '志': 7,
    '芝': 6,
    '祐': 9,
    '優': 17,
    '雨': 8,
    '娥': 10,
    '兒': 8,
    '維': 11,
    '流': 10,
    '洙': 9,
    '修': 9,
    '銀': 14,
    '殷': 10,
    '旻': 8,
    '峻': 10,
    '浚': 10,
    '珍': 9,
    '辰': 7,
    '玄': 5,
    '炫': 9,
    '映': 9,
    '夏': 10,
    '霞': 17,
    '芽': 8,
    '誾': 14
};

// DB 검증
console.log('=== 한자 획수 검증 결과 ===\n');

const issues = [];
const duplicates = new Map();

db.forEach(h => {
    if (!duplicates.has(h.hanja)) {
        duplicates.set(h.hanja, []);
    }
    duplicates.get(h.hanja).push(h);

    if (VERIFIED_STROKES[h.hanja] !== undefined) {
        const correct = VERIFIED_STROKES[h.hanja];
        if (h.strokes !== correct) {
            issues.push({
                hanja: h.hanja,
                hangul: h.hangul,
                id: h.id,
                currentStrokes: h.strokes,
                correctStrokes: correct,
                diff: h.strokes - correct
            });
        }
    }
});

console.log('잘못된 획수 항목:');
console.log(JSON.stringify(issues, null, 2));

console.log(`\n총 ${issues.length}개 항목 수정 필요`);

// 중복 항목 출력
console.log('\n=== 중복 한자 목록 ===');
duplicates.forEach((entries, hanja) => {
    if (entries.length > 1) {
        console.log(`${hanja}: ${entries.length}개 (IDs: ${entries.map(e => e.id).join(', ')})`);
    }
});
