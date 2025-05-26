const { Client } = require('node-ssdp');

const client = new Client();
const searchTarget = 'urn:schemas-upnp-org:device:Basic:1'; // Standard UPnP basic device
// const searchTarget = 'urn:openbci-com:device:wifi-shield:1'; // More specific, if known
// const searchTarget = 'ssdp:all'; // For broadest discovery

const discoveredDevices = new Map();
let searchTimeout = null;

console.log();

client.on('response', (headers, statusCode, rinfo) => {
    // console.log('Received response:', headers, statusCode, rinfo);
    const location = headers.LOCATION || 'N/A';
    const usn = headers.USN || 'N/A';
    const st = headers.ST || 'N/A';
    const server = headers.SERVER || headers.server || 'N/A'; // Some devices use lowercase 'server'

    // Basic filtering: Check if it's an OpenBCI device
    // This is a placeholder. Actual OpenBCI WiFi shields might have a specific SERVER string
    // or a more specific ST (Service Type).
    // For now, we'll log any device responding to Basic:1 and mention how to refine.
    const isPotentialOpenBCI = server.toLowerCase().includes('openbci') || usn.toLowerCase().includes('openbci');

    if (!discoveredDevices.has(usn)) {
        console.log('\n--- Device Found ---');
        console.log();
        console.log();
        console.log();
        console.log();
        console.log();
        console.log();
        
        if (isPotentialOpenBCI) {
            console.log('  -> This might be an OpenBCI device!');
        } else {
            console.log('  -> This is a generic UPnP device. For OpenBCI, check SERVER or ST fields for specific identifiers.');
        }
        discoveredDevices.set(usn, { headers, rinfo });
    }
});

// Start the search
client.search(searchTarget);
console.log();

// Stop the search after a timeout
searchTimeout = setTimeout(() => {
    console.log('\n--- Discovery Finished ---');
    if (discoveredDevices.size === 0) {
        console.log('No devices found matching the search target.');
    }
    // client.stop() // In older versions. For node-ssdp 4.x, there's no explicit global stop for client search once started.
    // The client will stop listening when the process exits or if its underlying sockets are closed.
    // For a long-running app, you might need to manage the client instance more carefully.
    console.log('Exiting discovery script.');
    process.exit(0);
}, 10000); // 10 seconds timeout

// Handle client errors (optional but good practice)
client.on('error', (err) => {
    console.error('SSDP Client Error:', err);
    clearTimeout(searchTimeout); // Stop the timeout if an error occurs
    process.exit(1);
});

// Keep the script running until the timeout
process.stdin.resume(); 

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        // console.log('Cleaning up...'); // No explicit client.stop() in v4 for search
    }
    if (exitCode || exitCode === 0) console.log(`Exiting with code: ${exitCode}`);
    if (options.exit) process.exit();
}

// Do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));
// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
// Catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));
// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));

