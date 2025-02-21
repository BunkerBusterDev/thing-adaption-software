import Delay from 'utils/Delay';
import Logger from 'utils/Logger';
import { thingAdaptionSoftware } from 'Conf';
import { startWatchdog, stopWatchdog, deleteAllWatchdogTimer } from 'utils/WatchdogTimer';

import AEService from 'services/AEService';
import ThingService from 'services/ThingService';

class App {
    private aeService: AEService;
    private thingService: ThingService;
    
    private maxRetries;
    private retryCount;
    private delayTime;

    constructor() {
        startWatchdog();
        
        // SIGINT 처리
        process.on('SIGINT', this.shutdown.bind(this));

        this.aeService = new AEService(this.restart.bind(this));
        this.thingService = new ThingService(this.aeService.sendToAE.bind(this.aeService));

        this.maxRetries = 5;
        this.retryCount = 0;
        this.delayTime = 1000;
    }

    // 애플리케이션 종료
    private async shutdown(): Promise<void> {
        Logger.info('[App-shutdown]: Received SIGINT. Shutting down gracefully...');
        deleteAllWatchdogTimer();
        stopWatchdog();
        await this.aeService.stopAEConnector();
        process.exit(0);
    }

    private async restart(state: string): Promise<void> {
        Logger.info('[App-restart]: Restarting application...');
        thingAdaptionSoftware.state = state;
        await this.thingService.stopThingConnector();
        deleteAllWatchdogTimer();

        // 현재 지연 시간만큼 대기
        this.retryCount++;

        // 최대 재시도 횟수 초과 시 에러 처리
        if (this.retryCount > this.maxRetries) {
            Logger.warn(`[App-restart]: Maximum connection attempts (${this.maxRetries}) exceeded. Retrying in 60 seconds...`);
            
            // 1분 후 재시작
            await Delay(60000); // 60초 대기
            this.retryCount = 1;
            this.delayTime = 1000;
        }

        Logger.info(`[App-restart]: Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.delayTime}ms...`);
        await Delay(this.delayTime);
        
        // 지수 백오프 계산 (최대 지연 시간 제한)
        this.delayTime = Math.min(this.delayTime * 2, 30000); // 최대 지연 시간 30초
        await this.start();
    }

    // 애플리케이션 시작
    public async start(): Promise<void> {
        try {
            if(thingAdaptionSoftware.state === 'setupThingConnector') {
                thingAdaptionSoftware.state = await this.thingService.setupThingConnector();
                this.retryCount = 0;
                this.delayTime = 1000;
            }
            if(thingAdaptionSoftware.state === 'startAEConnector') {
                thingAdaptionSoftware.state = await this.aeService.startAEConnector();
                this.retryCount = 0;
                this.delayTime = 1000;
            }
            if(thingAdaptionSoftware.state === 'startThingConnector') {
                thingAdaptionSoftware.state = await this.thingService.startThingConnector();
                this.retryCount = 0;
                this.delayTime = 1000;
            }
            if(thingAdaptionSoftware.state === 'startUpload') {
                Logger.info('[App-start]: Thing Adaption Software is starting upload');
            }
        } catch (error: any) {
            Logger.error(`[App-start]: App start is failed`);
            this.restart(error);
        }
    }
}

// 애플리케이션 실행
const app = new App();
app.start();