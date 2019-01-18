const assert = require('assert');
//const request = require('supertest')

//const config = require('../api/config');
//const db = require('../api/models');
//const app = require('../api/server').app;

/*
before(function(done) {
    console.log("connecting to mongodb");
    this.timeout(10000);
    db.init(function(err) {
        if(err) return done(err);
        done();
    });
});
*/

describe.skip('/health', function() {
    it('should return ok', function() {
        request(app)
        .get('/health')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(function(err, res) {
            if (err) throw err;
            console.dir(res.body);
            //assert(res.body.status == "failed", "initial status should be failed");
            //done();
        });
    });
});


describe('openneuro', function() {
    const openneuro = require('../api/openneuro');
    //this.timeout(4000);
    describe('list_datasets', function() {
        it('list', function(done) {
            openneuro.list_datasets((err, datasets, cursor)=>{
                assert(!err, err);
                console.log(JSON.stringify(datasets, null, 4));
                console.log(datasets.length, cursor);
                //assert.equal(datasets.edges.length, 100);
                done();
            });
        });
    });
});
