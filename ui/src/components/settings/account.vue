<template>
<div>
    <b-container>
        <h5>Change Password</h5>     
        <b-form @submit="changePassword">
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Current Password</span>
                </b-col>
                <b-col cols="5">
                    <b-form-input v-model="form.currentPassword" type="password" placeholder="Please enter your current password" required/>
                </b-col>
            </b-row>
            <br>
            <b-row>
                <b-col cols="3">
                    <span class="form-header">New Password</span>
                </b-col>
                <b-col cols="5">
                    <p>
                        <b-form-input v-model="form.newPassword" type="password" placeholder="Enter new password here" required/>
                        <password v-if="form.newPassword" v-model="form.newPassword" :strength-meter-only="true" @feedback="updatePasswordFeedback"/>
                        <b-alert :show="true" v-for="(msg, idx) in passwordSuggestions" variant="secondary" :key="idx">{{msg}}</b-alert>
                        <b-alert :show="!!passwordWarning" variant="danger">{{passwordWarning}}</b-alert>
                    </p>

                    <p v-if="form.newPassword">
                        <b-form-input v-model="form.repeatPassword" :state="validaterepeatPass" type="password" placeholder="Re-enter new password to confirm" required/>
                        <b-form-invalid-feedback :state="validaterepeatPass">
                            Passwords do not match
                        </b-form-invalid-feedback>
                    </p>
                    <b-button type="submit" variant="primary" v-if="validaterepeatPass">Reset Password</b-button>
                </b-col>
            </b-row>
            <br>

        </b-form>
        <br>
    </b-container>

    <b-container v-if="user">
        <h5>Account Association</h5>
        <p>
            <small>You can use the following 3rd party identity providers to login to your brainlife account instead of using brainlife's user/password.</small>
        </p>
        <div class="account" v-for="a in accounts" :key="a.type" :class="{'account-connected': user.ext[a.ext]}">
            <b-form-checkbox switch :checked="!!user.ext[a.ext]" size="lg" style="float: right" @change="account(a.type, $event)"/>
            <icon :name="a.icon" size="3" style="float: left; margin-top: 5px;"/> 
            <div class="account-detail">
                <span class="account-name">{{a.name}}</span>
                <br>
                <small v-if="user.ext[a.ext]" style="font-size: 60%">{{user.ext[a.ext]}}</small>
            </div>
            <div class="account-time">
                <small v-if="user.times[a.time]">Last Used: {{new Date(user.times[a.time]).toLocaleString()}}</small>
                <small v-else>Never Used</small>
            </div>
        </div>

        <!--I need to show all registered openid account in separate cards-->
        <div class="account" v-for="dn in user.ext.openids" :key="dn" :class="{'account-connected': true}">
            <b-form-checkbox switch :checked="true" size="lg" style="float: right" @change="account('oidc', $event, {dn})"/>
            <img src="@/assets/images/cilogon.png" width="20" height="20" style="float: left"> 
            <div class="account-detail">
                <span class="account-name">OpenID Connect</span>
                <br>
                <small style="font-size: 60%">{{dn}}</small>
            </div>
            <div class="account-time">
                <small v-if="user.times['oidc_login:'+dn]">Last Used: {{new Date(user.times['oidc_login:'+dn]).toLocaleString()}}</small>
                <small v-else>Never Used</small>
            </div>
        </div>

        <!--fake card to add new openid connect account-->
        <div class="account">
            <b-form-checkbox switch :checked="false" size="lg" style="float: right" @change="account('oidc', true)"/>
            <img src="@/assets/images/cilogon.png" width="20" height="20" style="float: left"> 
            <div class="account-detail">
                <span class="account-name">OpenID Connect</span>
                <br>
                <small style="font-size: 60%">Add New Account</small>
            </div>
            <div class="account-time">
            </div>
        </div>
        <br clear="both">
        <!--
        Please visit the legacy <a href="/auth/#!/settings/account" target="_blank">Account Settings</a> page for more account settings.
        -->
    </b-container>
</div>
</template>

<script>

import Vue from 'vue'

export default {
    components: { 
        password: ()=>import('vue-password-strength-meter'), 
    },

    data () {
        return {
            accounts: [
                { type: "google", ext: "googleid", icon: "brands/google", name: "Google", time: "google_login", },
                { type: "github", ext: "github", icon: "brands/github", name: "Github", time: "github_login", },
                { type: "orcid", ext: "orcid", icon: "brands/orcid", name: "ORCID", time: "orcid_login", },
                { type: "globus", ext: "globus", icon: "cloud", name: "Globus", time: "globus_login", },
            ],

            form: {
                currentPassword: "",
                newPassword: "",
                repeatPassword: "",
            },
            passwordSuggestions: [],
            passwordWarning: "" ,
            
            user: {
                ext: {
                    googleid: '',
                    github: '',
                    opendis : [],
                    orcid: ''
                },
                times: {}
            },
        }
    },

    mounted() {
        this.$http.get(Vue.config.auth_api+"/me").then(res=>{
            this.user = res.data;
        });
    },
    computed: {
         validaterepeatPass() {
            if(!this.form.repeatPassword || !this.form.newPassword) return;
            return this.form.repeatPassword == this.form.newPassword;
        },
   },
   methods: {
        account(type, state, data = {}) {
            console.log(type, state);
            if(state) {
                //connect
                window.location = Vue.config.auth_api+'/'+type+"/associate/"+Vue.config.jwt;
            } else {
                this.$http.put(Vue.config.auth_api+'/'+type+'/disconnect',data).then(res=>{
                    this.$notify({type: "success", text:res.data.message});
                    Object.assign(this.user.ext, res.data.user.ext);
                }).catch(err=>{
                    console.error(err);
                    this.$notify({type: "error", text: res.data.message});
                })
            }
        },

        /*
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
        */

        changePassword(e) {
            e.preventDefault(); //why?
            if(!this.validaterepeatPass) return;

            this.$http.put(Vue.config.auth_api+"/local/setpass", {
                password_old: this.form.currentPassword,
                password: this.form.newPassword
            }).then(res=>{
                this.$notify('Successfully Updated Password');

                //reset form
                this.form.currentPassword = "";
                this.form.newPassword = "";
                this.form.repeatPassword = "";

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
}

</script>

<style scoped>
.account {
    display: inline-block;
    float: left;
    width: 350px;
    box-shadow: 1px 1px 3px #0003;
    border-radius: 10px;
    padding: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
}
.account .account-name {
    font-size: 120%;
}
.account-connected {
    background-color: #2693ff;
    color: white;
}
.account hr {
    margin: 5px 0;
}
.account-detail {
    margin-left: 25px; 
    height: 70px;
}
.account-time {
    padding: 5px 0;
    height: 25px;
    text-align: right;
    border-top: 1px solid #0003;
}
.account-connected .account-time {
    border-top: 1px solid #fff3;
}
</style>
