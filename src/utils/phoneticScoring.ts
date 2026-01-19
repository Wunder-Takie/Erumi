/**
 * phoneticScoring.ts
 * 발음 관련 필터링 및 스코어링 유틸리티
 */

import { decomposeHangul, ROUND_VOWELS } from './hangulUtils.ts';

// ============================================
// Types
// ============================================

export interface PhoneticCheckResult {
    passed: boolean;
    reason?: string;
    score?: number;
}

// ============================================
// Phonetic Filtering Functions
// ============================================

/**
 * 초성 반복 체크
 * 예: "강가가" (ㄱ-ㄱ-ㄱ) → 어색함
 * @returns true면 탈락
 */
export function hasChoSeongRepetition(surname: string, char1: string, char2: string): boolean {
    const decomposedSurname = decomposeHangul(surname);
    const decomposed1 = decomposeHangul(char1);
    const decomposed2 = decomposeHangul(char2);

    if (!decomposedSurname || !decomposed1 || !decomposed2) return false;

    const cho0 = decomposedSurname.cho;
    const cho1 = decomposed1.cho;
    const cho2 = decomposed2.cho;

    // ㅇ-ㅇ은 허용 (예: 아이, 우아)
    if (cho1 === 'ㅇ' && cho2 === 'ㅇ') return false;
    // 이름 두 글자 초성 반복
    if (cho1 === cho2 && cho1 !== 'ㅇ') return true;
    // 성씨-이름 3연속 초성 반복
    if (cho0 === cho1 && cho1 === cho2) return true;

    return false;
}

/**
 * 원순모음 충돌 체크
 * 예: "우주" (ㅜ-ㅜ) → 발음 어려움
 * @returns true면 탈락
 */
export function hasRoundVowelConflict(char1: string, char2: string): boolean {
    const decomposed1 = decomposeHangul(char1);
    const decomposed2 = decomposeHangul(char2);

    if (!decomposed1 || !decomposed2) return false;

    const isRound1 = ROUND_VOWELS.includes(decomposed1.jung);
    const isRound2 = ROUND_VOWELS.includes(decomposed2.jung);

    return isRound1 && isRound2;
}

/**
 * 종성-초성 충돌 체크 (ㄴ-ㄹ / ㄹ-ㄴ)
 * 예: "진리" (ㄴ-ㄹ) → 발음 변환 발생
 * @returns true면 탈락
 */
export function hasJongChoConflict(char1: string, char2: string): boolean {
    const decomposed1 = decomposeHangul(char1);
    const decomposed2 = decomposeHangul(char2);

    if (!decomposed1 || !decomposed2) return false;

    const jong1 = decomposed1.jong;
    const cho2 = decomposed2.cho;

    if (jong1 === 'ㄴ' && cho2 === 'ㄹ') return true;
    if (jong1 === 'ㄹ' && cho2 === 'ㄴ') return true;

    return false;
}

/**
 * 종합 발음 필터 체크
 * 모든 발음 관련 필터를 한번에 확인
 */
export function checkPhoneticFilters(
    surname: string,
    char1: string,
    char2: string
): PhoneticCheckResult {
    if (hasChoSeongRepetition(surname, char1, char2)) {
        return { passed: false, reason: '초성 반복' };
    }

    if (hasRoundVowelConflict(char1, char2)) {
        return { passed: false, reason: '원순모음 충돌' };
    }

    if (hasJongChoConflict(char1, char2)) {
        return { passed: false, reason: '종성-초성 충돌 (ㄴ/ㄹ)' };
    }

    return { passed: true };
}

// ============================================
// Phonetic Scoring Functions
// ============================================

/**
 * 받침 밸런스 점수 계산
 * 이름 두 글자의 받침 유무 조합 평가
 */
export function calculateJongseongBalance(char1: string, char2: string): number {
    const d1 = decomposeHangul(char1);
    const d2 = decomposeHangul(char2);

    if (!d1 || !d2) return 0;

    const hasJong1 = d1.jong !== '';
    const hasJong2 = d2.jong !== '';

    // 받침 없음-있음 (가장 좋음): +5
    if (!hasJong1 && hasJong2) return 5;
    // 있음-없음 (좋음): +3
    if (hasJong1 && !hasJong2) return 3;
    // 둘 다 없음 (가벼움): +2
    if (!hasJong1 && !hasJong2) return 2;
    // 둘 다 있음 (무거움): -2
    return -2;
}

/**
 * 모음 조화 점수 계산
 * 양성모음/음성모음 조화 평가
 */
export function calculateVowelHarmony(char1: string, char2: string): number {
    const d1 = decomposeHangul(char1);
    const d2 = decomposeHangul(char2);

    if (!d1 || !d2) return 0;

    const positiveVowels = ['ㅏ', 'ㅑ', 'ㅗ', 'ㅛ', 'ㅘ'];
    const negativeVowels = ['ㅓ', 'ㅕ', 'ㅜ', 'ㅠ', 'ㅝ'];

    const isPos1 = positiveVowels.includes(d1.jung);
    const isPos2 = positiveVowels.includes(d2.jung);
    const isNeg1 = negativeVowels.includes(d1.jung);
    const isNeg2 = negativeVowels.includes(d2.jung);

    // 양성-양성 또는 음성-음성 (조화): +3
    if ((isPos1 && isPos2) || (isNeg1 && isNeg2)) return 3;
    // 중성모음 포함 (중립): 0
    // 양성-음성 불조화: -2
    if ((isPos1 && isNeg2) || (isNeg1 && isPos2)) return -2;

    return 0;
}
