'use strict';

import Vue from 'vue'

export default {
    /*
    created: function () {
    },
    */
    data: function() {
        return {
            user_agreements: {},
        }
    },
    created: function() {
        console.log("mixin/agreement created");
        this.load();
        this.$root.$on("agreements.updated", (id, b)=>{
            Vue.set(this.user_agreements, id, b);
        });
    },

    methods: {
        load: async function() {
            console.log("loading agreement ui");
            let agreements = await this.get_user_agreements();
            for(let id in agreements) {
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
                console.log("loading private profile");
                this.$http.get(Vue.config.profile_api+"/private").then(res=>{
                    resolve(res.body.agreements);
                }).catch(reject);
            });
        },
        
        check_agreements: async function(project, cb) {
            if(!project.agreements) return cb(); 
            let user_agreements = await this.get_user_agreements();
            console.log("analyzig user_agreement", user_agreements);
            let agreed = true;
            project.agreements.forEach(agreement=>{
                if(!user_agreements[agreement._id]) {
                    console.log(agreement._id, "not agreed");
                    agreed = false;
                }
            });
            if(agreed) return cb();
            console.log("need to agree...");
            this.$root.$emit("agreements.open", {project, cb});
        }
    }
}


