/**
 * useNameGeneration.ts
 * 이름 생성 React Hook - 비동기 상태 관리
 * 
 * 전역 싱글톤 상태 - 모든 컴포넌트가 동일한 상태 공유
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { namingService, BatchResult, saveViewedNames, startNewSession } from '../services';
import { WizardData } from '../services/wizardDataMapper';
import { BatchNameCandidate } from 'erumi-core';

// AsyncStorage 키
const FREE_TRIAL_USED_KEY = '@erumi/free_trial_used';

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

// AsyncStorage에서 무료 체험 상태 로드 (앱 시작 시 1회)
let hasLoadedFromStorage = false;
async function loadFreeTrialStatus() {
    if (hasLoadedFromStorage) return;
    hasLoadedFromStorage = true;

    try {
        const value = await AsyncStorage.getItem(FREE_TRIAL_USED_KEY);
        if (value === 'true') {
            globalState = { ...globalState, isUnlocked: true };
            notifyListeners();
            console.log('[useNameGeneration] Free trial already used (loaded from storage)');
        }
    } catch (e) {
        console.error('[useNameGeneration] Failed to load free trial status:', e);
    }
}

// AsyncStorage에 무료 체험 사용 상태 저장
async function saveFreeTrialUsed() {
    try {
        await AsyncStorage.setItem(FREE_TRIAL_USED_KEY, 'true');
        console.log('[useNameGeneration] Free trial status saved to storage');
    } catch (e) {
        console.error('[useNameGeneration] Failed to save free trial status:', e);
    }
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

    // 앱 시작 시 AsyncStorage에서 무료 체험 상태 로드
    useEffect(() => {
        loadFreeTrialStatus();
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

            // 첫 배치 가져오기 (무료 미사용=1개, 이미 사용=5개)
            const batchCount = globalState.isUnlocked ? 5 : 1;
            const result = await namingService.getFirstBatch(batchCount);

            // 5개 요청했는데 5개 미만이면 isExhausted 처리
            const shouldMarkExhausted = batchCount === 5 && result.names.length < 5;

            // 조회한 이름 저장 (마이페이지용)
            if (result.names.length > 0) {
                saveViewedNames(result.names, globalSurname);
            }

            setGlobalState(prev => ({
                ...prev,
                isLoading: false,
                names: result.names,
                hasMore: shouldMarkExhausted ? false : result.hasMore,
                totalCandidates: namingService.getTotalCandidates(),
                isExhausted: shouldMarkExhausted ? true : result.isExhausted,
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

            // 5개 미만이면 해당 배치 버리고 isExhausted 처리 (이전 이름 유지)
            if (result.names.length < 5) {
                setGlobalState(prev => ({
                    ...prev,
                    isLoadingMore: false,
                    // names 유지 (이전 배치)
                    hasMore: false,
                    isExhausted: true,
                }));
                return;
            }

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
        // isUnlocked는 유지 (무료 체험 소진 상태 보존)
        const preserveUnlocked = globalState.isUnlocked;
        globalState = {
            isLoading: false,
            isLoadingMore: false,
            error: null,
            names: [],
            hasMore: false,
            totalCandidates: 0,
            isExhausted: false,
            isUnlocked: preserveUnlocked,
        };
        globalSurname = '';
        notifyListeners();
    }, []);

    /**
     * 잠금 해제 (무료 1회 사용) - AsyncStorage에 영구 저장
     */
    const unlock = useCallback(() => {
        setGlobalState(prev => ({
            ...prev,
            isUnlocked: true,
        }));
        // AsyncStorage에 저장 (비동기)
        saveFreeTrialUsed();
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
