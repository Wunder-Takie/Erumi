import { useState } from 'react';

interface SajuStepProps {
    onNext: (birthDate: string, birthHour: number | null) => void;
    onSkip: () => void;
}

const HOUR_OPTIONS = [
    { value: null, label: '⏰ 시간을 모르겠어요' },
    { value: 0, label: '子時 (밤 11시~새벽 1시)' },
    { value: 2, label: '丑時 (새벽 1시~3시)' },
    { value: 4, label: '寅時 (새벽 3시~5시)' },
    { value: 6, label: '卯時 (새벽 5시~7시)' },
    { value: 8, label: '辰時 (오전 7시~9시)' },
    { value: 10, label: '巳時 (오전 9시~11시)' },
    { value: 12, label: '午時 (오전 11시~오후 1시)' },
    { value: 14, label: '未時 (오후 1시~3시)' },
    { value: 16, label: '申時 (오후 3시~5시)' },
    { value: 18, label: '酉時 (오후 5시~7시)' },
    { value: 20, label: '戌時 (저녁 7시~9시)' },
    { value: 22, label: '亥時 (밤 9시~11시)' }
];

export function SajuStep({ onNext, onSkip }: SajuStepProps) {
    const [birthDate, setBirthDate] = useState('');
    const [birthHour, setBirthHour] = useState<number | null>(null);

    const handleSubmit = () => {
        if (birthDate) {
            onNext(birthDate, birthHour);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
            {/* Header */}
            <div className="text-center mb-8 pt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full text-amber-400 text-sm mb-4">
                    <span>✨</span>
                    <span>프리미엄</span>
                </div>
                <h2 className="text-2xl font-light mt-4 mb-2">
                    아이의 생년월일시를 알려주세요
                </h2>
                <p className="text-slate-400 text-sm">
                    사주를 분석하여 더 정확한 이름을 추천해드려요
                </p>
            </div>

            {/* Form */}
            <div className="flex-1 max-w-md mx-auto w-full">
                {/* Birth Date */}
                <div className="mb-6">
                    <label className="block text-slate-400 text-sm mb-3">
                        생년월일
                    </label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        aria-label="생년월일 입력"
                        title="생년월일을 선택하세요"
                        className="
              w-full px-6 py-4 
              bg-slate-800/50 
              border border-slate-700 
              rounded-2xl 
              text-lg text-center
              focus:outline-none focus:border-amber-500
              transition-colors
              [color-scheme:dark]
            "
                    />
                </div>

                {/* Birth Hour */}
                <div className="mb-8">
                    <label className="block text-slate-400 text-sm mb-3">
                        태어난 시간 (선택)
                    </label>
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {HOUR_OPTIONS.map((option) => (
                            <button
                                key={option.label}
                                onClick={() => setBirthHour(option.value)}
                                className={`
                  py-3 px-4 rounded-xl text-sm text-left
                  transition-all duration-200
                  ${birthHour === option.value
                                        ? 'bg-amber-500 text-slate-900'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                                    }
                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 pb-4 max-w-md mx-auto w-full space-y-3">
                <button
                    onClick={handleSubmit}
                    disabled={!birthDate}
                    className="
            w-full py-4 
            bg-amber-500 text-slate-900 
            rounded-full 
            font-medium text-lg
            hover:bg-amber-400 
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
                >
                    사주 분석하기
                </button>
                <button
                    onClick={onSkip}
                    className="
            w-full py-3 
            text-slate-400 
            rounded-full 
            font-medium
            hover:text-white 
            transition-colors
          "
                >
                    건너뛰기
                </button>
            </div>
        </div>
    );
}
