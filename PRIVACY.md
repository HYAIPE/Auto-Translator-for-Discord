# Privacy Policy — Auto Translator for Discord

**Effective date:** July 12, 2026

Auto Translator for Discord ("the extension") is an open-source browser
extension developed by HYAIPE. This policy describes what data the extension
handles and how.

## What the extension does

The extension automatically translates chat messages displayed on
`discord.com` into English.

## Data handled

- **Message text.** The text content of messages visible in your Discord chat
  is sent to Google's translation service (`translate.googleapis.com`) for the
  sole purpose of retrieving a translation. This is the extension's single,
  core function. Google's handling of that request is governed by
  [Google's Privacy Policy](https://policies.google.com/privacy).
- **Settings.** A single ON/OFF preference is stored locally in your browser
  (`chrome.storage.local`). It never leaves your device.

## What the extension does NOT do

- It does **not** collect, store, or log your messages, usernames, or any
  personal information.
- It does **not** use analytics, tracking, cookies, or advertising of any kind.
- It does **not** sell, share, or transfer any data to third parties (other
  than the translation request described above).
- It does **not** run on any website other than `discord.com`.

## Data retention

None. Translations are cached only in memory for the current browser session
and are discarded when the browser closes or the extension is unloaded.

## Open source

The complete source code is publicly available for inspection at
<https://github.com/HYAIPE/DiscordTranslator>.

## Changes to this policy

Any changes will be published in this repository with an updated effective
date.

## Contact

Questions or concerns: open an issue at
<https://github.com/HYAIPE/DiscordTranslator/issues> or email
<hyaipe.io@gmail.com>.
