const fs = require('fs');
const path = require('path');
const { 
  listDevices, 
  connectDevice, 
  runTest, 
  getNetworkOperator, 
  checkNetwork, 
  sendTextToDevice, 
  scrollDown, 
  click, 
  writeText 
} = require('./adb'); // Update with your actual path

const logFilePath = path.join(__dirname, 'testResults.txt');

beforeAll(() => {
  // Clear the log file before running the tests
  fs.writeFileSync(logFilePath, 'Test Results:\n');
});

afterEach(() => {
  // Add a separator after each test case
  fs.appendFileSync(logFilePath, '---\n');
});

describe('Android Framework Tests', () => {
  
  test('Should list connected devices', async () => {
    const devices = await listDevices();
    expect(Array.isArray(devices)).toBe(true);
    logResult('Should list connected devices', devices.length > 0);
  });

//   test('Should connect to a device', async () => {
//     const ip = '192.168.1.100'; // Replace with an actual device IP for testing
//     const connect = await connectDevice(ip);
//     expect(connect).toBeTruthy();
//     logResult('Should connect to a device', !!connect);
//   });

//   test('Should run a test command on a device', async () => {
//     const devices = await listDevices();
//     if (devices.length === 0) throw new Error('No devices connected');
//     const result = await runTest(devices[0].id, 'ls'); // 'ls' is an example command
//     expect(result).toBeDefined();
//     logResult('Should run a test command on a device', result.includes(''));
//   });

  test('Should get network operator', async () => {
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    const operator = await getNetworkOperator(devices[0].id);
    expect(operator).toBeDefined();
    logResult('Should get network operator', operator !== null);
  });

  test('Should check network connection', async () => {
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    const deviceId = devices[0].id;
    const expectedNetwork = 'YourNetworkName'; // Replace with an expected network name
    const logMsg = await checkNetwork(deviceId, expectedNetwork);
    logResult('Should check network connection', logMsg.includes('PASS') || logMsg.includes('FAIL'));
  });

  test('Should send text to a device', async () => {
    const text = 'Hello World';
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    await sendTextToDevice(text);
    logResult('Should send text to a device', true);
  });

  test('Should perform scroll down action', async () => {
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    const deviceId = devices[0].id;
    await scrollDown(deviceId);
    logResult('Should perform scroll down action', true);
  });

  test('Should perform click action', async () => {
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    const deviceId = devices[0].id;
    await click(deviceId, 200, 1500); // Replace with actual coordinates
    logResult('Should perform click action', true);
  });

  test('Should write text to the device', async () => {
    const text = 'Hello SAMAR ABBAS';
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    const deviceId = devices[0].id;
    await writeText(deviceId, text);
    logResult('Should write text to the device', true);
  });

//   test('Should perform screen recording', async () => {
//     const ScreenRecord = require('../your-framework-directory/yourFramework').ScreenRecord; // Import if not already
//     const result = await ScreenRecord();
//     logResult('Should perform screen recording', result);
//   });

  test('Should install APK on a device', async () => {
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    const deviceId = devices[0].id;
    const apkPath = path.join(_dirname, '1.1.1.1 + WARP Safer Internet_6.33_APKPure.apk'); // Adjust the path
    const installResult = await client.install(deviceId, apkPath);
    logResult('Should install APK on a device', installResult.includes('Success'));
  });

  test('Should list installed packages on a device', async () => {
    const devices = await listDevices();
    if (devices.length === 0) throw new Error('No devices connected');
    const deviceId = devices[0].id;
    const packages = await client.getPackages(deviceId);
    expect(Array.isArray(packages)).toBe(true);
    logResult('Should list installed packages on a device', packages.length > 0);
  });

  test('Should take screenshot of a device', async () => {
    const takeScreenshot = require('../your-framework-directory/yourFramework').takeScreenshot; // Import if not already
    const result = await takeScreenshot();
    logResult('Should take screenshot of a device', result);
  });

//   test('Should perform OCR on the screenshot', async () => {
//     const performOCR = require('../your-framework-directory/yourFramework').performOCR; // Import if not already
//     const imagePath = path.join(__dirname, 'screenshot.png');
//     const ocrResult = await performOCR(imagePath);
//     logResult('Should perform OCR on the screenshot', !!ocrResult);
//   });

});

function logResult(testDescription, result) {
  const logMessage = `${testDescription}: ${result ? 'PASS' : 'FAIL'}\n`;
  fs.appendFileSync(logFilePath, logMessage);
}