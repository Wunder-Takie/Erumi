/**
 * 전체 한자 획수 검증 스크립트 v2
 * Unicode Unihan Database 기준 정확한 획수 데이터
 * 
 * 참조:
 * - https://www.unicode.org/charts/unihan.html (kTotalStrokes)
 * - https://hanja.dict.naver.com
 * - 康熙字典 표준 획수
 */

const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./data/core/hanja_db.json', 'utf-8'));

// Unicode Unihan Database 기준 정확한 획수 (149개 전체)
const UNIHAN_STROKES = {
    // ㄱ
    '可': 5,
    '佳': 8,
    '建': 9,
    '謙': 17,
    '潔': 16,
    '景': 12,
    '暻': 13,
    '璟': 16,
    '洸': 9,
    '路': 13,
    '奎': 9,
    '瑾': 15,
    '近': 8,

    // ㄴ
    '娜': 9,

    // ㄷ
    '多': 6,
    '丹': 4,
    '檀': 17,
    '導': 16,

    // ㄹ
    '璃': 14,
    '律': 9,
    '琳': 12,
    '朗': 10,
    '羅': 19,
    '麟': 23,

    // ㅁ
    '美': 9,
    '敏': 11,
    '旻': 8,
    '玟': 8,
    '珉': 10,
    '旼': 8,
    '妃': 6,

    // ㅂ
    '彬': 11,

    // ㅅ
    '舒': 12,
    '敍': 11,
    '序': 7,
    '瑞': 13,
    '曙': 18,
    '宣': 9,
    '善': 12,
    '秀': 7,
    '洙': 9,
    '修': 9,
    '樹': 16,
    '晟': 11,
    '誠': 13,
    '星': 9,
    '時': 10,
    '素': 10,
    '昭': 9,
    '率': 11,
    '蒼': 14,
    '碩': 14,
    '世': 5,

    // ㅇ
    '雅': 12,
    '兒': 8,
    '娥': 10,
    '芽': 8,
    '安': 6,
    '愛': 13,
    '映': 9,
    '英': 8,
    '榮': 14,
    '永': 5,
    '瑛': 14,
    '泳': 9,
    '叡': 16,
    '睿': 14,
    '藝': 21,
    '禮': 17,
    '瑜': 14,
    '悠': 11,
    '裕': 12,
    '柔': 9,
    '維': 14,
    '流': 10,
    '宥': 9,
    '優': 17,
    '羽': 6,
    '宇': 6,
    '雨': 8,
    '雲': 12,
    '韻': 19,
    '殷': 10,
    '銀': 14,
    '垠': 9,
    '誾': 14,
    '逸': 11,
    '允': 4,
    '沄': 7,
    '昀': 8,
    '潤': 15,
    '義': 13,
    '仁': 4,
    '元': 4,

    // ㅈ
    '慈': 13,
    '知': 8,
    '志': 7,
    '芝': 6,
    '智': 12,
    '祉': 8,
    '珍': 9,
    '辰': 7,
    '眞': 10,
    '晉': 10,
    '珠': 10,
    '宙': 8,
    '俊': 9,
    '駿': 17,
    '峻': 10,
    '浚': 10,
    '晶': 12,
    '宰': 10,
    '祐': 9,

    // ㅊ
    '燦': 17,
    '彩': 11,
    '采': 7,

    // ㅌ
    '泰': 10,
    '泉': 9,
    '澤': 17,
    '溫': 14,
    '澈': 15,

    // ㅎ
    '和': 8,
    '夏': 10,
    '河': 9,
    '霞': 17,
    '賀': 12,
    '荷': 10,
    '昊': 8,
    '浩': 11,
    '煥': 13,
    '赫': 14,
    '炯': 9,
    '炫': 9,
    '玄': 5,
    '鉉': 13,
    '玹': 9,
    '賢': 15,
    '慧': 15,
    '惠': 12,
    '翰': 16,
    '熙': 15,
    '姸': 9,
    '妍': 7,
    '延': 7,
    '然': 12,
    '婉': 11,
    '源': 13,
    '恩': 10,
    '勳': 16,
    '詩': 13,
    '燁': 16,
    '平': 5,
};

// 검증 수행
const issues = [];
const verified = [];
const needsCheck = [];

const uniqueHanja = new Map();
db.forEach(h => {
    if (!uniqueHanja.has(h.hanja)) {
        uniqueHanja.set(h.hanja, h);
    }
});

uniqueHanja.forEach((h, hanja) => {
    const correct = UNIHAN_STROKES[hanja];
    if (correct !== undefined) {
        if (h.strokes !== correct) {
            issues.push({
                hanja: h.hanja,
                hangul: h.hangul,
                current: h.strokes,
                correct: correct,
                diff: h.strokes - correct
            });
        } else {
            verified.push({ hanja: h.hanja, hangul: h.hangul, strokes: h.strokes });
        }
    } else {
        needsCheck.push({ hanja: h.hanja, hangul: h.hangul, strokes: h.strokes });
    }
});

if (needsCheck.length > 0) {
    console.log('⚠️ 확인 필요 한자:');
    needsCheck.forEach(h => {
        console.log(`  ${h.hanja} (${h.hangul}) - 현재 ${h.strokes}획`);
    });
}

console.log('\n=== 획수 불일치 발견 ===');
if (issues.length > 0) {
    issues.forEach(i => {
        console.log(`❌ ${i.hanja} (${i.hangul}): ${i.current}획 → ${i.correct}획 (${i.diff > 0 ? '+' : ''}${i.diff})`);
    });
} else {
    console.log('✅ 불일치 없음!');
}

console.log(`\n=== 검증 결과 ===`);
console.log(`✅ 일치: ${verified.length}개`);
console.log(`❌ 불일치: ${issues.length}개`);
console.log(`⚠️ 확인 필요: ${needsCheck.length}개`);

// 불일치 항목 수정
if (issues.length > 0 && process.argv[2] === '--fix') {
    console.log('\n수정 진행...');
    db.forEach(h => {
        const correct = UNIHAN_STROKES[h.hanja];
        if (correct !== undefined && h.strokes !== correct) {
            console.log(`수정: ${h.hanja} (ID ${h.id}): ${h.strokes}획 → ${correct}획`);
            h.strokes = correct;
        }
    });
    fs.writeFileSync('./data/core/hanja_db.json', JSON.stringify(db, null, 2));
    console.log('\n✅ 수정 완료!');
}
