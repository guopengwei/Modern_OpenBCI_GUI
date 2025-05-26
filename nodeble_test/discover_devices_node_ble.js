const { createBluetooth } = require('node-ble');

async function main() {
    console.log('Starting BLE discovery with node-ble...');
    let destroyBluetoothSession;
    let scanTimeout;

    try {
        const { bluetooth, destroy } = createBluetooth();
        destroyBluetoothSession = destroy; // Store destroy function for cleanup

        console.log('Getting default Bluetooth adapter...');
        const adapter = await bluetooth.defaultAdapter();
        console.log(`Adapter acquired: ${await adapter.getAddress()} - ${await adapter.getName()}`);

        // node-ble's startDiscovery() doesn't automatically emit 'discover' events for all devices.
        // It sets the adapter to discovery mode.
        // To find devices, you typically use adapter.waitDevice() for a specific address/name,
        // or you might need to periodically call adapter.devices() after starting discovery.
        // For this prototype, we'll start discovery and then try to list devices found by the adapter.
        // A more robust solution would involve listening to DBus signals if the library exposes that, or repeated polling.

        console.log('Starting discovery on adapter...');
        if (!await adapter.isDiscovering()) {
            await adapter.startDiscovery();
            console.log('Discovery started.');
        } else {
            console.log('Adapter was already discovering.');
        }

        console.log('Scanning for 15 seconds...');
        // Let discovery run for a while
        await new Promise(resolve => scanTimeout = setTimeout(resolve, 15000));

        console.log('Scan period finished. Fetching discovered devices...');
        const discoveredDeviceAddresses = await adapter.devices();
        console.log(`Found ${discoveredDeviceAddresses.length} device addresses after scan period.`);

        if (discoveredDeviceAddresses.length > 0) {
            console.log('\n--- Discovered Devices ---');
            for (const address of discoveredDeviceAddresses) {
                try {
                    const device = await adapter.getDevice(address);
                    const name = await device.getName();
                    const rssi = await device.getRSSI();
                    // Getting service UUIDs before connection is usually not possible with node-ble as it relies on connected GATT services.
                    // We will log what's available from the device object itself before connection.
                    console.log('  ---');
                    console.log(`  Address: ${address}`);
                    console.log(`  Name: ${name || 'N/A'}`);
                    console.log(`  RSSI: ${rssi} dBm`);
                    // const services = await device.getGattServer().getPrimaryServices(); // Requires connection
                    // console.log(`  Service UUIDs: ${services.map(s => s.getUUID()).join(', ') || 'N/A (requires connection)'}`);
                    console.log('    Service UUIDs: (Requires connection with node-ble to list services)');
                } catch (deviceErr) {
                    console.error(`  Error fetching details for device ${address}:`, deviceErr.message);
                }
            }
        } else {
            console.log('No devices discovered in the list after scan period.');
        }

        if (await adapter.isDiscovering()) {
            console.log('Stopping discovery...');
            await adapter.stopDiscovery();
            console.log('Discovery stopped.');
        }

    } catch (err) {
        console.error('Error during BLE operations with node-ble:', err.message);
        if (err.message && (err.message.includes('DBus') || err.message.includes('bluez'))) {
            console.error('This error is likely due to D-Bus/Bluez permission issues or Bluez service not running/accessible.');
            console.error('node-ble requires specific D-Bus permissions (e.g., /etc/dbus-1/system.d/node-ble.conf) which need sudo to set up.');
        }
    } finally {
        if (destroyBluetoothSession) {
            console.log('Destroying Bluetooth session...');
            try {
                 destroyBluetoothSession();
                 console.log('Bluetooth session destroyed.');
            } catch (destroyErr) {
                console.error('Error destroying Bluetooth session:', destroyErr.message);
            }
        }
        if (scanTimeout) clearTimeout(scanTimeout);
        console.log('BLE discovery script finished.');
    }
}

main();
