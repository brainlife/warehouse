
const request = require('request');
const winston = require('winston');

const config = require('./config');
const logger = new winston.Logger(config.logger.winston);

exports.archive = function(task, dataset, authorization, subdir, cb) {
    if(!task.resource_id) {
        return cb('task '+task._id+' has no resource_id set');
    }

    //TODO should I error if task status is not finished?
    if(task.status != 'finished') logger.warn('task '+task._id+' status is not finished');

    //TODO pick the best storage based on project?
    var storage = config.storage_default();
    var system = config.storage_systems[storage];
    logger.debug("obtaining upload stream");
    system.upload(dataset, (err, writestream)=>{
        if(err) return cb(err);
        logger.debug("uploading");

        //download the entire .tar.gz from sca-wf service
        request.get({
            url: config.wf.api+"/resource/download",
            qs: {
                r: task.resource_id,
                p: task.instance_id+"/"+task._id+"/"+subdir,
            },
            headers: {
                //authorization: req.headers.authorization, 
                authorization,
            }
        })
        //and pipe it directly to the storage
        .on('response', function(r) {
            console.log("stream commencing");
            if(r.statusCode != 200) {
                cb("/resource/download failed "+r.statusCode);
            }
        }).pipe(writestream);
        writestream.on('finish', err=>{
            //really done
            //logger.debug("checking to see if this message happens after transfer ends"); 
            logger.info("done!");
            dataset.storage = storage;
            dataset.save(cb);
        });
    });
}

