# Closed Test Update Guide

## 1) Build new AAB

Before every upload, increase `versionCode` in `android/app/build.gradle`.

```bash
cd "/Users/jaeuk/conductor/workspaces/penguin escape/islamabad"
npm run android:bundle:release:quick
```

Output file:

`android/app/build/outputs/bundle/release/app-release.aab`

## 2) Upload without losing closed-test users

1. Go to Google Play Console -> this app -> `테스트` -> `비공개 테스트`.
2. Open the **same existing closed-test track** (do not create a new track).
3. Click `새 버전 만들기` and upload the new AAB.
4. Save -> review -> rollout.

To prevent tester churn:

- Keep the same package name (`com.yeniverse.penguinslide`).
- Keep using the same closed-test track and same tester source (Google Group/email list).
- Do not remove existing testers from group/list.
- Do not switch to another track just for updates.

## 3) If upload is rejected

- If error says old version already higher: increase `versionCode` again.
- If a previous draft release is stuck, open that draft and replace/update the AAB there.
