/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * namingUtils.ts
 * 작명 앱의 핵심 엔진 - 한자 이름 생성 및 필터링 로직
 * 모듈 분리 완료: 7개 모듈 생성
 */

// ============================================
// 1. Data Import
// ============================================
// Core data
import hanjaDb from '../data/core/hanja_db.json' with { type: 'json' };
// Filter data
import modernPreferences from '../data/filter/modern_preferences.json' with { type: 'json' };
// Korean & UI data
import valueTags from '../data/ui/value_tags.json' with { type: 'json' };
import logicRules from '../data/scoring/logic_rules.json' with { type: 'json' };
import { checkGlobalName } from './globalNameCheck.ts';
import { isLuckyCombination, isAll4Lucky } from './suriPatterns.ts';
import { evaluateNamesWithLLM, applyLLMScore, shouldExcludeAsOldFashioned } from './llmEvaluator.ts';

// 🆕 모듈 분리: 새로 생성된 유틸리티 모듈들 (직접 사용)
import { decomposeHangul, getInitialSound } from './hangulUtils.ts';
import { getSuriInfo, getSurnameVariant, calculateWeightedSuriScore } from './suriUtils.ts';
import { hasChoSeongRepetition, hasRoundVowelConflict, hasJongChoConflict } from './phoneticScoring.ts';
import { calculateAdvancedElementScore, type ElementType } from './semanticScoring.ts';
import {
  calculateSurnameNameFlowScore,
  calculateThreeSyllablePatternScore,
  calculateRomanizationScore,
  calculateRhythmScore,
  calculatePronunciationDifficultyScore,
  calculatePhoneticFlowScore,
  getPopularityScore
} from './advancedPhoneticScoring.ts';
import {
  checkGlobalRisk,
  checkBadCombinations,
  checkSurnameNameFlow,
  calculateBunpaScore,
  checkHomophoneRisks,
  checkCommonWordConflict,
  hasAwkwardPhonetics,
  hasAsperatedConsonantBlock
} from './nameValidation.ts';
import {
  getSurnameHarmonyBonus,
  calculateBonusScore,
  getSemanticRiskScore,
  normalizeScores
} from './scoringUtils.ts';
import { getModernityPenalty, getModernityBonus, getSyllableScore } from './nameModernityAnalyzer.ts';
import criminalNames from '../data/filter/criminal_names.json' with { type: 'json' };

// ============================================
// 2. Type Definitions
// ============================================

export interface HanjaInfo {
  id: number;
  hanja: string;
  hangul: string;
  roman: string;
  hun: string;
  eum: string;
  meaning_story: string;
  strokes: number;
  element: ElementType;
  gender: string;
  position: string;
  gender_tendency: number;
  modernity: number;
}

// 이제 hangulUtils.ts에서 import됨

// NOTE: isLuckySuri, getSuriInfo, getSurnameVariant는 이제 suriUtils.ts에서 import됨
// NOTE: checkGlobalRisk, checkBadCombinations는 이제 nameValidation.ts에서 import됨


// NOTE: hasChoSeongRepetition, hasRoundVowelConflict, hasJongChoConflict는
// 이제 phoneticScoring.ts에서 import됨
// NOTE: checkSurnameNameFlow, checkBunpaCharacter, calculateBunpaScore는 이제 nameValidation.ts에서 import됨
// NOTE: getSurnameHarmonyBonus, calculateBonusScore는 이제 scoringUtils.ts에서 import됨
// NOTE: calculateAdvancedElementScore는 이제 semanticScoring.ts에서 import됨
// NOTE: calculateWeightedSuriScore는 이제 suriUtils.ts에서 import됨
// NOTE: checkHomophoneRisks, checkCommonWordConflict, isSameVowelFamily, hasAwkwardPhonetics는 이제 nameValidation.ts에서 import됨


// ============================================
// 🆕 Advanced Scoring Functions (알고리즘 고도화)
// ============================================

// NOTE: 다음 함수들은 이제 advancedPhoneticScoring.ts에서 import됨:
// - calculateSurnameNameFlowScore
// - calculateThreeSyllablePatternScore
// - calculateRomanizationScore
// - calculateRhythmScore
// - calculatePronunciationDifficultyScore
// - calculatePhoneticFlowScore
// - getPopularityScore

// (위 함수들은 advancedPhoneticScoring.ts로 이동됨)
// NOTE: normalizeScores는 이제 scoringUtils.ts에서 import됨


// ============================================
// 4. Helper Functions
// ============================================

/**
 * 현대성 점수 계산 (avgMod 기반)
 * @param avgMod - 평균 현대성 (1-10)
 * @returns 현대성 점수 (0-55)
 */
function calculateModernityPoints(avgMod: number): number {
  if (avgMod >= 9.5) return 55;
  if (avgMod >= 9.0) return 52;
  if (avgMod >= 8.5) return 48;
  if (avgMod >= 8.0) return 43;
  if (avgMod >= 7.5) return 38;  // 7+8 조합
  if (avgMod >= 7.0) return 33;  // 7+7 조합 (우수)
  if (avgMod >= 6.5) return 24;  // 6+7 조합 (양호)
  if (avgMod >= 6.0) return 15;  // 6+6 조합 (허용)
  return 15; // 기본값
}

// ============================================
// 5. Main Function: generateNames
// ============================================

/**
 * 🆕 generateNames - 업데이트된 버전
 * @param {string} surnameInput - 성씨 한글
 * @param {string|null} surnameHanja - 성씨 한자 (사용자 선택)
 * @param {Array} selectedTagIds - 선택된 태그
 * @param {string|null} gender - 성별
 * @param {object|null} preferenceWeights - 스토리 기반 오행 가중치
 * @param {object|null} yongsinWeights - 용신 기반 오행 가중치
 * @param {'modern'|'saju_perfect'} styleMode - 스타일 모드 (NEW)
 */
export async function generateNames(
  surnameInput: string,
  surnameHanja: string | null = null,
  selectedTagIds: string[] = [],
  gender: string | null = null,
  preferenceWeights: Record<string, number> | null = null,
  yongsinWeights: Record<string, number> | null = null,
  styleMode: 'modern' | 'saju_perfect' = 'modern'
) {
  // === STEP 1: 기본 데이터 로드 ===
  const surname = surnameInput.trim();
  let hanjaList = hanjaDb;

  // 🆕 필터링된 이름 추적
  const filteredOut = [];

  console.log(`🎨 스타일 모드: ${styleMode === 'saju_perfect' ? '사주 완벽 (4격 모두 길수)' : '세련된 (3/4 이상 길수)'}`);

  // 성별 필터 (부드러운 방식: gender OR 'N')
  if (gender) {
    hanjaList = hanjaList.filter(h =>
      h.gender === gender || h.gender === 'N'
    );
  }

  // 🆕 균형잡힌 Modernity Pre-Filter
  hanjaList = hanjaList.filter(h => {
    const mod = h.modernity || 5;
    return mod >= 6; // 7→6 완화 (결과값 증가, 조합 필터가 품질 보장)
  });

  // modernPreferences는 다른 곳에서 직접 참조됨
  // 🆕 사용자가 선택한 한자(surnameHanja)가 있으면 정확한 획수 사용
  const surnameInfo = getSurnameVariant(surnameInput, surnameHanja || undefined);
  const surnameStrokes = surnameInfo?.strokes || 8;
  const surnameElement = surnameInfo?.element || null;

  // 🆕 오행 가중치 통합: 스토리 + 용신
  const elementWeights: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

  // 1순위: 용신 가중치 (가장 중요)
  if (yongsinWeights) {
    console.log('🎯 용신 기반 가중치 적용:', yongsinWeights);
    for (const [element, weight] of Object.entries(yongsinWeights)) {
      elementWeights[element] = (elementWeights[element] || 0) + weight;
    }
  }

  // 2순위: 스토리 가중치 (합산)
  if (preferenceWeights) {
    console.log('📖 스토리 기반 가중치 적용:', preferenceWeights);
    for (const [element, weight] of Object.entries(preferenceWeights)) {
      elementWeights[element] = (elementWeights[element] || 0) + weight;
    }
  } else {
    // 기존 태그 기반 가중치
    for (const tagId of selectedTagIds) {
      const tag = valueTags.find(t => t.id === tagId);
      if (tag && tag.related_element) elementWeights[tag.related_element] += 5;
    }
  }

  for (const rule of logicRules) {
    if (elementWeights[rule.target_element] > 0) elementWeights[rule.target_element] += rule.weight;
  }

  let candidates: any[] = [];
  for (const hanja1 of hanjaDb) {
    for (const hanja2 of hanjaDb) {
      if (hanja1.position === 'last') continue;
      if (hanja2.position === 'first') continue;

      // 🆕 Phase 2: 수리 사전 필터 (styleMode에 따라 조건 변경)
      // styleMode='saju_perfect': 4격 모두 길수 필수
      // styleMode='modern': 3/4 이상 길수 허용
      const suriCheck = styleMode === 'saju_perfect'
        ? isAll4Lucky(surnameStrokes, hanja1.strokes, hanja2.strokes)
        : isLuckyCombination(surnameStrokes, hanja1.strokes, hanja2.strokes);
      if (!suriCheck) {
        continue; // 수리 조건 미충족 시 제외
      }

      candidates.push({
        hanja1, hanja2,
        hangulName: hanja1.hangul + hanja2.hangul,
        romanName: hanja1.roman + hanja2.roman,
        hanjaName: hanja1.hanja + hanja2.hanja,
        strokes1: hanja1.strokes, strokes2: hanja2.strokes,
        elements: [hanja1.element, hanja2.element],
        meanings: [hanja1.meaning_story, hanja2.meaning_story],
        meaningKorean: [`${hanja1.hun} ${hanja1.eum}`, `${hanja2.hun} ${hanja2.eum}`]
      });
    }
  }

  console.log(`📊 수리 사전 필터 후 후보: ${candidates.length}개`);

  // 🆕 필터링 전 후보 저장 (비교용)
  const preFilterCandidates = new Set(candidates.map(c => c.hanja1.hangul + c.hanja2.hangul));

  candidates = candidates.filter(c => {
    // 🆕 STEP 0: 강력한 사전 필터 (점수 계산 전 완전 제거)
    const combination = c.hanja1.hangul + c.hanja2.hangul;

    // 0.1 Critical blocks 체크는 checkGlobalRisk()에서 이미 수행됨 (중복 제거)

    // 0.2 Awkward combinations (critical severity) 체크
    if (modernPreferences.awkward_combinations?.combinations) {
      const found = modernPreferences.awkward_combinations.combinations.find(
        item => item.name === combination && item.severity === 'critical'
      );
      if (found) return false;
    }

    // 0.3 Homophone critical 체크
    // checkHomophoneRisks는 배열을 반환, critical이 하나라도 있으면 차단
    if ((modernPreferences as any).homophone_words && (modernPreferences as any).homophone_words[combination]) {
      if ((modernPreferences as any).homophone_words[combination].severity === 'critical') {
        return false;
      }
    }

    // 🆕 0.4 격음 하드 블록 (평유, 유평, 자칠 등 완전 차단)
    if (hasAsperatedConsonantBlock(c.hanja1.hangul, c.hanja2.hangul)) {
      return false;
    }

    // 🆕 0.5 패턴 규칙 제거됨
    // 이전: 양쪽 받침없음 + ㅇ초성 → 차단 (시우, 서우 등 현대 이름도 차단되는 문제)
    // 현재: 문제 이름(유아, 자아, 서아, 자예 등)은 blocked_names.json에서 명시적 차단

    // 0.6 Awkward Phonetics 체크 (대폭 강화된 버전)
    // 모음 반복, 초성 반복, ㄴ-ㄹ 패턴 등
    if (hasAwkwardPhonetics(c.hanja1.hangul, c.hanja2.hangul)) {
      return false;
    }

    if (hasChoSeongRepetition(surnameInput, c.hanja1.hangul, c.hanja2.hangul)) return false;
    if (hasRoundVowelConflict(c.hanja1.hangul, c.hanja2.hangul)) return false;
    if (hasJongChoConflict(surnameInput, c.hanja1.hangul)) return false;
    if (hasJongChoConflict(c.hanja1.hangul, c.hanja2.hangul)) return false;

    // 🆕 통합: 기존 두 번째 filter에서 이동 (성능 최적화)
    if (checkBadCombinations(surnameInput, c.hangulName)) return false;
    const riskResult = checkGlobalRisk(c.romanName);
    if (riskResult.isCritical) return false;
    if (riskResult.warning) c.warning = riskResult.warning;

    return true;
  });

  // 🆕 필터링된 이름 수집 (필터링 전후 비교)
  const postFilterCandidates = new Set(candidates.map(c => c.hangulName));
  for (const name of preFilterCandidates) {
    if (!postFilterCandidates.has(name)) {
      filteredOut.push({
        name,
        layer: 'HARD',
        reason: '필터 적용됨'
      });
    }
  }

  // 🆕 전역 변수로 노출 (UI 접근용)
  if (typeof window !== 'undefined') {
    (window as any)._lastFilteredOut = filteredOut;
    console.log(`🚫 필터링된 이름: ${filteredOut.length}개`);
  }

  // Suri Calculation
  const finalCandidates = candidates.map(c => {
    const 초년운 = c.strokes1 + c.strokes2;
    const 중년운 = surnameStrokes + c.strokes1;
    const 말년운 = surnameStrokes + c.strokes2;
    const 총운 = surnameStrokes + c.strokes1 + c.strokes2;

    c.suri = {
      초년운: { count: 초년운, info: getSuriInfo(초년운) },
      중년운: { count: 중년운, info: getSuriInfo(중년운) },
      말년운: { count: 말년운, info: getSuriInfo(말년운) },
      총운: { count: 총운, info: getSuriInfo(총운) }
    };
    return c;
  }).map(c => { // Scoring
    const baseScore = 35; // 🆕 50→35 감소 (변별력 향상)
    const elementScore = calculateAdvancedElementScore(c.hanja1, c.hanja2, surnameInfo, elementWeights);
    const suriScore = c.suri ? calculateWeightedSuriScore(c.suri) : 0;
    const bonusScore = calculateBonusScore(c.hanja1, c.hanja2);
    // 🆕 modernityScore 제거 - modernityPoints (avgMod 기반)로 통합됨

    const homophoneRisks = checkHomophoneRisks(c.hangulName);
    const commonWordConflicts = checkCommonWordConflict(c.hangulName); // 🆕 Tier 2
    let penaltyScore = 0;

    // Penalty Calculation - Homophone
    if (homophoneRisks.length > 0) {
      c.homophoneRisks = homophoneRisks;
      homophoneRisks.forEach(r => {
        if (r.severity === 'critical') penaltyScore += 30;
        else if (r.severity === 'warning') penaltyScore += 15;
      });

      if (!c.warning) {
        c.warning = {
          reason: homophoneRisks.map(r => r.reason).join(', '),
          alternative: '다른 조합 권장'
        };
      }
    }

    // 🆕 Tier 2: Common Word Conflict Penalty
    if (commonWordConflicts.length > 0) {
      c.commonWordConflicts = commonWordConflicts;
      commonWordConflicts.forEach(conflict => {
        if (conflict.severity === 'critical') {
          penaltyScore += 100; // 완전 차단 (예: 예수)
        } else if (conflict.severity === 'warning') {
          penaltyScore += 50; // 대폭 페널티 (예: 예민, 지도)
        }
      });

      if (!c.warning) {
        c.warning = {
          reason: commonWordConflicts.map(cf => cf.reason).join(', '),
          alternative: '일상 단어 충돌'
        };
      }
    }

    // 🆕 새로운 점수 체계: 통합 현대성 공식
    const mod1 = c.hanja1.modernity || 5;
    const mod2 = c.hanja2.modernity || 5;
    const avgMod = (mod1 + mod2) / 2;

    // 🆕 알고리즘 고도화: 추가 점수 계산
    const phoneticFlowScore = calculatePhoneticFlowScore(c.hanja1.hangul, c.hanja2.hangul);
    const popularityScore = getPopularityScore(c.hanja1.hangul, c.hanja2.hangul);
    const semanticRiskScore = getSemanticRiskScore(c.hanja1.hangul, c.hanja2.hangul);

    // 🆕 Phase 3: 분파 점수 계산
    const bunpaScore = calculateBunpaScore(c.hanja1, c.hanja2);

    // 🆕 Phase 4: 성씨-초성 상생 보너스
    const surnameHarmonyBonus = getSurnameHarmonyBonus(surnameElement as ElementType | null, c.hanja1.hangul, c.hanja2.hangul);

    // 🆕 Phase 5: 성씨-이름 발음 흐름 체크 (정+성 어색함 등)
    const surnameNameFlowPenalty = checkSurnameNameFlow(surname, c.hanja1.hangul);

    // 🆕 v5.0: 고급 발음 규칙 점수 (phonetic_rules.json v2.0)
    const surnameNameFlowScore = calculateSurnameNameFlowScore(surname, c.hanja1.hangul);
    const threeSyllableScore = calculateThreeSyllablePatternScore(surname, c.hanja1.hangul, c.hanja2.hangul);
    const romanizationScore = calculateRomanizationScore(c.hanja1.hangul, c.hanja2.hangul);
    const rhythmScore = calculateRhythmScore(c.hanja1.hangul, c.hanja2.hangul);
    const pronunciationScore = calculatePronunciationDifficultyScore(c.hanja1.hangul, c.hanja2.hangul);
    const advancedPhoneticScore = surnameNameFlowScore + threeSyllableScore + romanizationScore + rhythmScore + pronunciationScore;

    // Modernity 점수 (55점 만점 - avgMod 기반)
    const modernityPoints = calculateModernityPoints(avgMod);

    // 🆕 통합된 전통 점수 (modernityScore 중복 제거)
    // 이전: baseScore + elementScore + suriScore + bonusScore + modernityScore*1.5 - penalty
    // 현재: baseScore + elementScore + suriScore + bonusScore - penalty (modernityPoints에서 처리)
    c.rawScore = baseScore + elementScore + suriScore + bonusScore - penaltyScore;
    const traditionalScore = Math.round((c.rawScore / 120) * 45);  // 155→120 (modernityScore 제거)

    // 🆕 최종 rawScore 계산 (중복 제거된 통합 공식)
    // 공식: 기본점수 + 인기도 + 음운흐름 + 의미충돌 + 분파 + 성씨상생 + 성씨발음흐름 + 고급발음규칙
    c.rawScore = modernityPoints + traditionalScore
      + (popularityScore * 0.3)       // 인기 이름 보너스 (최대 +30)
      + (phoneticFlowScore * 2)       // 음운 흐름 보너스 (최대 +26)
      + semanticRiskScore             // 의미 충돌 페널티 (최대 -20)
      + bunpaScore                    // 🆕 분파 페널티 (최대 -50)
      + surnameHarmonyBonus           // 🆕 성씨 상생 보너스 (최대 +25)
      + surnameNameFlowPenalty        // 🆕 성씨-이름 발음 페널티 (최대 -23)
      + advancedPhoneticScore         // 🆕 v5.0: 고급 발음 규칙 (최대 ±15)
      - getModernityPenalty(c.hanja1.hangul + c.hanja2.hangul)  // 🆕 v6.0: 로컬 현대성 분석 페널티
      + getModernityBonus(c.hanja1.hangul + c.hanja2.hangul);   // 🆕 v6.0: 트렌디 이름 보너스 (1000점 시스템)

    // 🆕 점수는 normalizeScores()에서 일괄 계산됨 (정규 분포 적용)
    c.score = c.rawScore; // 임시값, 나중에 정규화됨

    // 🆕 avgMod 저장 (Step 10에서 재사용, 중복 계산 방지)
    c.modernityAvg = avgMod;

    c.scoreBreakdown = {
      base: baseScore,
      element: elementScore,
      suri: suriScore,
      bonus: bonusScore,
      modernity: modernityPoints,  // 🆕 수정: modernityScore → modernityPoints
      penalty: penaltyScore,
      raw: c.rawScore,
      final: 0 // 정규화 후 업데이트됨
    };

    return c;
  });

  // 🆕 정규 분포 기반 점수 정규화 (Phase 2)
  const normalizedCandidates = normalizeScores(finalCandidates);

  // 🆕 용신 가중치 후처리 (정규화 이후 적용 - 핵심!)
  // 정규화가 점수를 압축하므로, 용신 보너스는 별도로 적용해야 효과가 보존됨
  if (yongsinWeights) {
    console.log('🎯 용신 후처리 보너스 적용 중...');

    // 용신/희신/기신 오행 추출
    const yongsinElements: string[] = []; // +40
    const huisinElements: string[] = [];  // +20
    const gisinElements: string[] = [];   // -20

    for (const [el, weight] of Object.entries(yongsinWeights)) {
      const w = weight as number;
      if (w >= 40) yongsinElements.push(el);
      else if (w >= 20) huisinElements.push(el);
      else if (w <= -20) gisinElements.push(el);
    }

    normalizedCandidates.forEach((c: any) => {
      const el1 = c.hanja1.element;
      const el2 = c.hanja2.element;
      let postBonus = 0;

      // 🆕 v6.1: 점진적 용신 보너스 (현대성 연동)
      // 트렌디할수록 용신 보너스 지급, 올드한 이름은 작은 보너스만
      const hangulName = c.hanja1.hangul + c.hanja2.hangul;
      const syllableScore = getSyllableScore(hangulName.charAt(0), hangulName.charAt(1));
      // 음절점수 -3 → 0.2배, +5 → 1.0배 (부드러운 전환)
      const modernityMultiplier = Math.max(0.2, Math.min(1.0, (syllableScore + 3) / 8));

      // 용신 오행 보너스 (현대성 배율 적용)
      if (yongsinElements.includes(el1)) postBonus += Math.round(100 * modernityMultiplier);
      if (yongsinElements.includes(el2)) postBonus += Math.round(100 * modernityMultiplier);

      // 희신 오행 보너스 (현대성 배율 적용)
      if (huisinElements.includes(el1)) postBonus += Math.round(50 * modernityMultiplier);
      if (huisinElements.includes(el2)) postBonus += Math.round(50 * modernityMultiplier);

      // 기신 오행 페널티 (배율 적용 안함 - 페널티는 동일)
      if (gisinElements.includes(el1)) postBonus -= 40;
      if (gisinElements.includes(el2)) postBonus -= 40;

      // 양쪽 모두 용신이면 추가 시너지 보너스
      if (yongsinElements.includes(el1) && yongsinElements.includes(el2)) {
        postBonus += Math.round(50 * modernityMultiplier); // 시너지
      }

      // 🆕 v6.0: Cap 제거 - 최소 200점, 상한 없음
      c.score = Math.max(200, c.score + postBonus);
    });

    console.log('✅ 용신 후처리 완료');
  }

  // scoreBreakdown.final 업데이트
  normalizedCandidates.forEach((c: any) => {
    if (c.scoreBreakdown) {
      c.scoreBreakdown.final = c.score;
    }
  });

  // 🆕 조합 평균 기반 성별 필터
  let filtered = normalizedCandidates;

  if (gender) {
    filtered = normalizedCandidates.filter((c: any) => {
      const t1 = c.hanja1.gender_tendency || 0;
      const t2 = c.hanja2.gender_tendency || 0;
      const avgTendency = (t1 + t2) / 2;

      if (gender === 'M') {
        return avgTendency > -2;  // -3 → -2 강화
      } else if (gender === 'F') {
        return avgTendency < 2;   // 3 → 2 강화
      }

      return true;
    });
  }

  // 🆕 엄격한 조합 Modernity 필터
  filtered = filtered.filter((c: any) => {
    // 4.1 초성 반복 필터 (발음 어려움 방지)
    // const surnameInitial = getInitialSound(surnameInput);  // unused
    const initial1 = getInitialSound(c.hanja1.hangul);
    const initial2 = getInitialSound(c.hanja2.hangul);

    // 이름 두 글자 초성 반복 차단
    if (initial1 === initial2) return false;

    // 🆕 4.2 음절 중복 필터 (성씨-이름 충돌 방지) ⭐ NEW
    // 예: 원(성) + 원찬(이름) = "원원찬" X (어색함)
    // 모든 성씨에 자동 적용되는 근본적 해결책
    if (surnameInput === c.hanja1.hangul) return false;

    // 4.3 Modernity 조합 밸런스 필터
    // 🆕 개선: avgMod 재계산 대신 Step 9에서 저장한 modernityAvg 사용
    const avgMod = c.modernityAvg || ((c.hanja1.modernity || 5) + (c.hanja2.modernity || 5)) / 2;
    const diffMod = Math.abs((c.hanja1.modernity || 5) - (c.hanja2.modernity || 5));

    // 너무 낮은 조합은 차단 (5+5, 5+6 등)
    if (avgMod < 6.0) return false;

    // 6.5 미만이면서 차이가 크면 차단 (6+8은 avg=7.0이므로 통과, 대신 diff로 차단)
    if (avgMod < 7.0 && diffMod > 1) return false; // 6+8 차단

    return true;
  });

  // 🆕 v6.1: 범죄자 이름 필터링 (성+이름 완전 일치 시 제외)
  const blockedFullNames = new Set((criminalNames as any).blockedFullNames || []);
  filtered = filtered.filter((c: any) => {
    const fullName = surnameInput + c.hanja1.hangul + c.hanja2.hangul;
    if (blockedFullNames.has(fullName)) {
      console.log(`⛔ 범죄자 이름 필터링: ${fullName}`);
      return false;
    }
    return true;
  });

  // 🆕 v6.2: critical_blocks 완전 필터링 (이름 조합 기준, 성씨 무관)
  const criticalBlocks = new Set((modernPreferences as any).critical_blocks || []);
  filtered = filtered.filter((c: any) => {
    const hangulName = c.hanja1.hangul + c.hanja2.hangul;
    if (criticalBlocks.has(hangulName)) {
      console.log(`⛔ Critical block 필터링: ${hangulName}`);
      return false;
    }
    return true;
  });

  // 배율 시스템 제거 (새로운 점수 체계에 통합됨)
  // Modernity는 이미 45점으로 직접 반영됨

  // 🆕 최종 정렬: 용신 보너스/필터링 후 반드시 점수 순 재정렬
  // 수리품질 분석 함수 (타이브레이커용)
  const analyzeSuriQuality = (suri: any) => {
    if (!suri) return { badCount: 4, daegilCount: 0 };
    let badCount = 0, daegilCount = 0;
    for (const key of ['초년운', '중년운', '말년운', '총운']) {
      const level = suri[key]?.info?.level || '흉';
      if (level === '반길반흉' || level === '흉') badCount++;
      if (level === '대길') daegilCount++;
    }
    return { badCount, daegilCount };
  };

  // === STEP 4.5: LLM 평가 (Top 50 후보만) ===
  // 🆕 사전 필터링: old_fashioned 이름을 후순위로 밀기
  filtered.sort((a: any, b: any) => {
    const aName = a.hangulName || (a.hanja1?.hangul + a.hanja2?.hangul);
    const bName = b.hangulName || (b.hanja1?.hangul + b.hanja2?.hangul);

    const aIsOld = modernPreferences.old_fashioned_combinations?.names?.includes(aName);
    const bIsOld = modernPreferences.old_fashioned_combinations?.names?.includes(bName);

    // 올드한 이름은 후순위
    if (aIsOld && !bIsOld) return 1;
    if (!aIsOld && bIsOld) return -1;

    // 같은 카테고리면 점수 기준
    return b.score - a.score;
  });

  // 🔴 LLM 평가 임시 비활성화 - 별도 호출로 분리 예정
  // 원본 코드는 llmEvaluator.ts의 evaluateNamesWithLLM() 사용
  // 향후 앱에서 필요 시점에 별도 호출:
  //   import { evaluateNamesWithLLM, applyLLMScore, shouldExcludeAsOldFashioned } from 'erumi-core';
  //   const llmResults = await evaluateNamesWithLLM(topCandidates, surname);
  /*
  const topCandidates = filtered.slice(0, 50);
  try {
    const llmResults = await evaluateNamesWithLLM(topCandidates, surname);
    topCandidates.forEach((name: any) => {
      const fullName = surname + (name.hangulName || name.hangul1 + name.hangul2);
      const llmResult = llmResults.get(fullName);
      if (llmResult) {
        name.llmScore = llmResult;
        name.score = applyLLMScore(name.score, llmResult);

        // 🆕 하이브리드 필터: 확실히 올드한 이름은 대폭 감점
        if (shouldExcludeAsOldFashioned(llmResult)) {
          name.score = Math.max(0, name.score - 25); // 🆕 v6.0: 25점 감점 (로컬 분석과 역할 분담)
          name.isExcludedAsOld = true;
        }
      }
    });
  } catch (error) {
    console.warn('[LLM] Evaluation skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
  */

  // === STEP 5: 최종 정렬 (점수 기준) ===
  filtered.sort((a: any, b: any) => {
    // 1차: 점수 (높을수록 앞)
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;

    // 2차 (동점): 나쁜 등급 개수 (적을수록 앞)
    const qA = analyzeSuriQuality(a.suri);
    const qB = analyzeSuriQuality(b.suri);
    if (qA.badCount !== qB.badCount) return qA.badCount - qB.badCount;

    // 3차 (동점): 대길 개수 (많을수록 앞)
    if (qB.daegilCount !== qA.daegilCount) return qB.daegilCount - qA.daegilCount;

    // 4차 (동점): 현대성
    return (b.modernityAvg || 0) - (a.modernityAvg || 0);
  });

  // 🆕 v7.0: 중복 한글 제거 로직 삭제 - BatchManager에서 한자 대안 관리
  // 같은 발음 다른 한자 조합도 모두 유지하여 BatchManager가 티어별로 추출

  // 순위 재할당
  filtered.forEach((c: any, idx: number) => {
    if (c.scoreBreakdown) c.scoreBreakdown.rank = idx + 1;
  });

  return filtered.map((c: any) => {
    // 🆕 글로벌 이름 체크 (영어 발음 경고)
    const fullHangul = surnameInput + c.hangulName;
    const globalCheck = checkGlobalName(fullHangul);
    const romanizedName = globalCheck.romanized;

    // 기존 warning에 글로벌 경고 추가
    let finalWarning = c.warning || null;
    if (globalCheck.hasWarning && globalCheck.primaryWarning) {
      if (finalWarning) {
        finalWarning.globalReason = globalCheck.primaryWarning.reason;
      } else {
        finalWarning = {
          reason: globalCheck.primaryWarning.reason,
          type: 'global'
        };
      }
    }

    return {
      hangulName: c.hangulName,
      hanjaName: c.hanjaName,
      romanName: romanizedName, // 🆕 한글 기반 로마자
      fullName: {
        hangul: fullHangul,
        hanja: (surnameInfo?.hanja || surnameInput) + c.hanjaName,
        roman: romanizedName
      },
      hanja1: {
        hanja: c.hanja1.hanja,
        hangul: c.hanja1.hangul,
        hun: c.hanja1.hun,
        story: c.hanja1.meaning_story,
        element: c.hanja1.element,
        strokes: c.hanja1.strokes
      },
      hanja2: {
        hanja: c.hanja2.hanja,
        hangul: c.hanja2.hangul,
        hun: c.hanja2.hun,
        story: c.hanja2.meaning_story,
        element: c.hanja2.element,
        strokes: c.hanja2.strokes
      },
      suri: c.suri,
      elements: c.elements,
      score: c.score,
      scoreBreakdown: c.scoreBreakdown,
      // 🆕 추가 필드 (UI 표시용)
      modernityAvg: c.modernityAvg,
      llmScore: c.llmScore || null,
      genderTendency: {
        first: c.hanja1.gender_tendency || 0,
        second: c.hanja2.gender_tendency || 0,
        avg: ((c.hanja1.gender_tendency || 0) + (c.hanja2.gender_tendency || 0)) / 2
      },
      warning: finalWarning,
      globalCheck: globalCheck.hasWarning ? globalCheck : null
    };
  });
}

export default { generateNames, decomposeHangul };
