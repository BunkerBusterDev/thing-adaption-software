const thingAdaptionSoftware = {
    state: 'setupThingConnector',
    parentHost: 'ip',
    parentPort: 0,
    thingHost: 'ip',
    thingPort: 0
};

interface iUpDownData {
    id: string;
    name: string;
}

const upload: Array<iUpDownData> = [];
const download: Array<iUpDownData> = [];

let count = 0;
upload[count++] = {
    id: 'illums',
    name: 'container_illums'
}

// const numData1 = 10;
// for(let i=0; i<numData1; i++) {
//     upload[count++] = {
//         id: `date1Id#${i+1}`,
//         name: `container_data1Name_${i+1}`
//     };
// }

// const numData2 = 10;
// for(let i=0; i<numData2; i++) {
//     upload[count++] = {
//         id: `data2Id#${i+1}`,
//         name: `container_data2Name_${i+1}`
//     };
// }

count = 0;
download[count++] = {
    id: 'ctrLEDs#',
    name: 'container_ctrLEDs'
}


const config = {
    thingAdaptionSoftware: thingAdaptionSoftware,
    upload: upload,
    download: download
}

export = config;