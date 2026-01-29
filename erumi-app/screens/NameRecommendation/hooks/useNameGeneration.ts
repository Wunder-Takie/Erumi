/**
 * useNameGeneration.ts
 * 이름 생성 React Hook - 비동기 상태 관리
 * 
 * 전역 싱글톤 상태 - 모든 컴포넌트가 동일한 상태 공유
 */

import { useState, useCallback, useEffect } from 'react';
import { namingService, BatchResult, saveViewedNames, startNewSession } from '../services';
import { WizardData } from '../services/wizardDataMapper';
import { BatchNameCandidate } from 'erumi-core';

// ==========================================
// Types
// ==========================================

export interface UseNameGenerationState {
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    names: BatchNameCandidate[];
    hasMore: boolean;
    totalCandidates: number;
    isExhausted: boolean;
    isUnlocked: boolean; // 무료 1회 사용 여부
}

export interface UseNameGenerationActions {
    generate: (wizardData: WizardData) => Promise<void>;
    loadMore: () => Promise<void>;
    reset: () => void;
    unlock: () => void;
}

// ==========================================
// Global State (싱글톤 - 모든 컴포넌트 공유)
// ==========================================

let globalState: UseNameGenerationState = {
    isLoading: false,
    isLoadingMore: false,
    error: null,
    names: [],
    hasMore: false,
    totalCandidates: 0,
    isExhausted: false,
    isUnlocked: false, // 초기에는 잠금
};

let globalSurname = '';
const listeners: Set<() => void> = new Set();

function notifyListeners() {
    listeners.forEach(listener => listener());
}

function setGlobalState(updater: (prev: UseNameGenerationState) => UseNameGenerationState) {
    globalState = updater(globalState);
    notifyListeners();
}

// ==========================================
// Hook
// ==========================================

export function useNameGeneration(): UseNameGenerationState & UseNameGenerationActions {
    const [, forceUpdate] = useState({});

    // 리스너 등록 - 상태 변경 시 리렌더링
    useEffect(() => {
        const listener = () => forceUpdate({});
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, []);

    /**
     * 이름 생성 시작
     */
    const generate = useCallback(async (wizardData: WizardData) => {
        // 새 세션 시작 및 성씨 저장
        startNewSession();
        globalSurname = wizardData.surname?.hangul || '';

        setGlobalState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            names: [],
        }));

        try {
            // 엔진 초기화
            await namingService.initialize(wizardData);

            // 첫 배치 가져오기 (무료 1개)
            const result = await namingService.getFirstBatch();

            // 조회한 이름 저장 (마이페이지용)
            if (result.names.length > 0) {
                saveViewedNames(result.names, globalSurname);
            }

            setGlobalState(prev => ({
                ...prev,
                isLoading: false,
                names: result.names,
                hasMore: result.hasMore,
                totalCandidates: namingService.getTotalCandidates(),
                isExhausted: result.isExhausted,
            }));
        } catch (error) {
            setGlobalState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : '이름 생성 중 오류가 발생했습니다',
            }));
        }
    }, []);

    /**
     * 더 많은 이름 로드
     */
    const loadMore = useCallback(async () => {
        if (globalState.isLoadingMore || globalState.isExhausted) {
            return;
        }

        setGlobalState(prev => ({
            ...prev,
            isLoadingMore: true,
        }));

        try {
            // 기존 이름을 먼저 저장 (마이페이지용)
            if (globalState.names.length > 0) {
                saveViewedNames(globalState.names, globalSurname);
            }

            const result = await namingService.getNextBatch();

            // 새 이름도 저장 (마이페이지용)
            if (result.names.length > 0) {
                saveViewedNames(result.names, globalSurname);
            }

            // 기존 이름을 교체 (누적 X)
            setGlobalState(prev => ({
                ...prev,
                isLoadingMore: false,
                names: result.names,  // 누적이 아닌 교체
                hasMore: result.hasMore,
                isExhausted: result.isExhausted,
            }));
        } catch (error) {
            setGlobalState(prev => ({
                ...prev,
                isLoadingMore: false,
                error: error instanceof Error ? error.message : '추가 이름 로드 중 오류가 발생했습니다',
            }));
        }
    }, []);

    /**
     * 리셋
     */
    const reset = useCallback(() => {
        namingService.reset();
        globalState = {
            isLoading: false,
            isLoadingMore: false,
            error: null,
            names: [],
            hasMore: false,
            totalCandidates: 0,
            isExhausted: false,
            isUnlocked: false,
        };
        globalSurname = '';
        notifyListeners();
    }, []);

    /**
     * 잠금 해제 (무료 1회 사용)
     */
    const unlock = useCallback(() => {
        setGlobalState(prev => ({
            ...prev,
            isUnlocked: true,
        }));
    }, []);

    return {
        ...globalState,
        generate,
        loadMore,
        reset,
        unlock,
    };
}

export default useNameGeneration;
