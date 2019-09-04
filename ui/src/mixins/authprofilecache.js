
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        authprofilecache(id, cb) {
            this._cache("auth.profile."+id, ()=>{
                console.log("loading auth profile for "+id);
                let where = JSON.stringify({sub: id});
                return this.$http.get(Vue.config.auth_api+'/profile?where='+where);
            }, (err, res)=>{
                cb(null, res.data.profiles[0]);
            });
        },  
    }
}


