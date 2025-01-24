import Config from 'conf';
import AeClient from './aeClient';
import ThingConnector from './thingConnector';
import Logger from "./lib/logger";
import Delay from 'lib/delay';

class App {
    private aeClient: AeClient;
    private thingConnector: ThingConnector;
    private maxRetries;
    private retryCount;
    private delayTime;

    constructor() {
        // SIGINT 처리
        process.on('SIGINT', this.shutdown.bind(this));

        this.aeClient = new AeClient(this.restart.bind(this));
        this.thingConnector = new ThingConnector(this.aeClient.sendToAE.bind(this.aeClient));
        this.maxRetries = 5;
        this.retryCount = 0;
        this.delayTime = 1000;

        Config.tas.state = 'startThingConnector';
    }

    // 애플리케이션 시작
    public async start(): Promise<void> {
        if(Config.tas.state === 'startThingConnector') {
            Config.tas.state = await this.thingConnector.connect();
        }
        if(Config.tas.state === 'startAeClient' || Config.tas.state === 'restartAeClient') {
            Config.tas.state = await this.aeClient.connect();
        }
        if(Config.tas.state === 'upload') {
            this.retryCount = 0;
            this.delayTime = 1000;
            Logger.info('[App]: Thing Adaption Software is started');
        }
    }

    private async restart(): Promise<void> {
        Logger.info('[App-restart]: Restarting application...');
        Config.tas.state = 'restartAeClient';

        // 현재 지연 시간만큼 대기
        this.retryCount++;
        Logger.info(`[App-restart]: Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.delayTime}ms...`);
        await Delay(this.delayTime);
        
        // 지수 백오프 계산 (최대 지연 시간 제한)
        this.delayTime = Math.min(this.delayTime * 2, 30000); // 최대 지연 시간 30초

        // 최대 재시도 횟수 초과 시 에러 처리
        if (this.retryCount > this.maxRetries) {
            Logger.warn(`[App-restart]: Maximum connection attempts (${this.maxRetries}) exceeded. Retrying in 60 seconds...`);
            
            // 1분 후 재시작
            await Delay(600000); // 60초 대기
            if (typeof this.restart === 'function') {
                this.restart(); // App의 restart 메서드 호출
            }
        }

        await this.start();
    }

    // 애플리케이션 종료
    private async shutdown(): Promise<void> {
        Logger.info('[App-shutdown]: Received SIGINT. Shutting down gracefully...');
        await this.aeClient.disconnect();
        process.exit(0);
    }
}

// 애플리케이션 실행
const app = new App();
app.start();