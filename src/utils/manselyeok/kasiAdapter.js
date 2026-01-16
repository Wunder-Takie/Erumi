/**
 * kasiAdapter.js
 * 한국천문연구원 API 어댑터
 * 공공데이터포털: data.go.kr
 */

/**
 * @typedef {Object} PillarInfo
 * @property {string} pillar - 간지 (예: "갑자")
 * @property {string} stem - 천간 (예: "갑")
 * @property {string} branch - 지지 (예: "자")
 * @property {string} stemElement - 천간 오행
 * @property {string} branchElement - 지지 오행
 */

/**
 * @typedef {Object} SolarTermInfo
 * @property {string} termName - 절기명
 * @property {Date} termDate - 절기 일시
 */

// 환경변수에서 API 키 로드
const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_KASI_API_KEY || '';
    }
    return '';
};

// API 엔드포인트
const API_ENDPOINTS = {
    lunarDate: 'http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo',
    solarTerm: 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo'
};

// 천간/지지 오행 매핑
const STEM_ELEMENTS = {
    '갑': 'Wood', '을': 'Wood',
    '병': 'Fire', '정': 'Fire',
    '무': 'Earth', '기': 'Earth',
    '경': 'Metal', '신': 'Metal',
    '임': 'Water', '계': 'Water'
};

const BRANCH_ELEMENTS = {
    '자': 'Water', '축': 'Earth', '인': 'Wood', '묘': 'Wood',
    '진': 'Earth', '사': 'Fire', '오': 'Fire', '미': 'Earth',
    '신': 'Metal', '유': 'Metal', '술': 'Earth', '해': 'Water'
};

/**
 * 간지 문자열을 PillarInfo로 파싱
 */
function parsePillar(pillarStr) {
    if (!pillarStr || pillarStr.length < 2) {
        return null;
    }

    const stem = pillarStr[0];
    const branch = pillarStr[1];

    return {
        pillar: pillarStr,
        stem,
        branch,
        stemElement: STEM_ELEMENTS[stem] || 'Earth',
        branchElement: BRANCH_ELEMENTS[branch] || 'Earth'
    };
}

/**
 * 한국천문연구원 API에서 음력 정보 조회
 * @param {number} year - 연도
 * @param {number} month - 월
 * @param {number} day - 일
 * @returns {Promise<Object>}
 */
export async function fetchLunarInfo(year, month, day) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('KASI API key not configured');
    }

    const params = new URLSearchParams({
        serviceKey: apiKey,
        solYear: String(year),
        solMonth: String(month).padStart(2, '0'),
        solDay: String(day).padStart(2, '0'),
        _type: 'json'
    });

    const response = await fetch(`${API_ENDPOINTS.lunarDate}?${params}`);

    if (!response.ok) {
        throw new Error(`KASI API error: ${response.status}`);
    }

    const data = await response.json();
    const item = data?.response?.body?.items?.item;

    if (!item) {
        throw new Error('No data from KASI API');
    }

    return {
        solarDate: { year, month, day },
        lunarDate: {
            year: parseInt(item.lunYear),
            month: parseInt(item.lunMonth),
            day: parseInt(item.lunDay),
            isLeapMonth: item.lunLeapmonth === 'Y'
        },
        ganji: {
            year: item.lunSecha,    // 년주 (세차)
            month: item.lunWolgeon, // 월주 (월건)
            day: item.lunIljin      // 일주 (일진)
        }
    };
}

/**
 * 24절기 정보 조회
 * @param {number} year - 연도
 * @param {number} month - 월 (절기가 속한 달)
 * @returns {Promise<Array>}
 */
export async function fetchSolarTerms(year, month) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('KASI API key not configured');
    }

    const params = new URLSearchParams({
        serviceKey: apiKey,
        solYear: String(year),
        solMonth: String(month).padStart(2, '0'),
        _type: 'json'
    });

    const response = await fetch(`${API_ENDPOINTS.solarTerm}?${params}`);

    if (!response.ok) {
        throw new Error(`KASI API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data?.response?.body?.items?.item;

    if (!items) {
        return [];
    }

    // 배열로 정규화
    const itemsArray = Array.isArray(items) ? items : [items];

    return itemsArray.map(item => ({
        name: item.dateName,
        date: new Date(
            parseInt(item.locdate.substring(0, 4)),
            parseInt(item.locdate.substring(4, 6)) - 1,
            parseInt(item.locdate.substring(6, 8))
        )
    }));
}

/**
 * API에서 사주 정보 조회
 * @param {Date|string} birthDate - 생년월일
 * @param {number|null} birthHour - 태어난 시간 (0-23)
 * @returns {Promise<Object>} 사주 정보
 */
export async function fetchSajuFromKASI(birthDate, birthHour = null) {
    const date = new Date(birthDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // API에서 음력/간지 정보 조회
    const lunarInfo = await fetchLunarInfo(year, month, day);

    // 년주, 월주, 일주 파싱
    const yearPillar = parsePillar(lunarInfo.ganji.year);
    const monthPillar = parsePillar(lunarInfo.ganji.month);
    const dayPillar = parsePillar(lunarInfo.ganji.day);

    // 시주는 로컬에서 계산 (API 미제공)
    let hourPillar = null;
    if (birthHour !== null && dayPillar) {
        hourPillar = calculateHourPillar(dayPillar.stem, birthHour);
    }

    return {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar,
        source: 'kasi_api',
        birthInfo: { year, month, day, hour: birthHour }
    };
}

/**
 * 시주 계산 (로컬)
 * 일간 기준으로 시주 결정
 */
function calculateHourPillar(dayStem, hour) {
    // 시간 → 지지 매핑
    const hourBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

    // 시간을 시진으로 변환
    let branchIndex;
    if (hour >= 23 || hour < 1) branchIndex = 0;      // 자시
    else if (hour < 3) branchIndex = 1;                // 축시
    else if (hour < 5) branchIndex = 2;                // 인시
    else if (hour < 7) branchIndex = 3;                // 묘시
    else if (hour < 9) branchIndex = 4;                // 진시
    else if (hour < 11) branchIndex = 5;               // 사시
    else if (hour < 13) branchIndex = 6;               // 오시
    else if (hour < 15) branchIndex = 7;               // 미시
    else if (hour < 17) branchIndex = 8;               // 신시
    else if (hour < 19) branchIndex = 9;               // 유시
    else if (hour < 21) branchIndex = 10;              // 술시
    else branchIndex = 11;                             // 해시

    const branch = hourBranches[branchIndex];

    // 일간별 시건표
    const hourStemTable = {
        '갑': ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
        '기': ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
        '을': ['병', '정', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
        '경': ['병', '정', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
        '병': ['무', '기', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
        '신': ['무', '기', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
        '정': ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
        '임': ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
        '무': ['임', '계', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
        '계': ['임', '계', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
    };

    const stems = hourStemTable[dayStem];
    const stem = stems ? stems[branchIndex] : '갑';
    const pillar = stem + branch;

    return {
        pillar,
        stem,
        branch,
        stemElement: STEM_ELEMENTS[stem],
        branchElement: BRANCH_ELEMENTS[branch]
    };
}

/**
 * API 사용 가능 여부 확인
 */
export function isKASIAvailable() {
    return !!getApiKey();
}

export default {
    fetchSajuFromKASI,
    fetchLunarInfo,
    fetchSolarTerms,
    isKASIAvailable
};
