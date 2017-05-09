<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="header-content">
        <el-row :gutter="20">
             <el-col :span="12">
                <el-input
                    placeholder="Filter Datasets" 
                    icon="search"
                    v-model="query">
                </el-input>
            </el-col>
            <el-col :span="12">
                <el-button @click="go('/upload')"><icon name="upload"/> Upload Data</el-button>
            </el-col>
        </el-row>
    </div>
    <div class="ui pusher" :class="{rightopen: selected_count}">
        <projectmenu :active="project_id"></projectmenu>
        <div class="fixed-top">
            <el-row class="header">
                <el-col :span="4"><h4>Subject</h4></el-col>
                <el-col :span="20">
                    <el-row>
                        <el-col :span="2">&nbsp;</el-col>
                        <el-col :span="6"><h4>Datatype</h4></el-col>
                        <el-col :span="6"><h4>Name / Desc</h4></el-col>
                        <el-col :span="6"><h4>Create Date</h4></el-col>
                        <el-col :span="4"><h4>Tags</h4></el-col>
                    </el-row> 
                </el-col>
            </el-row>

        </div><!--fixed-top-->

        <!--start of dataset list-->
        <div class="page-content">

        <div v-if="!datasets_grouped" style="margin: 30px;">
            <h2>Loading ...</h2>
        </div>

        <div class="list" v-if="datasets_grouped">
            <el-row class="group" v-for="(datasets, subject) in datasets_grouped" :key="subject">
                <!--
                <el-col :span="1" style="margin-top: 3px;">
                    <el-checkbox></el-checkbox>
                </el-col>
                -->
                <el-col :span="4">
                        <!--<icon name="caret-down" scale="1.3"></icon>-->
                    <strong>{{subject}}</strong>
                </el-col> 
                <el-col :span="20">
                    <div 
                    v-for="dataset in datasets" :key="dataset._id"
                    @click="go('/dataset/'+dataset._id)"
                    :class="{dataset: true, clickable: true, selected: dataset.checked}">
                        <el-row>
                            <el-col :span="2">
                                <div @click.stop="" style="margin-left: 5px;">
                                    <el-checkbox v-model="dataset.checked" @change="check(dataset)"></el-checkbox>
                                </div>
                            </el-col>
                            <el-col :span="5" :title="datatypes[dataset.datatype].desc">
                                {{datatypes[dataset.datatype].name}}
                                <tags :tags="dataset.datatype_tags"></tags> &nbsp;
                            </el-col>
                            <el-col :span="7" class="ellipsis">
                                <b>{{dataset.name}}</b><br>
                                {{dataset.desc}}
                            </el-col>
                            <el-col :span="6">
                                <time>{{dataset.create_date | date}}</time>
                                &nbsp;
                            </el-col>
                            <el-col :span="4">
                                <tags :tags="dataset.tags"></tags> &nbsp;
                            </el-col>
                        </el-row>
                    </div>
                </el-col> 
            </el-row>
        </div><!--list-->
        </div><!--page-content-->
    </div><!--pusher-->

    <div class="selected-view" v-if="selected_count && datatypes">
        <h4 class="header">
            <icon name="check-square"></icon> {{selected_count}} Selected 
        </h4>
        <div class="select-group">
            <div v-for="(_datasets, did) in group_selected" :key="did" v-if="datatypes[did]">
                <h5>{{datatypes[did].name}}</h5>
                <div class="selected-item" v-for="(dataset, id) in _datasets" :key="id" @click="go('/dataset/'+id)">
                    <div>
                        <div @click.stop="remove_selected(dataset)" style="display: inline;">
                            <icon name="trash"></icon>
                        </div>
                        <small>
                            {{dataset.name}}
                            <tags :tags="dataset.datatype_tags"></tags>
                        </small>
                    </div>
                </div>
                <br>
            </div>
            <el-button size="small" icon="delete" @click="clear_selected()">Unselect All</el-button>
        </div>
        <div class="select-group" style="background-color: #999;">
            <el-button-group>
                <el-button size="small" type="primary" @click="download()">Download</el-button>
                <el-button size="small" type="primary" @click="submit()">Process</el-button>
            </el-button-group>
            <el-dropdown @command="view">
                <el-button size="small" type="primary">
                    View<i class="el-icon-caret-bottom el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="fslview">FSL View</el-dropdown-item>
                    <el-dropdown-item command="freeview">Free View</el-dropdown-item>
                    <el-dropdown-item command="mrview">MR View</el-dropdown-item>
                    <el-dropdown-item command="fibernavigator">Fiber Navigator</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
        </div>
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
            if(!this.datasets) return null;

            //console.log("grouping");
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

    mounted() {
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
            //console.log("loading datasets with query", this.query);
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
            //console.log("loading", find);
            this.$http.get('dataset', {params: {
                find: JSON.stringify(find),
                select: 'datatype datatype_tags project create_date name desc tags meta storage',
            }})
            .then(res=>{
                this.datasets = res.body.datasets;

                //set checked flag for each dataset
                this.datasets.forEach(dataset=>{
                    if(this.selected[dataset._id]) Vue.set(dataset, 'checked', true);
                });

                cb();
            }).catch(cb);
        },
        /*
        is_selected: function(dataset) {
            if(this.selected[dataset._id] === undefined) return false;
            return true;
        },
        */
        opendataset: function(dataset) {
            //console.dir(dataset);
        },
        go: function(path) {
            this.$router.push(path);
        },
        check: function(dataset) {
            //var did = dataset.datatype._id;
            if(this.selected[dataset._id]) {    
                Vue.set(dataset, 'checked', false);
                Vue.delete(this.selected, dataset._id);
            } else {
                Vue.set(dataset, 'checked', true);
                Vue.set(this.selected, dataset._id, dataset);
            }
            this.persist_selected();
        },
        persist_selected: function() {
            localStorage.setItem('datasets.selected', JSON.stringify(this.selected));
        },
        clear_selected: function() {
            for(var id in this.selected) {
                //find dataset ref
                this.datasets.forEach(dataset=>{
                    if(dataset._id == id) dataset.checked = false;
                });
            }
            this.selected = {};
            this.persist_selected();
        },
        remove_selected: function(dataset) {
            console.log("removing", dataset);
            //find dataset ref
            this.datasets.forEach(_d=>{
                if(dataset._id == _d._id) _d.checked = false;
            });
            Vue.delete(this.selected, dataset._id);
            this.persist_selected();
        },

        get_instance: function() {
            //first create an instance to download things to
            return this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.download",
                config: {
                    selected: this.selected,
                }
            }).then(res=>res.body);
        },

        stage_selected: function(instance, resource) {
            //create config to download all selected data from archive
            var download = [];
            for(var dataset_id in this.selected) {
                download.push({
                    url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                    untar: "gz",
                    dir: "download/"+dataset_id, 
                });
            }

            //remove in 48 hours (abcd-novnc should terminate in 24 hours)
            var remove_date = new Date();
            remove_date.setDate(remove_date.getDate()+2);

            return this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: instance._id,
                name: "brainlife.download.stage",
                service: "soichih/sca-product-raw",
                preferred_resource_id: resource,
                config: { download },
                remove_date: remove_date,
            }).then(res=>res.body.task);
        },

        view: function(type) {
            //find novnc resource
            this.$http.get(Vue.config.wf_api+'/resource', {params: {
                find: JSON.stringify({"config.services.name": "soichih/abcd-novnc"}),
            }}).then(res=>{
                var novnc_resource = res.body.resources[0];
                if(!novnc_resource) console.error("faild to find soichih/abcd-novnc resource"); 
                else {
                    //create download task
                    var download_instance = null;
                    this.get_instance().then(instance=>{
                        download_instance = instance;
                        return this.stage_selected(instance, novnc_resource);
                    }).then(task=>{
                        var download_task = task;
                        window.open("#/view/"+download_instance._id+"/"+download_task._id+"/"+type, "", "width=1200,height=800,resizable=no,menubar=no"); 
                    });
                }
            });
        },

        download: function() {
            var download_instance = null;
            this.get_instance().then(instance=>{
                download_instance = instance;
                return this.stage_selected(instance);
            }).then(task=>{
                var download_task = task;

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

                    //TODO - this is neuroscience specific, and I need to do a lot more thinking on this
                    var dataname = datatype.name.split("/")[1];
                    //console.dir(datatype.files);
                    datatype.files.forEach(file=>{
                        symlink.push({
                            src: download_path+"/"+(file.filename||file.dirname),
                            dest: "download/derivatives/"+process_name+"/"+subject+"/"+dataname+"/"+subject+"_"+(file.filename||file.dirname),
                        });
                    });

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
        },

        submit: function() {
            this.$router.push('/submit');
        }
    },
}
</script>

<style scoped>
.page-content {
    margin-left: 200px;
    transition: right 0.2s;
    top: 85px;
}
.rightopen .page-content {
    right: 250px;
}
.rightopen .fixed-top {
    right: 250px;
}
.selected {
    transition: color, background-color 0.2s;
    background-color: #2185d0;
    color: white;
}
.selected-view {
    background-color: #444;
    overflow-x: hidden;
    position: fixed;
    right: 0px;
    width: 250px;
    top: 50px;
    bottom: 0px;
    z-index: 2;
}
.selected-view .header {
    color: white;
}
.selected-view .selected-item:hover {
    background-color: #eee;
    cursor: pointer;
}
.selected-view .select-group {
    background-color: white;
    padding: 10px 15px;
    box-sizing: border-box;
    box-shadow: inset 3px 0px 3px #999;
}
.header-content {
    padding-top: 7px;
    position: fixed;
    top: 0px;
    left: 300px;
    right: 200px;
    z-index: 2;
}
.header {
    padding: 10px 0px 3px 10px;
    text-transform: uppercase;
}
.list .group {
    padding: 5px 0px 5px 10px;
    background-color: white;
}

.fixed-top .header {
    background-color: #ddd;
    color: #999;
}
.list .group {
    /*margin-bottom: 1px;*/
    font-size: 12px;
}
.list .group:not(:last-child) {
    border-bottom: 1px solid #eee;
}
.list .dataset {
    padding: 3px 0px;
    margin-bottom: 1px;
    transition: background-color 0.2s;
}
.list .dataset.clickable:hover {
    background-color: #ccc;
}
.list .dataset.selected,
.list .dataset.selected:hover {
    background-color: #2693ff;
}
.fixed-top {
    position: fixed;
    left: 290px;
    right: 0px;
    z-index: 5;
    transition: right 0.2s;
    top: 50px;
}
.ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; 
}
</style>

