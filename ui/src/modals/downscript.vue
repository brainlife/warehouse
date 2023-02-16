<template>
<b-modal :no-close-on-backdrop='true' title="Download Data" ref="modal" size="lg">
    <div v-if="page == 'filter'">
        <div v-if="!inventory.subjects">Loading Inventory ...</div>
        <div v-if="inventory.subjects">
                <p class="text-muted" style="margin-bottom: 5px;">Please select datatypes you'd like to download</p>
                <div v-for="entry in inventory.datatypes" :key="entry.name">
                    <b-row>
                        <b-col cols="1">
                            <b-form-checkbox v-model="entry.include"/>
                        </b-col>
                        <b-col>
                            <datatypetag :datatype="entry.datatype" :clickable="false"/> <small>({{entry.count}} objs | {{entry.size | filesize}})</small>
                        </b-col>
                    </b-row>
                </div>
                <br>

                <p class="text-muted" style="margin-bottom: 5px;">Please select subjects you'd like to download</p>
                <v-select v-model="subjects" 
                    :options="inventory.subjects" 
                    label="label"
                    :multiple="true" 
                    placeholder="Leave this blank to download ALL subject"/>
                <b-button-group style="float: right; margin-top: 5px">
                    <b-button variant="light" size="sm" @click="selectAllSubjects()">Add all subjects</b-button>
                    <b-button variant="light" size="sm" v-if="subjects.length" @click="subjects = []">Remove all subjects</b-button>
                </b-button-group>
                <br>
                <br>
                <small>Only the objects that matches selected datatype *and* subjects will be downloaded.</small>
            </div>
        </div>
    </div>
    <div v-if="page == 'download'">
        <div v-if="single_dataset_url">
            <b-row>
                <b-col>
                    <p style="opacity: 0.8; min-height: 40px">Click the below button to download to your browser.</p>
                    <b-button block variant="secondary" @click="direct_download">
                        <icon name="download"/> Download
                    </b-button>
                </b-col>
                <b-col cols="7" v-if="query && query._id">
                    <p style="opacity: 0.8; min-height: 40px;">Or, copy and paste the following command where you want to download this data
                        using <a href="https://brainlife.io/docs/cli/download/">Brainlife CLI</a>.</p>
                    <pre class="code">bl data download --id {{query._id[0]}}</pre>
                </b-col>
            </b-row>
        </div>
        <div v-if="single_dataset_url">
            <br>
            <br>
            <center style="opacity: 0.7; font-weight: bold;">
                <span style="opacity: 0.5">-</span> 
                OR
                <span style="opacity: 0.5">-</span> 
            </center>
            <br>
        </div>

        <div class="subsection">
            <p class="text-muted">
                Copy and paste the following command to your terminal on a computer where you want to download selected data objects.
                This command will also create a directory (/bids) containing symbolic links to organize downloaded files into 
                a <a href="http://bids.neuroimaging.io" target="_bids">BIDS</a> derivative format (<b>for BIDS compatible datatypes</b>).
            </p>
            <p class="text-muted">
                Windows users need to install <a href="https://www.windowscentral.com/how-install-bash-shell-command-line-windows-10" target="_blank">BASH shell</a> before running the command.
            </p>
            <div class="downscript-area">
                <textarea class="downscript" ref="downscript" readonly>{{downscript}}</textarea>
                <b-btn @click="copy_downscript" size="sm" variant="secondary" class="downscript-copy"><icon name="copy"/></b-btn>
            </div>
            <small style="position: relative; top: -15px; margin-left: 10px;">This command includes your temporarly JWT token. Please do not share.</small>
        </div>
    </div>
    <div slot="modal-footer">
        <b-button variant="primary" @click="next" v-if="filter && page == 'filter'">Next</b-button>
        <b-button @click="back" v-if="filter && page != 'filter'">Back</b-button>
        <b-button @click="close" v-if="!filter">Cancel</b-button>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import datatypetag from '@/components/datatypetag'

export default {
    components: {
        datatypetag,
    },

    data() {
        return {
            page: 'download',
            filter: false,
            query: {},

            inventory: {
                subjects: null, //list of unique subjects
                datatypes: null, //list of unique datatypes
            },
            subjects: [], //subjects to download

            jwt: null, //stripped down jwt to use

            config: Vue.config,
        }
    },

    destroyed() {
        this.$root.$off("downscript.open");
    },

    computed: {

        single_dataset_url() {
            if(this.query && this.query._id && this.query._id.length == 1) {
                const dataset_id = this.query._id[0];
                let url = Vue.config.api+'/dataset/download/'+dataset_id;
                if(Vue.config.user) url += '?at='+this.jwt; //guest can download without jwt for published datasets
                return url;
            }
            return null; 
        },

        downscript() {
            if (!this.query._id) {
                return;
            }
            const headers = "-H 'Content-Type: application/json' -H 'Authorization: Bearer " + this.jwt + "'";
            const query = JSON.stringify({limit: this.query._id.length, find: this.query});

            return `curl ${headers} -d '${query}' -X POST "${Vue.config.api}/dataset/downscript" | bash`;
        },
    },

    mounted() {
        this.$root.$on("downscript.open", opts=>{
            this.query = opts.query;

            //you can set filter to true to allow user to filter down data objects
            this.filter = opts.filter;
            if(this.filter) {
                this.page = "filter";
                this.inventory.subjects = null;
                this.inventory.datatypes = null;
                this.subjects = []; //blank means all
                this.queryInventory();
            } else {
                this.page = "download";
            }

            //issue download token
            console.log("issuing token for download");
            this.$http.post(Vue.config.auth_api+"/refresh", {gids: [], scopes: {}, clearProfile: true}).then(res=>{
                this.jwt = res.data.jwt;
                this.$refs.modal.show()
            }).catch(console.error);
        });
    },

    methods: {
        close() {
            this.$refs.modal.hide();
        },

        selectAllSubjects() {
            this.subjects = this.inventory.subjects;
        },

        direct_download() {
            this.$notify({type: 'info', text: "Download will start soon.."});
            document.location = this.single_dataset_url;
            this.$refs.modal.hide();
        },

        copy_downscript() {
            var copyText = this.$refs.downscript;
            copyText.select();
            document.execCommand("copy");
            this.$notify({type: 'success', text: "Copied to your clipboard"});
        },

        queryInventory() {
            this.$http.get('/dataset/inventory', {params: {find: JSON.stringify(this.query)}}).then(res=>{
                //console.dir(res.data);
                
                //this.inventory = res.data;
                this.inventory.subjects = [];
                this.inventory.datatypes = [];
                res.data.forEach(rec=>{
                    const subject = rec._id.subject;
                    let entry = this.inventory.subjects.find(it=>it.subject == subject);
                    if(entry) {
                        entry.count += rec.count;
                        entry.size += rec.size;
                    } else {
                        //new
                        this.inventory.subjects.push({subject, count: rec.count, size: rec.size});
                    }

                    const datatype = rec._id.datatype;
                    entry = this.inventory.datatypes.find(it=>it.datatype == datatype);
                    if(entry) {
                        entry.count += rec.count;
                        entry.size += rec.size;
                    } else {
                        this.inventory.datatypes.push({datatype, include: false, count: rec.count, size: rec.size});
                    }
                });

                //construct better option label for subjects list
                this.inventory.subjects.forEach(entry=>{
                    entry.label = entry.subject + ` (${entry.count} obj)`;
                });
            });
        },

        back() {
            this.page = "filter";
        },
        next() {
            const datatype_ids = this.inventory.datatypes.filter(it=>it.include).map(it=>it.datatype);

            if(!datatype_ids.length) {
                alert("Please select at least one datatype to download");
                return;
            }

            this.page = "download";

            Vue.set(this.query, 'datatype', {$in: datatype_ids});
            if(this.subjects.length) {
                Vue.set(this.query, 'meta.subject', {$in: this.subjects.map(it=>it.subject)});
            } else {
                Vue.set(this.query, 'meta.subject', undefined);
            }
        },
    },
} 
</script>
<style scoped>
.downscript {
    font-family: monospace; 
    background-color: #eee; 
    white-space: pre-wrap; 
    font-size: 68%;
    padding: 10px;
    overflow: auto;
    margin-bottom: 10px;
    width: 100%;
    height: 180px;
    border: none;
    color: #000; /*only needed for firefox?*/
}

.downscript-area {
    position: relative;
}
.downscript-copy {
    position: absolute;
    right: 20px;
    top: 10px;
    opacity: 0;
    transition: opacity 0.3s;
}
.downscript-area:hover .downscript-copy {
    opacity: 1;
}
.code {
    padding: 10px;
    background-color: #eee;
}
</style>


