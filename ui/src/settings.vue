<template>
<div>
    <sidemenu active="/settings"></sidemenu>
    <div class="page-content">
        <div class="header">
            <b-container>
                <h2>Settings</h2>
                <b-tabs class="brainlife-tab" v-model="tab">
                    <b-tab title="Profile"/>
                    <b-tab title="Avatar"/>
                    <b-tab title="Account"/>
                    <!--<b-tab title="Notifications"/>-->
                </b-tabs>
            </b-container>
        </div><!--header-->

        <!--main content-->
        <b-container>
            <!--profile-->
            <div v-if="tab == 0">
                <b-form @submit="submit_profile">
                    <p>
                        <span class="form-header">Full Name</span>
                        <b-form-input v-model="fullname" placeholder="Which campus / research center are you member of?" required/>
                    </p>
                    <p>
                        <span class="form-header">Institution</span>
                        <b-form-input v-model="profile.public.institution" placeholder="Which campus / research center are you member of?" required/>
                    </p>

                    <p>
                        <span class="form-header">Position</span>
                        <b-form-input v-model="profile.public.position" placeholder="What is your role at your institution?" required/>
                    </p>

                    <p>
                        <span class="form-header">Biography</span>
                        <b-form-textarea v-model="profile.public.bio" rows="3" placeholder="Please enter a brief introduction about yourself and your research that you'd like to share with other members of brainlife." required/>
                    </p>

                    <p>
                        <b-form-checkbox v-model="profile.private.aup">
                            Agree to Brainlife <a href="/docs/aup" target="_blank">Acceptable Use Policy</a><br>
                            <br>
                            Brainlife.io is a NSF funded project and supported by Indiana University. 
                            We are obliged to collect basic user profile information for annual reporting and to implement features that are useful for our users.
                            Please see our <a href="/docs/privacy" target="_blank">Privacy Policy</a> to understand what other information are collected and how it is used.
                            <br>
                         </b-form-checkbox>
                    </p>

                    <div class="page-footer">
                        <b-button type="submit" variant="primary">Update</b-button>
                    </div>
                </b-form>
                <b-card v-if="config.debug"><pre>{{fullname}} {{profile}}</pre></b-card>
            </div>

            <!--avatar-->
            <div v-if="tab == 1">
                <b-img thumbnail :src="avatar_url(config.user.profile, 100)" style="float: right; margin-right: 20px;"/>
                <p>
                    <br>
                    <br>
                    Your avatar is handled by <a href="https://gravatar.com">gravatar.com</a> using your account email address 
                    <span style="opacity: 0.8;">({{config.user.profile.email}})</span>.
                </p>
                <div style="opacity: 0.8; border-top: 1px solid #ddd; clear: both; margin-top: 100px; padding-top: 20px;">
                    <h5>What is Gravatar?</h5>
                    <p>
                        <a href="https://en.gravatar.com/support/what-is-gravatar/">https://en.gravatar.com/support/what-is-gravatar/</a>
                    </p>
                    <blockquote>
                        An "avatar" is an image that represents you online—a little picture that appears next to your name when you interact with websites.
                    </blockquote>
                    <blockquote>
                        A Gravatar is a Globally Recognized Avatar. You upload it and create your profile just once, and then when you participate in any Gravatar-enabled site, your Gravatar image will automatically follow you there.
                    </blockquote>
                    <blockquote>
                        Gravatar is a free service for site owners, developers, and users. It is automatically included in every WordPress.com account and is run and supported by Automattic.
                    </blockquote>
                </div>
            </div>

            <!--account-->
            <div v-if="tab == 2">
                Please visit the legacy <a href="/auth/#!/settings/account" target="_blank">Account Settings</a> page.
            </div>
        </b-container>
        <br>
        <br>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import sidemenu from '@/components/sidemenu'

const lib = require('@/lib'); //for avatar_url

export default {
    components: { 
        pageheader, sidemenu,
    },

    data () {
        return {
            tab: 0,

            fullname: "",
            profile: {
                public: {
                    institution: "",
                    position: "",
                    bio: "",
                },
                private: {
                    aup: false,
                }
            },

            //submitting: false,

            config: Vue.config,
        }
    },

    mounted() {
        this.$http.get(Vue.config.auth_api+"/profile").then(res=>{
            console.log("downloading user profile");
            console.dir(res.data);
            this.fullname = res.data.fullname;
            if(res.data.profile) Object.assign(this.profile, res.data.profile);
        })
    },
    
    methods: {
        avatar_url: lib.avatar_url,
        submit_profile(e) {
            e.preventDefault()
            //this.submitting = true;
            this.$http.patch(Vue.config.auth_api+"/profile", {
                fullname: this.fullname,
                profile: this.profile, 
            }).then(res=>{
                console.dir(res.data);
                this.$notify("Updated profile");
            });            
        },
    },
}
</script>

<style scoped>
.page-content {
top: 0px;
background-color: #eee;
}
.page-content h2 {
margin-bottom: 0px;
padding: 10px 0px;
font-size: 20pt;
}
.header {
padding: 10px;
padding-bottom: 0px;
margin-bottom: 20px;
background-color: white;
border-bottom: 1px solid #eee;
}
</style>


