import Net from 'net';
import Util from 'util';

import Config from 'Conf';
import Delay from 'utils/Delay';
import Logger from 'utils/Logger';

class AeHandler {
    private aeSocket: Net.Socket;
    private downloadCount: number = 0;

    constructor(private getState: Function, private restart: Function) {
        this.aeSocket = new Net.Socket();
    }

    private resetDownloadCount(): void {
        this.downloadCount = 0;
    }

    private getDownloadCount(): number {
        return this.downloadCount;
    }

    /**
     * 수신된 데이터를 구분자 '<EOF>' 기준으로 분리하여 처리합니다.
     * 메시지의 내용에 따라 'hello' 메시지와 그 외의 데이터를 구분하여 로깅합니다.
     *
     * @param data - 소켓에서 수신된 문자열 데이터
     */
    public handleData(data: string): void {
        // 현재 상태가 특정 연결/업로드 상태일 때만 처리
        if(this.getState() === 'connectAeClient' || this.getState() === 'reconnectAeClient' || this.getState() === 'startUpload') {
            const dataArry = data.split('<EOF>');
            if (dataArry.length >= 2) {
                for (let i = 0; i < dataArry.length - 1; i++) {
                    const line = dataArry[i];
                    try {
                        const sinkStr = Util.format('%s', line);
                        const sinkObj = JSON.parse(sinkStr);

                        if (!sinkObj.name || !sinkObj.content) {
                            Logger.error('[AeHandler-handleData]: Data format mismatch');
                            continue;
                        }

                        if (sinkObj.content === 'hello') {
                            Logger.info(`[AeHandler-handleData]: Received hello message ${line}`);
                            this.downloadCount++;
                        } else {
                            // 업로드 대상에 대한 ACK 처리
                            for (let j = 0; j < Config.upload.length; j++) {
                                if (Config.upload[j].name == sinkObj.name) {
                                    Logger.info(`[AeHandler-handleData]: ACK ${line}`);
                                    break;
                                }
                            }
    
                            // 다운로드 대상 메시지 처리
                            for (let j = 0; j < Config.download.length; j++) {
                                if (Config.download[j].name == sinkObj.name) {
                                    const downBuffer = JSON.stringify({id: Config.download[i].id, content: sinkObj.content});
                                    Logger.info(`[AeHandler-handleData]: Received message ${downBuffer}`);
                                    // 예: 하드웨어 제어 등 추가 작업 수행
                                    // control_led(sinkObj.content);
                                    break;
                                }
                            }
                        }
                    } catch (error) {
                        Logger.error(`[AeHandler-handleData]: Error processing line - ${error}`);
                    }
                }
            }
        }
    }

    public sendMessage(sendData: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                if(this.aeSocket) {
                    this.aeSocket.write(sendData);
                } else {
                    reject();
                }
            } catch (error) {
                reject(error);
            } finally {
                resolve(true);
            }
        });
    }

    public connect(parentHost: string, parentPort: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.aeSocket.removeAllListeners();
            this.aeSocket.on('data', (data: Buffer) => {
                const strData = data.toString();
                this.handleData(strData);
            });
            this.aeSocket.on('error', (error: Error) => {
                Logger.error(`[AEHandler]: ${error}`);
            });
            this.aeSocket.on('close', () => {
                Logger.info('[AEHandler]: Connection closed');
                if(this.aeSocket) {
                    this.aeSocket.destroy();
                    this.restart();
                }
            });
            this.aeSocket.connect(parentPort, parentHost, async () => {
                this.resetDownloadCount();

                // 각 다운로드 대상에 대해 'hello' 메시지 전송
                for (let i = 0; i < Config.download.length; i++) {
                    const contentInstance = { name: Config.download[i].name, content: 'hello' };
                    if(this.aeSocket) {
                        this.aeSocket.write(JSON.stringify(contentInstance) + '<EOF>');
                        Logger.info(`[AEHandler-connect]: Sent hello message for ${Config.download[i].name}`);
                    }
                }

                // 일정 시간 대기 후 응답 개수 확인 (비즈니스 로직에 따라 조정)
                await Delay(1000);

                if (this.getDownloadCount() >= Config.download.length) {
                    resolve();
                } else {
                    reject();
                }
            });
        });
    }

    public disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.aeSocket || this.aeSocket.destroyed) {
                resolve();
            } else {
                this.aeSocket.end(() => {
                    Logger.info('[AEHandler-disconnect]: Socket ended');
                    resolve();
                });
            }
        });
    }
}

export default AeHandler;