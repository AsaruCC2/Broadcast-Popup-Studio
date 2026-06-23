# 更新履歴 / Changelog / 更新日志

## 2026-06-23 - 開発メモ / Development Notes / 开发记录

### 日本語

現在の開発状況と、次のデスクトップ版更新に向けた作業メモです。

主な内容：

- 時間指定背景画像を追加し、特定の時間帯だけ背景画像を表示できるようにした
- 時間指定背景の書き出し処理を最適化し、画像が表示される区間だけ処理するように調整
- FFmpeg の実際の処理速度を使って、書き出し残り時間の推定を改善
- README に現在の macOS / Windows テスト状況を追記
- macOS 版は基本的な制作フローに利用可能。ただし、時間指定背景を多数追加した場合は書き出しが遅くなる場合がある
- Windows 版は一部環境で問題を確認中。テスト機材の制限により、修正と検証に時間がかかる見込み
- 紹介動画の案内文を「近日公開予定」に更新
- 今後の軽量テスト用として、ローカルブラウザ版を最新の開発版に同期
- ローカルブラウザ版に、現在秒数表示と秒数指定ジャンプ機能を追加。時間指定背景の開始・終了位置を決めやすくするための改善

メモ：

この段階では、細かい UI 改善はまずローカルブラウザ版で検証し、ある程度まとまってからデスクトップ版に反映する方針。

### English

Current development notes toward the next desktop app update.

Highlights:

- Added timed background images that appear only during selected time ranges
- Optimized timed background rendering so each image is processed only for the time range where it appears
- Improved estimated remaining export time by using FFmpeg's reported processing speed
- Updated the README with the current macOS / Windows testing status
- The macOS build can be used for the core creation workflow, but exports may slow down when many timed background images are added
- The Windows build has known issues under investigation; fixes and verification may take longer because Windows test device access is limited
- Updated the introduction video section to say that videos will be published soon
- Synced the local browser version with the latest development version for lightweight testing
- Added a current-seconds display and jump-to-time control in the local browser version, making it easier to choose start and end times for timed backgrounds

Note:

Small UI improvements will be tested first in the local browser version, then rolled into the desktop app after enough changes accumulate.

### 中文

这是面向下一次桌面版更新的开发记录。

主要内容：

- 增加定时背景图片功能，可以让背景图只在指定时间段出现
- 优化定时背景导出逻辑，让每张图片只在实际显示的时间段参与处理
- 使用 FFmpeg 实际处理速度改进导出剩余时间估算
- 更新 README，说明目前 macOS / Windows 的测试状态
- macOS 版可以完成主要制作流程，但如果加入较多定时背景图片，导出可能会变慢
- Windows 版目前有部分问题正在确认中；由于测试设备有限，修复和验证会花费更长时间
- 将介绍视频部分更新为“不日公开，敬请期待”
- 将本地浏览器版同步到最新开发状态，作为以后轻量测试用版本
- 本地浏览器版新增当前秒数显示和按秒数跳转功能，方便设置定时背景的开始和结束时间

记录：

之后小 UI 改动会先在本地浏览器版测试，攒到一定程度后再合并进桌面版并打包更新。

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
