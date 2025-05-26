import asyncio
import json
import sys

try:
    from bleak import BleakScanner
    BLEAK_AVAILABLE = True
except ImportError:
    BLEAK_AVAILABLE = False

async def main():
    discovered_devices = []
    if not BLEAK_AVAILABLE:
        print(json.dumps({"error": "Bleak library not found. Please install it (pip install bleak)."}), file=sys.stderr)
        sys.exit(1)

    print("Python: Starting BLE scan with Bleak...", file=sys.stderr)
    try:
        # Scan for 5 seconds
        devices = await BleakScanner.discover(timeout=5.0)
        if devices:
            print(f"Python: Found {len(devices)} devices.", file=sys.stderr)
            for device in devices:
                discovered_devices.append({
                    "address": device.address,
                    "name": device.name if device.name else "Unknown"
                    # Bleak also provides device.metadata (like uuids, manufacturer_data)
                    # and device.rssi, which could be added if needed.
                })
        else:
            print("Python: No BLE devices found.", file=sys.stderr)
    except Exception as e:
        # Catching a broad exception here because various things can go wrong with BLE
        # (adapter not found, permissions, etc.)
        print(json.dumps({"error": f"Error during Bleak scan: {str(e)}"}), file=sys.stderr)
        # Output an empty list or specific error structure to stdout if needed,
        # but for now, error goes to stderr, and stdout might be empty or incomplete.
        # To ensure Node.js always gets valid JSON, even on error, we could print an error JSON to stdout here.
        # For this prototype, error primarily goes to stderr.
        # We'll print an empty JSON array to stdout to signify failure in a parsable way for Node.js
        print(json.dumps([])) 
        sys.exit(1) # Indicate an error occurred

    # Output JSON to stdout
    print(json.dumps(discovered_devices))

if __name__ == "__main__":
    # This is important for Windows compatibility with asyncio in bleak
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(main())
