const noble = require('@abandonware/noble');

let scanTimeout = null;

console.log('Starting BLE discovery prototype with @abandonware/noble...');

noble.on('stateChange', async (state) => {
    console.log(`Noble state changed to: ${state}`);
    if (state === 'poweredOn') {
        console.log('Bluetooth adapter is powered on. Starting scan...');
        try {
            // Start scanning for all devices, allow duplicates to see continuous advertisements if any
            // To scan for specific services (e.g., OpenBCI Ganglion's service UUID if known):
            // await noble.startScanningAsync(['service_uuid_here'], true);
            await noble.startScanningAsync([], true); 
            console.log('Scan started successfully.');

            // Set a timeout to stop scanning
            scanTimeout = setTimeout(async () => {
                console.log('Scan timeout reached. Stopping scan...');
                await noble.stopScanningAsync();
                console.log('Scan stopped.');
                process.exit(0);
            }, 15000); // Scan for 15 seconds

        } catch (error) {
            console.error('Error starting scan:', error);
            process.exit(1);
        }
    } else {
        console.log('Bluetooth adapter is not powered on. Current state:', state);
        // If the state is not poweredOn after a few seconds, exit.
        // This handles cases where Bluetooth might be off or unsupported in the environment.
        if (!scanTimeout) { // Avoid setting multiple timeouts if stateChange is called multiple times
            scanTimeout = setTimeout(() => {
                 console.log('Exiting: Bluetooth adapter did not power on.');
                 process.exit(1);
            }, 5000); // Wait 5 seconds for poweredOn state
        }
    }
});

noble.on('discover', (peripheral) => {
    console.log('\n--- Device Discovered ---');
    console.log(`  ID: ${peripheral.id}`);
    console.log(`  Address (MAC): ${peripheral.address || 'N/A'}`);
    console.log(`  Address Type: ${peripheral.addressType || 'N/A'}`);
    console.log(`  Connectable: ${peripheral.connectable ? 'Yes' : 'No'}`);
    console.log(`  RSSI: ${peripheral.rssi} dBm`);
    
    const advertisement = peripheral.advertisement;
    console.log('  Advertisement:');
    console.log(`    Local Name: ${advertisement.localName || 'N/A'}`);
    if (advertisement.serviceUuids && advertisement.serviceUuids.length > 0) {
        console.log(`    Service UUIDs: ${advertisement.serviceUuids.join(', ')}`);
    } else {
        console.log('    Service UUIDs: None advertised');
    }
    if (advertisement.manufacturerData) {
        console.log(`    Manufacturer Data: ${advertisement.manufacturerData.toString('hex')}`);
    } else {
        console.log('    Manufacturer Data: None');
    }
    // Add more advertisement data if needed (txPowerLevel, serviceData, etc.)
});

noble.on('scanStart', () => {
    console.log('Event: scanStart received.');
});

noble.on('scanStop', () => {
    console.log('Event: scanStop received.');
});

noble.on('warning', (message) => {
    console.warn('Noble Warning:', message);
});

// Handle process exit gracefully
process.on('SIGINT', async () => {
    console.log('\nCaught SIGINT. Stopping scan and exiting...');
    if (scanTimeout) clearTimeout(scanTimeout);
    try {
        if (noble.state === 'poweredOn') {
            await noble.stopScanningAsync();
            console.log('Scan stopped on SIGINT.');
        }
    } catch (error) {
        console.error('Error stopping scan on SIGINT:', error);
    }
    process.exit(0);
});

// Initial state check, as 'stateChange' might have already fired if noble initializes quickly
if (noble.state === 'poweredOn') {
    // Manually trigger the logic if already poweredOn, because the 'stateChange' event might have been missed.
    // This can happen if noble initializes and sets state before the event listener is attached.
    // To avoid race conditions, it's common to check current state after attaching listeners.
    const event = noble.emit('stateChange', 'poweredOn'); // Re-emit or call handler
    if (!event) { // If emit returns false, it means no listeners were called (should not happen here)
        console.log("Manually triggered stateChange for poweredOn state as it was already active.")
    }
} else if (noble.state === 'unknown') {
    console.log("Noble state is 'unknown'. Waiting for 'stateChange' event.");
}

console.log('BLE discovery script initialized. Waiting for Bluetooth adapter state changes...');

// Keep the script running until explicitly exited by scan timeout or SIGINT
// This is implicit as Node.js will keep running due to active event listeners in noble.
