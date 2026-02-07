# Release Setup Guide

## GitHub Actions Workflow

The release workflow is stored at `.github/workflows/release.yml` locally but requires a PAT with `workflow` scope to push.

### To Enable Automated Releases:

1. **Update GitHub PAT** — Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. **Add `workflow` scope** to the existing token
3. **Push the workflow**:
   ```bash
   git push studio main
   ```

4. **OR** — Manually create the workflow in GitHub:
   - Go to repo → Actions → New workflow → Set up a workflow yourself
   - Paste contents of `.github/workflows/release.yml`
   - Commit directly to main

### Creating a Release

Once the workflow is in place:

```bash
# Create and push a version tag
git tag v1.0.0
git push studio v1.0.0

# For beta releases
git tag v1.0.0-beta
git push studio v1.0.0-beta
```

The workflow will automatically:
- Build macOS (ARM + Intel), Windows, and Linux apps
- Create GitHub release with all artifacts
- Upload .dmg, .exe, and .AppImage files

### Manual Release (Fallback)

If GitHub Actions aren't available:

1. **Local build** (requires ~8GB RAM):
   ```bash
   npm run tauri build
   ```

2. **Find artifacts** at:
   - macOS: `src-tauri/target/release/bundle/dmg/`
   - Windows: `src-tauri/target/release/bundle/nsis/`
   - Linux: `src-tauri/target/release/bundle/appimage/`

3. **Create release manually** on GitHub and upload artifacts

## Current Status

- ✅ Repo created: https://github.com/outsourc-e/openclaw-studio
- ✅ Code pushed
- ✅ Topics set
- ⏳ Workflow needs PAT with `workflow` scope
- ⏳ First release pending workflow setup

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Commit version bump
- [ ] Create and push tag
- [ ] Verify GitHub Actions build succeeds
- [ ] Test downloaded artifact
- [ ] Announce release
