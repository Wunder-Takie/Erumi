/**
 * core.js
 * 메인 generateNames 함수
 */

import hanjaDb from '../../data/hanja_db.json' with { type: 'json' };
import logicRules from '../../data/logic_rules.json' with { type: 'json' };
import valueTags from '../../data/value_tags.json' with { type: 'json' };
import modernPreferences from '../../data/modern_preferences.json' with { type: 'json' };

import { getSurnameInfo, getInitialSound, getSuriInfo } from './helpers.js';
import {
  checkGlobalRisk,
  checkBadCombinations,
  hasChoSeongRepetition,
  hasRoundVowelConflict,
  hasJongChoConflict,
  checkHomophoneRisks,
  checkCommonWordConflict
} from './filters.js';
import {
  calculateAdvancedElementScore,
  calculateWeightedSuriScore,
  calculateBonusScore,
  calculateModernityScore
} from './scoring.js';

export function generateNames(surnameInput, selectedTagIds = [], gender = null) {
  // === STEP 1: 기본 데이터 로드 ===
  const surname = surnameInput.trim();
  let hanjaList = hanjaDb;

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

  const preferences = modernPreferences;
  const surnameInfo = getSurnameInfo(surnameInput);
  const surnameStrokes = surnameInfo?.strokes || 8;

  const elementWeights = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  for (const tagId of selectedTagIds) {
    const tag = valueTags.find(t => t.id === tagId);
    if (tag && tag.related_element) elementWeights[tag.related_element] += 5;
  }
  for (const rule of logicRules) {
    if (elementWeights[rule.target_element] > 0) elementWeights[rule.target_element] += rule.weight;
  }

  let candidates = [];
  for (const hanja1 of hanjaDb) {
    for (const hanja2 of hanjaDb) {
      if (hanja1.position === 'last') continue;
      if (hanja2.position === 'first') continue;

      candidates.push({
        hanja1, hanja2,
        hangulName: hanja1.hangul + hanja2.hangul,
        romanName: hanja1.roman + hanja2.roman,
        hanjaName: hanja1.hanja + hanja2.hanja,
        strokes1: hanja1.strokes, strokes2: hanja2.strokes,
        elements: [hanja1.element, hanja2.element],
        meanings: [hanja1.meaning_story, hanja2.meaning_story],
        meaningKorean: [hanja1.meaning_korean, hanja2.meaning_korean]
      });
    }
  }

  candidates = candidates.filter(c => {
    if (hasChoSeongRepetition(surnameInput, c.hanja1.hangul, c.hanja2.hangul)) return false;
    if (hasRoundVowelConflict(c.hanja1.hangul, c.hanja2.hangul)) return false;
    if (hasJongChoConflict(surnameInput, c.hanja1.hangul)) return false;
    if (hasJongChoConflict(c.hanja1.hangul, c.hanja2.hangul)) return false;
    return true;
  });

  candidates = candidates.filter(c => {
    if (checkBadCombinations(surnameInput, c.hangulName)) return false;
    const riskResult = checkGlobalRisk(c.romanName);
    if (riskResult.isCritical) return false;
    if (riskResult.warning) c.warning = riskResult.warning;
    return true;
  });

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
    const baseScore = 50; // 30→50 증가 (전체 점수 범위 상향)
    const elementScore = calculateAdvancedElementScore(c.hanja1, c.hanja2, surnameInfo, elementWeights);
    const suriScore = c.suri ? calculateWeightedSuriScore(c.suri) : 0;
    const bonusScore = calculateBonusScore(c.hanja1, c.hanja2);
    const modernityScore = calculateModernityScore(c.hanja1, c.hanja2);

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

    // 🆕 새로운 점수 체계: Modernity 55 + Traditional 45
    const mod1 = c.hanja1.modernity || 5;
    const mod2 = c.hanja2.modernity || 5;
    const avgMod = (mod1 + mod2) / 2;

    // Modernity 점수 (55점 만점 - Mod 6 대응 확장)
    let modernityPoints = 15; // 기본값 (6.0 조합)
    if (avgMod >= 9.5) modernityPoints = 55;
    else if (avgMod >= 9.0) modernityPoints = 52;
    else if (avgMod >= 8.5) modernityPoints = 48;
    else if (avgMod >= 8.0) modernityPoints = 43;
    else if (avgMod >= 7.5) modernityPoints = 38;  // 7+8 조합
    else if (avgMod >= 7.0) modernityPoints = 33;  // 7+7 조합 (우수)
    else if (avgMod >= 6.5) modernityPoints = 24;  // 6+7 조합 (양호)
    else if (avgMod >= 6.0) modernityPoints = 15;  // 6+6 조합 (허용)


    // 전통 점수 (45점으로 축소)
    c.rawScore = baseScore + elementScore + suriScore + bonusScore + modernityScore - penaltyScore;
    const traditionalScore = Math.round((c.rawScore / 155) * 45);

    // 최종 점수 (스케일링 적용으로 시각적 품질 개선)
    let finalScore = modernityPoints + traditionalScore;

    // 1.25배 스케일링 (상대 순위 유지, 시각적 범위만 확대)
    // 기존 60-74점 → 75-92점대로 상향
    finalScore = Math.round(finalScore * 1.25);

    c.score = Math.max(0, Math.min(100, finalScore));

    c.scoreBreakdown = {
      base: baseScore,
      element: elementScore,
      suri: suriScore,
      bonus: bonusScore,
      modernity: modernityScore,
      penalty: penaltyScore,
      raw: c.rawScore,
      final: c.score
    };

    return c;
  });

  // 🆕 조합 평균 기반 성별 필터
  let filtered = finalCandidates;

  if (gender) {
    filtered = finalCandidates.filter(c => {
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
  filtered = filtered.filter(c => {
    // 4.1 초성 반복 필터 (발음 어려움 방지)
    const surnameInitial = getInitialSound(surnameInput);
    const initial1 = getInitialSound(c.hanja1.hangul);
    const initial2 = getInitialSound(c.hanja2.hangul);

    // 이름 두 글자 초성 반복 차단
    if (initial1 === initial2) return false;

    // 🆕 4.2 음절 중복 필터 (성씨-이름 충돌 방지) ⭐ NEW
    // 예: 원(성) + 원찬(이름) = "원원찬" X (어색함)
    // 모든 성씨에 자동 적용되는 근본적 해결책
    if (surnameInput === c.hanja1.hangul) return false;

    // 4.3 Modernity 조합 밸런스 필터
    // Pre-Filter가 mod >= 6이므로, 임계값도 6.5로 조정
    // - 6+6 (avg 6.0) → 낮은 점수로 하위 랭킹
    // - 6+7 (avg 6.5) → OK (조화로움)
    // - 6+8 (avg 7.0, diff 2) → 여전히 REJECT (부조화)
    const mod1 = c.hanja1.modernity || 5;
    const mod2 = c.hanja2.modernity || 5;
    const avgMod = (mod1 + mod2) / 2;
    const diffMod = Math.abs(mod1 - mod2);

    // 너무 낮은 조합은 차단 (5+5, 5+6 등)
    if (avgMod < 6.0) return false;

    // 6.5 미만이면서 차이가 크면 차단 (6+8은 avg=7.0이므로 통과, 대신 diff로 차단)
    if (avgMod < 7.0 && diffMod > 1) return false; // 6+8 차단

    return true;
  });

  // 배율 시스템 제거 (새로운 점수 체계에 통합됨)
  // Modernity는 이미 45점으로 직접 반영됨

  return filtered.sort((a, b) => b.score - a.score).map(c => ({
    hangulName: c.hangulName,
    hanjaName: c.hanjaName,
    romanName: c.romanName,
    fullName: {
      hangul: surnameInput + c.hangulName,
      hanja: (surnameInfo?.hanja || surnameInput) + c.hanjaName,
      roman: (surnameInfo?.roman || surnameInput) + ' ' + c.romanName
    },
    hanja1: {
      hanja: c.hanja1.hanja,
      hangul: c.hanja1.hangul,
      meaning: c.hanja1.meaning_korean,
      story: c.hanja1.meaning_story,
      element: c.hanja1.element,
      strokes: c.hanja1.strokes
    },
    hanja2: {
      hanja: c.hanja2.hanja,
      hangul: c.hanja2.hangul,
      meaning: c.hanja2.meaning_korean,
      story: c.hanja2.meaning_story,
      element: c.hanja2.element,
      strokes: c.hanja2.strokes
    },
    suri: c.suri,
    elements: c.elements,
    score: c.score,
    scoreBreakdown: c.scoreBreakdown,
    warning: c.warning || null
  }));
}
