# OpenClaw Studio

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Platforms">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

**VSCode for AI Agents** — A beautiful desktop interface for [OpenClaw Gateway](https://github.com/anthropics/openclaw).

OpenClaw Studio gives you a visual command center for your AI agents: monitor sessions, browse files, run terminals, view activity logs, and chat with agents — all from one unified interface.

## ✨ Features

- **📊 Dashboard** — Real-time Gateway status, quick actions, recent sessions, cost tracking
- **💬 Chat Interface** — Conversational interface for agent interactions
- **📁 File Explorer** — Browse and edit workspace files with Monaco editor
- **🖥️ Terminal** — Full terminal access to agent workspace
- **📜 Activity Logs** — Stream of agent events and tool invocations
- **🌐 Browser Control** — View and control agent browser sessions
- **⏰ Cron Jobs** — Schedule and manage automated tasks
- **🧠 Memory View** — Inspect agent memory and context
- **🔧 Skills Manager** — Browse and configure agent capabilities
- **⚙️ Settings** — Configure Gateway connection and preferences

## 🚀 Quick Start

### Prerequisites

- [OpenClaw Gateway](https://github.com/anthropics/openclaw) running locally or remotely
- macOS 10.15+, Windows 10+, or Linux

### Installation

1. Download the latest release for your platform from [Releases](https://github.com/outsourc-e/openclaw-studio/releases)
2. Install:
   - **macOS**: Open `.dmg`, drag to Applications
   - **Windows**: Run the installer
   - **Linux**: Make AppImage executable and run
3. Launch OpenClaw Studio
4. Connect to your Gateway (default: `localhost:6118`)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/outsourc-e/openclaw-studio.git
cd openclaw-studio

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Tauri Desktop Build

```bash
# Install Tauri CLI
npm install -g @tauri-apps/cli

# Build desktop app (requires Rust)
npm run tauri build
```

## 📸 Screenshots

*Coming soon*

## 🏗️ Architecture

- **Frontend**: React 19 + TanStack Router + TanStack Query
- **Styling**: Tailwind CSS 4
- **Editor**: Monaco Editor
- **Terminal**: xterm.js
- **Desktop**: Tauri 2.x
- **Build**: Vite 7

## 🔌 Gateway Connection

OpenClaw Studio connects to your Gateway via:
- **HTTP API**: `http://localhost:6118` (status, config)
- **WebSocket**: `ws://localhost:6118` (real-time events)

Configure the Gateway URL in Settings or set the `GATEWAY_URL` environment variable.

## 🗺️ Roadmap

- [ ] Multi-agent swarm visualization
- [ ] Session recording and playback
- [ ] Plugin system for custom views
- [ ] Cloud deployment panel
- [ ] Team collaboration features

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Credits

Built with ❤️ by [@outsourc_e](https://twitter.com/outsourc_e)

Part of the [OpenClaw](https://github.com/anthropics/openclaw) ecosystem.

Learn more at [buildingthefuture.io](https://buildingthefuture.io)
