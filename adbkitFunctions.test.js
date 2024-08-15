const adb = require("adbkit");
const fs = require("fs");
const path = require("path");

// Mock the ADB client
jest.mock("adbkit");
const client = adb.createClient();

describe("ADB Kit Functions", () => {
  let logSpy;
  
  beforeAll(() => {
    logSpy = jest.spyOn(fs, "appendFileSync").mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  // Test listDevices function
  test("should list connected devices", async () => {
    const mockDevices = [{ id: "device1" }, { id: "device2" }];
    client.listDevices.mockResolvedValue(mockDevices);

    const devices = await client.listDevices();

    expect(devices).toEqual(mockDevices);
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("PASS: Devices listed successfully"));
  });

  // Test error handling in listDevices
  test("should log an error when failing to list devices", async () => {
    const mockError = new Error("Failed to list devices");
    client.listDevices.mockRejectedValue(mockError);

    try {
      await client.listDevices();
    } catch (error) {
      expect(error).toBe(mockError);
      expect(logSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("FAIL: Error listing devices"));
    }
  });

  // Test getProperties function
  test("should get device properties", async () => {
    const mockDevices = [{ id: "device1" }];
    const mockProperties = {
      "ro.product.model": "Pixel 4",
      "ro.product.brand": "Google",
      "ro.build.version.release": "11",
      "ro.build.version.sdk": "30",
    };
    client.listDevices.mockResolvedValue(mockDevices);
    client.getProperties.mockResolvedValue(mockProperties);

    const devices = await client.listDevices();
    const properties = await client.getProperties(devices[0].id);

    expect(properties).toEqual(mockProperties);
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("PASS"));
  });

  // Test install APK function
  test("should install APK on device", async () => {
    const mockDevices = [{ id: "device1" }];
    const apkPath = path.resolve(__dirname, "path/to/apkfile.apk");
    client.listDevices.mockResolvedValue(mockDevices);
    client.install.mockResolvedValue();

    const devices = await client.listDevices();
    await client.install(devices[0].id, apkPath);

    expect(client.install).toHaveBeenCalledWith(mockDevices[0].id, apkPath);
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("PASS: App successfully installed"));
  });

  // Test screenshot function
  test("should take screenshot", async () => {
    const mockDevices = [{ id: "device1" }];
    const mockScreenshot = {
      on: jest.fn((event, callback) => {
        if (event === "end") callback();
      }),
    };
    client.listDevices.mockResolvedValue(mockDevices);
    client.shell.mockResolvedValue(mockScreenshot);

    const devices = await client.listDevices();
    const screenshot = await client.shell(devices[0].id, "screencap -p");

    expect(screenshot.on).toHaveBeenCalledWith("end", expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("PASS: Screenshot successfully taken"));
  });

  // Test sendTextToDevice function
  test("should send text to device", async () => {
    const mockDevices = [{ id: "device1" }];
    const text = "Hello World";
    client.listDevices.mockResolvedValue(mockDevices);
    client.shell.mockResolvedValue();

    const devices = await client.listDevices();
    await client.shell(devices[0].id, `input text "Hello%sWorld"`);

    expect(client.shell).toHaveBeenCalledWith(mockDevices[0].id, `input text "Hello%sWorld"`);
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("PASS: Text \"Hello World\" sent to device"));
  });

  // Test scrollDown function
  test("should perform scroll down action", async () => {
    const mockDevices = [{ id: "device1" }];
    client.listDevices.mockResolvedValue(mockDevices);
    client.shell.mockResolvedValue();

    const devices = await client.listDevices();
    await client.shell(devices[0].id, `input swipe 500 1000 500 200 500`);

    expect(client.shell).toHaveBeenCalledWith(mockDevices[0].id, `input swipe 500 1000 500 200 500`);
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("PASS: Scroll down action performed"));
  });
});
