const { spawn } = require('child_process');
const path = require('path');

console.log('Node.js: Starting Python BLE scanner script...');

// Determine the Python executable name. Prefer 'python3' but fallback to 'python'.
// In a real application, this might need to be configurable or more robustly detected.
const pythonExecutable = 'python3'; 
const scriptPath = path.join(__dirname, 'ble_scanner.py'); // Assumes ble_scanner.py is in the same directory

let pythonOutput = '';
let pythonErrorOutput = '';
let pythonExited = false;

// Spawn the Python process
// Using -u for unbuffered output from Python, though for simple JSON print it might not be critical.
const pythonProcess = spawn(pythonExecutable, ['-u', scriptPath]);

pythonProcess.stdout.on('data', (data) => {
    const M_str_data = data.toString();
    console.log(`Node.js: Received chunk from Python stdout: ${M_str_data}`);
    pythonOutput += M_str_data;
});

pythonProcess.stderr.on('data', (data) => {
    const M_str_data = data.toString();
    console.error(`Node.js: Received chunk from Python stderr: ${M_str_data}`);
    pythonErrorOutput += M_str_data;
});

pythonProcess.on('error', (error) => {
    console.error('Node.js: Failed to start Python process.', error);
    pythonExited = true;
});

pythonProcess.on('close', (code) => {
    console.log(`Node.js: Python process exited with code ${code}`);
    pythonExited = true;

    if (code === 0) {
        if (pythonOutput.trim()) {
            try {
                // Attempt to parse the full output as JSON
                // It's possible stderr also printed JSON if bleak wasn't found, handle that.
                const discoveredDevices = JSON.parse(pythonOutput);
                console.log('Node.js: Successfully parsed BLE devices from Python script:');
                if (Array.isArray(discoveredDevices) && discoveredDevices.length > 0) {
                    discoveredDevices.forEach(device => {
                        console.log(`  - Name: ${device.name}, Address: ${device.address}`);
                    });
                } else if (Array.isArray(discoveredDevices) && discoveredDevices.length === 0) {
                    console.log('  (Python script reported no devices found)');
                } else {
                    console.log('  (Python script output was not an empty array or was unexpected JSON format)');
                }
            } catch (e) {
                console.error('Node.js: Error parsing JSON from Python script stdout:', e.message);
                console.error('Node.js: Raw stdout from Python:', pythonOutput);
            }
        } else {
            console.log('Node.js: Python script stdout was empty.');
        }
    } else {
        console.error('Node.js: Python script exited with an error code.');
        if (pythonErrorOutput.trim()) {
            console.error('Node.js: Python stderr content:');
            // Try to parse stderr as JSON in case Python script sent a JSON error object
            try {
                const errorJson = JSON.parse(pythonErrorOutput);
                if (errorJson && errorJson.error) {
                    console.error(`  Parsed error from Python: ${errorJson.error}`);
                } else {
                    // If not JSON, or not the expected JSON, print raw.
                    process.stderr.write(pythonErrorOutput);
                }
            } catch (e) {
                 // If stderr was not JSON, print raw.
                process.stderr.write(pythonErrorOutput);
            }
        }
    }
    console.log('Node.js: BLE discovery via Python finished.');
});

// Safety timeout in case Python script hangs indefinitely
setTimeout(() => {
    if (!pythonExited) {
        console.warn('Node.js: Python script timeout reached. Killing process.');
        pythonProcess.kill('SIGTERM');
    }
}, 20000); // 20 seconds timeout (Python script has a 5s scan + some overhead)
