import Net from 'net';
import Logger from 'lib/logger';

class AeClient {
    private isConn: boolean;
    private host: string;
    private port: number;
    private restart: Function;
    private aeSocket: Net.Socket;

    constructor(host: string, port: number, restart: Function) {
        this.isConn = false;
        this.host = host;
        this.port = port;
        this.restart = restart;

        this.aeSocket = new Net.Socket();
        this.aeSocket.on('data', this.onReceive.bind(this));
        this.aeSocket.on('error', (error) => {
            Logger.error(`[AeClient]: ${error}`);
        });
        this.aeSocket.on('close', () => {
            this.aeSocket.destroy();
            Logger.info(`[AeClient]: Connection closed`);
            if(this.isConn) {
                this.isConn = false;
                restart();
            }
        });
        Logger.info('[AeClient]: AeClient initialized');
    }

    private onReceive(data: { toString: () => string }) {
        Logger.info(data);
    }

    public async connect(): Promise<void> {
        const maxRetries = 5; // 최대 재시도 횟수
        let retryCount = 0;    // 현재 재시도 횟수
        let delayTime = 1000;  // 초기 지연 시간 (1초)

        while (!this.isConn && retryCount < maxRetries) {
            try {
                this.aeSocket.connect(this.port, this.host, () => {
                    Logger.info(`[AEClient]: AE connected to ${this.host}:${this.port}`);
                    this.isConn = true;
                });
            } catch(error) {
                Logger.error(`[AEClient]: Connection attempt failed - ${error}`);
            }

            retryCount++;
            Logger.info(`[AEClient]: Retrying connection (${retryCount}/${maxRetries}) in ${delayTime}ms...`);
            
            // 현재 지연 시간만큼 대기
            await this.delay(delayTime);
            
            // // 지수 백오프 계산 (최대 지연 시간 제한)
            // delayTime = Math.min(delayTime * 2, 30000); // 최대 지연 시간 30초
        }

        // 최대 재시도 횟수 초과 시 에러 처리
        if (!this.isConn) {
            Logger.warn(`[AEClient]: Maximum connection attempts (${maxRetries}) exceeded. Retrying in 10 seconds...`);
            
            // 1분 후 재시작
            await this.delay(10000); // 10초 대기
            if (typeof this.restart === 'function') {
                this.restart(); // App의 restart 메서드 호출
            }
        }
    }

    public async disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (this.aeSocket.destroyed) {
                Logger.info('[AeClient]: Socket already destroyed');
                resolve();
                return;
            }

            this.aeSocket.end(() => {
                Logger.info('[AeClient]: Socket ended');
                resolve();
            });
        });
    }

    // 지연 함수
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default AeClient;