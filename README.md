# Broadcast Popup Studio

## 日本語

Broadcast Popup Studio は、音声ファイルとタイムスタンプ付き字幕から、ポップアップ風の字幕動画を作成するデスクトップアプリです。

字幕ファイル、CSV、音声、背景画像を読み込み、アプリ内で字幕を確認・編集しながら、MP4 動画として書き出せます。通常の利用では Node.js や FFmpeg を別途インストールする必要はありません。

## English

Broadcast Popup Studio is a desktop app for creating popup-style subtitle videos from an audio file and timed subtitles.

You can import subtitle files, CSV files, audio, and background images, review and edit the text inside the app, then export the result as an MP4 video. Regular users do not need to install Node.js or FFmpeg separately.

## 中文

Broadcast Popup Studio 是一款桌面软件，用来把音频文件和带时间轴的字幕做成弹窗字幕视频。

用户可以导入字幕文件、CSV、音频和背景图片，在软件里预览、校对和调整字幕，然后导出 MP4 视频。普通用户使用桌面版时，不需要额外安装 Node.js 或 FFmpeg。

## ダウンロード / Download / 下载

### 日本語

最新のテスト版は GitHub Releases からダウンロードできます。

- [macOS Apple Silicon `.dmg`](https://github.com/AsaruCC2/Broadcast-Popup-Studio/releases/download/desktop/Broadcast-Popup-Studio-0.1.0-mac-arm64.dmg)
- [Windows x64 `.exe`](https://github.com/AsaruCC2/Broadcast-Popup-Studio/releases/download/desktop/Broadcast-Popup-Studio-Setup-0.1.0-win-x64.exe)

現在のビルドはコード署名を行っていません。初回起動時に macOS または Windows のセキュリティ警告が表示される場合があります。
各プラットフォームのテスト版は、更新タイミングが異なる場合があります。

### English

The latest test build is available from GitHub Releases.

- [macOS Apple Silicon `.dmg`](https://github.com/AsaruCC2/Broadcast-Popup-Studio/releases/download/desktop/Broadcast-Popup-Studio-0.1.0-mac-arm64.dmg)
- [Windows x64 `.exe`](https://github.com/AsaruCC2/Broadcast-Popup-Studio/releases/download/desktop/Broadcast-Popup-Studio-Setup-0.1.0-win-x64.exe)

The current builds are not code-signed. macOS or Windows may show a security warning the first time the app is opened.
Test builds for each platform may be updated on different schedules.

### 中文

最新测试版可以从 GitHub Releases 下载。

- [macOS Apple Silicon `.dmg`](https://github.com/AsaruCC2/Broadcast-Popup-Studio/releases/download/desktop/Broadcast-Popup-Studio-0.1.0-mac-arm64.dmg)
- [Windows x64 `.exe`](https://github.com/AsaruCC2/Broadcast-Popup-Studio/releases/download/desktop/Broadcast-Popup-Studio-Setup-0.1.0-win-x64.exe)

当前构建还没有做代码签名。第一次打开时，macOS 或 Windows 可能会显示安全提醒。
不同平台的测试包可能会按不同节奏更新。

## 主な機能 / Main Features / 主要功能

### 日本語

- 音声ファイルを読み込んで字幕タイミングをプレビュー
- `.srt` / `.vtt` / `.sbv` / `.txt` のタイムスタンプ付き字幕を読み込み
- 作成済みの `.csv` 字幕ファイルを直接読み込み
- 原文と表示字幕をアプリ内で編集
- 表示字幕のみをポップアップ風カードとして動画に配置
- 字幕サイズをプレビュー画面で調整
- 字幕全体の表示タイミングを秒単位で補正
- 動画比率を `16:9` / `9:16` / `1:1` / `4:5` から選択
- デフォルトのダークグリッド背景、単色背景、画像背景を選択
- 背景画像の拡大率を調整
- 字幕スタイルを `Broadcast Card` / `Popup Note` から選択
- 書き出し中の進捗、残り時間、キャンセルを表示
- 書き出し前に保存先を選択
- 繁体字中国語、日本語、英語の UI 表示に対応

### English

- Import an audio file and preview subtitle timing
- Import timed subtitle files: `.srt`, `.vtt`, `.sbv`, `.txt`
- Import prepared `.csv` subtitle files directly
- Edit original text and display subtitles inside the app
- Render only the display subtitle as a popup-style card
- Adjust subtitle size from the preview panel
- Shift all subtitle timing forward by seconds when needed
- Choose video ratio: `16:9`, `9:16`, `1:1`, or `4:5`
- Choose the default dark grid background, a solid color, or an image background
- Adjust the scale of an imported background image
- Choose subtitle style: `Broadcast Card` or `Popup Note`
- Show export progress, estimated remaining time, and cancel control
- Choose the output save location before export
- UI language support for Traditional Chinese, Japanese, and English

### 中文

- 导入音频文件并预览字幕时间轴
- 支持 `.srt` / `.vtt` / `.sbv` / `.txt` 时间轴字幕
- 支持直接导入整理好的 `.csv` 字幕文件
- 在软件内编辑原文和最终显示字幕
- 视频画面只显示弹窗式字幕卡片
- 在预览界面调整字幕大小
- 可以按秒调整字幕整体提前时间
- 支持选择视频比例：`16:9` / `9:16` / `1:1` / `4:5`
- 支持默认深色网格背景、纯色背景、图片背景
- 支持调整背景图片大小
- 支持字幕样式：`广播卡片` / `弹窗便签`
- 导出时显示进度、剩余时间，并支持中止导出
- 导出前可以选择保存位置
- 支持繁体中文、日语、英语三种界面语言

## 基本的な使い方 / Basic Workflow / 基本使用流程

### 日本語

1. Broadcast Popup Studio を起動します。
2. 字幕ファイルまたは CSV ファイルを読み込みます。
3. 音声ファイルを読み込みます。
4. 必要に応じて字幕の表示文を編集します。
5. プレビューで音声と字幕のタイミングを確認します。
6. 字幕サイズ、タイミング補正、動画比率、背景、字幕スタイルを調整します。
7. `Export Video` を押し、保存先を選んで MP4 を書き出します。

### English

1. Open Broadcast Popup Studio.
2. Import a subtitle file or CSV file.
3. Import an audio file.
4. Edit the display subtitle text if needed.
5. Preview the timing between the audio and subtitles.
6. Adjust subtitle size, timing offset, video ratio, background, and subtitle style.
7. Click `Export Video`, choose a save location, and export an MP4 file.

### 中文

1. 打开 Broadcast Popup Studio。
2. 导入字幕文件或 CSV 文件。
3. 导入音频文件。
4. 根据需要编辑最终显示的字幕文本。
5. 在预览里确认音频和字幕是否同步。
6. 调整字幕大小、字幕提前时间、视频比例、背景和字幕样式。
7. 点击 `导出视频`，选择保存位置，导出 MP4 文件。

## 対応ファイル / Supported Input / 支持文件

### 日本語

| 種類 | 対応形式 |
| --- | --- |
| 字幕 | `.srt`, `.vtt`, `.sbv`, `.txt`, `.csv` |
| 音声 | `.mp3`, `.m4a`, `.wav` など FFmpeg が読み込める一般的な音声形式 |
| 背景画像 | `.png`, `.jpg`, `.jpeg`, `.webp` |
| 書き出し | `.mp4` |

### English

| Type | Supported formats |
| --- | --- |
| Subtitles | `.srt`, `.vtt`, `.sbv`, `.txt`, `.csv` |
| Audio | `.mp3`, `.m4a`, `.wav`, and common FFmpeg-readable audio formats |
| Background images | `.png`, `.jpg`, `.jpeg`, `.webp` |
| Export | `.mp4` |

### 中文

| 类型 | 支持格式 |
| --- | --- |
| 字幕 | `.srt`, `.vtt`, `.sbv`, `.txt`, `.csv` |
| 音频 | `.mp3`, `.m4a`, `.wav` 等 FFmpeg 可读取的常见音频格式 |
| 背景图片 | `.png`, `.jpg`, `.jpeg`, `.webp` |
| 导出 | `.mp4` |

## 字幕と CSV / Subtitle And CSV Format / 字幕与 CSV

### 日本語

通常の字幕ファイルを読み込む場合は、`.srt`、`.vtt`、`.sbv`、またはタイムスタンプ付き `.txt` を選択できます。

CSV を直接読み込む場合は、以下の形式を推奨します。

```csv
start,end,ja,zh,speaker
00:00:00.600,00:00:03.300,Original line,Displayed subtitle,NARRATOR
```

`ja` は原文、`zh` は動画に表示する字幕として扱われます。互換性のために `translation`、`subtitle`、`text` などの列名も読み込みます。

### English

For standard subtitle files, you can import `.srt`, `.vtt`, `.sbv`, or timestamped `.txt`.

For direct CSV import, the recommended format is:

```csv
start,end,ja,zh,speaker
00:00:00.600,00:00:03.300,Original line,Displayed subtitle,NARRATOR
```

`ja` is treated as the original text, and `zh` is treated as the subtitle displayed in the video. For compatibility, the app also accepts column names such as `translation`, `subtitle`, and `text`.

### 中文

普通字幕文件可以导入 `.srt`、`.vtt`、`.sbv`，或带时间戳的 `.txt`。

如果直接导入 CSV，推荐格式如下：

```csv
start,end,ja,zh,speaker
00:00:00.600,00:00:03.300,Original line,Displayed subtitle,NARRATOR
```

`ja` 会作为原文，`zh` 会作为视频里最终显示的字幕。为了兼容不同文件，软件也支持读取 `translation`、`subtitle`、`text` 等列名。

## 画面設定 / Visual Settings / 画面设置

### 日本語

Broadcast Popup Studio では、同じ音声と字幕から複数の見た目を試せます。

- `16:9`: 横長動画向け
- `9:16`: スマートフォン向けの縦長動画
- `1:1`: 正方形動画
- `4:5`: 縦寄りのソーシャル投稿向け

背景は、デフォルトのダークグリッド、単色、画像から選択できます。画像背景は画面に合わせて表示され、必要に応じて拡大率を調整できます。

### English

Broadcast Popup Studio lets you try different visual directions from the same audio and subtitles.

- `16:9`: landscape video
- `9:16`: vertical mobile video
- `1:1`: square video
- `4:5`: portrait-leaning social video

The background can be the default dark grid, a solid color, or an imported image. Image backgrounds are fitted to the video canvas, and their scale can be adjusted.

### 中文

Broadcast Popup Studio 可以让同一份音频和字幕尝试不同画面效果。

- `16:9`：横屏视频
- `9:16`：手机竖屏视频
- `1:1`：正方形视频
- `4:5`：偏竖版社交平台视频

背景可以选择默认深色网格、纯色，或导入图片。图片背景会适配画面，也可以继续调整显示大小。

## プライバシーとローカルファイル / Privacy And Local Files / 隐私与本机文件

### 日本語

このリポジトリには、実際の音声素材、完成動画、個人用字幕、背景画像は含まれていません。

通常のアプリ利用では、読み込んだ素材はユーザーのコンピューター上で処理されます。公開リポジトリにはアプリのソースコードと設定のみを置く方針です。

GitHub に含めないファイルの例：

```text
input/audio.*
input/background.*
input/script.csv
output/
node_modules/
release/
.DS_Store
```

### English

This repository does not include real audio material, finished videos, personal subtitle files, or background images.

During normal app usage, imported materials are processed on the user's own computer. The public repository is intended to contain only the app source code and project configuration.

Examples of files excluded from GitHub:

```text
input/audio.*
input/background.*
input/script.csv
output/
node_modules/
release/
.DS_Store
```

### 中文

这个仓库不包含真实音频素材、完成视频、个人字幕文件或背景图片。

正常使用桌面软件时，导入的素材会在用户自己的电脑上处理。公开仓库只保存软件源码和项目配置。

不会上传到 GitHub 的文件示例：

```text
input/audio.*
input/background.*
input/script.csv
output/
node_modules/
release/
.DS_Store
```

## ソースからビルド / Build From Source / 从源码构建

### 日本語

一般ユーザーはインストーラー版の利用を推奨します。開発者がデスクトップアプリをソースから起動・ビルドする場合は、Node.js が必要です。

```bash
npm install
npm run desktop
```

macOS 版を作成する場合：

```bash
npm run dist:mac
```

Windows 版を作成する場合：

```bash
npm run dist:win
```

生成物は `release/` に出力されます。

### English

Regular users should use the installer build. Developers who want to run or build the desktop app from source need Node.js.

```bash
npm install
npm run desktop
```

Build for macOS:

```bash
npm run dist:mac
```

Build for Windows:

```bash
npm run dist:win
```

Build outputs are written to `release/`.

### 中文

普通用户建议直接使用安装包。开发者如果想从源码启动或打包桌面软件，需要安装 Node.js。

```bash
npm install
npm run desktop
```

打包 macOS 版本：

```bash
npm run dist:mac
```

打包 Windows 版本：

```bash
npm run dist:win
```

构建结果会输出到 `release/`。

## プロジェクト構成 / Project Structure / 项目结构

```text
broadcast-popup-studio/
├── index.html
├── app.js
├── styles.css
├── server.mjs
├── desktop/
│   ├── main.mjs
│   └── preload.cjs
├── scripts/
│   ├── render.mjs
│   ├── timed-text-to-csv.mjs
│   └── create-radio-icon.mjs
├── build/
│   ├── icon.png
│   └── icon-256.png
├── package.json
├── package-lock.json
├── CHANGELOG.md
├── LICENSE
└── .github/workflows/build-desktop.yml
```

## 今後の予定 / Roadmap / 后续计划

### 日本語

- 字幕スタイルのプリセットを追加
- 画面テーマの選択肢を追加
- 書き出し前プレビューを改善
- macOS / Windows の配布フローを改善
- より分かりやすいテンプレートを追加

### English

- Add more subtitle style presets
- Add more visual themes
- Improve pre-export preview
- Improve macOS / Windows distribution flow
- Add clearer starter templates

### 中文

- 增加更多字幕样式预设
- 增加更多画面主题
- 优化导出前预览
- 优化 macOS / Windows 发布流程
- 增加更容易上手的模板

## 紹介動画 / Introduction Videos / 介绍视频

### 日本語

本日、日本語版と中国語版の紹介動画を公開予定です。

### English

Japanese and Chinese introduction videos are scheduled for release today.

### 中文

今日会发布中文和日文介绍视频。

## 更新履歴 / Changelog / 更新日志

### 日本語

詳しい更新内容は [CHANGELOG.md](./CHANGELOG.md) を参照してください。

### English

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

### 中文

详细更新记录见 [CHANGELOG.md](./CHANGELOG.md)。

## ライセンス / License / 许可证

MIT
