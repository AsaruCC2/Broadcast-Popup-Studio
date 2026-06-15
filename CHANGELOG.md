# 更新履歴 / Changelog / 更新日志

## v0.1.0 - デスクトップアプリプレビュー / Desktop App Preview / 桌面软件预览版

### 日本語

Broadcast Popup Studio の最初のデスクトップアプリ版です。音声ファイルとタイムスタンプ付き字幕から、ポップアップ風の字幕動画を作成できます。

主な内容：

- macOS / Windows 向けの Electron デスクトップアプリ構成を追加
- FFmpeg をアプリに同梱できるように設定
- 字幕ファイルと CSV の読み込みに対応
- 音声ファイルの読み込みと字幕タイミングのプレビューに対応
- MP4 動画の書き出しに対応
- 書き出し前の保存先選択に対応
- 書き出し中の進捗、残り時間、キャンセル表示を追加
- `.srt` / `.vtt` / `.sbv` / `.txt` / `.csv` の字幕入力に対応
- 字幕サイズ、字幕タイミング補正、動画比率、背景、字幕スタイルの調整に対応
- デフォルトのダークグリッド背景、単色背景、画像背景に対応
- 背景画像の表示サイズ調整に対応
- モバイル視聴でも読みやすいカード型字幕レンダリングを追加
- 下部の視覚信号を控えめなデザインに調整
- アプリアイコンを収音機モチーフに変更
- 繁体字中国語、日本語、英語の UI 表示に対応
- GitHub Actions による macOS / Windows ビルド workflow を追加

### English

This is the first desktop app preview of Broadcast Popup Studio. It creates popup-style subtitle videos from an audio file and timed subtitles.

Highlights:

- Added Electron desktop app structure for macOS and Windows
- Configured bundled FFmpeg support
- Added subtitle file and CSV import
- Added audio import and subtitle timing preview
- Added MP4 video export
- Added output save-location selection before export
- Added export progress, estimated remaining time, and cancel display
- Added subtitle input support for `.srt`, `.vtt`, `.sbv`, `.txt`, and `.csv`
- Added controls for subtitle size, timing offset, video ratio, background, and subtitle style
- Added default dark grid, solid color, and image background options
- Added background image scale adjustment
- Added card-style subtitle rendering for better mobile readability
- Adjusted the lower visual signal to be quieter and less distracting
- Updated the app icon to a radio-inspired design
- Added UI language support for Traditional Chinese, Japanese, and English
- Added GitHub Actions workflow for macOS / Windows builds

### 中文

这是 Broadcast Popup Studio 的第一个桌面软件预览版本。它可以用音频文件和带时间轴的字幕制作弹窗字幕视频。

主要内容：

- 增加 macOS / Windows 的 Electron 桌面软件结构
- 配置内置 FFmpeg
- 支持导入字幕文件和 CSV
- 支持导入音频并预览字幕时间轴
- 支持导出 MP4 视频
- 支持导出前选择保存位置
- 增加导出进度、剩余时间和中止显示
- 支持 `.srt` / `.vtt` / `.sbv` / `.txt` / `.csv` 字幕输入
- 支持调整字幕大小、字幕提前时间、视频比例、背景和字幕样式
- 支持默认深色网格背景、纯色背景和图片背景
- 支持调整背景图片显示大小
- 增加更适合移动端观看的卡片式字幕渲染
- 将底部视觉信号调整得更克制，减少干扰
- 将应用图标改为收音机风格
- 支持繁体中文、日语、英语三种界面语言
- 增加 GitHub Actions macOS / Windows 构建流程
