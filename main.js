const {app, BrowserWindow,ipcMain,dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

	// 获取当前可执行文件的路径
  const execPath = process.execPath;
 
  // 获取当前可执行文件的目录
  const execDir = path.dirname(execPath);
   
  console.log('Executable path:', execPath);
  console.log('Executable directory:', execDir);

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  let mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      preload: path.join(__dirname, 'preload.js'), 
     contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; img-src 'self' data:; style-src 'self';"
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
}

  ipcMain.on('encrypt-and-save', (event, { machineSerial, authorizationDays }) => {
    const keyGenerationDate = new Date().toISOString().split('T')[0];
    const jsonObject = {
      machineSerial,
      authorizationDays,
      keyGenerationDate,
    };
    const jsonStr = JSON.stringify(jsonObject);
    console.log(jsonStr);
    const encryptedStr = encryptData(jsonStr, 'aBcDeFgHiJkLmNoPqRsTuVwXyZ1234bb'); 
    const filePath = path.join(execDir, 'licences.data');
    saveLicenseToFile(encryptedStr, filePath);
    event.sender.send('license-saved', 'License file saved successfully.');
  });


  function encryptData(data, key) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
      let encrypted = cipher.update(data, 'utf8', 'buffer');
      encrypted = Buffer.concat([encrypted, cipher.final('buffer')]);
  
      return Buffer.concat([iv, encrypted]).toString('base64');
  
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

// 定义保存授权文件的函数
function saveLicenseToFile(licenseData, filePath) {
  fs.writeFile(filePath, licenseData, (err) => {
    if (err) {
      console.error('Error saving license file:', err);
      return;
    }
    console.log(`License data saved to ${filePath}`);

    // 使用 dialog 模块显示一个包含文件路径的提示框
    const options = {
      type: 'info',
      title: 'License File Saved',
      message: `The license file has been successfully saved to:\n${filePath}`,
      buttons: ['OK']
    };

    dialog.showMessageBox(options);
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});