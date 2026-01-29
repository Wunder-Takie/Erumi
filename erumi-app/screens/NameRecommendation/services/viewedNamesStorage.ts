/**
 * viewedNamesStorage.ts
 * 조회한 이름 임시 저장소 (마이페이지용)
 * 
 * TODO: 나중에 AsyncStorage 또는 서버 연동으로 교체
 */

import { BatchNameCandidate } from 'erumi-core';

// ==========================================
// Types
// ==========================================

export interface ViewedNameEntry {
    name: BatchNameCandidate;
    surname: string;
    viewedAt: Date;
    sessionId: string;
}

// ==========================================
// In-Memory Storage (임시)
// ==========================================

let viewedNames: ViewedNameEntry[] = [];
let currentSessionId: string | null = null;

/**
 * 새 세션 시작 (wizard 시작할 때 호출)
 */
export function startNewSession(): string {
    currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return currentSessionId;
}

/**
 * 현재 세션 ID 가져오기
 */
export function getCurrentSessionId(): string | null {
    return currentSessionId;
}

/**
 * 조회한 이름 저장
 */
export function saveViewedNames(names: BatchNameCandidate[], surname: string): void {
    if (!currentSessionId) {
        currentSessionId = startNewSession();
    }

    const entries: ViewedNameEntry[] = names.map(name => ({
        name,
        surname,
        viewedAt: new Date(),
        sessionId: currentSessionId!,
    }));

    viewedNames.push(...entries);

    console.log(`📝 Saved ${names.length} names to viewed history. Total: ${viewedNames.length}`);
}

/**
 * 모든 조회한 이름 가져오기
 */
export function getAllViewedNames(): ViewedNameEntry[] {
    return [...viewedNames];
}

/**
 * 현재 세션의 조회한 이름 가져오기
 */
export function getSessionViewedNames(): ViewedNameEntry[] {
    if (!currentSessionId) return [];
    return viewedNames.filter(entry => entry.sessionId === currentSessionId);
}

/**
 * 저장소 초기화 (테스트용)
 */
export function clearViewedNames(): void {
    viewedNames = [];
    currentSessionId = null;
}

/**
 * 조회한 이름 수 가져오기
 */
export function getViewedCount(): number {
    return viewedNames.length;
}
