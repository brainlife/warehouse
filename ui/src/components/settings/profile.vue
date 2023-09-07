<template>
<div>
    <!-- what is the point of this? We should redirect user who hasn't agreed to another page
    <b-alert :show="profile.private.aup === false" variant="danger" style="margin-bottom: 20px">
        Please agree to the brainlife.io acceptable use policy listed below.
    </b-alert>
    -->

    <b-form @submit="submit_profile">
        <h5>Avatar</h5>
        <b-row>
            <b-col cols="2">
                <b-img thumbnail :src="avatar_url(config.user.profile, 100)" style="float: left;"/>
            </b-col>
            <b-col>
                <p>
                    Your avatar is handled by <a href="https://gravatar.com">gravatar.com</a> using your account email address 
                    <span style="opacity: 0.8;">({{config.user.profile.email}})</span>.
                </p>
                <div style="background-color: white; padding: 10px; opacity: 0.8;">
                    <h6>What is Gravatar?</h6>
                    <a href="https://en.gravatar.com/support/what-is-gravatar/">https://en.gravatar.com/support/what-is-gravatar/</a>
                    <br>
                    <br>
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
            </b-col>
        </b-row>

        <h5>Public Profile</h5>
        <p><small>The following information will be shared publicly among all brainlife users.</small></p>

        <b-row>
            <b-col cols="2">
                <span class="form-header">Email *</span>
            </b-col>
            <b-col>
                <b-form-input v-model="email" required readonly/>
                <small>Only administrator can change the account email address</small>
                <br>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col cols="2">
                <span class="form-header">Full Name *</span>
            </b-col>
            <b-col>
                <b-form-input v-model="fullname" required/>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col cols="2">
                <span class="form-header">Institution<small> / Lab</small> *</span>
            </b-col>
            <b-col>
                <b-form-input v-model="profile.public.institution" placeholder="Which campus / research center are you member of?" required/>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col cols="2">
                <span class="form-header">User Map</span>
            </b-col>
            <b-col>
                <b-form-checkbox v-model="profile.public.showOnMap">
                    Show my institution on the brainlife.io user map
                </b-form-checkbox>
                <div v-if="profile.public.showOnMap">
                    <small>Please specify longitude / latitude of your institution to show on map</small>
                    <b-input-group prepend="Latitude">
                        <b-form-input v-model="profile.public.lat"></b-form-input>
                        <b-input-group-prepend is-text>Longitude</b-input-group-prepend>
                        <b-form-input v-model="profile.public.lng"></b-form-input>
                    </b-input-group>
                </div>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col cols="2">
                <span class="form-header">Biography</span>
            </b-col>
            <b-col>
                <b-form-textarea v-model="profile.public.bio" rows="4" max-rows="10"
                    placeholder="Please enter a brief introduction about yourself and your research that you'd like to share with other members of brainlife."/>
                <br>
            </b-col>
        </b-row>

        <h5>Private Profile</h5>
        <p><small>The following information will be shared with your project members and brainlife administrators.
                Brainlife.io is a NSF funded project and supported by Indiana University. 
                We'd like to collect private user profile information for annual reporting purposes (anonymously) 
                and to help us better support our users and to meet their expectations.
                Please read our <a href="/docs/privacy" target="_blank">Privacy Policy</a> to know what information we collect and how we use it.
            </small>
        </p> 

        <b-row>
            <b-col cols="2">
                <span class="form-header">Position *</span>
            </b-col>
            <b-col>
                <b-form-input v-model="profile.private.position" placeholder="What is your primary role within your institution?" required/>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col cols="2">
                <span class="form-header">Purpose</span>
            </b-col>
            <b-col>
                <b-form-textarea v-model="profile.private.purpose" rows="4" max-rows="10"
                    placeholder="(Optional) Please describe how you'd like to use brainlife.io, and your expectations of this platform. We'd like to use this information to measure how we are meeting our user's expectations."/>
            </b-col>
        </b-row>
        <br>

        <b-row v-if="config.debug">
            <b-col cols="2">
                <span class="form-header">Experiences</span>
            </b-col>
            <b-col>
                <p>(Optional) Please enter years of experience you have with ...</p>
                <p>
                    <b-form-group label="Neuroimaging Data Analysis (FSL, SPM, MRTRIX, AFNI, BrainVoyager, etc..)">
                        <b-form-radio-group v-model="profile.private.neuroimaging_experience" :options="experience_options"/>
                    </b-form-group>
                </p>
               <p>
                    <b-form-group label="Neuroimaging Studies (MRI, M/EEG)">
                        <b-form-radio-group v-model="profile.private.study_experience" :options="experience_options"/>
                    </b-form-group>
                </p>
               <p>
                    <b-form-group label="Programming (python, matlab, R, etc..)">
                        <b-form-radio-group v-model="profile.private.programming_experience" :options="experience_options"/>
                    </b-form-group>
                </p>
               <p>
                    <b-form-group label="Computing (git, bash, CLI, linux, singularity, etc..)">
                        <b-form-radio-group v-model="profile.private.computing_experience" :options="experience_options"/>
                    </b-form-group>
                </p>

                <p>
                    <b-form-textarea v-model="profile.private.experience" placeholder="Please enter any other experiences you have that we should know in order to better assist you." rows="3"/>
                    <small>We will use this information to provide better support, and understand our user base.</small>
                </p>
            </b-col>
        </b-row>

        <b-row v-if="config.debug">
            <b-col cols="2">
                <span class="form-header">CV</span>
            </b-col>
            <b-col>
                <b-form-input v-model.trim="profile.public.cv" placeholder="(Optional) If you have a CV, please enter a URL here."/>
                <br>
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
    <b-card v-if="config.debug"><pre>{{fullname}} {{profile}}</pre></b-card>

</div>
</div>
</template>

<script>

import Vue from 'vue'

const lib = require('@/lib'); //for avatar_url

export default {
    data () {
        return {

            experience_options: [
                { text: 'No Experience', value: 0 },
                { text: 'Less than a year', value: 1 },
                { text: '2-3 years', value: 2 },
                { text: '3-10 years', value: 3 },
                { text: '>10 years', value: 4 },
            ],

            email: "", //readonly

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

            debug: null,
            jwt: null,
            config: Vue.config,
        }
    },

    mounted() {
        this.$http.get(Vue.config.auth_api+"/profile").then(res=>{
            this.email = res.data.email;
            this.fullname = res.data.fullname;
            if(res.data.profile) lib.mergeDeep(this.profile, res.data.profile);
            if(this.profile.private.aup) this.profile.private.aup = true;
            const jwt = Vue.config.jwt;
            if(jwt) {
                this.debug = {jwt : this.user};
                this.jwt = jwt;
            }
        });
    },

    methods: {
        avatar_url: lib.avatar_url,

        submit_profile(e) {
            e.preventDefault()
            this.$http.patch(Vue.config.auth_api+"/profile", {
                fullname: this.fullname,
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
