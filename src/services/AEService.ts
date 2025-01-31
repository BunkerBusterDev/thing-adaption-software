import Net from 'net';
import Config from 'conf';
import Logger from 'utils/logger';
import Delay from 'utils/delay';
import AeHandler from 'handlers/AEHandler';

class AeService {
    private aeSocket: Net.Socket;
    private aeHandler: AeHandler;

    constructor(private restart: Function) {
        this.aeSocket = new Net.Socket();
        this.aeHandler = new AeHandler();

        this.aeSocket.on('data', (data) => this.aeHandler.handleData(data.toString()));
        this.aeSocket.on('error', (error) => {
            Logger.error(`[AeService]: ${error}`);
        });
        this.aeSocket.on('close', () => {
            Logger.info('[AeService]: Connection closed');
            this.aeSocket.destroy();
            this.restart();
        });
    }

    public async connect(): Promise<string> {
        return new Promise(async (resolve) => {
            if (Config.thingAdaptionSoftware.state === 'connectAeClient' || Config.thingAdaptionSoftware.state === 'reconnectAeClient') {
                try {
                    this.aeSocket.connect(Config.thingAdaptionSoftware.parentPort, Config.thingAdaptionSoftware.parentHost, async () => {
                        Logger.info(`[AeService-connect]: Connected to ${Config.thingAdaptionSoftware.parentHost}:${Config.thingAdaptionSoftware.parentPort}`);
                        this.aeHandler.resetDownloadCount();

                        for (let i = 0; i < Config.download.length; i++) {
                            const contentInstance = { name: Config.download[i].name, content: 'hello' };
                            this.aeSocket.write(JSON.stringify(contentInstance) + '<EOF>');
                            Logger.info(`[AeService-connect]: Sent hello message for ${Config.download[i].name}`);
                        }

                        await Delay(1000);

                        if (this.aeHandler.getDownloadCount() >= Config.download.length) {
                            resolve('startThing');
                        }
                    });
                } catch (error) {
                    Logger.error(`[AeService-connect]: Connection attempt failed - ${error}`);
                }
            }
        });
    }

    public async disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (this.aeSocket.destroyed) {
                Logger.info('[AeService-disconnect]: Socket already destroyed');
                resolve();
            } else {
                this.aeSocket.end(() => {
                    Logger.info('[AeService-disconnect]: Socket ended');
                    resolve();
                });
            }
        });
    }

    public sendToAE(sendData: string): void {
        this.aeSocket.write(sendData);
    }
}

export default AeService;