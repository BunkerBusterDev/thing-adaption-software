import Util from 'util';

import Config from 'Conf';
import Logger from 'utils/Logger';

class AeHandler {
    private downloadCount: number = 0;

    public handleData(data: string): void {
        if(Config.thingAdaptionSoftware.state === 'connectAeClient' || Config.thingAdaptionSoftware.state === 'reconnectAeClient' || Config.thingAdaptionSoftware.state === 'startUpload') {
            const dataArry = data.split('<EOF>');
            if (dataArry.length >= 2) {
                for (let i = 0; i < dataArry.length - 1; i++) {
                    const line = dataArry[i];
                    try {
                        const sinkStr = Util.format('%s', line);
                        const sinkObj = JSON.parse(sinkStr);

                        if (!sinkObj.name || !sinkObj.content) {
                            Logger.error('[AeHandler-handleData]: Data format mismatch');
                            continue;
                        }

                        if (sinkObj.content === 'hello') {
                            Logger.info(`[AeHandler-handleData]: Received hello message ${line}`);
                            this.downloadCount++;
                        } else {
                            for (let j = 0; j < Config.upload.length; j++) {
                                if (Config.upload[j].name == sinkObj.name) {
                                    Logger.info(`[AeHandler-handleData]: ACK ${line}`);
                                    break;
                                }
                            }
    
                            for (let j = 0; j < Config.download.length; j++) {
                                if (Config.download[j].name == sinkObj.name) {
                                    const downBuffer = JSON.stringify({id: Config.download[i].id, content: sinkObj.content});
                                    Logger.info(`[AeHandler-handleData]: Received message ${downBuffer}`);
                                    // control_led(sinkObj.content);
                                    break;
                                }
                            }
                        }
                    } catch (error) {
                        Logger.error(`[AeHandler-handleData]: Error processing line - ${error}`);
                    }
                }
            }
        }
    }

    public resetDownloadCount(): void {
        this.downloadCount = 0;
    }

    public getDownloadCount(): number {
        return this.downloadCount;
    }
}

export default AeHandler;