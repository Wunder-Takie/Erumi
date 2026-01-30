/**
 * hanja_db.json 획수 수정 스크립트
 * 잘못된 획수를 정확한 값으로 수정하고 중복 항목의 획수를 통일
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/core/hanja_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// 정확한 획수 데이터 (수동 검증 완료)
const CORRECT_STROKES = {
    '泰': 10,  // 水(4) + 太(6) = 10획
    '瑛': 14,  // 玉(4) + 英(10) = 14획  
    '瑜': 14,  // 玉(4) + 兪(10) = 14획
    '晟': 11,  // 日(4) + 成(7) = 11획
    '熙': 15,  // 표준 현대 획수 15획
};

let fixCount = 0;

// 수정
db.forEach(h => {
    if (CORRECT_STROKES[h.hanja] !== undefined) {
        const correct = CORRECT_STROKES[h.hanja];
        if (h.strokes !== correct) {
            console.log(`수정: ${h.hanja} (ID ${h.id}): ${h.strokes}획 → ${correct}획`);
            h.strokes = correct;
            fixCount++;
        }
    }
});

// 저장
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`\n✅ 총 ${fixCount}개 항목 수정 완료!`);
