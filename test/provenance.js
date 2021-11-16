
const assert = require('assert');
const common = require('../api/common');
const db = require('../api/models');
const config = require('../api/config');
const axios = require('axios');
const provenance = require('../api/lib/provenance');

it('initializing model', function(done) {
    db.init(err=>{
        done(err);
    })
});

describe('query provenance', ()=>{
    it('up', function(done) {
        this.timeout(5*1000);
        /*
        let task = {
            //archive task for http://localhost:8080/project/5fda367856422f36d2f97a51/dataset/60876cc31b7a2f3d616ce627
            _id: "60876cc37f09362173e4095a",
            deps_config: [{
            }],
        }
        */
        /*
        axios.get(config.amaretti.api+'/task', {params: {
            find: JSON.stringify({_id: "60876cc37f09362173e4095a"})},
            headers: { authorization: "Bearer "+config.warehouse.jwt },
        }).then(res=>{
            provenance.traverseProvenance(res.data.tasks[0]).then(res=>{
                console.dir(res);
                done();
            });
        });
        */
        //provenance.traverseProvenance("60876cc37f09362173e4095a").then(res=>{
        //provenance.traverseProvenance("5fda612b0d4b105d2b903a67").then(res=>{
        provenance.traverseProvenance("5e11482245eeec5574f847d5").then(res=>{
            provenance.setupShortcuts(res);
            //console.log(JSON.stringify(res.nodes, null, 4));
            //console.dir(res.edges);
            done();
        });
    });

    let sample;
    it.skip('find terminal', function(done) {
        this.timeout(10*1000);
        //http://localhost:8080/app/5a9568777f1aef3091b13f13 (tract analysis profile) - 0 sample..
        //http://localhost:8080/app/5e18caba6db0cc04b44c60d5 (fmriprep)
        //5e88c72d952fefe0a07abfb6 (generate images of t1)
        // 5927293d7400b6be913e676e round bvecs
        //5dc36c242f23fd1368387879 wmaseg
        provenance.sampleTerminalTasks("5dc36c242f23fd1368387879").then(provs=>{
            //console.dir(provs);
            sample = provs[0];
            provs.map(provenance.setupShortcuts);
            const clusters = provenance.cluster(provs);
            console.dir(clusters);
            done();
        }); 
    });


    it.skip('simplify', function(done) {
        provenance.setupShortcuts(sample);
        console.log(JSON.stringify(sample, null, 4));
        done();
    });
});

describe('cleanup', ()=>{
    it('close db', function(done) {
        db.disconnect();
        done();
    });
})
