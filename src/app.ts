import Config from 'Conf';
import Logger from "utils/Logger";
import Delay from 'utils/Delay';
import WatchdogTimer from 'utils/WatchdogTimer';

import AEService from 'services/AEService';
import ThingService from 'services/ThingService';

class App {
    private aeService: AEService;
    private thingService: ThingService;
    
    private maxRetries;
    private retryCount;
    private delayTime;

    constructor() {
        // SIGINT 처리
        process.on('SIGINT', this.shutdown.bind(this));
        WatchdogTimer.startWatchdog();

        this.aeService = new AEService(this.restart.bind(this));
        this.thingService = new ThingService(this.aeService.sendToAE.bind(this.aeService));

        this.maxRetries = 5;
        this.retryCount = 0;
        this.delayTime = 1000;

        Config.thingAdaptionSoftware.state = 'connectThing';
    }

    // 애플리케이션 시작
    public async start(): Promise<void> {
        if(Config.thingAdaptionSoftware.state === 'connectThing') {
            Config.thingAdaptionSoftware.state = await this.thingService.connect();
        }
        if(Config.thingAdaptionSoftware.state === 'connectAeClient' || Config.thingAdaptionSoftware.state === 'reconnectAeClient') {
            Config.thingAdaptionSoftware.state = await this.aeService.connect();
        }
        if(Config.thingAdaptionSoftware.state === 'startThing') {
            this.retryCount = 0;
            this.delayTime = 1000;
            Config.thingAdaptionSoftware.state = await this.thingService.startThing();
        }
        if(Config.thingAdaptionSoftware.state === 'startUpload') {
            Logger.info('[App]: Thing Adaption Software is starting upload');
        }
    }

    private async restart(): Promise<void> {
        Logger.info('[App-restart]: Restarting application...');
        Config.thingAdaptionSoftware.state = 'reconnectAeClient';

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
            await Delay(60000); // 60초 대기
            if (typeof this.restart === 'function') {
                this.restart(); // App의 restart 메서드 호출
            }
        }

        await this.start();
    }

    // 애플리케이션 종료
    private async shutdown(): Promise<void> {
        Logger.info('[App-shutdown]: Received SIGINT. Shutting down gracefully...');
        WatchdogTimer.stopWatchdog();
        await this.aeService.disconnect();
        process.exit(0);
    }
}

// 애플리케이션 실행
const app = new App();
app.start();