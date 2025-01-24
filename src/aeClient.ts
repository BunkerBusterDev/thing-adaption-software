import Net from 'net';
import Util from 'util';

import Config from './conf';
import Logger from 'lib/logger';
import Delay from 'lib/delay';

class AeClient {
    private downloadCount: number;
    private restart: Function;
    private aeSocket: Net.Socket;

    constructor(restart: Function) {
        this.downloadCount = 0;
        this.restart = restart;
        this.aeSocket = new Net.Socket();
        
        this.aeSocket.on('data', this.onReceive.bind(this));
        this.aeSocket.on('error', (error) => {
            Logger.error(`[AeClient-constructor]: ${error}`);
        });
        this.aeSocket.on('close', () => {
            Logger.info(`[AeClient-constructor]: Connection closed`);
            this.aeSocket.destroy();
            this.restart();
        });
        Logger.info('[AeClient-constructor]: AeClient initialized');
    }

    public disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (this.aeSocket.destroyed) {
                Logger.info('[AeClient-disconnect]: Socket already destroyed');
                resolve();
                return;
            }

            this.aeSocket.end(() => {
                Logger.info('[AeClient-disconnect]: Socket ended');
                resolve();
            });
        });
    }

    public sendToAE(sendData: string) {
        this.aeSocket.write(sendData);
    }

    private onReceive(data: string) {
        if(Config.tas.state === 'startAeClient' || Config.tas.state === 'restartAeClient' || Config.tas.state === 'upload') {
            const dataArry = data.toString().split('<EOF>');
            if(dataArry.length >= 2) {
                for (let i = 0; i < dataArry.length - 1; i++) {
                    const line = dataArry[i];
                    const sinkStr = Util.format('%s', line.toString());
                    const sinkObj = JSON.parse(sinkStr);
    
                    if (sinkObj.ctname === null || sinkObj.content === null) {
                        Logger.error('[AeClient-onReceive]: Data format mismatch');
                    }
                    else {
                        console.log(sinkObj);
                        if (sinkObj.content === 'hello') {
                            Logger.info(`[AeClient-onReceive]: ${line}`);
    
                            this.downloadCount++;
                        }
                        else {
                            // for (var j = 0; j < upload_arr.length; j++) {
                            //     if (upload_arr[j].ctname == sinkObj.ctname) {
                            //         console.log('ACK : ' + line + ' <----');
                            //         break;
                            //     }
                            // }
    
                            // for (j = 0; j < download_arr.length; j++) {
                            //     if (download_arr[j].ctname == sinkObj.ctname) {
                            //         g_down_buf = JSON.stringify({id: download_arr[i].id, content: sinkObj.content});
                            //         console.log(g_down_buf + ' <----');
                            //         control_led(sinkObj.content);
                            //         break;
                            //     }
                            // }
                        }
                    }
                }
            }
        }
    }

    public async connect(): Promise<string> {
        return new Promise(async (resolve) => {

            if(Config.tas.state === 'startAeClient' || Config.tas.state === 'restartAeClient') {
                try {
                    this.aeSocket.connect(Config.tas.parentPort, Config.tas.parentHost, async () => {
                        Logger.info(`[AEClient-start]: AE connected to ${Config.tas.parentHost}:${Config.tas.parentPort}`);
                        this.downloadCount = 0;
                        for (let i = 0; i < Config.download.length; i++) {
                            Logger.info(`[AEClient-start]: Download Connected - ${Config.download[i].containerName} hello`);
                            const cin = {ctname: Config.download[i].containerName, content: 'hello'};
                            this.aeSocket.write(JSON.stringify(cin) + '<EOF>');
                        }
                            
                        // 현재 지연 시간만큼 대기
                        await Delay(1000);

                        if (this.downloadCount >= Config.download.length) {
                            resolve('upload');
                        }
                    });
                } catch(error) {
                    Logger.error(`[AEClient-start]: Connection attempt failed - ${error}`);
                }
            }
        });
    }
}

export default AeClient;