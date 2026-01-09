/**
 * namingUtils.js
 * 작명 앱의 핵심 엔진 - 한자 이름 생성 및 필터링 로직
 */

// ============================================
// 1. Data Import
// ============================================
import hanjaDb from '../data/hanja_db.json' with { type: 'json' };
import surnames from '../data/surnames.json' with { type: 'json' };
import logicRules from '../data/logic_rules.json' with { type: 'json' };
import valueTags from '../data/value_tags.json' with { type: 'json' };
import suri81 from '../data/suri_81.json' with { type: 'json' };
import globalRisk from '../data/global_risk.json' with { type: 'json' };
import badCombinations from '../data/bad_combinations.json' with { type: 'json' };
import homophoneRisks from '../data/homophone_risks.json' with { type: 'json' };
import modernPreferences from '../data/modern_preferences.json' with { type: 'json' };
import commonWords from '../data/common_words.json' with { type: 'json' };
import popularNgrams from '../data/popular_ngrams.json' with { type: 'json' };
import bunpaCharacters from '../data/bunpa_characters.json' with { type: 'json' };
import consonantElements from '../data/consonant_elements.json' with { type: 'json' };
import { checkGlobalName, romanize } from './globalNameCheck.js';
import { isLuckyCombination } from './suriPatterns.js';

// 🆕 v2.4: 3계층 필터 시스템
import filters, {
  isHardBlocked,
  isSoftBlocked,
  getSoftPenalty,
  checkSyllablePattern,
  filterDiagnose
} from '../data/filters/index.js';

// ============================================
// 1-1. 오행 상생/상극 테이블 (Elemental Harmony)
// ============================================

// 오행 상생 (生): A가 B를 생성/강화
const ELEMENT_GENERATION = {
  'Wood': 'Fire',    // 木生火
  'Fire': 'Earth',   // 火生土
  'Earth': 'Metal',  // 土生金
  'Metal': 'Water',  // 金生水
  'Water': 'Wood'    // 水生木
};

// 오행 상극 (剋): A가 B를 약화/파괴
const ELEMENT_DESTRUCTION = {
  'Wood': 'Earth',   // 木剋土
  'Fire': 'Metal',   // 火剋金
  'Earth': 'Water',  // 土剋水
  'Metal': 'Wood',   // 金剋木
  'Water': 'Fire'    // 水剋火
};

// ============================================
// 2. Helper Function: 한글 자모 분해
// ============================================

// 초성 리스트 (19개)
const CHO_SEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 중성 리스트 (21개)
const JUNG_SEONG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

// 종성 리스트 (28개, 첫 번째는 받침 없음)
const JONG_SEONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 원순모음 (ㅗ, ㅜ, ㅛ, ㅠ 계열)
const ROUND_VOWELS = ['ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'];

/**
 * 한글 음절을 초성/중성/종성으로 분해
 * @param {string} char - 한글 한 글자
 * @returns {{ cho: string, jung: string, jong: string } | null}
 */
export function decomposeHangul(char) {
  if (!char || char.length !== 1) return null;

  const code = char.charCodeAt(0);

  // 한글 음절 범위: 0xAC00 ~ 0xD7A3
  if (code < 0xAC00 || code > 0xD7A3) return null;

  const offset = code - 0xAC00;
  const choIndex = Math.floor(offset / (21 * 28));
  const jungIndex = Math.floor((offset % (21 * 28)) / 28);
  const jongIndex = offset % 28;

  return {
    cho: CHO_SEONG[choIndex],
    jung: JUNG_SEONG[jungIndex],
    jong: JONG_SEONG[jongIndex]
  };
}

/**
 * 한글 글자의 초성을 반환
 * @param {string} char 
 * @returns {string}
 */
export function getInitialSound(char) {
  if (!char) return '';
  const targetChar = char.charAt(0);
  const decomposed = decomposeHangul(targetChar);
  return decomposed ? decomposed.cho : '';
}

// ============================================
// 3. Internal Helper Functions
// ============================================

/**
 * 81수리 리스트에서 해당 숫자가 길(Lucky)인지 확인
 * @param {number} count - 획수 합계
 * @returns {boolean}
 */
function isLuckySuri(count) {
  const normalizedCount = count > 81 ? (count % 81 || 81) : count;
  return suri81.some(s => s.count === normalizedCount);
}

/**
 * 81수리 정보 가져오기
 * @param {number} count - 획수 합계
 * @returns {object | null}
 */
function getSuriInfo(count) {
  const normalizedCount = count > 81 ? (count % 81 || 81) : count;
  return suri81.find(s => s.count === normalizedCount) || null;
}

/**
 * 성씨 정보 가져오기
 * @param {string} hangul - 성씨 한글
 * @returns {object | null}
 */
function getSurnameInfo(hangul) {
  return surnames.find(s => s.hangul === hangul) || null;
}

/**
 * Global Risk 체크
 * @param {string} romanName - 로마자 이름
 * @returns {{ isCritical: boolean, warning: object | null }}
 */
function checkGlobalRisk(romanName) {
  const upperName = romanName.toUpperCase();

  for (const risk of globalRisk) {
    if (upperName.includes(risk.bad_word.toUpperCase())) {
      if (risk.severity === 'critical') {
        return { isCritical: true, warning: null };
      } else {
        return {
          isCritical: false,
          warning: { reason: risk.reason, alternative: risk.alternative }
        };
      }
    }
  }

  return { isCritical: false, warning: null };
}

/**
 * Bad Combinations 체크 (이름 2글자 + Full Name)
 * @param {string} surname - 성씨 한글
 * @param {string} firstName - 이름 2글자 한글
 * @returns {boolean} - true면 탈락
 */
function checkBadCombinations(surname, firstName) {
  const fullName = surname + firstName;

  for (const bad of badCombinations) {
    if (firstName === bad.word) return true;
    if (fullName.includes(bad.word)) return true;
  }

  return false;
}

/**
 * 발음 필터링 - 초성 반복 체크
 * @returns {boolean} - true면 탈락
 */
function hasChoSeongRepetition(surname, char1, char2) {
  const decomposedSurname = decomposeHangul(surname);
  const decomposed1 = decomposeHangul(char1);
  const decomposed2 = decomposeHangul(char2);

  if (!decomposedSurname || !decomposed1 || !decomposed2) return false;

  const cho0 = decomposedSurname.cho;
  const cho1 = decomposed1.cho;
  const cho2 = decomposed2.cho;

  if (cho1 === 'ㅇ' && cho2 === 'ㅇ') return false;
  if (cho1 === cho2 && cho1 !== 'ㅇ') return true;
  if (cho0 === cho1 && cho1 === cho2) return true;

  return false;
}

/**
 * 발음 필터링 - 원순모음 충돌 체크
 */
function hasRoundVowelConflict(char1, char2) {
  const decomposed1 = decomposeHangul(char1);
  const decomposed2 = decomposeHangul(char2);

  if (!decomposed1 || !decomposed2) return false;

  const isRound1 = ROUND_VOWELS.includes(decomposed1.jung);
  const isRound2 = ROUND_VOWELS.includes(decomposed2.jung);

  return isRound1 && isRound2;
}

/**
 * 발음 필터링 - 종성-초성 충돌 (ㄴ-ㄹ / ㄹ-ㄴ)
 */
function hasJongChoConflict(char1, char2) {
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
 * 🆕 성씨-이름 첫글자 발음 흐름 체크
 * "정 + 성예" 처럼 성씨 종성 후 첫글자에 받침 있으면 어색
 * @returns {number} 페널티 점수 (음수)
 */
function checkSurnameNameFlow(surname, hangul1) {
  const dSurname = decomposeHangul(surname);
  const d1 = decomposeHangul(hangul1);

  if (!dSurname || !d1) return 0;

  let penalty = 0;

  // 성씨가 받침으로 끝나는 경우 (정, 강, 김, 박, 한 등)
  // 첫글자도 받침으로 끝나면 발음이 무거워짐
  if (dSurname.jong && d1.jong) {
    // 성씨 종성 + 첫글자 종성 = 약한 페널티만 (완전 차단 X)
    penalty -= 3;  // 8 → 3 완화 (정성안 등도 사용 가능)
  }

  // ㅇ 받침(성씨) + ㅅ/ㅈ 초성(이름) = 가벼운 페널티만
  // 정씨 등이 불리해지는 것을 방지
  if (dSurname.jong === 'ㅇ' && ['ㅅ', 'ㅈ', 'ㅊ', 'ㅆ'].includes(d1.cho)) {
    if (d1.jong) {
      penalty -= 4;  // 10 → 4 완화 (정성안 패턴)
    }
  }

  // 같은 초성 반복 (정 + 정, 김 + 기 등)
  if (dSurname.cho === d1.cho && dSurname.cho !== 'ㅇ') {
    penalty -= 5;  // 발음 단조로움
  }

  return penalty;
}

/**
 * 🆕 분파(分派) 한자 체크
 * 가로/세로로 갈라지는 한자 필터링
 * @returns {boolean} - true면 분파 한자 (경고용, 완전 차단 X)
 */
function checkBunpaCharacter(hanja) {
  // 강한 분파 (필터링)
  if (bunpaCharacters.severity.strong_bunpa.includes(hanja)) {
    return 'strong';
  }
  // 중간 분파 (경고)
  if (bunpaCharacters.severity.medium_bunpa.includes(hanja)) {
    return 'medium';
  }
  // 약한 분파 (참조)
  if (bunpaCharacters.severity.mild_bunpa.includes(hanja)) {
    return 'mild';
  }
  return null;
}

/**
 * 🆕 분파 점수 계산
 */
function calculateBunpaScore(hanja1, hanja2) {
  let penalty = 0;

  const bunpa1 = checkBunpaCharacter(hanja1.hanja);
  const bunpa2 = checkBunpaCharacter(hanja2.hanja);

  if (bunpa1 === 'strong') penalty -= 25;
  else if (bunpa1 === 'medium') penalty -= 15;
  else if (bunpa1 === 'mild') penalty -= 5;

  if (bunpa2 === 'strong') penalty -= 25;
  else if (bunpa2 === 'medium') penalty -= 15;
  else if (bunpa2 === 'mild') penalty -= 5;

  return penalty;
}

/**
 * 🆕 성씨-초성 상생 보너스 계산
 * 성씨 오행과 상생하는 초성을 가진 이름에 보너스
 */
function getSurnameHarmonyBonus(surnameElement, hangul1, hangul2) {
  if (!surnameElement) return 0;

  let bonus = 0;
  const d1 = decomposeHangul(hangul1);
  const d2 = decomposeHangul(hangul2);

  if (!d1 || !d2) return 0;

  // 성씨가 생하는 오행 (상생 관계)
  const generatedElement = ELEMENT_GENERATION[surnameElement];

  // 첫째 글자 초성 오행
  const initial1Element = consonantElements.initial[d1.cho]?.element;
  // 둘째 글자 초성 오행
  const initial2Element = consonantElements.initial[d2.cho]?.element;

  // 성씨→첫째글자 상생 (가장 중요)
  if (initial1Element === generatedElement) {
    bonus += 15; // 상생 보너스
  } else if (initial1Element === surnameElement) {
    bonus += 5; // 비화 (같은 오행) 보너스
  }

  // 첫째→둘째 글자 상생
  if (initial1Element && initial2Element &&
    ELEMENT_GENERATION[initial1Element] === initial2Element) {
    bonus += 10; // 이름 내 상생 흐름
  }

  return bonus;
}

/**
 * 고급 오행 점수 계산 (상생/상극 포함) - 수정된 버전
 */
function calculateAdvancedElementScore(hanja1, hanja2, surnameInfo, elementWeights) {
  let score = 0;
  const el1 = hanja1.element;
  const el2 = hanja2.element;

  // 1. 기본 점수 20점
  score += 20;

  // 2. 상생 보너스
  if (ELEMENT_GENERATION[el1] === el2) score += 10;
  if (surnameInfo && surnameInfo.element && ELEMENT_GENERATION[surnameInfo.element] === el1) score += 5;

  // 3. 상극 페널티
  if (ELEMENT_DESTRUCTION[el1] === el2) score -= 10;

  // 🆕 4. 스토리/태그 기반 가중치 (차별화 강화)
  const weight1 = elementWeights[el1] || 0;
  const weight2 = elementWeights[el2] || 0;

  // 총 가중치 합 계산 (스토리 선택이 있는지 확인)
  const totalWeight = Object.values(elementWeights).reduce((a, b) => a + b, 0);

  if (totalWeight > 0) {
    // 스토리 선택이 있을 때만 차별화 적용

    // 선택된 오행 보너스 (가중치의 40%)
    score += weight1 * 0.4;
    score += weight2 * 0.4;

    // 🆕 선택되지 않은 오행 페널티 (핵심!)
    // 가중치가 0인 오행의 한자는 페널티
    if (weight1 === 0) score -= 15;  // 선택 안 한 오행 페널티
    if (weight2 === 0) score -= 15;

    // 두 한자가 모두 높은 가중치 오행이면 시너지 보너스
    if (weight1 >= 15 && weight2 >= 15) {
      score += 10;
    }
  }

  return Math.max(-20, Math.min(80, score));  // 음수 허용
}

/**
 * Fair Suri 점수 계산 (공정성 개선, 우수성 보상)
 * 기본 15점 보장, 최대 40점
 */
function calculateWeightedSuriScore(suriInfo) {
  // 1단계: 기본 보장 (15점)
  let score = 15;

  // 2단계: 중요 운세 평가
  const 중년운Level = suriInfo.중년운?.info?.level;
  const 총운Level = suriInfo.총운?.info?.level;
  const 말년운Level = suriInfo.말년운?.info?.level;
  const 초년운Level = suriInfo.초년운?.info?.level;

  // 중년운 (사회생활) - 보너스/페널티
  if (중년운Level === '대길') score += 10;
  else if (중년운Level === '길') score += 5;
  else if (중년운Level === '반길반흉') score -= 2;  // 🆕 페널티
  else if (중년운Level === '흉') score -= 5;        // 🆕 페널티

  // 총운 (전체 운세) - 보너스/페널티
  if (총운Level === '대길') score += 12;
  else if (총운Level === '길') score += 6;
  else if (총운Level === '반길반흉') score -= 3;    // 🆕 페널티
  else if (총운Level === '흉') score -= 6;          // 🆕 페널티

  // 3단계: 보조 운세 보너스/페널티
  // 초년운
  if (초년운Level === '대길') score += 4;
  else if (초년운Level === '흉') score -= 2;        // 🆕 페널티

  // 말년운 (노후 안정 중요!) - 강화된 보너스/페널티
  if (말년운Level === '대길') score += 6;
  else if (말년운Level === '길') score += 2;
  else if (말년운Level === '반길반흉') score -= 4;  // 🆕 강한 페널티
  else if (말년운Level === '흉') score -= 8;        // 🆕 매우 강한 페널티

  // 4단계: 4대길 완벽 조합 보너스
  const all대길 = Object.values(suriInfo).every(v => v?.info?.level === '대길');
  if (all대길) score += 3;

  // 최소 5점, 최대 50점 (범위 확대)
  return Math.max(5, Math.min(50, score));
}


/**
 * 보너스 점수 계산
 */
function calculateBonusScore(hanja1, hanja2) {
  let bonus = 0;

  // 1. Position 매칭
  if (hanja1.position === 'first' && hanja2.position === 'last') bonus += 3;

  // 2. 음양 조화
  const yangElements = ['Wood', 'Fire'];
  const yinElements = ['Water', 'Metal', 'Earth'];
  const isYang1 = yangElements.includes(hanja1.element);
  const isYang2 = yangElements.includes(hanja2.element);
  const isYin1 = yinElements.includes(hanja1.element);
  const isYin2 = yinElements.includes(hanja2.element);

  if ((isYang1 && isYin2) || (isYin1 && isYang2)) bonus += 3;

  // TODO: 의미 조화 추가 가능
  return Math.min(15, bonus);
}

/**
 * 동음이의어 리스크 체크 (개선된 버전)
 */
function checkHomophoneRisks(hangulName) {
  const risks = [];

  // 기존 homophoneRisks (legacy)
  for (const homo of homophoneRisks) {
    if (hangulName.includes(homo.word)) {
      risks.push({
        type: 'homophone',
        word: homo.word,
        reason: homo.reason,
        severity: homo.severity || 'warning',
        category: homo.category
      });
    }
  }

  // 🆕 modernPreferences 기반 동음이의어 체크
  if (modernPreferences.homophone_words) {
    for (const [word, data] of Object.entries(modernPreferences.homophone_words)) {
      if (hangulName === word || (data.syllables && data.syllables.includes(hangulName))) {
        risks.push({
          type: 'homophone',
          word: word,
          severity: data.severity,
          reason: `'${word}'와(과) 동음이의어`
        });
      }
    }
  }

  return risks;
}

/**
 * 🆕 Tier 2: 일반 단어 충돌 체크
 * 예: 예수, 지도, 예민, 방법 등 일상어와 겹치는 이름 차단/페널티
 */
function checkCommonWordConflict(hangulName) {
  const conflicts = [];

  for (const entry of commonWords.common_words) {
    if (hangulName === entry.word) {
      conflicts.push({
        type: 'common_word',
        word: entry.word,
        category: entry.category,
        severity: entry.severity,
        reason: entry.reason
      });
    }
  }

  return conflicts;
}

// 발음 관련 Helper
function isSameVowelFamily(vowel1, vowel2) {
  const families = [
    ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ'],
    ['ㅓ', 'ㅔ', 'ㅕ', 'ㅖ'],
    ['ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ'],
    ['ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ']
  ];
  return families.some(family => family.includes(vowel1) && family.includes(vowel2));
}

/**
 * 음운 규칙 기반 어색한 발음 체크 (대폭 강화)
 */
function hasAwkwardPhonetics(hangul1, hangul2) {
  const d1 = decomposeHangul(hangul1);
  const d2 = decomposeHangul(hangul2);
  if (!d1 || !d2) return false;

  // === 올드한/어색한 음절 조합 패턴 (근본 차단) ===

  // 🆕 율 + 모든 글자 차단 (율경, 율린, 율리, 율민 등)
  if (hangul1 === '율') {
    return true;
  }

  // 🆕 근 + 모든 글자 차단 (근지, 근유, 근예, 근수, 근희 등)
  if (hangul1 === '근') {
    return true;
  }

  // 🆕 X + 근 패턴 차단 (시근, 유근, 재근, 서근, 하근 등) - 올드함
  if (hangul2 === '근') {
    return true;
  }

  // 🆕 솔 + 대부분 차단 (솔리, 솔연, 솔린, 솔영, 솔현, 솔랑 등) - 어색함
  if (hangul1 === '솔') {
    const allowedSecond = ['아']; // 극히 일부만 허용
    if (!allowedSecond.includes(hangul2)) {
      return true;
    }
  }

  // 🆕 태 + 대부분 차단 (태현, 태솔, 태경, 태빈 등) - 올드함
  if (hangul1 === '태') {
    const allowedSecond = ['아', '오']; // 극히 일부만 허용
    if (!allowedSecond.includes(hangul2)) {
      return true;
    }
  }

  // 🆕 X + 나 패턴 차단 (광나, 경나, 영나 등)
  if (hangul2 === '나') {
    return true;
  }

  // 🆕 광 + 대부분 차단 (광지, 민광 등)
  if (hangul1 === '광') {
    return true;
  }

  // 🆕 X + 광 패턴도 대부분 어색함 (민광, 예광, 지광, 연광)
  if (hangul2 === '광') {
    return true;
  }

  // 🆕 X + 결 패턴 차단 (윤결, 예결 등)
  if (hangul2 === '결') {
    return true;
  }

  // 🆕 X + 석 패턴 차단 (하석, 유석, 아석 등)
  if (hangul2 === '석') {
    return true;
  }

  // 🆕 X + 겸 패턴 차단 (유겸, 은겸 등)
  if (hangul2 === '겸') {
    return true;
  }

  // 🆕 X + 환 패턴 차단 (아환 등)  
  if (hangul2 === '환') {
    return true;
  }

  // 🆕 X + 엽 패턴 차단 (민엽 등)
  if (hangul2 === '엽') {
    return true;
  }

  // 🆕 X + 경 패턴 차단 (재경, 진경, 유경, 수경, 시경, 지경 등) - 올드함
  if (hangul2 === '경') {
    return true; // 전면 차단
  }

  // 🆕 X + 린 패턴 확장 차단 (도린, 재린, 석린 등) 
  if (hangul2 === '린') {
    // 현대적인 첫글자만 허용
    const modernFirst = ['예', '유', '아', '하', '수', '시'];
    if (!modernFirst.includes(hangul1)) {
      return true;
    }
  }

  // 🆕 X + 건 패턴 (지건 등 - 어색함)
  if (hangul2 === '건') {
    const allowedFirst = ['태', '도']; // 일부만 허용
    if (!allowedFirst.includes(hangul1)) {
      return true;
    }
  }

  // 🆕 현 + 유 (발음 어려움 - ㄴ받침 + ㅇ초성 + ㅠ)
  if (hangul1 === '현' && hangul2 === '유') {
    return true;
  }

  // 🆕 한 + 유 (발음 어려움 - ㄴ받침 + ㅇ초성 + ㅠ)
  if (hangul1 === '한' && hangul2 === '유') {
    return true;
  }

  // 🆕 석 + X 패턴 차단 (석린, 석영, 석지, 석현, 석원, 석준, 석우 등) - 올드함
  if (hangul1 === '석') {
    return true;
  }

  // 🆕 X + 도 패턴 차단 (경도, 현도, 성도 등) - 올드함
  if (hangul2 === '도') {
    const allowedFirst = ['태', '이']; // 극히 일부만 허용
    if (!allowedFirst.includes(hangul1)) {
      return true;
    }
  }

  // 🆕 운 + 성 (어색한 발음)
  if (hangul1 === '운' && hangul2 === '성') {
    return true;
  }

  // 🆕 찬 + 예 (발음 어려움 - ㄴ받침 + ㅇ초성 + ㅖ)
  if (hangul1 === '찬' && hangul2 === '예') {
    return true;
  }

  // 🆕 X + 혜 패턴 차단 (ㄴ받침 + ㅎ초성 연음 어려움: 연혜, 선혜 등)
  if (hangul2 === '혜') {
    // ㄴ 또는 ㄹ 받침과 결합시 어려움
    if (d1.jong === 'ㄴ' || d1.jong === 'ㄹ') {
      return true;
    }
  }

  // 🆕 X + 성 패턴 (ㄴ/ㄹ받침 + ㅅ초성 연음: 환성, 완성, 진성 등)
  if (hangul2 === '성') {
    // 환, 완, 진, 선 등 ㄴ받침과 결합시 어색함
    if (d1.jong === 'ㄴ' || d1.jong === 'ㄹ') {
      return true;
    }
  }

  // 🆕 진 + 채 (어색한 조합)
  if (hangul1 === '진' && hangul2 === '채') {
    return true;
  }

  // 🆕 한 + X 패턴 차단 (한지, 한예 등 - 어색함)
  if (hangul1 === '한') {
    const allowedSecond = ['나', '별']; // 극히 일부만 허용
    if (!allowedSecond.includes(hangul2)) {
      return true;
    }
  }

  // 🆕 X + 한 패턴 차단 (지한, 유한 등 - 어색함)
  if (hangul2 === '한') {
    return true;
  }

  // 🆕 자 + X 패턴 차단 (자민, 자성 등 - 올드함/어색함)
  if (hangul1 === '자') {
    return true;
  }

  // 🆕 완 + X 패턴 차단 (완하 등 - 어색함)
  if (hangul1 === '완') {
    return true;
  }

  // 🆕 X + 예 패턴 (ㄴ받침 + ㅇ초성 + ㅖ = 발음 어려움: 진예, 준예, 환예 등)
  if (hangul2 === '예' && d1.jong === 'ㄴ') {
    return true;
  }

  // 🆕 X + 희 패턴 차단 (운희, 성희, 진희, 선희, 경희 등 - 올드함)
  if (hangul2 === '희') {
    return true;
  }

  // === 기존 발음 규칙 기반 필터 ===

  // 1. 모든 모음 반복 차단 (지리, 시리, 성리, 재리 등)
  if (d1.jung === d2.jung) {
    return true;
  }

  // 2. 대부분의 초성 반복 차단 (부드러운 초성 제외)
  if (d1.cho === d2.cho && d1.cho !== 'ㅇ') {
    const softConsonants = ['ㄴ', 'ㅁ', 'ㄹ'];
    if (!softConsonants.includes(d1.cho)) {
      return true;
    }
  }

  // 3. 모든 ㄴ/ㄹ 관련 패턴 차단
  if ((d1.jong === 'ㄴ' && d2.cho === 'ㄹ') ||
    (d1.jong === 'ㄹ' && d2.cho === 'ㄴ') ||
    (d1.jong === 'ㄴ' && d2.jong === 'ㄴ')) {
    return true;
  }

  // 4. ㅇ받침 + ㅇ초성 연음 패턴 차단
  if (d1.jong === 'ㅇ' && d2.cho === 'ㅇ') {
    return true;
  }

  // 5. ㅇ초성 + ㄹ초성 패턴 차단
  if (d2.cho === 'ㄹ') {
    if (d1.jong === 'ㅇ' || d1.jong === 'ㄴ') {
      return true;
    }
    if (!d1.jong && d1.cho === 'ㅇ') {
      return true;
    }
  }

  // 6. 받침 + ㅇ초성의 아/어 모음 차단
  if (d1.jong && d2.cho === 'ㅇ' && ['ㅏ', 'ㅓ'].includes(d2.jung)) {
    if (!['ㅁ'].includes(d1.jong)) {
      return true;
    }
  }

  // 7. 발음 어려운 복합 종성
  const difficultJong = ['ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ'];
  if (difficultJong.includes(d1.jong) || difficultJong.includes(d2.jong)) {
    return true;
  }

  // 8. ㅜ + ㅣ 조합
  if (d1.jung === 'ㅜ' && d2.jung === 'ㅣ') {
    return true;
  }

  return false;
}

// ============================================
// 🆕 Advanced Scoring Functions (알고리즘 고도화)
// ============================================

/**
 * 음운 흐름 점수 계산 (강화 버전)
 * 모음 조화, 받침-초성 연결, 종성 밸런스 평가
 * 🆕 Option A+B+C: 격음 페널티 강화, 세련된 패턴 보너스
 */
function calculatePhoneticFlowScore(hangul1, hangul2) {
  const d1 = decomposeHangul(hangul1);
  const d2 = decomposeHangul(hangul2);
  if (!d1 || !d2) return 0;

  let score = 0;

  // 1. 모음 조화 (양성/음성 모음)
  const yangVowels = ['ㅏ', 'ㅗ', 'ㅑ', 'ㅛ', 'ㅘ', 'ㅙ']; // 밝은 느낌
  const eumVowels = ['ㅓ', 'ㅜ', 'ㅕ', 'ㅠ', 'ㅝ', 'ㅞ']; // 어두운 느낌

  const isYang1 = yangVowels.includes(d1.jung);
  const isYang2 = yangVowels.includes(d2.jung);
  const isEum1 = eumVowels.includes(d1.jung);
  const isEum2 = eumVowels.includes(d2.jung);

  // 같은 계열이면 조화로움
  if ((isYang1 && isYang2) || (isEum1 && isEum2)) score += 5;
  // 양성+음성 혼합은 부조화
  if ((isYang1 && isEum2) || (isEum1 && isYang2)) score -= 3;

  // 2. 받침 → 초성 연결 자연스러움
  const smoothTransitions = {
    'ㄴ': ['ㅁ', 'ㅇ', 'ㅎ', 'ㅈ', 'ㅅ', 'ㄹ'],
    'ㅇ': ['ㅎ', 'ㅇ', 'ㅁ', 'ㄴ'],
    'ㄱ': ['ㅅ', 'ㅈ', 'ㅎ'],
    'ㄹ': ['ㄹ', 'ㅇ', 'ㅁ', 'ㄴ'],
    '': ['ㄴ', 'ㅁ', 'ㅇ', 'ㅎ', 'ㅈ', 'ㅅ', 'ㄹ']  // 받침없음 → 부드러운 초성
  };
  if (smoothTransitions[d1.jong]?.includes(d2.cho)) score += 5;

  // 3. 종성 밸런스 (🆕 Option A: 강화)
  if (d1.jong && !d2.jong) score += 3;  // 준유, 민아 패턴 (좋음)
  if (!d1.jong && !d2.jong) score -= 15; // 🆕 유아, 자예, 서아 패턴 (너무 가벼움) -3 → -15
  if (d1.jong && d2.jong) score += 1;   // 준혁, 민찬 (안정감)

  // 🆕 Option A: 받침없음 → ㅇ초성 페널티 (자예, 유아 등 애매한 연결)
  if (!d1.jong && d2.cho === 'ㅇ') {
    score -= 10; // 받침없음 다음에 ㅇ초성은 어색
  }

  // 4. ㅣ 모음 연속 페널티 (지리, 시리 등)
  if (d1.jung === 'ㅣ' && d2.jung === 'ㅣ') score -= 8;

  // 5. ㅓ+ㅣ 또는 ㅓ+ㅡ 흐름 페널티 (서린, 서리 등)
  if (d1.jung === 'ㅓ' && (d2.jung === 'ㅣ' || d2.jung === 'ㅡ')) score -= 5;

  // 🆕 Option C: 격음/경음 위치별 차등 페널티 (강화)
  const aspiratedConsonants = ['ㅋ', 'ㅌ', 'ㅍ', 'ㅊ'];
  const tenseConsonants = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'];

  // 인기 있는 예외 음절 (이것만 허용)
  const popularFirst = ['태', '찬', '채', '철', '천', '탁'];
  const popularSecond = ['찬', '철', '태', '탁', '채', '천'];

  // 첫 글자 격음 페널티 (평~, 필~, 칠~ 등) -8 → -15
  if (aspiratedConsonants.includes(d1.cho)) {
    if (!popularFirst.includes(hangul1)) {
      score -= 15;  // 평유, 필수, 칠성 등
    }
  }

  // 둘째 글자 격음 페널티 (🆕 강화) -5 → -25
  if (aspiratedConsonants.includes(d2.cho)) {
    if (!popularSecond.includes(hangul2)) {
      score -= 25;  // 유평, 민칠, 성팔 등 (중간에 격음 매우 어색)
    }
  }

  // 양쪽 모두 격음이면 강한 페널티 (평칠, 철팔 등) -10 → -35
  if (aspiratedConsonants.includes(d1.cho) && aspiratedConsonants.includes(d2.cho)) {
    if (!popularFirst.includes(hangul1) || !popularSecond.includes(hangul2)) {
      score -= 35;
    }
  }

  // 경음 페널티 (이름에 잘 안 씀) -12 → -20
  if (tenseConsonants.includes(d1.cho) || tenseConsonants.includes(d2.cho)) {
    score -= 20;  // 꽃, 빛 등 단어에는 쓰지만 이름에는 부적합
  }

  // 🆕 Option B: 세련된 패턴 보너스 (아린, 서린, 하린 스타일)
  // 조건: 받침없음 → ㄹ/ㄴ/ㅁ 초성 + ㄴ/ㅁ 받침
  const softInitials = ['ㄹ', 'ㄴ', 'ㅁ', 'ㅈ', 'ㅅ'];  // 부드러운 초성
  const cleanEndings = ['ㄴ', 'ㅁ', 'ㅇ'];  // 깔끔한 마무리 받침

  if (!d1.jong && softInitials.includes(d2.cho) && cleanEndings.includes(d2.jong)) {
    score += 15;  // 아린, 서린, 하린, 유진 등 +15점 보너스
  }

  // 🆕 특별 보너스: ㄹ초성 + ㄴ받침 조합 (린, 란, 론 등)
  if (d2.cho === 'ㄹ' && d2.jong === 'ㄴ') {
    score += 5;  // 린, 란 음절 추가 보너스
  }

  // 🆕 부드러운 시작 보너스 (ㅇ, ㅅ, ㅎ, ㅁ, ㄴ 초성)
  const softStartConsonants = ['ㅇ', 'ㅅ', 'ㅎ', 'ㅁ', 'ㄴ', 'ㅈ'];
  if (softStartConsonants.includes(d1.cho)) {
    score += 3;  // 부드러운 시작
  }

  return score; // 확장된 범위: -60 ~ +28
}

/**
 * N-gram 인기도 점수
 * 2024년 인기 이름 데이터 기반
 */
function getPopularityScore(hangul1, hangul2) {
  const combination = hangul1 + hangul2;

  // 긍정 점수 (인기 이름)
  if (popularNgrams.positive && popularNgrams.positive[combination]) {
    return popularNgrams.positive[combination];
  }

  // 부정 점수 (문제 이름)
  if (popularNgrams.negative && popularNgrams.negative[combination]) {
    return popularNgrams.negative[combination];
  }

  return 0;
}

/**
 * 의미 충돌 점수
 * 일상어, 전문용어, 부정 연상 감지
 */
function getSemanticRiskScore(hangul1, hangul2) {
  const combination = hangul1 + hangul2;

  // 일상 단어 충돌 (자동 감지)
  const commonWordPatterns = ['도', '지', '유', '수'];
  const endingChar = hangul2;

  // "~도" 패턴 (지도, 성도, 제도 등)
  if (endingChar === '도' && ['지', '성', '제', '태'].includes(hangul1)) {
    return -20;
  }

  // "~유" 패턴 (성유, 민유 등 - 가벼운 느낌)
  if (endingChar === '유' && !['지', '서', '준', '하'].includes(hangul1)) {
    return -10;
  }

  // "희" 패턴 (올드한 이름의 대표 음절)
  // 🆕 강화: 모든 '희' 끝 이름에 페널티 (영희, 순희, 정희 등)
  if (endingChar === '희') {
    return -30;  // 강력한 페널티
  }

  // 🆕 "자" 패턴 (영자, 순자, 옥자 등 - 매우 올드함)
  if (endingChar === '자' && ['영', '순', '옥', '분', '복', '필', '경', '춘', '말', '금'].includes(hangul1)) {
    return -40;  // 매우 강력한 페널티
  }

  return 0;
}


/**
 * 현대성 점수 계산 (업데이트됨)
 */
function calculateModernityScore(hanja1, hanja2) {
  let score = 0;

  const d1 = decomposeHangul(hanja1.hangul);
  const d2 = decomposeHangul(hanja2.hangul);
  if (!d1 || !d2) return 0;

  const combination = hanja1.hangul + hanja2.hangul;

  // 🆕 CRITICAL: Critical blocks 체크 (완전 차단)
  if (modernPreferences.critical_blocks?.includes(combination)) {
    return -999; // 자동 탈락
  }

  // 🆕 Awkward combinations 체크
  if (modernPreferences.awkward_combinations?.combinations) {
    const found = modernPreferences.awkward_combinations.combinations.find(
      c => c.name === combination
    );
    if (found) {
      if (found.severity === 'critical') return -999; // 자동 탈락
      else if (found.severity === 'warning') score -= 30; // 강력한 페널티
    }
  }

  // 🆕 음운 규칙 체크
  if (hasAwkwardPhonetics(hanja1.hangul, hanja2.hangul)) {
    score -= 25;
  }

  // 1. 받침/모음 선호도
  const jong1Score = modernPreferences.jongseong_scores[d1.jong] || 0;
  const jong2Score = modernPreferences.jongseong_scores[d2.jong] || 0;
  score += (jong1Score + jong2Score) / 2;

  const vowel1Score = modernPreferences.vowel_scores[d1.jung] || 5;
  const vowel2Score = modernPreferences.vowel_scores[d2.jung] || 5;
  score += (vowel1Score + vowel2Score) / 2;

  // 2. 고풍스러운 한자/음절 페널티
  const archaic1 = modernPreferences.archaic_hanja.find(a => a.hanja === hanja1.hanja || a.hangul === hanja1.hangul);
  const archaic2 = modernPreferences.archaic_hanja.find(a => a.hanja === hanja2.hanja || a.hangul === hanja2.hangul);
  if (archaic1) score -= archaic1.penalty;
  if (archaic2) score -= archaic2.penalty;

  // 🆕 archaic_hanja_syllables 체크
  if (modernPreferences.archaic_hanja_syllables) {
    const archaic = modernPreferences.archaic_hanja_syllables;
    if (archaic[hanja1.hangul]) score += archaic[hanja1.hangul];
    if (archaic[hanja2.hangul]) score += archaic[hanja2.hangul];
  }

  // 3. 2020년대 인기 음절 보너스/페널티
  if (modernPreferences.popular_syllables_2020s) {
    const pop = modernPreferences.popular_syllables_2020s;
    if (pop[hanja1.hangul]) score += pop[hanja1.hangul];
    if (pop[hanja2.hangul]) score += pop[hanja2.hangul];
  }

  // 4. 발음 흐름 체크
  if (modernPreferences.awkward_phonetic_patterns) {
    for (const pattern of modernPreferences.awkward_phonetic_patterns) {
      // 기존 패턴 로직 생략 (이미 구현됨, 데이터가 비어있을 수 있음)
      if (pattern.type === 'same_vowel' && pattern.vowels && pattern.vowels.includes(d1.jung) && d1.jung === d2.jung) {
        score -= pattern.penalty;
      }
      // ... 기타 패턴
    }
  }

  // 🆕 발음 어려운 조합 체크 (difficult_pronunciation)
  if (modernPreferences.difficult_pronunciation) {
    for (const pattern of modernPreferences.difficult_pronunciation) {
      if (d1.jong === pattern.jong1 && d2.cho === pattern.cho2) {
        score -= pattern.penalty;
      }
    }
  }

  // 5. 어색한 조합 (하드코딩된 강력 필터)
  if (hanja1.hangul === hanja2.hangul) {
    score -= 40; // 같은 글자 반복
  }

  // 🆕 Tier 1: 강화된 모음 조화 필터 (재채, 예예, 희지 등 차단)
  // 기존: 기본 모음(ㅏ,ㅓ,ㅗ,ㅜ,ㅡ,ㅣ) 반복만 차단
  // 추가: 어색한 복합 모음(ㅐ,ㅔ,ㅚ,ㅟ) 반복도 차단
  const awkwardVowelRepetitions = ["ㅐ", "ㅔ", "ㅚ", "ㅟ"];

  if (d1.jung === d2.jung) {
    if (["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].includes(d1.jung)) {
      score -= 35; // 기본 모음 반복
    } else if (awkwardVowelRepetitions.includes(d1.jung)) {
      score -= 50; // 어색한 모음 반복 (더 강력한 페널티)
    }
  }

  // 🆕 로직 기반 필터: Modernity 평균 페널티
  const mod1 = hanja1.modernity || 5;
  const mod2 = hanja2.modernity || 5;
  const avgModernity = (mod1 + mod2) / 2;

  if (avgModernity < 5) {
    score -= 15; // 매우 올드함 (진천, 의예 등)
  } else if (avgModernity < 6) {
    score -= 10; // 올드함 (성진, 진혜 등)
  } else if (avgModernity < 7) {
    score -= 5;  // 약간 올드함
  }

  // 둘 다 매우 올드하면 추가 페널티
  if (mod1 < 5 && mod2 < 5) {
    score -= 10; // 치명적 조합
  }

  // 🆕 로직 기반 필터: 음운 조화 검사
  // 같은 받침 + 같은 초성
  if (d1.jong && d1.jong === d2.cho && d2.cho !== 'ㅇ') {
    score -= 10; // 발음 어색함
  }

  // ㄴ-ㄹ 충돌
  if ((d1.jong === 'ㄴ' && d2.cho === 'ㄹ') ||
    (d1.jong === 'ㄹ' && d2.cho === 'ㄴ')) {
    score -= 10; // 발음 어려움
  }

  if (modernPreferences.overused_combinations && modernPreferences.overused_combinations.includes(combination)) {
    score -= 30;
  }

  // 6. 트렌디/단순성 보너스 (생략 또는 기존 유지)
  if (modernPreferences.syllable_simplicity_bonus) {
    const easyList = modernPreferences.syllable_simplicity_bonus.easy_syllables || [];
    if (easyList.includes(hanja1.hangul)) score += 2;
    if (easyList.includes(hanja2.hangul)) score += 2;
  }

  return Math.max(-50, Math.min(40, score));
}

/**
 * 🆕 티어계수 기반 점수 정규화
 * - 티어계수를 rawScore에 곱셈 적용
 * - 수리품질 보너스/페널티 추가
 * - 점수 순 정렬 (단일 sort)
 */
function normalizeScores(combinations) {
  if (combinations.length === 0) return combinations;

  // ============================================
  // 1단계: 수리 품질 티어 계산
  // ============================================
  const getSuriTier = (suri) => {
    if (!suri) return 'D';

    const levels = [
      suri.초년운?.info?.level,
      suri.중년운?.info?.level,
      suri.말년운?.info?.level,
      suri.총운?.info?.level
    ];

    if (levels.includes('흉') || levels.includes('대흉')) return 'D';
    const 반길반흉Count = levels.filter(l => l === '반길반흉').length;
    if (반길반흉Count >= 2) return 'C';
    if (반길반흉Count === 1) return 'B';
    if (levels.every(l => l === '대길')) return 'S';
    return 'A';
  };

  const analyzeSuriQuality = (suri) => {
    if (!suri) return { badCount: 4, daegilCount: 0 };
    let badCount = 0, daegilCount = 0;
    for (const key of ['초년운', '중년운', '말년운', '총운']) {
      const level = suri[key]?.info?.level || '흉';
      if (level === '반길반흉' || level === '흉') badCount++;
      if (level === '대길') daegilCount++;
    }
    return { badCount, daegilCount };
  };

  const TIER_MULTIPLIER = { 'S': 1.3, 'A': 1.0, 'B': 0.75, 'C': 0.55, 'D': 0.35 };

  // ============================================
  // 2단계: 티어계수 적용 + 수리품질 보정
  // ============================================
  combinations.forEach(c => {
    const tier = getSuriTier(c.suri);
    c.suriTier = tier;
    const quality = analyzeSuriQuality(c.suri);
    const mod1 = c.hanja1?.modernity || 5;
    const mod2 = c.hanja2?.modernity || 5;
    c.modernityAvg = (mod1 + mod2) / 2;

    const multiplier = TIER_MULTIPLIER[tier];
    let adjustedScore = (c.rawScore || 50) * multiplier;
    adjustedScore += quality.daegilCount * 3;
    adjustedScore -= quality.badCount * 5;
    c.score = Math.round(Math.max(40, Math.min(120, adjustedScore)));

    c.passesGate = (tier === 'S' || tier === 'A');
    c.gateInfo = {
      suriTier: tier,
      suriTierLabel: tier === 'S' ? '전체 대길' : tier === 'A' ? '전체 길 이상' :
        tier === 'B' ? '반길반흉 1개' : tier === 'C' ? '반길반흉 2개+' : '흉 포함'
    };
    c.scoreBreakdown = c.scoreBreakdown || {};
    c.scoreBreakdown.final = c.score;
    c.scoreBreakdown.modernityAvg = c.modernityAvg;
    c.scoreBreakdown.suriTier = tier;
  });

  // ============================================
  // 3단계: 점수 순 정렬 (동점시 타이브레이커)
  // ============================================
  combinations.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    const qA = analyzeSuriQuality(a.suri), qB = analyzeSuriQuality(b.suri);
    if (qA.badCount !== qB.badCount) return qA.badCount - qB.badCount;
    if (qB.daegilCount !== qA.daegilCount) return qB.daegilCount - qA.daegilCount;
    return b.modernityAvg - a.modernityAvg;
  });

  combinations.forEach((c, idx) => { c.scoreBreakdown.rank = idx + 1; });

  const tiers = ['S', 'A', 'B', 'C', 'D'];
  console.log(`📊 티어: ${tiers.map(t => `${t}:${combinations.filter(c => c.suriTier === t).length}`).join(' ')}`);
  console.log(`🏆 Top5: ${combinations.slice(0, 5).map(c => `${c.hanjaName}(${c.suriTier}/${c.score})`).join(', ')}`);

  return combinations;
}

// ============================================
// 4. Main Function: generateNames
// ============================================

/**
 * 🆕 generateNames - 업데이트된 버전
 * @param {string} surnameInput - 성씨
 * @param {Array} selectedTagIds - 선택된 태그
 * @param {string|null} gender - 성별
 * @param {object|null} storyWeights - 스토리 기반 오행 가중치
 * @param {object|null} yongsinWeights - 용신 기반 오행 가중치 (NEW)
 */
export function generateNames(surnameInput, selectedTagIds = [], gender = null, storyWeights = null, yongsinWeights = null) {
  // === STEP 1: 기본 데이터 로드 ===
  const surname = surnameInput.trim();
  let hanjaList = hanjaDb;

  // 🆕 필터링된 이름 추적
  const filteredOut = [];

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
  const surnameElement = surnameInfo?.element || null;

  // 🆕 오행 가중치 통합: 스토리 + 용신
  let elementWeights = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

  // 1순위: 용신 가중치 (가장 중요)
  if (yongsinWeights) {
    console.log('🎯 용신 기반 가중치 적용:', yongsinWeights);
    for (const [element, weight] of Object.entries(yongsinWeights)) {
      elementWeights[element] = (elementWeights[element] || 0) + weight;
    }
  }

  // 2순위: 스토리 가중치 (합산)
  if (storyWeights) {
    console.log('📖 스토리 기반 가중치 적용:', storyWeights);
    for (const [element, weight] of Object.entries(storyWeights)) {
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

  let candidates = [];
  for (const hanja1 of hanjaDb) {
    for (const hanja2 of hanjaDb) {
      if (hanja1.position === 'last') continue;
      if (hanja2.position === 'first') continue;

      // 🆕 Phase 2: 수리 사전 필터 (4격 길수만 생성)
      if (!isLuckyCombination(surnameStrokes, hanja1.strokes, hanja2.strokes)) {
        continue; // 흉수 조합은 아예 생성하지 않음
      }

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

  console.log(`📊 수리 사전 필터 후 후보: ${candidates.length}개`);

  // 🆕 필터링 전 후보 저장 (비교용)
  const preFilterCandidates = new Set(candidates.map(c => c.hanja1.hangul + c.hanja2.hangul));

  candidates = candidates.filter(c => {
    // 🆕 STEP 0: 강력한 사전 필터 (점수 계산 전 완전 제거)
    const combination = c.hanja1.hangul + c.hanja2.hangul;
    const d1 = decomposeHangul(c.hanja1.hangul);
    const d2 = decomposeHangul(c.hanja2.hangul);

    // 🆕 0.0 blocked_names.json 기반 차단 (한글 표기 기준)
    if (isHardBlocked(combination)) {
      return false;
    }

    // 0.1 Critical blocks 체크 (완전 차단) - 레거시 호환
    if (modernPreferences.critical_blocks?.includes(combination)) {
      return false;
    }

    // 0.2 Awkward combinations (critical severity) 체크
    if (modernPreferences.awkward_combinations?.combinations) {
      const found = modernPreferences.awkward_combinations.combinations.find(
        item => item.name === combination && item.severity === 'critical'
      );
      if (found) return false;
    }

    // 0.3 Homophone critical 체크
    // checkHomophoneRisks는 배열을 반환, critical이 하나라도 있으면 차단
    if (modernPreferences.homophone_words && modernPreferences.homophone_words[combination]) {
      if (modernPreferences.homophone_words[combination].severity === 'critical') {
        return false;
      }
    }

    // 🆕 0.4 격음 하드 블록 (평유, 유평, 자칠 등 완전 차단)
    if (d1 && d2) {
      const aspiratedConsonants = ['ㅋ', 'ㅌ', 'ㅍ', 'ㅊ'];
      const popularFirst = ['태', '찬', '채', '철', '천', '탁'];
      const popularSecond = ['찬', '철', '태', '탁', '채', '천'];

      // 둘째 글자 격음 = 완전 차단 (유평, 민칠 등)
      if (aspiratedConsonants.includes(d2.cho) && !popularSecond.includes(c.hanja2.hangul)) {
        return false;
      }

      // 첫째 글자 격음 + 인기 예외 아닌 경우 = 차단 (평유, 칠성 등)
      if (aspiratedConsonants.includes(d1.cho) && !popularFirst.includes(c.hanja1.hangul)) {
        return false;
      }
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
    return true;
  });

  candidates = candidates.filter(c => {
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
      const diagnosis = filterDiagnose(name);
      filteredOut.push({
        name,
        layer: diagnosis.filters[0]?.layer || 'HARD',
        reason: diagnosis.filters.map(f => f.reason).join(', ') || '기타 필터'
      });
    }
  }

  // 🆕 전역 변수로 노출 (UI 접근용)
  if (typeof window !== 'undefined') {
    window._lastFilteredOut = filteredOut;
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
    const surnameHarmonyBonus = getSurnameHarmonyBonus(surnameElement, c.hanja1.hangul, c.hanja2.hangul);

    // 🆕 Phase 5: 성씨-이름 발음 흐름 체크 (정+성 어색함 등)
    const surnameNameFlowPenalty = checkSurnameNameFlow(surname, c.hanja1.hangul);

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
    // 🆕 modernityScore 가중치 강화 (1.5배) - 현대성 강조
    const weightedModernityScore = modernityScore * 1.5;
    c.rawScore = baseScore + elementScore + suriScore + bonusScore + weightedModernityScore - penaltyScore;
    const traditionalScore = Math.round((c.rawScore / 155) * 45);

    // 🆕 최종 rawScore 계산 (5가지 개선 적용)
    // 공식: 기본점수 + 인기도 + 음운흐름 + 의미충돌 + 분파 + 성씨상생 + 성씨발음흐름
    c.rawScore = modernityPoints + traditionalScore
      + (popularityScore * 0.3)       // 인기 이름 보너스 (최대 +30)
      + (phoneticFlowScore * 2)       // 음운 흐름 보너스 (최대 +26)
      + semanticRiskScore             // 의미 충돌 페널티 (최대 -20)
      + bunpaScore                    // 🆕 분파 페널티 (최대 -50)
      + surnameHarmonyBonus           // 🆕 성씨 상생 보너스 (최대 +25)
      + surnameNameFlowPenalty;       // 🆕 성씨-이름 발음 페널티 (최대 -23)

    // 🆕 점수는 normalizeScores()에서 일괄 계산됨 (정규 분포 적용)
    c.score = c.rawScore; // 임시값, 나중에 정규화됨

    c.scoreBreakdown = {
      base: baseScore,
      element: elementScore,
      suri: suriScore,
      bonus: bonusScore,
      modernity: modernityScore,
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
    const yongsinElements = []; // +40
    const huisinElements = [];  // +20
    const gisinElements = [];   // -20

    for (const [el, weight] of Object.entries(yongsinWeights)) {
      if (weight >= 40) yongsinElements.push(el);
      else if (weight >= 20) huisinElements.push(el);
      else if (weight <= -20) gisinElements.push(el);
    }

    normalizedCandidates.forEach(c => {
      const el1 = c.hanja1.element;
      const el2 = c.hanja2.element;
      let postBonus = 0;

      // 용신 오행 보너스 (큰 보너스)
      if (yongsinElements.includes(el1)) postBonus += 12;
      if (yongsinElements.includes(el2)) postBonus += 12;

      // 희신 오행 보너스 (중간 보너스)
      if (huisinElements.includes(el1)) postBonus += 6;
      if (huisinElements.includes(el2)) postBonus += 6;

      // 기신 오행 페널티
      if (gisinElements.includes(el1)) postBonus -= 10;
      if (gisinElements.includes(el2)) postBonus -= 10;

      // 양쪽 모두 용신이면 추가 시너지 보너스
      if (yongsinElements.includes(el1) && yongsinElements.includes(el2)) {
        postBonus += 8; // 시너지
      }

      // 점수 적용 (40~120 범위 유지)
      c.score = Math.max(40, Math.min(120, c.score + postBonus));
    });

    console.log('✅ 용신 후처리 완료');
  }

  // scoreBreakdown.final 업데이트
  normalizedCandidates.forEach(c => {
    if (c.scoreBreakdown) {
      c.scoreBreakdown.final = c.score;
    }
  });

  // 🆕 조합 평균 기반 성별 필터
  let filtered = normalizedCandidates;

  if (gender) {
    filtered = normalizedCandidates.filter(c => {
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

  // 🆕 최종 정렬: 용신 보너스/필터링 후 반드시 점수 순 재정렬
  // 수리품질 분석 함수 (타이브레이커용)
  const analyzeSuriQuality = (suri) => {
    if (!suri) return { badCount: 4, daegilCount: 0 };
    let badCount = 0, daegilCount = 0;
    for (const key of ['초년운', '중년운', '말년운', '총운']) {
      const level = suri[key]?.info?.level || '흉';
      if (level === '반길반흉' || level === '흉') badCount++;
      if (level === '대길') daegilCount++;
    }
    return { badCount, daegilCount };
  };

  filtered.sort((a, b) => {
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

  // 순위 재할당
  filtered.forEach((c, idx) => {
    if (c.scoreBreakdown) c.scoreBreakdown.rank = idx + 1;
  });

  return filtered.map(c => {
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
        meaning_korean: c.hanja1.meaning_korean,
        story: c.hanja1.meaning_story,
        element: c.hanja1.element,
        strokes: c.hanja1.strokes
      },
      hanja2: {
        hanja: c.hanja2.hanja,
        hangul: c.hanja2.hangul,
        meaning_korean: c.hanja2.meaning_korean,
        story: c.hanja2.meaning_story,
        element: c.hanja2.element,
        strokes: c.hanja2.strokes
      },
      suri: c.suri,
      elements: c.elements,
      score: c.score,
      scoreBreakdown: c.scoreBreakdown,
      warning: finalWarning,
      globalCheck: globalCheck.hasWarning ? globalCheck : null
    };
  });
}

export default { generateNames, decomposeHangul, filterDiagnose };
