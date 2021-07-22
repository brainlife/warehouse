<template>
    <div class="page-content">
        <br>
            <b-form @submit="submit">
                <b-container>
                <b-form-group>
                    <b-row>
                    <b-col cols="6">
                        <span class="form-header">Profile</span>
                        <b-form-textarea id="profile" v-model="user.profile" rows="8"></b-form-textarea>
                    </b-col>
                    <b-col cols="6">
                        <span class="form-header">Scope</span>
                        <b-form-textarea id="scope" v-model="user.scope" rows="8"></b-form-textarea>
                    </b-col>
                    <b-col cols="12">
                        <br>
                        <b-form-checkbox v-model="user.active">Active</b-form-checkbox>
                        <span class="form-header">Full Name</span>
                        <b-form-input v-model="user.fullname"></b-form-input>
                        <br>
                        <span class="form-header">Username</span>
                        <b-form-input v-model="user.username"></b-form-input>
                        <br>
                        <span class="form-header">Email</span>
                        <b-form-input v-model="user.email"></b-form-input>
                        <b-form-checkbox v-model="user.email_confirmed">Confirmed</b-form-checkbox>
                        <hr>
                        <span class="form-header">Google ID</span>
                        <b-form-input v-model="user.ext.googleid"></b-form-input>
                        <span class="form-header">Open ID</span>
                        <b-form-input v-model="user.ext.openids"></b-form-input>
                        <span class="form-header">Orcid</span>
                        <b-form-input v-model="user.ext.orcid"></b-form-input>
                        <span class="form-header">Github</span>
                        <b-form-input v-model="user.ext.github"></b-form-input>
                        <hr>
                        <pre>{{user.times}}</pre>
                    </b-col>
                    </b-row>
                </b-form-group>
                <b-button type="cancel" variant="secondary">Cancel</b-button>
                <b-button type="submit" variant="success">Submit</b-button>
                </b-container>
                
            </b-form>
    </div>
</template>
<script>
import Vue from 'vue'

export default {
    components: {

    },

    data () {
        return {
            user: {
                fullname: "",
                username: "",
                profile: {
                },
                _id : "",
                scope: {}, 
                email_confirmation: false,
                exit: {},
                times: {},
                active: false,
            }
        }
    },

    mounted : function() {
        this.$http.get(Vue.config.auth_api+"/user/"+this.$route.params.id).then(res=>{
            this.user = res.data;
        }).catch(err=>{
            console.error(err.response);
        });
    },
    methods: {
        submit(e) {
            e.preventDefault();
            this.$http.put(Vue.config.auth_api+"/user/"+this.$route.params.id,this.user).then(res=>{
                console.log("Updated");
                console.log("res"+res);
            }).catch(err=>console.error(err));
        }
    }
}    
</script>
<style scoped>
</style>