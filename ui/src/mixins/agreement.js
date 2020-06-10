'use strict';

import Vue from 'vue'

export default {
    data: function() {
        return {
            user_agreements: {},
        }
    },

    created: function() {
        this.load_agreement();
        this.$root.$on("agreements.updated", (id, b)=>{
            Vue.set(this.user_agreements, id, b);
        });
    },

    methods: {
        load_agreement: async function() {
            let agreements = await this.get_user_agreements();
            for(let id in agreements) {
                //this.$nofity("Agreement updated"); //this.$notifhy is not available in mixin?
                Vue.set(this.user_agreements, id, agreements[id]);
            }
        },  

        get_user_agreements: function() {
            return new Promise((resolve, reject)=>{
                let agreements = {};

                //load from localstorage
                let ls = localStorage.getItem("agreements");
                if(ls) agreements = JSON.parse(ls);
                if(!Vue.config.jwt) return resolve(agreements);

                //load from profile service
                this.$http.get(Vue.config.auth_api+"/profile").then(res=>{
                    let user = res.data;
                    if(user.profile && user.profile.private && user.profile.private.agreements) resolve(user.profile.private.agreements);
                    else resolve({});
                }).catch(reject);
            });
        },
        
        check_agreements: async function(project, cb) {
            if(!project.agreements) return cb(); 
            let user_agreements = await this.get_user_agreements();
            let agreed = true;
            project.agreements.forEach(agreement=>{
                if(!user_agreements[agreement._id]) {
                    agreed = false;
                }
            });
            if(agreed) return cb();
            this.$root.$emit("agreements.open", {project, cb});
        }
    }
}


