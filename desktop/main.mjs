import {app, BrowserWindow, dialog, ipcMain, shell} from "electron";
import {copyFileSync, existsSync, mkdirSync, rmSync} from "node:fs";
import {dirname, extname, join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const desktopDir = dirname(fileURLToPath(import.meta.url));
const appRoot = dirname(desktopDir);
const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const dataRoot = join(app.getPath("temp"), "broadcast-popup-studio", sessionId);
const outputVideoPath = join(dataRoot, "output", "broadcast-popup.mp4");

let mainWindow = null;
let runtime = null;

app.setName("Broadcast Popup Studio");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  mkdirSync(join(dataRoot, "input"), {recursive: true});
  mkdirSync(join(dataRoot, "output"), {recursive: true});

  process.env.BPS_ASSET_ROOT = appRoot;
  process.env.BPS_DATA_ROOT = dataRoot;
  process.env.BPS_NODE_EXECUTABLE = process.execPath;
  process.env.BPS_ELECTRON = "1";

  const serverModule = await import(pathToFileURL(join(appRoot, "server.mjs")).href);
  runtime = await serverModule.startServer({port: 0});

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 920,
    minWidth: 1040,
    minHeight: 720,
    title: "Broadcast Popup Studio",
    backgroundColor: "#f4f6f2",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(desktopDir, "preload.cjs"),
      sandbox: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadURL(`${runtime.url}/?desktop=1`);

  mainWindow.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: "deny"};
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

ipcMain.handle("choose-video-save-path", async (_event, options = {}) => {
  const defaultDir = app.getPath("videos") || app.getPath("desktop");
  const result = await dialog.showSaveDialog(mainWindow || undefined, {
    title: options.title || "Save Exported Video",
    defaultPath: join(defaultDir, "broadcast-popup.mp4"),
    buttonLabel: options.buttonLabel || "Save",
    filters: [
      {name: options.filterName || "MP4 Video", extensions: ["mp4"]},
    ],
    properties: ["createDirectory", "showOverwriteConfirmation"],
  });

  if (result.canceled || !result.filePath) {
    return {canceled: true, filePath: ""};
  }

  return {canceled: false, filePath: ensureMp4Extension(result.filePath)};
});

ipcMain.handle("save-rendered-video", async (_event, targetPath, options = {}) => {
  if (!targetPath || typeof targetPath !== "string") {
    throw new Error(options.invalidSavePath || "Invalid save location");
  }
  if (!existsSync(outputVideoPath)) {
    throw new Error(options.outputMissing || "Export completed, but the generated video file was not found");
  }

  const finalPath = ensureMp4Extension(targetPath);
  copyFileSync(outputVideoPath, finalPath);
  return {ok: true, path: finalPath};
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  if (runtime?.server) runtime.server.close();
  try {
    rmSync(dataRoot, {recursive: true, force: true});
  } catch {
    // Temporary workspace cleanup should never block app shutdown.
  }
});

function ensureMp4Extension(path) {
  return extname(path).toLowerCase() === ".mp4" ? path : `${path}.mp4`;
}
