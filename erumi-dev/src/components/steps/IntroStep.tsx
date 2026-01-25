// No React import needed with modern JSX transform

interface IntroStepProps {
    onStart: () => void;
}

export function IntroStep({ onStart }: IntroStepProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
            <div className="text-center max-w-md">
                {/* Logo/Icon */}
                <div className="text-6xl mb-8 animate-pulse">✨</div>

                {/* Headline */}
                <h1 className="text-3xl font-light mb-4 tracking-wide">
                    아이의 첫 번째 브랜드를
                    <br />
                    <span className="font-semibold">만듭니다</span>
                </h1>

                {/* Subline */}
                <p className="text-slate-400 text-lg mb-12">
                    이름은 평생을 함께할 첫 번째 선물
                </p>

                {/* CTA Button */}
                <button
                    onClick={onStart}
                    className="
            px-12 py-4 
            bg-white text-slate-900 
            rounded-full 
            font-medium text-lg
            hover:bg-slate-100 
            transition-all duration-300
            hover:scale-105
            shadow-lg shadow-white/10
          "
                >
                    시작하기
                </button>
            </div>

            {/* Bottom hint */}
            <p className="absolute bottom-8 text-slate-500 text-sm">
                약 2분 소요
            </p>
        </div>
    );
}
