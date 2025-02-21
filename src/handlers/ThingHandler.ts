import Dgram from 'dgram';
import Logger from 'utils/Logger';
import { thingAdaptionSoftware, upload } from 'Conf';

class ThingHandler {
    private strData: string;
    private thingSocket: Dgram.Socket;

    constructor(private sendToAEService: Function) {
        this.strData = '';
        this.thingSocket = Dgram.createSocket('udp4');
    }

    /**
     * 소켓 이벤트를 설정합니다.
     * 수신된 메시지는 ThingHandler의 onReceive를 통해 처리합니다.
     */
    public setupSocket(): Promise<void> {
        return new Promise((resolve) => {
            this.thingSocket.on('message', (data) => {
                this.handleData(data);
            });
            resolve();
        });
    }

    public sendMessage(data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = Buffer.from(`${data}\r\n`);
            this.thingSocket.send(command, thingAdaptionSoftware.thingPort, thingAdaptionSoftware.thingHost, (error) => {
                if (!error) {
                    resolve();
                } else {
                    this.thingSocket.close();
                    reject();
                }
            });

        });
    }

    /**
     * UDP 소켓으로부터 수신된 데이터를 처리합니다.
     *
     * @param data - UDP 소켓으로부터 전달된 데이터 (Buffer)
     */
    private handleData(data: Buffer): void {
        // 수신된 Buffer 데이터를 문자열로 변환하고,
        // 'data' 키를 "data"로 변경(문자열 포맷 보정),
        // 탭(\t)과 개행문자(\r\n)를 제거하여 정제합니다.
        let divData = data.toString().replace('data', '"data"').replace(/\t/gi, '').replace(/\r\n/gi, '');

        // 만약 정제된 문자열에 "data"라는 키워드가 포함되어 있다면,
        // 시작 부분에서 "data"가 나타나는 위치 앞뒤의 일부를 잘라내어
        // 누적 변수(strData)에 저장합니다.
        if (divData.includes('data')) {
            divData = divData.substring(divData.indexOf('data') - 2, divData.length);
            this.strData = divData;
        } else {
            // "data" 키워드가 포함되어 있지 않다면, 이전에 누적한 문자열에 현재 문자열을 추가합니다.      
            this.strData += divData;

            // 만약 누적 문자열에 종료를 나타내는 패턴("}]}")이 포함되었다면,
            // 완전한 JSON 형태의 데이터라고 판단하고 처리합니다.
            if (divData.includes('}]}')) {
                try {
                    const dataObject = {
                        id: 'intIllums#',
                        name: 'container_intIllums',
                        content: JSON.parse(this.strData.substring(0, this.strData.length)).data
                    };

                    // Sensor 보정 값
                    const sensorCalibration = [
                        { factor: 1.4975, offset: 11.961 },
                        { factor: 1.4092, offset: 9.468 },
                        { factor: 1.4657, offset: 10.495 },
                        { factor: 1.4774, offset: 11.036 },
                        { factor: 1.4620, offset: 10.349 },
                        { factor: 1.3501, offset: 3.4235 },
                        { factor: 1.4060, offset: 9.6677 },
                        { factor: 1.0064, offset: 0.0825 },
                        { factor: 1.4142, offset: 12.767 }
                    ];

                    // 각 센서의 보정값 적용
                    for (let i = 0; i < sensorCalibration.length; i++) {
                        let illum = dataObject.content[i].illum * sensorCalibration[i].factor + sensorCalibration[i].offset;
                        if (illum < 0) illum = 0.0;
                    }

                    // upload 준비가 완료된 상태에서만 AE로 전송
                    if (thingAdaptionSoftware.state === 'startUpload') {
                        for (let i = 0; i < upload.length; i++) {
                            if (upload[i].name === dataObject.name) {
                                const cin = { name: upload[i].name, content: dataObject.content };
                                this.sendToAEService(cin);
                                break;
                            }
                        }
                    }
                } catch (error) {
                    Logger.error(`[ThingHandler-handleData]: Error processing data - ${error}`);
                }
            }
        }
    }
}

export default ThingHandler;