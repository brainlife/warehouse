<template>
<div>
    <div v-for="agreement in agreements" class="agreement">
        <vue-markdown :source="agreement.agreement" class="readme"/>
        <b-form-checkbox :disabled="!config.user" @change="update_agreements(agreement._id)" v-model="user_agreements[agreement._id]">
            I Agree
            <small v-if="!config.user">(Please register/signin first to agree)</small>
        </b-form-checkbox>
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

    data() {
        return {
            config: Vue.config,
        }
    },

    methods: {

        update_agreements(id, evt) {
            if(!Vue.config.user) {
                alert('please signup/login first');
                return;
            }
            //somehow @change event gets fired before this.agreements is updated.. 
            this.$nextTick(function() {
                if(Vue.config.jwt) {
                    this.$http.patch(Vue.config.auth_api+"/profile", {profile: {
                        private: {
                            agreements: this.user_agreements
                        }
                    }});
                } else {
                    console.log("user doesn't have profile object.. maybe not logged in? storing agreements on local stoage");
                    localStorage.setItem("agreements", JSON.stringify(this.user_agreements));
                }

                //notify other agreement components to reload
                this.$root.$emit("agreements.updated", id, this.user_agreements[id]);

                //see if all agreed
                let agreed = true;
                this.agreements.forEach(agreement=>{
                    if(!this.user_agreements[agreement._id]) agreed = false;
                });
                if(agreed) this.$emit("agreed");
            });
        },
    }
}
</script>

<style scoped>
.agreement {
    background-color: #f0f0f0;
    padding: 5px;
    padding-left: 10px;
    margin-bottom: 10px;
    color: #666;
    border-left: 3px solid #aaa;
}
</style>
