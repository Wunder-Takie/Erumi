/**
 * KASI API 디버깅 스크립트
 * 실행: VITE_KASI_API_KEY=your_key node debug_kasi_structure.js
 */

// Set environment variables explicitly for Node.js
process.env.VITE_KASI_API_KEY = process.env.VITE_KASI_API_KEY || '***REMOVED***';

import { fetchSajuFromKASI } from './src/utils/manselyeok/kasiAdapter.js';
import { calculateSaju } from './src/utils/sajuUtils.js';

async function debugStructure() {
    const testDate = '2000-01-01';
    const testHour = 12;

    console.log('🔍 KASI API vs 로컬 계산 구조 비교\n');
    console.log('테스트 데이터:', testDate, testHour, '\n');

    try {
        // KASI API 결과
        console.log('📡 KASI API 결과:');
        const kasiResult = await fetchSajuFromKASI(testDate, testHour);
        console.log(JSON.stringify(kasiResult, null, 2));
        console.log('\n년주:', kasiResult.year);
        console.log('월주:', kasiResult.month);
        console.log('일주:', kasiResult.day);
        console.log('시주:', kasiResult.hour);

        console.log('\n' + '='.repeat(60) + '\n');

        // 로컬 계산 결과
        console.log('💻 로컬 계산 결과:');
        const localResult = await calculateSaju(testDate, testHour);
        console.log(JSON.stringify(localResult, null, 2));
        console.log('\n년주:', localResult.year);
        console.log('월주:', localResult.month);
        console.log('일주:', localResult.day);
        console.log('시주:', localResult.hour);

        console.log('\n' + '='.repeat(60) + '\n');

        // 구조 비교
        console.log('🔍 구조 차이 분석:');
        ['year', 'month', 'day', 'hour'].forEach(pillarName => {
            const kasi = kasiResult[pillarName];
            const local = localResult[pillarName];

            console.log(`\n${pillarName}주 비교:`);
            console.log('  KASI:', kasi);
            console.log('  로컬:', local);

            if (!kasi && local) {
                console.log('  ⚠️ KASI에서 null, 로컬에서는 값 있음');
            } else if (kasi && !local) {
                console.log('  ⚠️ 로컬에서 null, KASI에서는 값 있음');
            } else if (kasi && local) {
                if (!kasi.stemElement || !kasi.branchElement) {
                    console.log('  ⚠️ KASI 결과에 stemElement 또는 branchElement 누락!');
                }
                if (!local.stemElement || !local.branchElement) {
                    console.log('  ⚠️ 로컬 결과에 stemElement 또는 branchElement 누락!');
                }
            }
        });

    } catch (error) {
        console.error('❌ 에러 발생:', error);
        console.error(error.stack);
    }
}

debugStructure();
