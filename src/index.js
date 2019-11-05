const core = require('@actions/core');
const { spawnSync } = require('child_process');

const successMessage = '';
const maxRetryAttempts = parseInt(`${core.getInput('max-retry-attempts')}`);
const retryDelay = parseInt(`${core.getInput('retry-delay')}`);

function checkPodsAreUp() {
    var lastCommandRunning = spawnSync('kubectl', ['get', 'pods','--field-selector=status.phase!=Running,status.phase!=Completed']);
    var output = lastCommandRunning.stdout.toString();
    return {
        success: `${output}`.trim() == '',
        message: output,
    };
}

function wait(seconds) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds*1000);
}

if (maxRetryAttempts <= 0 || retryDelay <= 0) {
    core.setFailed('No negative config values!');
    return;
}

try {
    console.log('Check pods are up...');
    var result = checkPodsAreUp();
    var attemptsCount = 0;
    
    while(!result.success || attemptsCount < maxRetryAttempts) {
        console.log(`Waiting ${retryDelay} seconds`);
        attemptsCount++;
        wait(retryDelay);
        console.log(`Retry...${attemptsCount}`);
        result = checkPodsAreUp();
        console.log(result.message);
    }
    
    if (result.success) {
        console.log(`All pods are up!!!`);
    }
    else {
        throw { message: `Pods are not up:\n${result.message}` };
    }
} catch (error) {
    core.setFailed(error.message);
}