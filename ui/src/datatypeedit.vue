<template>
<div>
    <div class="page-header">
        <b-container>
            <!--
            <p style="float: right">
                <b-button size="sm" variant="outline-secondary" href="https://brainlife.io/docs/user/datatypes" target="doc">
                    <icon name="book"/> Documentation
                </b-button>
            </p>
            -->
            <h4 style="margin-right: 150px">{{datatype.name||'No name'}}</h4>
        </b-container>
    </div>
    <div class="page-content">
        <br>
        <b-form @submit="submit">
        <b-container>
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Name</span>
                </b-col> 
                <b-col cols="9">
                    <b-input type="text" v-model="datatype.name" placeholder="Datatype Name"/>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Description</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-form-textarea :rows="2" v-model="datatype.desc" placeholder="Enter description for this datatype." required/>
                    </p>
                </b-col>
            </b-row>
            
            <b-row>
                <b-col cols="3">
                    <span class="form-header">README</span>
                </b-col> 
                <b-col cols="9">
                    <b-form-textarea :rows="4" :max-rows="20" v-model="datatype.readme" placeholder="Enter extended README content"/>
                    <p>
                        <small class="text-muted">in <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank">markdown format</a></small>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Administrators</span>
                </b-col> 
                <b-col cols="9">
                    <contactlist v-model="datatype.admins"></contactlist>
                    <p class="text-muted"><small>Users who can update the datatype</small></p>
                </b-col>
            </b-row>


            <b-row>
                <b-col cols="3">
                    <span class="form-header">Files/Dirs</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <small>Specify list of expected files / directories for this datatype</small>
                    </p>
                    <!--I can't use file.id as v-for :key because we let user update it-->
                    <div v-for="(file, index) in datatype.files" :key="index" style="background-color: #fff; padding: 10px; margin: 10px;">
                        <b-row>
                            <b-col cols="4">
                                <b-input-group prepend="ID">
                                    <b-form-input type="text" v-model="file.id" placeholder="ID used to reference this input" trim/>
                                </b-input-group>
                                <br>
                                <input type="checkbox" v-model="file.required"> Required</input>
                            </b-col>
                            <b-col cols="7">
                                <b-form-textarea :rows="2" v-model="file.desc" placeholder="Enter description for this file/dir."/>
                                <br>
                                <b-input-group>
                                    <b-input-group-prepend is-text>Filename</b-input-group-prepend>
                                    <b-input type="text" v-model="file.filename" placeholder="filename" trim/>
                                </b-input-group>
                                <br>
                                <b-input-group>
                                    <b-input-group-prepend is-text>Dirname</b-input-group-prepend>
                                    <b-input type="text" v-model="file.dirname" placeholder="dirname" trim/>
                                </b-input-group>
                                <small>Enter either filename or dirname (not both)</small>
                                <br>
                            </b-col>
                            <b-col cols="1">
                                <div class="button" @click="remove_file(file)" style="float: right;"><icon name="trash"/></div>
                            </b-col>
                        </b-row>

                    </div>
                    <b-btn @click="add_file" size="sm">Add</b-btn>
                    <br>
                    <br>
                </b-col>
            </b-row>

            <b-row v-if="uis">
                <b-col cols="3">
                    <span class="form-header">Visualizers</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <small>Select visualizers that supports this datatype</small>
                    </p>
                    <div style="background-color: #fff; padding: 15px;">
                        <b-row>
                            <b-col cols="6" v-for="ui in uis" :key="ui._id">
                                <b-form-checkbox-group v-model="datatype.uis" style="clear: both;">
                                    <!--<img :src="ui.avatar" height="35" style="float: right"/>-->
                                    <b-form-checkbox :value="ui._id">
                                        {{ui.name}} <!--<small>{{ui.ui}}</small>-->
                                        <br><small>{{ui.desc}}</small>
                                    </b-form-checkbox> 
                                </b-form-checkbox-group>
                            </b-col>
                        </b-row>
                    </div>
                    <br>
                </b-col>
            </b-row>

            <b-row v-if="datatype._id">
                <b-col cols="3">
                    <span class="form-header">Sample Datasets</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <small>List of datasets that should be used as sample. Please select public datasets.</small>
                    </p>
                    <div>
                        <div v-for="sample in datatype.samples" style="background-color: white; padding: 5px; margin-bottom: 5px;">
                            <div class="button" style="float: right;" @click="remove_sample(sample)"><icon name="trash"/></div>
                            {{sample}} 
                        </div>
                        <b-btn @click="add_sample" size="sm">Add</b-btn>
                    </div>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Datatype Tags</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <small>List of official datatypes tags that App developers should use for this datatype</small>
                    </p>
                    <div v-for="(tag, index) in datatype.datatype_tags" :key="index" style="background-color: #fff; padding: 10px; margin: 10px;">
                        <b-row>
                            <b-col cols="4">
                                <b-input-group>
                                    <b-input-group-prepend is-text>Tag</b-input-group-prepend>
                                    <b-input type="text" v-model="tag.datatype_tag" placeholder="datatype tag"/>
                                </b-input-group>
                            </b-col>
                            <b-col cols="7">
                                <b-form-textarea :rows="2" v-model="tag.desc" placeholder="Enter description for this tag"/>
                            </b-col>
                            <b-col cols="1">
                                <div class="button" @click="remove_tag(tag)" style="float: right;"><icon name="trash"/></div>
                            </b-col>
                        </b-row>
                    </div>
                    <b-btn @click="add_tag" size="sm">Add</b-btn>
                    <br>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">BIDS Export</span>
                </b-col> 
                <b-col cols="9">
                    <b-form-textarea :rows="4" :max-rows="20" v-model="datatype._bids" placeholder="Enter JSON specification for BIDS export"/>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Validator / Normalizer</span>
                </b-col> 
                <b-col cols="9">
                    <b-input-group prepend="Org/Reponame">
                        <b-input type="text" v-model="datatype.validator" placeholder="enter org/reponame"/>
                        <b-input-group-prepend is-text>branch/tag</b-input-group-prepend>
                        <b-input type="text" v-model="datatype.validator_branch" placeholder="master"/>
                    </b-input-group>
                    <p class="text-muted"><small>Required if you want to allow user to upload dataset with this datatype through UI</small></p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Group Analysis</span>
                </b-col> 
                <b-col cols="9">
                    <input type="checkbox" v-model="datatype.groupAnalysis"> (experimental) This datatype will be available for group analysis </input>
                    <small>The maximum amount of data will be limited to 64MB per data object</small>
                    <br>
                </b-col>
            </b-row>

            <div class="page-footer">
                <b-container>
                    <b-button variant="secondary" @click="cancel">Cancel</b-button>
                    <b-button variant="primary" type="submit" :disabled="submitting"><icon v-if="submitting" name="cog" spin/> Submit</b-button>
                </b-container>
            </div>
                
            <br>
            <br>
            <br>
        </b-container>
        <div v-if="config.debug">
            <pre>{{JSON.stringify(datatype, null, 4)}}</pre>
        </div>
        </b-form>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'

import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'
import VueMarkdown from 'vue-markdown'

export default {
    components: { contactlist, pageheader, VueMarkdown },
    data () {
        return {
            datatype: {
                _id: null, 
                name: "neuro/whatever",
                desc: "",
                admins: [Vue.config.user.sub],

                _bids: "",
                datatype_tags: [],
                files: [],
                samples: [],
                uis: [ "5be75b31e15a02914a4be8f0" ], //(show fileviewer by default)
                validator: "",
                validator_branch: "",

                groupAnalysis: false,
            },

            uis: [], //list of all UIs

            submitting: false,

            config: Vue.config,
        }
    },

    mounted: function() {
        //don't forget to add remove listener on destroyed (debug loader won't destroy parent.. so you will end up with bunch of the same event firing)
        this.$root.$on('datasetselecter.submit', datasets=>{
            for(let dataset_id in datasets) {
                this.datatype.samples.push(dataset_id);  //TODO dedupe it?
            }
        });

        this.$http.get('datatype/ui').then(res=>{
            this.uis = res.data.uis;
        });    

        if(this.$route.params.id !== '_') {
            //loading existing datatype to update
            this.$http.get('datatype', {params: {
                find: JSON.stringify({_id: this.$route.params.id})
            }}).then(res=>{
                this.datatype = res.data.datatypes[0];
                if(this.datatype.bids) {
                    this.datatype._bids = JSON.stringify(this.datatype.bids, null, 4);
                } else {
                    this.datatype._bids = "";
                }
		if(!this.datatype.validator) this.datatype.validator = "";

                //unpopulate uis
                this.datatype.uis = this.datatype.uis.map(ui=>ui._id);
            });
        } 
    },

    destroyed() {
        this.$root.$off('datasetselecter.submit');
    },
 
    methods: {

        cancel() {
            //if(this.datatype._id) this.$router.push('/datatypes/'+this.datatype._id);
            //else this.$router.push('/datatypes');
            this.$router.go(-1);
        },

        submit(evt) {
            evt.preventDefault();

            if(this.submitting) return; //prevent double submission..
            this.submitting = true;

            //convert _bids back to object
            try {
                if(this.datatype._bids.trim() == "") {
                    delete this.datatype.bids;
                } else {
                    this.datatype.bids = JSON.parse(this.datatype._bids);
                }
            } catch(err) {
                alert(err);
                this.submitting = false;
                return;
            }

            //clean up some fields
            this.datatype.validator = this.datatype.validator.trim();

            //validate
            let error = null;
            if(this.datatype.validator && !this.datatype.validator.startsWith("brainlife/validator-")) {
                error = "validator must starts with brainlife/validator-";
            }
            this.datatype.files.forEach(file=>{
                if(file.id.includes(".")) {
                    error = "datatype file ID("+file.id+") must not contains .";
                }
                if(!file.filename && !file.dirname) {
                    error = "please specify either filename or dirname for each files";
                }
                if(file.filename && file.dirname) {
                    error = "please specify either filename or dirname for each files (not both)";
                }
            });

            if(error) {
                this.$notify({type: "error", text: error});
                this.submitting = false;
                return;
            }

            if(this.datatype._id) {
                //update
                this.$http.put('datatype/'+this.datatype._id, this.datatype).then(res=>{
                    //this.$router.replace('/datatype/'+this.datatype._id);
                    this.$router.go(-1);
                    this.submitting = false;
                }).catch(err=>{
                    console.error(err);
                    this.submitting = false;
                });
            } else {
                //create
                this.$http.post('datatype', this.datatype).then(res=>{
                    this.$router.replace('/datatype/'+res.data._id);
                    this.submitting = false;
                }).catch(err=>{
                    this.$notify({text: err.toString(), type: 'error' });
                    console.error(err);
                    this.submitting = false;
                });
            }
        },

        add_sample() {
            this.$root.$emit("datasetselecter.open", {datatypes: [ this.datatype._id ]});
        },
        remove_sample(sample) {
            let pos = this.datatype.samples.indexOf(sample);
            this.datatype.samples.splice(pos, 1);
        },

        add_file() {
            this.datatype.files.push({
                id: "",
                desc: "",
                required: true,
            });
        },
        remove_file(file) {
            let pos = this.datatype.files.indexOf(file);
            this.datatype.files.splice(pos, 1);
        },

        add_tag() {
            this.datatype.datatype_tags.push({
                datatype_tag: "",
                desc: "",
            });
        },
        remove_tag(tag) {
            let pos = this.datatype.datatype_tags.indexOf(tag);
            this.datatype.datatype_tags.splice(pos, 1);
        },

    },
}
</script>

<style scoped>
.page-header {
padding: 10px 20px;    
}
.page-header h4 {
opacity: 0.8;
}
.readme {
background-color: white;
max-height: 500px;
overflow: auto;
padding: 20px;
}
</style>

