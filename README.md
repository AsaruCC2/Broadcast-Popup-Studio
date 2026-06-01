# Broadcast Popup Studio

Local-first tool for making audio clips with popup-style translated subtitles.

ローカル環境で、音声とタイムスタンプ付きテキストから翻訳字幕つき動画を作るための小さなツールです。  
一个本地运行的小工具，用来把音频和带时间轴的文本做成弹窗字幕视频。

## Overview / 概要

**日本語**

Broadcast Popup Studio は、タイムスタンプ付きテキストを CSV に変換し、翻訳文を編集しながら、ポップアップ風の字幕動画として書き出すためのローカルツールです。

ブラウザ上で字幕の確認、翻訳の修正、音声との同期プレビューを行い、最終的に MP4 動画を書き出します。オンラインサービスとして動かすことよりも、自分の素材をローカルで安全に扱うワークフローを重視しています。

**中文**

Broadcast Popup Studio 是一个面向音频翻译视频制作的本地工具。它可以把带时间戳的文本转换成 CSV，在浏览器里编辑译文、同步预览音频，并把最终效果导出为 MP4 视频。

这个项目不是在线服务，而是 local-first 的个人制作流程工具。真实音频、完整字幕和导出视频都保留在本地，GitHub 仓库只保存工具代码和示例数据。

## Features / 機能

**日本語**

- `.srt` / `.vtt` / `.txt` のタイムスタンプ付きテキストを CSV に変換
- 原文と翻訳文をブラウザ上で編集
- 音声を読み込んで字幕タイミングをプレビュー
- 翻訳字幕だけをポップアップ風に表示
- FFmpeg を使って MP4 動画を書き出し
- Mac では `.command` ファイルからダブルクリック起動

**中文**

- 支持把 `.srt` / `.vtt` / `.txt` 时间戳字幕转换成 CSV
- 可以在浏览器里编辑原文和译文
- 可以导入音频，预览字幕和音频的同步效果
- 视频画面只显示译文弹窗
- 使用 FFmpeg 导出 MP4 视频
- Mac 上可以通过 `.command` 文件双击启动

## Quick Start / 使い方

**日本語**

Mac では、プロジェクトフォルダ内の `open-studio.command` をダブルクリックするとローカルサーバーが起動します。

ターミナルから起動する場合：

```bash
npm run preview
```

その後、ブラウザで開きます：

```text
http://localhost:4173
```

初回はサンプル CSV をコピーして使えます：

```bash
cp input/script.example.csv input/script.csv
```

**中文**

在 Mac 上，可以直接双击项目里的 `open-studio.command` 启动本地工具。

也可以用终端启动：

```bash
npm run preview
```

然后在浏览器打开：

```text
http://localhost:4173
```

第一次使用时，可以先复制示例 CSV：

```bash
cp input/script.example.csv input/script.csv
```

> Do not open `index.html` directly for the full workflow. Saving files and rendering video require the local server.
>
> 完整流程不要直接双击 `index.html`。保存 CSV 和导出视频需要通过本地服务器运行。

## Workflow / 制作流程

**日本語**

1. タイムスタンプ付きテキストを用意します。
2. Web UI または `npm run convert` で CSV に変換します。
3. 翻訳欄に訳文を入力、または修正します。
4. 音声ファイルを読み込み、字幕タイミングをプレビューします。
5. `導出视频` ボタン、または `npm run render` で MP4 を書き出します。

**中文**

1. 准备带时间轴的文本。
2. 在网页里，或通过 `npm run convert` 转换成 CSV。
3. 在翻译字段里填写或校对译文。
4. 导入音频文件，预览字幕和音频是否同步。
5. 点击 `导出视频`，或运行 `npm run render` 导出 MP4。

## CSV Format / CSV フォーマット

The project uses `input/script.csv` as the working subtitle file.

このプロジェクトでは、作業用字幕ファイルとして `input/script.csv` を使います。  
项目使用 `input/script.csv` 作为当前工作字幕文件。

```csv
start,end,ja,zh,speaker
00:00:00.600,00:00:03.300,Original line text,Translated line text,SPEAKER
```

| Field | 日本語 | 中文 |
| --- | --- | --- |
| `start` | 字幕の開始時間 | 字幕开始时间 |
| `end` | 字幕の終了時間 | 字幕结束时间 |
| `ja` | 原文 | 原文 |
| `zh` | 翻訳文 | 译文 |
| `speaker` | 話者ラベル | 说话人标签 |

## Convert Timed Text / 字幕変換

**日本語**

`.srt` / `.vtt` / `.txt` を CSV に変換できます：

```bash
npm run convert -- input/timed-text.txt input/script.csv
```

**中文**

可以把 `.srt` / `.vtt` / `.txt` 转换成 CSV：

```bash
npm run convert -- input/timed-text.txt input/script.csv
```

Supported examples / 対応例 / 支持格式：

```text
00:00:01.200 --> 00:00:04.800 line text
[00:00:01.200] line text
00:00:01.200 line text
00:00:01.200
line text
```

## Render Video / 動画書き出し

**日本語**

字幕を `input/script.csv` に、音声を `input/audio.m4a` または `input/audio.mp3` に置いてから実行します：

```bash
npm run render
```

出力先：

```text
output/broadcast-popup.mp4
```

**中文**

把字幕放在 `input/script.csv`，音频放在 `input/audio.m4a` 或 `input/audio.mp3` 后运行：

```bash
npm run render
```

输出文件：

```text
output/broadcast-popup.mp4
```

You can also pass custom paths / 任意のパスも指定できます / 也可以指定路径：

```bash
npm run render -- input/script.csv path/to/audio.m4a output/my-video.mp4
```

Default render settings are `1920x1080, 30fps`.

デフォルトの書き出し設定は `1920x1080, 30fps` です。  
默认导出规格是 `1920x1080, 30fps`。

```bash
WIDTH=1280 HEIGHT=720 FPS=24 npm run render
```

## Local Files / ローカルファイル

**日本語**

このリポジトリには、実際の音声素材、完成動画、個人用の完全な字幕データは含めていません。

**中文**

这个仓库不包含真实广播音频、完整个人字幕文件或导出后的视频文件。

Ignored local files / GitHub に含めないファイル / 不上传到 GitHub 的文件：

```text
input/audio.*
input/script.csv
output/
node_modules/
.DS_Store
```

Example files included in the repository / リポジトリに含まれるサンプル / 仓库里保留的示例：

```text
input/timed-text.txt
input/script.example.csv
```

## Project Structure / 構成

```text
broadcast-popup-starter/
├── index.html
├── app.js
├── styles.css
├── server.mjs
├── scripts/
│   ├── render.mjs
│   └── timed-text-to-csv.mjs
├── input/
│   ├── timed-text.txt
│   └── script.example.csv
├── open-studio.command
├── preview.command
├── convert.command
└── render.command
```

## Requirements / 必要環境

**日本語**

- Node.js
- FFmpeg
- macOS 推奨。`.command` ファイルは Mac 用です。

FFmpeg がない場合、レンダラーは Python の `imageio-ffmpeg` も試します。

**中文**

- Node.js
- FFmpeg
- 推荐 macOS 使用；`.command` 文件主要面向 Mac。

如果系统里没有 FFmpeg，渲染脚本会尝试使用 Python 的 `imageio-ffmpeg`。

## Roadmap / 今後

- Better subtitle style presets / 字幕スタイルのプリセット / 更多弹窗样式
- Import/export improvements / インポートとエクスポート改善 / 更顺手的导入导出
- Project templates / プロジェクトテンプレート / 项目模板

## License / ライセンス

MIT
