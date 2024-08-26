const { 
    listDevicesFromServer, 
    getDevicePropertiesFromServer, 
    installAPKOnServer, 
    fetchInstalledPackagesFromServer, 
    takeScreenshotFromServer, 
    sendTextToDevice, 
    scrollDownOnDevice 
} = require('./newserver');
const XLSX = require('xlsx');
const fs = require('fs');

// Read test cases from Excel file
function readTestCasesFromExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['TestCases'];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data;
}

// Execute test cases from Excel
(async () => {
    const testCases = readTestCasesFromExcel('testCases.xlsx');
    
    console.log('Test Cases:', testCases); // Debugging line

    for (const testCase of testCases) {
        if (!testCase.TestCase) {
            console.error('TestCase field is missing:', testCase);
            continue;
        }

        const [action, param] = testCase.TestCase.split(' ');

        // Extract deviceId from param if applicable
        const deviceIdMatch = param ? param.match(/deviceId=(\S+)/) : null;
        const deviceId = deviceIdMatch ? deviceIdMatch[1] : undefined;

        if (!deviceId) {
            console.error('Device ID is missing or invalid:', param);
            continue;
        }

        try {
            switch (action) {
                case 'List':
                    await listDevicesFromServer();
                    break;
                case 'Get':
                    await getDevicePropertiesFromServer(deviceId);
                    break;
                case 'Install':
                    await installAPKOnServer(deviceId, 'path-to-your-apk.apk');
                    break;
                case 'Fetch':
                    await fetchInstalledPackagesFromServer(deviceId);
                    break;
                case 'Take':
                    await takeScreenshotFromServer(deviceId, 'screenshot.png');
                    break;
                case 'Send':
                    await sendTextToDevice(deviceId, 'Hello, world!');
                    break;
                case 'Scroll':
                    await scrollDownOnDevice(deviceId);
                    break;
                default:
                    console.log('Unknown test case:', testCase.TestCase);
            }
        } catch (err) {
            console.error(`Error executing test case ${testCase.TestCase}:`, err);
        }
    }
})();
