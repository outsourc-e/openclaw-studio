# ClawSuite Beta Tester Instructions

**Version:** v2.1.2  
**Status:** Beta Testing  
**Support:** https://discord.com/invite/clawd

---

## Welcome!

Thank you for testing ClawSuite! This document will guide you through installation, testing, and reporting issues.

---

## Prerequisites

### Required
- **Node.js** v18+ ([download](https://nodejs.org/))
- **npm** v8+ (comes with Node.js)
- **OpenClaw Gateway** installed and running ([docs](https://docs.openclaw.ai/installation))
- **Modern browser** (Chrome, Firefox, or Safari latest version)

### Optional
- **Git** (to clone repository)
- **Text editor** (VS Code, Sublime, etc.) to view logs

---

## Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/outsourc-e/openclaw-studio.git
cd openclaw-studio
git checkout v2.1.2
```

**No Git?** [Download ZIP](https://github.com/outsourc-e/openclaw-studio/archive/refs/tags/v2.1.2.zip) and extract.

### Step 2: Install Dependencies
```bash
npm install
```

**Estimated time:** 2-3 minutes

**Troubleshooting:**
- ❌ `EACCES` errors → Run `sudo chown -R $USER ~/.npm`
- ❌ `node: command not found` → Install Node.js first
- ❌ Dependency conflicts → Delete `node_modules` and `package-lock.json`, run `npm install` again

### Step 3: Verify Build
```bash
npm run build
```

**Expected output:**
```
✓ Client build: 4-6s
✓ Server build: 1-2s
✓ Exit code: 0
```

**Troubleshooting:**
- ❌ TypeScript errors → Report as issue (do not skip)
- ❌ Build hangs → Cancel (Ctrl+C) and retry
- ❌ Memory errors → Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### Step 4: Start Dev Server
```bash
npm run dev
```

**Expected output:**
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Troubleshooting:**
- ❌ Port 3000 in use → Kill process: `lsof -ti:3000 | xargs kill` (Mac/Linux) or change port in package.json
- ❌ Vite errors → Check Node version (`node --version` should be 18+)

### Step 5: Open in Browser
Open http://localhost:3000 in your browser.

**Expected:** Dashboard loads within 2-3 seconds

---

## Testing

### ⚠️ Golden Path (REQUIRED FIRST — 10-15 minutes)

**CRITICAL:** You MUST complete the Golden Path test first before any other testing. If any step fails, STOP and report immediately.

The Golden Path tests the core user journey:
1. Fresh install / reset state
2. Start Studio + Gateway
3. Add provider credentials
4. Open Chat
5. Send simple message
6. Switch model (idle)
7. Enable Smart Suggestions
8. Send message → see downgrade suggestion
9. Save current state as Mode
10. Apply Mode
11. Restart Studio
12. Verify state restored correctly

**See:** [BETA_CHECKLIST_v2.1.2.md](./BETA_CHECKLIST_v2.1.2.md) → Golden Path section

**If Golden Path fails:** Report immediately. Do NOT continue to full test suite.

---

### Full Test Suite (30-45 minutes)

**Only proceed after Golden Path passes.**

Follow the checklist: [BETA_CHECKLIST_v2.1.2.md](./BETA_CHECKLIST_v2.1.2.md)

Print or open checklist in separate window for easy reference.

---

## Logs & Diagnostics

### Where to Find Logs

**Browser Console:**
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click "Console" tab
3. Look for errors (red text)

**Screenshot console errors when reporting issues.**

**Terminal Output:**
- Dev server logs appear in terminal where you ran `npm run dev`
- Look for errors, warnings, or stack traces

**Gateway Logs:**
```bash
openclaw gateway logs
```

### Export Diagnostics Bundle

**Via UI:**
1. Navigate to **Debug** screen
2. Click "Export Diagnostics"
3. Save JSON file

**Via Script:**
```bash
cd openclaw-studio
npm run beta:export-diagnostics
```

**What's included:**
- App version and build info
- Recent activity events
- Session metadata
- Configuration (secrets redacted)
- Browser environment info

**NOT included:**
- API keys or tokens
- Message content
- Personal data

---

## Reporting Issues

### Before Reporting

1. **Check known issues:** [docs/PHASE_*.md](../docs/) for known limitations
2. **Search existing issues:** [GitHub Issues](https://github.com/outsourc-e/openclaw-studio/issues)
3. **Try clearing state:** `npm run beta:reset-state` (see below)

### Issue Template

Use this template when reporting issues:

```markdown
## Issue Title
[Brief description, e.g., "Model switcher not responding"]

## Environment
- **OS:** [macOS 14.1, Windows 11, Ubuntu 22.04, etc.]
- **Browser:** [Chrome 120, Firefox 121, Safari 17, etc.]
- **Node Version:** [Output of `node --version`]
- **Studio Version:** v2.1.2

## Steps to Reproduce
1. Open Chat screen
2. Click model switcher
3. Select "claude-sonnet-4-5"
4. [Expected behavior vs. actual behavior]

## Expected Behavior
[What you expected to happen]

## Actual Behavior
[What actually happened]

## Screenshots
[Attach screenshots, especially console errors]

## Console Errors
[Copy/paste any red errors from browser console]

## Diagnostics
[Attach diagnostics bundle from Debug screen]

## Additional Context
[Anything else that might help: recent actions, plugins, etc.]
```

### Where to Report

**GitHub Issues (Preferred):**
https://github.com/outsourc-e/openclaw-studio/issues/new

**Discord (For Questions):**
https://discord.com/invite/clawd → #beta-testing channel

### Severity Levels

**🔴 Critical (Report Immediately)**
- API keys exposed
- App crashes on launch
- Data loss
- Security vulnerabilities

**🟠 Major (Report Within 24h)**
- Core features broken (can't send messages)
- Model switching fails
- Settings don't save

**🟡 Minor (Report When Convenient)**
- UI glitches (cosmetic)
- Slow performance
- Edge case bugs

---

## Common Issues & Fixes

### "Gateway not found"
**Cause:** OpenClaw Gateway not running or wrong port.

**Fix:**
```bash
openclaw gateway start
openclaw gateway status
```

**If port mismatch:** Check gateway config and update Studio config.

---

### "No models available"
**Cause:** No AI providers configured.

**Fix:**
1. Navigate to **Providers** screen
2. Click "Add Provider"
3. Select provider (Anthropic, OpenAI, etc.)
4. Enter API key
5. Test connection

---

### "Model switch failed"
**Cause:** Model unavailable, API key invalid, or streaming in progress.

**Fix:**
1. Wait if message is streaming
2. Check provider API key in Settings
3. Verify model ID in catalog
4. Retry after 10 seconds

---

### "Settings don't persist"
**Cause:** localStorage disabled or browser privacy mode.

**Fix:**
1. Exit private/incognito mode
2. Enable cookies/localStorage in browser settings
3. Run `npm run beta:reset-state` to clear corrupted state
4. Retry

---

### "Console errors on every page"
**Cause:** Build issue or dependency conflict.

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
npm run dev
```

---

### "Port 3000 already in use"
**Cause:** Another process using port 3000.

**Fix (Mac/Linux):**
```bash
lsof -ti:3000 | xargs kill
npm run dev
```

**Fix (Windows):**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
npm run dev
```

**Or change port:** Edit `package.json` → `"dev": "vite dev --port 3001"`

---

## Beta Scripts

### Reset Local State
**Purpose:** Clear all localStorage, cache, and temporary files safely.

**Usage:**
```bash
npm run beta:reset-state
```

**What it clears:**
- localStorage (modes, pinned models, settings)
- IndexedDB (if used)
- Browser cache (refresh with Cmd+Shift+R)

**Does NOT clear:**
- node_modules
- Source code
- Gateway data

**When to use:**
- Settings corrupted
- Testing fresh user experience
- After major state-related bugs

---

### Export Diagnostics + Secret Scan
**Purpose:** Export diagnostics bundle and verify no secrets leaked.

**Usage:**
```bash
npm run beta:export-diagnostics
```

**Output:**
- `diagnostics-YYYYMMDD-HHMMSS.json` (diagnostics bundle)
- `secret-scan-result.txt` (scan report)

**Scan checks for:**
- API keys (sk-, api_, pk_, etc.)
- Tokens (bearer, jwt, etc.)
- Passwords
- URLs with credentials

**Expected result:** "✅ No secrets found"

**If secrets found:** ❌ CRITICAL BUG — Report immediately, do NOT share diagnostics file.

---

## FAQ

### Q: Can I test on localhost without OpenClaw Gateway?
**A:** No. ClawSuite requires the Gateway to function. Install it from https://docs.openclaw.ai/installation.

### Q: Is my data sent to OpenClaw servers?
**A:** No. All data stays local except API calls to your configured AI providers (Anthropic, OpenAI, etc.). ClawSuite does not phone home.

### Q: Can I use my own API keys?
**A:** Yes. Configure providers in Settings → Providers. Your keys are stored locally (encrypted by Gateway) and never sent to OpenClaw.

### Q: What if I find a security issue?
**A:** Email security@openclaw.ai immediately. Do NOT post publicly. We follow responsible disclosure.

### Q: How do I uninstall?
**A:**
```bash
cd openclaw-studio
npm run beta:reset-state  # Clear state
cd ..
rm -rf openclaw-studio    # Delete files
```

To fully uninstall OpenClaw Gateway, see https://docs.openclaw.ai/uninstall.

---

## Need Help?

### Documentation
- **OpenClaw Docs:** https://docs.openclaw.ai
- **Studio README:** [../README.md](../README.md)
- **Phase 4 Features:** [PHASE_4.1_SMART_SUGGESTIONS.md](./PHASE_4.1_SMART_SUGGESTIONS.md), [PHASE_4.2_PINNED_MODELS.md](./PHASE_4.2_PINNED_MODELS.md), [PHASE_4.3_SESSION_PRESETS.md](./PHASE_4.3_SESSION_PRESETS.md)

### Community
- **Discord:** https://discord.com/invite/clawd (#beta-testing channel)
- **GitHub Issues:** https://github.com/outsourc-e/openclaw-studio/issues
- **Twitter:** @opensourc_e

---

## Thank You!

Your feedback helps make ClawSuite better. We appreciate your time and effort in testing this beta release.

**Happy testing! 🚀**

---

_Last updated: 2026-02-08 | Version: v2.1.2_
