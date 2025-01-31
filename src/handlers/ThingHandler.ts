import Dgram from 'dgram';
import Logger from 'utils/logger';
import Config from 'conf';

class ThingHandler {
    private strData: string = '';

    public onSensing(thingSocket: Dgram.Socket): void {
        const data = Buffer.from('AT+PRINT=SENSOR_DATA\r\n');
        thingSocket.send(data, Config.thingAdaptionSoftware.thingPort, Config.thingAdaptionSoftware.thingHost, (error) => {
            if (error) {
                Logger.error('[ThingHandler-onSensing]: Error sending sensing command');
                thingSocket.close();
            }
        });
    }

    public onReceive(data: Buffer, sendToAE: Function): void {
        let divData = data.toString().replace('data', '"data"').replace(/\t/gi, '').replace(/\r\n/gi, '');

        if (divData.includes('data')) {
            divData = divData.substring(divData.indexOf('data') - 2, divData.length);
            this.strData = divData;
        } else {
            this.strData += divData;

            if (divData.includes('}]}')) {
                try {
                    const dataObject = {
                        id: 'intIllums#',
                        name: 'container_intIllums',
                        content: JSON.parse(this.strData.substring(0, this.strData.length)).data
                    };

                    // Sensor calibration
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

                    for (let i = 0; i < sensorCalibration.length; i++) {
                        let illum = dataObject.content[i].illum * sensorCalibration[i].factor + sensorCalibration[i].offset;
                        if (illum < 0) illum = 0.0;
                    }

                    if (Config.thingAdaptionSoftware.state === 'startUpload') {
                        for (let i = 0; i < Config.upload.length; i++) {
                            if (Config.upload[i].name === dataObject.name) {
                                const cin = { name: Config.upload[i].name, content: dataObject.content };
                                Logger.info(`[ThingHandler-onReceive]: SEND : ${JSON.stringify(cin)} ---->\r\n`);
                                sendToAE(`${JSON.stringify(cin)}<EOF>`);
                                break;
                            }
                        }
                    }
                } catch (error) {
                    Logger.error(`[ThingHandler-onReceive]: Error processing data - ${error}`);
                }
            }
        }
    }
}

export default ThingHandler;