# Beta Feedback Template — OpenClaw Studio v2.1.2

**Instructions:** Copy this template and fill it out when reporting issues. Submit via Discord #beta-testing or GitHub Issues.

---

## Issue Summary

**Title:** [Brief one-line description]

**Severity:** [Choose one: BLOCKER / IMPORTANT / NICE-TO-HAVE]

**Test Phase:** [Choose one: Golden Path / Part 1 / Part 2 / Part 3]

**Test Case:** [e.g., "Golden Path Step 5: Send simple message" or "Part 2.2: Session Presets - save mode"]

---

## Environment

**OS:** [e.g., macOS 14.1, Windows 11 Pro, Ubuntu 22.04]

**Browser:** [e.g., Chrome 120.0.6099.129, Firefox 121.0, Safari 17.2]

**Node Version:** [Output of `node --version`, e.g., v22.22.0]

**npm Version:** [Output of `npm --version`, e.g., 10.9.4]

**Studio Version:** v2.1.2

**Gateway Version:** [Output of `openclaw --version`, e.g., 2026.2.6-3]

---

## Steps to Reproduce

1. [First step]
2. [Second step]
3. [Third step]
4. [Continue until issue occurs]

---

## Expected Behavior

[What you expected to happen]

---

## Actual Behavior

[What actually happened]

---

## Screenshots

[Attach screenshots here, especially:]
- Browser console errors (press F12 → Console tab)
- UI showing the problem
- Gateway logs (if relevant)

**How to screenshot:**
- **macOS:** Cmd+Shift+4, drag to select area
- **Windows:** Win+Shift+S, drag to select area
- **Linux:** PrtScn or Shift+PrtScn

---

## Console Errors

[Copy/paste errors from browser console (F12 → Console)]

**If no console errors:** Write "None"

**Example:**
```
Uncaught TypeError: Cannot read properties of undefined (reading 'id')
    at ChatScreen.tsx:42
    at Array.map (<anonymous>)
```

---

## Terminal Output

[If dev server shows errors, copy/paste relevant lines]

**If no terminal errors:** Write "None"

---

## Diagnostics Bundle

**Export diagnostics:**
1. In Studio, navigate to **Debug** screen
2. Click "Export Diagnostics"
3. Attach the downloaded JSON file here

**OR run script:**
```bash
npm run beta:export-diagnostics
```

Attach `diagnostics-YYYYMMDD-HHMMSS.json` file.

---

## Additional Context

[Any other information that might help:]
- Recent actions before issue occurred
- Does this happen every time or randomly?
- Did it work before (regression)?
- Anything unusual about your setup?

---

## Attempted Workarounds

[What have you tried to fix or work around this issue?]

**Examples:**
- Refreshed page (did/didn't help)
- Cleared localStorage (did/didn't help)
- Restarted dev server (did/didn't help)
- Tried different browser (did/didn't help)

**If you haven't tried anything yet:** Write "None"

---

## Suggested Severity Rationale

**Why did you choose this severity?**

**BLOCKER examples:**
- App crashes, unusable
- Cannot send messages
- Security issue (keys exposed)
- Data loss

**IMPORTANT examples:**
- Major feature broken (workaround exists)
- Settings don't persist
- Model switching fails

**NICE-TO-HAVE examples:**
- UI glitch (cosmetic)
- Slow performance (non-blocking)
- Feature request
- Typo

---

## Your Information (Optional)

**Name/Handle:** [Your name or Discord username]

**Contact:** [Email or Discord handle for follow-up questions]

**Tester Type:** [Choose one: Fresh User / Power User / Developer]

---

## For QA Lead (Do Not Fill Out)

**Classification:** [ ] BLOCKER [ ] IMPORTANT [ ] NICE-TO-HAVE

**Reproducible:** [ ] YES [ ] NO [ ] NEEDS MORE INFO

**Root Cause:** [To be filled by QA lead]

**Proposed Fix:** [To be filled by QA lead]

**Assigned To:** [To be filled by project lead]

**Status:** [ ] NEW [ ] INVESTIGATING [ ] FIX IN PROGRESS [ ] FIXED [ ] DEFERRED

---

## Submission Checklist

Before submitting, ensure:

- [ ] Title is clear and specific
- [ ] Severity chosen correctly
- [ ] Environment info complete (OS, browser, Node version)
- [ ] Steps to reproduce are detailed
- [ ] Expected vs. actual behavior described
- [ ] Screenshots attached (especially console errors)
- [ ] Console errors copy/pasted (if any)
- [ ] Diagnostics bundle attached (or note why not)
- [ ] Additional context provided

---

## How to Submit

### Option 1: Discord (Recommended)
1. Join https://discord.com/invite/clawd
2. Go to #beta-testing channel
3. Post this filled template
4. Attach screenshots and diagnostics

### Option 2: GitHub Issues
1. Go to https://github.com/outsourc-e/openclaw-studio/issues/new
2. Title: Copy your issue title
3. Body: Paste this filled template
4. Labels: Add `beta`, `v2.1.2`, severity label
5. Attach files

---

## Example (Good Report)

```markdown
# Beta Feedback Template — OpenClaw Studio v2.1.2

## Issue Summary

**Title:** Model switcher dropdown not closing after selection

**Severity:** IMPORTANT

**Test Phase:** Golden Path

**Test Case:** Golden Path Step 6: Switch model (idle)

## Environment

**OS:** macOS 14.1 (23B74)
**Browser:** Chrome 120.0.6099.129
**Node Version:** v22.22.0
**npm Version:** 10.9.4
**Studio Version:** v2.1.2
**Gateway Version:** 2026.2.6-3

## Steps to Reproduce

1. Start dev server: `npm run dev`
2. Navigate to Chat screen
3. Click model switcher dropdown
4. Click a model (e.g., "claude-sonnet-4-5")
5. Observe dropdown remains open

## Expected Behavior

Dropdown should close immediately after selecting a model.

## Actual Behavior

Dropdown stays open. Must click outside dropdown to close it manually.

## Screenshots

[Screenshot showing open dropdown after selection]

## Console Errors

None

## Terminal Output

None (no errors in dev server)

## Diagnostics Bundle

Attached: diagnostics-20260208-160000.json

## Additional Context

- Happens every time
- Tested on both Chrome and Firefox (same issue)
- Clicking outside dropdown does close it (workaround)

## Attempted Workarounds

- Clicked outside dropdown (works)
- Refreshed page (issue persists)
- Tried different models (all have same issue)

## Suggested Severity Rationale

IMPORTANT because:
- Model switching works (can workaround by clicking outside)
- But UX is poor (extra click required)
- Affects every model switch

## Your Information (Optional)

**Name/Handle:** TestUser123
**Contact:** testuser@example.com
**Tester Type:** Fresh User
```

---

## Tips for Good Reports

1. **Be specific:** "Model switcher broken" → "Model switcher dropdown doesn't close after selection"
2. **Include steps:** Don't assume we know your workflow
3. **Attach screenshots:** Console errors are critical
4. **Try workarounds:** Helps us assess severity
5. **Be honest about severity:** If unsure, ask in Discord

---

**Thank you for testing OpenClaw Studio!** Your feedback makes the product better. 🙏
