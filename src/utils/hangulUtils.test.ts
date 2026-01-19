/**
 * hangulUtils.test.ts
 * 한글 처리 함수들 테스트
 */

import { describe, it, expect } from 'vitest';
import { decomposeHangul, getInitialSound } from './hangulUtils';

describe('hangulUtils', () => {
    describe('decomposeHangul', () => {
        it('한글 음절 분해', () => {
            const result = decomposeHangul('한');
            expect(result).not.toBeNull();
            expect(result?.cho).toBe('ㅎ');
            expect(result?.jung).toBe('ㅏ');
            expect(result?.jong).toBe('ㄴ');
        });

        it('받침 없는 글자 분해', () => {
            const result = decomposeHangul('가');
            expect(result).not.toBeNull();
            expect(result?.cho).toBe('ㄱ');
            expect(result?.jung).toBe('ㅏ');
            expect(result?.jong).toBe('');
        });

        it('한글이 아닌 경우 null', () => {
            const result = decomposeHangul('A');
            expect(result).toBeNull();
        });

        it('다양한 글자 분해', () => {
            expect(decomposeHangul('지')?.cho).toBe('ㅈ');
            expect(decomposeHangul('우')?.cho).toBe('ㅇ');
            expect(decomposeHangul('민')?.jong).toBe('ㄴ');
        });
    });

    describe('getInitialSound', () => {
        it('초성 추출 (첫 글자)', () => {
            // getInitialSound는 첫 글자의 초성만 반환
            expect(getInitialSound('한')).toBe('ㅎ');
            expect(getInitialSound('지')).toBe('ㅈ');
        });
    });
});
