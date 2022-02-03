
const common = require('../api/common');
const db = require('../api/models');
const config = require('../api/config');

it('initializing model', function(done) {
    db.init(err=>{
        done(err);
    })
});

describe('query project', ()=>{
    it('up', function(done) {
        this.timeout(5*1000);
        db.Projects.find({removed: false, openneuro: {$exists: true}}).then(res=>{
            console.dir(res);
            res.forEach(p=>{
                console.log(p._id, p.name, p.removed, p.openneuro);
            });
        });
    });
});

describe('cleanup', ()=>{
    it('close db', function(done) {
        db.disconnect();
        done();
    });
})
