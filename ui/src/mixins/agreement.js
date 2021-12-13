'use strict';

import Vue from 'vue'

export default {
    data() {
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
        async load_agreement() {
            let agreements = await this.get_user_agreements();
            for(let id in agreements) {
                Vue.set(this.user_agreements, id, agreements[id]);
            }
        },

        get_user_agreements() {
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

        isAllAgreed(project) {
            if(!project.agreements) true; //no agreements to agree to
            return project.agreements.map(a=>this.user_agreements[a._id]).every(a=>a);
        },

        //TODO - bad function name (it should be something like "openAgreementModalIfNotAgreed"
        async check_agreements(project, cb) {
            await this.load_agreement();
            if(this.isAllAgreed(project)) return cb();
            //if not agreed.. open dialog
            this.$root.$emit("agreements.open", {project, cb});
        }
    }
}


