# Typro 源码编译指南

本文档面向开发者，介绍如何在 macOS、Linux、Windows 三个平台上从源码编译、开发和打包 Typro。

---

## 目录

- [技术架构](#技术架构)
- [通用前置条件](#通用前置条件)
- [macOS 环境](#macos-环境)
- [Linux 环境](#linux-环境)
- [Windows 环境](#windows-环境)
- [项目结构](#项目结构)
- [开发工作流](#开发工作流)
- [打包与分发](#打包与分发)
- [交叉编译说明](#交叉编译说明)
- [常见问题](#常见问题)
- [依赖说明](#依赖说明)

---

## 技术架构

```
Typro
├── Electron 35          — 桌面应用外壳，负责窗口、菜单、IPC
│   ├── Main Process     — Node.js 进程，处理文件 I/O、对话框、协议注册
│   ├── Preload Script   — contextBridge 安全桥接层
│   └── Renderer Process — Chromium 渲染进程，运行 React UI
├── electron-vite 3      — 构建工具链（Vite 6 + Electron 集成）
├── React 19 + TypeScript — UI 框架
├── CodeMirror 6         — 编辑器核心
├── markdown-it 14       — Markdown 渲染
├── Shiki 3              — 代码语法高亮（异步）
├── KaTeX 0.16           — 数学公式渲染
└── Zustand 5            — 轻量状态管理
```

构建产物结构：

```
out/
├── main/index.js        — 编译后的主进程
├── preload/index.js     — 编译后的预加载脚本
└── renderer/            — 编译后的渲染器（HTML + JS + CSS）

dist/                    — electron-builder 打包输出（安装包）
```

---

## 通用前置条件

以下工具在三个平台上都需要安装：

### Node.js

要求版本：**≥ 20.0.0**（推荐 LTS 版本 22.x）

验证安装：
```bash
node --version   # 应输出 v20.x.x 或更高
npm --version    # 应输出 10.x.x 或更高
```

推荐使用 **nvm**（macOS/Linux）或 **nvm-windows** 管理多版本 Node.js：

```bash
# macOS / Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22

# Windows（PowerShell，以管理员身份运行）
# 从 https://github.com/coreybutler/nvm-windows/releases 下载安装包
nvm install 22.18.0
nvm use 22.18.0
```

### Git

```bash
git --version   # 任意版本均可
```

### 克隆仓库

```bash
git clone https://github.com/your-org/typro.git
cd typro
```

---

## macOS 环境

### 系统要求

| 项目 | 要求 |
| --- | --- |
| macOS 版本 | 13 Ventura 及以上（推荐） |
| 架构 | Intel (x64) / Apple Silicon (arm64) 均支持 |
| Xcode Command Line Tools | 必须 |
| Node.js | ≥ 20.0.0 |
| 磁盘空间（含 node_modules） | ≈ 2 GB |

### 安装依赖

**1. Xcode Command Line Tools**

```bash
xcode-select --install
```

弹出对话框后点击"安装"，等待完成（约 5 分钟）。

验证：
```bash
xcode-select -p
# 输出示例：/Library/Developer/CommandLineTools
```

**2. Node.js（通过 nvm）**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc          # 或 source ~/.bash_profile
nvm install 22
nvm alias default 22
```

**3. 安装项目依赖**

```bash
cd typro
npm install
```

> **说明**：Electron 在 `npm install` 时会自动下载对应平台的预编译二进制文件（约 150 MB）。如网络较慢，可配置镜像：
> ```bash
> export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
> npm install
> ```

### 开发运行

```bash
npm run dev
```

应用会在几秒内启动，编辑器代码修改后渲染进程自动热重载（HMR）。

主进程和预加载脚本修改后需重启（`Ctrl+C` 后重新运行 `npm run dev`）。

### 构建生产版本

**仅编译（不打包安装包）：**

```bash
npm run build
# 输出到 out/ 目录
```

**打包 macOS 安装包：**

```bash
npm run build:mac
```

输出到 `dist/` 目录：
- `Typro-1.0.0-arm64.dmg` — Apple Silicon 安装包
- `Typro-1.0.0-x64.dmg` — Intel 安装包
- `Typro-1.0.0-arm64-mac.zip` — Apple Silicon 免安装版
- `Typro-1.0.0-x64-mac.zip` — Intel 免安装版

**构建特定架构：**

```bash
# 仅 Apple Silicon
npx electron-builder --mac --arm64

# 仅 Intel
npx electron-builder --mac --x64

# 通用包（Fat Binary，同时支持两种架构）
npx electron-builder --mac --universal
```

### macOS 代码签名与公证（可选，正式发布需要）

不签名的应用在 macOS 12+ 上打开时会触发"无法验证开发者"警告。

**前置条件：**
- Apple Developer 账号（年费 $99）
- Xcode 已安装（非仅 Command Line Tools）
- 在 Keychain 中安装"Developer ID Application"证书

**配置签名：**

```bash
# 查看可用签名证书
security find-identity -v -p codesigning
```

在 `build/electron-builder.yml` 中添加：

```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  gatekeeperAssess: false
```

创建 `build/entitlements.mac.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
</dict>
</plist>
```

**公证（Notarize）：**

```bash
npm install --save-dev @electron/notarize

# 设置环境变量
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

npm run build:mac
```

在 `electron.vite.config.ts` 中配置公证钩子（参考 `@electron/notarize` 文档）。

---

## Linux 环境

### 系统要求

| 项目 | 要求 |
| --- | --- |
| 发行版 | Ubuntu 20.04+ / Debian 11+ / Fedora 36+ / Arch Linux |
| 架构 | x64（arm64 支持有限） |
| Node.js | ≥ 20.0.0 |
| 磁盘空间 | ≈ 2 GB |

### Ubuntu / Debian

**1. 安装系统依赖**

```bash
sudo apt update
sudo apt install -y \
  git \
  curl \
  build-essential \
  libgtk-3-dev \
  libnotify-dev \
  libasound2-dev \
  libcups2-dev \
  libdbus-glib-1-dev \
  libxtst-dev \
  libxss1 \
  libgconf-2-4 \
  libnss3 \
  libx11-xcb1
```

**2. 安装 Node.js（nvm）**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22
node --version   # v22.x.x
```

**3. 安装项目依赖**

```bash
cd typro
npm install
```

如遇网络问题，配置 npm 镜像：

```bash
npm config set registry https://registry.npmmirror.com
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install
```

**4. 开发运行**

```bash
npm run dev
```

> **注意**：在无桌面环境的服务器上（如 CI 环境），需要安装虚拟显示：
> ```bash
> sudo apt install -y xvfb
> export DISPLAY=:99
> Xvfb :99 -screen 0 1024x768x24 &
> npm run dev
> ```

**5. 打包**

```bash
npm run build:linux
```

输出到 `dist/` 目录：
- `Typro-1.0.0.AppImage` — 免安装可执行文件（推荐）
- `typro_1.0.0_amd64.deb` — Debian/Ubuntu 安装包

**运行 AppImage：**

```bash
chmod +x dist/Typro-1.0.0.AppImage
./dist/Typro-1.0.0.AppImage
```

**安装 deb 包：**

```bash
sudo dpkg -i dist/typro_1.0.0_amd64.deb
# 或
sudo apt install ./dist/typro_1.0.0_amd64.deb
```

### Fedora / RHEL / CentOS

**1. 安装系统依赖**

```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y \
  git \
  curl \
  gtk3-devel \
  libnotify-devel \
  alsa-lib-devel \
  cups-devel \
  dbus-glib-devel \
  libXtst-devel \
  libXScrnSaver-devel \
  nss \
  GConf2
```

**2. 安装 Node.js**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
```

**3. 后续步骤与 Ubuntu 相同**

```bash
npm install
npm run dev
npm run build:linux
```

打包额外生成 RPM 包，在 `build/electron-builder.yml` 中添加：

```yaml
linux:
  target:
    - AppImage
    - deb
    - rpm       # 添加此行
```

### Arch Linux

```bash
# 安装依赖
sudo pacman -S --needed \
  git curl base-devel \
  gtk3 libnotify alsa-lib \
  nss cups libxtst libxss

# 安装 nvm（通过 AUR）
yay -S nvm
echo 'source /usr/share/nvm/init-nvm.sh' >> ~/.bashrc
source ~/.bashrc
nvm install 22

# 项目依赖
npm install
npm run dev
```

### Linux 桌面集成（手动）

如需将开发版本集成到桌面启动器：

```bash
# 创建 .desktop 文件
cat > ~/.local/share/applications/typro.desktop << EOF
[Desktop Entry]
Name=Typro
Exec=/path/to/typro/node_modules/.bin/electron /path/to/typro/out/main/index.js
Icon=/path/to/typro/resources/icon.png
Type=Application
Categories=Office;TextEditor;
MimeType=text/markdown;text/plain;
EOF

update-desktop-database ~/.local/share/applications
```

---

## Windows 环境

### 系统要求

| 项目 | 要求 |
| --- | --- |
| Windows 版本 | Windows 10 (1903+) / Windows 11 |
| 架构 | x64 |
| Node.js | ≥ 20.0.0 |
| Visual Studio Build Tools | 必须（用于编译原生模块） |
| 磁盘空间 | ≈ 3 GB（含 Build Tools） |

### 安装依赖

**1. Node.js**

从 [nodejs.org](https://nodejs.org/en/download) 下载 Windows 安装包（`.msi`），选择 LTS 版本（22.x）。

安装时勾选 **"Automatically install the necessary tools"**，会自动安装 Chocolatey 和 Build Tools。

或使用 winget：

```powershell
winget install OpenJS.NodeJS.LTS
```

**2. Visual Studio Build Tools（若未自动安装）**

```powershell
# 以管理员身份运行 PowerShell
npm install --global windows-build-tools
```

或手动安装：
1. 下载 [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. 安装时勾选：**"Desktop development with C++"** 工作负载
3. 确保包含：MSVC v143、Windows 10/11 SDK、CMake

验证：

```powershell
npm config get msvs_version
# 若不对，手动设置：
npm config set msvs_version 2022
```

**3. Git**

```powershell
winget install Git.Git
# 或从 https://git-scm.com 下载
```

**4. 克隆仓库**

```powershell
git clone https://github.com/your-org/typro.git
cd typro
```

**5. 安装项目依赖**

以**普通权限**的 PowerShell 或命令提示符运行：

```powershell
npm install
```

> **网络问题**：若下载 Electron 超时，配置镜像：
> ```powershell
> $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
> npm install
> ```
> 或在用户目录创建 `.npmrc` 文件：
> ```
> electron_mirror=https://npmmirror.com/mirrors/electron/
> registry=https://registry.npmmirror.com
> ```

**6. 开发运行**

```powershell
npm run dev
```

**7. 打包 Windows 安装包**

```powershell
npm run build:win
```

输出到 `dist\` 目录：
- `Typro Setup 1.0.0.exe` — NSIS 安装包（推荐发布）
- `Typro 1.0.0.exe` — 便携版（无需安装）

**NSIS 安装包特性**（已在 `build/electron-builder.yml` 配置）：
- 可选择安装目录
- 创建桌面快捷方式
- 创建开始菜单快捷方式
- 支持静默安装：`"Typro Setup 1.0.0.exe" /S`

### Windows 代码签名（可选）

未签名的应用在 Windows 上会触发 SmartScreen 警告。

**前置条件：**
- EV 代码签名证书（从 DigiCert / Sectigo / GlobalSign 等 CA 购买）
- SignTool（已包含在 Windows SDK 中）

在 `build/electron-builder.yml` 中配置：

```yaml
win:
  certificateFile: path/to/certificate.p12
  certificatePassword: ${env.CERTIFICATE_PASSWORD}
  # 或使用证书指纹（推荐 CI/CD）
  certificateSha1: YOUR_CERT_SHA1_HASH
  signingHashAlgorithms:
    - sha256
```

CI 环境中使用环境变量：

```powershell
$env:CERTIFICATE_PASSWORD = "your-password"
npm run build:win
```

### Windows 注意事项

- 路径中**避免空格和非 ASCII 字符**，防止部分原生模块编译失败
- 建议使用 **PowerShell 7**（`pwsh`）而非旧版 Windows PowerShell
- 若使用 WSL2 开发，打包时需在 Windows 原生环境下执行（WSL2 无法生成 `.exe`）

---

## 项目结构

```
typro/
├── src/
│   ├── main/                        # Electron 主进程（Node.js）
│   │   ├── index.ts                 # 应用入口，BrowserWindow 创建
│   │   ├── menu.ts                  # 原生菜单定义
│   │   └── ipc/
│   │       ├── file.ts              # 文件 I/O、对话框、PDF 导出
│   │       ├── window.ts            # 窗口控制（最小化、最大化、关闭）
│   │       └── theme.ts             # 系统深浅色主题监听
│   │
│   ├── preload/
│   │   ├── index.ts                 # contextBridge 安全桥接
│   │   └── index.d.ts               # window.typro API 类型声明
│   │
│   └── renderer/                    # React 渲染器
│       ├── index.html               # HTML 入口
│       └── src/
│           ├── main.tsx             # React 挂载点
│           ├── App.tsx              # 根组件，菜单事件绑定
│           ├── store/
│           │   ├── editorStore.ts   # 编辑器状态（内容、文件路径、字数）
│           │   └── uiStore.ts       # UI 状态（主题、视图模式、侧边栏）
│           ├── components/
│           │   ├── layout/          # AppShell, TitleBar, StatusBar
│           │   ├── editor/          # MarkdownEditor, keymaps
│           │   ├── preview/         # MarkdownPreview
│           │   └── sidebar/         # Sidebar, TableOfContents, RecentFiles
│           ├── lib/
│           │   └── markdown/
│           │       ├── parser.ts    # markdown-it 实例 + 插件链 + KaTeX
│           │       └── shiki.ts     # Shiki 异步高亮初始化
│           └── styles/
│               └── global.css       # CSS 变量、主题定义、全局样式
│
├── build/
│   └── electron-builder.yml         # 打包配置（目标平台、图标、签名）
├── resources/                       # 应用图标（.icns / .ico / .png）
├── electron.vite.config.ts          # electron-vite 构建配置
├── tsconfig.json                    # TypeScript 根配置
├── tsconfig.node.json               # 主进程/预加载 TS 配置
├── tsconfig.web.json                # 渲染器 TS 配置
└── package.json
```

---

## 开发工作流

### 启动开发模式

```bash
npm run dev
```

`electron-vite dev` 会：
1. 编译主进程和预加载脚本（Vite SSR 模式）
2. 启动渲染器开发服务器（默认 `http://localhost:5173`）
3. 启动 Electron，加载开发服务器 URL

**热更新（HMR）：** 修改渲染器代码（`src/renderer/`）后浏览器自动刷新。
**主进程修改：** 修改 `src/main/` 或 `src/preload/` 后需重启 `npm run dev`。

### 类型检查

```bash
npm run typecheck
```

对主进程、预加载、渲染器三个 TypeScript 配置同时检查。

### 生产构建

```bash
npm run build
```

产物在 `out/` 目录。可用 `npm run preview` 以生产模式启动 Electron 进行验证：

```bash
npm run build && npm run preview
```

### 添加新依赖

**运行时依赖**（打包进应用）：

```bash
npm install some-package
```

**开发依赖**（仅构建时使用）：

```bash
npm install --save-dev some-package
```

> **重要**：Electron 主进程依赖的包必须是 CommonJS 或提供 CJS 格式，因为主进程在 Node.js CJS 上下文中运行。纯 ESM 包在主进程中会报错。

### 调试

**渲染进程**：开发模式下使用 `⌘⌥I` / `Ctrl+Shift+I` 打开 Chrome DevTools。

**主进程**：

```bash
# 以调试模式启动（VSCode 可附加调试器）
npm run dev -- --inspect
```

在 VSCode 中使用以下 `launch.json`：

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Main Process",
  "port": 5858,
  "restart": true
}
```

**日志**：主进程日志通过 `electron-log` 写入：
- macOS：`~/Library/Logs/typro/main.log`
- Linux：`~/.config/typro/logs/main.log`
- Windows：`%APPDATA%\typro\logs\main.log`

---

## 打包与分发

### 配置打包参数

编辑 `build/electron-builder.yml`：

```yaml
appId: com.yourorg.typro        # 应用唯一标识
productName: Typro               # 显示名称
copyright: Copyright © 2024 Your Name

# 应用图标（各平台需单独准备）
mac:
  icon: resources/icon.icns     # 需要 icns 格式
win:
  icon: resources/icon.ico      # 需要 ico 格式
linux:
  icon: resources/icon.png      # PNG，256×256 或更大
```

### 准备应用图标

推荐使用 1024×1024 PNG 源图，然后转换各平台格式：

**macOS（icns）：**

```bash
# 安装 iconutil（macOS 自带）
mkdir -p icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o resources/icon.icns
```

**Windows（ico）：**

```bash
# 使用 ImageMagick
convert icon.png -resize 256x256 resources/icon.ico

# 或使用在线工具：https://cloudconvert.com/png-to-ico
```

**Linux：**

```bash
cp icon.png resources/icon.png
```

### 执行打包

```bash
# macOS（在 macOS 上运行）
npm run build:mac

# Windows（在 Windows 上运行）
npm run build:win

# Linux（在 Linux 上运行）
npm run build:linux
```

### 版本号管理

修改 `package.json` 中的 `version` 字段，打包时自动应用到安装包文件名和应用标题栏。

语义化版本建议：
- `1.0.0` — 正式版
- `1.0.1` — 修复版
- `1.1.0` — 功能版
- `2.0.0` — 破坏性变更版

---

## 交叉编译说明

Electron 官方**不建议**在一个平台上编译另一个平台的安装包（尤其涉及原生模块时）。推荐使用 CI/CD 进行多平台构建。

### GitHub Actions 配置示例

创建 `.github/workflows/build.yml`：

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            platform: mac
          - os: windows-latest
            platform: win
          - os: ubuntu-latest
            platform: linux

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libnotify-dev libasound2-dev \
            libcups2-dev libdbus-glib-1-dev libxtst-dev libxss1 libnss3

      - name: Install npm dependencies
        run: npm ci
        env:
          ELECTRON_MIRROR: "https://github.com/electron/electron/releases/download/"

      - name: Build
        run: npm run build:${{ matrix.platform }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS 签名（可选）
          CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          # Windows 签名（可选）
          WIN_CSC_LINK: ${{ secrets.WIN_CERTIFICATE }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CERTIFICATE_PASSWORD }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: typro-${{ matrix.platform }}
          path: |
            dist/*.dmg
            dist/*.zip
            dist/*.exe
            dist/*.AppImage
            dist/*.deb
```

**使用方法：**

```bash
# 打标签触发构建
git tag v1.0.0
git push origin v1.0.0
```

---

## 常见问题

### npm install 报错：`node-gyp` 失败

**原因**：缺少编译原生模块所需的 C++ 构建工具。

**macOS 解决：**
```bash
xcode-select --install
```

**Linux 解决：**
```bash
sudo apt install build-essential   # Ubuntu/Debian
sudo dnf groupinstall "Development Tools"  # Fedora
```

**Windows 解决：**
```powershell
npm install --global windows-build-tools
# 或安装 Visual Studio Build Tools 2022
```

---

### Electron 下载超时

**解决：** 使用国内镜像

```bash
# 临时（命令行）
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install

# 永久（.npmrc 文件）
echo 'electron_mirror=https://npmmirror.com/mirrors/electron/' >> ~/.npmrc
```

---

### `electron-store` 报错：`Store is not a constructor`

**原因**：使用了 v10+ 版本，该版本为纯 ESM，无法在 Electron 主进程（CJS 上下文）中使用。

**解决：** 确保使用 v8.x

```bash
npm install electron-store@8.2.0
```

---

### Linux：应用启动后窗口空白

**原因**：Chromium 在某些 Linux 配置上需要 `--no-sandbox` 标志。

**解决：**

```bash
./dist/Typro-1.0.0.AppImage --no-sandbox
```

或在 `src/main/index.ts` 中添加：

```typescript
app.commandLine.appendSwitch('no-sandbox')
```

---

### Linux：字体显示异常

**解决：**
```bash
sudo apt install fonts-noto fonts-liberation
fc-cache -f -v
```

---

### Windows：打开时出现 SmartScreen 警告

**原因**：应用未签名。

**临时解决（用户侧）：** 点击"更多信息" → "仍要运行"。

**根本解决：** 购买代码签名证书并在构建时签名（参见[Windows 代码签名](#windows-代码签名可选)）。

---

### macOS：提示"无法验证开发者"

**用户侧解决：**
```bash
xattr -dr com.apple.quarantine /Applications/Typro.app
```

**根本解决：** 完成代码签名和公证（参见 [macOS 代码签名与公证](#macos-代码签名与公证可选正式发布需要)）。

---

### 端口 5173 被占用

```bash
# 查看占用进程
lsof -ti:5173

# electron-vite 会自动尝试下一个端口（5174、5175...）
npm run dev
```

---

### 内存占用过高

开发模式下 Electron + Vite 开发服务器会占用较多内存（约 500 MB - 1 GB），属于正常现象。生产打包后运行时内存约 150 - 300 MB。

---

## 依赖说明

### 运行时依赖关键版本约束

| 包 | 使用版本 | 约束原因 |
| --- | --- | --- |
| `electron-store` | **8.2.0（固定）** | v10+ 为纯 ESM，无法在 CJS 主进程中使用 |
| `markdown-it-anchor` | ^9.2.0 | 9.2.1 尚未发布（2026-04） |
| `electron` | ^35.1.2 | 需要 Node.js 22+ 配套 |
| `shiki` | ^3.2.2 | v1.x API 不兼容 |

### 升级依赖时注意

```bash
# 检查过时依赖
npm outdated

# 升级前测试（不要直接 npm update 全量升级）
npm install <package>@latest
npm run build  # 验证构建成功
npm run dev    # 验证运行正常
```

---

## 参与贡献

1. Fork 仓库
2. 创建特性分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'Add my feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 发起 Pull Request

请确保：
- `npm run typecheck` 通过（无 TypeScript 错误）
- `npm run build` 成功
- 新功能在三个平台上验证过

---

*最后更新：2026-04-01*
