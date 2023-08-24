interface ArrayTypeUpDown {
    id: string;
    name: string;
    content: unknown;
}

// build thing

const thing = {
    parentHost: 'localhost',
    parentPort: 3105,
    host: '192.168.50.213',
    port: 50213,
};

const upload: Array<ArrayTypeUpDown> = [];
const download: Array<ArrayTypeUpDown> = [];
// build upload
const numIllum = 10;
for (let i = 0; i < numIllum; i++) {
    upload[i] = {
        id: `illum#${i + 1}`,
        name: `container_illum_${i + 1}`,
        content: null,
    };
}

const numCurr = 10;
for (let i = 0; i < numCurr; i++) {
    upload[numIllum + i] = {
        id: `curr#${i + 1}`,
        name: `container_curr_${i + 1}`,
        content: null,
    };
}

// let numLed = 30;
// for (let i = 0; i < numIllum; i++) {
//     upload[numIllum + numCurr + i] = {
//         id: `led#${i + 1}`,
//         name: `container_led_${i + 1}`,
//         content: null,
//     };
// }

// // build download
// for (let i = 0; i < numIllum; i++) {
//     download[i] = {
//         id: upload[numIllum + numCurr + i].id,
//         name: upload[numIllum + numCurr + i].name,
//         content: null,
//     };
// }

const config = {
    thing: thing,
    upload: upload,
    download: download,
};

module.exports = config;
