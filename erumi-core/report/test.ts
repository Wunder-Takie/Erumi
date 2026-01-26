/**
 * 리포트 엔진 테스트 스크립트
 */

import { generateReport } from '../report';

async function testReport() {
    console.log('🧪 리포트 엔진 테스트 시작...\n');

    const input = {
        surname: '김',
        surnameHanja: '金',
        givenName: ['시', '랑'],
        givenNameHanja: ['詩', '朗'],
        saju: {
            birthDate: '2024-01-15',
            birthHour: 5,
            elements: {
                Wood: 2,
                Fire: 1,
                Earth: 1,
                Metal: 3,
                Water: 1,
            },
            yongsin: ['Fire', 'Wood'],
        },
    };

    try {
        const report = await generateReport(input);

        console.log('=== Header ===');
        console.log(JSON.stringify(report.header, null, 2));

        console.log('\n=== Summary ===');
        console.log(report.summary.text);

        console.log('\n=== Analysis: YinYang ===');
        console.log(JSON.stringify(report.analysis.yinYang, null, 2));

        console.log('\n=== Analysis: Pronunciation ===');
        console.log(JSON.stringify(report.analysis.pronunciation, null, 2));

        console.log('\n=== Analysis: Numerology ===');
        console.log(JSON.stringify(report.analysis.numerology, null, 2));

        console.log('\n=== Analysis: Natural Elements ===');
        console.log(JSON.stringify(report.analysis.naturalElement, null, 2));

        console.log('\n=== Analysis: Forbidden Characters ===');
        console.log(JSON.stringify(report.analysis.forbiddenChar, null, 2));

        console.log('\n✅ 테스트 완료!');
    } catch (error) {
        console.error('❌ 테스트 실패:', error);
    }
}

testReport();
