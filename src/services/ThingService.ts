import Dgram from 'dgram';
import ThingHandler from 'handlers/ThingHandler';
import Logger from 'utils/Logger';
import WatchdogTimer from 'utils/WatchdogTimer';

class ThingService {
    private thingSocket: Dgram.Socket;
    private thingHandler: ThingHandler;

    constructor(private sendToAE: Function) {
        this.thingHandler = new ThingHandler();
        this.thingSocket = Dgram.createSocket('udp4');
    }

    public async connect(): Promise<string> {
        return new Promise((resolve) => {
            this.thingSocket.on('message', (data) => this.thingHandler.onReceive(data, this.sendToAE));
            Logger.info('[ThingService-connect]: ThingConnector connected');
            resolve('connectAeClient');
        });
    }

    public async startThing(): Promise<string> {
        return new Promise((resolve) => {
            WatchdogTimer.setWatchdogTimer('thingConnector', 1, () => this.thingHandler.onSensing(this.thingSocket));
            resolve('startUpload');
        });
    }
}

export default ThingService;