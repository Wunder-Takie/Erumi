import { useState } from 'react';

interface SajuReportProps {
    saju: {
        year: { pillar: string; stemElement: string; branchElement: string };
        month: { pillar: string; stemElement: string; branchElement: string };
        day: { pillar: string; stemElement: string; branchElement: string };
        hour: { pillar: string; stemElement: string; branchElement: string } | null;
    };
    analysis: {
        distribution: Record<string, number>;
        needed: string[];
        excess: string[];
    };
    birthInfo: {
        year: number;
        month: number;
        day: number;
        hour: number | null;
    };
    onClose: () => void;
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Wood: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
    Fire: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
    Earth: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' },
    Metal: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400' },
    Water: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' }
};

const ELEMENT_NAMES: Record<string, string> = {
    Wood: '목(木)',
    Fire: '화(火)',
    Earth: '토(土)',
    Metal: '금(金)',
    Water: '수(水)'
};

const ELEMENT_EMOJI: Record<string, string> = {
    Wood: '🌲',
    Fire: '🔥',
    Earth: '🏔️',
    Metal: '⚔️',
    Water: '💧'
};

export function SajuReport({ saju, analysis, birthInfo, onClose }: SajuReportProps) {
    const [activeTab, setActiveTab] = useState<'pillars' | 'elements'>('pillars');

    const maxCount = Math.max(...Object.values(analysis.distribution));

    const formatDate = () => {
        const hourText = birthInfo.hour !== null
            ? `${Math.floor(birthInfo.hour / 2) * 2}:00~${Math.floor(birthInfo.hour / 2) * 2 + 2}:00`
            : '시간 미상';
        return `${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${hourText}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 p-6 border-b border-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-amber-400">✨</span>
                                <span className="text-sm text-amber-400">사주 분석 리포트</span>
                            </div>
                            <h2 className="text-xl font-light text-white">{formatDate()}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setActiveTab('pillars')}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${activeTab === 'pillars'
                                    ? 'bg-white text-slate-900'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            사주팔자
                        </button>
                        <button
                            onClick={() => setActiveTab('elements')}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${activeTab === 'elements'
                                    ? 'bg-white text-slate-900'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            오행 분석
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'pillars' ? (
                        <div>
                            {/* Four Pillars Display */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: '시주', data: saju.hour },
                                    { label: '일주', data: saju.day },
                                    { label: '월주', data: saju.month },
                                    { label: '년주', data: saju.year }
                                ].map((pillar, idx) => (
                                    <div key={idx} className="text-center">
                                        <div className="text-xs text-slate-500 mb-2">{pillar.label}</div>
                                        {pillar.data ? (
                                            <div className="bg-slate-800 rounded-xl p-3">
                                                <div className={`text-2xl mb-1 ${ELEMENT_COLORS[pillar.data.stemElement].text}`}>
                                                    {pillar.data.pillar[0]}
                                                </div>
                                                <div className={`text-2xl ${ELEMENT_COLORS[pillar.data.branchElement].text}`}>
                                                    {pillar.data.pillar[1]}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-2">
                                                    {ELEMENT_NAMES[pillar.data.stemElement].split('(')[0]}
                                                    +
                                                    {ELEMENT_NAMES[pillar.data.branchElement].split('(')[0]}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-800/50 rounded-xl p-3 text-slate-600">
                                                <div className="text-2xl mb-1">?</div>
                                                <div className="text-2xl">?</div>
                                                <div className="text-xs text-slate-600 mt-2">미상</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pillar Summary */}
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <div className="text-sm text-slate-400 mb-2">사주팔자 요약</div>
                                <div className="text-lg text-white">
                                    {saju.year.pillar}년 {saju.month.pillar}월 {saju.day.pillar}일
                                    {saju.hour ? ` ${saju.hour.pillar}시` : ''}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Element Distribution Chart */}
                            <div className="space-y-3 mb-6">
                                {Object.entries(analysis.distribution).map(([element, count]) => (
                                    <div key={element}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className={ELEMENT_COLORS[element].text}>
                                                {ELEMENT_EMOJI[element]} {ELEMENT_NAMES[element]}
                                            </span>
                                            <span className="text-slate-400">{count}개</span>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${ELEMENT_COLORS[element].bg.replace('/20', '')}`}
                                                style={{ width: `${(count / maxCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Analysis Result */}
                            <div className="space-y-4">
                                {analysis.needed.length > 0 && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
                                            <span>⚠️</span>
                                            <span>보충이 필요한 오행</span>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {analysis.needed.map(el => (
                                                <span
                                                    key={el}
                                                    className={`px-3 py-1 rounded-full text-sm ${ELEMENT_COLORS[el].bg} ${ELEMENT_COLORS[el].text}`}
                                                >
                                                    {ELEMENT_EMOJI[el]} {ELEMENT_NAMES[el]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analysis.excess.length > 0 && (
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <div className="text-slate-400 text-sm mb-2">과다한 오행</div>
                                        <div className="flex gap-2 flex-wrap">
                                            {analysis.excess.map(el => (
                                                <span
                                                    key={el}
                                                    className={`px-3 py-1 rounded-full text-sm ${ELEMENT_COLORS[el].bg} ${ELEMENT_COLORS[el].text}`}
                                                >
                                                    {ELEMENT_EMOJI[el]} {ELEMENT_NAMES[el]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <div className="text-slate-400 text-sm mb-2">💡 이름 추천 방향</div>
                                    <p className="text-white text-sm leading-relaxed">
                                        {analysis.needed.length > 0
                                            ? `${analysis.needed.map(e => ELEMENT_NAMES[e]).join(', ')}의 기운이 부족하므로, 이 오행에 해당하는 한자를 이름에 포함하면 균형을 맞출 수 있습니다.`
                                            : '오행이 비교적 균형 잡혀 있습니다. 원하는 성향에 맞는 오행을 선택하세요.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
