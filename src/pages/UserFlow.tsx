/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { generateNames } from '../utils/namingUtils';
import { calculateSaju, sajuToWeights, analyzeElements, extractYongsin } from '../utils/sajuUtils';
import storyFlow from '../data/story_flow.json';
import type { NameItem } from '../types';
import { NameReport } from '../components/NameReport';

// Types
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

type Step = 'intro' | 'basics' | 'story' | 'vibe' | 'result';

// Progress Bar Component (개선안 A)
function ProgressBar({ currentStep }: { currentStep: Step }) {
    const steps: { key: Step; label: string }[] = [
        { key: 'basics', label: '기본정보' },
        { key: 'story', label: '스토리' },
        { key: 'vibe', label: '바이브' },
        { key: 'result', label: '결과' },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentStep === 'intro') return null;

    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <div className="flex justify-between items-center">
                {steps.map((step, idx) => (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${idx <= currentIndex
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                        >
                            {idx + 1}
                        </div>
                        <span className={`text-xs mt-1 ${idx <= currentIndex ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
    );
}

// Name Card Slider Component (개선안 C)
function NameCardSlider({
    names,
    onSelectName,
    onViewAll,
}: {
    names: NameItem[];
    onSelectName: (name: NameItem) => void;
    onViewAll: () => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const displayNames = names.slice(0, 5);

    const goNext = () => setCurrentIndex((prev) => Math.min(prev + 1, displayNames.length - 1));
    const goPrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

    if (displayNames.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                조건에 맞는 이름이 없습니다.
            </div>
        );
    }

    const name = displayNames[currentIndex];
    const hangulName = 'hanjaName' in name ? name.fullName.hangul : String(name.fullName);
    const hanjaName = 'hanjaName' in name ? name.hanjaName : '';

    return (
        <div className="max-w-md mx-auto">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
                <div className="text-6xl font-bold text-gray-900 mb-2">{hangulName}</div>
                {hanjaName && <div className="text-2xl text-gray-500 mb-4">{hanjaName}</div>}
                <div className={`text-5xl font-bold mb-4 ${name.score >= 90 ? 'text-indigo-600' :
                        name.score >= 80 ? 'text-green-600' :
                            name.score >= 70 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                    {name.score}점
                </div>
                {'elements' in name && (
                    <div className="flex justify-center gap-2">
                        {name.elements.map((el: string) => (
                            <span key={el} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                                {el}
                            </span>
                        ))}
                    </div>
                )}
                <button
                    onClick={() => onSelectName(name)}
                    className="mt-6 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                    📊 상세 리포트 보기
                </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
                <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    ◀
                </button>
                <div className="flex gap-2">
                    {displayNames.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-indigo-600 w-4' : 'bg-gray-300'
                                }`}
                        />
                    ))}
                </div>
                <button
                    onClick={goNext}
                    disabled={currentIndex === displayNames.length - 1}
                    className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    ▶
                </button>
            </div>

            {/* View All Button */}
            <button
                onClick={onViewAll}
                className="mt-6 w-full py-3 text-gray-600 hover:text-gray-900 text-sm"
            >
                전체 {names.length}개 이름 보기 →
            </button>
        </div>
    );
}

// Main UserFlow Component
export default function UserFlow() {
    const [step, setStep] = useState<Step>('intro');
    const [surname, setSurname] = useState('');
    const [gender, setGender] = useState<'M' | 'F' | null>(null);
    const [selectedStory, setSelectedStory] = useState<StoryOption | null>(null);
    const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);
    const [results, setResults] = useState<NameItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAllResults, setShowAllResults] = useState(false);
    const [selectedReportName, setSelectedReportName] = useState<NameItem | null>(null);

    // 사주 (개선안 B: 결과화면에서 입력)
    const [showSajuInput, setShowSajuInput] = useState(false);
    const [birthDate, setBirthDate] = useState('');
    const [birthHour, setBirthHour] = useState<number | null>(null);
    const [computedSaju, setComputedSaju] = useState<Record<string, unknown> | null>(null);
    const [computedAnalysis, setComputedAnalysis] = useState<{
        distribution: Record<string, number>;
        neededElements: string[];
        excessElements: string[];
    } | null>(null);

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
        { value: 11, label: '해시 (21:30~23:30)' },
    ];

    const generateNameResults = (useSaju: boolean = false) => {
        setLoading(true);
        try {
            const storyWeights: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
            let yongsinWeights: Record<string, number> | null = null;

            if (useSaju && birthDate) {
                const saju = (calculateSaju as (date: string, hour: number | null) => Record<string, unknown>)(birthDate, birthHour);
                const analysis = analyzeElements(saju);
                const weights = sajuToWeights(saju);

                setComputedSaju(saju);
                setComputedAnalysis(analysis as any);

                for (const [element, value] of Object.entries(weights)) {
                    storyWeights[element as keyof typeof storyWeights] += (value as number) * 0.4;
                }

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
            } else {
                setComputedSaju(null);
                setComputedAnalysis(null);
            }

            const storyMultiplier = useSaju && birthDate ? 0.3 : 0.5;
            if (selectedStory && Object.keys(selectedStory.elements).length > 0) {
                for (const [element, ratio] of Object.entries(selectedStory.elements)) {
                    storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * storyMultiplier / 0.5;
                }
            }

            const vibeMultiplier = useSaju && birthDate ? 0.3 : 0.5;
            if (selectedVibe) {
                for (const [element, ratio] of Object.entries(selectedVibe.elements)) {
                    storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * vibeMultiplier / 0.5;
                }
            }

            const names = generateNames(surname, [], gender, storyWeights, yongsinWeights) as NameItem[];
            setResults(names);
        } catch (err) {
            console.error('Error generating names:', err);
        } finally {
            setLoading(false);
        }
    };

    const goNext = () => {
        if (step === 'intro') setStep('basics');
        else if (step === 'basics' && surname) setStep('story');
        else if (step === 'story') setStep('vibe');
        else if (step === 'vibe') {
            generateNameResults(false);
            setStep('result');
        }
    };

    // 개선안 D: 뒤로가기
    const goBack = () => {
        if (step === 'basics') setStep('intro');
        else if (step === 'story') setStep('basics');
        else if (step === 'vibe') setStep('story');
        else if (step === 'result') {
            setShowAllResults(false);
            setStep('vibe');
        }
    };

    const handleSajuApply = () => {
        generateNameResults(true);
        setShowSajuInput(false);
    };

    // Filtered results for display
    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => b.score - a.score);
    }, [results]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Progress Bar */}
                <ProgressBar currentStep={step} />

                {/* Step: Intro */}
                {step === 'intro' && (
                    <div className="text-center py-16">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            ✨ 아이의 첫 번째 이름
                        </h1>
                        <p className="text-lg text-gray-600 mb-12">
                            이름은 평생을 함께할 첫 번째 선물입니다
                        </p>
                        <button
                            onClick={goNext}
                            className="bg-indigo-600 text-white px-12 py-4 rounded-full text-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                        >
                            시작하기
                        </button>
                    </div>
                )}

                {/* Step: Basics */}
                {step === 'basics' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">기본 정보</h2>
                        <p className="text-gray-600 mb-8">아이의 성씨와 성별을 알려주세요</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">성씨</label>
                                <input
                                    type="text"
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    placeholder="예: 김"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'M' as const, label: '👦 남아' },
                                        { value: 'F' as const, label: '👧 여아' },
                                        { value: null, label: '✨ 아직 몰라요' },
                                    ].map((option) => (
                                        <button
                                            key={option.label}
                                            onClick={() => setGender(option.value)}
                                            className={`py-3 rounded-xl font-medium transition-all ${gender === option.value
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={goNext}
                            disabled={!surname}
                            className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {/* Step: Story */}
                {step === 'story' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {storyFlow.story.question}
                        </h2>
                        <p className="text-gray-600 mb-8">{storyFlow.story.subtitle}</p>

                        <div className="grid grid-cols-2 gap-3">
                            {(storyFlow.story.options as StoryOption[]).map((story) => (
                                <button
                                    key={story.id}
                                    onClick={() => setSelectedStory(selectedStory?.id === story.id ? null : story)}
                                    className={`p-4 rounded-xl text-left transition-all ${selectedStory?.id === story.id
                                            ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]'
                                            : 'bg-white text-gray-900 hover:bg-gray-50 shadow'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{story.emoji}</div>
                                    <div className="font-medium text-sm">{story.label}</div>
                                    <div className={`text-xs mt-1 ${selectedStory?.id === story.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {story.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={goNext}
                            className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {/* Step: Vibe */}
                {step === 'vibe' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {storyFlow.vibe.question}
                        </h2>
                        <p className="text-gray-600 mb-8">{storyFlow.vibe.subtitle}</p>

                        <div className="grid grid-cols-2 gap-3">
                            {((storyFlow.vibe.options as unknown) as VibeOption[]).map((vibe) => (
                                <button
                                    key={vibe.id}
                                    onClick={() => setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe)}
                                    className={`p-4 rounded-xl text-left transition-all ${selectedVibe?.id === vibe.id
                                            ? 'bg-purple-600 text-white shadow-lg scale-[1.02]'
                                            : 'bg-white text-gray-900 hover:bg-gray-50 shadow'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{vibe.emoji}</div>
                                    <div className="font-medium text-sm">{vibe.label}</div>
                                    <div className={`text-xs mt-1 ${selectedVibe?.id === vibe.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                        {vibe.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={goNext}
                            disabled={loading}
                            className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                        >
                            {loading ? '이름 찾는 중...' : '이름 추천받기 ✨'}
                        </button>
                    </div>
                )}

                {/* Step: Result */}
                {step === 'result' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 다시 선택하기
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                            ✨ 추천 이름
                        </h2>
                        <p className="text-gray-600 mb-8 text-center">
                            {selectedStory?.storyKeyword || '특별한'}의 기운과 {selectedVibe?.vibeKeyword || '아름다운'} 풍경을 담았습니다
                        </p>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-gray-500">이름을 찾고 있습니다...</p>
                            </div>
                        ) : showAllResults ? (
                            // 전체 목록 보기
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowAllResults(false)}
                                    className="text-indigo-600 hover:text-indigo-800 mb-4"
                                >
                                    ← 카드 보기로 돌아가기
                                </button>
                                {sortedResults.map((name, idx) => {
                                    const hangulName = 'hanjaName' in name ? name.fullName.hangul : String(name.fullName);
                                    const hanjaName = 'hanjaName' in name ? name.hanjaName : '';
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedReportName(name)}
                                            className="bg-white rounded-xl p-4 shadow hover:shadow-md cursor-pointer transition-shadow flex items-center gap-4"
                                        >
                                            <div className="text-xl font-bold text-gray-300">{idx + 1}</div>
                                            <div className="flex-1">
                                                <div className="font-bold">{hangulName}</div>
                                                {hanjaName && <div className="text-sm text-gray-500">{hanjaName}</div>}
                                            </div>
                                            <div className={`text-xl font-bold ${name.score >= 90 ? 'text-indigo-600' :
                                                    name.score >= 80 ? 'text-green-600' : 'text-gray-600'
                                                }`}>
                                                {name.score}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // 카드 슬라이더 (개선안 C)
                            <NameCardSlider
                                names={sortedResults}
                                onSelectName={setSelectedReportName}
                                onViewAll={() => setShowAllResults(true)}
                            />
                        )}

                        {/* 사주 입력 옵션 (개선안 B) */}
                        {!showSajuInput && !computedSaju && (
                            <div className="mt-8 p-4 bg-indigo-50 rounded-xl text-center">
                                <p className="text-sm text-indigo-600 mb-3">
                                    📅 사주를 입력하면 더 정확한 추천을 받을 수 있어요
                                </p>
                                <button
                                    onClick={() => setShowSajuInput(true)}
                                    className="text-indigo-600 font-medium hover:text-indigo-800"
                                >
                                    사주 입력하기 →
                                </button>
                            </div>
                        )}

                        {showSajuInput && (
                            <div className="mt-8 p-4 bg-white rounded-xl shadow">
                                <h3 className="font-bold mb-4">📅 사주 정보 입력</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">생년월일</label>
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">시간</label>
                                        <select
                                            value={birthHour ?? ''}
                                            onChange={(e) => setBirthHour(e.target.value === '' ? null : Number(e.target.value))}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        >
                                            {hourOptions.map((opt) => (
                                                <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setShowSajuInput(false)}
                                        className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSajuApply}
                                        disabled={!birthDate}
                                        className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:bg-gray-300"
                                    >
                                        적용하기
                                    </button>
                                </div>
                            </div>
                        )}

                        {computedSaju && (
                            <div className="mt-4 p-3 bg-green-50 rounded-xl text-center text-sm text-green-700">
                                ✓ 사주가 적용되었습니다
                            </div>
                        )}

                        {/* 다시하기 버튼 */}
                        <button
                            onClick={() => {
                                setStep('intro');
                                setSurname('');
                                setGender(null);
                                setSelectedStory(null);
                                setSelectedVibe(null);
                                setResults([]);
                                setBirthDate('');
                                setBirthHour(null);
                                setComputedSaju(null);
                                setComputedAnalysis(null);
                            }}
                            className="w-full mt-8 py-3 text-gray-500 hover:text-gray-700"
                        >
                            처음부터 다시 하기
                        </button>
                    </div>
                )}

                {/* Name Report Modal */}
                {selectedReportName && 'hanjaName' in selectedReportName && (
                    <NameReport
                        name={{
                            hangulName: selectedReportName.hanja1.hangul + selectedReportName.hanja2.hangul,
                            hanjaName: selectedReportName.hanja1.hanja + selectedReportName.hanja2.hanja,
                            fullName: {
                                hangul: selectedReportName.fullName.hangul,
                                hanja: surname + selectedReportName.hanja1.hanja + selectedReportName.hanja2.hanja,
                                roman: selectedReportName.romanName,
                            },
                            hanja1: {
                                hanja: selectedReportName.hanja1.hanja,
                                hangul: selectedReportName.hanja1.hangul,
                                meaning_korean: (selectedReportName.hanja1 as any).meaning_korean || '',
                                element: (selectedReportName.hanja1 as any).element || 'Wood',
                                strokes: (selectedReportName.hanja1 as any).strokes || 8,
                            },
                            hanja2: {
                                hanja: selectedReportName.hanja2.hanja,
                                hangul: selectedReportName.hanja2.hangul,
                                meaning_korean: (selectedReportName.hanja2 as any).meaning_korean || '',
                                element: (selectedReportName.hanja2 as any).element || 'Water',
                                strokes: (selectedReportName.hanja2 as any).strokes || 8,
                            },
                            suri: selectedReportName.suri as any || {
                                초년운: { count: 0, info: { level: '-' } },
                                중년운: { count: 0, info: { level: '-' } },
                                말년운: { count: 0, info: { level: '-' } },
                                총운: { count: 0, info: { level: '-' } },
                            },
                            elements: selectedReportName.elements,
                            score: selectedReportName.score,
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
