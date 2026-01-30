const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./data/core/hanja_db.json', 'utf-8'));

const hanjaMap = new Map();
db.forEach(h => {
    const key = h.hanja;
    if (!hanjaMap.has(key)) {
        hanjaMap.set(key, []);
    }
    hanjaMap.get(key).push({ id: h.id, strokes: h.strokes, hangul: h.hangul, position: h.position });
});

// Find duplicates with different strokes
let issues = [];
hanjaMap.forEach((entries, hanja) => {
    if (entries.length > 1) {
        const strokes = new Set(entries.map(e => e.strokes));
        if (strokes.size > 1) {
            issues.push({ hanja, entries });
        }
    }
});

console.log('=== 획수 불일치 한자 ===');
console.log(JSON.stringify(issues, null, 2));
console.log('\n=== 전체 고유 한자 수 ===');
console.log(hanjaMap.size);
console.log('\n=== 모든 한자 목록 (획수 포함) ===');
const allHanja = [];
hanjaMap.forEach((entries, hanja) => {
    allHanja.push({ hanja, strokes: entries[0].strokes, hangul: entries[0].hangul });
});
console.log(JSON.stringify(allHanja, null, 2));
