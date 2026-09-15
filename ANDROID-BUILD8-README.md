# STANNEL Android build 8

This ZIP contains updated source code. It is not an AAB and cannot be uploaded to Google Play as-is.

## Build from the Expo website

The `STANNEL-build8-github-update.zip` archive contains only the 13 updated/new files. Extract it and add its contents at the root of `PPC-maker/stannel`, preserving the included folder paths. For example, `apps/mobile/app.json` must replace that same repository path. Do not upload the ZIP itself or create an extra parent directory.

1. In GitHub, choose **Add file > Upload files** and upload the extracted files and folders. Use **Commit changes > Create a new branch for this commit**, name the branch `android-build8`, and save the proposed changes. The website source ZIP used as the starting point corresponds to the repository snapshot supplied for this task; review the changes if the repository has advanced since that snapshot.
2. In the existing Expo project `stannel_app/stannel`, choose **Connect GitHub** and select `PPC-maker/stannel`. Set the **Base directory** to `apps/mobile`.
3. Open **Builds > Build from GitHub**, select branch `android-build8`, platform **Android**, and build profile **production**. Confirm the base directory is `apps/mobile`, then start the build.
4. Expo uses the existing remote Android credentials. After the build finishes, verify the page shows **1.0.6 (8)** and the artifact type **AAB**, then click **Download**. Verify the downloaded artifact's package, target SDK and full signing-certificate fingerprint before uploading to Google Play.

The Android production profile sets `image` to `latest`, as required by Expo's GitHub build setup. This direct Expo website route does not require the GitHub Actions workflow or an EXPO_TOKEN repository secret. Keep using the existing Android credential configuration; the required certificate fingerprints are below.

## Configuration

| Setting | Value |
| --- | --- |
| Android package | `com.stannel.app` |
| User-facing app version | `1.0.6` |
| Android version code | `8` |
| Compile / target SDK | `36` / `36` |
| Expo / React Native | `54.0.37` / `0.81.5` |
| Expo account / project | `stannel_app` / `stannel` |
| Expo project ID | `3df011da-c836-4c63-b9b2-b6b3caae4679` |
| Build profile | `production` |
| Signing credentials | Existing remote Expo credentials |

The app version was advanced to 1.0.6 so its appVersion-based Expo Updates runtime does not load updates targeting the old native SDK 52 build. The version code is fixed at 8; automatic incrementing is disabled. If Google Play has already consumed version code 8, increment it before building and update the version checks/output filenames in the workflow and collector.

## Build from GitHub

1. Apply the updated source files to `PPC-maker/stannel` while preserving any newer repository changes. The `.github` folder belongs at the repository root, alongside `apps` and `package.json`. Do not upload this ZIP as a single repository file.
2. Sign in to the Expo account with access to `stannel_app/stannel`. Confirm that its existing Android upload certificate matches the fingerprints below. Do not generate a replacement key to solve a missing-credentials prompt.
3. In your Expo account settings, open **Access tokens** and create a token for the account that can build this project. In GitHub open **Settings > Secrets and variables > Actions > New repository secret**. Name the secret `EXPO_TOKEN` and place the token there. Do not place passwords, tokens or private keys in the public repository.
4. Once the workflow exists on the default branch, open **Actions > Build STANNEL Android AAB > Run workflow**. The selected branch must contain the updated source. The workflow checks TypeScript and the Android JavaScript bundle, then starts an EAS cloud build using the existing production signing credentials.
5. After a successful run, download the single `STANNEL-1.0.6-build8-sdk36.aab` artifact and upload it to Google Play. The workflow uses an unzipped artifact so the result is an AAB file.

The workflow runs only when manually requested. It does not publish to Google Play or send an Expo OTA update. Build execution uses the connected Expo account and its available build quota. An Expo project with its Android signing credentials already configured is required for non-interactive builds.

## Required signing certificate

Google Play's screenshot requires the original certificate:

```text
SHA1:   A3:69:0A:4E:37:18:30:EC:F3:5C:A3:D0:36:85:24:F9:EC:0A:20:C5
SHA256: AB:FD:1B:72:7E:66:E8:53:93:E2:AA:55:68:E7:C7:E6:E0:94:0E:D4:62:B4:02:A8:D4:8D:A4:E7:6A:65:76:DF
```

The original source archive contains no private signing keystore. Access to the GitHub source by itself does not recover that key. Its presence in Expo has not yet been confirmed. The workflow rejects an AAB signed with a different certificate and does not expose it as the successful workflow artifact. If the original key is unavailable, a Google Play upload-key reset is a separate required account action.

## Work completed and validation limits

- Upgraded the mobile project from Expo SDK 52 to SDK 54 and React Native 0.81.5 with the matching React and Expo dependencies.
- Configured compile/target SDK 36, version code 8 and production AAB output while retaining the existing Android package and Expo project.
- Updated Babel and Metro configuration for the new Expo version, added required Worklets, and added safe-area insets to the WebView screen.
- Restored the missing native theme tokens used by existing components.
- Regenerated `pnpm-lock.yaml`; the offline frozen-lockfile check accepted the dependency definitions.
- Mobile TypeScript compilation passed with TypeScript 5.9.3 using `tsc --noEmit`.
- Workflow YAML and shell syntax were checked. The certificate guard correctly rejected the previously rejected AAB that used a different key.
- The dependency installation could not finish because network authorization was cancelled. The offline cache was incomplete. A native Android build, Metro export and device testing have not been completed in this workspace.
- The GitHub workflow has been prepared but has not been run against the repository or the Expo account. No new AAB has been produced from this updated source yet.

The completed native build still needs normal app/device testing and Google Play validation. The collector checks EAS version metadata, archive integrity and the original signing certificate; it does not replace those checks.

## Command-line build for a developer

Use Node.js 22 and pnpm 9.15.0. From the repository root:

```bash
pnpm --filter mobile... install --frozen-lockfile
pnpm --filter mobile type-check
cd apps/mobile
npx eas-cli@24.6.0 login
npx eas-cli@24.6.0 credentials --platform android
npx eas-cli@24.6.0 build --platform android --profile production
```

During credential inspection, select the existing production credentials and compare the fingerprint with the original one above. Do not print or commit private keys. If working from an extracted ZIP without Git, initialize a local Git repository first or use the documented `EAS_NO_VCS=1` environment option.

## References

- [Expo builds from GitHub Actions](https://docs.expo.dev/build/building-on-ci/)
- [Expo GitHub integration](https://docs.expo.dev/build/building-from-github/)
- [Expo SDK 54](https://expo.dev/changelog/sdk-54)
- [Android app signing](https://developer.android.com/studio/publish/app-signing)
