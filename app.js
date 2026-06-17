const SAMPLE_TIMED_TEXT = `00:00:00.600 サンプル字幕の1行目をここに入れます。
00:00:03.700 サンプル字幕の2行目をここに入れます。
00:00:07.700 サンプル字幕の3行目をここに入れます。`;

const SAMPLE_LINES = [
  {
    start: 0.6,
    end: 3.3,
    ja: "こんばんは。今夜も番組を始めていきます。",
    zh: "晚上好。今晚的节目也要开始了。",
    speaker: "MC"
  },
  {
    start: 3.7,
    end: 7.2,
    ja: "まずはリスナーの皆さんから届いたメッセージです。",
    zh: "首先是听众们发来的留言。",
    speaker: "MC"
  },
  {
    start: 7.7,
    end: 11.6,
    ja: "最近、朝の空気が少しずつ変わってきましたね。",
    zh: "最近，早晨的空气一点点变得不一样了呢。",
    speaker: "MC"
  }
];

const TIME_PATTERN = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[\.,]\d{1,3})?`;
const timeRegex = new RegExp(TIME_PATTERN, "u");

const playButton = document.querySelector("#playButton");
const restartButton = document.querySelector("#restartButton");
const convertButton = document.querySelector("#convertButton");
const loadSampleButton = document.querySelector("#loadSampleButton");
const saveCsvButton = document.querySelector("#saveCsvButton");
const downloadCsvButton = document.querySelector("#downloadCsvButton");
const copyCsvButton = document.querySelector("#copyCsvButton");
const renderButton = document.querySelector("#renderButton");
const cancelRenderButton = document.querySelector("#cancelRenderButton");
const timedTextFileButton = document.querySelector("#timedTextFileButton");
const timedTextFilePanelButton = document.querySelector("#timedTextFilePanelButton");
const audioFileButton = document.querySelector("#audioFileButton");
const audioInput = document.querySelector("#audioInput");
const backgroundImageInput = document.querySelector("#backgroundImageInput");
const backgroundImageButton = document.querySelector("#backgroundImageButton");
const timedBackgroundInput = document.querySelector("#timedBackgroundInput");
const timedBackgroundButton = document.querySelector("#timedBackgroundButton");
const timedBackgroundList = document.querySelector("#timedBackgroundList");
const backgroundColorInput = document.querySelector("#backgroundColorInput");
const backgroundScaleInput = document.querySelector("#backgroundScaleInput");
const backgroundScaleValue = document.querySelector("#backgroundScaleValue");
const timedTextFileInput = document.querySelector("#timedTextFileInput");
const timedTextInput = document.querySelector("#timedTextInput");
const sourcePanel = document.querySelector(".source-panel");
const popupLayer = document.querySelector("#popupLayer");
const timedBackgroundLayer = document.querySelector("#timedBackgroundLayer");
const stage = document.querySelector("#stage");
const lineList = document.querySelector("#lineList");
const lineCount = document.querySelector("#lineCount");
const statusText = document.querySelector("#statusText");
const sourceStatus = document.querySelector("#sourceStatus");
const timeLabel = document.querySelector("#timeLabel");
const scrubber = document.querySelector("#scrubber");
const waveform = document.querySelector("#waveform");
const audio = document.querySelector("#audio");
const videoLink = document.querySelector("#videoLink");
const fileModeNotice = document.querySelector("#fileModeNotice");
const languageSelect = document.querySelector("#languageSelect");
const subtitleSizeInputs = document.querySelectorAll('input[name="subtitleSize"]');
const subtitleLeadInput = document.querySelector("#subtitleLeadInput");
const videoRatioInputs = document.querySelectorAll('input[name="videoRatio"]');
const backgroundModeInputs = document.querySelectorAll('input[name="backgroundMode"]');
const subtitleStyleInputs = document.querySelectorAll('input[name="subtitleStyle"]');
const renderProgress = document.querySelector("#renderProgress");
const renderProgressBar = document.querySelector("#renderProgressBar");
const renderProgressLabel = document.querySelector("#renderProgressLabel");
const renderEtaLabel = document.querySelector("#renderEtaLabel");
const isFileMode = window.location.protocol === "file:";

const UI_LANGUAGES = ["zh-Hant", "ja", "en"];
const HTML_LANG = {
  "zh-Hant": "zh-Hant",
  ja: "ja",
  en: "en"
};

const I18N = {
  "zh-Hant": {
    "app.tagline": "字幕轉換、校對、預覽、匯出",
    "language.label": "語言",
    "language.aria": "語言",
    "toolbar.importSubtitles": "匯入字幕 / CSV",
    "toolbar.importAudio": "匯入音訊",
    "toolbar.exportVideo": "匯出影片",
    "toolbar.exporting": "匯出中",
    "toolbar.cancelExport": "終止匯出",
    "notice.fileMode": "目前是直接開啟 index.html：匯入和預覽可用；儲存、匯入音訊到專案、匯出影片請雙擊 open-studio.command。",
    "source.title": "字幕檔案 / 時間戳文字",
    "source.notImported": "未匯入",
    "source.sample": "範例文字",
    "source.placeholder": "00:00:01.200 台詞",
    "source.chooseFile": "選擇字幕 / CSV",
    "source.convertCsv": "轉換成 CSV",
    "source.loadSample": "載入範例",
    "play.play": "播放",
    "play.pause": "暫停",
    "play.restart": "重來",
    "subtitleSize.label": "字幕大小",
    "subtitleSize.small": "小",
    "subtitleSize.medium": "中",
    "subtitleSize.large": "大",
    "subtitleSize.xlarge": "特大",
    "subtitleLead.label": "字幕提前",
    "subtitleLead.unit": "秒",
    "videoRatio.label": "比例",
    "background.label": "背景",
    "background.grid": "預設",
    "background.color": "純色",
    "background.image": "圖片",
    "background.colorPicker": "背景色",
    "background.uploadImage": "上傳背景圖",
    "background.imageSize": "圖片大小",
    "timedBackground.label": "定時背景",
    "timedBackground.add": "加入圖片",
    "timedBackground.empty": "尚未加入定時背景",
    "timedBackground.start": "開始",
    "timedBackground.end": "結束",
    "timedBackground.size": "大小",
    "timedBackground.remove": "刪除",
    "subtitleStyle.label": "字幕風格",
    "subtitleStyle.card": "廣播卡片",
    "subtitleStyle.note": "彈窗便條",
    "editor.title": "CSV 編輯",
    "editor.saveCsv": "儲存 CSV",
    "editor.downloadCsv": "下載 CSV",
    "editor.copyCsv": "複製 CSV",
    "editor.downloadVideo": "下載影片",
    "line.count": "{count} 句",
    "line.empty": "匯入字幕 / CSV 後，可編輯的台詞會顯示在這裡。",
    "line.start": "開始",
    "line.end": "結束",
    "line.speaker": "說話人",
    "line.original": "原文",
    "line.translation": "譯文",
    "status.initial": "請匯入字幕 / CSV 和音訊",
    "status.audioLoaded": "音訊已載入",
    "status.silentPreview": "靜音預覽",
    "status.importedFile": "已匯入 {name}",
    "status.sampleLoaded": "已轉換 {count} 句",
    "status.saveFailed": "儲存失敗",
    "status.csvDownloaded": "CSV 已下載",
    "status.csvCopied": "CSV 已複製",
    "status.csvDownloadFallback": "已改為下載 CSV",
    "status.fileModeFull": "直接開啟 index.html 時無法儲存或匯出；請雙擊 open-studio.command 開啟完整功能",
    "status.subtitleSize": "字幕大小：{size}",
    "status.subtitleLead": "字幕提前 {seconds} 秒",
    "status.videoRatio": "影片比例：{ratio}",
    "status.backgroundMode": "背景：{mode}",
    "status.backgroundImageScale": "背景圖片大小：{scale}%",
    "status.subtitleStyle": "字幕風格：{style}",
    "status.noTimestamp": "沒有識別到時間戳",
    "status.convertedLines": "已轉換 {count} 句",
    "status.chooseSubtitleFile": "請選擇 SRT / VTT / SBV / TXT / CSV 檔案",
    "status.chooseCsv": "請選擇 CSV 檔案",
    "status.csvNoRows": "CSV 沒有識別到可用字幕",
    "status.importedCsv": "已匯入 CSV：{name}（{count} 句）",
    "status.chooseImage": "請選擇 PNG / JPG / WebP 圖片",
    "status.importedBackground": "已匯入背景圖：{name}",
    "status.importedTimedBackground": "已加入定時背景：{name}",
    "status.timedBackgroundSaving": "正在儲存定時背景圖片",
    "status.timedBackgroundRemoved": "已刪除定時背景",
    "status.audioBlocked": "瀏覽器阻擋了音訊播放",
    "status.fullModeSave": "請雙擊 open-studio.command 開啟完整功能後再儲存",
    "status.csvSaved": "已儲存 input/script.csv",
    "status.savedFile": "已儲存 {name}",
    "status.audioPreviewOnly": "音訊僅用於目前預覽",
    "status.backgroundSaveFailed": "背景圖儲存失敗",
    "status.backgroundSaved": "已儲存背景圖：{name}",
    "status.backgroundPreviewOnly": "背景圖僅用於目前預覽",
    "status.fullModeRender": "請雙擊 open-studio.command 開啟完整功能後再匯出",
    "status.chooseSaveFailed": "選擇儲存位置失敗",
    "status.noExportableSubtitles": "已選擇儲存位置，但沒有可匯出的字幕",
    "status.videoSavedToPath": "影片已匯出並儲存到所選位置",
    "status.videoExported": "影片已匯出",
    "status.exportCanceledClean": "已終止匯出，殘留檔案已清理",
    "status.exportFailed": "匯出失敗",
    "status.renderJobMissing": "沒有建立匯出任務",
    "status.exportCanceled": "已取消匯出",
    "status.noSavePath": "沒有選擇儲存位置",
    "status.writeOutputFailed": "匯出完成，但寫入所選位置失敗",
    "status.readProgressFailed": "讀取匯出進度失敗",
    "status.cancelingExport": "正在終止匯出",
    "status.cancelRequestFailed": "終止請求傳送失敗",
    "progress.starting": "準備匯出",
    "progress.running": "正在匯出 {percent}%",
    "progress.canceling": "正在終止匯出",
    "progress.canceled": "已終止匯出",
    "progress.complete": "匯出完成",
    "progress.failed": "匯出失敗",
    "progress.remaining": "剩餘時間 {time}",
    "progress.remainingUnknown": "剩餘時間 --:--",
    "progress.remainingDone": "剩餘時間 00:00",
    "dialog.saveTitle": "儲存匯出影片",
    "dialog.saveButton": "儲存",
    "dialog.mp4Filter": "MP4 影片",
    "dialog.invalidSavePath": "儲存位置無效",
    "dialog.outputMissing": "匯出完成，但沒有找到生成的影片檔案",
    "aria.projectControls": "專案控制",
    "aria.subtitleSource": "字幕檔案和時間戳文字",
    "aria.videoPreview": "影片預覽",
    "aria.playbackControls": "播放控制",
    "aria.subtitleSize": "字幕大小",
    "aria.visualSettings": "畫面設定",
    "aria.videoRatio": "影片比例",
    "aria.background": "背景",
    "aria.subtitleStyle": "字幕風格",
    "aria.csvEditor": "CSV 編輯"
  },
  ja: {
    "app.tagline": "字幕変換、校正、プレビュー、書き出し",
    "language.label": "言語",
    "language.aria": "言語",
    "toolbar.importSubtitles": "字幕 / CSV を読み込む",
    "toolbar.importAudio": "音声を読み込む",
    "toolbar.exportVideo": "動画を書き出す",
    "toolbar.exporting": "書き出し中",
    "toolbar.cancelExport": "書き出し停止",
    "notice.fileMode": "index.html を直接開いています：読み込みとプレビューは使用できます。保存、音声の取り込み、動画書き出しは open-studio.command をダブルクリックしてください。",
    "source.title": "字幕ファイル / タイムスタンプ文字",
    "source.notImported": "未読み込み",
    "source.sample": "サンプル文字",
    "source.placeholder": "00:00:01.200 セリフ",
    "source.chooseFile": "字幕 / CSV を選択",
    "source.convertCsv": "CSV に変換",
    "source.loadSample": "サンプルを読み込む",
    "play.play": "再生",
    "play.pause": "一時停止",
    "play.restart": "最初から",
    "subtitleSize.label": "字幕サイズ",
    "subtitleSize.small": "小",
    "subtitleSize.medium": "中",
    "subtitleSize.large": "大",
    "subtitleSize.xlarge": "特大",
    "subtitleLead.label": "字幕を早める",
    "subtitleLead.unit": "秒",
    "videoRatio.label": "比率",
    "background.label": "背景",
    "background.grid": "デフォルト",
    "background.color": "単色",
    "background.image": "画像",
    "background.colorPicker": "背景色",
    "background.uploadImage": "背景画像をアップロード",
    "background.imageSize": "画像サイズ",
    "timedBackground.label": "時間指定背景",
    "timedBackground.add": "画像を追加",
    "timedBackground.empty": "時間指定背景はまだありません",
    "timedBackground.start": "開始",
    "timedBackground.end": "終了",
    "timedBackground.size": "サイズ",
    "timedBackground.remove": "削除",
    "subtitleStyle.label": "字幕スタイル",
    "subtitleStyle.card": "ラジオカード",
    "subtitleStyle.note": "ポップアップ付箋",
    "editor.title": "CSV 編集",
    "editor.saveCsv": "CSV を保存",
    "editor.downloadCsv": "CSV をダウンロード",
    "editor.copyCsv": "CSV をコピー",
    "editor.downloadVideo": "動画をダウンロード",
    "line.count": "{count} 行",
    "line.empty": "字幕 / CSV を読み込むと、編集できるセリフがここに表示されます。",
    "line.start": "開始",
    "line.end": "終了",
    "line.speaker": "話者",
    "line.original": "原文",
    "line.translation": "翻訳",
    "status.initial": "字幕 / CSV と音声を読み込んでください",
    "status.audioLoaded": "音声を読み込みました",
    "status.silentPreview": "無音プレビュー",
    "status.importedFile": "{name} を読み込みました",
    "status.sampleLoaded": "{count} 行を変換しました",
    "status.saveFailed": "保存に失敗しました",
    "status.csvDownloaded": "CSV をダウンロードしました",
    "status.csvCopied": "CSV をコピーしました",
    "status.csvDownloadFallback": "CSV ダウンロードに切り替えました",
    "status.fileModeFull": "index.html を直接開いているため保存や書き出しはできません。open-studio.command で開いてください",
    "status.subtitleSize": "字幕サイズ：{size}",
    "status.subtitleLead": "字幕を {seconds} 秒早めます",
    "status.videoRatio": "動画比率：{ratio}",
    "status.backgroundMode": "背景：{mode}",
    "status.backgroundImageScale": "背景画像サイズ：{scale}%",
    "status.subtitleStyle": "字幕スタイル：{style}",
    "status.noTimestamp": "タイムスタンプを認識できませんでした",
    "status.convertedLines": "{count} 行を変換しました",
    "status.chooseSubtitleFile": "SRT / VTT / SBV / TXT / CSV ファイルを選択してください",
    "status.chooseCsv": "CSV ファイルを選択してください",
    "status.csvNoRows": "CSV から使用できる字幕を認識できませんでした",
    "status.importedCsv": "CSV を読み込みました：{name}（{count} 行）",
    "status.chooseImage": "PNG / JPG / WebP 画像を選択してください",
    "status.importedBackground": "背景画像を読み込みました：{name}",
    "status.importedTimedBackground": "時間指定背景を追加しました：{name}",
    "status.timedBackgroundSaving": "時間指定背景画像を保存しています",
    "status.timedBackgroundRemoved": "時間指定背景を削除しました",
    "status.audioBlocked": "ブラウザが音声再生をブロックしました",
    "status.fullModeSave": "保存するには open-studio.command で完全機能を開いてください",
    "status.csvSaved": "input/script.csv を保存しました",
    "status.savedFile": "{name} を保存しました",
    "status.audioPreviewOnly": "音声は現在のプレビューのみで使用されます",
    "status.backgroundSaveFailed": "背景画像の保存に失敗しました",
    "status.backgroundSaved": "背景画像を保存しました：{name}",
    "status.backgroundPreviewOnly": "背景画像は現在のプレビューのみで使用されます",
    "status.fullModeRender": "書き出すには open-studio.command で完全機能を開いてください",
    "status.chooseSaveFailed": "保存先の選択に失敗しました",
    "status.noExportableSubtitles": "保存先は選択されましたが、書き出せる字幕がありません",
    "status.videoSavedToPath": "動画を書き出して選択した場所に保存しました",
    "status.videoExported": "動画を書き出しました",
    "status.exportCanceledClean": "書き出しを停止し、残りファイルを削除しました",
    "status.exportFailed": "書き出しに失敗しました",
    "status.renderJobMissing": "書き出しタスクを作成できませんでした",
    "status.exportCanceled": "書き出しをキャンセルしました",
    "status.noSavePath": "保存先が選択されていません",
    "status.writeOutputFailed": "書き出しは完了しましたが、選択した場所への書き込みに失敗しました",
    "status.readProgressFailed": "書き出し進捗を読み取れませんでした",
    "status.cancelingExport": "書き出しを停止しています",
    "status.cancelRequestFailed": "停止リクエストの送信に失敗しました",
    "progress.starting": "書き出し準備中",
    "progress.running": "書き出し中 {percent}%",
    "progress.canceling": "停止中",
    "progress.canceled": "停止しました",
    "progress.complete": "書き出し完了",
    "progress.failed": "書き出し失敗",
    "progress.remaining": "残り時間 {time}",
    "progress.remainingUnknown": "残り時間 --:--",
    "progress.remainingDone": "残り時間 00:00",
    "dialog.saveTitle": "書き出し動画を保存",
    "dialog.saveButton": "保存",
    "dialog.mp4Filter": "MP4 動画",
    "dialog.invalidSavePath": "保存先が無効です",
    "dialog.outputMissing": "書き出しは完了しましたが、生成された動画が見つかりません",
    "aria.projectControls": "プロジェクト操作",
    "aria.subtitleSource": "字幕ファイルとタイムスタンプ文字",
    "aria.videoPreview": "動画プレビュー",
    "aria.playbackControls": "再生操作",
    "aria.subtitleSize": "字幕サイズ",
    "aria.visualSettings": "画面設定",
    "aria.videoRatio": "動画比率",
    "aria.background": "背景",
    "aria.subtitleStyle": "字幕スタイル",
    "aria.csvEditor": "CSV 編集"
  },
  en: {
    "app.tagline": "Convert, review, preview, and export subtitles",
    "language.label": "Language",
    "language.aria": "Language",
    "toolbar.importSubtitles": "Import Subtitles / CSV",
    "toolbar.importAudio": "Import Audio",
    "toolbar.exportVideo": "Export Video",
    "toolbar.exporting": "Exporting",
    "toolbar.cancelExport": "Cancel Export",
    "notice.fileMode": "You opened index.html directly: import and preview are available. For saving, importing audio into the project, and video export, open with open-studio.command.",
    "source.title": "Subtitle File / Timed Text",
    "source.notImported": "Not imported",
    "source.sample": "Sample text",
    "source.placeholder": "00:00:01.200 Dialogue",
    "source.chooseFile": "Choose Subtitles / CSV",
    "source.convertCsv": "Convert to CSV",
    "source.loadSample": "Load Sample",
    "play.play": "Play",
    "play.pause": "Pause",
    "play.restart": "Restart",
    "subtitleSize.label": "Subtitle size",
    "subtitleSize.small": "S",
    "subtitleSize.medium": "M",
    "subtitleSize.large": "L",
    "subtitleSize.xlarge": "XL",
    "subtitleLead.label": "Subtitle lead",
    "subtitleLead.unit": "sec",
    "videoRatio.label": "Ratio",
    "background.label": "Background",
    "background.grid": "Default",
    "background.color": "Solid",
    "background.image": "Image",
    "background.colorPicker": "Color",
    "background.uploadImage": "Upload Background",
    "background.imageSize": "Image size",
    "timedBackground.label": "Timed background",
    "timedBackground.add": "Add image",
    "timedBackground.empty": "No timed backgrounds yet",
    "timedBackground.start": "Start",
    "timedBackground.end": "End",
    "timedBackground.size": "Size",
    "timedBackground.remove": "Remove",
    "subtitleStyle.label": "Subtitle style",
    "subtitleStyle.card": "Radio card",
    "subtitleStyle.note": "Popup note",
    "editor.title": "CSV Editor",
    "editor.saveCsv": "Save CSV",
    "editor.downloadCsv": "Download CSV",
    "editor.copyCsv": "Copy CSV",
    "editor.downloadVideo": "Download Video",
    "line.count": "{count} lines",
    "line.empty": "Import subtitles / CSV, and editable dialogue will appear here.",
    "line.start": "Start",
    "line.end": "End",
    "line.speaker": "Speaker",
    "line.original": "Original",
    "line.translation": "Translation",
    "status.initial": "Import subtitles / CSV and audio",
    "status.audioLoaded": "Audio loaded",
    "status.silentPreview": "Silent preview",
    "status.importedFile": "Imported {name}",
    "status.sampleLoaded": "Converted {count} lines",
    "status.saveFailed": "Save failed",
    "status.csvDownloaded": "CSV downloaded",
    "status.csvCopied": "CSV copied",
    "status.csvDownloadFallback": "Downloaded CSV instead",
    "status.fileModeFull": "Saving and exporting are unavailable when opening index.html directly. Open with open-studio.command.",
    "status.subtitleSize": "Subtitle size: {size}",
    "status.subtitleLead": "Subtitle lead: {seconds} sec",
    "status.videoRatio": "Video ratio: {ratio}",
    "status.backgroundMode": "Background: {mode}",
    "status.backgroundImageScale": "Background image size: {scale}%",
    "status.subtitleStyle": "Subtitle style: {style}",
    "status.noTimestamp": "No timestamps recognized",
    "status.convertedLines": "Converted {count} lines",
    "status.chooseSubtitleFile": "Choose an SRT / VTT / SBV / TXT / CSV file",
    "status.chooseCsv": "Choose a CSV file",
    "status.csvNoRows": "No usable subtitles recognized in the CSV",
    "status.importedCsv": "Imported CSV: {name} ({count} lines)",
    "status.chooseImage": "Choose a PNG / JPG / WebP image",
    "status.importedBackground": "Imported background: {name}",
    "status.importedTimedBackground": "Added timed background: {name}",
    "status.timedBackgroundSaving": "Saving timed background image",
    "status.timedBackgroundRemoved": "Removed timed background",
    "status.audioBlocked": "The browser blocked audio playback",
    "status.fullModeSave": "Open the full app with open-studio.command before saving",
    "status.csvSaved": "Saved input/script.csv",
    "status.savedFile": "Saved {name}",
    "status.audioPreviewOnly": "Audio is only available for the current preview",
    "status.backgroundSaveFailed": "Background image save failed",
    "status.backgroundSaved": "Saved background image: {name}",
    "status.backgroundPreviewOnly": "Background image is only available for the current preview",
    "status.fullModeRender": "Open the full app with open-studio.command before exporting",
    "status.chooseSaveFailed": "Failed to choose a save location",
    "status.noExportableSubtitles": "Save location selected, but there are no subtitles to export",
    "status.videoSavedToPath": "Video exported and saved to the selected location",
    "status.videoExported": "Video exported",
    "status.exportCanceledClean": "Export canceled and temporary files cleaned up",
    "status.exportFailed": "Export failed",
    "status.renderJobMissing": "Render job was not created",
    "status.exportCanceled": "Export canceled",
    "status.noSavePath": "No save location selected",
    "status.writeOutputFailed": "Export completed, but writing to the selected location failed",
    "status.readProgressFailed": "Failed to read export progress",
    "status.cancelingExport": "Canceling export",
    "status.cancelRequestFailed": "Failed to send cancel request",
    "progress.starting": "Preparing export",
    "progress.running": "Exporting {percent}%",
    "progress.canceling": "Canceling export",
    "progress.canceled": "Export canceled",
    "progress.complete": "Export complete",
    "progress.failed": "Export failed",
    "progress.remaining": "Time left {time}",
    "progress.remainingUnknown": "Time left --:--",
    "progress.remainingDone": "Time left 00:00",
    "dialog.saveTitle": "Save Exported Video",
    "dialog.saveButton": "Save",
    "dialog.mp4Filter": "MP4 Video",
    "dialog.invalidSavePath": "Invalid save location",
    "dialog.outputMissing": "Export completed, but the generated video file was not found",
    "aria.projectControls": "Project controls",
    "aria.subtitleSource": "Subtitle file and timed text",
    "aria.videoPreview": "Video preview",
    "aria.playbackControls": "Playback controls",
    "aria.subtitleSize": "Subtitle size",
    "aria.visualSettings": "Visual settings",
    "aria.videoRatio": "Video ratio",
    "aria.background": "Background",
    "aria.subtitleStyle": "Subtitle style",
    "aria.csvEditor": "CSV editor"
  }
};

const SUBTITLE_SIZE_PRESETS = {
  small: {renderSize: 34},
  medium: {renderSize: 40},
  large: {renderSize: 46},
  xlarge: {renderSize: 54}
};

const VIDEO_RATIO_PRESETS = {
  "16:9": {width: 1920, height: 1080, aspect: "16 / 9", previewMaxWidth: "100%"},
  "9:16": {width: 1080, height: 1920, aspect: "9 / 16", previewMaxWidth: "430px"},
  "1:1": {width: 1080, height: 1080, aspect: "1 / 1", previewMaxWidth: "620px"},
  "4:5": {width: 1080, height: 1350, aspect: "4 / 5", previewMaxWidth: "540px"}
};

const EXPORT_PREVIEW_WIDTH = 1920;
const subtitleSizeStorageKey = "broadcastPopup.subtitleSize";
const subtitleLeadStorageKey = "broadcastPopup.subtitleLead";
const videoRatioStorageKey = "broadcastPopup.videoRatio";
const backgroundModeStorageKey = "broadcastPopup.backgroundMode";
const backgroundColorStorageKey = "broadcastPopup.backgroundColor";
const backgroundImagePathStorageKey = "broadcastPopup.backgroundImagePath";
const backgroundScaleStorageKey = "broadcastPopup.backgroundScale";
const subtitleStyleStorageKey = "broadcastPopup.subtitleStyle";
const languageStorageKey = "broadcastPopup.language";
let subtitleSize = normalizeSubtitleSize(readStoredSubtitleSize() || "large");
let subtitleLead = normalizeSubtitleLead(readStoredSubtitleLead() || 0);
let videoRatio = normalizeVideoRatio(readStoredValue(videoRatioStorageKey) || "16:9");
let backgroundMode = normalizeBackgroundMode(readStoredValue(backgroundModeStorageKey) || "grid");
let backgroundColor = normalizeHexColor(readStoredValue(backgroundColorStorageKey) || "#202124");
let backgroundImagePath = readStoredValue(backgroundImagePathStorageKey);
let backgroundScale = normalizeBackgroundScale(readStoredValue(backgroundScaleStorageKey) || 100);
let subtitleStyle = normalizeSubtitleStyle(readStoredValue(subtitleStyleStorageKey) || "card");
let currentLanguage = normalizeLanguage(readStoredValue(languageStorageKey) || detectLanguage());

let lines = [];
let playing = false;
let currentTime = 0;
let startedAt = 0;
let pausedAt = 0;
let activeIndex = -1;
let audioReady = false;
let audioObjectUrl = "";
let backgroundImageObjectUrl = "";
let timedBackgrounds = [];
let timedBackgroundSerial = 0;
const timedBackgroundSaveTasks = new Set();
let activeRenderJobId = "";
let renderRunning = false;
let statusState = {key: "status.initial", params: {}};
let sourceStatusState = {key: "source.notImported", params: {}};
let lastRenderProgressPayload = {state: "starting", progress: 0, remainingSeconds: null};

const barHeights = [
  10, 18, 28, 14, 24, 16, 12, 30, 18, 10, 14, 24,
  16, 20, 28, 12, 18, 22, 10, 30, 16, 20, 12, 26,
  18, 14, 24, 10, 28, 16, 12, 22, 18, 10, 20, 14
];

for (const height of barHeights) {
  const bar = document.createElement("span");
  bar.style.height = `${height}%`;
  waveform.append(bar);
}

audio.addEventListener("loadedmetadata", () => {
  audioReady = true;
  scrubber.max = String(getDuration());
  setStatus("status.audioLoaded");
});

audio.addEventListener("error", () => {
  audioReady = false;
  setStatus("status.silentPreview");
});

playButton.addEventListener("click", async () => {
  if (playing) {
    pause();
    return;
  }
  await play();
});

restartButton.addEventListener("click", () => {
  seek(0);
  if (playing && audioReady) audio.play();
});

scrubber.addEventListener("input", () => {
  seek(Number(scrubber.value));
});

timedTextFileButton.addEventListener("click", () => {
  timedTextFileInput.click();
});

timedTextFilePanelButton.addEventListener("click", () => {
  timedTextFileInput.click();
});

audioFileButton.addEventListener("click", () => {
  audioInput.click();
});

backgroundImageButton.addEventListener("click", () => {
  backgroundImageInput.click();
});

timedTextFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await importTimedTextFile(file);
  timedTextFileInput.value = "";
});

sourcePanel.addEventListener("dragover", (event) => {
  if (!hasSubtitleSourceFile(event.dataTransfer?.items)) return;
  event.preventDefault();
  sourcePanel.classList.add("is-dragging");
});

sourcePanel.addEventListener("dragleave", (event) => {
  if (sourcePanel.contains(event.relatedTarget)) return;
  sourcePanel.classList.remove("is-dragging");
});

sourcePanel.addEventListener("drop", async (event) => {
  const file = [...(event.dataTransfer?.files || [])].find(isSubtitleSourceFile);
  if (!file) return;
  event.preventDefault();
  sourcePanel.classList.remove("is-dragging");
  await importTimedTextFile(file);
});

audioInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
  audioObjectUrl = URL.createObjectURL(file);
  audio.src = audioObjectUrl;
  audio.load();
  setStatus("status.importedFile", {name: file.name});
  await saveAudioToProject(file);
});

backgroundImageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await importBackgroundImage(file);
  backgroundImageInput.value = "";
});

timedBackgroundButton.addEventListener("click", () => {
  timedBackgroundInput.click();
});

timedBackgroundInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await addTimedBackgroundImage(file);
  timedBackgroundInput.value = "";
});

timedBackgroundList.addEventListener("input", (event) => {
  const id = event.target.dataset.id;
  const field = event.target.dataset.field;
  if (field !== "scale") return;
  if (!id || !field) return;
  updateTimedBackground(id, field, event.target.value);
});

timedBackgroundList.addEventListener("change", (event) => {
  const id = event.target.dataset.id;
  const field = event.target.dataset.field;
  if (!id || !field) return;
  updateTimedBackground(id, field, event.target.value);
});

timedBackgroundList.addEventListener("click", (event) => {
  const id = event.target.dataset.removeTimedBackground;
  if (!id) return;
  removeTimedBackground(id);
});

convertButton.addEventListener("click", convertTimedText);

loadSampleButton.addEventListener("click", () => {
  timedTextInput.value = SAMPLE_TIMED_TEXT;
  setSourceStatus("source.sample");
  convertTimedText();
});

saveCsvButton.addEventListener("click", async () => {
  try {
    await saveCsvToProject(true);
  } catch (error) {
    if (error.message) setStatusText(error.message);
    else setStatus("status.saveFailed");
  }
});

downloadCsvButton.addEventListener("click", () => {
  downloadText(buildCsv(lines), "script.csv", "text/csv;charset=utf-8");
  setStatus("status.csvDownloaded");
});

copyCsvButton.addEventListener("click", async () => {
  const csv = buildCsv(lines);
  try {
    await navigator.clipboard.writeText(csv);
    setStatus("status.csvCopied");
  } catch {
    downloadText(csv, "script.csv", "text/csv;charset=utf-8");
    setStatus("status.csvDownloadFallback");
  }
});

renderButton.addEventListener("click", async () => {
  await renderVideo();
});

cancelRenderButton.addEventListener("click", async () => {
  await cancelRender();
});

lineList.addEventListener("click", (event) => {
  if (event.target.closest("input, textarea, button")) return;
  const item = event.target.closest(".line-item");
  if (!item) return;
  seek(Number(item.dataset.start || 0) - subtitleLead);
});

lineList.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const index = Number(event.target.dataset.index);
  if (!field || !Number.isInteger(index) || !lines[index]) return;
  updateLine(index, field, event.target.value);
});

lineList.addEventListener("change", (event) => {
  const field = event.target.dataset.field;
  if (field !== "start" && field !== "end") return;
  lines.sort((a, b) => a.start - b.start);
  renderTimeline();
  renderFrame();
});

subtitleSizeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    setSubtitleSize(input.value, true);
  });
});

subtitleLeadInput.addEventListener("input", () => {
  setSubtitleLead(subtitleLeadInput.value, true);
});

videoRatioInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    setVideoRatio(input.value, true);
  });
});

backgroundModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    setBackgroundMode(input.value, true);
  });
});

backgroundColorInput.addEventListener("input", () => {
  setBackgroundColor(backgroundColorInput.value, true);
});

backgroundScaleInput.addEventListener("input", () => {
  setBackgroundScale(backgroundScaleInput.value, true);
});

languageSelect.addEventListener("change", () => {
  setLanguage(languageSelect.value, true);
});

subtitleStyleInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    setSubtitleStyle(input.value, true);
  });
});

setSubtitleSize(subtitleSize, false);
setSubtitleLead(subtitleLead, false);
setVideoRatio(videoRatio, false);
setBackgroundColor(backgroundColor, false);
setBackgroundImagePath(backgroundImagePath, false);
setBackgroundScale(backgroundScale, false);
setBackgroundMode(backgroundMode, false);
setSubtitleStyle(subtitleStyle, false);
setLanguage(currentLanguage, false);
renderTimedBackgroundList();
syncPreviewScale();
window.addEventListener("resize", syncPreviewScale);
if ("ResizeObserver" in window) {
  new ResizeObserver(syncPreviewScale).observe(stage);
}
applyRuntimeModeNotice();
loadInitialData();
renderTimeline();
renderFrame();
requestAnimationFrame(tick);

async function loadInitialData() {
  timedTextInput.value = "";
  setSourceStatus("source.notImported");
  setLines([]);
  setStatus("status.initial");
  applyRuntimeModeNotice();
}

function applyRuntimeModeNotice() {
  if (!isFileMode) return;
  if (fileModeNotice) fileModeNotice.hidden = false;
  setStatus("status.fileModeFull");
}

function setLanguage(value, shouldPersist) {
  currentLanguage = normalizeLanguage(value);
  if (languageSelect) languageSelect.value = currentLanguage;
  document.documentElement.lang = HTML_LANG[currentLanguage] || "zh-Hant";

  if (shouldPersist) {
    saveStoredValue(languageStorageKey, currentLanguage);
  }

  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  playButton.textContent = playing ? t("play.pause") : t("play.play");
  renderButton.textContent = renderRunning ? t("toolbar.exporting") : t("toolbar.exportVideo");
  cancelRenderButton.textContent = t("toolbar.cancelExport");
  statusText.textContent = resolveTextState(statusState);
  sourceStatus.textContent = resolveTextState(sourceStatusState);
  renderTimeline();
  renderTimedBackgroundList();

  if (!renderProgress.classList.contains("is-hidden")) {
    setRenderProgress(lastRenderProgressPayload);
  }
}

function t(key, params = {}) {
  const template = I18N[currentLanguage]?.[key] || I18N["zh-Hant"][key] || key;
  return template.replace(/\{(\w+)\}/g, (_match, name) => params[name] ?? "");
}

function setStatus(key, params = {}) {
  statusState = {key, params};
  statusText.textContent = t(key, params);
}

function setStatusText(text) {
  statusState = {text};
  statusText.textContent = text;
}

function setSourceStatus(key, params = {}) {
  sourceStatusState = {key, params};
  sourceStatus.textContent = t(key, params);
}

function setSourceStatusText(text) {
  sourceStatusState = {text};
  sourceStatus.textContent = text;
}

function resolveTextState(state) {
  if (state?.text) return state.text;
  return t(state?.key || "status.initial", state?.params || {});
}

function normalizeLanguage(value) {
  const input = String(value || "").trim();
  if (UI_LANGUAGES.includes(input)) return input;
  if (/^ja\b/i.test(input)) return "ja";
  if (/^en\b/i.test(input)) return "en";
  return "zh-Hant";
}

function detectLanguage() {
  const language = navigator.language || "";
  if (/^ja\b/i.test(language)) return "ja";
  if (/^en\b/i.test(language)) return "en";
  return "zh-Hant";
}

function setSubtitleSize(value, shouldPersist) {
  subtitleSize = normalizeSubtitleSize(value);
  stage.dataset.subtitleSize = subtitleSize;
  syncPreviewScale();

  subtitleSizeInputs.forEach((input) => {
    input.checked = input.value === subtitleSize;
  });

  if (shouldPersist) {
    saveStoredSubtitleSize(subtitleSize);
    setStatus("status.subtitleSize", {size: getSubtitleSizeLabel(subtitleSize)});
  }

  renderFrame();
}

function readStoredSubtitleSize() {
  return readStoredValue(subtitleSizeStorageKey);
}

function readStoredSubtitleLead() {
  return readStoredValue(subtitleLeadStorageKey);
}

function readStoredValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function saveStoredSubtitleSize(value) {
  saveStoredValue(subtitleSizeStorageKey, value);
}

function saveStoredSubtitleLead(value) {
  saveStoredValue(subtitleLeadStorageKey, String(value));
}

function saveStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // File-mode previews can block localStorage in some browsers.
  }
}

function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // File-mode previews can block localStorage in some browsers.
  }
}

function normalizeSubtitleSize(value) {
  return value in SUBTITLE_SIZE_PRESETS ? value : "large";
}

function normalizeVideoRatio(value) {
  return value in VIDEO_RATIO_PRESETS ? value : "16:9";
}

function normalizeBackgroundMode(value) {
  return ["grid", "color", "image"].includes(value) ? value : "grid";
}

function normalizeSubtitleStyle(value) {
  return ["card", "note"].includes(value) ? value : "card";
}

function normalizeHexColor(value) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : "#202124";
}

function normalizeBackgroundScale(value) {
  const scale = Number(value);
  return Number.isFinite(scale) ? clamp(Math.round(scale), 80, 220) : 100;
}

function setSubtitleLead(value, shouldPersist) {
  subtitleLead = normalizeSubtitleLead(value);
  subtitleLeadInput.value = formatLeadInput(subtitleLead);

  if (shouldPersist) {
    saveStoredSubtitleLead(subtitleLead);
    setStatus("status.subtitleLead", {seconds: formatLeadInput(subtitleLead)});
  }

  renderFrame();
}

function normalizeSubtitleLead(value) {
  const lead = Number(value);
  return Number.isFinite(lead) ? clamp(Math.round(lead * 10) / 10, -5, 5) : 0;
}

function formatLeadInput(value) {
  return Number(value).toFixed(1).replace(/\.0$/, "");
}

function getSubtitleSizeLabel(value) {
  return t(`subtitleSize.${normalizeSubtitleSize(value)}`);
}

function syncPreviewScale() {
  const width = stage.clientWidth || EXPORT_PREVIEW_WIDTH;
  const renderWidth = VIDEO_RATIO_PRESETS[videoRatio].width;
  const scale = width / renderWidth;
  const renderSize = SUBTITLE_SIZE_PRESETS[subtitleSize].renderSize;
  stage.style.setProperty("--subtitle-font-size", `${Math.max(10, renderSize * scale).toFixed(2)}px`);
  stage.style.setProperty("--popup-border", `${Math.max(2, 4 * scale).toFixed(2)}px`);
  stage.style.setProperty("--popup-shadow-offset", `${Math.max(4, renderSize * 0.18 * scale).toFixed(2)}px`);
}

function setVideoRatio(value, shouldPersist) {
  videoRatio = normalizeVideoRatio(value);
  const preset = VIDEO_RATIO_PRESETS[videoRatio];
  stage.style.setProperty("--stage-aspect-ratio", preset.aspect);
  stage.style.setProperty("--stage-preview-max-width", preset.previewMaxWidth);

  videoRatioInputs.forEach((input) => {
    input.checked = input.value === videoRatio;
  });

  if (shouldPersist) {
    saveStoredValue(videoRatioStorageKey, videoRatio);
    setStatus("status.videoRatio", {ratio: videoRatio});
  }

  syncPreviewScale();
  renderFrame();
}

function setBackgroundMode(value, shouldPersist) {
  backgroundMode = normalizeBackgroundMode(value);
  if (backgroundMode === "image" && !getBackgroundImageUrl()) backgroundMode = "grid";
  stage.dataset.backgroundMode = backgroundMode;

  backgroundModeInputs.forEach((input) => {
    input.checked = input.value === backgroundMode;
  });

  if (shouldPersist) {
    saveStoredValue(backgroundModeStorageKey, backgroundMode);
    setStatus("status.backgroundMode", {mode: t(`background.${backgroundMode}`)});
  }
}

function setBackgroundColor(value, shouldPersist) {
  backgroundColor = normalizeHexColor(value);
  backgroundColorInput.value = backgroundColor;
  stage.style.setProperty("--stage-bg-color", backgroundColor);

  if (shouldPersist) {
    saveStoredValue(backgroundColorStorageKey, backgroundColor);
    if (backgroundMode !== "color") setBackgroundMode("color", true);
  }
}

function setBackgroundScale(value, shouldPersist) {
  backgroundScale = normalizeBackgroundScale(value);
  backgroundScaleInput.value = String(backgroundScale);
  backgroundScaleValue.textContent = `${backgroundScale}%`;
  stage.style.setProperty("--stage-bg-image-scale", String(backgroundScale / 100));

  if (shouldPersist) {
    saveStoredValue(backgroundScaleStorageKey, String(backgroundScale));
    if (backgroundMode === "image") {
      setStatus("status.backgroundImageScale", {scale: backgroundScale});
    }
  }
}

function setBackgroundImagePath(path, shouldPersist) {
  backgroundImagePath = path || "";
  const imageUrl = getBackgroundImageUrl();
  if (imageUrl) {
    stage.style.setProperty("--stage-bg-image", `url("${imageUrl}")`);
    if (shouldPersist) saveStoredValue(backgroundImagePathStorageKey, backgroundImagePath);
  } else {
    stage.style.setProperty("--stage-bg-image", "none");
    removeStoredValue(backgroundImagePathStorageKey);
  }
}

function getBackgroundImageUrl() {
  return backgroundImageObjectUrl || backgroundImagePath || "";
}

function setSubtitleStyle(value, shouldPersist) {
  subtitleStyle = normalizeSubtitleStyle(value);
  stage.dataset.subtitleStyle = subtitleStyle;

  subtitleStyleInputs.forEach((input) => {
    input.checked = input.value === subtitleStyle;
  });

  if (shouldPersist) {
    saveStoredValue(subtitleStyleStorageKey, subtitleStyle);
    setStatus("status.subtitleStyle", {style: t(`subtitleStyle.${subtitleStyle}`)});
  }

  renderFrame();
}

function convertTimedText() {
  const nextLines = parseTimedText(timedTextInput.value);
  if (nextLines.length === 0) {
    setStatus("status.noTimestamp");
    return;
  }
  setLines(nextLines);
  setStatus("status.convertedLines", {count: nextLines.length});
}

async function importTimedTextFile(file) {
  if (!isSubtitleSourceFile(file)) {
    setStatus("status.chooseSubtitleFile");
    return;
  }

  setSourceStatusText(file.name);
  if (isCsvFile(file)) {
    await importCsvFile(file);
    return;
  }

  timedTextInput.value = await file.text();
  convertTimedText();
}

async function importCsvFile(file) {
  if (!isCsvFile(file)) {
    setStatus("status.chooseCsv");
    return;
  }

  const text = await file.text();
  const nextLines = parseCsv(text);
  if (nextLines.length === 0) {
    setStatus("status.csvNoRows");
    return;
  }

  setLines(nextLines);
  setSourceStatusText(file.name);
  setStatus("status.importedCsv", {name: file.name, count: nextLines.length});
}

async function importBackgroundImage(file) {
  if (!isBackgroundImageFile(file)) {
    setStatus("status.chooseImage");
    return;
  }

  if (backgroundImageObjectUrl) URL.revokeObjectURL(backgroundImageObjectUrl);
  backgroundImageObjectUrl = URL.createObjectURL(file);
  setBackgroundImagePath("", false);
  stage.style.setProperty("--stage-bg-image", `url("${backgroundImageObjectUrl}")`);
  setBackgroundMode("image", true);
  setStatus("status.importedBackground", {name: file.name});
  await saveBackgroundToProject(file);
}

async function addTimedBackgroundImage(file) {
  if (!isBackgroundImageFile(file)) {
    setStatus("status.chooseImage");
    return;
  }

  const start = getDefaultTimedBackgroundStart();
  const item = {
    id: `timed-bg-${Date.now()}-${timedBackgroundSerial += 1}`,
    name: file.name,
    start,
    end: Math.min(getDuration(), start + 8),
    scale: 100,
    path: "",
    url: URL.createObjectURL(file),
    objectUrl: true,
  };
  if (item.end <= item.start) item.end = item.start + 8;

  timedBackgrounds.push(item);
  renderTimedBackgroundList();
  renderFrame();
  setStatus("status.importedTimedBackground", {name: file.name});
  const saveTask = saveTimedBackgroundToProject(item, file)
    .finally(() => timedBackgroundSaveTasks.delete(saveTask));
  timedBackgroundSaveTasks.add(saveTask);
  await saveTask;
}

function getDefaultTimedBackgroundStart() {
  const activeLine = lines.find((line) => currentTime >= line.start && currentTime <= line.end);
  if (activeLine) return roundTenths(activeLine.start);
  return roundTenths(currentTime);
}

async function saveTimedBackgroundToProject(item, file) {
  try {
    const response = await fetch(`./api/save-timed-background?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      body: file
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || t("status.backgroundSaveFailed"));
    item.path = `./${payload.path}?t=${Date.now()}`;
    item.renderPath = payload.path;
    if (item.objectUrl && item.url) URL.revokeObjectURL(item.url);
    item.url = item.path;
    item.objectUrl = false;
    renderTimedBackgroundList();
    renderFrame();
  } catch {
    setStatus("status.backgroundPreviewOnly");
  }
}

async function waitForTimedBackgroundSaves() {
  if (timedBackgroundSaveTasks.size === 0) return;
  setStatus("status.timedBackgroundSaving");
  await Promise.allSettled([...timedBackgroundSaveTasks]);
}

function updateTimedBackground(id, field, value) {
  const item = timedBackgrounds.find((background) => background.id === id);
  if (!item) return;

  if (field === "start") {
    item.start = roundTenths(Math.max(0, Number(value) || 0));
    if (item.end <= item.start) item.end = roundTenths(item.start + 0.5);
  } else if (field === "end") {
    item.end = roundTenths(Math.max(0, Number(value) || 0));
    if (item.end <= item.start) item.start = roundTenths(Math.max(0, item.end - 0.5));
  } else if (field === "scale") {
    item.scale = normalizeBackgroundScale(value);
  }

  renderTimedBackgroundList();
  renderFrame();
}

function removeTimedBackground(id) {
  const item = timedBackgrounds.find((background) => background.id === id);
  if (item?.objectUrl && item.url) URL.revokeObjectURL(item.url);
  timedBackgrounds = timedBackgrounds.filter((background) => background.id !== id);
  renderTimedBackgroundList();
  renderFrame();
  setStatus("status.timedBackgroundRemoved");
}

function renderTimedBackgroundList() {
  if (!timedBackgroundList) return;

  if (timedBackgrounds.length === 0) {
    timedBackgroundList.innerHTML = `<div class="timed-background-empty">${escapeHtml(t("timedBackground.empty"))}</div>`;
    return;
  }

  timedBackgroundList.innerHTML = timedBackgrounds.map((item) => `
    <div class="timed-background-item">
      <div class="timed-background-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      <label class="timed-background-field">
        <span>${escapeHtml(t("timedBackground.start"))}</span>
        <input data-id="${escapeHtml(item.id)}" data-field="start" type="number" min="0" step="0.1" value="${formatSecondsInput(item.start)}" />
      </label>
      <label class="timed-background-field">
        <span>${escapeHtml(t("timedBackground.end"))}</span>
        <input data-id="${escapeHtml(item.id)}" data-field="end" type="number" min="0" step="0.1" value="${formatSecondsInput(item.end)}" />
      </label>
      <label class="timed-background-field">
        <span>${escapeHtml(t("timedBackground.size"))}</span>
        <input data-id="${escapeHtml(item.id)}" data-field="scale" type="range" min="80" max="220" step="5" value="${item.scale}" />
        <span>${item.scale}%</span>
      </label>
      <button class="timed-background-remove" type="button" data-remove-timed-background="${escapeHtml(item.id)}" aria-label="${escapeHtml(t("timedBackground.remove"))}">×</button>
    </div>
  `).join("");
}

function updateTimedBackgroundPreview() {
  const active = getActiveTimedBackground(currentTime);
  if (!active?.url) {
    timedBackgroundLayer.style.opacity = "0";
    timedBackgroundLayer.style.setProperty("--timed-bg-image", "none");
    return;
  }

  timedBackgroundLayer.style.setProperty("--timed-bg-image", `url("${active.url}")`);
  timedBackgroundLayer.style.setProperty("--timed-bg-scale", String((active.scale || 100) / 100));
  timedBackgroundLayer.style.opacity = String(getTimedBackgroundOpacity(active, currentTime));
}

function getActiveTimedBackground(time) {
  return [...timedBackgrounds]
    .reverse()
    .find((background) => time >= background.start && time <= background.end);
}

function getRenderableTimedBackgrounds() {
  return timedBackgrounds
    .filter((item) => item.renderPath && item.end > item.start)
    .map((item) => ({
      path: item.renderPath,
      start: roundTenths(item.start),
      end: roundTenths(item.end),
      scale: normalizeBackgroundScale(item.scale),
    }));
}

function getTimedBackgroundOpacity(item, time) {
  const fade = Math.min(0.45, Math.max(0.15, (item.end - item.start) / 3));
  const fadeIn = clamp((time - item.start) / fade, 0, 1);
  const fadeOut = clamp((item.end - time) / fade, 0, 1);
  return Math.min(fadeIn, fadeOut, 1);
}

function hasSubtitleSourceFile(items) {
  return [...(items || [])].some((item) => item.kind === "file");
}

function isSubtitleSourceFile(file) {
  return /\.(srt|vtt|sbv|txt|csv)$/i.test(file.name);
}

function isCsvFile(file) {
  return /\.csv$/i.test(file.name);
}

function isBackgroundImageFile(file) {
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

function setLines(nextLines) {
  lines = Array.isArray(nextLines) ? [...nextLines] : [];
  lines.sort((a, b) => a.start - b.start);
  activeIndex = -1;
  scrubber.max = String(getDuration());
  renderTimeline();
  renderFrame();
}

async function play() {
  playing = true;
  playButton.textContent = t("play.pause");
  startedAt = performance.now() / 1000 - pausedAt;

  if (audioReady) {
    audio.currentTime = pausedAt;
    try {
      await audio.play();
    } catch {
      setStatus("status.audioBlocked");
    }
  }
}

function pause() {
  playing = false;
  playButton.textContent = t("play.play");
  pausedAt = currentTime;
  audio.pause();
}

function seek(time) {
  currentTime = clamp(time, 0, getDuration());
  pausedAt = currentTime;
  startedAt = performance.now() / 1000 - currentTime;
  if (audioReady) audio.currentTime = currentTime;
  renderFrame();
}

function tick() {
  if (playing) {
    currentTime = audioReady && !Number.isNaN(audio.currentTime)
      ? audio.currentTime
      : performance.now() / 1000 - startedAt;

    if (currentTime >= getDuration()) {
      currentTime = getDuration();
      pause();
    }

    pausedAt = currentTime;
    renderFrame();
  }

  requestAnimationFrame(tick);
}

function renderFrame() {
  scrubber.value = String(currentTime);
  timeLabel.textContent = formatClock(currentTime);

  const subtitleTime = currentTime + subtitleLead;
  const index = lines.findIndex((line) => subtitleTime >= line.start && subtitleTime <= line.end);
  const line = index >= 0 ? lines[index] : null;

  updateTimedBackgroundPreview();
  renderPopup(line);
  updateWaveform(line);

  if (index !== activeIndex) {
    activeIndex = index;
    updateActiveLine();
  }
}

function renderPopup(line) {
  popupLayer.innerHTML = "";
  if (!line) return;

  const local = currentTime - line.start;
  const duration = Math.max(0.1, line.end - line.start);
  const enter = easeOutBack(clamp(local / 0.42, 0, 1));
  const exit = clamp((duration - local) / 0.28, 0, 1);
  const visibility = Math.min(enter, exit);
  const lift = (1 - visibility) * 42;
  const scale = 0.88 + visibility * 0.12;
  const rotation = subtitleStyle === "note" ? " rotate(-1.2deg)" : "";
  const mainText = line.zh || line.ja;

  const popup = document.createElement("article");
  popup.className = `popup popup-${subtitleStyle}`;
  popup.style.opacity = String(clamp(visibility, 0, 1));
  popup.style.transform = `translateY(${lift}px) scale(${scale})${rotation}`;
  popup.innerHTML = `
    <div class="zh">${escapeHtml(mainText)}</div>
  `;
  popupLayer.append(popup);
}

function renderTimeline() {
  lineCount.textContent = t("line.count", {count: lines.length});
  lineList.innerHTML = "";

  if (lines.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("line.empty");
    lineList.append(empty);
    return;
  }

  lines.forEach((line, index) => {
    const item = document.createElement("article");
    item.className = "line-item";
    item.dataset.index = String(index);
    item.dataset.start = String(line.start);
    item.innerHTML = `
      <div class="line-meta">
        <label>
          <span>${escapeHtml(t("line.start"))}</span>
          <input data-index="${index}" data-field="start" value="${escapeHtml(formatCsvTime(line.start))}" />
        </label>
        <label>
          <span>${escapeHtml(t("line.end"))}</span>
          <input data-index="${index}" data-field="end" value="${escapeHtml(formatCsvTime(line.end))}" />
        </label>
        <label>
          <span>${escapeHtml(t("line.speaker"))}</span>
          <input data-index="${index}" data-field="speaker" value="${escapeHtml(line.speaker || "RADIO")}" />
        </label>
      </div>
      <label class="line-text">
        <span>${escapeHtml(t("line.original"))}</span>
        <textarea data-index="${index}" data-field="ja" rows="2">${escapeHtml(line.ja)}</textarea>
      </label>
      <label class="line-text">
        <span>${escapeHtml(t("line.translation"))}</span>
        <textarea data-index="${index}" data-field="zh" rows="2">${escapeHtml(line.zh)}</textarea>
      </label>
    `;
    lineList.append(item);
  });

  updateActiveLine();
}

function updateLine(index, field, value) {
  if (field === "start" || field === "end") {
    lines[index][field] = parseTime(value);
  } else {
    lines[index][field] = value;
  }
  scrubber.max = String(getDuration());
  renderFrame();
}

function updateActiveLine() {
  document.querySelectorAll(".line-item").forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.index) === activeIndex);
  });
}

function updateWaveform(line) {
  const bars = waveform.querySelectorAll("span");
  bars.forEach((bar, index) => {
    const phase = currentTime * 1.8 + index * 0.38;
    const activePulse = line ? 0.94 + Math.sin(phase) * 0.05 : 0.74;
    const base = barHeights[index % barHeights.length];
    bar.style.transform = `scaleY(${activePulse})`;
    bar.style.opacity = line ? "0.38" : "0.2";
    bar.style.height = `${base}%`;
  });
}

async function saveCsvToProject(showStatus) {
  if (isFileMode) {
    throw new Error(t("status.fullModeSave"));
  }

  const response = await fetch("./api/save-csv", {
    method: "POST",
    headers: {"Content-Type": "text/csv; charset=utf-8"},
    body: buildCsv(lines)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "CSV save failed");
  }

  if (showStatus) setStatus("status.csvSaved");
}

async function saveAudioToProject(file) {
  try {
    const response = await fetch(`./api/save-audio?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      body: file
    });
    if (!response.ok) throw new Error(await response.text());
    setStatus("status.savedFile", {name: file.name});
  } catch {
    setStatus("status.audioPreviewOnly");
  }
}

async function saveBackgroundToProject(file) {
  try {
    const response = await fetch(`./api/save-background?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      body: file
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || t("status.backgroundSaveFailed"));
    setBackgroundImagePath(`./${payload.path}?t=${Date.now()}`, true);
    if (backgroundImageObjectUrl) {
      URL.revokeObjectURL(backgroundImageObjectUrl);
      backgroundImageObjectUrl = "";
    }
    setBackgroundMode("image", true);
    setStatus("status.backgroundSaved", {name: file.name});
  } catch {
    setStatus("status.backgroundPreviewOnly");
  }
}

async function renderVideo() {
  if (renderRunning) return;
  if (isFileMode) {
    setStatus("status.fullModeRender");
    return;
  }

  let outputFileHandle = null;
  try {
    outputFileHandle = await chooseOutputFile();
  } catch (error) {
    if (error.message) setStatusText(error.message);
    else setStatus("status.chooseSaveFailed");
    return;
  }
  if (outputFileHandle === false) return;

  if (lines.length === 0) {
    setStatus("status.noExportableSubtitles");
    return;
  }

  renderRunning = true;
  renderButton.disabled = true;
  renderButton.textContent = t("toolbar.exporting");
  cancelRenderButton.disabled = false;
  cancelRenderButton.classList.remove("is-hidden");
  setRenderProgress({state: "starting", progress: 0, remainingSeconds: null});
  videoLink.classList.add("is-hidden");

  try {
    await waitForTimedBackgroundSaves();
    await saveCsvToProject(false);
    const response = await fetch("./api/render", {
      method: "POST",
      headers: {"Content-Type": "application/json; charset=utf-8"},
      body: JSON.stringify({
        subtitleSize: SUBTITLE_SIZE_PRESETS[subtitleSize].renderSize,
        subtitleLead,
        videoRatio,
        backgroundMode,
        backgroundColor,
        backgroundScale,
        timedBackgrounds: getRenderableTimedBackgrounds(),
        subtitleStyle
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Render failed");

    activeRenderJobId = payload.jobId || "";
    if (!activeRenderJobId) throw new Error(t("status.renderJobMissing"));

    const finalStatus = await waitForRender(activeRenderJobId);
    if (finalStatus.state === "complete") {
      videoLink.href = `./output/broadcast-popup.mp4?t=${Date.now()}`;
      videoLink.classList.remove("is-hidden");
      if (outputFileHandle) {
        await saveRenderedVideoToOutputFile(outputFileHandle, videoLink.href);
        setStatus("status.videoSavedToPath");
      } else {
        setStatus("status.videoExported");
      }
      setRenderProgress({...finalStatus, progress: 1, remainingSeconds: 0});
    } else if (finalStatus.state === "canceled") {
      setStatus("status.exportCanceledClean");
      setRenderProgress(finalStatus);
    } else {
      throw new Error(finalStatus.error || "Render failed");
    }
  } catch (error) {
    if (error.message) setStatusText(error.message);
    else setStatus("status.exportFailed");
    setRenderProgress({state: "failed", error: error.message || t("status.exportFailed"), progress: 0, remainingSeconds: null});
  } finally {
    activeRenderJobId = "";
    renderRunning = false;
    renderButton.disabled = false;
    renderButton.textContent = t("toolbar.exportVideo");
    cancelRenderButton.disabled = false;
    cancelRenderButton.classList.add("is-hidden");
  }
}

async function chooseOutputFile() {
  const desktopApi = window.broadcastPopupDesktop;
  if (desktopApi?.chooseVideoSavePath) {
    const result = await desktopApi.chooseVideoSavePath({
      title: t("dialog.saveTitle"),
      buttonLabel: t("dialog.saveButton"),
      filterName: t("dialog.mp4Filter"),
      invalidSavePath: t("dialog.invalidSavePath"),
      outputMissing: t("dialog.outputMissing")
    });
    if (result?.canceled) {
      setStatus("status.exportCanceled");
      return false;
    }
    if (!result?.filePath) throw new Error(t("status.noSavePath"));
    return {kind: "desktop-save-path", path: result.filePath};
  }

  if (!("showSaveFilePicker" in window)) return null;

  try {
    return await window.showSaveFilePicker({
      suggestedName: "broadcast-popup.mp4",
      types: [
        {
          description: t("dialog.mp4Filter"),
          accept: {"video/mp4": [".mp4"]}
        }
      ]
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      setStatus("status.exportCanceled");
      return false;
    }
    throw error;
  }
}

async function saveRenderedVideoToOutputFile(fileHandle, href) {
  if (fileHandle?.kind === "desktop-save-path") {
    await window.broadcastPopupDesktop.saveRenderedVideo(fileHandle.path, {
      invalidSavePath: t("dialog.invalidSavePath"),
      outputMissing: t("dialog.outputMissing")
    });
    return;
  }

  const response = await fetch(href, {cache: "no-store"});
  if (!response.ok) throw new Error(t("status.writeOutputFailed"));
  const blob = await response.blob();
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function waitForRender(jobId) {
  while (activeRenderJobId === jobId) {
    const response = await fetch(`./api/render/status?id=${encodeURIComponent(jobId)}&t=${Date.now()}`, {
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || t("status.readProgressFailed"));

    setRenderProgress(payload);
    if (["complete", "failed", "canceled"].includes(payload.state)) return payload;
    await delay(900);
  }

  return {state: "canceled", progress: 0, remainingSeconds: null};
}

async function cancelRender() {
  if (!activeRenderJobId) return;
  cancelRenderButton.disabled = true;
  setStatus("status.cancelingExport");
  setRenderProgress({state: "canceling", progress: getCurrentRenderProgress(), remainingSeconds: null});

  try {
    await fetch("./api/render/cancel", {
      method: "POST",
      headers: {"Content-Type": "application/json; charset=utf-8"},
      body: JSON.stringify({jobId: activeRenderJobId})
    });
  } catch {
    setStatus("status.cancelRequestFailed");
    cancelRenderButton.disabled = false;
  }
}

function setRenderProgress(payload) {
  lastRenderProgressPayload = payload;
  const state = payload.state || "running";
  const progress = clamp(Number(payload.progress || 0), 0, 1);
  const percent = Math.round(progress * 100);
  const labels = {
    starting: t("progress.starting"),
    running: t("progress.running", {percent}),
    canceling: t("progress.canceling"),
    canceled: t("progress.canceled"),
    complete: t("progress.complete"),
    failed: t("progress.failed")
  };

  renderProgress.classList.remove("is-hidden");
  renderProgressBar.style.width = `${percent}%`;
  renderProgressLabel.textContent = labels[state] || labels.running;

  if (state === "complete") {
    renderEtaLabel.textContent = t("progress.remainingDone");
  } else if (state === "failed" || state === "canceled" || state === "canceling") {
    renderEtaLabel.textContent = t("progress.remainingUnknown");
  } else {
    renderEtaLabel.textContent = t("progress.remaining", {time: formatDuration(payload.remainingSeconds)});
  }
}

function getCurrentRenderProgress() {
  const width = String(renderProgressBar.style.width || "0").replace("%", "");
  return clamp((Number(width) || 0) / 100, 0, 1);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseTimedText(source) {
  const cueRows = parseCueBlocks(source);
  if (cueRows.length > 0) return normalizeRows(cueRows);
  return normalizeRows(parsePlainTimestampLines(source));
}

function parseCueBlocks(source) {
  const blocks = source
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/);

  const rows = [];

  for (const block of blocks) {
    const cueLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const timingIndex = cueLines.findIndex((line) => matchCueTimingLine(line));
    if (timingIndex === -1) continue;

    const timing = matchCueTimingLine(cueLines[timingIndex]);
    if (!timing) continue;

    const ja = cleanCueText(cueLines.slice(timingIndex + 1).join(" "));
    if (!ja) continue;

    rows.push({
      start: parseTime(timing.startText),
      end: parseTime(timing.endText),
      ja,
      zh: "",
      speaker: "RADIO"
    });
  }

  return rows;
}

function matchCueTimingLine(line) {
  if (line.includes("-->")) {
    const [left, right] = line.split(/-->/);
    const startText = extractTime(left);
    const endText = extractTime(right);
    return startText && endText ? {startText, endText} : null;
  }

  const sbvPattern = new RegExp(
    String.raw`^\s*(${TIME_PATTERN})\s*,\s*(${TIME_PATTERN})\s*$`,
    "u"
  );
  const match = line.match(sbvPattern);
  if (!match) return null;
  return {
    startText: match[1],
    endText: match[2]
  };
}

function parsePlainTimestampLines(source) {
  const sourceLines = source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^WEBVTT\b/i.test(line));

  const rows = [];
  let current = null;

  for (const line of sourceLines) {
    const range = matchRangeLine(line);
    if (range) {
      finishCurrent();
      rows.push({
        start: range.start,
        end: range.end,
        ja: cleanCueText(range.text),
        zh: "",
        speaker: "RADIO"
      });
      continue;
    }

    const prefixed = matchPrefixedLine(line);
    if (prefixed) {
      finishCurrent();
      current = {
        start: prefixed.start,
        end: null,
        textParts: [prefixed.text]
      };
      continue;
    }

    const timeOnly = matchTimeOnlyLine(line);
    if (timeOnly !== null) {
      finishCurrent();
      current = {
        start: timeOnly,
        end: null,
        textParts: []
      };
      continue;
    }

    if (current) current.textParts.push(line);
  }

  finishCurrent();
  return rows;

  function finishCurrent() {
    if (!current) return;
    const ja = cleanCueText(current.textParts.join(" "));
    if (ja) {
      rows.push({
        start: current.start,
        end: current.end,
        ja,
        zh: "",
        speaker: "RADIO"
      });
    }
    current = null;
  }
}

function normalizeRows(rows) {
  const sorted = rows
    .map((row) => ({
      ...row,
      start: Number(row.start),
      end: Number(row.end)
    }))
    .filter((row) => Number.isFinite(row.start) && (row.ja || row.zh))
    .sort((a, b) => a.start - b.start);

  for (let index = 0; index < sorted.length; index += 1) {
    const row = sorted[index];
    const next = sorted[index + 1];
    if (Number.isFinite(row.end) && row.end > row.start) continue;

    if (next && next.start > row.start + 0.05) {
      row.end = Math.max(row.start + 0.35, next.start - 0.05);
    } else {
      row.end = row.start + 4;
    }
  }

  return sorted.filter((row) => row.end > row.start);
}

function matchRangeLine(line) {
  const pattern = new RegExp(
    String.raw`^\s*\[?(${TIME_PATTERN})\]?\s*(?:-->|[-–—]|,)\s*\[?(${TIME_PATTERN})\]?\s+(.+)$`,
    "u"
  );
  const match = line.match(pattern);
  if (!match) return null;
  return {
    start: parseTime(match[1]),
    end: parseTime(match[2]),
    text: match[3]
  };
}

function matchPrefixedLine(line) {
  const pattern = new RegExp(
    String.raw`^\s*(?:\[(${TIME_PATTERN})\]|\((${TIME_PATTERN})\)|(${TIME_PATTERN}))\s*(?:[-–—:：]\s*)?(.+)$`,
    "u"
  );
  const match = line.match(pattern);
  if (!match) return null;
  return {
    start: parseTime(match[1] || match[2] || match[3]),
    text: match[4]
  };
}

function matchTimeOnlyLine(line) {
  const pattern = new RegExp(
    String.raw`^\s*(?:\[(${TIME_PATTERN})\]|\((${TIME_PATTERN})\)|(${TIME_PATTERN}))\s*$`,
    "u"
  );
  const match = line.match(pattern);
  if (!match) return null;
  return parseTime(match[1] || match[2] || match[3]);
}

function parseCsv(text) {
  const rows = readCsvRows(text.trim());
  if (rows.length <= 1) return [];

  const headers = rows[0].map((header) => header.trim());
  const index = Object.fromEntries(headers.map((header, column) => [normalizeHeader(header), column]));
  const startColumn = findColumn(index, ["start", "开始", "開始", "start time", "開始時間", "开始时间"]);
  const endColumn = findColumn(index, ["end", "结束", "結束", "end time", "結束時間", "结束时间"]);
  const jaColumn = findColumn(index, ["ja", "jp", "japanese", "日语", "日語", "日语原文", "日語原文", "原文"]);
  const zhColumn = findColumn(index, ["zh", "cn", "chinese", "中文", "中文翻译", "中文翻譯", "翻译", "翻譯", "translation", "subtitle", "字幕", "text"]);
  const speakerColumn = findColumn(index, ["speaker", "说话人", "說話人", "角色", "name"]);
  const timeColumn = findColumn(index, ["time", "timestamp", "时间戳", "时间戳记", "時間戳記"]);
  const textColumn = zhColumn !== -1 ? zhColumn : jaColumn;

  if (startColumn === -1 || endColumn === -1) {
    if (timeColumn !== -1 && textColumn !== -1) {
      return normalizeRows(rows.slice(1)
        .filter((row) => row.some((cell) => cell.trim() !== ""))
        .map((row) => ({
          start: parseTime(row[timeColumn] || "0"),
          end: null,
          ja: textColumn === jaColumn ? cleanImportedText(row[textColumn] || "") : "",
          zh: textColumn === zhColumn ? cleanImportedText(row[textColumn] || "") : "",
          speaker: speakerColumn !== -1 ? row[speakerColumn] || "RADIO" : "RADIO"
        })));
    }

    return parseTimedText(text);
  }

  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const rawJa = jaColumn !== -1 ? cleanImportedText(row[jaColumn] || "") : "";
      const rawZh = zhColumn !== -1 ? cleanImportedText(row[zhColumn] || "") : "";
      const importedTranslation = !rawZh && looksLikeImportedTranslation(rawJa);

      return {
        start: parseTime(row[startColumn] || "0"),
        end: parseTime(row[endColumn] || "0"),
        ja: importedTranslation ? "" : rawJa,
        zh: importedTranslation ? rawJa : rawZh,
        speaker: speakerColumn !== -1 ? row[speakerColumn] || "RADIO" : "RADIO"
      };
    })
    .filter((line) => line.end > line.start && (line.ja || line.zh))
    .sort((a, b) => a.start - b.start);
}

function normalizeHeader(value) {
  return String(value).trim().toLowerCase();
}

function findColumn(index, candidates) {
  for (const candidate of candidates) {
    const key = normalizeHeader(candidate);
    if (key in index) return index[key];
  }
  return -1;
}

function cleanImportedText(value) {
  let text = String(value ?? "").trim();
  if (text.startsWith(",")) text = text.slice(1).trim();
  if (text.length >= 2 && text.startsWith("\"") && text.endsWith("\"")) {
    text = text.slice(1, -1).replaceAll("\"\"", "\"").trim();
  }
  return text;
}

function looksLikeImportedTranslation(value) {
  return /^,\s*"/.test(String(value)) || /[這这是我你他她它們们會会讓让與与對对為为個个說说]/.test(value);
}

function readCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);
  return rows;
}

function buildCsv(rows) {
  const header = ["start", "end", "ja", "zh", "speaker"];
  const body = rows.map((row) => [
    formatCsvTime(row.start),
    formatCsvTime(row.end),
    row.ja,
    row.zh,
    row.speaker || "RADIO"
  ]);

  return [header, ...body]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n";
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function extractTime(value) {
  const match = String(value).match(timeRegex);
  return match ? match[0] : "";
}

function cleanCueText(value) {
  return decodeEntities(String(value))
    .replace(/<[^>]*>/g, "")
    .replace(/\{\\.*?\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function parseTime(value) {
  const input = String(value).trim().replace(",", ".");
  if (!input.includes(":")) return Number(input) || 0;
  const parts = input.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatClock(seconds) {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const wholeSeconds = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) return "--:--";
  const total = Math.max(0, Math.round(Number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatCsvTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    `${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
  ].join(":");
}

function formatSecondsInput(seconds) {
  return roundTenths(seconds).toFixed(1).replace(/\.0$/, "");
}

function roundTenths(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function getDuration() {
  const lineDuration = Math.max(...lines.map((line) => line.end), 1);
  const audioDuration = audioReady && Number.isFinite(audio.duration) ? audio.duration : 0;
  return Math.max(lineDuration, audioDuration, 1);
}

function downloadText(text, filename, type) {
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
