const express = require("express");
const path = require("path");
const fs = require("fs");
const adbkit = require("adbkit");
const client = adbkit.createClient();
const xlsx = require("xlsx");

const app = express();
const port = 9000;
const config = require("./config.json");
const { trace } = require("console");

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

//Wifi Connexction
async function enableWirelessDebugging(networkName, password) {
  try {
    // Get a list of connected devices
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }

    for (const device of devices) {
      console.log(`Processing device: ${device.id}`);

      // Connect the device to the specified Wi-Fi network
      const connectCommand = `am broadcast -a android.intent.action.WIFI_STATE_CHANGED --ez state true --es extra_wifi_network_ssid "${networkName}" --es extra_wifi_network_password "${password}"`;
      await client.shell(device.id, connectCommand);
      console.log(`Sent Wi-Fi connect command to device ${device.id}`);

      // Wait for the device to connect to the Wi-Fi network
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Increase if needed

      // Enable wireless debugging on the device
      await client.shell(device.id, "adb tcpip 5555");
      console.log(`Enabled wireless debugging on device ${device.id}`);

      // Optionally, retrieve the device's IP address
      const ipCommand =
        "ip -f inet addr show wlan0 | grep \"inet\" | awk '{print $2}' | cut -d/ -f1";
      const ipResult = await client.shell(device.id, ipCommand);
      const ip = await adbkit.util.readAll(ipResult).toString().trim();
      console.log(`Device ${device.id} IP address: ${ip}`);

      // Connect using the device's IP address
      if (ip) {
        await client.shell(device.id, `adb connect ${ip}:5555`);
        console.log(`Connected to ${ip}:5555`);
      } else {
        throw new Error(
          `Failed to retrieve IP address for device ${device.id}`
        );
      }

      passed++;
      testResults.push({
        name: "Enable Wireless Debugging",
        status: "passed",
        message: `Wireless debugging enabled successfully on device ${device.id}`,
      });
      log(
        `${Date()} PASS: Wireless debugging enabled successfully on device ${
          device.id
        }`
      );
    }
  } catch (err) {
    console.error("Failed to enable wireless debugging:", err.message);
    failed++;
    testResults.push({
      name: "Enable Wireless Debugging",
      status: "failed",
      message: "Failed to enable wireless debugging: " + err.message,
    });
    log(`${Date()} FAIL: Failed to enable wireless debugging: ${err.message}`);
  }
}

// Route to handle wireless debugging form submission
app.post("/enable-wireless-debugging", async (req, res) => {
  const { networkName, password } = req.body;

  try {
    await enableWirelessDebugging(networkName, password);
    res.status(200).redirect("/"); // Redirect to home or status page after action
  } catch (error) {
    console.error(`Failed to enable wireless debugging: ${error.message}`);
    res
      .status(500)
      .send(`Failed to enable wireless debugging: ${error.message}`);
  }
});

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

app.post("/sendText", async (req, res) => {
  const { text } = req.body;
  await testSendTextToDevice(text);
  res.status(200).redirect("/");
});

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
  // await testSendTextToDevice(config.text);
  await testScrollDown();
  await Home();
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

// async function Home() {
//   try {
//     await client.shell(device.id, "adb shell input keyevent 3");
//   } catch (err) {
//     console.error("Error:", err.message);
//     log(Date() + " FAIL: Error: " + err.message);
//   }
// }

app.get("/GoHome", async (req, res) => {
  try {
    await Home();
    res.status(200).redirect("/");
  } catch (err) {
    res
      .status(500)
      .send("An error occurred while sending devices to the home screen.");
  }
});

async function Home() {
  try {
    const devices = await client.listDevices(); // Added await here
    for (const device of devices) {
      await client.shell(device.id, "input keyevent 3"); // Remove the additional "adb shell"
      passed++;
    }
  } catch (err) {
    console.error("Error:", err.message);
    log(Date() + " FAIL: Error: " + err.message);
    failed++;
  }
}
async function Back() {
  try {
    const devices = await client.listDevices();
    for (const device of devices) {
      await client.shell(device.id, "input keyevent 4");
      passed++;
    }
  } catch (error) {
    console.error("Error:", err.message);
    log(Date() + " FAIL: Error: " + err.message);
    failed++;
  }
}
async function Contact() {
  try {
    const devices = await client.listDevices();
    for (const device of devices) {
      await client.shell(device.id, "input keyevent 207");
      passed++;
    }
  } catch (error) {
    console.error("Error:", err.message);
    log(Date() + " FAIL: Error: " + err.message);
    failed++;
  }
}
app.get("/Contact", async (req, res) => {
  try {
    await Contact();
    res.status(200).redirect("/");
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while sending devices to the Contact screen.");
  }
});
async function Search() {
  try {
    const devices = await client.listDevices();
    for (const device of devices) {
      await client.shell(device.id, "input keyevent 84");
      passed++;
    }
  } catch (error) {
    console.error("Error:", err.message);
    log(Date() + " FAIL: Error: " + err.message);
    failed++;
  }
}
async function Setting() {
  try {
    const devices = await client.listDevices();
    for (const device of devices) {
      await client.shell(device.id, "input keyevent 280");
      passed++;
    }
  } catch (error) {
    console.error("Error:", err.message);
    log(Date() + " FAIL: Error: " + err.message);
    failed++;
  }
}
app.post("/mobile-data", async (req, res) => {
  const { enable } = req.body;
  const deviceId = await listDevices();

  try {
    if (!deviceId) {
      throw new Error("Device ID is required");
    }

    await setMobileData(deviceId, enable === "true");
    console.log(
      `Mobile data ${
        enable === "true" ? "enabled" : "disabled"
      } for device ${deviceId}.`
    );

    // Log success
    log(
      `${new Date().toISOString()} PASS: Mobile data ${
        enable === "true" ? "enabled" : "disabled"
      } for device ${deviceId}.`
    );

    res.redirect("/"); // Redirect to the home or status page after action
  } catch (error) {
    console.error(
      `Failed to ${enable === "true" ? "enable" : "disable"} mobile data: ${
        error.message
      }`
    );

    // Log failure
    log(
      `${new Date().toISOString()} FAIL: Failed to ${
        enable === "true" ? "enable" : "disable"
      } mobile data for device ${deviceId}: ${error.message}`
    );

    res
      .status(500)
      .send(
        `Failed to ${enable === "true" ? "enable" : "disable"} mobile data: ${
          error.message
        }`
      );
  }
});
app.post("/text", async (req, res) => {
  const { text } = req.body;
  await testSendTextToDevice(text);
  res.status(200).redirect("/");
});
app.get("/Search", async (req, res) => {
  try {
    await Search();
    res.status(200).redirect("/");
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while sending devices to the Search screen.");
  }
});
app.get("/Setting", async (req, res) => {
  try {
    await Setting();
    res.status(200).redirect("/");
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while sending devices to the Search screen.");
  }
});
app.get("/Back", async (req, res) => {
  try {
    await Back();
    res.status(200).redirect("/");
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while sending devices to the home screen.");
  }
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
module.exports = {
  testListDevices,
  enableWirelessDebugging,
  testGetDeviceProperties,
  testInstallAPK,
  testFetchInstalledPackages,
  testTakeScreenshot,
  testScrollDown,
};
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
