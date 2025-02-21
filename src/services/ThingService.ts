import Logger from 'utils/Logger';
import ThingHandler from 'handlers/ThingHandler';
import { setWatchdogTimer, deleteWatchdogTimer } from 'utils/WatchdogTimer';

class ThingService {
    private thingHandler: ThingHandler;

    constructor(private sendToAE: Function) {
        this.thingHandler = new ThingHandler(this.sendToAEService.bind(this));
    }

    /**
     * UDP 통신을 위해 소켓을 초기화하는 Handler 호출
     */
    public async setupThingConnector(): Promise<string> {
        try {
            Logger.info('[ThingService-setupThingConnector]: Running business logic for setting up ThingConnector...');
            await this.thingHandler.setupSocket();
            Logger.info('[ThingService-setupThingConnector]: ThingConnector set up successfully');
            return 'startAEConnector';
        } catch (error) {
            Logger.error(`[ThingService-setupThingConnector]: ${error}`);
            throw 'setupThingConnector';
        }
    }

    /**
     * 센싱 명령 전송을 주기적으로 실행하기 위해 WatchdogTimer를 설정합니다.
     * 이를 통해 일정 주기마다 sendSensingMessage가 호출됩니다.
     */
    public async startThingConnector(): Promise<string> {
        return new Promise((resolve) => {
            try {
                Logger.info('[ThingService-startThingConnector]: Running business logic for starting ThingConnector...');
                setWatchdogTimer('startThingConnector', 1, () => this.sendSensingMessage());
                Logger.info('[ThingService-startThingConnector]: ThingConnector started successfully');
                resolve('startUpload');
            } catch (error) {
                Logger.error(`[ThingService-startThingConnector]: ${error}`);
                throw 'startThingConnector';
            }
        });
    }

    /**
     * 센싱 명령 전송을 위한 WatchdogTimer를 제거합니다.
     */
    public async stopThingConnector(): Promise<void> {
        return new Promise((resolve) => {
            deleteWatchdogTimer('startThingConnector');
            Logger.info('[ThingService-stopThingConnector]: ThingConnector is stopped');
            resolve();
        });
    }

    /**
     * 센싱 명령을 전송합니다.
     */
    public async sendSensingMessage(): Promise<void> {
        const data = 'AT+PRINT=SENSOR_DATA';
        try {
            await this.thingHandler.sendMessage(data);
            Logger.info('[ThingService-sendSensingMessage]: Sensing command send successfully');
        } catch (error) {
            Logger.error('[ThingService-sendSensingMessage]: Error send sensing command');
        }
    }

    /**
     * 센싱된 데이터를 AEService를 통해 AE로 전송
     */
    public async sendToAEService(cin: object): Promise<void> {
        this.sendToAE(`${JSON.stringify(cin)}<EOF>`);
    }
}

export default ThingService;