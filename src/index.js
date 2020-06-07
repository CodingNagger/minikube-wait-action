const core = require('@actions/core');
const { spawnSync } = require('child_process');

const maxRetryAttempts = parseInt(`${core.getInput('max-retry-attempts')}`);
const retryDelay = parseInt(`${core.getInput('retry-delay')}`);
const namespace = core.getInput('namespace')
const allNamespaces = core.getInput('all-namespaces').toLowerCase() == "true" ? true : false

function checkPodsAreUp() {
    if (allNamespaces) {
        var lastCommandRunning = spawnSync('kubectl', ['get', 'pods', '--field-selector=status.phase!=Running,status.phase!=Completed', '--all-namespaces']);
    } else {
        var lastCommandRunning = spawnSync('kubectl', ['get', 'pods', '--field-selector=status.phase!=Running,status.phase!=Completed', '-n ', namespace]);
    }
    var errorOutput = lastCommandRunning.stderr.toString();
    var defaultOutput = lastCommandRunning.stdout.toString();
    return {
        success: errorOutput.includes('No resources found'),
        message: defaultOutput,
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
    console.log(result.message);
    var attemptsCount = 0;
    
    while(!result.success && attemptsCount < maxRetryAttempts) {
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
