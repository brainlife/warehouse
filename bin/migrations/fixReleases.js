#!/usr/bin/env node

const config = require('../../api/config');
const db = require('../../api/models');
const common = require('../../api/common');
const async = require('async');

db.init(async err=>{
    if(err) throw err;
    //const pubs = await db.Publications.find({_id: "60874c62653f0c15fdd8234c"});
    const pubs = await db.Publications.find({})
    async.eachSeries(pubs, (pub, next_pub)=>{
        console.log("processing pub", pub.name);
        async.eachSeries(pub.releases, (release, next_release)=>{
            console.log("-- release", release.name);

            if(!release.gaarchives) release.gaarchives = []; //find that's is empty
            if(!release.sets) release.sets = [];
            //release.desc?

            async.series([
                next=>{
                    //list data sets published for this release
                    db.Datasets.aggregate()
                    .match({publications: release._id})
                    .group({
                        _id: { 
                            datatype: "$datatype", 
                            datatype_tags: "$datatype_tags", 
                            //service: "$prov.task.service",
                            //service_branch: "$prov.task.service_branch"
                        },
                        count: {$sum: 1},
                        size: {$sum: "$size"},
                    })
                    .project({
                        datatype_tags: "$_id.datatype_tags",
                        count: "$count",
                        size: "$size",
                    })
                    .lookup({
                        from: "datatypes",
                        localField: "_id.datatype",
                        foreignField: "_id",
                        as: "datatype",
                    })
                    .exec((err, recs)=>{
                        if(err) return next(err);
                        release.sets = recs.map(rec=>{
                            const dt = rec.datatype[0];//somehow we get an array of 1
                            //overwrite with what we need
                            return {
                                datatype: {
                                    _id: dt._id,
                                    name: dt.name,
                                    desc: dt.desc,
                                    groupAnalysis: dt.groupAnalysis,
                                },
                                datatype_tags: rec.datatype_tags,
                                tags: [], //rec.tags,
                                subjects: [], //rec.subjects,
                                size: rec.size,
                                count: rec.count,
                            }
                         });
                        next();
                    });
                },

                next=>{
                    //list apps used to produce this release
                    common.aggregateDatasetsByApps({
                        publications: release._id,
                    }).then(apps=>{
                        release.apps = apps;
                        next();
                    });
                },

                next=>{
                    //count number of subjects for this release (TODO - and sessions?)
                    db.Datasets.find({publications: release._id}).distinct('meta.subject').exec((err, subjects)=>{
                        if(err) return next(err);
                        release.subjects = subjects.length;
                        next();
                    });
                },

                next=>{
                    //count number of subjects for this release (TODO - and sessions?)
                    db.Datasets.find({publications: release._id}).distinct('meta.session').exec((err, sessions)=>{
                        if(err) return next(err);
                        console.log("number of sessions", sessions.length);
                        release.sessions = sessions.length;
                        next();
                    });
                },
            ], err=>{
                console.log(JSON.stringify(release, null, 4));
                next_release(err);
            });

        }, err=>{
            if(err) return next_pub(err);
            console.log("updating releases");
            pub.markModified('releases');
            pub.save(next_pub);
        });
    }, err=>{
        if(err) throw err;
        db.disconnect();
        console.log("all done");
    });
});

