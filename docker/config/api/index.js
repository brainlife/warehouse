'use strict';

const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const child_process = require('child_process');

const mkdirp = require('mkdirp'); //for dc2
const path = require('path');
const archiver = require('archiver');
const ssh2 = require('ssh2');
const axios = require('axios');
const request = require('request'); //deprecate!
const zlib = require('zlib');
const async = require('async');
const AWS = require('aws-sdk');

const {
    SERVICE_AUTHORITY, 
    AUTH_SERVICE_URL, 
    AMARETTI_SERVICE_URL,
    WAREHOUSE_SERVICE_URL,
    REDIS_URL, 
    RABBITMQ_URL, 
    MONGO_URL,
    SSH_AUTH_SOCK,
    GITHUB_TOKEN,
    SLACK_TOKEN,
    GOOGLE_MAPS_API_KEY,
} = process.env;
const [API_HOST, API_PORT] = SERVICE_AUTHORITY.split(':');

exports.mongodb = MONGO_URL;
exports.mongoose_debug = false;
exports.debug = true;

//used to post/poll health status from various services
exports.redis = {
    url: REDIS_URL,
};

exports.github = {
    access_token: GITHUB_TOKEN,
}

exports.geocode = {
    apiKey: GOOGLE_MAPS_API_KEY,
}


//admin+client scope oauth2 token used to invite users
//once you create oauth app, you will need to re-authorize it with admin+client (it gave with just admin scope)
//https://slack.com/oauth/authorize?&client_id=(your client id)&team=(teamId)&install_redirect=install-on-team&scope=admin+client
//more information can be found here https://github.com/outsideris/slack-invite-automation
if (SLACK_TOKEN) {
    exports.slack = {
        token: SLACK_TOKEN,
        newuser: SLACK_CHANNEL,
    }
}

exports.amaretti = {
    api: AMARETTI_SERVICE_URL,
}
exports.wf = exports.amaretti; //deprecated (use amaretti)

// exports.ipstack = {
//     token: fs.readFileSync(__dirname+"/ipstack.token", "ascii").trim(),
// }
// exports.mailchimp = {
//     api_key: fs.readFileSync(__dirname+"/mailchimp.key", "ascii").trim(),
//     newsletter_list: "8d07cef694", //list ID to subscribe newusers to
// }

exports.auth = {
    api: AUTH_SERVICE_URL,
}

exports.warehouse = {
    api: WAREHOUSE_SERVICE_URL,
    // @TODO what to do with dev setups?
    url: "https://localhost.brainlife.io", //to test datacite
    public_key: fs.readFileSync(__dirname + '/warehouse.pub'),
    private_key: fs.readFileSync(__dirname + '/warehouse.key'),
    rule_logdir: "/tmp",
    jwt: fs.readFileSync(__dirname + '/warehouse.jwt', 'ascii').trim(),
}

exports.mail = {
    from: "brainlife.io <brlife@iu.edu>",

    //node mailer config
    mailer: {
        // host: 'mail-relay.iu.edu', //max recipents per email: 30
        // secure: true, //port 465
        // auth: {
        //     user: 'brlife',
        //     pass: fs.readFileSync(__dirname+'/smtp.password', {encoding: 'ascii'}).trim(),
        // },
        // pool: true, //use connection pool
        // @TODO mail service
        host: 'http://localhost:1025'
    },
}

// @TODO graphite service
exports.metrics = {
    counts: {
        path: "/usr/local/graphite.24h/warehouse.counts",
        prefix: "dev.warehouse",
        interval: 3600 * 24,
    },
    health_counts: {
        path: "/usr/local/graphite.5min/warehouse.counts",
        prefix: "dev.warehouse",
        interval: 60 * 5,
    },

    service_prefix: "dev.amaretti.service",

    //graphite api (https://graphite-api.readthedocs.io/en/latest/api.html#the-metrics-api)
    //curl http://10.0.0.10/metrics/find?query=test.*
    //curl -o test.png http://10.0.0.10/render?target=prod.amaretti.service.*&height=800&width=600 
    //curl -o test.json "http://10.0.0.10/render?target=prod.amaretti.service.bcmcpher-app-networkmatrices&format=json&noNullPoints"
    // @TODO graphite service
    api: "http://10.0.0.10:2080",
}

/*
//for archive service
exports.archive = {
    //remporary path used to store downloaded datasets before shipping to hsi
    tmp: "/mnt/scratch/hayashis/archive-tmp",
}
*/

//for event handler
exports.event = {
    amqp: {
        url: RABBITMQ_URL,

        //collected by cron
        //docker exec rabbitmq rabbitmqctl list_queues --formatter=json -p brainlife > rabbitmq.queues.json
        queues: "/tmp/rabbitmq.queues.json",
    },
}

//for rule handler
exports.rule = {
    max_task_per_rule: 30, //limit number of concurrently running tasks submission
    nice: 10, //default nice value for stage/process tasks 
}


exports.express = {
    host: API_HOST, port: API_PORT,

    //public key used to validate jwt token
    pubkey: fs.readFileSync('/apps/auth/api/config/auth.pub'),
}

// exports.datacite = {
//     prefix: "10.0322/bldev.",  //test account
//     username: "DATACITE.BL",
//     password: fs.readFileSync(__dirname+'/datacite.password', {encoding: "ascii"}).trim(),
//     api: "https://mds.test.datacite.org",
// }

//https://msr-apis.portal.azure-api.net/developer
// exports.mag = {
//     subscriptionKey: fs.readFileSync(__dirname+'/mag.key', {encoding: "ascii"}).trim(),
// }

///////////////////////////////////////////////////////////////////////////////////////////////////
//
//  storage system where we can archive data
exports.storage_systems = {};

exports.archive = {
    //storage_default: "wrangler",  
    //storage_default: "osiris",  
    storage_default: "osn",
    storage_config: {
        //resource_id: "59ea931df82bb308c0197c3d", //"Archiver" (set to "Stager" on production!)
    },
    gid: 42, //warehouse group enabled to access storage service
}

// exports.geocode = {
//     apikey: fs.readFileSync(__dirname+'/geocode.key', {encoding: 'ascii'}).trim(),
// }

//group analysis 
exports.groupanalysis = {
    gid: 3, //group id that allows access to ga resource

    // @TODO what to do with dev setups?
    secondaryDir: "/user/shayashi/brainlife/dev-secondary",
    getSecondaryDownloadStream(path, cb) {
        connect_osiris((err, conn, sftp) => {
            if (err) return cb(err);

            //make sure file exists
            sftp.stat(path, (err, stats) => {
                if (err) {
                    conn.end();
                    return cb(err);
                }

                //now stream!
                let stream = sftp.createReadStream(path);
                stream.on('error', err => {
                    console.error(err);
                });
                stream.on('close', code => {
                    console.log("stream closed.. ending connection", code);
                    conn.end();
                });

                cb(null, stream);
            });
        });
    },

    getSecondaryUploadStream(_path, cb) {
        connect_osiris((err, conn, sftp) => {
            if (err) return cb(err);

            //make sure the parent directory exists before writing to it
            conn.exec("mkdir -p " + path.dirname(_path), (err, stream) => {
                if (err) return cb(err);
                stream.on('error', err => {
                    console.error(err);
                });
                stream.on('close', code => {
                    if (code != 0) cb("failed to prepare parent directory")

                    //now create write stream
                    let sftp_stream = sftp.createWriteStream(_path);
                    sftp_stream.on('close', code => {
                        conn.end();
                    });
                    cb(null, sftp_stream);
                });
                stream.on('data', data => {
                    console.log(data.toString());
                });

                //I believe listening to stream is required for close event to fire..?
                stream.stderr.on('data', data => {
                    console.error(data.toString());
                });
            })
        });
    },
}

// @TODO dev setup for accessing another service container
function connect_local(cb) {
    var conn = new ssh2.Client();
    conn.on('ready', () => {
        cb(null, conn);
    });
    conn.on('error', err => {
        cb(err);
    });
    try {
        console.log("connecting to local");
        conn.connect({
            // @TODO parametrize this
            username: "db",
            host: "129.114.17.179",
            privateKey: fs.readFileSync('/home/ubuntu/.ssh/id_rsa'),
        });
    } catch (err) {
        cb(err);
    }
}

exports.storage_systems.project = {
    need_backup: true, //need_backup if it's our storage (not openneuro)
    test: cb => {
        console.log("project/test - todo");
        cb();
    },

    stat: (dataset, cb) => {
        cb();
    },

    download: (dataset, cb) => {
        let resource_id = dataset.storage_config.resource_id;
        let path = dataset.project + "/" + dataset._id + ".tar";
        axios({
            method: 'get',
            url: exports.amaretti.api + "/resource/archive/download/" + resource_id + "/" + path,
            responseType: 'stream',
            headers: { Authorization: "Bearer " + exports.warehouse.jwt }
        }).then(res => {
            cb(null, res.data, dataset._id + ".tar");
        });
    },

    /*
    remove: (dataset, cb)=>{
        console.log("project/remove - todo");
    }
    */
}

function get_copysource_dataset(dataset) {
    return Object.assign({}, dataset, {
        project: dataset.storage_config.project,
        storage: dataset.storage_config.storage,
        storage_config: dataset.storage_config.storage_config,
        _id: dataset.storage_config.dataset_id,
    });
}
exports.storage_systems.copy = {
    need_backup: true,
    test: cb => {
        cb();
    },

    stat: (dataset, cb) => {
        let source_dataset = get_copysource_dataset(dataset);
        let system = exports.storage_systems[source_dataset.storage];
        system.stat(source_dataset, cb);
    },

    //TODO - with app-archive in place, I don't think we use this anymore
    upload: (dataset, cb) => {
        cb("can't upload to copy target");
    },

    download: (dataset, cb) => {
        let source_dataset = get_copysource_dataset(dataset);
        let system = exports.storage_systems[source_dataset.storage];
        system.download(source_dataset, (err, stream, filename) => {

            //use the original dataset id as filename (but keep the .tar vs .tar.gz intact)
            let copy_filename = filename.split(".");
            copy_filename[0] = dataset._id;
            cb(err, stream, copy_filename.join("."));
        });
    },
}

exports.storage_systems.local = {
    need_backup: false,
    test: cb => {
        //TODO - I should do more checking?
        connect_local((err, conn) => {
            if (err) return cb(err);
            conn.end();
            cb();
        });
    },
    stat: (dataset, cb) => {
        //TODO..
        cb();
    },
    upload: (dataset, cb) => {
        cb("no upload to dc2");
    },
    download: (dataset, cb) => {
        connect_local((err, conn) => {
            if (err) return cb(err);
            conn.sftp((err, sftp) => {
                if (err) {
                    conn.end();
                    return cb(err);
                }
                var path = "/mnt/scratch/archive/" + dataset.project + "/" + dataset._id + ".tar";
                var stream = sftp.createReadStream(path);
                stream.on('error', err => {
                    console.error("stream failed but train has already left the station", err);
                });
                stream.on('close', code => {
                    conn.end();
                });
                cb(null, stream, dataset._id + ".tar.gz");
            });
        });
    },
}

exports.storage_systems.url = {
    need_backup: false,
    test: cb => {
        //TODO - maybe check to see if we have outbound connection?
        cb();
    },

    stat: (dataset, cb) => {
        //no stats as .tar will be generated on the fly
        cb(null);
    },

    upload: (dataset, cb) => {
        cb("read only");
    },

    download: (dataset, cb) => {
        let archive = archiver('tar');
        let gzip = zlib.createGzip();
        dataset.storage_config.files.forEach(file => {
            let stream = request(file.url);
            if (file.url.endsWith(".nii")) {
                //compress .nii with .nii.gz as *all* brainlife datatype uses .nii.gz for nifti
                console.log("passing", file.url, "through gzip stream");
                //archive.append(stream.pipe(gzip), {name: file.local});
                stream = stream.pipe(gzip);
            }
            archive.append(stream, { name: file.local });
        });
        archive.finalize();
        cb(null, archive, dataset._id + ".tar");
    },
}

async function walk(dir) {
    let files = await fs.promises.readdir(dir);
    files = await Promise.all(files.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) return walk(filePath);
        else if (stats.isFile()) return filePath;
    }));
    return files.reduce((all, folderContents) => all.concat(folderContents), []);
}

const datalad_root = "/mnt/datalad";
exports.storage_systems.datalad = {
    need_backup: false,
    test: cb => {
        //TODO??
        cb();
    },

    stat: (dataset, cb) => {
        //no stats as .tar will be generated on the fly
        cb(null);
    },

    upload: (dataset, cb) => {
        cb("read only");
    },

    download: (dataset, cb) => {
        connect_wrangler((err, conn, sftp) => {
            if (err) {
                conn.end();
                return cb(err);
            }

            //do datalad get first
            async.each(dataset.storage_config.files, (file, next_file) => {
                //move first dir path to cwd so datalad will find the dataset
                let cwd = datalad_root;
                let src_tokens = file.src.split("/")
                for (let i = 0; i < 2; ++i) {
                    cwd += "/" + src_tokens.shift();
                }
                let src_sub = src_tokens.join("/");

                console.debug("datalad get " + file.src);
                conn.exec("cd " + cwd + " && datalad get " + src_sub, (err, stream) => {
                    if (err) return next_file(err);
                    stream.on('error', err => {
                        console.error(err);
                    });
                    stream.on('close', code => {
                        console.debug("done with " + file.src);
                        next_file();
                    });
                    stream.on('data', data => {
                        console.debug(data.toString());
                    });
                    //I believe listening to stream is required for close event to fire..?
                    stream.stderr.on('data', data => {
                        console.error(data.toString());
                    });
                });
            }, err => {
                if (err) {
                    conn.end();
                    return cb(err);
                }

                console.debug("creating tar ball");

                let archive = archiver('tar');
                let gzip = zlib.createGzip();
                archive.on('end', () => {
                    console.log("archive ended.. conn.end()");
                    conn.end();
                });
                async.forEach(dataset.storage_config.files, (file, next_file) => {
                    let source_path = datalad_root + "/" + file.src;
                    sftp.stat(source_path, (err, stat) => {
                        if (err) {
                            conn.end();
                            return cb(err);
                        }
                        if (stat.isDirectory()) {
                            //I need to deference symbolic link as archiver won't deference symlinks
                            walk(source_path).then(entries => {
                                entries.forEach(entry => {
                                    let subpath = entry.substring(source_path.length);
                                    console.log(entry, file.dest + subpath);
                                    archive.append(sftp.createReadStream(entry), { name: file.dest + subpath });
                                });
                                next_file();
                            });
                            //archive.directory(source_path, file.dest);
                        } else {
                            let stream = sftp.createReadStream(source_path);
                            if (file.src.endsWith(".nii")) {
                                //compress .nii with .nii.gz as *all* brainlife datatype uses .nii.gz for nifti
                                console.log("passing", file.src, "through gzip stream");
                                stream = stream.pipe(gzip);
                            }
                            archive.append(stream, { name: file.dest });
                            next_file();
                        }
                    });
                }, err => {
                    archive.finalize();
                    cb(err, archive, dataset._id + ".tar");
                });

            });

        });
    },
}

exports.storage_systems.xnat = {
    need_backup: false,
    test: cb => {
        console.log("xnat storage test - todo");
        cb();
    },

    stat: (dataset, cb) => {
        cb();
    },

    upload: (dataset, cb) => {
        cb("TODO..");
    },

    download: (dataset, cb) => {
        let url = dataset.storage_config.url;
        /*
        let path = dataset.project+"/"+dataset._id+".tar";
        let stream = request.get({
            url: exports.amaretti.api+"/resource/archive/download/"+resource_id+"/"+path, 
            headers: {Authorization: "Bearer "+ exports.warehouse.jwt}
        });
        */
        axios({
            method: 'get',
            responseType: 'stream',
            url: dataset.storage_config.url,
            auth: dataset.storage_config.auth,
            params: {
                format: "zip", //zstd?
            },
        }).then(res => {
            cb(null, res.data, dataset._id + ".DICOM.zip");
        });
    },
}

//config used to backup data from warehouse 
exports.sda = {
    ssh: {
        host: "sftp.sdarchive.iu.edu",
        username: "brlife",
        agent: SSH_AUTH_SOCK,
    },
    basedir: "test",
}

exports.logger = {
    winston: {
        level: 'debug',
        format: combine(
            label({ label: 'warehouse-dev' }),
            timestamp(),
            format.colorize(),
            format.splat(),
            format.printf(info => {
                return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
            }),
        ),

        //hide headers which may contain jwt
        requestWhitelist: ['url', 'method', 'httpVersion', 'originalUrl', 'query'],
        exceptionHandlers: [
            new transports.Console(),
        ],
        transports: [
            //display all logs to console
            new transports.Console({
                stderrLevels: ["error"], //error is sent to stdout by default..
            }),
        ]
    },
}

