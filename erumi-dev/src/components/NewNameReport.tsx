/**
 * NewNameReport - 새 리포트 엔진 기반 리포트 컴포넌트
 * erumi-core/report의 generateReport를 사용
 */

import { useState, useEffect, useCallback } from 'react';
import { generateReport, type NameReport, type ReportInput } from 'erumi-core';

// 리포트 캐시 (같은 이름 재조회 시 재사용)
const reportCache = new Map<string, NameReport>();
function getCacheKey(name: { hanjaName: string; surname: string }, saju?: { elements?: Record<string, number> }): string {
    const hasSaju = !!(saju?.elements && Object.keys(saju.elements).length > 0);
    return `${name.surname}_${name.hanjaName}_${hasSaju ? 'saju' : 'nosaju'}`;
}

interface NewNameReportProps {
    name: {
        hangulName: string;
        hanjaName: string;
        surname: string;
        surnameHanja?: string;
        hanja1?: { hanja: string; hangul: string };
        hanja2?: { hanja: string; hangul: string };
    };
    saju?: {
        birthDate?: string;
        birthHour?: number | null;
        elements?: Record<string, number>;
        yongsin?: string[];
    };
    onClose: () => void;
}

// 탭 타입
type AnalysisTab = 'yinYang' | 'pronunciation' | 'numerology' | 'naturalElement' | 'forbiddenChar';

const TAB_LABELS: Record<AnalysisTab, string> = {
    yinYang: '음양오행',
    pronunciation: '발음오행',
    numerology: '수리성명학',
    naturalElement: '자원오행',
    forbiddenChar: '불용문자',
};

const LEVEL_COLORS: Record<string, string> = {
    '대길': 'bg-green-500',
    '길': 'bg-blue-500',
    '반길반흉': 'bg-yellow-500',
    '흉': 'bg-red-500',
};

export function NewNameReport({ name, saju, onClose }: NewNameReportProps) {
    const [report, setReport] = useState<NameReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<AnalysisTab>('yinYang');

    // ESC 키로 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // dim 영역 클릭 닫기
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    useEffect(() => {
        async function loadReport() {
            const cacheKey = getCacheKey(name, saju);

            // 캐시 확인
            const cached = reportCache.get(cacheKey);
            if (cached) {
                setReport(cached);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // ReportInput 구성
                const input: ReportInput = {
                    surname: name.surname,
                    surnameHanja: name.surnameHanja || name.surname,
                    givenName: name.hanja1 && name.hanja2
                        ? [name.hanja1.hangul, name.hanja2.hangul]
                        : name.hangulName.slice(1).split(''),
                    givenNameHanja: name.hanja1 && name.hanja2
                        ? [name.hanja1.hanja, name.hanja2.hanja]
                        : name.hanjaName.slice(1).split(''),
                    saju: saju ? {
                        birthDate: saju.birthDate || '',
                        birthHour: saju.birthHour ?? null,
                        elements: saju.elements,
                        yongsin: saju.yongsin,
                    } : undefined,
                };

                const result = await generateReport(input);
                reportCache.set(cacheKey, result); // 캐시 저장
                setReport(result);
            } catch (err) {
                console.error('Report generation error:', err);
                setError('리포트 생성 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        }

        loadReport();
    }, [name, saju]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
                <div className="bg-white rounded-2xl p-8 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">리포트 생성 중...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
                <div className="bg-white rounded-2xl p-8 text-center">
                    <p className="text-red-600 mb-4">{error || '리포트를 불러올 수 없습니다.'}</p>
                    <button
                        onClick={onClose}
                        className="bg-gray-200 px-4 py-2 rounded-lg"
                    >
                        닫기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto" onClick={handleBackdropClick}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">이름 리포트</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* 한자 Header */}
                    <div className="flex justify-center gap-6">
                        {report.header.characters.map((char, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-4xl font-bold text-gray-900">{char.hanja}</div>
                                <div className="text-sm text-gray-500 mt-1">{char.meaning}</div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-indigo-50 rounded-xl p-4 text-center">
                        <p className="text-gray-700">{report.summary.text}</p>
                    </div>

                    {/* Carousel Cards */}
                    <div className="space-y-4">
                        {report.carousel.map((card, idx) => (
                            <div
                                key={idx}
                                className="bg-white border rounded-xl p-5 shadow-sm"
                            >
                                <h4 className="font-bold text-lg text-gray-900 mb-3">{card.title}</h4>

                                {/* 글자별 의미 카드 */}
                                {card.type === 'meaning' && card.characters && (
                                    <div className="space-y-4">
                                        {card.characters.map((c, i) => (
                                            <div key={i} className="border-l-4 border-indigo-500 pl-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl font-bold text-indigo-600">{c.hanja}</span>
                                                    <span className="text-gray-600">: {c.meaning}</span>
                                                </div>
                                                <p className="text-gray-700 text-sm leading-relaxed">{c.story}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 이름의 기운 / 축복 카드 */}
                                {(card.type === 'energy' || card.type === 'blessing') && card.content && (
                                    <p className="text-gray-700 leading-relaxed">{card.content}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Analysis Tabs */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">성명학적 풀이</h3>

                        {/* Tab Buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(Object.keys(TAB_LABELS) as AnalysisTab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {TAB_LABELS[tab]}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            {/* 음양오행 */}
                            {activeTab === 'yinYang' && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-4">{report.analysis.yinYang.description}</p>
                                    <div className="flex justify-center gap-6 mb-4">
                                        {report.analysis.yinYang.characters.map((char, idx) => (
                                            <div key={idx} className="text-center">
                                                <div className="text-2xl font-bold">{char.hanja}</div>
                                                <div className="text-sm text-gray-500">{char.strokes}획/{char.type}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-center text-gray-700">{report.analysis.yinYang.summary}</p>
                                </div>
                            )}

                            {/* 발음오행 */}
                            {activeTab === 'pronunciation' && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-4">{report.analysis.pronunciation.description}</p>
                                    <div className="flex justify-center gap-6 mb-4">
                                        {report.analysis.pronunciation.characters.map((char, idx) => (
                                            <div key={idx} className="text-center">
                                                <div className="text-2xl font-bold">{char.hanja}</div>
                                                <div className="text-sm text-gray-500">{char.elementKorean}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-center text-gray-700">{report.analysis.pronunciation.summary}</p>
                                </div>
                            )}

                            {/* 수리성명학 */}
                            {activeTab === 'numerology' && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-4">{report.analysis.numerology.description}</p>
                                    <div className="space-y-3">
                                        {report.analysis.numerology.periods.map((period, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-lg">
                                                <div className="w-16 text-center">
                                                    <div className="font-bold">{period.name}</div>
                                                    <div className="text-xs text-gray-400">{period.ageRange}</div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-white text-sm ${LEVEL_COLORS[period.level]}`}>
                                                    {period.level}
                                                </div>
                                                <div className="text-sm text-gray-500">{period.suriNumber}수</div>
                                                <div className="flex-1 text-sm text-gray-700">{period.interpretation}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 자원오행 */}
                            {activeTab === 'naturalElement' && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-4">{report.analysis.naturalElement.description}</p>

                                    {/* 사주 정보가 없을 때 안내 */}
                                    {!report.analysis.naturalElement.hasSaju && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-4">
                                            <div className="text-3xl mb-3">🔮</div>
                                            <p className="text-gray-700 mb-4">
                                                자원오행은 <strong>사주(생년월일, 태어난 시간)</strong>를 바탕으로<br />
                                                이름이 가진 오행이 사주에 필요한 기운을 채워주는지 분석해요.
                                            </p>
                                            <p className="text-sm text-gray-500 mb-4">
                                                생년월일과 태어난 시간을 입력하면 더 정확한 분석 결과를 볼 수 있어요.
                                            </p>
                                        </div>
                                    )}

                                    {/* 사주 정보가 있을 때만 그래프 표시 */}
                                    {report.analysis.naturalElement.hasSaju && (
                                        <>
                                            <div className="grid grid-cols-5 gap-2 mb-4">
                                                {(['wood', 'fire', 'earth', 'metal', 'water'] as const).map(el => (
                                                    <div key={el} className="text-center">
                                                        <div className="text-xs text-gray-500 mb-1">
                                                            {el === 'wood' ? '목' : el === 'fire' ? '화' : el === 'earth' ? '토' : el === 'metal' ? '금' : '수'}
                                                        </div>
                                                        <div className="h-24 bg-gray-200 rounded relative overflow-hidden">
                                                            <div
                                                                className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all"
                                                                style={{ height: `${report.analysis.naturalElement.nameElements[el]}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-xs mt-1">{report.analysis.naturalElement.nameElements[el]}%</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-center text-gray-700">{report.analysis.naturalElement.summary}</p>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 불용문자 */}
                            {activeTab === 'forbiddenChar' && (
                                <div>
                                    <div className="space-y-2 mb-4">
                                        {report.analysis.forbiddenChar.characters.map((char, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                                <div className="text-2xl">{char.hanja}</div>
                                                <div className={`px-2 py-1 rounded text-xs ${char.status === 'good' ? 'bg-green-100 text-green-700' :
                                                    char.status === 'caution' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {char.status === 'good' ? '길' : char.status === 'caution' ? '주의' : '흉'}
                                                </div>
                                                <div className="text-sm text-gray-600">{char.reason}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-center text-gray-700">{report.analysis.forbiddenChar.summary}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewNameReport;
