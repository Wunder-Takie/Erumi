import { useState } from 'react';

interface BasicsStepProps {
    onNext: (surname: string, gender: 'M' | 'F' | null) => void;
}

export function BasicsStep({ onNext }: BasicsStepProps) {
    const [surname, setSurname] = useState('김');
    const [gender, setGender] = useState<'M' | 'F' | null>(null);

    const handleSubmit = () => {
        if (surname.trim()) {
            onNext(surname.trim(), gender);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
            <div className="w-full max-w-md">
                {/* Step indicator */}
                <div className="text-center mb-8">
                    <span className="text-slate-500 text-sm">Step 1 of 4</span>
                </div>

                {/* Surname input */}
                <div className="mb-8">
                    <label className="block text-slate-400 text-sm mb-3">
                        아이의 성씨를 알려주세요
                    </label>
                    <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="김"
                        className="
              w-full px-6 py-4 
              bg-slate-800/50 
              border border-slate-700 
              rounded-2xl 
              text-2xl text-center font-medium
              focus:outline-none focus:border-slate-500
              transition-colors
            "
                        maxLength={2}
                    />
                </div>

                {/* Gender selection */}
                <div className="mb-12">
                    <label className="block text-slate-400 text-sm mb-3">
                        성별
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'M' as const, label: '👦 남아' },
                            { value: 'F' as const, label: '👧 여아' },
                            { value: null, label: '✨ 아직 몰라요' }
                        ].map((option) => (
                            <button
                                key={option.label}
                                onClick={() => setGender(option.value)}
                                className={`
                  py-4 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${gender === option.value
                                        ? 'bg-white text-slate-900'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                                    }
                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Next button */}
                <button
                    onClick={handleSubmit}
                    disabled={!surname.trim()}
                    className="
            w-full py-4 
            bg-white text-slate-900 
            rounded-full 
            font-medium text-lg
            hover:bg-slate-100 
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
                >
                    다음
                </button>
            </div>
        </div>
    );
}
