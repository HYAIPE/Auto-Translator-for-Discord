<div align="center">

<img src="icons/icon128.png" alt="Auto Translator for Discord" width="96" />

# Auto Translator for Discord

**Real-time, hands-free translation of Discord messages to English — right in your browser.**

Built by [HYAIPE](https://github.com/HYAIPE)

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Platform](https://img.shields.io/badge/Platform-Chrome-yellow)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

</div>

---

Chrome's built-in page translation is one-shot: the moment a new message arrives or you scroll back through history, you're back to toggling "Detect language" on and off. This extension fixes that. It watches Discord's chat and translates **every message the instant it appears** — new messages, edits, scrolled-back history, and channel switches included.

## ✨ Features

- **Live translation** — new incoming messages are translated the moment they render. No clicking, no toggling.
- **In-place replacement** — translated text replaces the original, shown in **bold** so you can tell it apart from messages that were already English.
- **Originals preserved** — hover any translated message to see the original text in a tooltip.
- **Markup-safe** — translation happens per text node, so custom emojis, @mentions, and links survive untouched.
- **Language-aware** — messages already in English are detected and left alone.
- **Efficient** — translations are cached and requests are throttled (max 3 concurrent) to avoid rate limits.
- **One-click toggle** — click the toolbar icon to switch translation ON/OFF; originals are restored instantly.

## 📦 Installation

### From source (Developer mode)

1. Clone this repository:
   ```
   git clone https://github.com/HYAIPE/DiscordTranslator.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the cloned folder.
5. Open or refresh [discord.com/app](https://discord.com/app).

## 🚀 Usage

- Translation is **on by default**. Click the extension's toolbar icon to toggle it — the badge shows the current state (`ON`/`OFF`).
- Hover a translated (bold) message to see the original text.
- To translate into a different language, change `tl=en` in [`background.js`](background.js) and `TARGET_LANG` in [`content.js`](content.js).

## 🔧 How it works

| Component | Role |
|-----------|------|
| `content.js` | Watches Discord's chat DOM with a `MutationObserver` and replaces message text nodes in place with their translation. |
| `background.js` | MV3 service worker that performs the translation requests (avoids CORS in the content script) with an in-memory cache. |

The content script tracks each text node's original and translated value, so React re-renders that silently reset text are caught and re-translated instantly from cache, and toggling the extension off restores the originals.

## 🔒 Privacy

- Message text is sent to Google Translate (`translate.googleapis.com`) **solely to retrieve translations**.
- Nothing is stored, logged, or shared beyond that request. The only persisted data is your ON/OFF preference (`chrome.storage.local`).
- The extension runs only on `discord.com`.

## ⚠️ Notes

- Works with Discord in the **browser** (the desktop app can't load Chrome extensions).
- Uses the free public Google Translate endpoint; extremely heavy traffic could be temporarily rate-limited (HTTP 429). Failed messages retry automatically on the next DOM change.
- Discord occasionally changes its internal DOM. If translations stop appearing after a Discord update, the `MESSAGE_SELECTOR` in `content.js` is the first place to look — issues and PRs welcome.

## 🤝 Contributing

Contributions are welcome! Feel free to [open an issue](https://github.com/HYAIPE/DiscordTranslator/issues) or submit a pull request.

## 📄 License

[MIT](LICENSE) © 2026 [HYAIPE](https://github.com/HYAIPE)

---

<div align="center">

*Not affiliated with or endorsed by Discord Inc. or Google LLC.*

</div>
