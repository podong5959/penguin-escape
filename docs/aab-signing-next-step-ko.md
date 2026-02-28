# AAB 서명 후 업로드 (필수)

현재 `bundleRelease`로 생성된 파일이 unsigned이면 Play Console 업로드가 되지 않습니다.

## 1) 업로드 키 생성

프로젝트 루트에서:

```bash
cd "/Users/jaeuk/conductor/workspaces/penguin escape/islamabad"
mkdir -p android/keystore
keytool -genkeypair -v \
  -keystore android/keystore/upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

## 2) keystore.properties 생성

아래 파일 생성: `android/keystore.properties`

```properties
storeFile=keystore/upload-keystore.jks
storePassword=여기에_키스토어_비밀번호
keyAlias=upload
keyPassword=여기에_키_비밀번호
```

## 3) 릴리즈 번들 재생성

```bash
npm run android:bundle:release
```

## 4) 서명 검증

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab | head -n 40
```

출력에 `jar verified.` 또는 서명 인증서 정보가 나오면 정상입니다.

## 5) Play Console 업로드

- `테스트 및 출시 > 내부 테스트 > 새 버전 만들기`
- `android/app/build/outputs/bundle/release/app-release.aab` 업로드
