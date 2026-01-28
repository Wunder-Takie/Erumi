/**
 * LoadingStep - 이름 생성 로딩 스텝 (위자드용)
 * 신비로운 별이 반짝이는 배경 애니메이션 + 로딩 텍스트
 * 
 * Figma Node: 327-2936
 * 
 * Uses: react-native-skia + react-native-reanimated for high quality effects
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withDelay,
    withSequence,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';
import {
    Canvas,
    Circle,
    LinearGradient,
    vec,
    Blur,
    Group,
    Paint,
    RadialGradient,
    Rect,
    Path,
    Skia,
    FractalNoise,
    Line,
} from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { space } from '../../../design-system';
import { WizardStepProps } from '../WizardContainer';

// 별 개수
const STAR_COUNT = 50;

// 별 데이터 타입
interface Star {
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    brightness: number;
    minOpacity: number; // 최소 불투명도 (완전히 꺼지지 않도록)
}

// 별 생성 함수 (균등 분포)
const generateStars = (width: number, height: number, count: number): Star[] => {
    // 그리드 기반 균등 분포
    const cols = Math.ceil(Math.sqrt(count * (width / height)));
    const rows = Math.ceil(count / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        stars.push({
            // 셀 내에서 랜덤 위치 (약간의 변화)
            x: col * cellWidth + Math.random() * cellWidth,
            y: row * cellHeight + Math.random() * cellHeight,
            size: Math.random() * 0.8 + 0.4, // 0.4-1.2px
            delay: Math.random() * 3000, // 0-3초 초기 딜레이 (시차를 위해)
            duration: 50, // 통일 (사용 안 함)
            brightness: 1.0, // 최대 밝기 통일
            minOpacity: 0, // 완전히 꺼짐 통일
        });
    }
    return stars;
};

const TwinklingStar: React.FC<{ star: Star }> = ({ star }) => {
    const opacity = useSharedValue(0); // 처음엔 완전히 꺼진 상태
    // 각 별마다 랜덤 인터벌 (3-7초)
    const blinkInterval = Math.random() * 4000 + 3000;

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        // 깜빡임 애니메이션 (2초 사라지는 디졸브 효과)
        const blink = () => {
            // 0.5초 동안 밝아짐
            opacity.value = withTiming(star.brightness, { duration: 500 });
            // 0.5초 후 2초 동안 천천히 꺼짐
            setTimeout(() => {
                opacity.value = withTiming(0, { duration: 2000 });
            }, 500);
        };

        // 초기 딜레이 후 시작
        const startTimeout = setTimeout(() => {
            blink(); // 첫 깜빡임
            // 각 별마다 랜덤 인터벌로 반복
            intervalId = setInterval(blink, blinkInterval);
        }, star.delay);

        return () => {
            clearTimeout(startTimeout);
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    const animatedOpacity = useDerivedValue(() => opacity.value * 0.8);

    // 4각 별 모양 Path 생성
    const starPath = useMemo(() => {
        const path = Skia.Path.Make();
        const size = star.size * 4; // 별 크기 (더 길게)
        const innerSize = size * 0.12; // 내부 크기 (더 날카롭게)

        // 4각 별: 상하좌우 첨탑 + 대각선 내부
        path.moveTo(star.x, star.y - size); // 상단
        path.lineTo(star.x + innerSize, star.y - innerSize);
        path.lineTo(star.x + size, star.y); // 우측
        path.lineTo(star.x + innerSize, star.y + innerSize);
        path.lineTo(star.x, star.y + size); // 하단
        path.lineTo(star.x - innerSize, star.y + innerSize);
        path.lineTo(star.x - size, star.y); // 좌측
        path.lineTo(star.x - innerSize, star.y - innerSize);
        path.close();

        return path;
    }, [star.x, star.y, star.size]);

    return (
        <Path
            path={starPath}
            color="white"
            opacity={animatedOpacity}
        />
    );
};

// 유성 (슈팅스타) 컴포넌트 - requestAnimationFrame 사용
const ShootingStar: React.FC<{ width: number; height: number; id: number }> = ({ width, height, id }) => {
    const [meteor, setMeteor] = useState({ x: 0, y: 0, tailX: 0, tailY: 0, visible: false, opacity: 1 });

    useEffect(() => {
        const speed = 100; // 이동 거리 (200 → 100으로 절반)
        const angle = 0.85;
        let animFrame = 0;
        let rafId: number | null = null;
        let startX = 0;
        let startY = 0;
        let timeoutId: NodeJS.Timeout;

        const animate = () => {
            animFrame += 0.022; // 조금 느리게 (0.03 → 0.022)

            if (animFrame >= 1.5) { // 더 길게 유지 (1.2 → 1.5)
                setMeteor(prev => ({ ...prev, visible: false, opacity: 0 }));
                timeoutId = setTimeout(startNewMeteor, 4000 + Math.random() * 6000);
                return;
            }

            const headProgress = Math.min(animFrame, 1);
            const tailProgress = Math.max(0, animFrame - 0.25) / 0.75;

            // 부드러운 페이드 아웃 (animFrame 0.8 이후부터)
            let opacity = 0.6; // 기본 60%
            if (animFrame > 0.8) {
                opacity = Math.max(0, 0.6 * (1 - (animFrame - 0.8) / 0.7));
            }

            setMeteor({
                x: startX + headProgress * speed,
                y: startY + headProgress * speed * angle,
                tailX: startX + Math.min(tailProgress, 1) * speed,
                tailY: startY + Math.min(tailProgress, 1) * speed * angle,
                visible: true,
                opacity
            });

            rafId = requestAnimationFrame(animate);
        };

        const startNewMeteor = () => {
            startX = width * Math.random() * 0.95; // 왼쪽~오른쪽 전체 (0%~95%)
            startY = height * (0.28 + Math.random() * 0.1); // 로딩텍스트 ~100px 위 (28%~38%)
            animFrame = 0;
            animate();
        };

        timeoutId = setTimeout(startNewMeteor, id * 1500 + Math.random() * 2000);

        return () => {
            clearTimeout(timeoutId);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [width, height, id]);

    if (!meteor.visible) return null;

    const meteorPath = Skia.Path.Make();
    meteorPath.moveTo(meteor.tailX, meteor.tailY);
    meteorPath.lineTo(meteor.x, meteor.y);

    return (
        <Group opacity={meteor.opacity}>
            <Path path={meteorPath} style="stroke" strokeWidth={1.5}>
                <LinearGradient
                    start={vec(meteor.tailX, meteor.tailY)}
                    end={vec(meteor.x, meteor.y)}
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.6)']}
                />
            </Path>
            <Circle cx={meteor.x} cy={meteor.y} r={1} color="rgba(255,255,255,0.6)" />
        </Group>
    );
};

// 오로라 효과 컴포넌트 (애니메이션 색상 변화)
const AuroraEffect: React.FC<{ width: number; height: number }> = ({ width, height }) => {
    // React state로 색상 애니메이션 (Skia에서 제대로 렌더링되도록)
    const [progress, setProgress] = useState({ p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 });
    const [grainSeed, setGrainSeed] = useState(42);

    useEffect(() => {
        let frame = 0;
        const interval = setInterval(() => {
            frame += 1;
            setProgress({
                p1: (Math.sin(frame * 0.028) + 1) / 2,
                p2: (Math.sin(frame * 0.022) + 1) / 2,
                p3: (Math.sin(frame * 0.025) + 1) / 2,
                p4: (Math.sin(frame * 0.02) + 1) / 2,
                p5: (Math.sin(frame * 0.018) + 1) / 2,
            });
            // 그레인 지글지글 애니메이션 (4프레임마다 seed 변경)
            if (frame % 4 === 0) {
                setGrainSeed(Math.floor(Math.random() * 1000));
            }
        }, 30); // ~33fps
        return () => clearInterval(interval);
    }, []);

    // 타원형 블롭 Path 생성 함수 (회전 지원)
    const createEllipsePath = (cx: number, cy: number, radiusX: number, radiusY: number, rotation = 0) => {
        const path = Skia.Path.Make();
        path.addOval({
            x: -radiusX,
            y: -radiusY,
            width: radiusX * 2,
            height: radiusY * 2
        });
        // 회전 및 위치 이동
        const matrix = Skia.Matrix();
        matrix.translate(cx, cy);
        matrix.rotate(rotation);
        path.transform(matrix);
        return path;
    };

    // 타원형 블롭 Paths 생성 (이미지처럼 겹치는 영역이 잎사귀 형태가 되도록)
    const blobPath1 = useMemo(() => createEllipsePath(width * 0.1, height * 0.15, width * 0.55, height * 0.35), [width, height]);
    const blobPath2 = useMemo(() => createEllipsePath(width * 0.9, height * 0.2, width * 0.5, height * 0.35), [width, height]);
    const blobPath3 = useMemo(() => createEllipsePath(width * 0.15, height * 0.85, width * 0.5, height * 0.35), [width, height]);
    const blobPath4 = useMemo(() => createEllipsePath(width * 0.85, height * 0.8, width * 0.55, height * 0.4), [width, height]);
    const blobPath5 = useMemo(() => createEllipsePath(width * 0.5, height * 0.5, width * 0.30, width * 0.25, 45), [width, height]);

    // HSL to RGB 변환 함수
    const hslToRgb = (h: number, s: number, l: number) => {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    };

    // 애니메이션 색상 - 컬러휠 전체 회전 (0~360도)
    const hue1 = progress.p1 * 360; // 0 → 360
    const hue2 = (progress.p2 * 360 + 60) % 360; // 60도 오프셋
    const hue3 = (progress.p3 * 360 + 120) % 360; // 120도 오프셋
    const hue4 = (progress.p4 * 360 + 180) % 360; // 180도 오프셋
    const hue5 = (progress.p5 * 360 + 240) % 360; // 240도 오프셋

    const rgb1 = hslToRgb(hue1, 1, 0.5); // 채도 100%, 밝기 50%
    const rgb2 = hslToRgb(hue2, 1, 0.5);
    const rgb3 = hslToRgb(hue3, 1, 0.5);
    const rgb4 = hslToRgb(hue4, 1, 0.5);
    const rgb5 = hslToRgb(hue5, 1, 0.5);

    const colors1 = [
        `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 1)`,
        `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.5)`,
        'rgba(3, 3, 8, 1)'
    ];

    const colors2 = [
        `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 1)`,
        `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.5)`,
        'rgba(3, 3, 8, 1)'
    ];

    const colors3 = [
        `rgba(${rgb3.r}, ${rgb3.g}, ${rgb3.b}, 1)`,
        `rgba(${rgb3.r}, ${rgb3.g}, ${rgb3.b}, 0.5)`,
        'rgba(3, 3, 8, 1)'
    ];

    const colors4 = [
        `rgba(${rgb4.r}, ${rgb4.g}, ${rgb4.b}, 1)`,
        `rgba(${rgb4.r}, ${rgb4.g}, ${rgb4.b}, 0.5)`,
        'rgba(3, 3, 8, 1)'
    ];

    const colors5 = [
        `rgba(${rgb5.r}, ${rgb5.g}, ${rgb5.b}, 1)`,
        `rgba(${rgb5.r}, ${rgb5.g}, ${rgb5.b}, 0.5)`,
        'rgba(3, 3, 8, 1)'
    ];

    return (
        <Group>
            {/* 기본 배경 그라데이션 (검정 방지) */}
            <Rect x={0} y={0} width={width} height={height}>
                <RadialGradient
                    c={vec(width * 0.5, height * 0.5)}
                    r={width}
                    colors={['rgba(40, 20, 80, 0.5)', 'rgba(20, 10, 40, 0.5)', 'rgba(0, 0, 0, 0.3)']}
                />
            </Rect>

            {/* 블롭 1: 왼쪽 상단 - 왼쪽위→중앙 방향 */}
            <Path path={blobPath1}>
                <LinearGradient
                    start={vec(0, 0)}
                    end={vec(width * 0.6, height * 0.6)}
                    colors={colors1}
                />
                <Blur blur={40} />
            </Path>

            {/* 블롭 2: 오른쪽 상단 - 오른쪽위→중앙 방향 */}
            <Path path={blobPath2}>
                <LinearGradient
                    start={vec(width, 0)}
                    end={vec(width * 0.4, height * 0.6)}
                    colors={colors2}
                />
                <Blur blur={40} />
            </Path>

            {/* 블롭 3: 왼쪽 하단 - 왼쪽아래→중앙 방향 */}
            <Path path={blobPath3}>
                <LinearGradient
                    start={vec(0, height)}
                    end={vec(width * 0.6, height * 0.4)}
                    colors={colors3}
                />
                <Blur blur={40} />
            </Path>

            {/* 블롭 4: 오른쪽 하단 - 오른쪽아래→중앙 방향 */}
            <Path path={blobPath4}>
                <LinearGradient
                    start={vec(width, height)}
                    end={vec(width * 0.4, height * 0.4)}
                    colors={colors4}
                />
                <Blur blur={40} />
            </Path>

            {/* 블롭 5: 중앙 - 위→아래 방향 */}
            <Path path={blobPath5}>
                <LinearGradient
                    start={vec(width * 0.5, height * 0.2)}
                    end={vec(width * 0.5, height * 0.8)}
                    colors={colors5}
                />
                <Blur blur={35} />
            </Path>
            {/* 필름 그레인 효과 (animated) */}
            <Rect x={0} y={0} width={width} height={height} opacity={0.85}>
                <FractalNoise
                    freqX={0.6}
                    freqY={0.6}
                    octaves={4}
                    seed={grainSeed}
                    tileWidth={256}
                    tileHeight={256}
                />
            </Rect>

            {/* 비네팅 1 - 왼쪽 위 영역 (더 랜덤하게) */}
            <Rect x={0} y={0} width={width} height={height}>
                <RadialGradient
                    c={vec(
                        width * (0.2 + progress.p1 * 0.3 + progress.p3 * 0.1),
                        height * (0.15 + progress.p2 * 0.3 + progress.p5 * 0.1)
                    )}
                    r={Math.min(width, height) * (0.2 + progress.p3 * 0.25 + progress.p4 * 0.1)}
                    colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.8)']}
                />
            </Rect>

            {/* 비네팅 2 - 오른쪽 아래 영역 (더 랜덤하게) */}
            <Rect x={0} y={0} width={width} height={height}>
                <RadialGradient
                    c={vec(
                        width * (0.5 + progress.p4 * 0.3 + progress.p2 * 0.1),
                        height * (0.5 + progress.p5 * 0.3 + progress.p1 * 0.1)
                    )}
                    r={Math.min(width, height) * (0.25 + progress.p2 * 0.2 + progress.p5 * 0.1)}
                    colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)']}
                />
            </Rect>

        </Group>
    );
};

// 메인 로딩 화면 컴포넌트
export const LoadingStep: React.FC<WizardStepProps> = ({
    goNext,
    data,
    updateData,
}) => {
    const { width, height } = useWindowDimensions();

    // 별 데이터 생성 (한 번만)
    const stars = useMemo(() => generateStars(width, height, STAR_COUNT), [width, height]);

    // 로딩 메시지 상태
    const [messageIndex, setMessageIndex] = useState(0);

    const loadingMessages = [
        '타고난 기운을 살피고 있어요.',
        '당신의 바람을 이름에 담는 중입니다.',
        '세상에 하나뿐인 이름을 만들고 있어요.',
    ];

    // 메시지 회전 (4초마다)
    useEffect(() => {
        const messageInterval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % loadingMessages.length);
        }, 4000);
        return () => clearInterval(messageInterval);
    }, []);

    // 12초 후 자동으로 결과 화면으로 이동 (3개 메시지 * 4초)
    useEffect(() => {
        const timer = setTimeout(() => goNext(), 12000);
        return () => clearTimeout(timer);
    }, [goNext]);

    return (
        <View style={styles.container}>
            {/* Skia Canvas - 배경 + 오로라 + 별 */}
            <Canvas style={StyleSheet.absoluteFill}>
                {/* 더 어두운 그라데이션 배경 */}
                <Rect x={0} y={0} width={width} height={height}>
                    <LinearGradient
                        start={vec(0, 0)}
                        end={vec(width, height)}
                        colors={['#010108', '#050512', '#071013', '#071013']}
                    />
                </Rect>

                {/* 은은한 오로라 효과 */}
                <AuroraEffect width={width} height={height} />

                {/* 반짝이는 별들 (가장 위 레이어) */}
                <Group>
                    {stars.map((star, index) => (
                        <TwinklingStar key={index} star={star} />
                    ))}
                    {/* 유성 2개 */}
                    <ShootingStar width={width} height={height} id={0} />
                    <ShootingStar width={width} height={height} id={1} />
                </Group>
            </Canvas>

            {/* 로딩 콘텐츠 */}
            <View style={styles.contentContainer}>
                <View style={styles.loadingAnimation}>
                    {/* 로딩 이미지 */}
                    <View style={styles.imageWrapper}>
                        <Image
                            source={require('../../../assets/images/vibe/star_shine.png')}
                            style={styles.image}
                            contentFit="cover"
                        />
                    </View>

                    {/* 로딩 텍스트 */}
                    <Text style={styles.loadingText}>
                        {loadingMessages[messageIndex]}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050510',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingAnimation: {
        alignItems: 'center',
        gap: space[400], // 16
    },
    imageWrapper: {
        width: 64,
        height: 80,
        borderRadius: 16,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14,
        lineHeight: 16,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    loadingDots: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14,
        lineHeight: 16,
        color: '#FFFFFF',
        minWidth: 20,
    },
});

export default LoadingStep;
