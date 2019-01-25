
const assert = require('assert');

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

describe('openneuro', function() {
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
