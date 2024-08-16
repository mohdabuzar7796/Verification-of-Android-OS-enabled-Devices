const express = require("express");
const path = require("path");
const fs = require("fs");
const adbkit = require("adbkit");
const client = adbkit.createClient();
const app = express();
const port = 9000;
const config = require("./config.json");

// Array to store test results
const testResults = [];
let passed = 0;
let failed = 0;

// Middleware to serve static files
app.use(express.static("public"));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Set EJS as templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Logging function
function log(message) {
  const logPath = "logfile.log";
  fs.appendFileSync(logPath, message + "\n", (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}
// Test cases
async function testListDevices() {
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

async function testGetDeviceProperties() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
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
      console.log(`Device ${device.id} properties:`, details);
      passed++;
      testResults.push({
        name: "Get Device Properties",
        status: "passed",
        message: `Device properties fetched successfully for device ${device.id}`,
      });
      log(
        `${Date()} PASS: Device properties fetched successfully for device ${
          device.id
        }`
      );
    }
  } catch (err) {
    console.error("Error getting device properties:", err.message);
    failed++;
    testResults.push({
      name: "Get Device Properties",
      status: "failed",
      message: "Error getting device properties: " + err.message,
    });
    log(`${Date()} FAIL: Error getting device properties: ${err.message}`);
  }
}

async function testInstallAPK() {
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

async function testFetchInstalledPackages() {
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

async function testTakeScreenshot() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    for (const device of devices) {
      const screenshot = await client.shell(device.id, "screencap -p");
      const chunks = [];

      screenshot.on("data", (chunk) => chunks.push(chunk));
      screenshot.on("end", () => {
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
          `${Date()} PASS: Screenshot taken successfully on device ${device.id}`
        );
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
async function testSendTextToDevice(text) {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    for (const device of devices) {
      const encodedText = text.replace(/ /g, "%s");
      await client.shell(device.id, `input text "${encodedText}"`);
      console.log(`Text "${text}" sent to device ${device.id}.`);
      passed++;
      testResults.push({
        name: "Send Text to Device",
        status: "passed",
        message: `Text sent to device ${device.id} successfully`,
      });
      log(`${Date()} PASS: Text sent to device ${device.id} successfully`);
    }
  } catch (err) {
    console.error("Failed to send text to device:", err.message);
    failed++;
    testResults.push({
      name: "Send Text to Device",
      status: "failed",
      message: "Failed to send text to device: " + err.message,
    });
    log(`${Date()} FAIL: Failed to send text to device: ${err.message}`);
  }
}

async function testScrollDown() {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    for (const device of devices) {
      const startX = 500;
      const startY = 1000;
      const endX = 500;
      const endY = 200;
      const duration = 500;

      await client.shell(
        device.id,
        `input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`
      );
      console.log("Scroll down action performed on device", device.id);
      passed++;
      testResults.push({
        name: "Scroll Down",
        status: "passed",
        message: `Scroll down action performed successfully on device ${device.id}`,
      });
      log(
        `${Date()} PASS: Scroll down action performed successfully on device ${
          device.id
        }`
      );
    }
  } catch (err) {
    console.error("Failed to scroll down on device:", err.message);
    failed++;
    testResults.push({
      name: "Scroll Down",
      status: "failed",
      message: "Failed to scroll down on device: " + err.message,
    });
    log(`${Date()} FAIL: Failed to scroll down on device: ${err.message}`);
  }
}

async function runTestCases() {
  // Reset counters and results
  passed = 0;
  failed = 0;
  testResults.length = 0;

  // Define your test cases
  await testListDevices();
  await testGetDeviceProperties();
  await testInstallAPK();
  await testFetchInstalledPackages();
  await testTakeScreenshot();
  await testSendTextToDevice(config.text);
  await testScrollDown();
}

// Route to display test results

app.get("/results", async (req, res) => {
  await runTestCases();
  res.render("results", {
    totalTests: passed + failed,
    passed,
    failed,
    testResults,
  });
});

app.get("/", async (req, res) => {
  try {
    const devices = await client.listDevices();
    const testCases = [
      "List Devices",
      "Get Device Properties",
      "Install APK",
      "Fetch Installed Packages",
      "Take Screenshot",
      "Send Text to Device",
      "Scroll Down",
    ];

    res.render("home", {
      devices,
      testCases,
    });
  } catch (err) {
    console.error("Error getting device or test case info:", err.message);
    res.status(500).send("Error fetching device or test case information.");
  }
});

// Route to run specific test case
app.get("/run-test/:testName", async (req, res) => {
  const testName = req.params.testName;

  // Define a mapping from test names to test functions
  const testFunctions = {
    "List Devices": testListDevices,
    "Get Device Properties": testGetDeviceProperties,
    "Install APK": testInstallAPK,
    "Fetch Installed Packages": testFetchInstalledPackages,
    "Take Screenshot": testTakeScreenshot,
    "Send Text to Device": () => testSendTextToDevice("Hello, World!"),
    "Scroll Down": testScrollDown,
  };

  try {
    if (testFunctions[testName]) {
      await testFunctions[testName]();
      res.status(200);
      // res.redirect("/results");
    } else {
      res.status(400).send("Invalid test case.");
    }
  } catch (err) {
    console.error("Error running test case:", err.message);
    res.status(500).send("Error running test case.");
  }
});

// Route to run all test cases
// app.get("run-test/all", async (req, res) => {
//   try {
//     await runTestCases();
//     res.redirect("/results");
//   } catch (err) {
//     console.error("Error running all test cases:", err.message);
//     res.status(500).send("Error running all test cases.");
//   }
// });

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
