import Vue from 'vue'

export default {
    /*
    created: function () {
    },
    */
    methods: {
        get_user_agreements: function() {
            let agreements = {};

            //load from localstorage
            let ls = localStorage.getItem("agreements");
            if(ls) agreements = JSON.parse(ls);

            //load from user profile
            if(Vue.config.profile && Vue.config.profile.agreements) {
                agreements = Vue.config.profile.agreements;
            }
            return agreements;
        },
        
        check_agreements: function(project, cb) {
            if(!project.agreements) return cb(); 
            let user_agreements = this.get_user_agreements();
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


