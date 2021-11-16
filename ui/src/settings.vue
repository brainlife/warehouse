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
                    <b-tab v-if="config.is_admin" title="Users"/>
                    <b-tab v-if="config.is_admin" title="Groups"/>
                </b-tabs>
            </b-container>
        </div><!--header-->

        <!--main content-->
        <b-container v-if="ready">

            <!--profile-->
            <div v-if="tabID == 'profile'">
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
            <div v-if="tabID == 'account'">
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
                <div v-if="user">
                    <h5>Connected Accounts</h5>
                    <div class="well">
                        <div v-if="!user.ext.googleid">
                            <b-button class="float-right" @click="connect('google')">Connect</b-button>
                        </div>
                        <div v-else>
                            <b-button class="float-right" @click="disconnect('google')">Disconnect</b-button>
                            <p class="float-right text-muted" style="margin: 11px;"><b>{{user.ext.googleid}}</b> |</p>
                        </div>
                        <p class="float-right text-muted" style="margin: 11px;">
                                Last Login: 
                                <span v-if="!user.times.google_login">Never</span>
                                <span v-else>{{user.times.google_login}}</span>
                        </p>
                        <h5><icon name="brands/google" size="2.4"></icon> Google</h5>
                    </div>
                    <div class="well">
                        <b-button class="float-right" v-if="user.ext.github" @click="disconnect('github')">Disconnect</b-button>
                        <b-button class="float-right" v-else @click="connect('github')">Connect</b-button>
                        <p class="float-right text-muted" style="margin: 11px;">
                            <span v-if="user.ext.github"><b>{{user.ext.github}}</b> |</span>
                            Last Login: 
                            <span v-if="!user.times.github">Never</span>
                            <span v-else>{{user.times.github_login}}</span>
                        </p>
                        <h5><icon name="brands/github" size="2.4"></icon> Github</h5>
                    </div>
                    <div class="well">
                        <b-button class="float-right" v-if="user.ext.orcid" @click="disconnect('orcid')">Disconnect</b-button>
                        <b-button class="float-right" v-else @click="connect('orcid')">Connect</b-button>
                        <p class="float-right text-muted" style="margin: 11px;">
                            <span v-if="user.ext.orcid"><b>{{user.ext.orcid}}</b> |</span>
                            Last Login: 
                            <span v-if="!user.times.orcid">Never</span>
                            <time v-if="user.times.orcid_login">{{user.times.orcid_login}}</time>
                        </p>
                        <h5><icon name="brands/orcid" size="2.4"></icon> ORCID</h5>
                    </div>
                    <div class="well">
                        <b-button class="float-right" @click="connect('oidc')">Connect</b-button>
                        <h5>
                            <img src="@/assets/images/cilogon.png" width="24" height="24"> 
                            OpenID Connect
                        </h5>
                        <b-list-group v-if="user.ext.openids">
                            <b-list-group-item v-for="dn in user.ext.openids" :key="dn">
                                <b-button class="float-right" v-if="user.ext.openids" @click="disconnect('oidc',{dn})">Disconnect</b-button>
                                <p style="margin: 0 0 10.5px;">
                                    {{dn}}
                                    <span class="text-muted"> | Last Login: 
                                        <span v-if="!user.times['oidc_login:'+user.profile.sub]">Never</span> 
                                        <time>{{user.times['oidc_login:'+user.profile.sub]}}</time>
                                    </span> 
                                </p>
                            </b-list-group-item>
                        </b-list-group>
                    </div>
                </div>
                Please visit the legacy <a href="/auth/#!/settings/account" target="_blank">Account Settings</a> page for more account settings.
            </div>

            <!--notification-->
            <div v-if="tabID == 'notification'">
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

            <div v-if="tabID == 'users'">
                    <b-container>
                        <b-row>
                            <b-col>
                                <h5>Users</h5>
                                <b-form-input v-model="queryUser" type="text" placeholder="Search Users" @input="changeQueryDebounceUser" class="input"/>
                                <b-table :tbody-tr-class="rowClass" ref="userTable" striped hover small
                                :items="loadUsers()" 
                                :fields="fields" 
                                :per-page="perPage" 
                                :current-page="currentPage" 
                                @row-clicked="selectUser" v-b-modal="'userEditmodal'"/>
                                <b-pagination v-model="currentPage" :total-rows="rowUsers" :per-page="perPage" aria-controls="my-table"></b-pagination>
                                <p class="mt-3">Current Page: {{ currentPage }}</p>
                            </b-col>
                            <b-modal size="xl" v-if="showModal" id='userEditmodal' ref='ref_modal'>
                                <template #modal-header>
                                    <h3>{{userEdit.sub}} {{userEdit.fullname}}</h3>
                                </template>
                                <b-container>
                                    <b-form-group>
                                        <b-row>
                                            <b-col cols="12">
                                                <editor v-if="rawJson" v-model="convertRawJSONtoUserEdit" @init="editorInit" lang="json" height="1000"/>
                                                <b-row v-else-if="userEdit">
                                                    <b-col cols="6">
                                                        <h4>Public Profile</h4>
                                                        <span class="form-header">Institution</span>
                                                        <b-form-input v-if="userEdit.profile.public.institution" v-model="userEdit.profile.public.institution"></b-form-input>
                                                        <span class="form-header">Bio</span>
                                                        <b-form-textarea v-model="userEdit.profile.public.bio"></b-form-textarea>
                                                        <h4 style="padding-top: 16px">Scope</h4>
                                                        <div v-for="(value, propertyName, index) in permissionScope" :key="index">
                                                            <span class="form-header">{{propertyName}}</span>
                                                                <div v-for="(val,pn,ind) in value" :key="ind">
                                                                    <b-form-checkbox v-model="scopeModel[propertyName][pn]">{{val}} <b-badge> {{pn}} </b-badge></b-form-checkbox>
                                                                </div>
                                                        </div>
                                                    </b-col>
                                                    <b-col cols="6">
                                                        <h4>Private Profile</h4>
                                                        <span class="form-header">Position</span>
                                                        <b-form-input v-model="userEdit.profile.private.position"></b-form-input>
                                                        <span class="form-header">Purpose</span>
                                                        <b-form-textarea v-model="userEdit.profile.private.purpose"></b-form-textarea>
                                                        <span class="form-header">Full Name</span>
                                                        <b-form-input v-if="userEdit.fullname" v-model="userEdit.fullname"/>
                                                        <span class="form-header">Username</span>
                                                        <b-form-input v-if="userEdit.username" v-model="userEdit.username"/>
                                                        <span class="form-header">Email</span>
                                                        <b-form-input v-if="userEdit.email" v-model="userEdit.email"/>
                                                        <div style="display:flex;padding-top:8px;">
                                                            <b-form-checkbox v-model="userEdit.active">Active</b-form-checkbox>
                                                            <b-form-checkbox style="margin:auto" v-model="userEdit.email_confirmed">Confirmed</b-form-checkbox>
                                                        </div>
                                                        <h4  style="padding-top: 16px">Associated Accounts</h4>
                                                        <span class="form-header">Google ID</span>
                                                        <b-form-input v-if="userEdit.ext" v-model="userEdit.ext.googleid"/>
                                                        <span class="form-header">Open ID</span>
                                                        <b-form-input v-if="openids" v-model="openids"/>
                                                        <span class="form-header">Orcid</span>
                                                        <b-form-input v-if="userEdit.ext" v-model="userEdit.ext.orcid"/>
                                                        <span class="form-header">Github</span>
                                                        <b-form-input v-if="userEdit.ext" v-model="userEdit.ext.github"/>
                                                        <hr>
                                                        <pre>{{userEdit.times}}</pre>
                                                    </b-col>
                                                </b-row>
                                            </b-col>
                                        </b-row>
                                    </b-form-group>
                                </b-container>
                                    <template #modal-footer="{cancel}">
                                        <div class="float-left mr-auto">
                                            <b-button :pressed.sync="rawJson" size="sm" variant="primary">Show Raw Json</b-button>
                                        </div>
                                        <b-button size="sm" variant="success" ref="okBTN" @click="submitUser">OK</b-button>
                                        <b-button size="sm" variant="danger" @click="cancel()">Cancel</b-button>
                                    </template>
                            </b-modal>
                        </b-row>
                    </b-container>
            </div>
            <div v-if="tabID == 'groups'">
                <b-container>
                    <b-row>
                        <b-col>
                            <h5>Groups <span style="float: right"><b-button v-on:click="initGroup()">Create Group</b-button></span></h5>
                            <b-form-input v-model="queryGroup" type="text" placeholder="Search Groups" @input="changeQueryDebounceGroup" class="input"/>
                            <b-table :tbody-tr-class="rowClass" ref="groupTable" striped hover small 
                            :items="loadGroups()" 
                            :fields="groupfields" 
                            :per-page="perPage" 
                            :current-page="currentPage"  
                            @row-clicked="selectGroup"/>
                            <b-pagination v-model="currentPage" :total-rows="rowGroups" :per-page="perPage" aria-controls="my-table"></b-pagination>
                            <p class="mt-3">Current Page: {{ currentPage }}</p>
                        </b-col>
                        <b-col>
                            <b-form v-if="groupEdit" @submit="submitGroup">
                            <b-row>
                                <b-col cols="12">
                                    <span class="form-header">Name</span>
                                    <b-form-input v-if="groupEdit.name" v-model="groupEdit.name"/>
                                    <span class="form-header">Description</span>
                                    <b-form-textarea v-if="groupEdit.desc" v-model="groupEdit.desc" rows="8"/>
                                    <span class="form-header">Members</span>
                                    <contactlist type="text" v-if="groupEdit.members" v-model="groupEdit.members"></contactlist>
                                    <span class="form-header">Admins</span>
                                    <contactlist v-if="groupEdit.admins" v-model="groupEdit.admins"></contactlist>
                                    <b-form-checkbox v-model="groupEdit.active">Active</b-form-checkbox>
                                </b-col>
                            </b-row>
                            <b-button type="submit" variant="success">Submit</b-button>
                            </b-form>
                        </b-col>
                    </b-row>
                </b-container>
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
let queryDebounceUser;
let queryDebounceGroup;

export default {
    components: { 
        pageheader, statustag,
        password: ()=>import('vue-password-strength-meter'), 
        contactlist: ()=>import('@/components/contactlist'),
        editor: ()=>import('vue2-ace-editor'),
    },

    data () {
        return {
            
            tabs: [
                {id: "profile", label: "Profile"},
                {id: "account", label: "Account"},
                {id: "notification", label: "Notification"},
                {id: "users", label: "Users"},
                {id: "groups", label: "Groups"},
            ],
            showModal: false,

            tab: 0,

            users: [],
            queryUser: "", 
            queryGroup: "",
            filteredUsers: [],
            filteredGroups: [],
            groups: [],
            fields: ["fullname", "username", "active", "email", 
                    {key: 'profile.private.institution',label: 'instituition'}, 
                    {key: 'profile.private.position',label: "position"}],
            groupfields: ["name", "active"],
            perPage: 100,
            userEdit: null,
            groupEdit: null,
            currentPage: 1,
            ready: false,
            rawJson: false,
            user: {
                ext: {
                    googleid: '',
                    github: '',
                    opendis : [],
                    orcid: ''
                },
                times: {}
            },
            debug: null,
            jwt: null,

            fullname: "",
            openids : null,
            form: {
                currentPassword: "",
                newPassword: "",
                repeatPassword: "",
            },
            passwordSuggestions: [],
            passwordWarning: "" ,
            convertRawJSONtoUserEdit : null,
            scopeModel : {
                "brainlife": {
                    "user" : false,
                    "admin" : false,
                },
                "warehouse": {
                    "admin" : false,
                    "datatype.create" : false
                },
                "amaretti": {
                    "admin" : false,
                    "resource.create" : false,
                },
                "auth": {
                    "admin" : false,
                },
            },
            tabs: [
                {id: 'profile', label: "Profile"},
                {id: 'account', label: "Account"},
                {id: 'notification', label: "Notification"},
                {id: "users", label: "Users"},
                {id: "groups", label: "Groups"},
            ],

            permissionScope: {
                "brainlife": {
                    "user" : "Basic user privileges given to all new users by default",
                    "admin" : "Allows user to perform administrative tasks for brainlife in general"
                },
                "warehouse": {
                    "admin" : "Allows user to perform administrative tasks specific to warehouse service",
                    "datatype.create" : "Allows user to register new datatype"
                },
                "amaretti": {
                    "admin" : "Allows user to perform administrative tasks on amaretti service",
                    "resource.create" : "Allows user to register new resource"
                },
                "auth": {
                    "admin" : "Allows user to perform administrative tasks on authorization service"
                }
            },
            
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
            const jwt = Vue.config.jwt;
            if(jwt) {
                this.debug = {jwt : this.user};
                this.jwt = jwt;
                console.log(this.jwt);
            }
            this.handleRouteParams();
        });
    },
    
    methods: {

        handleRouteParams() {
            let tab_id = this.$route.params.tab;
            if(tab_id) this.tab = this.tabs.findIndex(tab=>tab.id == tab_id);  
            console.log("tab is now", this.tab);
        },

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
            }).catch(err=>{
                console.error(err.response);
                this.$notify({type: "error", text: err.response.data.message});
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
        loadUsers() {
            if(!this.users.length) {
                this.$http.get(Vue.config.auth_api+"/users").then(res=>{
                    this.users = res.data;
                }).catch(err=>{
                    console.error(err.response);
                    this.$notify({type: "error", text: err});
                });
            }
            if(this.queryUser.length) return this.filteredUsers;
            return this.users;
        },
        loadGroups() {
            if(!this.groups.length) {
                this.$http.get(Vue.config.auth_api+"/groups").then(res=>{
                    this.groups = res.data;
                    this.groups.forEach(group=>{
                        if(group.admins) group.admins = group.admins.map(admins=>admins.sub);
                        if(group.members) group.members = group.members.map(members=>members.sub);
                    });
                }).catch(err=>{
                    console.error(err.response);
                    this.$notify({type: "error", text: err});
                });
            }
            if(this.queryGroup.length) return this.filteredGroups;
            return this.groups;
        },
        selectUser(user) {
            this.scopeModel = {
                "brainlife": {
                    "user" : false,
                    "admin" : false,
                },
                "warehouse": {
                    "admin" : false,
                    "datatype.create" : false
                },
                "amaretti": {
                    "admin" : false,
                    "resource.create" : false,
                },
                "auth": {
                    "admin" : false,
                }
            };
            this.userEdit = Object.assign({}, this.userEdit, user);
            this.profile = JSON.stringify(user.profile, null, 4);
            this.convertRawJSONtoUserEdit = JSON.stringify(user, null, 4);
            // console.log(typeof user.scopes, user.scopes);
            for (const key in this.userEdit.scopes) {
                // console.log(key);
                this.userEdit.scopes[key].forEach(permission=>{
                    console.log(key,permission);
                    this.scopeModel[key][permission] = true
                });
            }
            this.openids = user.ext.openids[0] || " ";
            this.showModal = true;
        },
        checkValidJson(item) {
            item = typeof item !== "string"
                ? JSON.stringify(item)
                : item;

            try {
                item = JSON.parse(item);
            } catch (e) {
                return false;
            }

            if (typeof item === "object" && item !== null) {
                return true;
            }

            return true;
        },
        selectGroup(group) {
            this.groupEdit = Object.assign({}, this.groupEdit, group);
        },
        rowClass(item, type) {
            if (!item || type !== 'row') return;
            // if (item._id == this.userEdit._id || this.groupEdit._id == item._id) return 'table-success'
            if(this.userEdit && this.userEdit._id == item._id) return 'table-primary';
            if(this.groupEdit && this.groupEdit._id == item._id) return 'table-primary';
        },
        submitUser(e) {
            e.preventDefault();
            if(!this.checkValidJson(this.convertRawJSONtoUserEdit)) {
                this.$notify({type: "error", text: "Json formatting Error"});
                return;
            }
            Object.keys(this.scopeModel).forEach(entry => {
                this.userEdit.scopes[entry] = Object.keys(this.scopeModel[entry]).filter(val=>this.scopeModel[entry][val] == true);
            });
            this.userEdit.ext.openids[0] = this.openids;
            this.$http.put(Vue.config.auth_api+"/user/"+this.userEdit.sub,this.userEdit).then(res=>{
                this.$notify({type: "success", text: res.data.message});
                this.showModal = false;
                this.userEdit = null;
                this.users = [];
                this.profile = null;
            }).catch(console.error);
        },
        submitGroup(e) {
            e.preventDefault();
            if(this.groupEdit.id) {
                this.$http.put(Vue.config.auth_api+"/group/"+this.groupEdit.id,this.groupEdit).then(res=>{
                    this.$notify({type: "success", text: res.data.message});
                }).catch(console.error);                
            } else {
                this.$http.post(Vue.config.auth_api+"/group/",this.groupEdit).then(res=>{
                    this.$notify({type: "success", text: res.data.message});
                }).catch(console.error);
            }
            this.groupEdit = null;
            this.groups = [];
        },
        changeQueryDebounceUser() {
            clearTimeout(queryDebounceUser);
            queryDebounceUser = setTimeout(this.changeQueryUser, 300);        
        },
        changeQueryDebounceGroup() {
            clearTimeout(queryDebounceGroup);
            queryDebounceGroup = setTimeout(this.changeQueryGroup,300);
        },
        changeQueryUser() {
            if(!this.users) return setTimeout(this.changeQueryUser, 300);
            sessionStorage.setItem("user.query", this.queryUser);
            this.applyFilterUser();
        },
        changeQueryGroup() {
            if(!this.groups) return setTimeout(this.changeQueryGroup,300);
            sessionStorage.setItem("group.query", this.queryGroup);
            this.applyFilterGroup();
        },
        applyFilterUser() {
            let tokens = this.queryUser.toLowerCase().split(" ");
            this.filteredUsers = this.users.filter(user=>{
                let stuff = [
                    user.fullname,
                    user.username,
                    user.email
                ];
                const text = stuff.filter(thing=>!!thing).join(" ").toLowerCase();
                return tokens.every(token=>text.includes(token));
            });

        },
        applyFilterGroup() {
            let tokens = this.queryGroup.toLowerCase().split(" ");
            this.filteredGroups = this.groups.filter(group=>{
                let stuff = [
                    group.name,
                    group.description,
                ];
                const text = stuff.filter(thing=>!!thing).join(" ").toLowerCase();
                return tokens.every(token=>text.includes(token));
            });
        },
        editorInit(editor) {
            require('brace/mode/json')
            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
        },
        initGroup() {
            this.groupEdit = {
                name : " ",
                desc : " ",
                members : [],
                admins : [],
            }
        },
        connect(type) {
            window.location = Vue.config.auth_api+'/'+type+"/associate/"+this.jwt;
        },
        disconnect(type, data) {
            this.$http.put(Vue.config.auth_api+'/'+type+'/disconnect',data).then(res=>{
                this.$notify({type: "success", text:res.data.message});
                console.log("res.data", res.data);
                console.log(this.user);
                Object.assign(this.user.ext, res.data.user.ext);
                console.log(this.user);
            }).catch(err=>{
                console.error(err);
                this.$notify({type: "error", text: res.data.message});
            })
        },
        handleRouteParams() {
            console.log("handleRouteParams", this.$route.params);
            const tab_id = this.$route.params.tab;
            if(tab_id) this.tab = this.tabs.findIndex(tab=>tab.id == tab_id); 
        },
    },

    computed : {
        validaterepeatPass() {
            if(!this.form.repeatPassword || !this.form.newPassword) return;
            return this.form.repeatPassword == this.form.newPassword;
        },
        rowUsers() {
            return this.users.length;
        },
        rowGroups() {
            return this.groups.length;
        },
        tabID() {
            return this.tabs[this.tab].id; 
        },
    },

    watch: {
        '$route': function() {
            this.handleRouteParams();
        },
        tab: function() {
            if(this.tab == 3) this.loadUsers();
            if(this.tab == 4) this.loadGroups();

            if(this.$route.params.tab != this.tabs[this.tab].id) {
                this.$router.replace("/settings/"+this.tabs[this.tab].id);
            }
            if(this.tabs[this.tab].id == 'account') {
               this.$http.get(Vue.config.auth_api+"/me").then(res=>{
                    this.user = res.data;
                });
            }
        },
        convertRawJSONtoUserEdit: function() {
            this.userEdit = JSON.parse(this.convertRawJSONtoUserEdit||"{}");
        },
        userEdit: function() {
            this.convertRawJSONtoUserEdit = JSON.stringify(this.userEdit, null, 4);
        },
        queryUser: function() {
            this.applyFilterUser();
        },
        queryGroup: function() {
            this.applyFilterGroup();
        },
    },
}
</script>

<style scoped>
.page-content {
    top: 0px;
    background-color: #f9f9f9;
}
.form-header {
    margin-top: 0.5rem;
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
h4 {
    opacity: 0.8;
}
h5 {
    margin-bottom: 20px;
    opacity: 0.7;
}
.well {
    padding: 10px;
    margin-bottom: 10px;
    background-color: #fff;
    display: block;
    clear: both;
}
.headingbtnGroup {
    color: #5F5F5F;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 13px;
}
</style>


