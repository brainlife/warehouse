#!/usr/bin/env node

const fs = require('fs');
const config = require('../../api/config');
const db = require('../../api/models');
const common = require('../../api/common');
const async = require('async');


db.init(async err=>{
    if(err) throw err;
    const datatypes = await db.Datatypes.find({groupAnalysis: true}).lean()
    for await (const datatype of datatypes) {
        console.log("-----------------------------------------------------------------");
        console.log(datatype.name);
        console.log("-----------------------------------------------------------------");
        const datasets = await db.Datasets.find({datatype, status: "stored", removed: false}).lean()
        for await (const dataset of datasets) {
            console.log("> "+dataset._id);
            await common.updateSecondaryInventoryInfo(dataset._id);
            //next_dataset();
        }
    }
    db.disconnect();
});

