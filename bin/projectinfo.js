#!/usr/bin/env node

const async = require('async');
const axios = require('axios');
const fs = require('fs');
const mongoose = require("mongoose");

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

db.init(function(err) {
    if(err) throw err;
    run();
});

function run() {
    db.Projects.find({}) //get all projects!
    .exec((err, projects)=>{
        if(err) throw err;
        async.eachSeries(projects, handle, err=>{
            if(err) {
                console.error(err);
                process.exit(1);
            }

            console.log("all done");
            db.disconnect();
        });
    });
}

async function handle(project) {
    if(!project.removed && project.xnat && project.xnat.enabled) await handleXNAT(project);

    //already ran it.. I don't think we need to keep running this.
    //await tidyup(project);

    await project.save();
}

//make sure groups for disabled project are deactivated
//api does this now so it shouldn't be necessary.. but for migration
async function tidyup(project) {
    if(!project.group_id) return; //hopefully only for dev..
    if(project.removed) {
        console.log("removed project.. making sure group is deactivated", project.group_id);
        //deactivate auth grouop
        const res = await axios.put(config.auth.api+"/group/"+project.group_id, {
            active: false,
        }, {
            headers: { authorization: "Bearer "+config.warehouse.jwt, }
        });
        console.log(res.status);
    }
}

async function handleXNAT(project) {
    console.log("handleXNAT --------------");

    const dago = new Date();
    dago.setDate(dago.getDate()-1);

    const auth = {
        username: project.xnat.token,
        password: project.xnat.secret,
    }

    if(project.tokenUpdated < dago) {
        console.log("refreshing access token", project.xnat.hostname);
        try {
            const res = await axios.get(project.xnat.hostname+"/data/services/tokens/issue", {auth});
            project.xnat.token = res.data.alias;
            project.xnat.secret = res.data.secret;
            project.tokenUpdated = new Date();
        } catch (err) {
            console.error(err);
            project.xnat.token = undefined;
            project.xnat.secret = undefined;
            projext.xnat.enabled = false;
        }
        project.markModified('xnat');
    }

    console.log("loading all experiments for this project");
    //const res = await axios.get(project.xnat.hostname+"/data/projects/"+project.xnat.project+"/experiments", {auth});
    //const experiments = res.data.ResultSet.Result;

    const objects = [];
    const res = await axios.get(project.xnat.hostname+"/data"+
        "/projects/"+project.xnat.project+
        "/subjects", {auth});
    const oSubjects = res.data.ResultSet.Result;
    for(const oSubject of oSubjects) {
        console.log("  subject", oSubject.URI);
        //console.dir(oSubject);
        /* oSubject
        {
          insert_date: '2020-09-15 17:01:51.751',
          project: 'PIPELINETEST',
          ID: 'XNAT19_S00012',
          label: 'S03',
          insert_user: 'tclo7153',
          URI: '/data/subjects/XNAT19_S00012'
        }
        */
        const exres = await axios.get(project.xnat.hostname+"/data"+
            "/projects/"+project.xnat.project+
            "/subjects/"+oSubject.ID+
            "/experiments", {auth});
        for(const oExperiment of exres.data.ResultSet.Result) {
            console.log("    experiement", oExperiment.ID);
            //console.log("  <experiment>");
            /* oExperiment
              {
                  date: '',
                  xsiType: 'xnat:mrSessionData',
                  'xnat:subjectassessordata/id': 'XNAT19_E00028',
                  insert_date: '2020-09-15 17:27:26.971',
                  project: 'PIPELINETEST',
                  ID: 'XNAT19_E00028',
                  label: 'S03_MR2',
                  URI: '/data/experiments/XNAT19_E00028'
              },
            */
            const scanres = await axios.get(project.xnat.hostname+oExperiment.URI+"/scans", {auth});
            for(const oScan of scanres.data.ResultSet.Result) {
                console.log("      scan", oScan.ID, oScan.type, oScan.series_description);
                /* oScan
                {
                  xsiType: 'xnat:mrScanData',
                  xnat_imagescandata_id: '755',
                  note: '',
                  series_description: '',
                  ID: '7',
                  type: 'GRE_FIELD_MAPPING',
                  URI: '/data/experiments/XNAT19_E00027/scans/7',
                  quality: ''
                }
                */

                const mapping = project.xnat.scans.find(scan=>scan.scan == oScan.type);
                if(mapping) {
                    objects.push({
                        meta: {
                            subject: oSubject.label, 
                            session: oExperiment.label,
                            xnat_subject: oSubject,
                            xnat_experiment: oExperiment,
                            xnat_scan: oScan,
                        },
                        datatype: mapping.datatype,
                        datatype_tags: mapping.datatype_tags,

                        desc: (oScan.note||oScan.series_description),
                        tags: [oScan.type], //has to exist for ui

                        storage: "xnat",
                        storage_config: {
                            /*
                            project: project.id, //xnat hostname/user/pass to use

                            subject: oSubject.label,
                            experiment: oExperiment.label,
                            scan: oScan.ID,
                            */
                            url: `${project.xnat.hostname}/data/projects/${project.xnat.project}/subjects/${oSubject.label}/experiments/${oExperiment.label}/scans/${oScan.ID}/resources/DICOM/files`,
                            auth, //is it too dangerous to do this? alternative is to lookup project.xnat everytime I need to access data
                        },
                        create_date: new Date(oExperiment.insert_date),
                        user_id: project.user_id, //using project creator's id (not always right?)
                        project: project.id,

                        removed: false,
                        status: "stored",
                    });
                }

                /*
                //TODO - what can I do with the resources? I think scan is all I need?
                const resourceres = await axios.get(project.xnat.hostname+oScan.URI, {params: {
                    format: "json" //somehow needed..
                }, auth});
                resourceres.data.items.forEach(item=>{
                    item.children.forEach(child=>{
                        console.log("        ", child.field, child.items.length);
                    });
                });
                */
                //console.log(JSON.stringify(resourceres.data.items, null, 4));
                /* resourceres.data.items
                [
                    {
                        "children": [
                            {
                                "field": "file",
                                "items": [
                                    {
                                        "children": [
                                            {
                                                "field": "tags/tag",
                                                "items": [
                                                    {
                                                        "children": [],
                                                        "meta": {
                                                            "create_event_id": 71968,
                                                            "xsi:type": "xnat:abstractResource_tag",
                                                            "isHistory": false,
                                                            "start_date": "Wed Sep 23 14:44:53 AEST 2020"
                                                        },
                                                        "data_fields": {
                                                            "xnat_abstractResource_tag_id": 6,
                                                            "tag": "BIDS"
                                                        }
                                                    }
                                                ]
                                            }
                                        ],
                                        "meta": {
                                            "create_event_id": 71968,
                                            "xsi:type": "xnat:resourceCatalog",
                                            "isHistory": false,
                                            "start_date": "Wed Sep 23 14:44:53 AEST 2020"
                                        },
                                        "data_fields": {
                                            "file_count": 1,
                                            "xnat_abstractresource_id": 1839,
                                            "format": "BIDS",
                                            "label": "BIDS",
                                            "URI": "/efs/data/xnat/archive/PIPELINETEST/arc001/S01_MR1/SCANS/9/BIDS/BIDS_catalog.xml",
                                            "file_size": 1569,
                                            "content": "BIDS",
                                            "xnat_abstractResource_id": 1839
                                        }
                                    },
                                    {
                                        "children": [],
                                        "meta": {
                                            "create_event_id": 59564,
                                            "xsi:type": "xnat:resourceCatalog",
                                            "isHistory": false,
                                            "start_date": "Tue Sep 15 16:14:57 AEST 2020"
                                        },
                                        "data_fields": {
                                            "file_count": 176,
                                            "xnat_abstractresource_id": 1736,
                                            "label": "DICOM",
                                            "URI": "/efs/data/xnat/archive/PIPELINETEST/arc001/S01_MR1/SCANS/9/DICOM/9_catalog.xml",
                                            "file_size": 34708682,
                                            "content": "RAW",
                                            "xnat_abstractResource_id": 1736
                                        }
                                    },
                                    {
                                        "children": [
                                            {
                                                "field": "tags/tag",
                                                "items": [
                                                    {
                                                        "children": [],
                                                        "meta": {
                                                            "create_event_id": 71967,
                                                            "xsi:type": "xnat:abstractResource_tag",
                                                            "isHistory": false,
                                                            "start_date": "Wed Sep 23 14:44:52 AEST 2020"
                                                        },
                                                        "data_fields": {
                                                            "xnat_abstractResource_tag_id": 5,
                                                            "tag": "BIDS"
                                                        }
                                                    }
                                                ]
                                            }
                                        ],
                                        "meta": {
                                            "create_event_id": 71967,
                                            "xsi:type": "xnat:resourceCatalog",
                                            "isHistory": false,
                                            "start_date": "Wed Sep 23 14:44:52 AEST 2020"
                                        },
                                        "data_fields": {
                                            "file_count": 1,
                                            "xnat_abstractresource_id": 1838,
                                            "format": "NIFTI",
                                            "label": "NIFTI",
                                            "URI": "/efs/data/xnat/archive/PIPELINETEST/arc001/S01_MR1/SCANS/9/NIFTI/NIFTI_catalog.xml",
                                            "file_size": 12385218,
                                            "content": "NIFTI_RAW",
                                            "xnat_abstractResource_id": 1838
                                        }
                                    },
                                    {
                                        "children": [],
                                        "meta": {
                                            "create_event_id": 72688,
                                            "xsi:type": "xnat:resourceCatalog",
                                            "isHistory": false,
                                            "start_date": "Tue Oct 06 14:08:26 AEDT 2020"
                                        },
                                        "data_fields": {
                                            "file_count": 176,
                                            "xnat_abstractresource_id": 1924,
                                            "label": "jpeg",
                                            "URI": "/efs/data/xnat/archive/PIPELINETEST/arc001/S01_MR1/SCANS/9/jpeg/9_catalog.xml",
                                            "file_size": 1603561,
                                            "xnat_abstractResource_id": 1924
                                        }
                                    }
                                ]
                            },
                            {
                                "field": "sharing/share",
                                "items": [
                                    {
                                        "children": [],
                                        "meta": {
                                            "create_event_id": 75059,
                                            "xsi:type": "xnat:imageScanData_share",
                                            "isHistory": false,
                                            "start_date": "Mon Nov 23 17:15:51 AEDT 2020"
                                        },
                                        "data_fields": {
                                            "project": "ShareTest",
                                            "label": "9",
                                            "xnat_imageScanData_share_id": 11
                                        }
                                    }
                                ]
                            }
                        ],
                        "meta": {
                            "create_event_id": 59386,
                            "xsi:type": "xnat:mrScanData",
                            "isHistory": false,
                            "start_date": "Tue Sep 15 16:13:33 AEST 2020"
                        },
                        "data_fields": {
                            "xnat_imagescandata_id": 737,
                            "project": "PIPELINETEST",
                            "ID": "9",
                            "image_session_ID": "XNAT19_E00023",
                            "type": "t1mpr_SAG_NSel_S176",
                            "xnat_imageScanData_id": 737
                        }
                    }
                ]
                */
            }
        }
    }

    console.log("----------  done enumerating objects");
    //console.log(JSON.stringify(objects, null, 4));
    for(let object of objects) {
        console.log(JSON.stringify(object, null, 4));
        let res = await db.Datasets.findOneAndUpdate({
            "storage": "xnat",
            "storage_config.url": object.storage_config.url,
        }, object, {new: true, upsert: true, rawResult: true});
        console.dir(res.lastErrorObject); 
    }

}

