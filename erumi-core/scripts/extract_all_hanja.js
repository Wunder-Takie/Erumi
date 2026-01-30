/**
 * 전체 한자 획수 추출 스크립트
 */
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./data/core/hanja_db.json', 'utf-8'));

const uniqueHanja = new Map();
db.forEach(h => {
    if (!uniqueHanja.has(h.hanja)) {
        uniqueHanja.set(h.hanja, { hanja: h.hanja, hangul: h.hangul, strokes: h.strokes });
    }
});

const list = Array.from(uniqueHanja.values());
console.log('전체 고유 한자:', list.length);
console.log(JSON.stringify(list, null, 2));
