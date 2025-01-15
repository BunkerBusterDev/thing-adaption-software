import AeClient from "aeClient";
import Logger from "lib/logger";

class App {
    private host: string;
    private port: number;
    private aeClient: AeClient;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
        this.aeClient = new AeClient(this.host, this.port, this.restart.bind(this));
    
        // SIGINT 처리
        process.on('SIGINT', this.shutdown.bind(this));
    }

    private async restart(): Promise<void> {
        Logger.info('[App]: Restarting application...');
        await this.start();
    }

    // 애플리케이션 시작
    public async start(): Promise<void> {
        await this.aeClient.connect();
    }

    // 애플리케이션 종료
    private async shutdown(): Promise<void> {
        Logger.info('[App]: Received SIGINT. Shutting down gracefully...');
        await this.aeClient.disconnect();
        process.exit(0);
    }
}

// 애플리케이션 실행
const app = new App('127.0.0.1', 3105);
app.start();