/**
 * Erumi Design System - Dialog Component
 * Modal dialog with customizable content and bottom button
 */
import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { View, Modal, StyleSheet, ViewStyle, Pressable, Animated, Dimensions, Platform, Easing } from 'react-native';
import { colors, space, radius } from '../tokens';
import { Button } from './Button';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// =============================================================================
// Types
// =============================================================================

export interface DialogProps {
    /** Whether the dialog is visible */
    visible: boolean;
    /** Called when dialog should close */
    onClose?: () => void;
    /** Called when confirm button is pressed */
    onConfirm?: () => void;
    /** Show bottom button bar */
    showBottomBar?: boolean;
    /** Confirm button text */
    confirmText?: string;
    /** Dialog content (DialogItem or custom content) */
    children: React.ReactNode;
    /** Custom style for content wrapper */
    contentStyle?: ViewStyle;
}

// =============================================================================
// Dialog Component
// =============================================================================

export const Dialog: React.FC<DialogProps> = ({
    visible,
    onClose,
    onConfirm,
    showBottomBar = true,
    confirmText = '선택',
    children,
    contentStyle,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // visible prop 변경 감지
    useEffect(() => {
        if (visible) {
            setModalVisible(true);
        } else if (modalVisible) {
            // 닫기 애니메이션 후 Modal 숨기기
            const duration = 150; // 220 → 150 (더 빠르게)
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setModalVisible(false);
            });
        }
    }, [visible]);

    // Modal이 화면에 표시된 후 애니메이션 시작
    const handleShow = () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(SCREEN_HEIGHT);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250, // 빠르게 올라오도록
                easing: Easing.out(Easing.cubic), // 빠르게 시작, 천천히 끝남
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleClose = () => {
        onClose?.();
    };

    const handleConfirm = () => {
        onConfirm?.();
        onClose?.();
    };

    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            onShow={handleShow}
        >
            {/* Backdrop with fade */}
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            </Animated.View>

            {/* Dialog Container with slide */}
            <Animated.View style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}>
                {/* Content Wrapper */}
                <View style={[styles.contentWrapper, contentStyle]}>
                    {children}
                </View>

                {/* Button Wrapper */}
                {showBottomBar && (
                    <View style={styles.buttonWrapper}>
                        <Button
                            variant="primary"
                            size="large"
                            onPress={handleConfirm}
                            style={styles.confirmButton}
                        >
                            {confirmText}
                        </Button>
                    </View>
                )}

                {/* Home Indicator Space (iOS only) */}
                {Platform.OS === 'ios' && <View style={styles.homeIndicator} />}
            </Animated.View>
        </Modal>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.primitives.sand[50], // #FCF8F0
        borderTopLeftRadius: radius[600], // 24
        borderTopRightRadius: radius[600], // 24
        overflow: 'hidden',
    },
    contentWrapper: {
        padding: space[400], // 16
    },
    buttonWrapper: {
        paddingVertical: space[300], // 12
        paddingHorizontal: space[400], // 16
    },
    confirmButton: {
        width: '100%',
    },
    homeIndicator: {
        height: 34, // iOS Home Indicator space
        paddingHorizontal: 10,
    },
});

export default Dialog;
