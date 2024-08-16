const adb = require("adbkit");
const client = adb.createClient();
const fs = require("fs");
const path = require("path");

const apkPath = path.resolve(
  __dirname,
  "C:\\Users\\HP\\Downloads\\APKPure_v3.20.16_apkpure.com.apk"
);

// Logging function
function log(message) {
  const logPath = "logfile.log";
  fs.appendFileSync(logPath, message + "\n", (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

// List connected devices
async function listDevices() {
  try {
    const devices = await client.listDevices();
    console.log("Connected devices:", devices);
    count++;
    log(Date() + " PASS: Devices listed successfully");
    return devices;
  } catch (err) {
    console.log("Error occurred:", err);
    log(Date() + " FAIL: Error listing devices: " + err.message);
    throw err;
  }
}

// Get device properties
client
  .listDevices()
  .then((devices) => {
    if (devices.length === 0) {
      console.log("No devices connected");
      log(Date() + " FAIL: No devices connected");
      return;
    }

    devices.forEach((device) => {
      client
        .getProperties(device.id)
        .then((properties) => {
          const details = {
            model: properties["ro.product.model"],
            brand: properties["ro.product.brand"],
            androidVersion: properties["ro.build.version.release"],
            sdkVersion: properties["ro.build.version.sdk"],
          };

          log(Date() + " PASS: " + JSON.stringify(details));
          console.log(details);
          count++;
        })
        .catch((err) => {
          const errorMessage = "Error getting properties: " + err.message;
          console.error(errorMessage);
          log(Date() + " FAIL: " + errorMessage);
        });
    });
  })
  .catch((err) => {
    const errorMessage = "Error listing devices: " + err.message;
    console.error(errorMessage);
    log(Date() + " FAIL: " + errorMessage);
  });

// Install APK on devices
client
  .listDevices()
  .then((devices) => {
    if (devices.length === 0) {
      console.log("No Device Connected");
      log(Date() + " FAIL: No Device Connected");
      return;
    }

    devices.forEach((device) => {
      client
        .install(device.id, apkPath)
        .then(() => {
          console.log(
            `Successfully installed ${apkPath} on device ${device.id}`
          );
          count++;
          log(Date() + " PASS: App successfully installed on " + device.id);
        })
        .catch((err) => {
          console.error(
            `Failed to install ${apkPath} on device ${device.id}:`,
            err.message
          );
          log(
            Date() +
              " FAIL: App not installed on device " +
              device.id +
              ": " +
              err.message
          );
        });
    });
  })
  .catch((err) => {
    console.error("Error listing devices:", err.message);
    log(Date() + " FAIL: Error listing devices: " + err.message);
  });

// Fetch installed packages
client
  .listDevices()
  .then((devices) => {
    if (devices.length === 0) {
      console.log("No Device Connected");
      log(Date() + " FAIL: No device connected");
      return;
    }

    devices.forEach((device) => {
      client
        .getPackages(device.id)
        .then((packages) => {
          console.log(`Installed packages on device ${device.id}:`);
          count++;
          log(Date() + " PASS: Installed packages on device " + device.id);

          packages.forEach((pkg) => {
            // console.log(pkg); // Log each package name
          });
        })
        .catch((err) => {
          console.error(
            `Failed to get packages from device ${device.id}:`,
            err.message
          );
          log(
            Date() +
              " FAIL: Could not fetch packages from device " +
              device.id +
              ": " +
              err.message
          );
        });
    });
  })
  .catch((err) => {
    console.error("Error listing devices:", err.message);
    log(Date() + " FAIL: Error listing devices: " + err.message);
  });

// Take screenshot
async function takeScreenshot() {
  try {
    const devices = await client.listDevices();

    if (devices.length === 0) {
      console.log("No device connected");
      log(Date() + " FAIL: No device connected");
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
      count++;
      log(Date() + " PASS: Screenshot successfully taken on " + deviceId);
    });
  } catch (err) {
    console.error("Failed to take screenshot:", err.message);
    log(Date() + " FAIL: Screenshot not taken: " + err.message);
  }
}
takeScreenshot();

// Send text to device
const sendTextToDevice = async (text) => {
  try {
    const devices = await client.listDevices();
    if (devices.length === 0) {
      console.log("No devices connected");
      log(Date() + " FAIL: No devices connected");
      return;
    }
    const deviceId = devices[0].id;

    const encodedText = text.replace(/ /g, "%s");
    await client.shell(deviceId, `input text "${encodedText}"`);
    console.log(`Text "${text}" sent to device.`);
    count++;
    log(Date() + ' PASS: Text "' + text + '" sent to device ' + deviceId);
  } catch (err) {
    console.error("An error occurred:", err.message);
    log(Date() + " FAIL: Text not sent to device: " + err.message);
  }
};
sendTextToDevice("Hello World");

// Scroll down on the device
async function scrollDown(deviceId) {
  try {
    const startX = 500;
    const startY = 1000;
    const endX = 500;
    const endY = 200;
    const duration = 500;

    await client.shell(
      deviceId,
      `input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`
    );
    count++;
    console.log("Scroll down action performed");
    log(Date() + " PASS: Scroll down action performed on device " + deviceId);
  } catch (err) {
    console.error("Error performing scroll action:", err.message);
    log(
      Date() +
        " FAIL: Scroll down action failed on device " +
        deviceId +
        ": " +
        err.message
    );
  }
}

client
  .listDevices()
  .then((devices) => {
    if (devices.length === 0) {
      throw new Error("No devices connected");
    }
    const deviceId = devices[0].id;
    scrollDown(deviceId);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    log(Date() + " FAIL: Error: " + err.message);
  });




// Summary of test cases
// async function TestCases() {
//   console.log("PASSED ->", count);
//   console.log("FAILED ->", total - count);
//   log(Date() + ` SUMMARY: PASSED -> ${count}, FAILED -> ${total - count}`);
// }
// TestCases();
