const { SerialPort } = require('serialport');

async function listSerialPorts() {
    console.log('Attempting to list available serial ports...');
    try {
        const ports = await SerialPort.list();
        if (ports.length === 0) {
            console.log('No serial ports found.');
        } else {
            console.log('Available serial ports:');
            ports.forEach(port => {
                console.log('  ---');
                console.log(`  Path: ${port.path}`);
                console.log(`  Manufacturer: ${port.manufacturer || 'N/A'}`);
                console.log(`  Serial Number: ${port.serialNumber || 'N/A'}`);
                console.log(`  PnP ID: ${port.pnpId || 'N/A'}`);
                console.log(`  Location ID: ${port.locationId || 'N/A'}`);
                console.log(`  Vendor ID: ${port.vendorId || 'N/A'}`);
                console.log(`  Product ID: ${port.productId || 'N/A'}`);
            });
        }
    } catch (err) {
        console.error('Error listing serial ports:', err);
    }
}

listSerialPorts();
