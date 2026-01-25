// NOTE: 이 파일의 인라인 스타일은 동적 오행 색상 값을 위한 것입니다
import { useMemo } from 'react';
import {
    analyzeFullPronunciation,
    generateSajuNarrative,
    generateSuriNarrative,
    generateBalanceNarrative,
    type SajuData,
    type SajuAnalysis
} from 'erumi-core';

interface PillarInfo {
    label: string;
    display: string;
    reading?: string;
    element?: string;
    stemEmoji?: string;
    branchEmoji?: string;
}

interface ElementStory {
    element: string;
    status: string;
    emoji: string;
    name: string;
    narrative: string;
}

interface SajuNarrativeType {
    yearStory: string;
    branchInfo: unknown;
    stemInfo: unknown;
    elementStories: ElementStory[];
    neededElements: string[];
    excessElements: string[];
    pillars: {
        year: PillarInfo;
        month: PillarInfo;
        day: PillarInfo;
        hour: PillarInfo;
    };
}

interface SuriStage {
    stage: string;
    count: number;
    ageRange: string;
    description: string;
    luck: {
        level: string;
        emoji: string;
        label: string;
        color: string;
        narrative: string;
    };
}

interface Compensation {
    element: string;
    emoji: string;
    name: string;
    status: string;
    message: string;
}

interface BalanceNarrativeType {
    score: number;
    balanceLevel: string;
    message: string;
    compensation: Compensation[];
    recommendation: string;
}

interface SyllableInfo {
    char: string;
    initial: string;
    final: string;
    initialElement: string | null;
    initialKorean?: string;
    finalElement: string | null;
    finalKorean?: string;
}

interface PronunciationResult {
    elements: {
        syllables: SyllableInfo[];
        elements: Record<string, number>;
        primaryElement: string | null;
        secondaryElement: string | null;
        summary: string;
    };
    yinYang: {
        syllables: unknown[];
        yang: number;
        yin: number;
        balance: number;
        balanceType: string;
        summary: string;
    };
}

interface NameReportProps {
    name: {
        hangulName: string;
        hanjaName: string;
        fullName: { hangul: string; hanja: string; roman: string };
        hanja1: { hanja: string; hangul: string; meaning_korean: string; element: string; strokes: number };
        hanja2: { hanja: string; hangul: string; meaning_korean: string; element: string; strokes: number };
        suri: {
            초년운: { count: number; info: { level: string } };
            중년운: { count: number; info: { level: string } };
            말년운: { count: number; info: { level: string } };
            총운: { count: number; info: { level: string } };
        };
        elements: string[];
        score: number;
    };
    saju?: SajuData;
    analysis?: SajuAnalysis;
    onClose: () => void;
}

const ELEMENT_COLORS: Record<string, string> = {
    Wood: '#22c55e',
    Fire: '#ef4444',
    Earth: '#f59e0b',
    Metal: '#94a3b8',
    Water: '#3b82f6'
};

const ELEMENT_INFO: Record<string, { emoji: string; korean: string; color: string }> = {
    Wood: { emoji: '🌳', korean: '목(木)', color: '#22c55e' },
    Fire: { emoji: '🔥', korean: '화(火)', color: '#ef4444' },
    Earth: { emoji: '⛰️', korean: '토(土)', color: '#f59e0b' },
    Metal: { emoji: '⚔️', korean: '금(金)', color: '#94a3b8' },
    Water: { emoji: '💧', korean: '수(水)', color: '#3b82f6' }
};

export function NameReport({ name, saju, analysis, onClose }: NameReportProps) {
    // 데이터 준비
    const pronunciationAnalysis = useMemo(() =>
        analyzeFullPronunciation(name.hangulName) as unknown as PronunciationResult, [name.hangulName]);

    const sajuNarrative = useMemo(() =>
        (saju ? generateSajuNarrative(saju, analysis ?? null) : null) as SajuNarrativeType | null, [saju, analysis]);

    const suriNarrative = useMemo(() =>
        generateSuriNarrative(name.suri) as SuriStage[] | null, [name.suri]);

    const balanceNarrative = useMemo(() =>
        generateBalanceNarrative(
            saju ?? null,
            analysis ?? null,
            name.elements,
            name.score
        ) as BalanceNarrativeType,
        [saju, analysis, name.elements, name.score]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-10">
                <div className="max-w-lg mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <div className="text-2xl font-light text-white tracking-wider">
                            {name.fullName.hangul}
                        </div>
                        <div className="text-sm text-slate-400">
                            {name.fullName.roman}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl p-2"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-lg mx-auto px-6 py-6 space-y-6">

                {/* Section A: 사주 이야기 */}
                {sajuNarrative && (
                    <section className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">📜</span>
                            <h2 className="text-lg font-medium text-white">사주 이야기</h2>
                        </div>

                        {/* 띠 스토리 */}
                        {sajuNarrative.yearStory && (
                            <p className="text-slate-200 mb-4 text-lg leading-relaxed">
                                {sajuNarrative.yearStory}
                            </p>
                        )}

                        {/* 사주팔자 미니 카드 */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {['year', 'month', 'day', 'hour'].map((key) => {
                                const pillar = sajuNarrative.pillars[key as keyof typeof sajuNarrative.pillars];
                                return (
                                    <div key={key} className="bg-slate-800/50 rounded-xl p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">{pillar.label}</div>
                                        <div className="text-lg text-white">{pillar.display}</div>
                                        <div className="text-xs text-slate-500">{pillar.reading}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 오행 분석 */}
                        {sajuNarrative.elementStories.length > 0 && (
                            <div className="space-y-2 mt-4 pt-4 border-t border-slate-700">
                                {sajuNarrative.elementStories.slice(0, 2).map((story, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span className="text-xl">{story.emoji}</span>
                                        <p className="text-sm text-slate-300">{story.narrative}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Section B: 오행 균형 비교 (NEW) */}
                {analysis && (
                    <section className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">⚖️</span>
                            <h2 className="text-lg font-medium text-white">오행 균형 비교</h2>
                        </div>

                        <p className="text-sm text-slate-300 mb-4">
                            사주의 부족한 기운을 이름이 어떻게 채워주는지 보여드려요.
                        </p>

                        {/* 오행 비교 차트 */}
                        <div className="space-y-3">
                            {(['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const).map((element) => {
                                const sajuCount = analysis.distribution?.[element] || 0;
                                const nameHas = name.elements.includes(element);
                                const info = ELEMENT_INFO[element];
                                const isNeeded = analysis.neededElements?.includes(element);
                                const isExcess = analysis.excessElements?.includes(element);

                                return (
                                    <div key={element} className="flex items-center gap-3">
                                        <div className="w-16 text-sm">
                                            <span className="mr-1">{info.emoji}</span>
                                            <span className="text-slate-300">{info.korean}</span>
                                        </div>

                                        {/* 사주 막대 */}
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="text-xs text-slate-500 w-8">사주</div>
                                            <div className="flex-1 bg-slate-800 rounded h-4 overflow-hidden">
                                                <div
                                                    className="h-full rounded transition-all"
                                                    style={{
                                                        width: `${Math.min(sajuCount * 25, 100)}%`,
                                                        backgroundColor: info.color + '80'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400 w-4">{sajuCount}</span>
                                        </div>

                                        {/* 이름 보완 표시 */}
                                        <div className="w-20 text-right">
                                            {nameHas && isNeeded && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                                    ✓ 보완
                                                </span>
                                            )}
                                            {nameHas && !isNeeded && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                                    + 이름
                                                </span>
                                            )}
                                            {isExcess && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                                                    과다
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 보완 요약 */}
                        {analysis.neededElements && analysis.neededElements.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-300">
                                    💡 사주에 부족한 <span className="text-cyan-400">
                                        {analysis.neededElements.map((e: string) => ELEMENT_INFO[e]?.korean || e).join(', ')}
                                    </span> 기운을 이름이 채워줘요!
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* Section C: 한자 의미 (NEW - 분리) */}
                <section className="bg-gradient-to-br from-rose-900/50 to-pink-900/50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🈳</span>
                        <h2 className="text-lg font-medium text-white">한자 의미</h2>
                    </div>

                    <p className="text-sm text-slate-300 mb-4">
                        이름에 담긴 한자의 뜻과 기운이에요.
                    </p>

                    {/* 한자 카드 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-xl p-5 text-center">
                            <div
                                className="text-4xl mb-2 font-serif"
                                style={{ color: ELEMENT_COLORS[name.hanja1.element] }}
                            >
                                {name.hanja1.hanja}
                            </div>
                            <div className="text-lg text-white mb-1">{name.hanja1.hangul}</div>
                            <div className="text-sm text-slate-400 mb-2">{name.hanja1.meaning_korean}</div>
                            <div
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                style={{
                                    backgroundColor: ELEMENT_COLORS[name.hanja1.element] + '20',
                                    color: ELEMENT_COLORS[name.hanja1.element]
                                }}
                            >
                                {ELEMENT_INFO[name.hanja1.element]?.emoji} {ELEMENT_INFO[name.hanja1.element]?.korean}
                            </div>
                            <div className="text-xs text-slate-500 mt-2">{name.hanja1.strokes}획</div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-5 text-center">
                            <div
                                className="text-4xl mb-2 font-serif"
                                style={{ color: ELEMENT_COLORS[name.hanja2.element] }}
                            >
                                {name.hanja2.hanja}
                            </div>
                            <div className="text-lg text-white mb-1">{name.hanja2.hangul}</div>
                            <div className="text-sm text-slate-400 mb-2">{name.hanja2.meaning_korean}</div>
                            <div
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                style={{
                                    backgroundColor: ELEMENT_COLORS[name.hanja2.element] + '20',
                                    color: ELEMENT_COLORS[name.hanja2.element]
                                }}
                            >
                                {ELEMENT_INFO[name.hanja2.element]?.emoji} {ELEMENT_INFO[name.hanja2.element]?.korean}
                            </div>
                            <div className="text-xs text-slate-500 mt-2">{name.hanja2.strokes}획</div>
                        </div>
                    </div>

                    {/* 의미 조합 */}
                    <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
                        <p className="text-slate-200 text-center">
                            "{name.hanja1.meaning_korean}"와 "{name.hanja2.meaning_korean}"의 조화로운 이름
                        </p>
                    </div>
                </section>

                {/* Section D: 발음 분석 (기존 B에서 축소) */}
                <section className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🎵</span>
                        <h2 className="text-lg font-medium text-white">발음 분석</h2>
                    </div>

                    {/* 발음오행 */}
                    <div className="bg-slate-800/30 rounded-xl p-4 mb-3">
                        <div className="text-xs text-slate-400 mb-2">발음 오행</div>
                        <div className="flex items-center gap-3">
                            {pronunciationAnalysis.elements.syllables.map((syl, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <span className="text-lg text-white">{syl.char}</span>
                                    <span className="text-xs" style={{ color: ELEMENT_COLORS[syl.initialElement || 'Metal'] }}>
                                        {syl.initialKorean}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-slate-300 mt-2">
                            {pronunciationAnalysis.elements.summary}
                        </p>
                    </div>

                    {/* 발음음양 */}
                    <div className="bg-slate-800/30 rounded-xl p-4">
                        <div className="text-xs text-slate-400 mb-2">발음 음양</div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">☀️</span>
                                <span className="text-white">양 {pronunciationAnalysis.yinYang.yang}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🌙</span>
                                <span className="text-white">음 {pronunciationAnalysis.yinYang.yin}</span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 mt-2">
                            {pronunciationAnalysis.yinYang.summary}
                        </p>
                    </div>
                </section>


                {/* Section C: 수리 운세 */}
                <section className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">📐</span>
                        <h2 className="text-lg font-medium text-white">이름 수리 운세</h2>
                    </div>

                    <div className="space-y-3">
                        {suriNarrative?.map((stage, i) => (
                            <div
                                key={i}
                                className="bg-slate-800/50 rounded-xl p-4"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-medium text-white">
                                            {stage.stage}
                                            <span className="text-xs text-slate-400 ml-2">
                                                ({stage.ageRange})
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500">{stage.count}수</div>
                                    </div>
                                    <div
                                        className="px-3 py-1 rounded-full text-sm font-medium"
                                        style={{
                                            backgroundColor: stage.luck.color + '20',
                                            color: stage.luck.color
                                        }}
                                    >
                                        {stage.luck.emoji} {stage.luck.label}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-300">
                                    {stage.luck.narrative}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section D: 종합 균형 */}
                <section className="bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">⚖️</span>
                        <h2 className="text-lg font-medium text-white">종합 균형</h2>
                    </div>

                    {/* 점수 */}
                    <div className="text-center mb-6">
                        <div className="text-6xl font-light text-white mb-1">
                            {name.score}
                        </div>
                        <div className="text-slate-400">점</div>
                    </div>

                    {/* 균형 메시지 */}
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center mb-4">
                        <p className="text-lg text-white">
                            {balanceNarrative?.message}
                        </p>
                    </div>

                    {/* 보완 분석 */}
                    {balanceNarrative?.compensation && balanceNarrative.compensation.length > 0 && (
                        <div className="space-y-2">
                            {balanceNarrative.compensation.map((comp, i) => (
                                <div key={i} className="flex items-center gap-2 bg-green-500/10 rounded-lg px-4 py-2">
                                    <span className="text-xl">{comp.emoji}</span>
                                    <span className="text-sm text-green-300">{comp.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 추천 문구 */}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-sm text-slate-300 text-center">
                            {balanceNarrative?.recommendation}
                        </p>
                    </div>
                </section>

                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                    닫기
                </button>
            </div>
        </div>
    );
}
