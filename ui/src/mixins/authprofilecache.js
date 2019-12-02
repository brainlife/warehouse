
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        authprofilecache(sub, cb) {
            this._cache("auth.profile."+sub, ()=>{
                //console.log("loading auth profile for "+id);
                let where = JSON.stringify({sub});
                return this.$http.get(Vue.config.auth_api+'/profile/list?find='+where);
            }, (err, res)=>{
                if(err) return cb(err);
                cb(null, res.data.profiles[0]);
            });
        },  
    }
}


