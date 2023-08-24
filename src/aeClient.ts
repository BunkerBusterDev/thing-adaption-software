import Net from 'net';

let aeSocket = null;

const restart = () => {};

const onReceive = () => {};

const initialize = () => {
    return new Promise((resolve, reject) => {
        aeSocket = new Net.Socket();

        aeSocket.on('data', onReceive);
        aeSocket.on('error', (error) => {
            reject(`[AEClient] : ${error}`);
        });
        aeSocket.on('close', () => {
            reject('[AEClient] : socket close');
            restart();
        });

        if (aeSocket) {
            console.log('[AEClient] : init ok');
            resolve('init_thingConnector');
        } else {
            console.log();
            reject('[AEClient] : tas init failed');
        }
    });
};

export { initialize };
