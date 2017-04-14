<template>
<div>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher"> <!-- main view -->
        <pageheader :user="config.user"></pageheader>
        <div class="project-view">
            <h4>Private Projects</h4>
            <p v-for="(project, project_id) in projects" :class="{active: project.name == 'o3d222'}">
                {{project.name}}
            </p>
            <h4>Public Projects</h4>
            <p v-for="(project, project_id) in projects" :class="{active: project.name == 'o3d'}">
                {{project.name}}
            </p>
        </div>
        <div class="page-content" :class="{rightopen: selected_count}">
        <div class="margin20">
            <div class="ui fluid category search">
                <button class="ui right floated primary button" @click="go('/datasets/upload')">
                    <i class="ui icon add"></i> Upload
                </button>
                <div class="ui icon input">
                    <input class="prompt" type="text" v-model="query" placeholder="Search ...">
                    <i class="search icon"></i>
                </div>
                <div class="results"></div>
            </div>

            <h3 v-if="!datasets"> <i class="el-icon-loading"></i> Loading..  </h3>

            <table class="ui compact definition table" v-if="datasets">
            <thead>
                <tr>
                    <th style="width: 25px; background-color: #f0f0f0; box-shadow: -1px -1px 0 1px #f0f0f0;"></th>
                    <th>Data Type</th>
                    <th>Project</th>
                    <th>Metadata</th>
                    <th>Name/Desc</th>
                    <th>User Tags</th>
                    <th style="min-width: 150px;">Create Date</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="dataset in datasets" 
                    :class="{'clickable-record': true, selected: is_selected(dataset)}" 
                    @click="go('/dataset/'+dataset._id)">
                    <td @click.stop="check(dataset)">
                        <div class="ui checkbox">
                            <input type="checkbox" :checked="is_selected(dataset)">
                            <label></label><!-- need this somehow-->
                        </div>
                    </td>
                    <td>
                        {{datatypes[dataset.datatype].name}}
                        <tags :tags="dataset.datatype_tags"></tags>
                    </td>
                    <td>
                        <div class="ui green horizontal label" v-if="projects[dataset.project].access == 'public'">Public</div>
                        <div class="ui red horizontal label" v-if="projects[dataset.project].access == 'private'">Private</div>
                        {{projects[dataset.project].name}}
                    </td>
                    <td>
                        <metadata v-if="dataset.meta" :metadata="dataset.meta"></metadata>
                    </td>
                    <td>
                        <b>{{dataset.name}}</b><br>
                        <small>{{dataset.desc}}</small>
                    </td>
                    <td>
                        <tags :tags="dataset.tags"></tags>
                    </td>
                    <td>
                        <small>{{dataset.create_date | date}}</small>
                    </td>
                </tr>
            </tbody>
            </table>

<!--
<el-table
:data="datasets"
default-expand-all
style="width: 100%">
<el-table-column
type="selection"
width="55">
</el-table-column>
<el-table-column type="expand">
<template scope="props">
<p>State: {{ props.row.state }}</p>
<p>City: {{ props.row.city }}</p>
<p>Address: {{ props.row.address }}</p>
<p>Zip: {{ props.row.zip }}</p>
</template>
</el-table-column>
<el-table-column
label="Date"
prop="date">
</el-table-column>
<el-table-column
label="Name"
prop="name">
</el-table-column>
</el-table>            
-->


        </div><!--margin20-->
        </div><!--page-content-->
    </div><!--pusher-->

    <div class="selected-view" v-if="selected_count && datatypes" style="padding: 10px 5px 0px 5px;">
        <h3 style="color: white;padding-top: 10px;"><icon name="check"></icon> {{selected_count}} Selected </h3>
        <div class="ui segments">
            <div class="ui attached segment" v-for="(_datasets, did) in group_selected" v-if="datatypes[did]">
                <h5>{{datatypes[did].name}}</h5>
                <div class="selected-item" v-for="(dataset, id) in _datasets" @click="go('/dataset/'+id)">
                    <p>
                        <i class="trash icon right floated" @click.stop="remove_selected(dataset)"></i>
                        <small>
                            {{dataset.name}}
                            <tags :tags="dataset.datatype_tags"></tags>
                        </small>
                    </p>
                </div>
            </div>
        </div>
        <el-button-group style="float: right;">
            <el-button size="small" icon="delete" @click="clear_selected()">Clear Selection</el-button>
            <el-button size="small" type="primary" icon="download" @click="download()"> <i class="download icon"></i> Download </el-button>
        </el-button-group>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import tags from '@/components/tags'
import metadata from '@/components/metadata'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    name: 'datasets',
    components: { sidemenu, tags, metadata, pageheader },
    data () {
        return {
            datasets: null,
            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id

            //query loading
            query: "",
            query_dirty: 1,
            loading: false,

            //cache
            datatypes: null,
            projects: null, 

            config: Vue.config,
        }
    },

    computed: {
        
        selected_count: function() {
            //var total = 0;
            //for(var did in this.selected) {
            //    total += Object.keys(this.selected[did]).length;
            //}
            return Object.keys(this.selected).length;
        },

        /*
        filtered_datasets: function() {
            if(!this.query) return this.datasets;

            return this.datasets.filter((dataset)=>{
                var lquery = this.query.toLowerCase();
                if(~dataset.name.toLowerCase().indexOf(lquery)) return true;
                if(~dataset.desc.toLowerCase().indexOf(lquery)) return true;
                if(~dataset.project.name.toLowerCase().indexOf(lquery)) return true;
                if(~dataset.datatype.name.toLowerCase().indexOf(lquery)) return true;

                if(~dataset.tags.indexOf(lquery)) return true; //TODO need to do something a bit smarter..
                if(~dataset.datatype_tags.indexOf(lquery)) return true; //TODO need to do something a bit smarter..
                return false;
            });
        },
        */

        group_selected: function() {
            var groups = {};
            for(var id in this.selected) {
                var selected = this.selected[id];
                var did = selected.datatype;
                if(groups[did] === undefined) groups[did] = {};
                groups[did][id] = selected;
            }
            return groups;
        }
    },

    mounted: function() {
        this.$http.get('project', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

            return this.$http.get('datatype', {params: {
                //service: "_upload",
            }})
        })
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });

            setTimeout(this.check_query, 200);
        }).catch(err=>{
            console.error(err);
        });

        this.selected = JSON.parse(localStorage.getItem('datasets.selected')) || {};
    },

    watch: {
        query: function(val) {
            this.query_dirty = Date.now();
        }
    },

    methods: {
        check_query: function() {
            //debounce to 300 msec
            if(!this.loading && this.query_dirty && this.query_dirty < (Date.now()-300)) {
                this.query_dirty = null;
                this.loading = true;
                this.load(err=>{
                    this.loading = false;
                    if(err) console.error(err);
                    else this.query_dirty = false;
                    setTimeout(this.check_query, 500);
                });
            } else {
                //console.log("waiting", this);
                setTimeout(this.check_query, 1000);
            }
        },

        load: function(cb) {
            console.log("loading datasets with query", this.query);
            var find = {
                removed: false,
            }
            if(this.query) {
                find.$text = {$search: this.query};
            }
            this.$http.get('dataset', {params: {
                find: JSON.stringify(find),
                select: 'datatype datatype_tags project create_date name desc tags meta',
            }})
            .then(res=>{
                this.datasets = res.body.datasets;
                cb();
            }).catch(cb);
        },
        is_selected: function(dataset) {
            //if(this.selected[dataset.datatype._id] === undefined) return false;
            //if(this.selected[dataset.datatype._id][dataset._id] === undefined) return false;
            if(this.selected[dataset._id] === undefined) return false;
            return true;
        },
        opendataset: function(dataset) {
            console.dir(dataset);
        },
        go: function(path) {
            this.$router.push(path);
        },
        check: function(dataset) {
            var did = dataset.datatype._id;
            //if(this.selected[did] === undefined) Vue.set(this.selected, did, {});
            //if(this.selected[did][dataset._id]) Vue.delete(this.selected[did], dataset._id);
            //else Vue.set(this.selected[did], dataset._id, dataset);
            if(this.selected[dataset._id]) Vue.delete(this.selected, dataset._id);
            else Vue.set(this.selected, dataset._id, dataset);
            this.persist_selected();
        },
        persist_selected: function() {
            localStorage.setItem('datasets.selected', JSON.stringify(this.selected));
        },
        clear_selected: function() {
            this.selected = {};
            this.persist_selected();
        },
        remove_selected: function(dataset) {
            //var did = dataset.datatype._id;
            //Vue.delete(this.selected[did], dataset._id);
            Vue.delete(this.selected, dataset._id);
            this.persist_selected();
        },

        download: function() {
            var download_instance = null;
            //first create an instance to download things to
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.download",
                config: {
                    selected: this.selected,
                }
            }).then(res=>{
                download_instance = res.body;
                console.log("instance created", download_instance);

                //create config to download all selected data from archive
                var download = [];
                //for(var datatype_id in this.selected) {
                    //for(var dataset_id in this.selected[datatype_id]) {
                    for(var dataset_id in this.selected) {
                        download.push({
                            url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                            untar: "gz",
                            dir: "download/"+dataset_id, //TODO - organize into BIDS?
                        });
                    }
                //}
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: download_instance._id,
                    name: "brainlife.download.stage",
                    service: "soichih/sca-product-raw",
                    config: { download },
                })
            }).then(res=>{
                var download_task = res.body.task;

                //submit another sca-product-raw service to organize files 
                var symlink = [];
                for(var dataset_id in this.selected) {
                    var dataset = this.selected[dataset_id]; 
                    var datatype = this.datatypes[dataset.datatype];
                    var datatype_tags = dataset.datatype_tags;

                    var subject = null;
                    if(dataset.meta && dataset.meta.subject) subject = dataset.meta.subject;

                    var download_path = "../"+download_task._id+"/download/"+dataset_id;

                    //TODO I should probably switch by datatype._id?
                    switch(datatype.name) {
                    case "t1": //deprecated
                    case "neuro/anat":
                        datatype.files.forEach(file=>{
                            symlink.push({
                                src: download_path+"/"+file.filename,
                                dest: "download/derivatives/someprocess/"+subject+"/anat/"+subject+"_"+file.filename,
                            });
                        });
                        break;
                    case "dwi": //deprecated
                    case "neuro/dwi":
                        datatype.files.forEach(file=>{
                            symlink.push({
                                src: download_path+"/"+file.filename,
                                dest: "download/derivatives/someprocess/"+subject+"/dwi/"+subject+"_b-XXXX_"+file.filename,
                            });
                        });
                        break;
                    default:
                    }
                }
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: download_instance._id,
                    name: "brainlife.download.bids",
                    service: "soichih/sca-product-raw",
                    config: { symlink },
                    deps: [ download_task._id ], 
                })
            }).then(res=>{
                this.bids_task = res.body.task;
                this.$router.push("/download/"+download_instance._id);

            });
        }
    },
}
</script>

<style scoped>
.rightopen {
    right: 250px;
}
.selected {
    transition: color, background-color 0.2s;
    background-color: #2185d0;
    color: white;
}
.selected-view {
    background-color: #2185d0;
    /*box-shadow: inset 3px 0px 3px #aaa;*/
    overflow-x: hidden;
    position: fixed;
    right: 0px;
    width: 250px;
    top: 50px;
    bottom: 0px;
}
.selected-view .selected-item:hover {
    background-color: #eee;
    cursor: pointer;
}
.page-content {
    margin-left: 200px;
}
.project-view {
    position: fixed;
    top: 50px;
    bottom: 0px;
    width: 200px;
    background-color: #3b5f84;
    color: white;
}
.project-view h4 {
    padding: 20px;
    opacity: 0.7;
    text-transform: uppercase;
    margin-bottom: 0px;
}
.project-view p {
    margin: 0px;
    padding: 10px 20px;
}
.project-view p:hover {
    cursor: pointer;
    background-color: black;
}
.project-view p.active {
    background-color: #2185d0;
}

</style>

