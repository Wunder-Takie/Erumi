/**
 * wizardDataMapper.ts
 * WizardData → 엔진 파라미터 변환
 */

import { calculateSaju, extractYongsin } from 'erumi-core';

// ==========================================
// Types
// ==========================================

export interface WizardData {
    surname?: { id: string; hangul: string; hanja: string };
    gender?: 'male' | 'female' | 'unknown';
    birthDate?: Date;
    birthTime?: string;
    story?: string;
    vibe?: string;
    style?: string;
    loadMoreFlag?: boolean; // ResultStep에서 더보기 시 true로 설정
}

export interface EngineParams {
    surnameInput: {
        hangul: string;
        hanja: string;
    };
    gender: 'M' | 'F' | null;
    styleMode: 'modern' | 'saju_perfect';
    yongsinWeights: Record<string, number>;
    preferenceWeights: Record<string, number>;
    // 사주 분석 결과 (리포트에서 재사용)
    sajuElements?: Record<string, number>;        // 퍼센트 (UI 그래프용)
    sajuElementCounts?: Record<string, number>;   // 개수 (LLM용)
    yongsin?: string[];  // 용신 오행 배열
}

// ==========================================
// Story → 오행 매핑 (StoryStep.tsx의 실제 ID 사용)
// ==========================================

const STORY_TO_ELEMENT: Record<string, string> = {
    // StoryStep.tsx STORY_OPTIONS에서 추출
    'spring_dream': 'Wood',      // 봄날 꿈속에서
    'summer_passion': 'Fire',    // 한여름 뜨거운 기다림 끝에
    'autumn_harvest': 'Earth',   // 풍요로운 가을의 선물
    'winter_star': 'Metal',      // 맑고 겨울밤 별을 보며
    'night_dream': 'Water',      // 조용한 밤 꿈결에
};

// ==========================================
// Vibe → 오행 매핑 (VibeStep.tsx의 실제 ID 사용)
// ==========================================

const VIBE_TO_ELEMENT: Record<string, string> = {
    // VibeStep.tsx VIBE_OPTIONS에서 추출
    'forest_growth': 'Wood',     // 숲속 나무처럼 쑥쑥
    'sunshine_warmth': 'Fire',   // 햇살처럼 따뜻하게
    'mountain_steady': 'Earth',  // 산처럼 듬직하게
    'star_shine': 'Metal',       // 별처럼 빛나게
    'wave_flow': 'Water',        // 물결처럼 유연하게
};

// ==========================================
// Mapper Function
// ==========================================

export async function mapWizardDataToEngineParams(data: WizardData): Promise<EngineParams> {
    // 성씨 변환
    const surnameInput = {
        hangul: data.surname?.hangul || '',
        hanja: data.surname?.hanja || '',
    };

    // 성별 변환
    let gender: 'M' | 'F' | null = null;
    if (data.gender === 'male') gender = 'M';
    else if (data.gender === 'female') gender = 'F';

    // 스타일 변환 (StyleStep.tsx의 실제 ID 사용)
    // trendy → modern, traditional → saju_perfect
    const styleMode: 'modern' | 'saju_perfect' =
        data.style === 'traditional' ? 'saju_perfect' : 'modern';

    // 용신 분석 (사주 기반)
    let yongsinWeights: Record<string, number> = {
        Wood: 1, Fire: 1, Earth: 1, Metal: 1, Water: 1
    };
    let sajuElements: Record<string, number> | undefined = undefined;
    let sajuElementCounts: Record<string, number> | undefined = undefined;
    let yongsin: string[] | undefined = undefined;

    if (data.birthDate) {
        try {
            // birthTime을 시진에서 시간으로 변환
            const hourMap: Record<string, number> = {
                'ja': 0, 'chuk': 2, 'in': 4, 'myo': 6, 'jin': 8, 'sa': 10,
                'o': 12, 'mi': 14, 'sin': 16, 'yu': 18, 'sul': 20, 'hae': 22
            };
            const birthHour = data.birthTime && data.birthTime !== 'unknown'
                ? hourMap[data.birthTime] ?? null
                : null;

            const saju = await calculateSaju(data.birthDate, birthHour);
            const yongsinResult = extractYongsin(saju);

            // 용신 분석 결과에서 오행 분포 가져오기
            const distribution = yongsinResult.strength ? {
                Wood: saju.year?.stemElement === 'Wood' || saju.year?.branchElement === 'Wood' ? 1 : 0,
                Fire: saju.year?.stemElement === 'Fire' || saju.year?.branchElement === 'Fire' ? 1 : 0,
                Earth: saju.year?.stemElement === 'Earth' || saju.year?.branchElement === 'Earth' ? 1 : 0,
                Metal: saju.year?.stemElement === 'Metal' || saju.year?.branchElement === 'Metal' ? 1 : 0,
                Water: saju.year?.stemElement === 'Water' || saju.year?.branchElement === 'Water' ? 1 : 0,
            } : null;

            // sajuElements 계산 (퍼센트) + sajuElementCounts (개수)
            // analyzeElements는 import 안 했으므로 간단히 분포 계산
            const pillars = [saju.year, saju.month, saju.day, saju.hour].filter(Boolean);
            const counts: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
            for (const pillar of pillars) {
                if (pillar?.stemElement) counts[pillar.stemElement]++;
                if (pillar?.branchElement) counts[pillar.branchElement]++;
            }
            const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

            // 원본 개수 저장 (LLM용)
            sajuElementCounts = { ...counts };
            console.log('[Mapper] Saju element counts (raw):', sajuElementCounts);

            // 퍼센트로 변환 (UI 그래프용)
            sajuElements = {
                Wood: Math.round((counts.Wood / total) * 100),
                Fire: Math.round((counts.Fire / total) * 100),
                Earth: Math.round((counts.Earth / total) * 100),
                Metal: Math.round((counts.Metal / total) * 100),
                Water: Math.round((counts.Water / total) * 100),
            };
            console.log('[Mapper] Saju elements (percent):', sajuElements);

            // yongsin 배열 저장 및 weights 생성
            yongsin = yongsinResult.yongsin;
            for (const element of yongsinResult.yongsin) {
                yongsinWeights[element] = (yongsinWeights[element] || 1) + 1.0;
            }
        } catch (error) {
            console.warn('[Mapper] Saju calculation failed:', error);
        }
    }

    // 선호 오행 (스토리 + 바이브)
    const preferenceWeights: Record<string, number> = {
        Wood: 1, Fire: 1, Earth: 1, Metal: 1, Water: 1
    };

    if (data.story && STORY_TO_ELEMENT[data.story]) {
        const element = STORY_TO_ELEMENT[data.story];
        preferenceWeights[element] = (preferenceWeights[element] || 1) + 0.5;
    }

    if (data.vibe && VIBE_TO_ELEMENT[data.vibe]) {
        const element = VIBE_TO_ELEMENT[data.vibe];
        preferenceWeights[element] = (preferenceWeights[element] || 1) + 0.5;
    }

    return {
        surnameInput,
        gender,
        styleMode,
        yongsinWeights,
        preferenceWeights,
        sajuElements,
        sajuElementCounts,
        yongsin,
    };
}

export default mapWizardDataToEngineParams;
