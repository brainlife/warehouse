<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher"> <!-- main view -->
        <projectmenu :active="project_id"></projectmenu>
        <div class="page-content" :class="{rightopen: selected_count}">

        <div class="fixed-top">
            <div style="margin: 7px;">
                <!--
                <div class="ui fluid category search">
                    <div class="ui icon input">
                        <input class="prompt" type="text" v-model="query" placeholder="Search ...">
                        <i class="search icon"></i>
                    </div>
                    <div class="results"></div>
                </div>
                -->
                <el-row :gutter="20">
                     <el-col :span="12">
                        <el-input
                            placeholder="Filter Datasets" 
                            icon="search"
                            v-model="query">
                        </el-input>
                    </el-col>
                    <el-col :span="12">
                        <button class="ui button" @click="go('/upload')"><i class="ui icon add"></i>&nbsp;Upload</button>
                    </el-col>
                </el-row>
            </div>

            <el-row class="header">
                <!--<el-col :span="1">&nbsp;</el-col>-->
                <el-col :span="4"> Subject </el-col>
                <el-col :span="20">
                    <el-row>
                        <el-col :span="2">&nbsp;</el-col>
                        <el-col :span="6">Create Date</el-col>
                        <el-col :span="6">Datatype</el-col>
                        <el-col :span="6">Name / Desc</el-col>
                        <el-col :span="4">User Tags</el-col>
                    </el-row> 
                </el-col>
            </el-row>

            <!--
            <div class="margin20" v-if="!datasets">
                <h3> <i class="el-icon-loading"></i> Loading.. </h3>
            </div>
            -->

        </div><!--fixed-top-->

        <!--start of dataset list-->
        <div class="list" style="margin-top: 40px"> 
            <el-row class="group" v-for="(datasets, subject) in datasets_grouped" :key="subject">
                <!--
                <el-col :span="1" style="margin-top: 3px;">
                    <el-checkbox></el-checkbox>
                </el-col>
                -->
                <el-col :span="4" style="margin-top: 3px;font-weight: bold;">
                    <h5>
                        <icon name="caret-down"></icon>
                        {{subject}}
                    </h5>
                </el-col> 
                <el-col :span="20">
                    <div 
                    v-for="dataset in datasets" :key="dataset._id"
                    :class="{dataset: true, clickable: true, selected: is_selected(dataset)}"
                    @click="go('/dataset/'+dataset._id)">
                        <el-row>
                            <el-col :span="2">
                                &nbsp;&nbsp;&nbsp;
                                <div class="ui checkbox">
                                    <input type="checkbox" @click.stop="check(dataset)" :checked="is_selected(dataset)">
                                    <label></label><!-- need this somehow-->
                                </div>
                            </el-col>
                            <el-col :span="6">
                                {{dataset.create_date | date}}
                                &nbsp;
                            </el-col>
                            <el-col :span="6" :title="datatypes[dataset.datatype].desc">
                                {{datatypes[dataset.datatype].name}}
                                <tags :tags="dataset.datatype_tags"></tags> &nbsp;
                            </el-col>
                            <el-col :span="6">
                                <b>{{dataset.name}}</b>
                                {{dataset.desc}}
                            </el-col>
                            <el-col :span="4">
                                <tags :tags="dataset.tags"></tags> &nbsp;
                            </el-col>
                        </el-row>
                    </div>
                </el-col> 
            </el-row>
        </div>

        <!-- old list
        <div class="margin20">

            <table class="ui compact definition table" v-if="datasets">
            <thead>
                <tr>
                    <th style="width: 25px; background-color: #f0f0f0; box-shadow: -1px -1px 0 1px #f0f0f0;"></th>
                    <th v-if="!project_id">Project</th>
                    <th>Data Type</th>
                    <th>Metadata</th>
                    <th>Name/Desc</th>
                    <th>User Tags</th>
                    <th style="min-width: 150px;">Create Date</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="dataset in datasets" 
                    :key="dataset._id"
                    :class="{'clickable-record': true, selected: is_selected(dataset)}" 
                    @click="go('/dataset/'+dataset._id)">
                    <td @click.stop="check(dataset)">
                        <div class="ui checkbox">
                            <input type="checkbox" :checked="is_selected(dataset)">
                            <label></label>
                        </div>
                    </td>
                    <td v-if="!project_id">
                        <div class="ui green horizontal label" v-if="projects[dataset.project].access == 'public'">Public</div>
                        <div class="ui red horizontal label" v-if="projects[dataset.project].access == 'private'">Private</div>
                        {{projects[dataset.project].name}}
                    </td>
                    <td>
                        {{datatypes[dataset.datatype].name}}
                        <tags :tags="dataset.datatype_tags"></tags>
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
        </div>
        -->
        </div><!--page-content-->
    </div><!--pusher-->

    <div class="selected-view" v-if="selected_count && datatypes" style="padding: 10px 5px 0px 5px;">
        <h3 style="color: white;"><icon name="check-square" scale="1.2"></icon> {{selected_count}} Selected </h3>
        <div class="ui segments">
            <div class="ui attached segment" v-for="(_datasets, did) in group_selected" :key="did" v-if="datatypes[did]">
                <h5>{{datatypes[did].name}}</h5>
                <div class="selected-item" v-for="(dataset, id) in _datasets" :key="id" @click="go('/dataset/'+id)">
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
import projectmenu from '@/components/projectmenu'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    components: { sidemenu, tags, metadata, pageheader, projectmenu },
    data () {
        return {
            datasets: null,
            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id
            project_id: null, //project to limit search result

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
        //group datasets by subject
        datasets_grouped: function() {
            if(!this.datasets) return {};

            console.log("grouping");
            var groups = {};

            this.datasets.forEach(dataset=>{
                var subject = "nosub"; //not all datasets has subject tag
                if(dataset.meta && dataset.meta.subject) subject = dataset.meta.subject; 
                if(!groups[subject]) groups[subject] = [];
                groups[subject].push(dataset);
            });
            return groups;
        },
        
        selected_count: function() {
            return Object.keys(this.selected).length;
        },

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
        this.project_id = this.$route.params.projectid; //could be set to null

        //need to load all project in case user might click on "all"
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
        },
        '$route': function() {
            this.load(function(err) {
                if(err) console.error(err);
            });
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
            this.project_id = this.$route.params.projectid; //could be set to null
            if(this.$route.params.projectid) {
                find.project = this.$route.params.projectid;
            }
            if(this.query) {
                find.$text = {$search: this.query};
            }
            console.log("loading", find);
            this.$http.get('dataset', {params: {
                find: JSON.stringify(find),
                select: 'datatype datatype_tags project create_date name desc tags meta storage',
            }})
            .then(res=>{
                this.datasets = res.body.datasets;

                //set checked flag for each dataset
                this.datasets.forEach(dataset=>{
                    var checked = false;
                    if(this.is_selected(dataset)) checked = true;
                    Vue.set(dataset, 'checked', checked);
                });

                cb();
            }).catch(cb);
        },
        is_selected: function(dataset) {
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
            console.log("check");
            var did = dataset.datatype._id;
            if(this.selected[dataset._id]) {    
                Vue.delete(this.selected, dataset._id);
                dataset.checked = false;
            } else {
                Vue.set(this.selected, dataset._id, dataset);
                dataset.checked = true;
            }
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
            console.log("remove select", dataset);
            Vue.delete(this.selected, dataset._id);
            dataset.checked = false;
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

                    //TODO - figure out process name from dataset.prov
                    var process_name = "someprocess";
                    //if(dataset.prov) { }

                    //TODO - this is neuroscience specific, and I need to do a lot more thinking on this
                    var dataname = datatype.name.split("/")[1];
                    console.dir(datatype.files);
                    datatype.files.forEach(file=>{
                        symlink.push({
                            src: download_path+"/"+(file.filename||file.dirname),
                            dest: "download/derivatives/"+process_name+"/"+subject+"/"+dataname+"/"+subject+"_"+(file.filename||file.dirname),
                        });
                    });

                    /*
                    //TODO I should probably switch by datatype._id?
                    switch(datatype.name) {
                    case "t1": //deprecated
                    case "neuro/anat":
                        datatype.files.forEach(file=>{
                            symlink.push({
                                src: download_path+"/"+file.filename,
                                dest: "download/derivatives/"+process_name+"/"+subject+"/anat/"+subject+"_"+file.filename,
                            });
                        });
                        break;
                    case "dwi": //deprecated
                    case "neuro/dwi":
                        datatype.files.forEach(file=>{
                            symlink.push({
                                src: download_path+"/"+file.filename,
                                dest: "download/derivatives/"+process_name+"/"+subject+"/dwi/"+subject+"_b-XXXX_"+file.filename,
                            });
                        });
                        break;
                    default:
                        //put all else somewhere..
                        datatype.files.forEach(file=>{
                            symlink.push({
                                src: download_path+"/"+file.filename,
                                dest: "download/derivatives/"+process_name+"/"+subject+"/dwi/"+subject+"_"+file.filename,
                            });
                        });
                    }
                    */
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
.page-content {
    margin-left: 200px;
    transition: right 0.2s;
    box-shadow: 3px 3px 6px gray;
}
.page-content.rightopen {
    right: 250px;
}
.selected {
    transition: color, background-color 0.2s;
    background-color: #2185d0;
    color: white;
}
.selected-view {
    /*background-color: #2185d0;*/
    background-color: #444;
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

.header,
.list .group {
    padding: 9px 10px 11px 10px;
}

.header {
    background-color: #444;
    color: #999;
    font-weight: bold;
    text-transform: uppercase;
}
.list .group {
    /*margin-bottom: 1px;*/
    font-size: 12px;
    padding-bottom: 0px;
}
.list .dataset {
    padding: 5px 0px;
    background-color: #fff;
    margin-bottom: 1px;
    transition: background-color 0.2s;
}
.list .dataset.clickable:hover {
    background-color: #ddd;
}
.list .dataset.selected,
.list .dataset.selected:hover {
    background-color: #2693ff;
}
.fixed-top {
    position: fixed;
    left: 290px;
    top: 0px;
    right: 0px;
    z-index: 5;
    transition: right 0.2s;
}
.rightopen .fixed-top {
    right: 250px;
}
</style>

