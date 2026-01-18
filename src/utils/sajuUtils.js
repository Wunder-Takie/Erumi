/**
 * sajuUtils.js
 * 사주팔자 계산 유틸리티
 */

import sajuData from '../data/saju/saju_data.json' with { type: 'json' };
import { getSaju as getManselyeokSaju, isKASIAvailable } from './manselyeok/index.js';

// ============================================
// 1. 기본 데이터
// ============================================

const 천간_LIST = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const 지지_LIST = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// ============================================
// 2. 년주 계산
// ============================================

/**
 * 양력 연도로 년주 계산
 * 기준: 1984년 = 갑자년
 */
export function getYearPillar(year) {
    // 갑자년 기준: 1984, 1924, 1864...
    const baseYear = 1984;
    const diff = year - baseYear;

    // 60갑자 순환
    let index = diff % 60;
    if (index < 0) index += 60;

    const pillar = sajuData['60갑자'][index];
    const stem = pillar[0];  // 천간
    const branch = pillar[1]; // 지지

    return {
        pillar,
        stem,
        branch,
        stemElement: sajuData['천간'][stem].element,
        branchElement: sajuData['지지'][branch].element
    };
}

// ============================================
// 3. 월주 계산 (절기 기준)
// ============================================

/**
 * 절기 기준 월 계산 (대략적 - 정밀 계산은 만세력 필요)
 */
function getSolarMonth(month, day) {
    // 절기 경계 (대략적)
    const boundaries = [
        { month: 1, day: 5 },   // 소한 → 1월
        { month: 2, day: 4 },   // 입춘 → 2월 (새해 시작)
        { month: 3, day: 6 },   // 경칩 → 3월
        { month: 4, day: 5 },   // 청명 → 4월
        { month: 5, day: 6 },   // 입하 → 5월
        { month: 6, day: 6 },   // 망종 → 6월
        { month: 7, day: 7 },   // 소서 → 7월
        { month: 8, day: 8 },   // 입추 → 8월
        { month: 9, day: 8 },   // 백로 → 9월
        { month: 10, day: 8 },  // 한로 → 10월
        { month: 11, day: 7 },  // 입동 → 11월
        { month: 12, day: 7 }   // 대설 → 12월
    ];

    const boundary = boundaries[month - 1];
    if (day >= boundary.day) {
        return month;
    } else {
        return month === 1 ? 12 : month - 1;
    }
}

/**
 * 월주 계산
 */
export function getMonthPillar(year, month, day) {
    const yearPillar = getYearPillar(year);
    const solarMonth = getSolarMonth(month, day);

    // 월건표에서 해당 월의 간지 찾기
    const yearStem = yearPillar.stem;
    const monthPillars = sajuData['월건표'][yearStem];

    // 인월(1월=2월)부터 시작하므로 조정
    const pillar = monthPillars[solarMonth - 1];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: sajuData['천간'][stem].element,
        branchElement: sajuData['지지'][branch].element,
        solarMonth
    };
}

// ============================================
// 4. 일주 계산
// ============================================

/**
 * 일주 계산 (기준일로부터 계산)
 * 기준: 2000년 1월 1일 = 갑진일 (index 40)
 */
export function getDayPillar(year, month, day) {
    // 2000년 1월 1일 기준
    const baseDate = new Date(2000, 0, 1);
    const targetDate = new Date(year, month - 1, day);

    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

    // 2000년 1월 1일 = 갑진 (index 40)
    let index = (40 + diffDays) % 60;
    if (index < 0) index += 60;

    const pillar = sajuData['60갑자'][index];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: sajuData['천간'][stem].element,
        branchElement: sajuData['지지'][branch].element
    };
}

// ============================================
// 5. 시주 계산
// ============================================

/**
 * 시간을 지지(시신)로 변환
 */
function getHourBranch(hour) {
    // 시간별 지지 매핑
    const hourMap = [
        { start: 23, end: 1, branch: '자', index: 0 },
        { start: 1, end: 3, branch: '축', index: 1 },
        { start: 3, end: 5, branch: '인', index: 2 },
        { start: 5, end: 7, branch: '묘', index: 3 },
        { start: 7, end: 9, branch: '진', index: 4 },
        { start: 9, end: 11, branch: '사', index: 5 },
        { start: 11, end: 13, branch: '오', index: 6 },
        { start: 13, end: 15, branch: '미', index: 7 },
        { start: 15, end: 17, branch: '신', index: 8 },
        { start: 17, end: 19, branch: '유', index: 9 },
        { start: 19, end: 21, branch: '술', index: 10 },
        { start: 21, end: 23, branch: '해', index: 11 }
    ];

    for (const h of hourMap) {
        if (h.start <= h.end) {
            if (hour >= h.start && hour < h.end) return h;
        } else {
            // 자시 (23~1) 처리
            if (hour >= h.start || hour < h.end) return h;
        }
    }
    return hourMap[0]; // 기본값
}

/**
 * 시주 계산
 */
export function getHourPillar(dayStem, hour) {
    const hourInfo = getHourBranch(hour);
    const hourPillars = sajuData['시건표'][dayStem];

    const pillar = hourPillars[hourInfo.index];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: sajuData['천간'][stem].element,
        branchElement: sajuData['지지'][branch].element,
        hourInfo
    };
}

// ============================================
// 6. 전체 사주 계산
// ============================================

/**
 * 완전 사주팔자 계산 (KASI API 우선, 로컬 폴백)
 */
export async function calculateSaju(birthDate, birthHour = null) {
    // KASI API 활성화 (개선된 null 체크로 안전함)
    const useKASI = true;

    if (useKASI && isKASIAvailable()) {
        try {
            console.log('[Saju] Using KASI API for precise calculation');
            const result = await getManselyeokSaju(birthDate, birthHour);
            return result;
        } catch (error) {
            console.warn('[Saju] KASI API failed, using local fallback:', error.message);
        }
    }

    // 로컬 폴백 계산
    console.log('[Saju] Using local calculation');
    const date = new Date(birthDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const yearPillar = getYearPillar(year);
    const monthPillar = getMonthPillar(year, month, day);
    const dayPillar = getDayPillar(year, month, day);

    let hourPillar = null;
    if (birthHour !== null) {
        hourPillar = getHourPillar(dayPillar.stem, birthHour);
    }

    return {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar,
        source: 'local_calculation',
        birthInfo: { year, month, day, hour: birthHour }
    };
}

// ============================================
// 7. 오행 분석
// ============================================

/**
 * 사주에서 오행 분포 분석
 */
export function analyzeElements(saju) {
    if (!saju) {
        console.error('[analyzeElements] saju is null or undefined');
        return { distribution: {}, neededElements: [], excessElements: [] };
    }

    const counts = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

    // 천간 오행(4개 또는 3개)
    const pillars = [saju.year, saju.month, saju.day];
    if (saju.hour) pillars.push(saju.hour);

    for (const pillar of pillars) {
        if (!pillar) {
            console.warn('[analyzeElements] Skipping null pillar');
            continue; // null 체크
        }
        if (!pillar.stemElement || !pillar.branchElement) {
            console.warn('[analyzeElements] Pillar missing elements:', pillar);
        }
        if (pillar.stemElement) counts[pillar.stemElement]++;
        if (pillar.branchElement) counts[pillar.branchElement]++;
    }

    // 부족한 오행 찾기 (1개 이하)
    const needed = Object.entries(counts)
        .filter(([_, count]) => count <= 1)
        .sort((a, b) => a[1] - b[1])
        .map(([element]) => element);

    // 과다한 오행 찾기 (3개 이상)
    const excess = Object.entries(counts)
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .map(([element]) => element);

    return {
        distribution: counts,
        needed,
        excess,
        total: Object.values(counts).reduce((a, b) => a + b, 0)
    };
}

/**
 * 오행 분석 결과를 가중치로 변환
 */
export function sajuToWeights(saju) {
    const analysis = analyzeElements(saju);
    const weights = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

    // 부족한 오행에 가중치 부여 (가장 부족한 것이 높은 점수)
    analysis.needed.forEach((element, index) => {
        weights[element] = 30 - (index * 10); // 30, 20, 10...
    });

    return weights;
}

/**
 * 분석 결과 설명 생성
 */
export function generateAnalysisText(saju) {
    const analysis = analyzeElements(saju);

    const elementNames = {
        Wood: '나무(木)',
        Fire: '불(火)',
        Earth: '흙(土)',
        Metal: '쇠(金)',
        Water: '물(水)'
    };

    let text = '';

    if (analysis.needed.length > 0) {
        const neededNames = analysis.needed.map(e => elementNames[e]).join(', ');
        text += `${neededNames}의 기운이 부족합니다. `;
        text += `이름에서 이 기운을 보충해주면 좋습니다.`;
    } else {
        text += '오행이 비교적 균형 잡혀 있습니다.';
    }

    return text;
}

// ============================================
// 8. 용신(用神) 추출 (NEW)
// ============================================

/**
 * 오행 상생 관계
 */
const ELEMENT_GENERATION = {
    Wood: 'Fire',    // 木生火
    Fire: 'Earth',   // 火生土
    Earth: 'Metal',  // 土生金
    Metal: 'Water',  // 金生水
    Water: 'Wood'    // 水生木
};

/**
 * 오행 상극 관계
 */
const ELEMENT_DESTRUCTION = {
    Wood: 'Earth',   // 木剋土
    Fire: 'Metal',   // 火剋金
    Earth: 'Water',  // 土剋水
    Metal: 'Wood',   // 金剋木
    Water: 'Fire'    // 水剋火
};

/**
 * 일간(日干) 강약 분석
 * 왕상휴수사(旺相休囚死) 기준
 */
function analyzeDayMasterStrength(saju) {
    // Null 체크: 필수 pillars가 없으면 기본값 반환
    if (!saju || !saju.day || !saju.month) {
        console.warn('[analyzeDayMasterStrength] Missing required pillars (day or month)');
        return {
            dayElement: 'Wood',
            monthElement: 'Wood',
            seasonScore: 0,
            sameElementCount: 0,
            birthingCount: 0,
            totalStrength: 0,
            isStrong: false
        };
    }

    // Pillar에 element 정보가 없는 경우도 체크
    if (!saju.day.stemElement || !saju.month.branchElement) {
        console.warn('[analyzeDayMasterStrength] Pillars missing element info:', {
            day: saju.day,
            month: saju.month
        });
        return {
            dayElement: saju.day.stemElement || 'Wood',
            monthElement: saju.month.branchElement || 'Wood',
            seasonScore: 0,
            sameElementCount: 0,
            birthingCount: 0,
            totalStrength: 0,
            isStrong: false
        };
    }

    const dayElement = saju.day.stemElement;
    const monthElement = saju.month.branchElement;
    const distribution = analyzeElements(saju).distribution;

    // 득령(得令): 월지와 일간의 관계
    let seasonScore = 0;
    if (monthElement === dayElement) {
        seasonScore = 2; // 왕(旺)
    } else if (ELEMENT_GENERATION[monthElement] === dayElement) {
        seasonScore = 1; // 상(相)
    } else if (ELEMENT_GENERATION[dayElement] === monthElement) {
        seasonScore = 0; // 휴(休)
    } else if (ELEMENT_DESTRUCTION[monthElement] === dayElement) {
        seasonScore = -1; // 수(囚)
    } else if (ELEMENT_DESTRUCTION[dayElement] === monthElement) {
        seasonScore = -2; // 사(死)
    }

    // 득세(得勢): 같은 오행 개수
    const sameElementCount = distribution[dayElement] || 0;
    // 생아(生我): 나를 생하는 오행
    const birthingElement = Object.keys(ELEMENT_GENERATION).find(
        k => ELEMENT_GENERATION[k] === dayElement
    );
    const birthingCount = distribution[birthingElement] || 0;

    // 총 힘 계산
    const totalStrength = (sameElementCount * 1.5) + (birthingCount * 1) + seasonScore;

    // 강약 판단 (기준: 4점)
    // 사주가 4주이면 총 8개 글자, 평균 1.6개/오행
    // 일간과 생아 합쳐서 4개 이상이면 강
    const isStrong = totalStrength >= 4;

    return {
        dayElement,
        monthElement,
        seasonScore,
        sameElementCount,
        birthingCount,
        totalStrength,
        isStrong
    };
}

/**
 * 용신(用神) 추출
 * 
 * 강한 사주 → 설기(泄氣: 내가 생하는 것), 극아(剋我: 나를 제압하는 것)
 * 약한 사주 → 생아(生我: 나를 생하는 것), 비겁(比劫: 나와 같은 것)
 */
export function extractYongsin(saju) {
    const strength = analyzeDayMasterStrength(saju);
    const dayElement = strength.dayElement;
    const distribution = analyzeElements(saju).distribution;

    // 오행 관계 계산
    const relationships = {
        same: dayElement, // 비겁(나와 같은)
        birther: Object.keys(ELEMENT_GENERATION).find(k => ELEMENT_GENERATION[k] === dayElement), // 생아
        child: ELEMENT_GENERATION[dayElement], // 설기(내가 생하는)
        controller: Object.keys(ELEMENT_GENERATION).find(k => ELEMENT_DESTRUCTION[k] === dayElement), // 극아
        controlled: ELEMENT_DESTRUCTION[dayElement] // 아극(내가 제압하는)
    };

    let yongsin = []; // 용신 (가장 필요한 오행)
    let huisin = []; // 희신 (용신을 돕는 오행)
    let gisin = []; // 기신 (피해야 할 오행)

    if (strength.isStrong) {
        // 강한 사주: 힘을 빼줘야 함
        // 용신: 설기(내가 생하는 것) - 에너지 발산
        yongsin.push(relationships.child);

        // 희신: 극아(나를 제압하는 것) - 균형 잡기
        huisin.push(relationships.controller);
        huisin.push(relationships.controlled); // 아극도 희신

        // 기신: 비겁, 생아 (더 강하게 만드는 것)
        gisin.push(relationships.same);
        gisin.push(relationships.birther);
    } else {
        // 약한 사주: 힘을 채워줘야 함
        // 용신: 생아(나를 생하는 것) - 에너지 보충
        yongsin.push(relationships.birther);

        // 희신: 비겁(나와 같은 것) - 힘 더함
        huisin.push(relationships.same);

        // 기신: 설기, 극아 (약해지게 만드는 것)
        gisin.push(relationships.child);
        gisin.push(relationships.controller);
    }

    // 중복 제거 및 undefined 제거
    yongsin = yongsin.filter(Boolean);
    huisin = huisin.filter(Boolean);
    gisin = gisin.filter(Boolean);

    // 추가: 분포 기반 보정
    // 사주에 전혀 없는 오행도 용신 후보
    const missingElements = Object.keys(distribution).filter(e => distribution[e] === 0);

    return {
        strength,
        yongsin,      // 용신: 가장 필요한 오행 (이름에 넣어야 함)
        huisin,       // 희신: 용신을 돕는 오행 (이름에 넣으면 좋음)
        gisin,        // 기신: 피해야 할 오행 (이름에 피해야 함)
        missing: missingElements,
        summary: generateYongsinSummary(strength, yongsin, huisin)
    };
}

/**
 * 용신 분석 요약 텍스트
 */
function generateYongsinSummary(strength, yongsin, huisin) {
    const elementNames = {
        Wood: '목(木)',
        Fire: '화(火)',
        Earth: '토(土)',
        Metal: '금(金)',
        Water: '수(水)'
    };

    const dayName = elementNames[strength.dayElement] || strength.dayElement;
    const strengthText = strength.isStrong ? '강한' : '약한';
    const yongsinNames = yongsin.map(e => elementNames[e]).join(', ');

    return `일간 ${dayName}이 ${strengthText} 편입니다. 용신은 ${yongsinNames}입니다.`;
}

// ============================================
// 8. Export
// ============================================

export default {
    calculateSaju,
    analyzeElements,
    sajuToWeights,
    generateAnalysisText,
    extractYongsin,
    getYearPillar,
    getMonthPillar,
    getDayPillar,
    getHourPillar
};
