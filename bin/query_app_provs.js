#!/usr/bin/env node

const fs = require('fs');
const provenance = require('../api/lib/provenance');
const db = require('../api/models');

const outputDir = "/tmp";

db.init(async function(err) {
    if(err) throw err;
    await run();
});

async function run() {
    const apps = db.Apps.find({removed: false}).lean();
    for await (const app of apps) {
        console.log(app._id, app.name, "---------------------------");
        const provs = await provenance.findTerminalTasks(app._id);
        if(!provs.length) {
            console.log("no prov.. skipping saving");
        }
        const filename = outputDir+"/app-"+app._id+".provs.json";
        console.log("saving ",provs.length,"provs",filename);
        fs.writeFileSync(filename, JSON.stringify(provs, null, 4));
    }
    console.log("disconnecting");
    db.disconnect();
}

