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
import commonWords from '../data/common_words.json' with { type: 'json' }; // 🆕 Tier 2
import popularNgrams from '../data/popular_ngrams.json' with { type: 'json' }; // 🆕 N-gram 인기도

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

  // 4. 태그 보너스
  if (elementWeights[el1] && elementWeights[el1] > 0) score += 2.5;
  if (elementWeights[el2] && elementWeights[el2] > 0) score += 2.5;
  return Math.max(0, Math.min(40, score));
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

  // 중년운 (사회생활) - 최대 10점
  if (중년운Level === '대길') score += 10;
  else if (중년운Level === '길') score += 5;

  // 총운 (전체 운세) - 최대 12점
  if (총운Level === '대길') score += 12;
  else if (총운Level === '길') score += 6;

  // 3단계: 보조 운세 보너스
  if (suriInfo.초년운?.info?.level === '대길') score += 4;
  if (suriInfo.말년운?.info?.level === '대길') score += 6;

  // 4단계: 4대길 완벽 조합 보너스
  const all대길 = Object.values(suriInfo).every(v => v?.info?.level === '대길');
  if (all대길) score += 3;

  // 최소 15점, 최대 40점
  return Math.max(15, Math.min(40, score));
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

  // 🆕 1. 모든 모음 반복 차단 (지리, 시리, 성리, 재리 등)
  if (d1.jung === d2.jung) {
    return true;
  }

  // 🆕 2. 대부분의 초성 반복 차단 (부드러운 초성 제외)
  if (d1.cho === d2.cho && d1.cho !== 'ㅇ') {
    // 예외: ㄴ, ㅁ, ㄹ은 반복 허용 (나나, 마마, 라라는 괜찮을 수 있음)
    const softConsonants = ['ㄴ', 'ㅁ', 'ㄹ'];
    if (!softConsonants.includes(d1.cho)) {
      return true; // 시지, 찬지, 준지, 가가, 사사 등 모두 차단
    }
  }

  // 🆕 3. 모든 ㄴ/ㄹ 관련 패턴 차단
  if ((d1.jong === 'ㄴ' && d2.cho === 'ㄹ') ||  // 자린, 성린
    (d1.jong === 'ㄹ' && d2.cho === 'ㄴ') ||  // 유린 등
    (d1.jong === 'ㄴ' && d2.jong === 'ㄴ')) { // 한린, 찬린
    return true;
  }

  // 🆕 4. 발음 어려운 복합 종성
  const difficultJong = ['ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ'];
  if (difficultJong.includes(d1.jong) || difficultJong.includes(d2.jong)) {
    return true;
  }

  // 5. 특정 모음 조합 (ㅜ + ㅣ 등) - 기존 유지
  if (d1.jung === 'ㅜ' && d2.jung === 'ㅣ') {
    return true; // 우지, 주지 등
  }

  return false;
}

// ============================================
// 🆕 Advanced Scoring Functions (알고리즘 고도화)
// ============================================

/**
 * 음운 흐름 점수 계산
 * 모음 조화, 받침-초성 연결, 종성 밸런스 평가
 */
function calculatePhoneticFlowScore(hangul1, hangul2) {
  const d1 = decomposeHangul(hangul1);
  const d2 = decomposeHangul(hangul2);
  if (!d1 || !d2) return 0;

  let score = 0;

  // 1. 모음 조화 (양성/음성 모음)
  const yangVowels = ['ㅏ', 'ㅗ', 'ㅑ', 'ㅛ', 'ㅘ', 'ㅙ']; // 밝은 느낌
  const eumVowels = ['ㅓ', 'ㅜ', 'ㅕ', 'ㅠ', 'ㅝ', 'ㅞ']; // 어두운 느낌
  const neutralVowels = ['ㅡ', 'ㅣ', 'ㅢ', 'ㅐ', 'ㅔ', 'ㅒ', 'ㅖ', 'ㅚ', 'ㅟ']; // 중성

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
    'ㄴ': ['ㅁ', 'ㅇ', 'ㅎ', 'ㅈ', 'ㅅ'],
    'ㅇ': ['ㅎ', 'ㅇ', 'ㅁ'],
    'ㄱ': ['ㅅ', 'ㅈ', 'ㅎ'],
    'ㄹ': ['ㄹ', 'ㅇ'],
    '': ['ㄴ', 'ㅁ', 'ㅇ', 'ㅎ', 'ㅈ', 'ㅅ', 'ㅇ']
  };
  if (smoothTransitions[d1.jong]?.includes(d2.cho)) score += 5;

  // 3. 종성 밸런스
  if (d1.jong && !d2.jong) score += 3;  // 준유, 민아 패턴 (좋음)
  if (!d1.jong && !d2.jong) score -= 3; // 유아, 서아 패턴 (가벼움)
  if (d1.jong && d2.jong) score += 1;   // 준혁, 민찬 (안정감)

  // 4. ㅣ 모음 연속 페널티 (지리, 시리 등)
  if (d1.jung === 'ㅣ' && d2.jung === 'ㅣ') score -= 8;

  // 5. ㅓ+ㅣ 또는 ㅓ+ㅡ 흐름 페널티 (서린, 서리 등)
  if (d1.jung === 'ㅓ' && (d2.jung === 'ㅣ' || d2.jung === 'ㅡ')) score -= 5;

  // 🆕 6. 격음/경음 초성 페널티 (올드하거나 어색한 느낌)
  // 격음: ㅋ, ㅌ, ㅍ, ㅊ  / 경음: ㄲ, ㄸ, ㅃ, ㅆ, ㅉ
  const aspiratedConsonants = ['ㅋ', 'ㅌ', 'ㅍ', 'ㅊ'];
  const tenseConsonants = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'];

  // 첫 글자 격음 페널티 (평~, 필~, 칠~ 등)
  if (aspiratedConsonants.includes(d1.cho)) {
    // 예외: 인기 있는 조합 (태~, 찬~ 일부)
    const popularAspirated = ['태', '찬', '채', '철'];
    if (!popularAspirated.includes(hangul1)) {
      score -= 8;  // 평지, 필수, 칠성 등
    }
  }

  // 둘째 글자 격음 페널티 (특히 ~지와 결합시)
  if (aspiratedConsonants.includes(d2.cho)) {
    // 예외: 인기 있는 조합 (찬, 철, 태 등)
    const popularSecond = ['찬', '철', '태', '탁'];
    if (!popularSecond.includes(hangul2)) {
      score -= 5;  // 민칠, 성팔 등
    }
  }

  // 양쪽 모두 격음이면 강한 페널티 (평칠, 철팔 등)
  if (aspiratedConsonants.includes(d1.cho) && aspiratedConsonants.includes(d2.cho)) {
    score -= 10;
  }

  // 경음 페널티 (이름에 잘 안 씀)
  if (tenseConsonants.includes(d1.cho) || tenseConsonants.includes(d2.cho)) {
    score -= 12;  // 꽃, 빛 등 단어에는 쓰지만 이름에는 부적합
  }

  return score; // -40 ~ +13 범위 (확장됨)
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

  // "희" 패턴 (유희, 오희 등 - 올드함)
  if (endingChar === '희' && ['유', '오', '태'].includes(hangul1)) {
    return -15;
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
 * 정규 분포 기반 점수 정규화
 * 모든 조합의 rawScore를 0-100 스케일로 변환
 * 상위 0.1%만 100점, 상위 1%가 95점 이상을 받도록 조정
 */
function normalizeScores(combinations) {
  if (combinations.length === 0) return combinations;

  // Step 1: rawScore 수집 (이미 c.rawScore에 저장됨)
  const scores = combinations.map(c => c.rawScore);

  // Step 2: 평균과 표준편차 계산
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Step 3: Z-score 변환 후 0-100 스케일링
  combinations.forEach(c => {
    if (stdDev === 0) {
      // 모든 점수가 같은 경우 (거의 발생하지 않음)
      c.score = 50;
      return;
    }

    // Z-score 계산: (x - μ) / σ
    const zScore = (c.rawScore - mean) / stdDev;

    // 🆕 Z-score를 0-100으로 변환
    // 목표: 상위 0.1% (Z=3.1) 정도만 100점 받기
    // 100 = 50 + (3.1 * C) => 50 = 3.1C => C ≈ 16
    // 계수 16 적용:
    // +3.125σ (상위 0.1%) → 50 + 50 = 100
    // +2σ (상위 2.3%) → 50 + 32 = 82
    // +1σ (상위 16%) → 50 + 16 = 66
    // 평균 (상위 50%) → 50
    let normalizedScore = 50 + (zScore * 16);

    // 0-100 범위로 클램핑
    c.score = Math.max(0, Math.min(100, Math.round(normalizedScore)));
  });

  // 🐛 DEBUG: 정규화 후 분포 확인
  const finalScores = combinations.map(c => c.score);
  const count100 = finalScores.filter(s => s === 100).length;
  const count95plus = finalScores.filter(s => s >= 95).length;
  const count90plus = finalScores.filter(s => s >= 90).length;
  console.log('=== normalizeScores DEBUG ===');
  console.log('Total:', combinations.length);
  console.log('Raw score - Mean:', mean.toFixed(2), 'StdDev:', stdDev.toFixed(2));
  console.log('Normalized - 100점:', count100, '/ 95+:', count95plus, '/ 90+:', count90plus);
  console.log('=============================');

  return combinations;
}

// ============================================
// 4. Main Function: generateNames
// ============================================

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
    // 🆕 STEP 0: 강력한 사전 필터 (점수 계산 전 완전 제거)
    const combination = c.hanja1.hangul + c.hanja2.hangul;

    // 0.1 Critical blocks 체크 (완전 차단)
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

    // 0.4 Awkward Phonetics 체크 (대폭 강화된 버전)
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

    // 🆕 새로운 점수 체계: 통합 현대성 공식
    const mod1 = c.hanja1.modernity || 5;
    const mod2 = c.hanja2.modernity || 5;
    const avgMod = (mod1 + mod2) / 2;

    // 🆕 알고리즘 고도화: 추가 점수 계산
    const phoneticFlowScore = calculatePhoneticFlowScore(c.hanja1.hangul, c.hanja2.hangul);
    const popularityScore = getPopularityScore(c.hanja1.hangul, c.hanja2.hangul);
    const semanticRiskScore = getSemanticRiskScore(c.hanja1.hangul, c.hanja2.hangul);

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

    // 🆕 최종 rawScore 계산 (알고리즘 고도화 적용)
    // 공식: 기본점수 + 인기도(30%) + 음운흐름(20%) + 의미충돌
    c.rawScore = modernityPoints + traditionalScore
      + (popularityScore * 0.3)    // 인기 이름 보너스 (최대 +30)
      + (phoneticFlowScore * 2)    // 음운 흐름 보너스 (최대 +26)
      + semanticRiskScore;         // 의미 충돌 페널티 (최대 -20)

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

export default { generateNames, decomposeHangul };
