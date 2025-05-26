const { BoardShim, BrainFlowInputParams, BoardIds, IpProtocolTypes, BrainFlowExitCodes } = require('brainflow');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function prototypeCytonWiFiStreaming() {
    console.log('Starting Cyton WiFi data streaming prototype (TCP)...');

    const params = new BrainFlowInputParams();
    params.ip_address = '192.168.4.1';
    params.ip_port = 250;

    if (typeof IpProtocolTypes !== 'undefined' && IpProtocolTypes.hasOwnProperty('TCP')) {
        params.ip_protocol = IpProtocolTypes.TCP;
        console.log(`Using IpProtocolTypes.TCP: ${IpProtocolTypes.TCP}`);
    } else {
        console.log('IpProtocolTypes enum not directly available or TCP member missing, using numerical value 2 for TCP.');
        params.ip_protocol = 2; // TCP
    }

    let boardIdToTest = null;
    if (BoardIds.hasOwnProperty('CYTON_WIFI_BOARD')) {
        boardIdToTest = BoardIds.CYTON_WIFI_BOARD;
        console.log(`Using BoardIds.CYTON_WIFI_BOARD: ${boardIdToTest}`);
    } else {
        console.error('CRITICAL: BoardIds.CYTON_WIFI_BOARD is not defined in this BrainFlow version. Aborting.');
        return;
    }

    const boardShim = new BoardShim(boardIdToTest, params);
    let sessionPrepared = false;
    let streamStarted = false;

    try {
        console.log(`Attempting to prepare session for board ID: ${boardIdToTest} with IP: ${params.ip_address}, Port: ${params.ip_port}, Protocol: TCP(${params.ip_protocol})...`);
        await boardShim.prepareSession();
        sessionPrepared = true;
        console.log('SUCCESS(SIMULATED): boardShim.prepareSession() completed or did not throw critical error.');

        console.log('Attempting to start stream...');
        await boardShim.startStream(45000, ''); // Added default streamer_params as per API
        streamStarted = true;
        console.log('SUCCESS(SIMULATED): boardShim.startStream() called.');

        console.log('Simulating data accumulation (waiting 1 second)...');
        await sleep(1000);

        console.log('Attempting to get board data...');
        const data = await boardShim.getBoardData();
        console.log('SUCCESS(SIMULATED): boardShim.getBoardData() called.');
        if (data) {
            console.log(`Received data: ${data.length} channels, ${data.length > 0 ? data[0].length : 0} samples.`);
            if (data.length > 0 && data[0].length > 0) {
                console.log(`Sample from first channel: ${data[0][0]}`);
            }
        } else {
            console.log('Received null or undefined data.');
        }

    } catch (err) {
        console.error(`ERROR encountered: ${err.message}`);
        // console.log(`Error details: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`);
        console.log(`Error exit_code: ${err.exit_code}`);
        
        const boardNotReadyCode = (BrainFlowExitCodes && BrainFlowExitCodes.BOARD_NOT_READY_ERROR) ? BrainFlowExitCodes.BOARD_NOT_READY_ERROR : -3;
        const unableToOpenPortCode = (BrainFlowExitCodes && BrainFlowExitCodes.UNABLE_TO_OPEN_PORT_ERROR) ? BrainFlowExitCodes.UNABLE_TO_OPEN_PORT_ERROR : -2;
        const generalErrorCode = (BrainFlowExitCodes && BrainFlowExitCodes.GENERAL_ERROR) ? BrainFlowExitCodes.GENERAL_ERROR : -100; 
        const invalidArgumentErrorCode = (BrainFlowExitCodes && BrainFlowExitCodes.INVALID_ARGUMENTS_ERROR) ? BrainFlowExitCodes.INVALID_ARGUMENTS_ERROR : 13;
        const portAlreadyOpenErrorCode = (BrainFlowExitCodes && BrainFlowExitCodes.PORT_ALREADY_OPEN_ERROR) ? BrainFlowExitCodes.PORT_ALREADY_OPEN_ERROR : 17;
        const boardNotCreatedCode = (BrainFlowExitCodes && BrainFlowExitCodes.BOARD_NOT_CREATED_ERROR) ? BrainFlowExitCodes.BOARD_NOT_CREATED_ERROR : -1;
        const emptyBufferError = (BrainFlowExitCodes && BrainFlowExitCodes.EMPTY_BUFFER_ERROR) ? BrainFlowExitCodes.EMPTY_BUFFER_ERROR : 15;
        const streamAlreadyRunningError = (BrainFlowExitCodes && BrainFlowExitCodes.STREAM_ALREADY_RUN_ERROR) ? BrainFlowExitCodes.STREAM_ALREADY_RUN_ERROR : -5; // Example, check actual value

        if (err.exit_code === portAlreadyOpenErrorCode && !sessionPrepared) {
            console.log('Context: Error was PORT_ALREADY_OPEN_ERROR during prepareSession. Expected if port is busy.');
        } else if (err.exit_code === boardNotCreatedCode && sessionPrepared && !streamStarted) {
             console.log('Context: Error was BOARD_NOT_CREATED_ERROR (or similar) during startStream. Expected if prepareSession failed or device not found.');
        } else if (err.exit_code === emptyBufferError && streamStarted) {
             console.log('Context: Error was EMPTY_BUFFER_ERROR during getBoardData. Expected if stream started but no data (no device).');
        } else if (err.exit_code === invalidArgumentErrorCode) {
             console.log('Context: Encountered INVALID_ARGUMENTS_ERROR. Parameters are incorrect.');
        } else if (err.exit_code === boardNotReadyCode || err.exit_code === unableToOpenPortCode || err.exit_code === generalErrorCode) { 
            console.log('Context: Error (BOARD_NOT_READY, UNABLE_TO_OPEN_PORT, or GENERAL_ERROR) expected as no physical device.');
        } else {
            console.log('Context: Encountered an OTHER unexpected error.');
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
        if (boardShim && typeof boardShim.isPrepared === 'function' && (sessionPrepared || boardShim.isPrepared())) {
            console.log('Releasing session...');
            try {
                await boardShim.releaseSession();
                console.log('Session released.');
            } catch (releaseErr) {
                console.error(`ERROR during boardShim.releaseSession(): ${releaseErr.message}`);
                console.log(`Release session error exit_code: ${releaseErr.exit_code}`);
            }
        } else {
            console.log('Session was not prepared or boardShim instance is invalid, no release needed or possible.');
        }
    }
    console.log('Cyton WiFi data streaming prototype (TCP) finished.');
}

prototypeCytonWiFiStreaming();
