import * as dgram from 'dgram';

import Config from './conf';
import Logger from './lib/logger';
import * as Wdt from './lib/watchdogTimer';

class ThingConnector {
    private thingSocket: dgram.Socket;
    private strData: string;
    private SendToAE: Function;

    constructor(sendToAE: Function) {
        this.thingSocket = dgram.createSocket('udp4');
        this.SendToAE = sendToAE;
        this.strData = '';
    }

    public async init() {
        this.thingSocket.on('message', this.onReceive.bind(this));
        Wdt.setWatchdogTimer('thingConnector', 1, this.onSensing.bind(this));
        Logger.info('[ThingConnector]: ThingConnector connected');
    }

    // onReceive는 Thing과 송수신 방식에 따라 수정하여 사용용
    private onReceive(data:Buffer) {
        let divData = data.toString().replace('data', '"data"').replace(/\t/gi, '').replace(/\r\n/gi, '');

        if(divData.includes('data')) {
            divData = divData.substring(divData.indexOf('data')-2, divData.length);
            this.strData = divData;
        } else {
            this.strData += divData;

            if(divData.includes('}]}')) {
                try {
                    const dataObject = {
                        id: 'illums#',
                        name: 'container_illums',
                        content: JSON.parse(this.strData.substring(0, this.strData.length)).data
                    }

                    // 센서 보정값 테이블
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
                    
                    // 보정 및 데이터 업데이트
                    for (let i = 0; i < sensorCalibration.length; i++) {
                        let illum = dataObject.content[i].illum * sensorCalibration[i].factor + sensorCalibration[i].offset;
                        if (illum < 0) {
                            illum = 0.0;
                        }
                    }

                    for (let i = 0; i < Config.upload.length; i++) {
                        if (Config.upload[i].name === dataObject.name) {
                            const cin = { containerName: Config.upload[i].name, content: dataObject.content };
                            Logger.info(`[ThingConnector]: SEND : ${JSON.stringify(cin)} ---->`);
                            this.SendToAE(`${JSON.stringify(cin)}<EOF>`);
                            break;
                        }
                    }
                } catch (error) {
                    Logger.error(`[ThingConnector]: Error processing data - ${error}`);
                }
            }
        }
    }

    private onSensing () {
        const data = Buffer.from('AT+PRINT=SENSOR_DATA\r\n');
        // Logger.info(`[ThingConnector]: SEND : ${data.toString().trim()} ---->`);
        this.thingSocket.send(data, Config.tas.thingPort, Config.tas.thingHost, (error) => {
            if(error){
                Logger.error('[ThingConnector]: Error sending sensing command');
                this.thingSocket.close();
            }
        });
    }
}

export default ThingConnector;