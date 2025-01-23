const tas = {
    parentHost: 'ip',
    parentPort: 0,
    thingHost: 'ip',
    thingPort: 0
};

interface iUpDownData {
    id: string;
    name: string;
    content: unknown;
    rxTick: number;
}

const upload: Array<iUpDownData> = [];
const download: Array<iUpDownData> = [];

const numData1 = 10;
for(let i=0; i<numData1; i++) {
    upload[i] = {
        id: `date1Id#${i+1}`,
        name: `container_data1Name_${i+1}`,
        content: 0.0,
        rxTick: 0
    };
}

const numData2 = 10;
for(let i=0; i<numData2; i++) {
    upload[numData1+i] = {
        id: `data2Id#${i+1}`,
        name: `container_data2Name_${i+1}`,
        content: 0.0,
        rxTick: 0
    };
}

const config = {
    tas: tas,
    upload: upload,
    download: download
}

export = config;