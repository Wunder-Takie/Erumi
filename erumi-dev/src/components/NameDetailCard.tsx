import { useState } from 'react';

interface NameResult {
    fullName: { hangul: string; hanja?: string };
    hanjaName?: string;
    hanja1?: {
        hanja: string;
        meaning_korean: string;
        element?: string;
        strokes?: number;
        reading?: string;
    };
    hanja2?: {
        hanja: string;
        meaning_korean: string;
        element?: string;
        strokes?: number;
        reading?: string;
    };
    elements: string[];
    score: number;
    warning?: { reason: string };
    romanName?: string;
}

interface NameDetailCardProps {
    name: NameResult;
    surname: string;
    onClose: () => void;
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string }> = {
    Wood: { bg: 'bg-green-500/20', text: 'text-green-400' },
    Fire: { bg: 'bg-red-500/20', text: 'text-red-400' },
    Earth: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    Metal: { bg: 'bg-slate-400/20', text: 'text-slate-300' },
    Water: { bg: 'bg-blue-500/20', text: 'text-blue-400' }
};

const ELEMENT_NAMES: Record<string, string> = {
    Wood: '목(木)',
    Fire: '화(火)',
    Earth: '토(土)',
    Metal: '금(金)',
    Water: '수(水)'
};

// 81수리 길흉 간략화
function getNumerologyMeaning(strokes: number): { luck: 'good' | 'neutral' | 'bad'; meaning: string } {
    const goodNumbers = [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 73, 75, 81];
    const badNumbers = [2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 27, 28, 30, 34, 36, 38, 40, 42, 43, 44, 46, 49, 50, 51, 53, 54, 55, 56, 58, 59, 60, 62, 64, 66, 69, 70, 71, 72, 74, 76, 77, 78, 79, 80];

    if (goodNumbers.includes(strokes)) {
        return { luck: 'good', meaning: '길(吉)' };
    } else if (badNumbers.includes(strokes)) {
        return { luck: 'bad', meaning: '흉(凶)' };
    }
    return { luck: 'neutral', meaning: '중(中)' };
}

export function NameDetailCard({ name, surname, onClose }: NameDetailCardProps) {
    const [activeTab, setActiveTab] = useState<'meaning' | 'numerology'>('meaning');

    const strokes1 = name.hanja1?.strokes || 0;
    const strokes2 = name.hanja2?.strokes || 0;
    const surnameStrokes = surname.length * 8; // 임시 계산
    const totalStrokes = surnameStrokes + strokes1 + strokes2;

    const numerology = getNumerologyMeaning(totalStrokes % 81 || 81);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 p-6 border-b border-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-4xl font-light tracking-widest text-white mb-1">
                                {name.fullName.hangul}
                            </div>
                            {name.hanja1 && name.hanja2 && (
                                <div className="text-xl text-slate-400 tracking-widest">
                                    {name.hanja1.hanja}{name.hanja2.hanja}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Element Tags */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {name.elements.map((el, i) => (
                            <span
                                key={i}
                                className={`px-3 py-1 rounded-full text-sm ${ELEMENT_COLORS[el]?.bg || 'bg-slate-700'} ${ELEMENT_COLORS[el]?.text || 'text-slate-300'}`}
                            >
                                {ELEMENT_NAMES[el] || el}
                            </span>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setActiveTab('meaning')}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${activeTab === 'meaning'
                                    ? 'bg-white text-slate-900'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            한자 의미
                        </button>
                        <button
                            onClick={() => setActiveTab('numerology')}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${activeTab === 'numerology'
                                    ? 'bg-white text-slate-900'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            수리 분석
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'meaning' ? (
                        <div className="space-y-6">
                            {/* Hanja 1 */}
                            {name.hanja1 && (
                                <div className="bg-slate-800/50 rounded-xl p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={`text-5xl ${ELEMENT_COLORS[name.hanja1.element || 'Wood']?.text || 'text-white'}`}>
                                            {name.hanja1.hanja}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-lg text-white mb-1">
                                                {name.hanja1.reading || name.fullName.hangul[1]}
                                            </div>
                                            <div className="text-sm text-slate-400 mb-2">
                                                {name.hanja1.meaning_korean}
                                            </div>
                                            {name.hanja1.element && (
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${ELEMENT_COLORS[name.hanja1.element].bg} ${ELEMENT_COLORS[name.hanja1.element].text}`}>
                                                    {ELEMENT_NAMES[name.hanja1.element]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hanja 2 */}
                            {name.hanja2 && (
                                <div className="bg-slate-800/50 rounded-xl p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={`text-5xl ${ELEMENT_COLORS[name.hanja2.element || 'Water']?.text || 'text-white'}`}>
                                            {name.hanja2.hanja}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-lg text-white mb-1">
                                                {name.hanja2.reading || name.fullName.hangul[2]}
                                            </div>
                                            <div className="text-sm text-slate-400 mb-2">
                                                {name.hanja2.meaning_korean}
                                            </div>
                                            {name.hanja2.element && (
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${ELEMENT_COLORS[name.hanja2.element].bg} ${ELEMENT_COLORS[name.hanja2.element].text}`}>
                                                    {ELEMENT_NAMES[name.hanja2.element]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Warning */}
                            {name.warning && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                                        <span>⚠️</span>
                                        <span>{name.warning.reason}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Stroke Count Summary */}
                            <div className="bg-slate-800/50 rounded-xl p-5">
                                <div className="text-sm text-slate-400 mb-4">획수 분석</div>
                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">성씨</div>
                                        <div className="text-2xl text-white">{surnameStrokes}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">
                                            {name.hanja1?.hanja || '?'}
                                        </div>
                                        <div className="text-2xl text-white">{strokes1 || '?'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">
                                            {name.hanja2?.hanja || '?'}
                                        </div>
                                        <div className="text-2xl text-white">{strokes2 || '?'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">총획</div>
                                        <div className="text-2xl text-white font-medium">{totalStrokes}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 81 Numerology Result */}
                            <div className={`rounded-xl p-5 ${numerology.luck === 'good'
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : numerology.luck === 'bad'
                                        ? 'bg-red-500/10 border border-red-500/30'
                                        : 'bg-slate-800/50'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-slate-400 mb-1">81수리 판정</div>
                                        <div className="text-3xl font-light text-white">
                                            {totalStrokes % 81 || 81}수
                                        </div>
                                    </div>
                                    <div className={`text-2xl px-4 py-2 rounded-xl ${numerology.luck === 'good'
                                            ? 'bg-green-500/20 text-green-400'
                                            : numerology.luck === 'bad'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-slate-700 text-slate-300'
                                        }`}>
                                        {numerology.meaning}
                                    </div>
                                </div>
                            </div>

                            {/* Score */}
                            <div className="bg-slate-800/50 rounded-xl p-5 text-center">
                                <div className="text-sm text-slate-400 mb-2">종합 점수</div>
                                <div className="text-5xl font-light text-white">{name.score}</div>
                                <div className="text-slate-500 text-sm mt-1">점</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
