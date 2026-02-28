# iOS 배포 자동화 가이드 (IPA + TestFlight 업로드)

## 1) 1회 초기 세팅

### A. App Store Connect API Key 생성
1. App Store Connect 접속
2. `사용자 및 액세스` -> `통합` -> `App Store Connect API`
3. `+` 눌러 API Key 생성
4. `Key ID`, `Issuer ID`, `.p8` 파일 저장

### B. 환경변수 등록 (터미널)
```bash
export APP_STORE_CONNECT_API_KEY_ID=ABCD123456
export APP_STORE_CONNECT_API_ISSUER_ID=11111111-2222-3333-4444-555555555555
export APP_STORE_CONNECT_API_KEY_PATH=$HOME/keys/AuthKey_ABCD123456.p8
```

필요하면 `~/.zshrc`에 넣어 영구 저장.

### C. 코드사인 상태
- Xcode에서 최소 1회 Archive/Upload를 성공시켜서
- `Apple Distribution` 인증서 + App Store 프로파일이 정상 상태인지 확인.

## 2) 평소 배포 명령

### A. IPA 빌드
```bash
npm run ios:archive:release
```

출력:
- Archive: `.context/build/ios/App.xcarchive`
- IPA: `.context/build/ios/export/App.ipa`

### B. TestFlight 업로드
```bash
npm run ios:upload:testflight
```

또는 ipa 경로를 직접 지정:
```bash
bash ./scripts/upload-ipa-testflight.sh /absolute/path/to/your.ipa
```

### C. 한 번에 실행
```bash
npm run ios:release:quick
```

## 3) 자주 나는 오류

### `No profiles for ... were found`
- Xcode Signing 설정 문제.
- Release에서 `Apple Distribution` + 올바른 App Store 프로파일 확인.

### `Communication with Apple failed`
- 계정 인증/권한/약관/네트워크 문제.
- Xcode 계정 재로그인, Apple Developer 약관 확인.

### `APP_STORE_CONNECT_API_*` 누락 오류
- API 키 환경변수 3개를 다시 export.
