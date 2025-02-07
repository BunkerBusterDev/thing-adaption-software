import Dgram from 'dgram';
import ThingHandler from 'handlers/ThingHandler';
import Config from 'Conf';
import Logger from 'utils/Logger';
import WatchdogTimer from 'utils/WatchdogTimer';

class ThingService {
    private thingSocket: Dgram.Socket;
    private thingHandler: ThingHandler;

    constructor(private getState: Function, private sendToAE: Function) {
        this.thingHandler = new ThingHandler(this.getState);
        this.thingSocket = Dgram.createSocket('udp4');
    }

    /**
     * 소켓 이벤트를 설정합니다.
     * 수신된 메시지는 ThingHandler의 onReceive를 통해 처리합니다.
     */
    public async setupSocket(): Promise<string> {
        return new Promise((resolve) => {
            this.thingSocket.on('message', (data) => {
                this.thingHandler.onReceive(data, this.sendToAE)
            });
            Logger.info('[ThingService-setupSocket]: ThingConnector is set up');
            resolve('connectAeClient');
        });
    }

    /**
     * 센싱 명령 전송을 주기적으로 실행하기 위해 WatchdogTimer를 설정합니다.
     * 이를 통해 일정 주기마다 sendSensingCommand가 호출됩니다.
     */
    public async startThing(): Promise<string> {
        return new Promise((resolve) => {
            WatchdogTimer.setWatchdogTimer('startThing', 1, () => this.sendSensingCommand());
            Logger.info('[ThingService-startThing]: ThingConnector has started');
            resolve('startUpload');
        });
    }

    /**
     * 센싱 명령 전송을 위한 WatchdogTimer를 제거합니다.
     */
    public async stopThing(): Promise<void> {
        return new Promise((resolve) => {
            WatchdogTimer.deleteWatchdogTimer('startThing');
            Logger.info('[ThingService-startThing]: ThingConnector has stopped');
            resolve();
        });
    }

    /**
     * 센싱 명령을 UDP로 송신합니다.
     */
    public sendSensingCommand(): void {
        const command = Buffer.from('AT+PRINT=SENSOR_DATA\r\n');
        this.thingSocket.send(command, Config.thingAdaptionSoftware.thingPort, Config.thingAdaptionSoftware.thingHost, (error) => {
            if (error) {
                Logger.error('[ThingService-sendSensingCommand]: Error sending sensing command');
                this.thingSocket.close();
            } else {
                Logger.info('[ThingService-sendSensingCommand]: Sensing command sent successfully');
            }
        });
    }
}

export default ThingService;