import Logger from 'utils/Logger';
import AEHandler from 'handlers/AEHandler';

class AeService {
    private aeHandler: AEHandler;

    constructor(private restart: Function) {
        this.aeHandler = new AEHandler(this.restart);
    }

    /**
     * AE 서버와 연결하는 함수를 호출합니다.
     * 정상적으로 연결된 경우 'startThingConnector'를를 resolve합니다.
     * 연결되지 않은 경우 throw하여 재시작하도록 합니다.
     *
     * @returns Promise<string>
     */
    public async startAEConnector(): Promise<string> {
        try {
            Logger.info('[App-startAEConnector]: Running business logic for starting AEConnector...');
            await this.aeHandler.startAEConnector();
            Logger.info('[App-startAEConnector]: AEConnector started successfully');
            return 'startThingConnector';
        } catch (error) {
            Logger.error(`[AeService-startAEConnector]: ${error}`);
            throw 'startAEConnector'; 
        }
    }

    /**
     * 소켓 연결을 종료하는 함수를 호출합니다.
     *
     * @returns Promise<void>
     */
    public async stopAEConnector(): Promise<void> {
        try {
            const result = await this.aeHandler.stopAEConnector();
            Logger.info(`[AeService-stopAEConnector]: Socket is ${result}`);
        } catch (error) {
            Logger.error(`[AeService-stopAEConnector]: ${error}`);
        }
    }

    public async sendToAE(sendData: string): Promise<void> {
        try {
            await this.aeHandler.sendMessage(sendData);
            Logger.info(`[AeService-sendToAE]: Send cin to AE ${sendData} ---->\r\n`);
        } catch (error) {
            Logger.error(`[AeService-sendToAE]: ${error}`);
        }
    }
}

export default AeService;