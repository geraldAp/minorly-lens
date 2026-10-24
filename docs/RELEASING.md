# Build, test and package Minorly Lens locally

## Requirements

Use the Node/npm versions supported by the project's Vite release. Install the
locked dependencies with `npm ci`. The packaging script additionally requires
the `zip` and `unzip` command-line tools, included on macOS and commonly available
on Linux. Windows users can run the same workflow in WSL with these tools installed.

## Check and package

From the repository root, run these commands in sequence:

```sh
npm ci
npm run lint
npm test
npm run package:extension
```

`package:extension` runs the TypeScript/production build, validates the manifest's
popup and PNG icon paths/dimensions, checks version agreement, and creates a fresh
ZIP containing the regular files in `dist`. It refuses hidden files, source maps
and symlinks, tests the ZIP and verifies its entry list. No dependencies are added.

For version 0.1.0 the outputs are:

```text
artifacts/minorly-lens-0.1.0.zip
artifacts/minorly-lens-0.1.0.zip.sha256
```

The manifest is directly at the ZIP root. Upload the ZIP, not the source checkout,
`node_modules`, the checksum file, or a ZIP with an outer `dist` directory.
Artifacts are ignored by Git. Rerunning the command replaces that version's
archive rather than appending to an old ZIP. The checksum describes that exact
archive; separate builds are not promised to be byte-identical.

## Test the exact upload files

Extract the ZIP into an empty temporary folder. In `chrome://extensions`, enable
Developer mode and choose **Load unpacked**, selecting the extracted folder that
contains `manifest.json`. Pin Minorly Lens and open the toolbar popup.

Check the GHS example in [the listing draft](STORE-LISTING.md), invalid inputs,
keyboard navigation, long results, scrolling, and light/dark appearance. Confirm
the Lens icon appears and Chrome reports no extension errors. Closing the popup
currently resets inputs. Complete the manual VoiceOver/everyday-profile checks.

For day-to-day development, loading `dist` directly is fine. After source changes,
rebuild, click **Reload** in `chrome://extensions`, and reopen the popup. A Vite
preview server is not needed to run the packaged extension. To hand a build to
someone for local testing, they extract the ZIP and use Load unpacked themselves.

## Source assets and versions

The logo master is `assets/branding/logo-master.png`. Exported icon PNGs in
`public/icons` are committed at 16, 32, 48 and 128 pixels. Their transparent padding
and silhouette are retained when exporting. The 128px file is also the store icon.
See [branding notes](../assets/branding/README.md) for provenance and the prompt.

Update `public/manifest.json` and the root package version together for future
releases, then update the package-lock metadata with `npm install --package-lock-only`.
Every uploaded update needs a higher manifest version than the previous upload.

## Prepare the listing

1. Review [store copy and reviewer instructions](STORE-LISTING.md).
2. Capture real screenshots at 1280×800, including a useful input and result state.
3. Review [the privacy policy](PRIVACY.md) against the exact release behavior.
4. After merging, verify the public privacy-policy URL while signed out.
5. Register/configure the Chrome Web Store developer account, complete its current
   listing/privacy/distribution fields, and upload the ZIP in the Developer Dashboard.
6. Submit for review. Choose automatic publication or publish manually after approval.

This PR prepares local assets and copy; it does not register an account, pay a fee,
upload a store item, or submit/publish it. If registering from Ghana, confirm
eligibility first: Google's published registration-country list currently omits
Ghana. An existing publisher account should be checked in the dashboard.

Official references: [prepare the package](https://developer.chrome.com/docs/webstore/prepare),
[developer registration](https://developer.chrome.com/docs/webstore/register),
[publish](https://developer.chrome.com/docs/webstore/publish),
[privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy),
[privacy-policy requirement](https://developer.chrome.com/docs/webstore/program-policies/privacy).
