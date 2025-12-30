import { useState, useMemo } from 'react';
import { generateNames } from './utils/namingUtils';
import { generatePureKoreanNames } from './utils/pureKoreanUtils';
import type { NameItem } from './types';

type NameMode = 'hanja' | 'pure-korean';

function App() {
  const [surname, setSurname] = useState('김');
  const [results, setResults] = useState<NameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [nameMode, setNameMode] = useState<NameMode>('hanja');
  const [gender, setGender] = useState<'M' | 'F' | 'male' | 'female' | null>(null);

  const handleGenerate = () => {
    setLoading(true);
    try {
      let names: NameItem[] = [];
      if (nameMode === 'hanja') {
        names = generateNames(surname, [], gender === 'male' ? 'M' : gender === 'female' ? 'F' : gender) as NameItem[];
      } else {
        names = generatePureKoreanNames(surname, { gender: gender === 'M' ? 'male' : gender === 'F' ? 'female' : gender });
      }
      setResults(names);

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

      console.log('\n🏆 생성된 모든 이름:');
      names.forEach((name, i) => {
        if ('hanjaName' in name) { // HanjaNameResult Type Guard
          console.log(`\n${i + 1}. ${name.fullName.hangul} (${name.romanName}) - ${name.score}점`);
          console.log('   한자:', name.hanja1.hanja + name.hanja2.hanja);
        } else { // PureKoreanNameResult
          console.log(`\n${i + 1}. ${name.fullName} - ${name.score}점`);
          if (name.word2) {
            console.log('   의미:', name.word1.meaning + ' + ' + name.word2.meaning);
          } else {
            console.log('   의미:', name.word1.meaning + ' (단독)');
          }
        }
        if (name.scoreBreakdown) {
          console.log('   점수:', name.scoreBreakdown);
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

  const filteredResults = useMemo(() =>
    results.filter(r => r.score >= minScore),
    [results, minScore]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🚀 작명 엔진 테스트</h1>
        <p className="text-gray-600 mb-6">한자 DB: 60개 | 순 우리말 DB: 60개 | 점수 시스템: Dual-Mode</p>

        {/* 모드 선택 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setNameMode('hanja')}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-colors ${nameMode === 'hanja'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              📖 한자 이름
            </button>
            <button
              onClick={() => setNameMode('pure-korean')}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-colors ${nameMode === 'pure-korean'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              🌿 순 우리말 이름
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center">
            {nameMode === 'hanja'
              ? '전통 한자 기반 이름 (수리/오행 평가)'
              : '순 우리말 이름 (의미/음성미 평가)'}
          </p>
        </div>

        {/* 입력 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">성씨</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg"
                placeholder="김"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2" htmlFor="gender-select">성별</label>
              <select
                id="gender-select"
                title="성별 선택"
                value={gender || ''}
                onChange={(e) => setGender(e.target.value as 'M' | 'F' | null || null)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg"
              >
                <option value="">선택 안 함</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '생성 중...' : '이름 생성'}
              </button>
            </div>
          </div>
        </div>

        {/* 통계 */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📊 점수 분포</h2>
            <div className="grid grid-cols-6 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.maxScore}</div>
                <div className="text-sm text-gray-600">최고점</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.above90}</div>
                <div className="text-sm text-gray-600">90점+</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.above85}</div>
                <div className="text-sm text-gray-600">85점+</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.above80}</div>
                <div className="text-sm text-gray-600">80점+</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.above75}</div>
                <div className="text-sm text-gray-600">75점+</div>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.above70}</div>
                <div className="text-sm text-gray-600">70점+</div>
              </div>
            </div>
          </div>
        )}

        {/* 필터 */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">점수 필터:</span>
              {[0, 70, 75, 80, 85, 90].map(score => (
                <button
                  key={score}
                  onClick={() => setMinScore(score)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${minScore === score
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {score}점+
                </button>
              ))}
              <span className="ml-auto text-sm text-gray-500">
                표시: {filteredResults.length} / {results.length}개
              </span>
            </div>
          </div>
        )}

        {/* 결과 */}
        {results.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            성씨를 입력하고 "이름 생성" 버튼을 눌러주세요
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResults.map((name, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* 순위 */}
                  <div className="text-2xl font-bold text-gray-300 w-8">
                    {idx + 1}
                  </div>


                  {/* 이름 */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">
                        {'hanjaName' in name
                          ? name.fullName.hangul // HanjaNameResult
                          : name.fullName // PureKoreanNameResult
                        }
                      </span>
                      {'hanjaName' in name ? (
                        <>
                          <span className="text-sm text-gray-400">
                            {name.romanName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {name.hanja1.hanja}{name.hanja2.hanja}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {/* Pure Korean Meaning */}
                          {name.word2 ? `${name.word1.meaning} + ${name.word2.meaning}` : `${name.word1.meaning} (단독)`}
                        </span>
                      )}
                    </div>

                    {/* Breakdown */}
                    {name.scoreBreakdown && (
                      <div className="mt-1 flex gap-3 text-xs">
                        <span className="text-gray-600">
                          기본 {name.scoreBreakdown.base}
                        </span>
                        {'hanjaName' in name ? (
                          <>
                            <span className="text-blue-600">
                              오행 {name.scoreBreakdown?.element}
                            </span>
                            <span className="text-green-600">
                              수리 {name.scoreBreakdown?.suri}
                            </span>
                            <span className="text-purple-600">
                              보너스 {name.scoreBreakdown?.bonus}
                            </span>
                          </>
                        ) : (
                          <>
                            {name.scoreBreakdown.meaning !== undefined && (
                              <span className="text-blue-600">
                                의미 {name.scoreBreakdown.meaning}
                              </span>
                            )}
                            {name.scoreBreakdown.sound !== undefined && (
                              <span className="text-green-600">
                                음성미 {name.scoreBreakdown.sound}
                              </span>
                            )}
                            {name.scoreBreakdown.harmony !== undefined && (
                              <span className="text-purple-600">
                                조화 {name.scoreBreakdown.harmony}
                              </span>
                            )}
                            {name.scoreBreakdown.syllableBonus !== undefined && (
                              <span className="text-purple-600">
                                보너스 {name.scoreBreakdown.syllableBonus}
                              </span>
                            )}
                          </>
                        )}
                        <span className={name.scoreBreakdown.modernity >= 0 ? 'text-orange-600' : 'text-red-600'}>
                          현대성 {name.scoreBreakdown.modernity}
                        </span>
                        {'hanjaName' in name && name.scoreBreakdown.penalty !== undefined && name.scoreBreakdown.penalty > 0 && (
                          <span className="text-red-600">
                            페널티 -{name.scoreBreakdown.penalty}
                          </span>
                        )}
                        <span className="text-gray-500">
                          → raw {name.scoreBreakdown.raw}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 점수 */}
                  <div className="text-right">
                    {name.warning && (
                      <div className="text-xs text-red-600 mb-1">⚠️</div>
                    )}
                    <div className={`text-2xl font-bold ${name.score >= 90 ? 'text-blue-600' :
                      name.score >= 85 ? 'text-green-600' :
                        name.score >= 80 ? 'text-yellow-600' :
                          name.score >= 75 ? 'text-orange-600' :
                            'text-gray-600'
                      }`}>
                      {name.score}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
