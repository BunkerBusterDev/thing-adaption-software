import Logger from 'utils/Logger';
import AEHandler from 'handlers/AEHandler';

class AeService {
    private aeHandler: AEHandler;

    constructor(private getState: Function, private restart: Function) {
        this.aeHandler = new AEHandler(this.getState, this.restart);
    }

    /**
     * 서버와의 연결을 수립합니다.
     * 연결 성공 시 각 다운로드 대상에 대해 초기 'hello' 메시지를 전송하고,
     * 일정 시간 대기 후 다운로드 응답 개수를 확인하여 'startThing' 문자열로 resolve합니다.
     *
     * @returns Promise<string> (성공 시 'startThing' resolve)
     */
    public async connect(parentHost: string , parentPort: number): Promise<string> {
        if (this.getState() === 'connectAeClient' || this.getState() === 'reconnectAeClient') {
            try {
                Logger.info(`[AeService-connect]: Connected to ${parentHost}:${parentPort}`);
                await this.aeHandler.connect(parentHost, parentPort);
                return 'startThing';
            } catch (error) {
                throw error; 
            }
        } else {
            return this.getState();
        }
    }


    /**
     * 소켓 연결을 종료합니다.
     *
     * @returns Promise<void>
     */
    public async disconnect(): Promise<void> {
        try {
            await this.aeHandler.disconnect();
            Logger.info('[AeService-disconnect]: Socket already destroyed');
        } catch (error) {

        }
    }

    public async sendToAE(sendData: string): Promise<void> {
        try {
            await this.aeHandler.sendMessage(sendData);
        } catch (error) {

        }
    }
}

export default AeService;