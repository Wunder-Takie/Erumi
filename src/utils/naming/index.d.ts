/**
 * naming/index.d.ts
 * TypeScript 타입 정의
 */

import type { NameResult } from '../../types';

export function generateNames(
    surname: string,
    selectedTagIds?: string[],
    gender?: 'M' | 'F' | null
): NameResult[];

export function decomposeHangul(char: string): {
    cho: string;
    jung: string;
    jong: string;
} | null;

export function getInitialSound(char: string): string;
