# Beta Execution Guide — ClawSuite v2.1.2

**Version:** v2.1.2  
**Phase:** 6 — Beta Execution & Hardening  
**Audience:** Beta testers, QA lead, project manager

---

## Overview

This guide explains how to execute the ClawSuite v2.1.2 beta testing phase from start to finish.

---

## Pre-Beta Setup

### 1. Recruit Testers (5-10 people)

**Ideal testers:**
- Mix of technical and non-technical users
- Fresh users (never used ClawSuite)
- Power users (familiar with similar tools)
- Diverse platforms (macOS, Windows, Linux)
- Diverse browsers (Chrome, Firefox, Safari)

**Recruitment channels:**
- Discord: #beta-testing channel
- Twitter: @outsourc_e
- GitHub: Issue or Discussion thread
- Direct invites: Email or DM

### 2. Distribute Materials

Send each tester:
1. **Installation guide:** `docs/TESTER_INSTRUCTIONS.md`
2. **Test checklist:** `docs/BETA_CHECKLIST_v2.1.2.md`
3. **Feedback template:** `docs/BETA_FEEDBACK_TEMPLATE.md`
4. **Discord invite:** https://discord.com/invite/clawd (#beta-testing)

**Email template:**
```
Subject: ClawSuite v2.1.2 Beta Invitation

Hi [Name],

You're invited to test ClawSuite v2.1.2 before public release!

What you'll need:
- 45-60 minutes for full testing
- Node.js v18+ and OpenClaw Gateway installed
- Access to an AI provider (Anthropic, OpenAI, etc.)

Get started:
1. Installation: [link to TESTER_INSTRUCTIONS.md]
2. Test checklist: [link to BETA_CHECKLIST_v2.1.2.md]
3. Report issues: [link to BETA_FEEDBACK_TEMPLATE.md]

Join #beta-testing on Discord: https://discord.com/invite/clawd

Thank you for helping make ClawSuite better!

- Eric / OpenClaw Team
```

### 3. Set Up Tracking

**GitHub Project or Issue:**
- Create tracking issue: "v2.1.2 Beta Testing Tracker"
- Labels: `blocker`, `important`, `nice-to-have`, `bug`, `ux`, `docs`

**Discord:**
- Pin instructions in #beta-testing
- Monitor for real-time feedback

**Spreadsheet (optional):**
- Track tester progress (who completed Golden Path, who completed full suite)

---

## Beta Execution Timeline

### Week 1: Golden Path Validation

**Goal:** Ensure all testers can complete Golden Path (12 steps).

**Steps:**
1. **Day 1:** Send invites, share materials
2. **Day 2-3:** Monitor Golden Path completion
3. **Day 4:** Triage any BLOCKER issues from Golden Path
4. **Day 5-7:** Fix critical blockers, tag v2.1.3 if needed

**Success Criteria:**
- ✅ 80%+ testers complete Golden Path without blockers
- ✅ No critical bugs in core flow (install → chat → modes)

---

### Week 2: Full Test Suite + Hardening

**Goal:** Complete full test suite, fix IMPORTANT issues.

**Steps:**
1. **Day 1-3:** Testers complete Parts 1-3 (full 35 test cases)
2. **Day 4:** Triage feedback (BLOCKER / IMPORTANT / NICE-TO-HAVE)
3. **Day 5-7:** Fix IMPORTANT issues, tag v2.1.4 if needed

**Success Criteria:**
- ✅ 5+ testers complete full suite
- ✅ No BLOCKER or IMPORTANT bugs remaining
- ✅ NICE-TO-HAVE issues documented for future

---

### Week 3: Final Hardening + Release

**Goal:** Polish, final validation, public release.

**Steps:**
1. **Day 1-2:** Address remaining edge cases
2. **Day 3-4:** Final smoke test (QA lead + 2 testers)
3. **Day 5:** Tag v2.2.0, announce public release
4. **Day 6-7:** Post-release monitoring

---

## Running Golden Path Test

**Critical:** Golden Path MUST pass before any other testing.

### Preparation
1. Fresh install or reset state: `npm run beta:reset-state`
2. OpenClaw Gateway running: `openclaw gateway start`
3. AI provider API key ready (Anthropic, OpenAI, etc.)

### Execution (15 minutes)
Follow `docs/BETA_CHECKLIST_v2.1.2.md` → Golden Path section.

**Steps:**
1. Fresh install / reset state
2. Start Studio + Gateway
3. Add provider credentials
4. Open Chat
5. Send simple message
6. Switch model (idle)
7. Enable Smart Suggestions
8. Trigger downgrade suggestion
9. Save current state as Mode
10. Apply Mode
11. Restart Studio
12. Verify state restored correctly

**Stop condition:** If ANY step fails, STOP and report immediately.

### Reporting
Use `docs/BETA_FEEDBACK_TEMPLATE.md` to report:
- Which step failed
- Expected vs. actual behavior
- Screenshots (console errors)
- Diagnostics bundle

---

## Running Full Test Suite

**Prerequisite:** Golden Path passed.

### Execution (30-45 minutes)
Follow `docs/BETA_CHECKLIST_v2.1.2.md` → Parts 1-3.

**Part 1: Fresh User Flow (30-45 min)**
- 10 test cases covering basic functionality

**Part 2: Power User Flow (15-20 min)**
- 10 test cases covering advanced features (modes, pinned models, etc.)

**Part 3: Stress Tests (5-10 min)**
- 3 test cases covering edge cases and performance

### Reporting
For each failed test:
1. Note test case number and name
2. Fill out feedback template
3. Attach screenshots and diagnostics
4. Submit via Discord or GitHub

---

## Feedback Classification

### BLOCKER (P0)
**Definition:** Prevents core functionality. App unusable.

**Examples:**
- App crashes on launch
- Cannot send messages
- API keys exposed in UI or diagnostics
- Data loss (modes disappear)
- Security vulnerability

**Action:** Fix immediately, tag patch release within 24-48h.

---

### IMPORTANT (P1)
**Definition:** Major feature broken, workaround exists.

**Examples:**
- Model switching fails (but can reload page)
- Settings don't persist (but can re-enter)
- Smart Suggestions never appear (but app usable)
- Pinned models disappear after restart

**Action:** Fix within 3-7 days, include in next patch release.

---

### NICE-TO-HAVE (P2)
**Definition:** Minor issue, cosmetic, or feature request.

**Examples:**
- UI glitch (text overlapping)
- Slow performance (non-blocking)
- Feature request ("Add dark mode")
- Typo in docs

**Action:** Document for future release. Do NOT fix during beta.

---

## QA Lead Responsibilities

### Daily Tasks
1. **Monitor Discord #beta-testing** — Respond to questions
2. **Review GitHub issues** — Triage new feedback
3. **Track progress** — Update tester completion status
4. **Identify blockers** — Escalate critical issues

### Triage Process
For each piece of feedback:
1. **Classify:** BLOCKER / IMPORTANT / NICE-TO-HAVE
2. **Reproduce:** Can you replicate the issue?
3. **Root cause:** What's the underlying problem?
4. **Propose fix:** Minimal change, specific files
5. **Risk assess:** Could this break other features?
6. **Create PR:** Small, isolated, with test steps

### Communication
- **Testers:** Thank them, confirm receipt of feedback
- **Team:** Daily status update (blockers, progress)
- **Public:** Transparent about issues, ETAs for fixes

---

## Fix Workflow

### Step 1: Validate Bug Report
- Can you reproduce it?
- Is it a duplicate of existing issue?
- Is classification correct (BLOCKER vs. IMPORTANT)?

### Step 2: Propose Fix
**Template:**
```markdown
## Issue
[Brief description]

## Root Cause
[What's broken]

## Proposed Fix
**Files to change:**
- src/path/to/file.tsx (line 42: change X to Y)
- docs/path/to/doc.md (clarify instruction)

**Risk Assessment:**
- Low: Isolated change, no dependencies
- Medium: Touches shared component
- High: Changes core logic

**Test Steps:**
1. Fresh install
2. Run Golden Path step X
3. Verify fix works
4. Check no regression in steps Y, Z
```

### Step 3: Create PR
- Branch name: `fix/v2.1.x-issue-description`
- Title: `Fix: [brief description] (v2.1.x)`
- Body: Link to issue, include test steps
- Labels: `bug`, `v2.1.x`, severity label

### Step 4: Verify
- ✅ Build passes
- ✅ Manual test passes
- ✅ No new console errors
- ✅ Regression test (nearby features still work)

### Step 5: Tag Patch Release
- After merge: `git tag v2.1.x -m "Fix: [issue]"`
- Push tag: `git push --tags`
- Update CHANGELOG.md

---

## Hardening PR Checklist

Before merging any fix:

- [ ] Issue is BLOCKER or IMPORTANT (not NICE-TO-HAVE)
- [ ] Fix is minimal (smallest possible change)
- [ ] No new features added
- [ ] No scope expansion
- [ ] Build passes (`npm run build`)
- [ ] Manual smoke test completed
- [ ] Regression test completed (check related features)
- [ ] Console errors checked (none added)
- [ ] PR description includes test steps
- [ ] Risk assessment documented

---

## Stop Conditions

### When to STOP and escalate:

1. **New feature requested**
   - Log in "Future Enhancements" doc
   - Respond: "Great idea! We're only fixing bugs in beta. Added to backlog for future release."

2. **Architecture change needed**
   - Stop immediately
   - Document the issue
   - Ask project lead: "This fix requires [architecture change]. Proceed or defer?"

3. **User confusion can be solved with docs**
   - Prefer docs over code changes
   - Update TESTER_INSTRUCTIONS.md or BETA_CHECKLIST.md
   - Add FAQ entry

4. **Feedback is unclear**
   - Ask tester for clarification
   - Request screenshots, diagnostics, reproduction steps

---

## Success Metrics

### Beta Completion
- ✅ 5+ testers complete Golden Path
- ✅ 3+ testers complete full test suite
- ✅ Zero BLOCKER issues remaining
- ✅ <3 IMPORTANT issues remaining (or all fixed)

### Stability
- ✅ Build passes on all platforms (Mac, Windows, Linux)
- ✅ No secrets exposed in diagnostics
- ✅ No console errors during normal use
- ✅ State persists across restarts

### Readiness for Public Release
- ✅ Documentation accurate and complete
- ✅ Known issues documented
- ✅ Release notes prepared
- ✅ Community announcement drafted

---

## Post-Beta Actions

After beta phase completes:

1. **Thank testers** — Public shoutout, Discord announcement
2. **Tag v2.2.0** — Public release version
3. **Announce release** — Discord, Twitter, GitHub, docs.openclaw.ai
4. **Monitor feedback** — Continue tracking issues, but lower urgency
5. **Plan next phase** — Only after explicit decision to proceed

---

## Contact

**QA Lead:** Aurora (AI)  
**Project Lead:** Eric (@outsourc_e)  
**Discord:** https://discord.com/invite/clawd (#beta-testing)  
**GitHub:** https://github.com/outsourc-e/openclaw-studio/issues

---

**This guide is your playbook for Phase 6. Follow it strictly.** 🎯
