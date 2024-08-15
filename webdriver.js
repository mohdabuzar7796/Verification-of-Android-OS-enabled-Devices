const adb = require("adbkit");
const client = adb.createClient();
const fs = require("fs");
const xlsx = require("xlsx");
const { createWorker } = require("tesseract.js");
const path = require("path");
const { remote } = require("webdriverio");

const apkPath = path.resolve(
  __dirname,
  "C:\\Users\\HP\\Downloads\\APKPure_v3.20.16_apkpure.com.apk"
);

// Function to list all connected devices
async function listDevices() {
  try {
    const devices = await client.listDevices();
    console.log("Connected devices:", devices);
    return devices;
  } catch (err) {
    console.error("Error occurred while listing devices:", err);
    throw err;
  }
}

// Function to connect to a device by IP (if needed)
async function connectDevice(ip) {
  try {
    const connect = await client.connect(ip, 5555);
    console.log("Connected to device:", ip);
    return connect;
  } catch (err) {
    console.error("Error occurred while connecting to device:", err);
    throw err;
  }
}

// Function to install an APK on a device
async function installApk(deviceId, apkPath) {
  try {
    await client.install(deviceId, apkPath);
    console.log(`Successfully installed ${apkPath} on device ${deviceId}`);
  } catch (err) {
    console.error(`Failed to install ${apkPath} on device ${deviceId}:`, err);
    throw err;
  }
}

// Function to take a screenshot from a device
async function takeScreenshot() {
  try {
    const devices = await listDevices();
    if (devices.length === 0) {
      console.log("No device connected");
      return;
    }

    const deviceId = devices[0].id;
    const screenshot = await client.shell(deviceId, "screencap -p");
    const chunks = [];

    screenshot.on("data", (chunk) => chunks.push(chunk));
    screenshot.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const screenshotPath = path.join(__dirname, "screenshot.png");
      fs.writeFileSync(screenshotPath, buffer);
      console.log("Screenshot saved as screenshot.png");
      // Optionally perform OCR on the screenshot
      // performOCR(screenshotPath);
    });
  } catch (err) {
    console.error("Failed to take screenshot:", err);
    throw err;
  }
}

// Function to initialize an Appium WebDriver session
async function initializeAppiumSession(deviceId) {
  try {
    const options = {
      path: '/wd/hub',
      port: 4723,
      capabilities: {
        platformName: "Android",
        deviceName: deviceId,
        appPackage: "com.example.app", // Replace with the target app package
        appActivity: ".MainActivity", // Replace with the target app activity
        automationName: "UiAutomator2"
      }
    };

    const driver = await remote(options);
    console.log(`Appium session started on device ${deviceId}`);
    return driver;
  } catch (err) {
    console.error("Failed to start Appium session:", err);
    throw err;
  }
}

// Function to perform a test using Appium
async function runAppiumTest() {
  try {
    const devices = await listDevices();
    if (devices.length === 0) {
      console.log("No device connected");
      return;
    }

    const deviceId = devices[0].id;
    const driver = await initializeAppiumSession(deviceId);

    // Example interaction: Open an app and perform a tap action
    await driver.touchAction({
      action: 'tap',
      x: 200,
      y: 500
    });
    console.log("Performed tap action");

    await driver.deleteSession();
    console.log("Appium session ended");
  } catch (err) {
    console.error("Error occurred during Appium test:", err);
    throw err;
  }
}

// Exporting functions for external use
module.exports = {
  listDevices,
  connectDevice,
  installApk,
  takeScreenshot,
  initializeAppiumSession,
  runAppiumTest
};

// Example usage
(async () => {
  try {
    await listDevices();
    await takeScreenshot();
    await runAppiumTest();
  } catch (err) {
    console.error("An error occurred in the example usage:", err);
  }
})();
