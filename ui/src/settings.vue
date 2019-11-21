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
                    <b-alert show variant="secondary">
                        Brainlife.io is NSF funded project and supported by Indiana University. We are obliged to collect basic user profile information for annual reporting and to implement features that are useful for our users.
                    </b-alert>
                    <br>

                    <p>
                        <span class="form-header">Institution</span>
                        <b-form-input v-model="profile.institution" placeholder="Which campus / research center are you member of?" required/>
                    </p>

                    <p>
                        <span class="form-header">Position</span>
                        <b-form-input v-model="profile.position" placeholder="What is your role at your institution?" required/>
                    </p>

                    <p>
                        <span class="form-header">Biography</span>
                        <b-form-textarea v-model="profile.bio" rows="3" placeholder="Please enter a brief introduction about yourself and your research that you'd like to share with other members of brainlife." required/>
                    </p>

                    <p>
                        <b-form-checkbox v-model="profile.aup">
                            Agree to Brainlife <a href="/docs/aup" target="_blank">Acceptable Use Policy</a><br>
                         </b-form-checkbox>
                    </p>

                    <div class="page-footer">
                        <b-button type="submit" variant="primary" :disabled="submitting"><icon v-if="submitting" name="cog" spin/> Update</b-button>
                    </div>
                </b-form>
                <b-card v-if="config.debug"><pre>{{profile}}</pre></b-card>
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

            profile: {
                institution: "",
                position: "",
                bio: "",
                aup: false,
            },

            submitting: false,

            config: Vue.config,
        }
    },

    mounted() {
        console.log("mounting settings"); 
    },
    
    methods: {
        avatar_url: lib.avatar_url,
        submit_profile(e) {
            e.preventDefault()
            console.dir(this.profile);

            this.submitting = true;
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


