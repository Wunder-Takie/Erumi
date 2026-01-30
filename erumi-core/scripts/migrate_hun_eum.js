/**
 * meaning_korean / meaning → hun + eum 분리 마이그레이션 스크립트
 * 
 * 변환 규칙:
 * - "펼 서" → { hun: "펼", eum: "서" }
 * - "오얏 이" → { hun: "오얏", eum: "이" }
 */

const fs = require('fs');
const path = require('path');

// 1. hanja_db.json 마이그레이션
function migrateHanjaDb() {
    const dbPath = path.join(__dirname, '../data/core/hanja_db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    let migratedCount = 0;

    db.forEach(entry => {
        if (entry.meaning_korean) {
            const parts = entry.meaning_korean.trim().split(' ');
            if (parts.length > 1) {
                entry.hun = parts.slice(0, -1).join(' ');  // 마지막 제외 = 훈
                entry.eum = parts[parts.length - 1];       // 마지막 = 음
            } else {
                // 단일 단어인 경우 (예외 케이스)
                entry.hun = entry.meaning_korean;
                entry.eum = '';
            }
            delete entry.meaning_korean;
            migratedCount++;
        }
    });

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`✅ hanja_db.json: ${migratedCount}개 항목 마이그레이션 완료`);
}

// 2. surnames.json 마이그레이션
function migrateSurnames() {
    const dbPath = path.join(__dirname, '../data/core/surnames.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    let migratedCount = 0;

    Object.keys(db).forEach(hangul => {
        const variants = db[hangul];
        variants.forEach(variant => {
            if (variant.meaning) {
                const parts = variant.meaning.trim().split(' ');
                if (parts.length > 1) {
                    variant.hun = parts.slice(0, -1).join(' ');  // 마지막 제외 = 훈
                    variant.eum = parts[parts.length - 1];       // 마지막 = 음
                } else {
                    variant.hun = variant.meaning;
                    variant.eum = '';
                }
                delete variant.meaning;
                migratedCount++;
            }
        });
    });

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`✅ surnames.json: ${migratedCount}개 항목 마이그레이션 완료`);
}

// 실행
console.log('=== 훈/음 필드 마이그레이션 시작 ===\n');
migrateHanjaDb();
migrateSurnames();
console.log('\n=== 마이그레이션 완료 ===');
