const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

const BACKEND_PORT = 8080;
const FRONTEND_PORT = 5173;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function waitForPort(port, timeoutMs = 45000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const open = await isPortOpen(port);
      if (open) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 1000);
  });
}

async function startBackendIfNeeded() {
  const backendRunning = await isPortOpen(BACKEND_PORT);
  if (backendRunning) {
    console.log(`Backend server is already running on port ${BACKEND_PORT}.`);
    return true;
  }

  console.log('Starting Spring Boot Backend process...');
  const rootDir = path.resolve(__dirname, '..');
  const backendDir = path.join(rootDir, 'backend');
  const jarPath = path.join(backendDir, 'target', 'business-erp-backend-1.0.0.jar');

  const env = { ...process.env, JAVA_HOME: 'C:\\Program Files\\Java\\jdk-17' };

  if (fs.existsSync(jarPath)) {
    backendProcess = spawn('java', ['-jar', jarPath, '--spring.profiles.active=dev'], {
      cwd: backendDir,
      shell: true,
      env: env,
      stdio: 'ignore'
    });
  } else {
    // Run via maven wrapper / maven command
    const mvnCmd = process.platform === 'win32'
      ? (fs.existsSync(path.join(backendDir, 'mvnw.cmd')) ? 'mvnw.cmd' : 'mvn.cmd')
      : './mvnw';
    backendProcess = spawn(mvnCmd, ['spring-boot:run'], {
      cwd: backendDir,
      shell: true,
      env: env,
      stdio: 'ignore'
    });
  }

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });

  return await waitForPort(BACKEND_PORT);
}

async function startFrontendIfNeeded() {
  const distHtml = path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html');
  if (fs.existsSync(distHtml)) {
    return { type: 'file', path: distHtml };
  }

  const devServerRunning = await isPortOpen(FRONTEND_PORT);
  if (!devServerRunning) {
    console.log('Starting Vite Frontend dev server...');
    const frontendDir = path.resolve(__dirname, '..', 'frontend');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    frontendProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: frontendDir,
      shell: true,
      stdio: 'ignore'
    });
    await waitForPort(FRONTEND_PORT);
  }

  return { type: 'url', url: `http://localhost:${FRONTEND_PORT}` };
}

function createMainWindow(targetLocation) {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Business ERP AI - Enterprise Management',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    autoHideMenuBar: false,
    show: false
  });

  if (targetLocation.type === 'file') {
    mainWindow.loadFile(targetLocation.path);
  } else {
    mainWindow.loadURL(targetLocation.url);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open target links externally in user browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  createApplicationMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createApplicationMenu() {
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload App',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'toggledevtools', label: 'Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Business ERP AI',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Business ERP AI',
              message: 'Business ERP AI Desktop Edition',
              detail: 'Multi-Tenant SaaS ERP Platform for Businesses.\nVersion 1.0.0\nBuilt with React, Spring Boot, & Electron.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  console.log('Initializing Business ERP Desktop App...');
  
  // Start backend & frontend if needed
  startBackendIfNeeded().catch(err => console.error('Backend startup check:', err));
  const target = await startFrontendIfNeeded();

  createMainWindow(target);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(target);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  console.log('Shutting down Business ERP Desktop process...');
  if (backendProcess) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`);
      } else {
        backendProcess.kill();
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
  if (frontendProcess) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${frontendProcess.pid} /T /F`);
      } else {
        frontendProcess.kill();
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
});
