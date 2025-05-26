const { BoardIds, BoardShim, BrainFlowInputParams } = require('brainflow');

function sleep(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function runExample() {
    console.log('Creating BoardShim for SYNTHETIC_BOARD');
    const params = new BrainFlowInputParams(); // Correctly instantiate BrainFlowInputParams
    const board = new BoardShim(BoardIds.SYNTHETIC_BOARD, params);

    try {
        console.log('Preparing session...');
        await board.prepareSession();
        console.log('Session prepared.');

        console.log('Starting stream...');
        await board.startStream();
        console.log('Stream started.');

        console.log('Sleeping for 3 seconds to collect data...');
        await sleep(3000);

        console.log('Stopping stream...');
        await board.stopStream();
        console.log('Stream stopped.');

        console.log('Getting board data...');
        const data = await board.getBoardData();
        console.log('Data retrieved.');

        console.log('Releasing session...');
        await board.releaseSession();
        console.log('Session released.');

        console.log('BrainFlow Data:');
        if (data && data.length > 0 && data[0].length > 0) {
            const numChannelsToShow = Math.min(data.length, 5);
            const numSamplesToShow = Math.min(data[0].length, 10);
            
            console.log();
            for (let i = 0; i < numChannelsToShow; i++) {
                let row = 'Channel ' + i + ': ';
                for (let j = 0; j < numSamplesToShow; j++) {
                    row += data[i][j].toFixed(2) + (j < numSamplesToShow - 1 ? ', ' : '');
                }
                console.log(row);
            }
            if (data[0].length > numSamplesToShow) {
                console.log();
            }
        } else {
            console.log('No data or empty data received.');
        }

    } catch (err) {
        console.error('Error during BrainFlow operations:', err);
        if (board.isPrepared()) {
            try {
                await board.releaseSession();
                console.log('Session released after error.');
            } catch (releaseErr) {
                console.error('Error releasing session after error:', releaseErr);
            }
        }
    }
}

runExample();
