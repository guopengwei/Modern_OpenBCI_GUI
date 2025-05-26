const { BoardShim, BrainFlowInputParams, BoardIds, BrainFlowExitCodes } = require('brainflow');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function prototypeCytonSerialStreaming() {
    console.log('Starting Cyton serial data streaming prototype...');

    const params = new BrainFlowInputParams();
    params.serial_port = '/dev/ttyS0';
    params.baud_rate = 115200;
    params.timeout = 5; // This timeout is for the native layer, e.g. for serial port discovery/opening

    const boardId = BoardIds.CYTON_BOARD;
    console.log(`Using BoardId: ${boardId} (Cyton)`);

    const boardShim = new BoardShim(boardId, params);
    let sessionPrepared = false;
    let streamStarted = false;

    try {
        console.log(`Attempting to prepare session for board ID: ${boardId} on port: ${params.serial_port} at ${params.baud_rate} baud...`);
        // In a real scenario, if prepareSession fails, we would not proceed.
        // For this prototype, we catch the error from prepareSession and log it,
        // but then attempt subsequent calls to observe their behavior when the session is not truly ready.
        try {
            await boardShim.prepareSession();
            sessionPrepared = true; 
            console.log('SUCCESS (HYPOTHETICAL): boardShim.prepareSession() did not throw an error or was caught gracefully.');
        } catch (prepareErr) {
            console.error('ERROR during boardShim.prepareSession():', prepareErr.message);
            console.log(`Prepare session error exit_code: ${prepareErr.exit_code}`);
            if (prepareErr.exit_code === BrainFlowExitCodes.UNABLE_TO_OPEN_PORT_ERROR || 
                prepareErr.exit_code === BrainFlowExitCodes.BOARD_NOT_READY_ERROR) {
                console.log('This prepareSession error is expected in the sandbox with /dev/ttyS0.');
            }
            // We are intentionally not re-throwing here to test the behavior of subsequent calls.
            // The 'sessionPrepared' flag remains false if an error occurred.
        }

        // --- Attempt to start stream --- 
        // This will likely fail if prepareSession did not actually succeed.
        console.log(`Attempting to start stream (sessionPrepared: ${sessionPrepared})...`);
        await boardShim.startStream(45000, ''); // Default ring buffer size, no specific streamer params
        streamStarted = true; // Mark as attempted / hypothetically started
        console.log('SUCCESS (HYPOTHETICAL): boardShim.startStream() called.');

        console.log('Simulating data accumulation (waiting 1 second)...');
        await sleep(1000);

        // --- Attempt to get board data --- 
        console.log('Attempting to get board data...');
        const data = await boardShim.getBoardData(); // Default (all data)
        console.log('SUCCESS (HYPOTHETICAL): boardShim.getBoardData() called.');
        if (data) {
            console.log(`Received data: ${data.length} channels, ${data.length > 0 ? data[0].length : 0} samples.`);
        } else {
            console.log('Received null or undefined data.');
        }

    } catch (err) {
        // This block will catch errors from startStream or getBoardData if prepareSession failed silently
        // or if prepareSession succeeded but subsequent operations failed.
        console.error(`ERROR during streaming operations: ${err.message}`);
        console.log(`Streaming operation error exit_code: ${err.exit_code}`);
        if (!sessionPrepared) {
            console.log('Context: Error likely due to prepareSession having failed previously.');
        } else if (sessionPrepared && !streamStarted) {
            console.log('Context: Error likely originated from startStream after prepareSession was considered successful.');
        } else if (streamStarted) {
            console.log('Context: Error likely originated from getBoardData.');
        }
    } finally {
        if (streamStarted) {
            console.log('Attempting to stop stream...');
            try {
                await boardShim.stopStream();
                console.log('Stream stopped.');
            } catch (stopErr) {
                console.error(`ERROR during boardShim.stopStream(): ${stopErr.message}`);
                console.log(`Stop stream error exit_code: ${stopErr.exit_code}`);
            }
        }
        // Use boardShim.isPrepared() for releasing, as it reflects the C++ object's state.
        if (boardShim && typeof boardShim.isPrepared === 'function' && boardShim.isPrepared()) {
            console.log('Releasing session (board is prepared)...');
            try {
                await boardShim.releaseSession();
                console.log('Session released.');
            } catch (releaseErr) {
                console.error(`ERROR during boardShim.releaseSession(): ${releaseErr.message}`);
                console.log(`Release session error exit_code: ${releaseErr.exit_code}`);
            }
        } else {
            console.log('Session not considered prepared by boardShim.isPrepared(), or boardShim invalid. Not attempting releaseSession via isPrepared.');
        }
    }
    console.log('Cyton serial data streaming prototype finished.');
}

prototypeCytonSerialStreaming();
