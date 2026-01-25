# Firebase Functions 설정 정보

## Functions URL

- Gemini API: <https://us-central1-erumi-a312b.cloudfunctions.net/gemini>
- KASI API: <https://us-central1-erumi-a312b.cloudfunctions.net/kasi>

## 사용 방법

### Gemini API

```typescript
const response = await fetch('https://us-central1-erumi-a312b.cloudfunctions.net/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '이름 평가...',
    model: 'gemini-2.0-flash'
  })
});
```

### KASI API  

```typescript
const response = await fetch('https://us-central1-erumi-a312b.cloudfunctions.net/kasi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: 'B090041050/v1/getAge',
    params: {
      solYear: '2024',
      solMonth: '01',
      solDay: '15'
    }
  })
});
```
