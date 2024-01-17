<template>
<div>
    <b-form @submit="submit_profile">
        <b-row>
            <b-col cols="3">
                <span class="form-header">SMS address</span>
            </b-col>
            <b-col cols="7">
                <b-form-input v-model.trim="profile.private.notification.smsAddress"/>
                <p style="opacity: 0.8;font-size: 90%; padding: 10px 0;">
                    We send SMS messages through this email2SMS gateway. 
                    For example, for AT&T, please use address such as <i>1234560000@mms.att.net</i>. 
                    For other carriers, please refer to the <a href="https://en.wikipedia.org/wiki/SMS_gateway" target="gateway">SMS Gateway for major carriers.</a>
                </p>
            </b-col>
        </b-row>

        <h5>Notification Events</h5>
        <b-row>
            <b-col cols="3">
                <span class="form-header">New Comments</span>
            </b-col>
            <b-col cols="7">
                <b-form-checkbox v-model="profile.private.notifyCommentEmail">
                    Send email when new comments are posted to project that I am a member, or I follow.
                </b-form-checkbox>
            </b-col>
        </b-row>
        <br>
        <br>
        <br>
        
        <h5>Sounds</h5>
        <b-row>
            <b-col cols="3">
                <span class="form-header">Job Status Change</span>
            </b-col>
            <b-col cols="7">
                <!--
                <b-form-checkbox name="aup" v-model="profile.private.notification.newsletter_general">
                    Receive brainlife.io general newsletters (about once a month).
                </b-form-checkbox>    
                -->
                <b-form-select v-model="profile.private.notification.process_sound" :options="[
                    {value: null, text: 'No Sound'}, 
                    {value: 'subtle', text: 'Subtle Sound'},
                    {value: 'normal', text: 'Normal Sound'},
                ]"></b-form-select>
                <small>Sound to play when job status changes</small>
                <div v-if="profile.private.notification.process_sound" style="padding: 5px 0">
                    <span class="form-header">Try Sounds</span>
                    <b-button-group size="sm">
                        <b-button v-for="status in ['running', 'finished', 'failed']" :key="status" 
                            variant="light" @click="$root.playNotification(status, profile.private.notification.process_sound)"> 
                            <statustag :status="status"/> 
                        </b-button>
                    </b-button-group>
                </div>
            </b-col>
        </b-row>

        <br>
        <br>
        <br>
        <br>
        <div class="page-footer">
            <b-container>
                <b-button type="submit" variant="primary">Update</b-button>
            </b-container>
        </div>
    </b-form>
</div>
</template>

<script>

import Vue from 'vue'
import statustag from '@/components/statustag'

const lib = require('@/lib'); //for deepmerge

export default {
    components: { 
        statustag,
    },

    data () {
        return {

            experience_options: [
                { text: 'No Experience', value: 0 },
                { text: 'Less than a year', value: 1 },
                { text: '2-3 years', value: 2 },
                { text: '3-10 years', value: 3 },
                { text: '>10 years', value: 4 },
            ],

            fullname: "",
            profile: {
                public: {
                    institution: "",
                    position: "",
                    bio: "",
                    //institution map coordinate
                    showOnMap: false,
                    lat: "",
                    lng: "",
                },
                private: {
                    aup: false,
                    /*
                    neuroimaging_experience: null,
                    study_experience: null,
                    programming_experience: null, 
                    computing_experience: null, 
                    */
                    notification: {
                       //newsletter_general: false,
                        process_sound: null
                    }
                }
            },

            config: Vue.config,
        }
    },

    mounted() {
        this.$http.get(Vue.config.auth_api+"/profile").then(res=>{
            this.fullname = res.data.fullname;
            lib.mergeDeep(this.profile, res.data.profile);
        });
    },

    methods: {
        submit_profile(e) {
            e.preventDefault()
            this.$http.patch(Vue.config.auth_api+"/profile", {
                //fullname: this.fullname,
                profile: this.profile, 
            }).then(res=>{
                Vue.config.profile = this.profile;
                this.$notify("Successfully updated profile");
                //this.$router.push("/projects"); 
            }).catch(err=>{
                console.error(err.response);
                this.$notify({type: "error", text: err.response.data.message});
            });            
        },
    },
}

</script>
<style scoped>

</style>
