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
                    @change="change_query_debounce()"
                    v-model="query">
                </el-input>
            </el-col>
            <el-col :span="12">
                <el-button @click="go('/upload')" icon="upload">Upload Data</el-button>
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
                        <el-col :span="1">&nbsp;</el-col>
                        <el-col :span="6"><h4>Datatype</h4></el-col>
                        <el-col :span="7"><h4>Description</h4></el-col>
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
                <el-col :span="4">
                    <strong>{{subject}}</strong>
                </el-col> 
                <el-col :span="20">
                    <div 
                    v-for="dataset in datasets" :key="dataset._id"
                    @click="go('/dataset/'+dataset._id)"
                    :class="{dataset: true, clickable: true, selected: dataset.checked}">
                        <el-row>
                            <el-col :span="1">
                                <div @click.stop="check(dataset)" style="padding: 0 3px 5px 5px;">
                                    <el-checkbox v-model="dataset.checked" @change="check(dataset)"></el-checkbox>
                                </div>
                            </el-col>
                            <el-col :span="6" :title="datatypes[dataset.datatype].desc">
                                <datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag>
                            </el-col>
                            <el-col :span="7" class="truncate">
                                {{dataset.desc||'&nbsp;'}}
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
                <datatypetag :datatype="datatypes[did]"/>
                <div class="selected-item" v-for="(dataset, id) in _datasets" :key="id" @click="go('/dataset/'+id)">
                    <div>
                        <div @click.stop="remove_selected(dataset)" style="display: inline;" title="Unselect">
                            <icon name="close"></icon>
                        </div>
                        {{dataset.meta.subject}}
                        <small>
                            <tags :tags="dataset.datatype_tags"></tags>
                        </small>
                    </div>
                </div>
                <br>
            </div>
            <el-button size="small" icon="circle-cross" @click="clear_selected()">Unselect All</el-button>
        </div>
        <div class="select-group" style="background-color: #999;">
            <el-button-group>
                <el-button size="small" type="primary" @click="download()">Download</el-button>
                <el-button size="small" type="primary" @click="process()">Process</el-button>
            </el-button-group>
            <viewerselect @select="view"></viewerselect>
            <!--
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
            -->
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
import viewerselect from '@/components/viewerselect'
import datatypetag from '@/components/datatypetag'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    components: { 
        sidemenu, tags, metadata, 
        pageheader, projectmenu, viewerselect,
        datatypetag
    },
    data () {
        return {
            datasets: [], //datasets loaded so far
            datasets_count: null, //number of all datasets on server given current query

            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id
            project_id: null, //project to limit search result

            query: localStorage.getItem('datasets.query'),

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
        this.$http.get('project')
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });
            this.check_project_id();

            return this.$http.get('datatype')
        })
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });
            this.load();
        }).catch(err=>{
            console.error(err);
        });
        this.selected = JSON.parse(localStorage.getItem('datasets.selected')) || {};
		window.addEventListener("scroll", this.check_scroll, true);
    },

    watch: {
        //when user select different project, this gets called (mounted() won't be called anymore)
        $route: function() {
            this.check_project_id();
            this.reload();
        }
    },

	methods: {
        reload: function() {
			this.datasets = [];
            this.datasets_count = null;
            this.load();
        },

        check_project_id: function() {
            this.project_id = this.$route.params.projectid;
            if(!this.project_id) {
                var pid = localStorage.getItem("last_projectid_used");
                if(!pid) {
                    console.log("last_projectid not set.. opening first one");
                    pid = res.body.projects[0]._id; //just pick one that user has access
                }
                this.$router.replace("/datasets/"+pid);
            } else {
                localStorage.setItem("last_projectid_used", this.project_id);
            }
        },

		check_scroll: function(e) {
			var page_margin = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
            if (page_margin < 500) this.load();
		},

        change_query_debounce: function() {
            clearTimeout(debounce);
            debounce = setTimeout(this.change_query, 300);        
        },

        change_query: function() {
            //if already loading, then wait
            if(this.loading) {
                setTimeout(this.change_query, 300);
                return;
            }
            localStorage.setItem('datasets.query', this.query);
            this.reload();
        },

        load: function() {
            if(this.loading) return;
            if(this.datasets.length === this.datasets_count) return;
            this.loading = true;

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

            this.$http.get('dataset', {params: {
                find: JSON.stringify(find),
                skip: this.datasets.length,
                limit: 50,
                select: 'datatype datatype_tags project create_date name desc tags meta storage',
                sort: 'meta.subject -create_date'
            }})
            .then(res=>{
                this.datasets_count = res.body.count;

                //set checked flag for each dataset
				res.body.datasets.forEach(dataset=>{
					this.datasets.push(dataset);
                    if(this.selected[dataset._id]) Vue.set(dataset, 'checked', true);
                });

                this.loading = false;
            }, err=>{
                console.error(err);
                this.loading = false;
            });
        },
        go: function(path) {
            this.$router.push(path);
        },
        check: function(dataset) {
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
                    untar: "auto",
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
            this.$http.get(Vue.config.wf_api+'/resource/best', {params: {
                /*
                find: JSON.stringify({
                    "config.services.name": "soichih/abcd-novnc",
                    active: true,
                }),
                */
                service: "soichih/abcd-novnc",
            }}).then(res=>{
                //var novnc_resource = res.body.resources[0];
                var novnc_resource = res.body.resource._id;
                if(!novnc_resource) console.error("faild to find soichih/abcd-novnc resource"); 
                else {
                    //create download task
                    var download_instance = null;
                    this.get_instance().then(instance=>{
                        download_instance = instance;
                        return this.stage_selected(instance, novnc_resource);
                    }).then(task=>{
                        var download_task = task;
                        //now let viewer can take over
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

                    //TODO - until I figure out how to make things unique, let's add dataset_id
                    dataname+="_"+dataset_id;

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

        process: function() {
            this.$router.push('/process/_new');
        }
    },

	destroyed() {
		window.removeEventListener("scroll", this.check_scroll, true);
	}
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
.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; 
}
</style>

