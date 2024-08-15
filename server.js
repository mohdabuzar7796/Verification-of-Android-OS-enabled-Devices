const express = require("express");
const adb = require("adbkit");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;
const client = adb.createClient();

const apkPath = path.resolve(
  __dirname,
  "C:\\Users\\HP\\Downloads\\APKPure_v3.20.16_apkpure.com.apk"
);

let testResults = {
  passed: 0,
  failed: 0,
  details: []
};

// Logging function
function log(message) {
  const logPath = "logfile.log";
  fs.appendFileSync(logPath, message + "\n", (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

// Test functions
async function listDevices() {
  try {
    const devices = await client.listDevices();
    log(Date() + " PASS: Devices listed successfully");
    return devices;
  } catch (err) {
    log(Date() + " FAIL: Error listing devices: " + err.message);
    throw err;
  }
}

async function getDeviceProperties() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      log(Date() + " FAIL: No devices connected");
      throw new Error("No devices connected");
    }

    for (const device of devices) {
      const properties = await client.getProperties(device.id);
      const details = {
        model: properties["ro.product.model"],
        brand: properties["ro.product.brand"],
        androidVersion: properties["ro.build.version.release"],
        sdkVersion: properties["ro.build.version.sdk"],
      };
      log(Date() + " PASS: " + JSON.stringify(details));
    }
    return devices;
  } catch (err) {
    log(Date() + " FAIL: Error getting properties: " + err.message);
    throw err;
  }
}

async function installApk() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      log(Date() + " FAIL: No Device Connected");
      throw new Error("No Device Connected");
    }

    for (const device of devices) {
      await client.install(device.id, apkPath);
      log(Date() + " PASS: App successfully installed on " + device.id);
    }
  } catch (err) {
    log(Date() + " FAIL: App not installed: " + err.message);
    throw err;
  }
}

async function getPackages() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      log(Date() + " FAIL: No device connected");
      throw new Error("No device connected");
    }

    for (const device of devices) {
      const packages = await client.getPackages(device.id);
      log(Date() + " PASS: Installed packages on device " + device.id);
    }
  } catch (err) {
    log(Date() + " FAIL: Could not fetch packages: " + err.message);
    throw err;
  }
}

async function takeScreenshot() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      log(Date() + " FAIL: No device connected");
      throw new Error("No device connected");
    }

    const deviceId = devices[0].id;
    const screenshot = await client.shell(deviceId, "screencap -p");
    const chunks = [];

    screenshot.on("data", (chunk) => chunks.push(chunk));
    screenshot.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const screenshotPath = path.join(__dirname, "screenshot.png");
      fs.writeFileSync(screenshotPath, buffer);
      log(Date() + " PASS: Screenshot successfully taken on " + deviceId);
    });
  } catch (err) {
    log(Date() + " FAIL: Screenshot not taken: " + err.message);
    throw err;
  }
}

async function sendText(text) {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      log(Date() + " FAIL: No devices connected");
      throw new Error("No devices connected");
    }
    const deviceId = devices[0].id;

    const encodedText = text.replace(/ /g, "%s");
    await client.shell(deviceId, `input text "${encodedText}"`);
    log(Date() + " PASS: Text \"" + text + "\" sent to device " + deviceId);
  } catch (err) {
    log(Date() + " FAIL: Text not sent: " + err.message);
    throw err;
  }
}

async function scrollDown() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      log(Date() + " FAIL: No device connected");
      throw new Error("No device connected");
    }

    const deviceId = devices[0].id;
    const startX = 500;
    const startY = 1000;
    const endX = 500;
    const endY = 200;
    const duration = 500;

    await client.shell(
      deviceId,
      `input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`
    );
    log(Date() + " PASS: Scroll down action performed on device " + deviceId);
  } catch (err) {
    log(Date() + " FAIL: Scroll down action failed: " + err.message);
    throw err;
  }
}

async function runtestcases() {
  await listDevices();
  await getDeviceProperties();
  await installApk();
  await getPackages();
  await takeScreenshot();
  await sendText("Hello World");
  await scrollDown();
}

// Endpoints
app.get("/test", async (req, res) => {
  testResults = { passed: 0, failed: 0, details: [] };
  try {
    await listDevices();
    await getDeviceProperties();
    await installApk();
    await getPackages();
    await takeScreenshot();
    await sendText("Hello World");
    await scrollDown();
    testResults.passed = testResults.details.filter(result => result.status === 'PASS').length;
    testResults.failed = testResults.details.filter(result => result.status === 'FAIL').length;
    res.json(testResults);
  } catch (err) {
    testResults.failed++;
    res.status(500).json(testResults);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
