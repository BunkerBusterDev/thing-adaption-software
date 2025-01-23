import Config from 'conf';
import AeClient from './aeClient';
import ThingConnector from './thingConnector';
import Logger from "./lib/logger";

class App {
    private aeClient: AeClient;
    private thingConnector: ThingConnector;

    constructor() {
        this.aeClient = new AeClient(
            Config.tas.parentHost,
            Config.tas.parentPort,
            this.restart.bind(this)
        );
        this.thingConnector = new ThingConnector(this.aeClient.sendToAE.bind(this.aeClient));
    
        // SIGINT 처리
        process.on('SIGINT', this.shutdown.bind(this));
    }

    private async restart(): Promise<void> {
        Logger.info('[App]: Restarting application...');
        await this.start();
    }

    // 애플리케이션 시작
    public async start(): Promise<void> {
        await this.aeClient.init();
        await this.thingConnector.init();
    }

    // 애플리케이션 종료
    private async shutdown(): Promise<void> {
        Logger.info('[App]: Received SIGINT. Shutting down gracefully...');
        await this.aeClient.disconnect();
        process.exit(0);
    }
}

// 애플리케이션 실행
const app = new App();
app.start();