
const assert = require('assert');
const common = require('../api/common');
const models = require('../api/models');

it('initializing model', function(done) {
    models.init(err=>{
        done(err);
    })
});

describe.skip('doi', ()=>{
    it.skip('get_next_app_doi', function(done) {
        this.timeout(5000);

        common.get_next_app_doi((err, doi)=>{
            if(err) return done(err);
            console.log(doi);
            done();
        });
    });
});

describe('update_project_stats', ()=>{
    it('normal', function(done) {
        this.timeout(5*1000);

        console.log("running common.update_projects_stats................................");
        let project = {
            _id: "5f9b09d26ce09b45b9f97170",
            group_id: 781,
        }
        common.update_project_stats(project, done);
    });
});

describe.skip('mag', ()=>{
    it('query mag', function(done) {
        this.timeout(5*1000);

        let project = {
            _id: "bogusbogus",
            name: "A dorso-ventral attention network in the human brain across different ROI-based parcellation",
            desc: "Quantitative properties of the connections linking three key attentional control nodes located in the frontal, parietal and temporal lobes and defined using different approaches strengthen the evidence for the existence of a dorso-ventral attention network.",
            markModified: ()=>{},
        }
        common.updateProjectMag(project, done);
    });
});

