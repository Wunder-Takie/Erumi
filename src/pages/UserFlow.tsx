/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react';
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

type Step = 'intro' | 'basics' | 'saju' | 'story' | 'vibe' | 'result';

// 결제 패키지
const PAYMENT_PACKAGES = [
    { count: 1, price: 1900, label: '1개', popular: false },
    { count: 3, price: 3900, label: '3개', popular: false },
    { count: 5, price: 4900, label: '5개', popular: true },
    { count: -1, price: 9900, label: '전체', popular: false }, // -1 = all
];

// Progress Bar Component
function ProgressBar({ currentStep }: { currentStep: Step }) {
    const steps: { key: Step; label: string }[] = [
        { key: 'basics', label: '기본정보' },
        { key: 'saju', label: '사주' },
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

// 잠금된 이름 카드
function LockedNameCard({ rank, onUnlock }: { rank: number; onUnlock: () => void }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                <div className="text-4xl mb-4">🔒</div>
                <div className="text-lg font-bold text-gray-700 mb-2">{rank}위 이름</div>
                <button
                    onClick={onUnlock}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors"
                >
                    잠금 해제하기
                </button>
            </div>
            <div className="text-6xl font-bold text-gray-300 blur-sm mb-2">김**</div>
            <div className="text-2xl text-gray-300 blur-sm mb-4">金**</div>
            <div className="text-5xl font-bold text-gray-300 blur-sm">??점</div>
        </div>
    );
}

// 결제 모달
function PaymentModal({
    totalCount,
    unlockedCount,
    onSelectPackage,
    onClose,
}: {
    totalCount: number;
    unlockedCount: number;
    onSelectPackage: (count: number) => void;
    onClose: () => void;
}) {
    const remainingCount = totalCount - unlockedCount;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-center mb-2">이름 잠금 해제</h3>
                <p className="text-gray-500 text-center text-sm mb-6">
                    총 {totalCount}개 중 {remainingCount}개 잠김
                </p>

                <div className="space-y-3">
                    {PAYMENT_PACKAGES.map((pkg) => {
                        const displayCount = pkg.count === -1 ? remainingCount : pkg.count;
                        const perPrice = Math.round(pkg.price / displayCount);

                        return (
                            <button
                                key={pkg.count}
                                onClick={() => onSelectPackage(pkg.count)}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${pkg.popular
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-left">
                                        <div className="font-bold text-lg">
                                            {pkg.label}
                                            {pkg.popular && (
                                                <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                                    BEST
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            개당 {perPrice.toLocaleString()}원
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-indigo-600">
                                        {pkg.price.toLocaleString()}원
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                    구매 시 상세 리포트 + PDF 저장 포함
                </p>
            </div>
        </div>
    );
}

// 이름 카드 (열람 가능)
function UnlockedNameCard({
    name,
    rank,
    onViewReport,
}: {
    name: NameItem;
    rank: number;
    onViewReport: () => void;
}) {
    const hangulName = 'hanjaName' in name ? name.fullName.hangul : String(name.fullName);
    const hanjaName = 'hanjaName' in name ? name.hanjaName : '';

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
            <div className="absolute top-4 left-4 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
                {rank}위
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2">{hangulName}</div>
            {hanjaName && <div className="text-2xl text-gray-500 mb-4">{hanjaName}</div>}
            <div
                className={`text-5xl font-bold mb-4 ${name.score >= 90
                    ? 'text-indigo-600'
                    : name.score >= 80
                        ? 'text-green-600'
                        : name.score >= 70
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                    }`}
            >
                {name.score}점
            </div>
            {'elements' in name && (
                <div className="flex justify-center gap-2 mb-4">
                    {name.elements.map((el: string) => (
                        <span key={el} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                            {el}
                        </span>
                    ))}
                </div>
            )}
            <button
                onClick={onViewReport}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
                📊 상세 리포트 보기
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
    const [selectedReportName, setSelectedReportName] = useState<NameItem | null>(null);

    // 사주 (이제 별도 Step)
    const [birthDate, setBirthDate] = useState('');
    const [birthHour, setBirthHour] = useState<number | null>(null);
    const [computedSaju, setComputedSaju] = useState<Record<string, unknown> | null>(null);
    const [computedAnalysis, setComputedAnalysis] = useState<{
        distribution: Record<string, number>;
        neededElements: string[];
        excessElements: string[];
    } | null>(null);

    // 잠금 시스템
    const [unlockedIndices, setUnlockedIndices] = useState<Set<number>>(new Set([1])); // 2위(index 1)는 무료
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    const hourOptions = [
        { value: null, label: '모름 / 건너뛰기' },
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

    const generateNameResults = () => {
        setLoading(true);
        try {
            const storyWeights: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
            let yongsinWeights: Record<string, number> | null = null;

            const useSaju = !!birthDate;

            if (useSaju) {
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

            const storyMultiplier = useSaju ? 0.3 : 0.5;
            if (selectedStory && Object.keys(selectedStory.elements).length > 0) {
                for (const [element, ratio] of Object.entries(selectedStory.elements)) {
                    storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * storyMultiplier / 0.5;
                }
            }

            const vibeMultiplier = useSaju ? 0.3 : 0.5;
            if (selectedVibe) {
                for (const [element, ratio] of Object.entries(selectedVibe.elements)) {
                    storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * vibeMultiplier / 0.5;
                }
            }

            const names = generateNames(surname, [], gender, storyWeights, yongsinWeights) as NameItem[];
            setResults(names);
            // 2위(index 1)만 무료로 시작
            setUnlockedIndices(new Set([1]));
            setCurrentCardIndex(1); // 2위부터 시작
        } catch (err) {
            console.error('Error generating names:', err);
        } finally {
            setLoading(false);
        }
    };

    const goNext = () => {
        if (step === 'intro') setStep('basics');
        else if (step === 'basics' && surname) setStep('saju');
        else if (step === 'saju') setStep('story');
        else if (step === 'story') setStep('vibe');
        else if (step === 'vibe') {
            generateNameResults();
            setStep('result');
        }
    };

    const goBack = () => {
        if (step === 'basics') setStep('intro');
        else if (step === 'saju') setStep('basics');
        else if (step === 'story') setStep('saju');
        else if (step === 'vibe') setStep('story');
        else if (step === 'result') setStep('vibe');
    };

    // 결제 시뮬레이션 (실제 결제 없음)
    const handlePayment = (count: number) => {
        const sortedNames = [...results].sort((a, b) => b.score - a.score);
        const newUnlocked = new Set(unlockedIndices);

        if (count === -1) {
            // 전체
            sortedNames.forEach((_, idx) => newUnlocked.add(idx));
        } else {
            // 잠긴 것 중에서 count개 해제
            let unlockCount = 0;
            for (let i = 0; i < sortedNames.length && unlockCount < count; i++) {
                if (!newUnlocked.has(i)) {
                    newUnlocked.add(i);
                    unlockCount++;
                }
            }
        }

        setUnlockedIndices(newUnlocked);
        setShowPaymentModal(false);

        // 첫 번째 새로 해제된 이름으로 이동
        const firstNewUnlocked = [...newUnlocked].find(i => !unlockedIndices.has(i));
        if (firstNewUnlocked !== undefined) {
            setCurrentCardIndex(firstNewUnlocked);
        }
    };

    // Sorted results
    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => b.score - a.score);
    }, [results]);

    // ESC로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedReportName) setSelectedReportName(null);
                if (showPaymentModal) setShowPaymentModal(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedReportName, showPaymentModal]);

    // 카드 네비게이션
    const goNextCard = () => setCurrentCardIndex((prev) => Math.min(prev + 1, sortedResults.length - 1));
    const goPrevCard = () => setCurrentCardIndex((prev) => Math.max(prev - 1, 0));

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

                {/* Step: Saju (새로 추가) */}
                {step === 'saju' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">📅 사주 정보</h2>
                        <p className="text-gray-600 mb-8">사주를 입력하면 더 정확한 이름을 추천해드려요</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">태어난 시간</label>
                                <select
                                    value={birthHour ?? ''}
                                    onChange={(e) => setBirthHour(e.target.value === '' ? null : Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                >
                                    {hourOptions.map((opt) => (
                                        <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <button
                                onClick={goNext}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                다음 →
                            </button>
                            {!birthDate && (
                                <button
                                    onClick={goNext}
                                    className="w-full text-gray-500 hover:text-gray-700 py-2"
                                >
                                    건너뛰기
                                </button>
                            )}
                        </div>

                        {birthDate && (
                            <p className="text-center text-sm text-indigo-600 mt-4">
                                ✓ 사주가 이름 추천에 반영됩니다
                            </p>
                        )}
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
                        <p className="text-gray-600 mb-2 text-center">
                            총 <span className="font-bold text-indigo-600">{sortedResults.length}개</span>의 이름을 찾았습니다
                        </p>
                        <p className="text-sm text-gray-400 mb-8 text-center">
                            {selectedStory?.storyKeyword || '특별한'}의 기운 + {selectedVibe?.vibeKeyword || '아름다운'} 풍경
                            {birthDate && ' + 사주 분석'}
                        </p>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-gray-500">이름을 찾고 있습니다...</p>
                            </div>
                        ) : (
                            <>
                                {/* 카드 표시 */}
                                {sortedResults.length > 0 && (
                                    <div className="mb-6">
                                        {unlockedIndices.has(currentCardIndex) ? (
                                            <UnlockedNameCard
                                                name={sortedResults[currentCardIndex]}
                                                rank={currentCardIndex + 1}
                                                onViewReport={() => setSelectedReportName(sortedResults[currentCardIndex])}
                                            />
                                        ) : (
                                            <LockedNameCard
                                                rank={currentCardIndex + 1}
                                                onUnlock={() => setShowPaymentModal(true)}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* 카드 네비게이션 */}
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <button
                                        onClick={goPrevCard}
                                        disabled={currentCardIndex === 0}
                                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        ◀
                                    </button>
                                    <div className="text-sm text-gray-500">
                                        {currentCardIndex + 1} / {sortedResults.length}
                                    </div>
                                    <button
                                        onClick={goNextCard}
                                        disabled={currentCardIndex === sortedResults.length - 1}
                                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        ▶
                                    </button>
                                </div>

                                {/* 잠금 해제 상태 */}
                                <div className="text-center mb-6">
                                    <span className="text-sm text-gray-500">
                                        🔓 {unlockedIndices.size}개 열람 가능 / 🔒 {sortedResults.length - unlockedIndices.size}개 잠김
                                    </span>
                                </div>

                                {/* 더 열기 버튼 */}
                                {unlockedIndices.size < sortedResults.length && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                    >
                                        더 많은 이름 보기 →
                                    </button>
                                )}

                                {/* 다시하기 */}
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
                                        setUnlockedIndices(new Set([1]));
                                        setCurrentCardIndex(0);
                                    }}
                                    className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700"
                                >
                                    처음부터 다시 하기
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                    <PaymentModal
                        totalCount={sortedResults.length}
                        unlockedCount={unlockedIndices.size}
                        onSelectPackage={handlePayment}
                        onClose={() => setShowPaymentModal(false)}
                    />
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
