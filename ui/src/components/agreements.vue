<template>
<div>
    <div v-for="agreement in agreements" class="agreement">
        <vue-markdown :source="agreement.agreement"/>
        <b-form-checkbox @change="update_agreements(agreement._id)" v-model="user_agreements[agreement._id]">I Agree</b-form-checkbox>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import VueMarkdown from 'vue-markdown'
import agreementMixin from '@/mixins/agreement'

export default {
    mixins: [agreementMixin],
    components: { 
        VueMarkdown,
    },
    props: [ 'agreements' ],

    methods: {

        update_agreements: function(id) {
            //somehow @change event gets fired before this.agreements is updated.. 
            this.$nextTick(function() {
                //console.log("agreements changed - saving", this.user_agreements);
                if(Vue.config.jwt) {
                    this.$http.put(Vue.config.profile_api+"/private", {agreements: this.user_agreements});
                    //Vue.config.profile.agreements = this.user_agreements;
                } else {
                    console.log("user doesn't have profile object.. maybe not logged in? storing agreements on local stoage");
                    localStorage.setItem("agreements", JSON.stringify(this.user_agreements));
                }

                //notify other agreement components to reload
                this.$root.$emit("agreements.updated", id, this.user_agreements[id]);

                //see if all agreed
                let agreed = true;
                this.agreements.forEach(agreement=>{
                    //console.log("checking", agreement);
                    if(!this.user_agreements[agreement._id]) agreed = false;
                });
                if(agreed) {
                    //console.log("all agreed");
                    this.$emit("agreed");
                }
            });
        },
    }
}
</script>

<style scoped>
.agreement {
border: 1px solid #eee;
padding: 10px;
margin-bottom: 10px;
color: #666;
}
</style>
