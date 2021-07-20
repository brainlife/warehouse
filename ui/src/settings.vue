<template>
<div>
    <div class="page-content">
        <div class="header">
            <b-container>
                <h2>Settings</h2>
                <b-tabs class="brainlife-tab" v-model="tab">
                    <b-tab title="Profile"/>
                    <b-tab title="Account"/>
                    <b-tab title="Notification"/>
                    <b-tab v-if="config.user.scopes.brainlife.includes('admin')" title="Users"/>
                    {{config.user.scopes.brainlife}}
                </b-tabs>
            </b-container>
        </div><!--header-->

        <!--main content-->
        <b-container v-if="ready">

            <!--profile-->
            <div v-if="tab == 0">
                <b-alert :show="!profile.private.aup" variant="danger" style="margin-bottom: 20px">
                    <icon name="exclamation-circle"/> Please agree to the brainlife.io acceptable use policy listed below.
                </b-alert>

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

                    <hr>
                    <h5>Public Profile</h5>
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
                            <span class="form-header">User Map</span>
                        </b-col>
                        <b-col>
                            <b-form-checkbox v-model="profile.public.showOnMap">
                                Show my institution on the brainlife.io user map
                            </b-form-checkbox>
                            <div v-if="profile.public.showOnMap">
                                <small>Please specify longitude / latitude of your institution to show on map</small>
                                <b-row>
                                    <b-col>
                                        <b-form-group label="Latitude">
                                            <b-form-input v-model="profile.public.lat"/>
                                        </b-form-group>
                                    </b-col>
                                    <b-col>
                                        <b-form-group label="Longitude">
                                            <b-form-input v-model="profile.public.lng"/>
                                        </b-form-group>
                                    </b-col>
                                </b-row>
                            </div>
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

            <!--account-->
            <div v-if="tab == 1">
                <b-container>
                    <h5>Change Password</h5>     
                    <hr>           
                    <b-form @submit="changePassword">
                        <b-form-group label="Current Password">
                            <b-form-input v-model="form.currentPassword" type="password" required/>
                        </b-form-group>
                        <b-form-group label="New Password">
                            <b-form-input v-model="form.newPassword" type="password" required/>
                            <password v-model="form.newPassword" :strength-meter-only="true" @feedback="updatePasswordFeedback"/>
                            <b-alert v-for="(msg, idx) in passwordSuggestions" variant="secondary" :key="idx">{{msg}}</b-alert>
                            <b-alert :show="!!passwordWarning" variant="danger">{{passwordWarning}}</b-alert>
                        </b-form-group>
                        <b-form-group label="Re-enter New Password">
                            <b-form-input v-model="form.repeatPassword" :state="validaterepeatPass" type="password" required/>
                        </b-form-group>
                        <b-form-invalid-feedback :state="validaterepeatPass">
                            Passwords do not match
                        </b-form-invalid-feedback>
                        <br>
                        <b-button type="submit" variant="primary" v-if="validaterepeatPass">Update</b-button>                           
                    </b-form>
                </b-container>
                <br>
                Please visit the legacy <a href="/auth/#!/settings/account" target="_blank">Account Settings</a> page for more account settings.
            </div>

            <!--notification-->
            <div v-if="tab == 2">
                <b-form @submit="submit_profile">
                    <h5>Sounds</h5>
                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Job Status Change</span>
                        </b-col>
                        <b-col cols="8">
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

            <div v-if="tab == 3">
                <h5>Users</h5>
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
import statustag from '@/components/statustag'

const lib = require('@/lib'); //for avatar_url

export default {
    components: { 
        pageheader, statustag,
        password: ()=>import('vue-password-strength-meter'), 
    },

    data () {
        return {
            tab: 0,

            ready: false,

            fullname: "",
            form: {
                currentPassword: "",
                newPassword: "",
                repeatPassword: "",
            },
            passwordSuggestions: [],
            passwordWarning: "" ,
            
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
            this.fullname = res.data.fullname;
            if(res.data.profile) lib.mergeDeep(this.profile, res.data.profile);
            this.ready = true;
        })
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
                this.$router.push("/projects");
            });            
        },
        changePassword(e) {
            e.preventDefault()
            if(!this.validaterepeatPass) return;
            this.$http.put(Vue.config.auth_api+"/local/setpass", {
                password_old: this.form.currentPassword,
                password: this.form.newPassword
            }).then(res=>{
                this.$notify('Successfully Updated Password');
            }).catch(err=>{
                console.error(err.response);
                this.$notify({type: "error", text: err.response.data.message});
            });
        },
        updatePasswordFeedback(feedback) {
            this.passwordSuggestions = feedback.suggestions;
            this.passwordWarning = feedback.warning;
        },
    },

    computed : {
        validaterepeatPass() {
            if(!this.form.repeatPassword || !this.form.newPassword) return;
            return this.form.repeatPassword == this.form.newPassword;
        },
    }
}
</script>

<style scoped>
.page-content {
    top: 0px;
    background-color: #f9f9f9;
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
h5 {
    margin-bottom: 20px;
    opacity: 0.7;
}
</style>


