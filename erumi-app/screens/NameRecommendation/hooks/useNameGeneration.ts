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

export interface SajuInfo {
    birthDate: Date;
    birthTime?: string;
}

export interface UseNameGenerationState {
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    names: BatchNameCandidate[];
    hasMore: boolean;
    totalCandidates: number;
    isExhausted: boolean;
    isUnlocked: boolean; // 무료 1회 사용 여부
    wasInterrupted: boolean; // 백그라운드 전환으로 인터럽트됨
    sajuInfo: SajuInfo | null; // 전역 사주 정보
}

export interface UseNameGenerationActions {
    generate: (wizardData: WizardData) => Promise<void>;
    loadMore: () => Promise<void>;
    reset: () => void;
    unlock: () => void;
    markInterrupted: () => void;  // 백그라운드 전환 시 호출
    retry: () => Promise<void>;   // 포그라운드 복귀 시 재시도
    devReset: () => void;         // 개발자용 완전 초기화 (isUnlocked 포함)
    updateSaju: (saju: SajuInfo) => void; // 사주 정보 업데이트
    getSajuInfo: () => SajuInfo | null;   // 사주 정보 조회
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
    wasInterrupted: false,
    sajuInfo: null, // 초기에는 사주 정보 없음
};

// 마지막 요청 정보 (재시도용)
let lastWizardData: WizardData | null = null;
let lastWasLoadMore = false;

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

// 🆕 전역 상태 초기화 함수 (HomeScreen에서 호출 가능)
export function resetAllNameGenerationState() {
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
        wasInterrupted: false,
        sajuInfo: null,
    };
    globalSurname = '';
    lastWizardData = null;
    lastWasLoadMore = false;
    hasLoadedFromStorage = false;
    console.log('[useNameGeneration] resetAllNameGenerationState: 전체 상태 초기화 완료');
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

    // 앱 시작 시 AsyncStorage에서 무료 체험 상태 로드
    useEffect(() => {
        loadFreeTrialStatus();
    }, []);

    /**
     * 이름 생성 시작
     */
    const generate = useCallback(async (wizardData: WizardData) => {
        // 재시도용 데이터 저장
        lastWizardData = wizardData;
        lastWasLoadMore = false;

        // 🆕 AsyncStorage에서 직접 확인하여 최신 상태 보장
        const freeTrialUsed = await AsyncStorage.getItem(FREE_TRIAL_USED_KEY);
        const actuallyUnlocked = freeTrialUsed === 'true';

        console.log('[useNameGeneration] FREE_TRIAL_USED_KEY:', FREE_TRIAL_USED_KEY);
        console.log('[useNameGeneration] freeTrialUsed from AsyncStorage:', freeTrialUsed);
        console.log('[useNameGeneration] actuallyUnlocked:', actuallyUnlocked);

        // 상태 동기화
        if (actuallyUnlocked && !globalState.isUnlocked) {
            globalState = { ...globalState, isUnlocked: true };
        }

        // 새 세션 시작 및 성씨 저장
        startNewSession();
        globalSurname = wizardData.surname?.hangul || '';

        setGlobalState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            names: [],
            sajuInfo: null,  // 🆕 새 세션 시작 시 이전 사주 초기화
        }));

        try {
            // 엔진 초기화
            await namingService.initialize(wizardData);

            // 첫 배치 가져오기 (무료 미사용=1개, 이미 사용=5개)
            const batchCount = actuallyUnlocked ? 5 : 1;
            console.log('[useNameGeneration] batchCount:', batchCount);
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
            // 백그라운드 인터럽트로 인한 에러는 무시 (retry에서 재시도)
            if (globalState.wasInterrupted) {
                console.log('[useNameGeneration] Error ignored due to background interrupt');
                return;
            }
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

        // 재시도용 플래그 저장
        lastWasLoadMore = true;

        setGlobalState(prev => ({
            ...prev,
            isLoadingMore: true,
        }));

        try {
            // 🆕 기존 이름은 이미 저장되어 있으므로 다시 저장하지 않음
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
            // 백그라운드 인터럽트로 인한 에러는 무시 (retry에서 재시도)
            if (globalState.wasInterrupted) {
                console.log('[useNameGeneration] LoadMore error ignored due to background interrupt');
                return;
            }
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
        // isUnlocked와 sajuInfo는 유지 (무료 체험 소진 상태 보존, 사주 정보 보존)
        const preserveUnlocked = globalState.isUnlocked;
        const preserveSaju = globalState.sajuInfo;
        globalState = {
            isLoading: false,
            isLoadingMore: false,
            error: null,
            names: [],
            hasMore: false,
            totalCandidates: 0,
            isExhausted: false,
            isUnlocked: preserveUnlocked,
            wasInterrupted: false,
            sajuInfo: preserveSaju,
        };
        globalSurname = '';
        lastWizardData = null;
        lastWasLoadMore = false;
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

    /**
     * 백그라운드 전환 시 호출 - 로딩 중이면 인터럽트 마킹
     */
    const markInterrupted = useCallback(() => {
        console.log('[useNameGeneration] markInterrupted called, state:', {
            isLoading: globalState.isLoading,
            isLoadingMore: globalState.isLoadingMore
        });
        if (globalState.isLoading || globalState.isLoadingMore) {
            console.log('[useNameGeneration] Marking as interrupted due to background');
            setGlobalState(prev => ({
                ...prev,
                isLoading: false,
                isLoadingMore: false,
                wasInterrupted: true,
                // 에러 메시지 설정하지 않음 - retry에서 복구할 예정
            }));
        }
    }, []);

    /**
     * 포그라운드 복귀 시 재시도
     */
    const retry = useCallback(async () => {
        // globalState를 직접 확인 (클로저 문제 방지)
        if (!globalState.wasInterrupted) {
            console.log('[useNameGeneration] Not interrupted, skipping retry');
            return;
        }

        console.log('[useNameGeneration] Retrying after interrupt...');
        setGlobalState(prev => ({
            ...prev,
            wasInterrupted: false,
            error: null,
        }));

        try {
            if (lastWasLoadMore) {
                await loadMore();
            } else if (lastWizardData) {
                await generate(lastWizardData);
            } else {
                console.log('[useNameGeneration] No data to retry with');
            }
        } catch (e) {
            console.error('[useNameGeneration] Retry failed:', e);
        }
    }, [generate, loadMore]);

    /**
     * 개발자용 완전 초기화 - isUnlocked, hasLoadedFromStorage 모두 리셋
     */
    const devReset = useCallback(() => {
        namingService.reset();
        globalState = {
            isLoading: false,
            isLoadingMore: false,
            error: null,
            names: [],
            hasMore: false,
            totalCandidates: 0,
            isExhausted: false,
            isUnlocked: false,  // 🆕 강제 잠금 상태로 리셋
            wasInterrupted: false,
            sajuInfo: null,     // 사주 정보도 초기화
        };
        globalSurname = '';
        lastWizardData = null;
        lastWasLoadMore = false;
        hasLoadedFromStorage = false;  // 🆕 다시 로드할 수 있도록 리셋
        console.log('[useNameGeneration] devReset: 전체 상태 초기화 완료');
        notifyListeners();
    }, []);

    /**
     * 사주 정보 업데이트 - 리포트 화면에서 생년월일 입력 시 호출
     */
    const updateSaju = useCallback((saju: SajuInfo) => {
        setGlobalState(prev => ({
            ...prev,
            sajuInfo: saju,
        }));
        console.log('[useNameGeneration] Saju info updated:', saju);
    }, []);

    /**
     * 사주 정보 조회
     */
    const getSajuInfo = useCallback(() => {
        return globalState.sajuInfo;
    }, []);

    return {
        ...globalState,
        generate,
        loadMore,
        reset,
        unlock,
        markInterrupted,
        retry,
        devReset,
        updateSaju,
        getSajuInfo,
    };
}

export default useNameGeneration;
