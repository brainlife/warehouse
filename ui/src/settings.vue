<template>
<div>
    <div class="page-content">
        <div class="header">
            <b-container>
                <h2>Settings</h2>
                <b-tabs class="brainlife-tab" v-model="tab">
                    <b-tab title="Profile"/>
                    <b-tab title="Avatar"/>
                    <b-tab title="Account"/>
                    <b-tab title="Notifications"/>
                    <!--<b-tab title="Notifications"/>-->
                </b-tabs>
            </b-container>
        </div><!--header-->

        <!--main content-->
        <b-container>

            <!--profile-->
            <div v-if="tab == 0">
                <b-alert :show="!profile.private.aup" variant="danger" style="margin-bottom: 20px">
                    <icon name="exclamation-circle"/> Please agree to the brainlife.io acceptable use policy listed below.
                </b-alert>

                <b-form @submit="submit_profile">
                    <h5 style="opacity: 0.7">Public Profile</h5>
                    <p><small>The following information will be shared publically among all brainlife users.</small></p>
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
                            <span class="form-header">Biography</span>
                        </b-col>
                        <b-col>
                            <b-form-textarea v-model="profile.public.bio" rows="3" 
                                placeholder="Please enter a brief introduction about yourself and your research that you'd like to share with other members of brainlife."/>
                            <br>
                        </b-col>
                    </b-row>

                    <hr>
                    <h5 style="opacity: 0.7">Private Profile</h5>
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
                            <b-form-textarea v-model="profile.private.purpose" rows="3" 
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
                            <b-form-input v-model="profile.public.cv" placeholder="(Optional) If you have a CV, please enter a URL here."/>
                            <br>
                        </b-col>
                    </b-row>

                    <hr>
                    <b-row>
                        <b-col cols="2">
                        </b-col>
                        <b-col>
                            <b-form-checkbox name="aup" v-model="profile.private.aup" required>
                                Agree to Brainlife <a href="/docs/aup" target="_blank">Acceptable Use Policy</a><br>
                                <br>
                            </b-form-checkbox>
                          
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

            <!--notification-->
            <div v-if="tab == 3">
                <b-form @submit="submit_profile">
                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">News Letters</span>
                        </b-col>
                        <b-col>
                            <b-form-checkbox name="aup" v-model="profile.private.notification.newsletter_general">
                                Receive brainlife.io general newsletters (about once a month).
                            </b-form-checkbox>    
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

        </b-container>
        <br>
        <br>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'

const lib = require('@/lib'); //for avatar_url

export default {
    components: { 
        pageheader, 
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
                    /*
                    neuroimaging_experience: null,
                    study_experience: null,
                    programming_experience: null, 
                    computing_experience: null, 
                    */
                    notification: {
                       newsletter_general: false,
                    }
                }
            },

            experience_options: [
                { text: 'No Experience', value: 0 },
                { text: 'Less than a year', value: 1 },
                { text: '2-3 years', value: 2 },
                { text: '3-10 years', value: 3 },
                { text: '>10 years', value: 4 },
            ],

            //submitting: false,

            config: Vue.config,
        }
    },

    mounted() {
        this.$http.get(Vue.config.auth_api+"/profile").then(res=>{
            //console.log("downloading user profile");
            //console.dir(res.data);
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
                //console.dir(res.data);
                this.$notify("Successfully updated profile");
                this.$router.push("/projects");
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


