import { useEffect, useState } from 'react';

interface LoadingStepProps {
    storyKeyword: string;
    vibeKeyword: string;
    onComplete: () => void;
}

export function LoadingStep({ storyKeyword, vibeKeyword, onComplete }: LoadingStepProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animate progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 500);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [onComplete]);

    const message = storyKeyword && vibeKeyword
        ? `${storyKeyword}의 기운과 ${vibeKeyword}의 풍경을 담는 중...`
        : '특별한 이름을 찾는 중...';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
            <div className="text-center max-w-md">
                {/* Animated icon */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                    <div
                        className="absolute inset-0 rounded-full border-4 border-white transition-all duration-100"
                        style={{
                            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(progress * Math.PI / 50)}% ${50 - 50 * Math.cos(progress * Math.PI / 50)}%, 50% 50%)`
                        }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl animate-pulse">✨</span>
                    </div>
                </div>

                {/* Message */}
                <p className="text-lg text-slate-300 mb-4 animate-pulse">
                    {message}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Progress text */}
                <p className="text-slate-500 text-sm mt-4">
                    {progress}%
                </p>
            </div>
        </div>
    );
}
