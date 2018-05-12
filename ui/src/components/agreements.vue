<template>
<div>
    <div v-for="agreement in agreements" class="agreement">
        <vue-markdown :source="agreement.agreement"/>
        <b-form-checkbox @change="update_agreements" v-model="user_agreements[agreement._id]">I Agree</b-form-checkbox>
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
    data: function() {
        return {
            user_agreements: {},
        }
    },

    mounted: function() {
        this.load();
        this.$root.$on("agreements.updated", this.load);
    },

    methods: {
        load: function() {
            console.log("loading agreement ui");
            let agreements = this.get_user_agreements();
            for(let id in agreements) {
                Vue.set(this.user_agreements, id, agreements[id]);
            }
        },  

        update_agreements: function() {
            //somehow @change event gets fired before this.agreements is updated.. 
            this.$nextTick(function() {
                console.log("agreements changed - saving", this.user_agreements);
                if(Vue.config.profile) {
                    this.$http.put(Vue.config.profile_api+"/private", {agreements: this.user_agreements});
                    Vue.config.profile.agreements = this.user_agreements;
                } else {
                    console.log("user doesn't have profile object.. maybe not logged in? storing agreements on local stoage");
                    localStorage.setItem("agreements", JSON.stringify(this.user_agreements));
                }

                this.$root.$emit("agreements.updated");

                //see if all agreed
                let agreed = true;
                this.agreements.forEach(agreement=>{
                    console.log("checking", agreement);
                    if(!this.user_agreements[agreement._id]) agreed = false;
                });
                if(agreed) {
                    console.log("all agreed");
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
