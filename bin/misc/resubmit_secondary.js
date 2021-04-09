#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const config = require('../../api/config');
const db = require('../../api/models');
const axios = require('axios');
const common = require('../../api/common');

const project_id = "5f9b09d26ce09b45b9f97170";
const datatype_ids = ["604976b3ebfe45c4633ae3d2"];
const sub = "1";

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

db.init(async (err)=>{
    if(err) throw err;

    let project = await db.Projects.findById(project_id);

    let jwt = await common.issue_archiver_jwt(sub);

    console.log("create instance used to stage data");
    const res = await axios({
        method: "post",
        url: config.amaretti.api+"/instance",
        data: {
            name: "for secondary archive",
            group_id: project.group_id,
        },
        headers: {
            authorization: "Bearer "+jwt, //config.warehouse.jwt,
        }
    });
    const instance = res.data;
    console.log("using instance");
    console.dir(instance);

    console.log("submitting staging request");
    db.Datasets.find({project: project_id, datatype: {$in: datatype_ids}}).exec((err, objects)=>{
        if(err) throw err;
        let tid = 1;
        asyncForEach(objects, async obj=>{
            console.log("submitting staging for", obj._id);

            const data = {

                name : "Stage from archive",
                service : "brainlife/app-stage",
                instance_id : instance._id,
                max_runtime: 1000*3600, //1 hour should be enough?

                config: {
                    forceSecondary: true, //this let event_handler to submit secondary archiver after staging is done

                    datasets: [
                        {
                            id: obj._id,
                            project: obj.project,
                            storage: obj.storage,
                            storage_config: obj.storage_config,
                        },
                    ],

                    _tid: tid++,

                    _outputs: [
                        {
                            id: obj._id,
                            datatype: obj.datatype,
                            datatype_tags: obj.datatype_tags,
                            meta: obj.meta,
                            tags: obj.tags,

                            subdir: obj._id,

                            dataset_id: obj._id,
                            project: obj.project,
                        }
                    ]
                }
            };
            console.dir(data);

            //submit!
            const postres = await axios({
                method: "post",
                url: config.amaretti.api+"/task",
                data,
                headers: {
                    authorization: "Bearer "+jwt, //config.warehouse.jwt,
                }
            });
            console.dir(postres);
        });

        console.log("all done");
    });
});


