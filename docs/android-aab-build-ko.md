# Android AAB 빌드 가이드 (Capacitor)

기준일: 2026-02-26

## 1) 현재 저장소 상태

- 웹 게임을 Capacitor Android 프로젝트로 래핑 완료
- Android 프로젝트 경로: `android/`
- 앱 번들 ID: `com.yeniverse.penguinslide`
- 광고 ID 권한 추가: `android/app/src/main/AndroidManifest.xml`
- AdMob/Billing 라이브러리 의존성 추가:
  - `com.google.android.gms:play-services-ads:24.9.0`
  - `com.android.billingclient:billing:8.3.0`

## 2) 선행 설치(로컬 Mac)

1. JDK 설치 (권장: 21)
2. Android Studio 설치
3. Android SDK 설치(Platform + Build-Tools)
4. 환경 변수 설정 (`ANDROID_HOME` 또는 `ANDROID_SDK_ROOT`)

예시(zsh):

```bash
echo 'export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"' >> ~/.zshrc
echo 'export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 3) 빌드 명령

프로젝트 루트에서:

```bash
npm install
npm run android:doctor
npm run android:bundle:release
```

성공 시 AAB 경로:

`android/app/build/outputs/bundle/release/app-release.aab`

## 4) Play Console 업로드

1. `테스트 및 출시 > 내부 테스트` 진입
2. `app-release.aab` 업로드
3. 릴리즈 노트 작성 후 저장
4. 내부 테스트 링크 설치 검증
5. 이상 없으면 `프로덕션` 트랙으로 승격

## 5) 꼭 확인할 점

- 현재 `ad-adapter.js`는 광고 SDK 연동 훅만 있고 실제 노출 구현은 아직 없음
- 인앱결제도 실제 구매 처리 로직(acknowledge 포함) 구현이 추가로 필요
- Data safety 선언은 실제 AAB 동작과 계속 일치해야 함
