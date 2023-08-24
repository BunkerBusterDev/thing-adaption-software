import * as WatchdogTimer from './lib/watchdogTimer';

const state: string = 'init_aeClient';

const initialize = async () => {
    try {
        if (state === 'init_aeClient') {
            console.log(state);
        }
    } catch (error) {
        console.log('error', error);
    }
};

WatchdogTimer.setWatchdogTimer('app', 1, initialize);
