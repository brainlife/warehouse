<template>
<div>
    <b-container>
        <b-row>
            <b-col>
                <div style="background-color:white; padding: 10px;">
                    <b-form-input v-model="query" type="text" placeholder="Search Users"
                    @input="changeQueryDebounce" class="input"/>
                    <br>
                    <b-pagination v-model="currentPage" :total-rows="500" :per-page="perPage"
                    aria-controls="my-table"/>
                    {{currentPage}}
                    <b-table :tbody-tr-class="rowClass" ref="userTable" hover small
                    :items="users"
                    :fields="fields"
                    :per-page="0"
                    :current-page="currentPage"
                    @row-clicked="select" v-b-modal.modal-useredit>
                    <template #cell(active)="data">
                        <b-badge variant="success" v-if="data.item.active">✓</b-badge>
                    </template>
                    </b-table>
                    <b-pagination v-model="currentPage" :total-rows="500" :per-page="perPage"
                    aria-controls="my-table"/>
                </div>
            </b-col>
            <b-modal size="xl" id='modal-useredit' v-if="form">
                <template #modal-header>
                    <h4 style="magin-bottom: 0;">{{form.fullname}} <small style="float: right">
                    &nbsp;({{form.sub}})</small></h4>
                    <div class="button" @click="closeModal()" style="float: right">
                        <icon name="times" scale="1.5"/>
                    </div>
                </template>
                <editor v-if="mode == 'json'" v-model="json" @init="editorInit" lang="json"
                height="500"/>
                <div v-if="mode == 'ui'">
                    <b-row>
                        <b-col cols="6">
                            <b-row>
                                <b-col cols="6"><b-form-checkbox v-model="form.active">Active</b-form-checkbox></b-col>
                                <b-col cols="6"><b-form-checkbox style="margin:auto"
                                v-model="form.email_confirmed">Confirmed</b-form-checkbox></b-col>
                            </b-row>
                            <span class="form-header">Full Name</span>
                            <b-form-input v-if="form.fullname" v-model="form.fullname"/>
                            <span class="form-header">Username</span>
                            <b-form-input v-if="form.username" v-model="form.username"/>
                            <span class="form-header">Email</span>
                            <b-form-input v-if="form.email" v-model="form.email"/>

                            <br>
                            <h5>Scope</h5>
                            <div v-for="(info, service, index) in scopeCatalog" :key="index">
                                <span class="form-header">{{service}}</span>
                                    <div v-for="(desc,key,ind) in info" :key="ind">
                                        <b-form-checkbox v-model="form._scopes[service][key]">
                                            <b-badge variant="outline-light">{{key}}</b-badge><br>
                                            <small>{{desc}}</small>
                                        </b-form-checkbox>
                                    </div>
                            </div>
                        </b-col>
                        <b-col cols="6">
                            <h5>Private Profile</h5>
                            <span class="form-header">Position</span>
                            <b-form-input v-model="form.profile.private.position"></b-form-input>
                            <span class="form-header">Purpose</span>
                            <b-form-textarea v-model="form.profile.private.purpose" rows="3" max-rows="8"></b-form-textarea>
                            <br>
                            <h5>Public Profile</h5>
                            <span class="form-header">Institution</span>
                            <b-form-input v-model="form.profile.public.institution"></b-form-input>
                            <span class="form-header">Biography</span>
                            <b-form-textarea v-model="form.profile.public.bio" row="3" max-rows="8"></b-form-textarea>

                            <br>
                            <h5>Associated Accounts</h5>
                            <span class="form-header">Google</span>
                            <b-form-input v-if="form.ext" v-model="form.ext.googleid"/>
                            <span class="form-header">ORCID</span>
                            <b-form-input v-if="form.ext" v-model="form.ext.orcid"/>
                            <span class="form-header">Globus</span>
                            <b-form-input v-if="form.ext" v-model="form.ext.globus"/>
                            <span class="form-header">Github</span>
                            <b-form-input v-if="form.ext" v-model="form.ext.github"/>
                            <hr>
                            <h5>Times</h5>
                            <pre style="font-size: 80%">{{form.times}}</pre>
                        </b-col>
                    </b-row>
                </div>
                <template #modal-footer="{cancel}">
                    <div class="float-left mr-auto">
                        <b-button v-if="mode == 'ui'" @click="switchToJSON" variant="secondary">Show JSON</b-button>
                        <b-button v-if="mode == 'json'" @click="switchToUI" variant="secondary">Show UI</b-button>
                    </div>
                    <b-button variant="secondary" @click="cancel()">Cancel</b-button>
                    <b-button variant="primary" ref="okBTN" @click="submitUser">Submit</b-button>
                </template>
            </b-modal>
        </b-row>
    </b-container>
</div>
</template>

<script>
import Vue from 'vue'
const lib = require('@/lib')
let queryDebounce;
export default {
    components : {
        editor : require('vue2-ace-editor'),
    },

    data () {
        return {
            users: [],
            currentPage: 1,
            query: "",
            perPage: 50,
            totalrowCount : 500,
            fields: [
                "sub",
                "username",
                "fullname",
                "active",
                "email",
                {key: 'profile.public.institution',label: 'instituition'},
                {key: 'profile.private.position',label: "position"}
            ],
            scopeCatalog: {
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
            mode: "ui",
            form: null,
            json: null,
            config: Vue.config,
        }
    },
    mounted() {
        //TODO - only load users in the page
        // this.$http.get(Vue.config.auth_api+"/users").then(res=>{
        //     this.users = res.data;
        // }).catch(err=>{
        //     console.error(err.response);
        //     this.$notify({type: "error", text: err});
        // });
        this.load();
    },
    watch: {
        query() {
            this.load();
        },
        currentPage() {
            this.load();
        }
    },
    methods : {
        load() {
            let skip = 0;
            const limit = 50;
            if(this.currentPage > 1 && !this.query) skip = 50 * (this.currentPage - 1);
            this.$http.get(Vue.config.auth_api+'/users/query', {params:{
                q: this.query,
                skip,
                limit,
            }}).then(res=>{
                this.totalrowCount = res.data.count;
                this.users = res.data.users;
            }).catch(err=>{
                console.error(err.response);
                this.$notify({type: "error", text: err});
            });
        },
        rowClass(item, type) {
            if (!item || type !== 'row') return;
            if(this.form && this.form._id == item._id) return 'table-primary';
        },

        closeModal: function() {
            this.$root.$emit('bv::hide::modal', 'modal-useredit');
        },

        switchToUI() {
            const form = JSON.parse(this.json.toString());
            Object.assign(this.form, form);
            this.convertArrayScopesToBoolean();
            this.mode = "ui";
        },

        switchToJSON() {
            this.convertBooleanScopesToArray();
            delete this.form._scopes;
            this.json = JSON.stringify(this.form, null, 4);
            this.mode = "json";
        },

        select(user) {
            console.dir(user);

            this.form = JSON.parse(JSON.stringify(user)); //copy
            this.mode = "ui";

            //for really old users
            if(!this.form.profile) this.form.profile = {};
            if(!this.form.profile.public) this.form.profile.public = {};
            if(!this.form.profile.private) this.form.profile.private = {};

            this.convertArrayScopesToBoolean();
        },

        convertArrayScopesToBoolean() {
            //construct alternative _scopes object to hold checkboxes
            this.form._scopes = {};
            for(const service in this.scopeCatalog) {
                this.form._scopes[service] = {};
                for(const key in this.scopeCatalog[service]) {
                    this.form._scopes[service][key] = (this.form.scopes[service] && this.form.scopes[service].includes(key));
                }
            }
        },

        convertBooleanScopesToArray() {
            //convert checkboxes back to normal scopes
            for(const service in this.scopeCatalog) {
                for(const key in this.scopeCatalog[service]) {
                    if(!this.form.scopes[service]) this.form.scopes[service] = [];
                    const tags = this.form.scopes[service];
                    if(this.form._scopes[service][key]) {
                        //make sure it's set
                        if(!tags.includes(key)) tags.push(key);
                    } else {
                        //make sure it's not set
                        const idx = tags.indexOf(key);
                        if(~idx) tags.splice(idx, 1);
                    }
                }
            }
        },

        submitUser(e) {
            //e.preventDefault();

            //make sure we are in ui mode
            if(this.mode == "json") this.switchToUI();

            //TODO.. validate

            this.convertBooleanScopesToArray();

            //this.form.ext.openids[0] = this.openids;
            this.$http.put(Vue.config.auth_api+"/user/"+this.form.sub, this.form).then(res=>{
                this.$notify({type: "success", text: res.data.message});

                this.closeModal();

                const user = this.users.find(u=>u.sub == this.form.sub);
                Object.assign(user, this.form);

            }).catch(this.handleError);
        },

        handleError(err) {
            console.error(err);
            if(err.response && err.response.data && err.response.data.message) {
                this.$notify({type: "error", text: err.response.data.message});
            }
        },

        editorInit(editor) {
            lib.editorInit(editor, ()=>{
                //nothing to add..
            });
        },
        clearQuery() {
            this.query = ''
            this.changeQuery();
        },

        changeQueryDebounce() {
            clearTimeout(queryDebounce);
            queryDebounce = setTimeout(this.changeQuery, 300);
        },

        changeQuery() {
            if(!this.datatypes) return setTimeout(this.changeQuery, 300);
            sessionStorage.setItem("users.query", this.query);
            this.load();
        },
    },

}

</script>
<style scoped>
/deep/ h5 {
    padding-bottom: 5px;
    margin-bottom: 10px;
    opacity: 0.5;
    border-bottom: 1px solid #ddd;
    font-size: 120%;
}
.form-header {
    margin-top: 7px;
}
</style>>