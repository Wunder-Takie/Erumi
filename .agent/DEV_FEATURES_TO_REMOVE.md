# 🚨 출시 전 제거해야 할 개발용 기능들

이 파일은 개발/테스트 목적으로 추가된 기능들의 목록입니다.
**앱 출시 전에 반드시 제거하거나 비활성화해야 합니다.**

---

## 1. 홈화면 - 히어로 이미지 더블탭

- **파일**: `erumi-app/screens/HomeScreen.tsx`
- **기능**: 히어로 이미지 더블탭 시 Demo 페이지로 이동
- **함수**: `handleHeroImagePress()`
- **제거 방법**: `<Pressable>` 래퍼와 `handleHeroImagePress` 함수 제거

---

## 2. 홈화면 - 로고 더블탭

- **파일**: `erumi-app/screens/HomeScreen.tsx`
- **기능**: 상단 erumi 로고 더블탭 시 AsyncStorage 초기화 팝업
- **함수**: `handleLogoPress()`
- **제거 방법**: `<Pressable>` 래퍼와 `handleLogoPress` 함수, `logoLastTapRef` 제거

---

## 3. 디자인 시스템 테스트 화면 - 헤더 트리플탭

- **파일**: (해당 파일 확인 필요)
- **기능**: 상단 헤더 텍스트 트리플탭 시 숨겨진 기능
- **제거 방법**: 관련 탭 핸들러 제거

---

## 4. 디버그 로그들

- **파일**: `erumi-app/screens/NameRecommendation/hooks/useNameGeneration.ts`
- **기능**: `[useNameGeneration]` 로그 출력
- **제거 방법**: `console.log('[useNameGeneration]...` 라인들 제거

- **파일**: `erumi-app/screens/NameRecommendation/services/namingService.ts`
- **기능**: `[NamingService] 무료체험:` 로그 출력
- **제거 방법**: 해당 `console.log` 라인 제거

---

## 출시 전 체크리스트

- [ ] 위 기능들 모두 제거/비활성화
- [ ] `console.log` 문 정리
- [ ] Demo 페이지 네비게이션 제거 또는 숨김
