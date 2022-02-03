//const config = require('../../config');
//const db = require('../models');

const assert = require('assert');
const axios = require('axios');
const config = require('../api/config');
const fs = require('fs');

describe.skip('participant', async ()=>{

    const jwt = fs.readFileSync("/home/hayashis/.config/dev1.soichi.us/.jwt", "ascii").trim();

    it('patching', async done=>{
        let _res = await axios.put('http://localhost:'+config.express.port+'/participant/5f9b09d26ce09b45b9f97170', {
            subjects: [
                {
                    subject: "01",
                    colA: "a01",
                    colB: "b011",
                },
                {
                    subject: "02",
                    colA: "a01",
                    colB: "b011",
                }
            ],
            columns: {
                colA: "info",
                colB: "info",
            },
        }, {
            headers: {
                authorization: 'Bearer '+jwt,
            }
        });
        assert(_res.data.status == "success")

        console.log("patching participant");
        _res = await axios.patch('http://localhost:'+config.express.port+'/participant/5f9b09d26ce09b45b9f97170/03', {
            subject: "03",
            colA: "a03",
            colB: "b03",
        }, {
            headers: {
                authorization: 'Bearer '+jwt,
            }
        });
        assert(_res.data.status == "success")
    });
});

