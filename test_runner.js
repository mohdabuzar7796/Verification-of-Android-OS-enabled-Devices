const adb = require("adbkit");
const Bluebird = require("bluebird");
const fs = require("fs");
const XLSX = require("xlsx");
const path = require("path");
let failed = 0;
let passed = 0;

const client = adb.createClient();
const testResults = [];
function log(message) {
  const logPath = "logfile.log";
  fs.appendFileSync(logPath, message + "\n", (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

// Read test cases from Excel file
function readTestCasesFromExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["TestCases"];
  const data = XLSX.utils.sheet_to_json(sheet);
  return data;
}

// Define test case functions
async function listDevices() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    console.log("Connected devices:", devices);

    await devices.forEach((device) => {
      passed++;

      testResults.push({
        name: "List Devices",
        status: "passed",
        message: `Device ${device.id} listed successfully`,
      });
      log(`${Date()} PASS: Device ${device.id} listed successfully`);
    });
  } catch (err) {
    console.error("Error occurred:", err);
    failed++;
    testResults.push({
      name: "List Devices",
      status: "failed",
      message: "Error listing devices: " + err.message,
    });
    log(`${Date()} FAIL: Error listing devices: ${err.message}`);
  }
}

async function getDeviceProperties(deviceId) {
  try {
    const props = await client.getProperties(deviceId);
    console.log("Device Properties:", props);
  } catch (err) {
    console.error("Error getting device properties:", err);
  }
}

async function installAPK(deviceId, apkPath) {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    for (const device of devices) {
      await client.install(
        device.id,
        // path.join(__dirname, config.apkPath) // Corrected path
        config.apkPath
      );
      console.log(`Successfully installed APK on device ${device.id}`);
      passed++;
      testResults.push({
        name: "Install APK",
        status: "passed",
        message: `APK installed successfully on device ${device.id}`,
      });
      log(`${Date()} PASS: APK installed successfully on device ${device.id}`);
    }
  } catch (err) {
    console.error("Failed to install APK:", err.message);
    failed++;
    testResults.push({
      name: "Install APK",
      status: "failed",
      message: "Failed to install APK: " + err.message,
    });
    log(`${Date()} FAIL: Failed to install APK: ${err.message}`);
  }
}

async function fetchInstalledPackages(deviceId) {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    for (const device of devices) {
      const packages = await client.getPackages(device.id);
      console.log(`Installed packages on device ${device.id}:`, packages);
      passed++;
      testResults.push({
        name: "Fetch Installed Packages",
        status: "passed",
        message: `Installed packages fetched successfully for device ${device.id}`,
      });
      log(
        `${Date()} PASS: Installed packages fetched successfully for device ${
          device.id
        }`
      );
    }
  } catch (err) {
    console.error("Failed to fetch installed packages:", err.message);
    failed++;
    testResults.push({
      name: "Fetch Installed Packages",
      status: "failed",
      message: "Failed to fetch installed packages: " + err.message,
    });
    log(`${Date()} FAIL: Failed to fetch installed packages: ${err.message}`);
  }
}

async function takeScreenshot(deviceId, filePath) {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    // Loop through each device and take a screenshot
    for (const device of devices) {
      const screenshot = await client.shell(device.id, "screencap -p");
      const chunks = [];

      screenshot.on("data", (chunk) => chunks.push(chunk));

      // Wait for the 'end' event using a Promise
      await new Promise((resolve, reject) => {
        screenshot.on("end", () => {
          try {
            const buffer = Buffer.concat(chunks);
            const screenshotPath = path.join(
              __dirname,
              `screenshot_${device.id}.png`
            );
            fs.writeFileSync(screenshotPath, buffer);
            console.log(`Screenshot saved as screenshot_${device.id}.png`);
            passed++;
            testResults.push({
              name: "Take Screenshot",
              status: "passed",
              message: `Screenshot taken successfully on device ${device.id}`,
            });
            log(
              `${Date()} PASS: Screenshot taken successfully on device ${
                device.id
              }`
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        screenshot.on("error", (err) => {
          reject(err);
        });
      });
    }
  } catch (err) {
    console.error("Failed to take screenshot:", err.message);
    failed++;
    testResults.push({
      name: "Take Screenshot",
      status: "failed",
      message: "Failed to take screenshot: " + err.message,
    });
    log(`${Date()} FAIL: Failed to take screenshot: ${err.message}`);
  }
}

async function sendText(deviceId, text) {
  try {
    await client.shell(deviceId, `input text '${text}'`);
    console.log("Text sent to device");
  } catch (err) {
    console.error("Error sending text:", err);
  }
}

async function scrollDown(deviceId) {
  try {
    await client.shell(deviceId, "input swipe 500 1500 500 500");
    console.log("Scrolled down on device");
  } catch (err) {
    console.error("Error scrolling down:", err);
  }
}

// Execute test cases from Excel
(async () => {
  const testCases = readTestCasesFromExcel("testCases.xlsx");

  console.log("Test Cases:", testCases); // Debugging line

  for (const testCase of testCases) {
    if (!testCase.TestCase) {
      console.error("TestCase field is missing:", testCase);
      continue;
    }

    const [action, param] = testCase.TestCase.split(" ");

    switch (action) {
      case "List":
        await listDevices();
        break;
      case "Get":
        await getDeviceProperties(param.split("=")[1]);
        break;
      case "Install":
        await installAPK(param.split("=")[1], "path-to-your-apk.apk");
        break;
      case "Fetch":
        await fetchInstalledPackages(param.split("=")[1]);
        break;
      case "Take":
        await takeScreenshot(param.split("=")[1], "screenshot.png");
        break;
      case "Send":
        await sendText(param.split("=")[1], "Hello, world!");
        break;
      case "Scroll":
        await scrollDown(param.split("=")[1]);
        break;
      default:
        console.log("Unknown test case:", testCase.TestCase);
    }
  }
})();
