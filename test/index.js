
const assert = require('assert');
//const axios = require('axios');

describe.skip('/health', function() {
    it('should return ok', function() {
        request(app)
        .get('/health')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(function(err, res) {
            if (err) throw err;
            console.dir(res.body);
        });
    });
});

describe.skip('openneuro', function() {
    const openneuro = require('../api/openneuro');
    //this.timeout(4000);
    describe('list_datasets', function() {
        it('list', function(done) {
            openneuro.list_datasets((err, datasets, cursor)=>{
                assert(!err, err);
                console.log(JSON.stringify(datasets, null, 4));
                console.log(datasets.length, cursor);
                done();
            });
        });
    });
});

describe.skip('workflows', ()=>{
    const app = require('../api/app');
    it('list', done=>{
        app.enumerateWorkflows("58d15dece13a50849b258842", (err, workflows)=>{ //LiFE
            if(err) return done(err);
            console.log(JSON.stringify(workflows, null, 4));
            done();
        });
    });
});

describe('common', ()=>{

    const common = require('../api/common');
    const models = require('../api/models');
    it('get_next_app_doi', function(done) {
        models.init(err=>{
            done(err);
        })
    });
    it('get_next_app_doi', function(done) {
        this.timeout(5000);

        common.get_next_app_doi((err, doi)=>{
            if(err) return done(err);
            console.log(doi);
            done();
        });
    });
});
