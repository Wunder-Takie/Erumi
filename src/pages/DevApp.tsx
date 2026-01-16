/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react';
import { generateNames } from '../utils/namingUtils';
import { generatePureKoreanNames } from '../utils/pureKoreanUtils';
import { calculateSaju, sajuToWeights, analyzeElements, extractYongsin } from '../utils/sajuUtils';
import storyFlow from '../data/story_flow.json';
import type { NameItem } from '../types';
import { NameReport } from '../components/NameReport';

type NameMode = 'hanja' | 'pure-korean';

interface StoryOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  elements: Record<string, number>;
  storyKeyword: string;
}

interface VibeOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  elements: Record<string, number>;
  vibeKeyword: string;
}

function DevApp() {
  const [surname, setSurname] = useState('김');
  const [results, setResults] = useState<NameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [nameMode, setNameMode] = useState<NameMode>('hanja');
  const [gender, setGender] = useState<'M' | 'F' | null>(null);

  // 🆕 스토리텔링 입력
  const [selectedStory, setSelectedStory] = useState<StoryOption | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);

  // 🆕 사주 입력
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState<number | null>(null);
  const [useSaju, setUseSaju] = useState(false);

  // 🆕 필터링 로그
  const [showFilterLog, setShowFilterLog] = useState(false);
  const [filteredOutNames, setFilteredOutNames] = useState<Array<{ name: string, reason: string, layer: string }>>([]);
  const [filterLogSearch, setFilterLogSearch] = useState('');

  // 🆕 검색 기능
  const [searchQuery, setSearchQuery] = useState('');

  // 🆕 상세 리포트 모달
  const [selectedReportName, setSelectedReportName] = useState<NameItem | null>(null);

  // 🆕 사주 계산 결과 저장 (NameReport에 전달용)
  const [computedSaju, setComputedSaju] = useState<Record<string, unknown> | null>(null);
  const [computedAnalysis, setComputedAnalysis] = useState<{
    distribution: Record<string, number>;
    neededElements: string[];
    excessElements: string[];
  } | null>(null);

  // 🆕 ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedReportName) {
        setSelectedReportName(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedReportName]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let names: NameItem[] = [];

      if (nameMode === 'hanja') {
        // 스토리 가중치 계산
        const storyWeights: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

        // 사주 기반 가중치 (40%)
        let yongsinWeights: Record<string, number> | null = null;

        if (useSaju && birthDate) {
          const saju = await (calculateSaju as (date: string, hour: number | null) => Promise<Record<string, unknown>>)(birthDate, birthHour);
          const analysis = analyzeElements(saju);
          const weights = sajuToWeights(saju);

          // 🆕 사주 결과 저장 (NameReport용)
          setComputedSaju(saju);
          setComputedAnalysis(analysis as any);

          // 사주 가중치 추가
          for (const [element, value] of Object.entries(weights)) {
            storyWeights[element as keyof typeof storyWeights] += (value as number) * 0.4;
          }

          // 용신 가중치 계산
          const yongsinData = extractYongsin(saju);
          yongsinWeights = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
          for (const el of yongsinData.yongsin) {
            yongsinWeights[el as keyof typeof yongsinWeights] += 40;
          }
          for (const el of yongsinData.huisin) {
            yongsinWeights[el as keyof typeof yongsinWeights] += 20;
          }
          for (const el of yongsinData.gisin) {
            yongsinWeights[el as keyof typeof yongsinWeights] -= 20;
          }

          console.log('🎯 사주:', saju);
          console.log('🎯 분석:', analysis);
          console.log('🎯 용신:', yongsinData.summary);
          console.log('🎯 용신 가중치:', yongsinWeights);
        } else {
          // 사주 미사용시 null로 설정
          setComputedSaju(null);
          setComputedAnalysis(null);
        }

        // 스토리 가중치 (30% or 50%)
        const storyMultiplier = useSaju && birthDate ? 0.3 : 0.5;
        if (selectedStory && Object.keys(selectedStory.elements).length > 0) {
          for (const [element, ratio] of Object.entries(selectedStory.elements)) {
            storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * storyMultiplier / 0.5;
          }
        }

        // 바이브 가중치 (30% or 50%)
        const vibeMultiplier = useSaju && birthDate ? 0.3 : 0.5;
        if (selectedVibe) {
          for (const [element, ratio] of Object.entries(selectedVibe.elements)) {
            storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * vibeMultiplier / 0.5;
          }
        }

        console.log('📊 최종 스토리 가중치:', storyWeights);

        names = await generateNames(surname, [], gender, storyWeights, yongsinWeights) as NameItem[];
      } else {
        names = generatePureKoreanNames(surname, { gender: gender === 'M' ? 'male' : gender === 'F' ? 'female' : null });
      }

      setResults(names);

      // 🆕 실제 필터링된 이름 목록 가져오기
      const actualFiltered = (window as unknown as { _lastFilteredOut?: Array<{ name: string, reason: string, layer: string }> })._lastFilteredOut || [];
      setFilteredOutNames(actualFiltered);

      // 콘솔에 상세 정보 출력
      console.clear();
      console.log(`✅ ${nameMode === 'hanja' ? '한자' : '순 우리말'} 이름 ${names.length}개 생성 완료`);
      console.log('\n📊 점수 분포:');
      const above90 = names.filter(n => n.score >= 90).length;
      const above85 = names.filter(n => n.score >= 85).length;
      const above80 = names.filter(n => n.score >= 80).length;
      console.log(`  90점 이상: ${above90}개`);
      console.log(`  85점 이상: ${above85}개`);
      console.log(`  80점 이상: ${above80}개`);

      console.log('\n🏆 상위 10개 이름:');
      names.slice(0, 10).forEach((name, i) => {
        if ('hanjaName' in name) {
          console.log(`${i + 1}. ${name.fullName.hangul} (${name.hanja1.hanja}${name.hanja2.hanja}) - ${name.score}점 [${name.elements.join('+')}]`);
        } else {
          console.log(`${i + 1}. ${name.fullName} - ${name.score}점`);
        }
      });
    } catch (err: unknown) {
      console.error('❌ 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const above90 = results.filter(r => r.score >= 90).length;
    const above85 = results.filter(r => r.score >= 85).length;
    const above80 = results.filter(r => r.score >= 80).length;
    const above75 = results.filter(r => r.score >= 75).length;
    const above70 = results.filter(r => r.score >= 70).length;
    const maxScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
    return { above90, above85, above80, above75, above70, maxScore };
  }, [results]);

  const filteredResults = useMemo(() => {
    let filtered = results.filter(r => r.score >= minScore);

    // 🆕 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(r => {
        const hangulName = 'hanjaName' in r ? r.fullName.hangul : String(r.fullName);
        const hanjaName = 'hanjaName' in r ? r.hanjaName : '';
        return hangulName.toLowerCase().includes(query) || hanjaName.includes(query);
      });
    }

    // 같은 한글 이름은 첫 번째(최고 점수)만 표시 - 중복 제거
    const seen = new Set<string>();
    return filtered.filter(r => {
      const hangulName = 'hanjaName' in r
        ? r.fullName.hangul.replace(surname, '')
        : String(r.fullName).replace(surname, '');
      if (seen.has(hangulName)) {
        return false; // 중복 숨김
      }
      seen.add(hangulName);
      return true;
    });
  }, [results, minScore, surname, searchQuery]);

  const hourOptions = [
    { value: null, label: '모름' },
    { value: 0, label: '자시 (23:30~01:30)' },
    { value: 1, label: '축시 (01:30~03:30)' },
    { value: 2, label: '인시 (03:30~05:30)' },
    { value: 3, label: '묘시 (05:30~07:30)' },
    { value: 4, label: '진시 (07:30~09:30)' },
    { value: 5, label: '사시 (09:30~11:30)' },
    { value: 6, label: '오시 (11:30~13:30)' },
    { value: 7, label: '미시 (13:30~15:30)' },
    { value: 8, label: '신시 (15:30~17:30)' },
    { value: 9, label: '유시 (17:30~19:30)' },
    { value: 10, label: '술시 (19:30~21:30)' },
    { value: 11, label: '해시 (21:30~23:30)' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">🚀 작명 엔진 테스트 (스토리텔링 포함)</h1>
        <p className="text-gray-600 mb-4 text-sm">한자 DB: 60개 | 순 우리말 DB: 60개 | 사주/스토리/바이브 가중치</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* 기본 입력 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-3 text-lg">📝 기본 정보</h2>

            {/* 모드 선택 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setNameMode('hanja')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${nameMode === 'hanja' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
              >
                📖 한자
              </button>
              <button
                onClick={() => setNameMode('pure-korean')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${nameMode === 'pure-korean' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
              >
                🌿 순우리말
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">성씨</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg"
                  placeholder="김"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">성별</label>
                <select
                  title="성별"
                  value={gender || ''}
                  onChange={(e) => setGender(e.target.value as 'M' | 'F' | null || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">선택 안 함</option>
                  <option value="M">남아</option>
                  <option value="F">여아</option>
                </select>
              </div>
            </div>

            {/* 사주 입력 */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="useSaju"
                  checked={useSaju}
                  onChange={(e) => setUseSaju(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="useSaju" className="text-sm font-medium">사주 입력</label>
              </div>

              {useSaju && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">생년월일</label>
                    <input
                      type="date"
                      title="생년월일"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">시간</label>
                    <select
                      title="출생 시간"
                      value={birthHour ?? ''}
                      onChange={(e) => setBirthHour(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    >
                      {hourOptions.map((opt) => (
                        <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 스토리 선택 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-3 text-lg">📜 스토리 (태몽/계절)</h2>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {(storyFlow.story.options as StoryOption[]).map((story) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(selectedStory?.id === story.id ? null : story)}
                  className={`p-2 rounded-lg text-left text-xs transition-all ${selectedStory?.id === story.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                >
                  <div className="text-lg mb-1">{story.emoji}</div>
                  <div className="font-medium truncate">{story.label}</div>
                  <div className={`text-xs ${selectedStory?.id === story.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {Object.keys(story.elements).join('+')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 바이브 선택 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-3 text-lg">🎨 바이브 (분위기)</h2>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {((storyFlow.vibe.options as unknown) as VibeOption[]).map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe)}
                  className={`p-2 rounded-lg text-left text-xs transition-all ${selectedVibe?.id === vibe.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                >
                  <div className="text-lg mb-1">{vibe.emoji}</div>
                  <div className="font-medium truncate">{vibe.label}</div>
                  <div className={`text-xs ${selectedVibe?.id === vibe.id ? 'text-purple-200' : 'text-gray-400'}`}>
                    {Object.keys(vibe.elements).join('+')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 생성 버튼 */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            >
              {loading ? '생성 중...' : '🚀 이름 생성'}
            </button>
            <div className="text-sm text-gray-500">
              {useSaju && birthDate && <span className="text-blue-600">✓ 사주 적용 </span>}
              {selectedStory && <span className="text-indigo-600">✓ {selectedStory.storyKeyword} </span>}
              {selectedVibe && <span className="text-purple-600">✓ {selectedVibe.vibeKeyword} </span>}
              {!useSaju && !selectedStory && !selectedVibe && <span>기본 가중치로 생성</span>}
            </div>
          </div>
        </div>

        {/* 통계 */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center gap-6">
              <h2 className="text-lg font-bold">📊 점수 분포</h2>
              <div className="flex gap-4 text-sm">
                <span className="text-purple-600">최고 {stats.maxScore}점</span>
                <span className="text-blue-600">90+ {stats.above90}개</span>
                <span className="text-green-600">85+ {stats.above85}개</span>
                <span className="text-yellow-600">80+ {stats.above80}개</span>
                <span className="text-gray-600">총 {results.length}개</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs">필터:</span>
                {[0, 70, 75, 80, 85, 90].map(score => (
                  <button
                    key={score}
                    onClick={() => setMinScore(score)}
                    className={`px-3 py-1 rounded text-xs font-medium ${minScore === score ? 'bg-blue-600 text-white' : 'bg-gray-100'
                      }`}
                  >
                    {score}+
                  </button>
                ))}
              </div>
            </div>
            {/* 🆕 검색 UI */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-medium">🔍 검색:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름 검색 (한글/한자)"
                className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕ 초기화
                </button>
              )}
              <span className="text-sm text-gray-500">
                검색 결과: {filteredResults.length}개
              </span>
            </div>
          </div>
        )}

        {/* 필터 로그 (별도 섹션) */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <button
              onClick={() => setShowFilterLog(!showFilterLog)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium"
            >
              {showFilterLog ? '▼' : '▶'} 🔍 필터링 로그 ({filteredOutNames.length}개 차단됨)
            </button>
            {showFilterLog && filteredOutNames.length > 0 && (
              <div className="mt-3">
                {/* 필터 로그 검색 */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={filterLogSearch}
                    onChange={(e) => setFilterLogSearch(e.target.value)}
                    placeholder="이름 또는 이유 검색..."
                    className="flex-1 max-w-xs border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {filterLogSearch && (
                    <button onClick={() => setFilterLogSearch('')} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  )}
                  <span className="text-xs text-gray-500">
                    {filteredOutNames.filter(item =>
                      !filterLogSearch.trim() ||
                      item.name.includes(filterLogSearch) ||
                      item.reason.includes(filterLogSearch)
                    ).length}개 표시
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-3 text-sm">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="text-left py-1 w-24">이름</th>
                        <th className="text-left py-1 w-16">계층</th>
                        <th className="text-left py-1">이유</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOutNames
                        .filter(item =>
                          !filterLogSearch.trim() ||
                          item.name.includes(filterLogSearch) ||
                          item.reason.includes(filterLogSearch)
                        )
                        .map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1 font-medium">{item.name}</td>
                            <td className={`py-1 text-xs font-bold ${item.layer === 'HARD' ? 'text-red-600' : item.layer === 'SOFT' ? 'text-orange-600' : 'text-yellow-600'}`}>
                              {item.layer}
                            </td>
                            <td className="py-1 text-gray-600">{item.reason}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {showFilterLog && filteredOutNames.length === 0 && (
              <p className="mt-2 text-sm text-gray-400">필터링된 이름이 없습니다.</p>
            )}
          </div>
        )}

        {/* 결과 */}
        {results.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            성씨를 입력하고 "이름 생성" 버튼을 눌러주세요
          </div>
        ) : (
          <div className="space-y-1">
            {filteredResults.map((name, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-gray-300 w-8">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold">
                        {'hanjaName' in name ? name.fullName.hangul : name.fullName}
                      </span>
                      {'hanjaName' in name && (
                        <>
                          <span className="text-sm text-gray-400">{name.romanName}</span>
                          <span className="text-sm text-gray-500">{name.hanja1.hanja}{name.hanja2.hanja}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {name.elements.join(' + ')}
                          </span>
                        </>
                      )}
                    </div>
                    {name.scoreBreakdown && (
                      <div className="mt-1 flex gap-2 text-xs">
                        <span className="text-gray-600">기본 {name.scoreBreakdown.base}</span>
                        {'hanjaName' in name && (
                          <>
                            <span className="text-blue-600">오행 {name.scoreBreakdown?.element}</span>
                            <span className="text-green-600">수리 {name.scoreBreakdown?.suri}</span>
                            <span className="text-purple-600">보너스 {name.scoreBreakdown?.bonus}</span>
                          </>
                        )}
                        <span className={name.scoreBreakdown.modernity >= 0 ? 'text-orange-600' : 'text-red-600'}>
                          현대성 {name.scoreBreakdown.modernity}
                        </span>
                        {'hanjaName' in name && name.scoreBreakdown.penalty !== undefined && name.scoreBreakdown.penalty > 0 && (
                          <span className="text-red-600">페널티 -{name.scoreBreakdown.penalty}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {name.warning && <div className="text-xs text-red-600">⚠️</div>}
                    <div className={`text-2xl font-bold ${name.score >= 90 ? 'text-blue-600' :
                      name.score >= 85 ? 'text-green-600' :
                        name.score >= 80 ? 'text-yellow-600' :
                          name.score >= 75 ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                      {name.score}
                    </div>
                    <button
                      onClick={() => 'hanjaName' in name && setSelectedReportName(name)}
                      className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded hover:bg-gray-100"
                      title="상세 리포트"
                    >
                      📊
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🆕 상세 리포트 모달 - 풀 리포트 카드 UI 사용 */}
        {selectedReportName && 'hanjaName' in selectedReportName && (
          <NameReport
            name={{
              hangulName: selectedReportName.hanja1.hangul + selectedReportName.hanja2.hangul,
              hanjaName: selectedReportName.hanja1.hanja + selectedReportName.hanja2.hanja,
              fullName: {
                hangul: selectedReportName.fullName.hangul,
                hanja: surname + selectedReportName.hanja1.hanja + selectedReportName.hanja2.hanja,
                roman: selectedReportName.romanName
              },
              hanja1: {
                hanja: selectedReportName.hanja1.hanja,
                hangul: selectedReportName.hanja1.hangul,
                meaning_korean: (selectedReportName.hanja1 as any).meaning_korean || '',
                element: (selectedReportName.hanja1 as any).element || 'Wood',
                strokes: (selectedReportName.hanja1 as any).strokes || 8
              },
              hanja2: {
                hanja: selectedReportName.hanja2.hanja,
                hangul: selectedReportName.hanja2.hangul,
                meaning_korean: (selectedReportName.hanja2 as any).meaning_korean || '',
                element: (selectedReportName.hanja2 as any).element || 'Water',
                strokes: (selectedReportName.hanja2 as any).strokes || 8
              },
              suri: selectedReportName.suri as any || {
                초년운: { count: 0, info: { level: '-' } },
                중년운: { count: 0, info: { level: '-' } },
                말년운: { count: 0, info: { level: '-' } },
                총운: { count: 0, info: { level: '-' } }
              },
              elements: selectedReportName.elements,
              score: selectedReportName.score
            }}
            saju={computedSaju as any}
            analysis={computedAnalysis as any}
            onClose={() => setSelectedReportName(null)}
          />
        )}
      </div>
    </div>
  );
}

export default DevApp;
