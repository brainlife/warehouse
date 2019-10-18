
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        datatypecache(id, cb) {
            this._cache("datatype."+id, ()=>{
                console.log("loading datatype cache for "+id);
                return this.$http.get('datatype', {params: {
                    find: JSON.stringify({_id: id}),
                    //populate: 'inputs.datatype outputs.datatype',
                }});
            }, (err, res)=>{
                cb(null, res.data.datatypes[0]);
            });
        },  
    }
}


