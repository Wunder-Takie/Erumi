/**
 * kasiAdapter.ts
 * 한국천문연구원 API 어댑터
 * 공공데이터포털: data.go.kr
 */

import sajuData from '../../data/saju/saju_data.json' with { type: 'json' };

// ==========================================
// Types
// ==========================================

type ElementType = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface PillarInfo {
    pillar: string;
    stem: string;
    branch: string;
    stemElement: ElementType;
    branchElement: ElementType;
    reading?: string;
    element?: ElementType;
    solarMonth?: number;
}

interface LunarDate {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
}

interface SolarDate {
    year: number;
    month: number;
    day: number;
}

interface GanjiInfo {
    year: string;
    month: string | null;
    day: string;
}

interface LunarInfo {
    solarDate: SolarDate;
    lunarDate: LunarDate;
    ganji: GanjiInfo;
}

interface SolarTermInfo {
    name: string;
    date: Date;
}

export interface SajuResult {
    year: PillarInfo | null;
    month: PillarInfo | null;
    day: PillarInfo | null;
    hour: PillarInfo | null;
    source: 'kasi_api' | 'local_fallback';
    birthInfo: {
        year: number;
        month: number;
        day: number;
        hour: number | null;
    };
}

interface SajuDataJson {
    천간: Record<string, { element: ElementType }>;
    지지: Record<string, { element: ElementType }>;
    월건표: Record<string, string[]>;
}

// ==========================================
// Internal State
// ==========================================

const getApiKey = (): string => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_KASI_API_KEY || '';
    }
    return '';
};

const API_ENDPOINTS = {
    lunarDate: 'http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo',
    solarTerm: 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo'
};

const typedSajuData = sajuData as SajuDataJson;

const STEM_ELEMENTS: Record<string, ElementType> = Object.fromEntries(
    Object.entries(typedSajuData.천간).map(([key, value]) => [key, value.element])
) as Record<string, ElementType>;

const BRANCH_ELEMENTS: Record<string, ElementType> = Object.fromEntries(
    Object.entries(typedSajuData.지지).map(([key, value]) => [key, value.element])
) as Record<string, ElementType>;

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// ==========================================
// Internal Functions
// ==========================================

function getSolarMonth(month: number, day: number): number {
    const boundaries = [
        { month: 1, day: 5 },
        { month: 2, day: 4 },
        { month: 3, day: 6 },
        { month: 4, day: 5 },
        { month: 5, day: 6 },
        { month: 6, day: 6 },
        { month: 7, day: 7 },
        { month: 8, day: 8 },
        { month: 9, day: 8 },
        { month: 10, day: 8 },
        { month: 11, day: 7 },
        { month: 12, day: 7 }
    ];
    const boundary = boundaries[month - 1];
    return day >= boundary.day ? month : (month === 1 ? 12 : month - 1);
}

function getLocalYearPillar(year: number): { stem: string; branch: string; pillar: string } {
    const stemIndex = (year - 4) % 10;
    const branchIndex = (year - 4) % 12;
    const stem = STEMS[stemIndex];
    const branch = BRANCHES[branchIndex];
    return { stem, branch, pillar: stem + branch };
}

function getLocalMonthPillar(year: number, month: number, day: number): PillarInfo {
    const yearPillar = getLocalYearPillar(year);
    const solarMonth = getSolarMonth(month, day);
    const yearStem = yearPillar.stem;
    const monthPillars = typedSajuData['월건표'][yearStem];
    const pillar = monthPillars[solarMonth - 1];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: STEM_ELEMENTS[stem] || 'Earth',
        branchElement: BRANCH_ELEMENTS[branch] || 'Earth',
        solarMonth
    };
}

function parsePillar(pillarStr: string | null): PillarInfo | null {
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

function calculateHourPillar(dayStem: string, hour: number): PillarInfo {
    const hourBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

    let branchIndex: number;
    if (hour >= 23 || hour < 1) branchIndex = 0;
    else if (hour < 3) branchIndex = 1;
    else if (hour < 5) branchIndex = 2;
    else if (hour < 7) branchIndex = 3;
    else if (hour < 9) branchIndex = 4;
    else if (hour < 11) branchIndex = 5;
    else if (hour < 13) branchIndex = 6;
    else if (hour < 15) branchIndex = 7;
    else if (hour < 17) branchIndex = 8;
    else if (hour < 19) branchIndex = 9;
    else if (hour < 21) branchIndex = 10;
    else branchIndex = 11;

    const branch = hourBranches[branchIndex];

    const hourStemTable: Record<string, string[]> = {
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

// ==========================================
// Exported Functions
// ==========================================

export async function fetchLunarInfo(year: number, month: number, day: number): Promise<LunarInfo> {
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

    console.log('[KASI] API Response fields:', {
        lunSecha: item.lunSecha,
        lunWolgeon: item.lunWolgeon,
        lunIljin: item.lunIljin
    });

    return {
        solarDate: { year, month, day },
        lunarDate: {
            year: parseInt(item.lunYear),
            month: parseInt(item.lunMonth),
            day: parseInt(item.lunDay),
            isLeapMonth: item.lunLeapmonth === 'Y'
        },
        ganji: {
            year: item.lunSecha,
            month: item.lunWolgeon || null,
            day: item.lunIljin
        }
    };
}

export async function fetchSolarTerms(year: number, month: number): Promise<SolarTermInfo[]> {
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

    const itemsArray = Array.isArray(items) ? items : [items];

    return itemsArray.map((item: { dateName: string; locdate: string }) => ({
        name: item.dateName,
        date: new Date(
            parseInt(item.locdate.substring(0, 4)),
            parseInt(item.locdate.substring(4, 6)) - 1,
            parseInt(item.locdate.substring(6, 8))
        )
    }));
}

export async function fetchSajuFromKASI(birthDate: Date | string, birthHour: number | null = null): Promise<SajuResult> {
    const date = new Date(birthDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const lunarInfo = await fetchLunarInfo(year, month, day);

    const yearPillar = parsePillar(lunarInfo.ganji.year);
    let monthPillar = parsePillar(lunarInfo.ganji.month);
    const dayPillar = parsePillar(lunarInfo.ganji.day);

    if (!monthPillar) {
        console.warn('[KASI] lunWolgeon not provided, using local month pillar calculation');
        monthPillar = getLocalMonthPillar(year, month, day);
    }

    let hourPillar: PillarInfo | null = null;
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

export function isKASIAvailable(): boolean {
    return !!getApiKey();
}

export default {
    fetchSajuFromKASI,
    fetchLunarInfo,
    fetchSolarTerms,
    isKASIAvailable
};
