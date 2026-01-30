// 한글, 한자, 숫자, 기본 문장부호만 허용 (영어/러시아어 등 제거)
export function sanitizeKoreanText(text: string): string {
    if (!text) return '';
    // 한글: \uAC00-\uD7AF, 자모: \u3131-\u318E, 한자: \u4E00-\u9FFF, 숫자: 0-9, 기본 문장부호/공백
    return text.replace(/[^\uAC00-\uD7AF\u4E00-\u9FFF\u3131-\u318E0-9\s.,!?~()'"·:;%\-\n]/g, '');
}
