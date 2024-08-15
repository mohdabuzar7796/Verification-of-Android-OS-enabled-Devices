const adb = require("adbkit");
const client = adb.createClient();
const fs = require("fs");
const path = require("path");

const apkPath = path.resolve(
  __dirname,
  "C:\\Users\\HP\\Downloads\\APKPure_v3.20.16_apkpure.com.apk"
);

let passed = 0;
let failed = 0;

// Logging function
function log(message) {
  const logPath = "logfile.log";
  fs.appendFileSync(logPath, message + "\n", (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

// Test case structure
async function runTestCases() {
  await testListDevices();
  await testGetDeviceProperties();
  await testInstallAPK();
  await testFetchInstalledPackages();
  await testTakeScreenshot();
  await testSendTextToDevice("Hello World");
  await testScrollDown();
  generateSummary();
}

// Test 1: List connected devices
async function testListDevices() {
  try {
    const devices = await client.listDevices();
    console.log("Connected devices:", devices);

    if (devices.length > 0) {
      passed++;
      log(Date() + " PASS: Devices listed successfully");
    } else {
      failed++;
      log(Date() + " FAIL: No devices connected");
    }
  } catch (err) {
    failed++;
    console.log("Error occurred:", err);
    log(Date() + " FAIL: Error listing devices: " + err.message);
  }
}

// Test 2: Get device properties
async function testGetDeviceProperties() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      console.log("No devices connected");
      failed++;
      log(Date() + " FAIL: No devices connected");
      return;
    }

    for (const device of devices) {
      const properties = await client.getProperties(device.id);
      const details = {
        model: properties["ro.product.model"],
        brand: properties["ro.product.brand"],
        androidVersion: properties["ro.build.version.release"],
        sdkVersion: properties["ro.build.version.sdk"],
      };

      passed++;
      log(Date() + " PASS: " + JSON.stringify(details));
      console.log(details);
    }
  } catch (err) {
    failed++;
    console.error("Error getting properties:", err.message);
    log(Date() + " FAIL: Error getting properties: " + err.message);
  }
}

// Test 3: Install APK on devices
async function testInstallAPK() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      console.log("No devices connected");
      failed++;
      log(Date() + " FAIL: No devices connected");
      return;
    }

    for (const device of devices) {
      await client.install(device.id, apkPath);
      passed++;
      console.log(`Successfully installed ${apkPath} on device ${device.id}`);
      log(Date() + " PASS: App successfully installed on " + device.id);
    }
  } catch (err) {
    failed++;
    console.error(`Failed to install ${apkPath} on device:`, err.message);
    log(Date() + " FAIL: App not installed on device: " + err.message);
  }
}

// Test 4: Fetch installed packages
async function testFetchInstalledPackages() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      console.log("No devices connected");
      failed++;
      log(Date() + " FAIL: No devices connected");
      return;
    }

    for (const device of devices) {
      const packages = await client.getPackages(device.id);
      console.log(`Installed packages on device ${device.id}:`);
      passed++;
      log(Date() + " PASS: Installed packages on device " + device.id);
      // Uncomment the line below to log each package
      // packages.forEach((pkg) => console.log(pkg));
    }
  } catch (err) {
    failed++;
    console.error("Failed to get packages:", err.message);
    log(Date() + " FAIL: Could not fetch packages from device: " + err.message);
  }
}

// Test 5: Take screenshot
async function testTakeScreenshot() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      console.log("No devices connected");
      failed++;
      log(Date() + " FAIL: No devices connected");
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
      passed++;
      console.log("Screenshot saved as screenshot.png");
      log(Date() + " PASS: Screenshot successfully taken on " + deviceId);
    });
  } catch (err) {
    failed++;
    console.error("Failed to take screenshot:", err.message);
    log(Date() + " FAIL: Screenshot not taken: " + err.message);
  }
}

// Test 6: Send text to device
async function testSendTextToDevice(text) {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      console.log("No devices connected");
      failed++;
      log(Date() + " FAIL: No devices connected");
      return;
    }

    const deviceId = devices[0].id;
    const encodedText = text.replace(/ /g, "%s");
    await client.shell(deviceId, `input text "${encodedText}"`);
    passed++;
    console.log(`Text "${text}" sent to device.`);
    log(Date() + ' PASS: Text "' + text + '" sent to device ' + deviceId);
  } catch (err) {
    failed++;
    console.error("An error occurred:", err.message);
    log(Date() + " FAIL: Text not sent to device: " + err.message);
  }
}

// Test 7: Scroll down on the device
async function testScrollDown() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      console.log("No devices connected");
      failed++;
      log(Date() + " FAIL: No devices connected");
      return;
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
    passed++;
    console.log("Scroll down action performed");
    log(Date() + " PASS: Scroll down action performed on device " + deviceId);
  } catch (err) {
    failed++;
    console.error("Error performing scroll action:", err.message);
    log(Date() + " FAIL: Scroll down action failed on device: " + err.message);
  }
}

// Generate summary of test results
function generateSummary() {
  console.log(`Test Summary: PASSED -> ${passed}, FAILED -> ${failed}`);
  log(Date() + ` SUMMARY: PASSED -> ${passed}, FAILED -> ${failed}`);
}

// Execute test cases
runTestCases();
