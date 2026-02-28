# Penguin Slide 배포/출시 다음 액션 (빠른 경로)

기준일: 2026-02-26

## 0) 현재 상태

- 앱 소스는 웹 기반(HTML/JS)으로 준비되어 있음
- 개인정보처리방침 페이지 생성 완료: `/privacy.html`
- 계정삭제 안내 페이지 생성 완료: `/account-deletion.html`
- 게임 내 버튼 연결 완료(처리방침/계정삭제)
- Vercel 배포 시도 결과: 인증 미완료로 중단됨

## 1) 지금 사용자(당신)가 해야 하는 것

1. Vercel 로그인 1회
   - `npx vercel login`
2. 프로덕션 배포 실행
   - `./scripts/deploy-vercel.sh`
3. 배포된 URL 확보
   - 예시: `https://xxxxx.vercel.app/privacy.html`
   - 예시: `https://xxxxx.vercel.app/account-deletion.html`
4. Play Console에 URL 등록
   - 개인정보처리방침 URL: 위 `privacy.html`
   - 계정 삭제 URL(요구 시): 위 `account-deletion.html`
5. 문의 이메일 확정 후 문구 수정
   - 현재 파일에는 `yeniverse.official@gmail.com`가 반영되어 있음

## 2) 플레이스토어 출시에 남은 핵심 작업

1. Android 앱 패키징 (웹 -> Android 앱)
   - 권장: Capacitor Android 래핑
2. 광고/결제 연동
   - AdMob SDK
   - Google Play Billing
3. AAB 생성 후 테스트 트랙 업로드
   - Internal testing -> Closed testing -> Production
4. 스토어 입력
   - Data safety
   - App content(광고/연령/접근성)
   - 콘텐츠 등급
   - 스토어 등록정보(설명/스크린샷/아이콘)

## 3) 참고 명령어

```bash
# Vercel 로그인
npx vercel login

# 배포
./scripts/deploy-vercel.sh
```
