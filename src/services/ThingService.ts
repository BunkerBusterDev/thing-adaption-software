import Dgram from 'dgram';
import ThingHandler from 'handlers/ThingHandler';
import Logger from 'utils/logger';
import * as Wdt from 'utils/watchdogTimer';

class ThingService {
    private thingSocket: Dgram.Socket;
    private thingHandler: ThingHandler;

    constructor(private sendToAE: Function) {
        this.thingHandler = new ThingHandler();
        this.thingSocket = Dgram.createSocket('udp4');
    }

    public async startThing(): Promise<string> {
        return new Promise((resolve) => {
            Wdt.setWatchdogTimer('thingConnector', 1, () => this.thingHandler.onSensing(this.thingSocket));
            resolve('startUpload');
        });
    }

    public async connect(): Promise<string> {
        return new Promise((resolve) => {
            this.thingSocket.on('message', (data) => this.thingHandler.onReceive(data, this.sendToAE));
            Logger.info('[ThingService-connect]: ThingConnector connected');
            resolve('connectAeClient');
        });
    }
}

export default ThingService;