const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("broadcastPopupDesktop", {
  chooseVideoSavePath: (options) => ipcRenderer.invoke("choose-video-save-path", options),
  saveRenderedVideo: (targetPath, options) => ipcRenderer.invoke("save-rendered-video", targetPath, options),
});
