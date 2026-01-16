/**
 * KASI API 테스트 스크립트
 * 실행: node test_kasi_api.js
 */

const API_KEY = '4be512db2db6a7ae670f7932c77b9264b50a37e15c9a28b97bffce213cdb684c';
const API_ENDPOINT = 'http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo';

async function testKASI() {
    console.log('🔍 KASI API 테스트 시작...\n');

    // 테스트 데이터: 2000년 1월 1일
    const testDate = {
        year: 2000,
        month: 1,
        day: 1
    };

    const params = new URLSearchParams({
        serviceKey: API_KEY,
        solYear: String(testDate.year),
        solMonth: String(testDate.month).padStart(2, '0'),
        solDay: String(testDate.day).padStart(2, '0'),
        _type: 'json'
    });

    const url = `${API_ENDPOINT}?${params}`;

    console.log('📡 요청 URL:', url.substring(0, 120) + '...\n');

    try {
        const response = await fetch(url);
        console.log('📊 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            const text = await response.text();
            console.error('❌ API 에러:', text);
            return;
        }

        const data = await response.json();
        console.log('\n✅ 응답 데이터:');
        console.log(JSON.stringify(data, null, 2));

        const item = data?.response?.body?.items?.item;
        if (item) {
            console.log('\n🎯 파싱 결과:');
            console.log('양력:', `${testDate.year}-${testDate.month}-${testDate.day}`);
            console.log('음력:', `${item.lunYear}-${item.lunMonth}-${item.lunDay}`);
            console.log('년주:', item.lunSecha);
            console.log('월주:', item.lunWolgeon);
            console.log('일주:', item.lunIljin);
        }
    } catch (error) {
        console.error('❌ 요청 실패:', error.message);
    }
}

testKASI();
