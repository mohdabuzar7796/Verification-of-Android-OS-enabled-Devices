const adb = require("adbkit");
const client = adb.createClient();
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");

// Load the Excel file
const workbook = xlsx.readFile("path/to/testsuite.xlsx");
const sheet_name_list = workbook.SheetNames;
const sheet = workbook.Sheets[sheet_name_list[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

(async () => {
  const devices = await client.listDevices();

  // Process each row (test case)
  for (const row of rows) {
    const command = row["Command"];
    const target = row["Target"];
    const expected = row["Expected Result"];
    let actual;

    try {
      switch (command.toLowerCase()) {
        case "listdevices":
          actual = JSON.stringify(devices);
          console.log("Connected devices:", devices);
          break;

        case "install":
          actual = "Install successful";
          for (const device of devices) {
            await client.install(device.id, target);
            console.log(`Installed ${target} on device ${device.id}`);
          }
          break;

        case "screenshot":
          actual = "Screenshot captured";
          for (const device of devices) {
            const screenshot = await client.shell(device.id, "screencap -p");
            const chunks = [];
            screenshot.on("data", (chunk) => chunks.push(chunk));
            screenshot.on("end", () => {
              const buffer = Buffer.concat(chunks);
              const screenshotPath = path.join(__dirname, target);
              fs.writeFileSync(screenshotPath, buffer);
              console.log(`Screenshot saved as ${target}`);
            });
          }
          break;

        case "home":
          actual = "Home command sent";
          for (const device of devices) {
            await client.shell(device.id, `input keyevent 3`);
            console.log(`Device ${device.id} is now at home screen.`);
          }
          break;

        case "getpackages":
          actual = "Packages retrieved";
          for (const device of devices) {
            const packages = await client.getPackages(device.id);
            console.log(`Installed packages on device ${device.id}:`, packages);
            actual = JSON.stringify(packages);
          }
          break;

        case "screencap":
          actual = "Screencap captured";
          for (const device of devices) {
            const screenshot = await client.shell(device.id, "screencap -p");
            const chunks = [];
            screenshot.on("data", (chunk) => chunks.push(chunk));
            screenshot.on("end", () => {
              const buffer = Buffer.concat(chunks);
              const screenshotPath = path.join(__dirname, target);
              fs.writeFileSync(screenshotPath, buffer);
              console.log(`Screenshot saved as ${target}`);
            });
          }
          break;

        case "screenrecord":
          actual = "Screen recording completed";
          for (const device of devices) {
            const remotePath = "/storage/emulated/0/recordedVideo.mp4";
            const recordCommand = `screenrecord --time-limit 10 ${remotePath}`;
            await client.shell(device.id, recordCommand);
            const transfer = await client.pull(device.id, remotePath);
            const recordVideoPath = path.join(__dirname, target);
            const outStream = fs.createWriteStream(recordVideoPath);
            transfer.pipe(outStream);
            transfer.on("end", () => {
              console.log("Recorded video saved as recordedVideo.mp4");
            });
            transfer.on("error", (err) => {
              actual = `Error: ${err.message}`;
              console.error("Failed to save recorded video:", err);
            });
          }
          break;

        case "sendtext":
          actual = `Text sent: ${target}`;
          for (const device of devices) {
            const encodedText = target.replace(/ /g, "%s");
            await client.shell(device.id, `input text "${encodedText}"`);
            console.log(`Text "${target}" sent to device ${device.id}.`);
          }
          break;

        case "scroll":
          actual = "Scroll performed";
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
            console.log(`Scroll down action performed on device ${device.id}`);
          }
          break;

        case "click":
          const { x, y } = JSON.parse(target);
          actual = `Clicked at (${x}, ${y})`;
          for (const device of devices) {
            await client.shell(device.id, `input tap ${x} ${y}`);
            console.log(`Clicked at coordinates (${x}, ${y}) on device ${device.id}`);
          }
          break;

        default:
          actual = "Unknown command";
          console.log(`Unknown command: ${command}`);
      }

      // Determine if the test case passed or failed
      if (expected && actual === expected) {
        console.log(`Test case passed: Command = ${command}, Target = ${target}`);
      } else {
        console.log(`Test case failed: Command = ${command}, Target = ${target}, Expected = ${expected}, Actual = ${actual}`);
      }

    } catch (error) {
      console.error(`Error executing ${command} on ${target}:`, error);
    }
  }
})();
