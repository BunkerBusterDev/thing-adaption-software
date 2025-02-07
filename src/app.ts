import Config from 'Conf';
import Logger from "utils/Logger";
import Delay from 'utils/Delay';
import WatchdogTimer from 'utils/WatchdogTimer';

import AEService from 'services/AEService';
import ThingService from 'services/ThingService';

class App {
    private state: string;
    private parentHost: string;
    private parentPort: number;
    private aeService: AEService;
    private thingService: ThingService;
    
    private maxRetries;
    private retryCount;
    private delayTime;

    constructor() {
        // SIGINT 처리
        process.on('SIGINT', this.shutdown.bind(this));
        WatchdogTimer.startWatchdog();

        this.state = 'connectThing';
        this.parentHost = Config.thingAdaptionSoftware.parentHost;
        this.parentPort = Config.thingAdaptionSoftware.parentPort;

        this.aeService = new AEService(this.getState.bind(this), this.restart.bind(this));
        this.thingService = new ThingService(this.getState.bind(this), this.aeService.sendToAE.bind(this.aeService));

        this.maxRetries = 5;
        this.retryCount = 0;
        this.delayTime = 1000;
    }

    // 애플리케이션 시작
    public async start(): Promise<void> {
        try {
            if(this.state === 'connectThing') {
                this.state = await this.thingService.setupSocket();
            }
            if(this.state === 'connectAeClient' || this.state === 'reconnectAeClient') {
                this.state = await this.aeService.connect(this.parentHost, this.parentPort);
            }
            if(this.state === 'startThing') {
                this.retryCount = 0;
                this.delayTime = 1000;
                this.state = await this.thingService.startThing();
            }
            if(this.state === 'startUpload') {
                Logger.info('[App]: Thing Adaption Software is starting upload');
            }
        } catch (error) {
            Logger.error(`[App-start]: App start is failed`);
            this.restart();
        }
    }

    private async restart(): Promise<void> {
        Logger.info('[App-restart]: Restarting application...');
        this.state = 'reconnectAeClient';
        await this.thingService.stopThing();

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

    // 애플리케이션 종료
    private async shutdown(): Promise<void> {
        Logger.info('[App-shutdown]: Received SIGINT. Shutting down gracefully...');
        WatchdogTimer.stopWatchdog();
        await this.aeService.disconnect();
        process.exit(0);
    }

    private getState(): string {
        return this.state;
    }
}

// 애플리케이션 실행
const app = new App();
app.start();