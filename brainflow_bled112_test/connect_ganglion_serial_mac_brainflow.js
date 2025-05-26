const { BoardShim, BrainFlowInputParams, BoardIds, BrainFlowExitCodes } = require('brainflow');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function prototypeGanglionBLED112StyleStreaming() {
    console.log('Starting Ganglion BLED112-style data streaming prototype (GANGLION_BOARD ID)...');

    const params = new BrainFlowInputParams();
    params.serial_port = '/dev/ttyACM0'; // Placeholder for BLED112
    params.mac_address = '00:11:22:33:44:55'; // Placeholder MAC

    const boardId = BoardIds.GANGLION_BOARD;
    console.log(`Using BoardId: ${boardId} (GANGLION_BOARD) with BLED112-style params.`);

    const boardShim = new BoardShim(boardId, params);
    let sessionActuallyPrepared = false; // Tracks real outcome of prepareSession
    let streamAttempted = false; // Tracks if startStream was called

    try {
        console.log(`Attempting to prepare session for board ID: ${boardId} with serial_port: ${params.serial_port}, mac_address: ${params.mac_address}...`);
        try {
            await boardShim.prepareSession();
            sessionActuallyPrepared = true; 
            console.log('SUCCESS (UNEXPECTED): boardShim.prepareSession() completed without error.');
        } catch (prepareErr) {
            console.error('ERROR during boardShim.prepareSession():', prepareErr.message);
            console.log(`Prepare session error exit_code: ${prepareErr.exit_code}`);
            if (prepareErr.exit_code === BrainFlowExitCodes.UNABLE_TO_OPEN_PORT_ERROR || 
                prepareErr.exit_code === BrainFlowExitCodes.BOARD_NOT_READY_ERROR ||
                prepareErr.exit_code === 17 /* PORT_ALREADY_OPEN_ERROR or failed to open device */) {
                console.log('This prepareSession error is expected in the sandbox for BLED112-style connection.');
            }
            // Intentionally not re-throwing to test subsequent calls.
        }

        console.log(`Attempting to start stream (sessionActuallyPrepared: ${sessionActuallyPrepared})...`);
        await boardShim.startStream(45000, ''); 
        streamAttempted = true; 
        console.log('SUCCESS (HYPOTHETICAL): boardShim.startStream() called.');

        console.log('Simulating data accumulation (waiting 1 second)...');
        await sleep(1000);

        console.log('Attempting to get board data...');
        const data = await boardShim.getBoardData(); 
        console.log('SUCCESS (HYPOTHETICAL): boardShim.getBoardData() called.');
        if (data) {
            console.log(`Received data: ${data.length} channels, ${data.length > 0 ? data[0].length : 0} samples.`);
        } else {
            console.log('Received null or undefined data.');
        }

    } catch (err) {
        console.error(`ERROR during streaming operations sequence: ${err.message}`);
        console.log(`Streaming sequence error exit_code: ${err.exit_code}`);
        if (!sessionActuallyPrepared) {
            console.log('Context: Error likely due to prepareSession having failed, making boardShim unusable for streaming.');
        } else if (sessionActuallyPrepared && !streamAttempted) {
            console.log('Context: Error likely originated from startStream, despite prepareSession being considered successful.');
        } else if (streamAttempted) {
            console.log('Context: Error likely originated from getBoardData.');
        }
    } finally {
        if (streamAttempted) { 
            console.log('Attempting to stop stream (if it was called)...');
            try {
                if (sessionActuallyPrepared && boardShim.isPrepared()) { 
                    await boardShim.stopStream();
                    console.log('Stream stopped.');
                } else {
                    console.log('Skipping stopStream as session was not truly prepared or stream not effectively started.');
                }
            } catch (stopErr) {
                console.error(`ERROR during boardShim.stopStream(): ${stopErr.message}`);
                console.log(`Stop stream error exit_code: ${stopErr.exit_code}`);
            }
        }
        
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
            console.log('Session not considered prepared by boardShim.isPrepared(), or boardShim invalid. Not attempting releaseSession via isPrepared check.');
        }
    }
    console.log('Ganglion BLED112-style data streaming prototype finished.');
}

prototypeGanglionBLED112StyleStreaming();
