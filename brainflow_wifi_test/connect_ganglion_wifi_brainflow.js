const { BoardShim, BrainFlowInputParams, BoardIds, IpProtocolTypes, BrainFlowExitCodes } = require('brainflow');

async function prototypeGanglionWiFiConnectionTCP() {
    console.log('Starting Ganglion WiFi connection prototype (TCP)...');

    const params = new BrainFlowInputParams();

    params.ip_address = '192.168.4.1'; // Common default for WiFi shields in AP mode
    params.ip_port = 200;             // For 200Hz sample rate, as instructed

    // Setting IP Protocol to TCP
    if (typeof IpProtocolTypes !== 'undefined' && IpProtocolTypes.hasOwnProperty('TCP')) {
        params.ip_protocol = IpProtocolTypes.TCP;
        console.log(`Using IpProtocolTypes.TCP: ${IpProtocolTypes.TCP}`);
    } else {
        console.log('IpProtocolTypes enum not directly available or TCP member missing, using numerical value 2 for TCP.');
        params.ip_protocol = 2; // TCP (standard BrainFlow value)
    }

    let boardIdToTest = null;
    if (BoardIds.hasOwnProperty('GANGLION_WIFI_BOARD')) {
        boardIdToTest = BoardIds.GANGLION_WIFI_BOARD;
        console.log(`Using BoardIds.GANGLION_WIFI_BOARD: ${boardIdToTest}`);
    } else {
        console.error('CRITICAL: BoardIds.GANGLION_WIFI_BOARD is not defined in this BrainFlow version. Aborting.');
        return; 
    }

    const boardShim = new BoardShim(boardIdToTest, params);
    let sessionPrepared = false;

    try {
        console.log(`Attempting to prepare session for board ID: ${boardIdToTest} (Ganglion WiFi) with IP: ${params.ip_address}, Port: ${params.ip_port}, Protocol: TCP(${params.ip_protocol})...`);
        await boardShim.prepareSession();
        sessionPrepared = true;
        console.log('SUCCESS: boardShim.prepareSession() completed.');
        console.log('This is unexpected without a real device, but indicates parameters were accepted by the library core.');

    } catch (err) {
        console.error('ERROR during boardShim.prepareSession():', err.message);
        
        const boardNotReadyCode = (BrainFlowExitCodes && BrainFlowExitCodes.BOARD_NOT_READY_ERROR) ? BrainFlowExitCodes.BOARD_NOT_READY_ERROR : -3;
        const unableToOpenPortCode = (BrainFlowExitCodes && BrainFlowExitCodes.UNABLE_TO_OPEN_PORT_ERROR) ? BrainFlowExitCodes.UNABLE_TO_OPEN_PORT_ERROR : -2;
        const generalErrorCode = (BrainFlowExitCodes && BrainFlowExitCodes.GENERAL_ERROR) ? BrainFlowExitCodes.GENERAL_ERROR : -100; 
        const invalidArgumentErrorCode = (BrainFlowExitCodes && BrainFlowExitCodes.INVALID_ARGUMENTS_ERROR) ? BrainFlowExitCodes.INVALID_ARGUMENTS_ERROR : 13;

        if (err.exit_code === invalidArgumentErrorCode) {
             console.log('Encountered INVALID_ARGUMENTS_ERROR. This suggests the parameters (e.g., IP protocol) are not what BrainFlow expects for GANGLION_WIFI_BOARD. Error code:', err.exit_code);
        } else if (err.exit_code === boardNotReadyCode || 
            err.exit_code === unableToOpenPortCode ||
            err.exit_code === generalErrorCode) { 
            console.log('This error (BOARD_NOT_READY, UNABLE_TO_OPEN_PORT, or GENERAL_ERROR) is expected as no physical device is connected.');
            console.log('The key is that the error is not an INVALID_ARGUMENTS_ERROR related to the IP protocol. Error code:', err.exit_code);
        } else {
            console.log('Encountered an unexpected error. Check BrainFlow setup and parameters. Error code:', err.exit_code);
        }
    } finally {
        if (boardShim && typeof boardShim.isPrepared === 'function' && (sessionPrepared || boardShim.isPrepared())) {
            console.log('Releasing session...');
            try {
                await boardShim.releaseSession();
                console.log('Session released.');
            } catch (releaseErr) {
                console.error('ERROR during boardShim.releaseSession():', releaseErr);
            }
        } else {
            console.log('Session was not prepared or boardShim instance is invalid, no release needed or possible.');
        }
    }
    console.log('Ganglion WiFi connection prototype (TCP) finished.');
}

prototypeGanglionWiFiConnectionTCP();
