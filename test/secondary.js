//const config = require('../../config');
//const db = require('../models');

const assert = require('assert');
const axios = require('axios');
const config = require('../api/config');

describe.skip('secondary', async ()=>{
    it('list', async done=>{
        let _res = await axios.get('http://localhost:'+config.express.port+'/secondary/list/5f9b09d26ce09b45b9f97170');
        let objects = _res.data;
        let sample = objects[0];
        /*
        console.dir(_res.data);
        objects should be an array of something like..
    {
      path: '5fd3903ccafc082df6ddaf2d/5fd8f3750d4b105d2b903571/output2',
      task_id: '5fd8f3750d4b105d2b903571',
      app: {
      },
      finish_date: ...
      datatype: {
        admins: [ '1' ],
        _datatype_tags: [],
        uis: [ '5be75b31e15a02914a4be8f0' ],
        samples: [],
        groupAnalysis: true,
        _id: '5fd38da26a1bac29f0b82b72',
        name: 'neuro/test',
        desc: 'Test datatype',
        datatype_tags: [],
        files: [],
        validator: '',
        validator_branch: '',
        readme: 'This is only used as a test',
        create_date: '2020-12-11T15:17:54.356Z',
        __v: 0
      },
      output: {
        id: 'output2',
        datatype: '5fd38da26a1bac29f0b82b72',
        desc: 'Test App',
        meta: {
          subject: 'soichi',
          nifti_headers: [Object],
          Space: 'MNI152NLin6Asym'
        },
        tags: [],
        subdir: 'output2',
        datatype_tags: [ 'dtag1' ]
      }
    }
        */
        console.dir(sample);

        assert(objects.length > 10);
        assert(sample.path == '5fd3903ccafc082df6ddaf2d/5fd8f3750d4b105d2b903571/output2');
        assert(sample.task_id == '5fd8f3750d4b105d2b903571');
    });
})

