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

    const old = new Date();
    old.setDate(-10);

    const apps = db.Apps.find({removed: false}).lean();
    for await (const app of apps) {
        const filename = outputDir+"/app-"+app._id+".provs.json";
        console.log(app._id.toString(), app.name, filename, "---------------------------");
        try {
            const stat = fs.statSync(filename);
            console.log("mtime", stat.mtime);
            if(new Date(stat.mtime) > old) {
                console.log("recently processed prov file exists.. skipping");
                continue;
            }
        } catch (err) {
            //maybe not yet generated.. no worry..
        }

        const provs = await provenance.findTerminalTasks(app._id);
        if(!provs.length) {
            console.log("no prov.. skipping saving");
        }
        console.log("saving ",provs.length,"provs",filename);
        fs.writeFileSync(filename, JSON.stringify(provs, null, 4));
    }
    console.log("disconnecting");
    db.disconnect();
}

