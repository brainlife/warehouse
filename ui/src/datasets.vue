<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="header-content">
        <el-input placeholder="Filter Datasets" @change="change_query_debounce()" v-model="query"/>
    </div>
    <div :class="{rightopen: selected_count}">
        <projectmenu :active="project_id" :projects="projects"></projectmenu>
        <div class="page-header">
            <div class="row">
                <div class="col-md-2"><h4>Subject</h4></div>
                <div class="col-md-10">
                    <div class="row">
                        <div class="col-md-3"><h4>Datatype</h4></div>
                        <div class="col-md-3"><h4>Description</h4></div>
                        <div class="col-md-3"><h4>Create&nbsp;Date</h4></div>
                        <div class="col-md-3"><h4>Tags</h4></div>
                    </div>
                </div><!--col-->
            </div><!--row-->
        </div>

        <div class="page-content">
            <div v-if="loading" class="loading"><icon name="cog" spin scale="2"/></div>

            <!--start of dataset list-->
            <div class="list" id="scrolled-area">
                <div class="text-muted list-header"><b>{{total_subjects}}</b> Subjects | <b>{{total_datasets}}</b> Datasets</div>
                <div v-for="(page, page_idx) in pages">
                    <!--show empty div to speed rendering up if it's outside the view-->
                    <div v-if="page_info[page_idx] && page_info[page_idx].visible === false" :style="{height: page_info[page_idx].height}">&nbsp;</div>
                    <div class="row subjects" v-for="(datasets, subject) in page" :key="subject" v-else>
                        <div class="col-md-2">
                            <strong>{{subject}}</strong>
                        </div>
                        <div class="col-md-10">
                            <div v-for="dataset in datasets" :key="dataset._id" @click="open_dataset(dataset._id)" class="dataset clickable" :class="{selected: dataset.checked}">
                                <div class="row">
                                    <div class="col-md-3 truncate">
                                        <input type="checkbox" v-model="dataset.checked" @click.stop="check(dataset)" class="dataset-checker">
                                        <datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag>
                                        <icon v-if="dataset.status == 'storing'" name="cog" :spin="true" style="color: #2693ff;" scale="0.8"/>
                                        <icon v-if="dataset.status == 'failed'" name="exclamation-triangle" style="color: red;" scale="0.8"/>
                                        <icon v-if="dataset.status == 'archived'" name="archive" scale="0.8"/>
                                        <icon v-if="!dataset.status" name="question-circle" style="color: gray;" scale="0.8"/>
                                    </div>
                                    <div class="col-md-3 truncate">
                                        {{dataset.desc||'&nbsp;'}}
                                    </div>
                                    <div class="col-md-3 truncate">
                                        <time>{{new Date(dataset.create_date).toLocaleString()}}</time>
                                    </div>
                                    <div class="col-md-3 truncate">
                                        <tags :tags="dataset.tags"></tags> &nbsp;
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div> 
            </div><!--scrolled-area-->
            <b-button class="button-fixed" @click="go('/upload')" title="Upload Dataset" :class="{'selected-view-open':selected_count}"><icon name="plus" scale="2"/></b-button>
        </div><!--page-content-->
    </div>

    <div class="selected-view" :class="{'selected-view-open':selected_count}" v-if="datatypes">
        <h4 class="header">
            <icon name="check-square"></icon> {{selected_count}} Selected 
        </h4>
        <div class="select-group">
            <div v-for="(_datasets, did) in group_selected" :key="did" v-if="datatypes[did]">
                <datatypetag :datatype="datatypes[did]"/>
                <div class="selected-item" v-for="(dataset, id) in _datasets" :key="id" @click="open_dataset(id)">
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
            <b-button size="sm" variant="link" @click="clear_selected()" style="padding: 0px;"><icon name="close"/> Unselect All</b-button>
        </div>
        <div class="select-action">
            <b-button-group>
                <b-button size="sm" v-b-modal.viewSelecter>View</b-button>
                <b-button size="sm" @click="download()" title="Organize selected datasets into BIDS data structure and download.">Download</b-button>
                <b-button size="sm" @click="process()" title="Run applications on selected datasets by creating a new process.">Process</b-button>
            </b-button-group>
        </div>
    </div>
    <viewselecter @select="view" :datatype_names="selected_datatype_names"></viewselecter>
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import tags from '@/components/tags'
import metadata from '@/components/metadata'
import projectmenu from '@/components/projectmenu'
import datatypetag from '@/components/datatypetag'
import viewselecter from '@/components/viewselecter'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const async = require('async');

var query_debounce = null;
var scroll_debounce = null;

export default {
    components: { 
        sidemenu, tags, metadata, 
        pageheader, projectmenu, 
        datatypetag, viewselecter,
    },
    data () {
        return {
            pages: [], //groups of datasets 

            total_datasets: null, //number of datasets for this project
            total_subjects: null, //number of subjects for this project

            page_info: [], //{top/bottom/visible/}
            loading: false,

            last_groups: {},

            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id
            project_id: null, //project to limit search result

            query: "", //localStorage.getItem('datasets.query'), //I don't think I should persist .. causes more confusing

            //cache
            datatypes: null,
            projects: null,

            config: Vue.config,
        }
    },

    computed: {
        selected_count: function() {
            return Object.keys(this.selected).length;
        },
        selected_datatype_names: function() {
            if(!this.datatypes) return null;

            var names = [];
            for(var id in this.selected) {
                var selected = this.selected[id];
                var did = selected.datatype;
                var datatype_name = this.datatypes[did].name;
                names.push(datatype_name);
            }
            return names;
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

    created() {
        this.$http.get('project')
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });
            this.check_project_id();

            //load all datatypes
            return this.$http.get('datatype')
        })
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });
            this.reload();
        }).catch(err=>{
            console.error(err);
        });
    },

    mounted() {
        this.selected = JSON.parse(localStorage.getItem('datasets.selected')) || {};
        var area = document.getElementById("scrolled-area").parentNode;
		area.addEventListener("scroll", this.page_scrolled);
    },

    watch: {
        //when user select different project, this gets called (mounted() won't be called anymore)
        $route: function() {
            this.check_project_id();
            this.query = ""; //clear query to avoid confusion
            this.reload();
        },
    },

	methods: {
        reload: function() {
            this.pages = [];
            this.page_info = [];
            this.last_groups = {};
            this.total_datasets = null;
            this.total_subjects = null;
            this.load();

            //get number of subjects stored 
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({
                    project: this.project_id,
                    removed: false
                }),
                distinct: 'meta.subject'
            }}).then(res=>{
                this.total_subjects = res.body.length;
            });
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
        
		page_scrolled: function(e) {
            var page_margin_bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
            if (page_margin_bottom < 800) this.load();
            this.page_info.forEach((page,idx)=>{
                var top = e.target.scrollTop;
                page.visible = top < page.bottom && top + e.target.clientHeight > page.top;
            });
        },

        change_query_debounce: function() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query: function() {
            //if already loading, then wait
            if(this.loading) {
                setTimeout(this.change_query, 300);
                return;
            }
            this.reload();
        },

        load: function() {
            if(this.loading) return;

			var finds = [
                {removed: false},
                {project: this.project_id},
            ] 

            if(this.query) {
                //lookup datatype ids that matches the query
                var datatype_ids = [];
                for(var id in this.datatypes) {
                    if(this.datatypes[id].name.includes(this.query)) datatype_ids.push(id);
                }

                finds.push({$or: [
                    //text search is pretty much only useful for description / tags (and it can't be mixed in $or). not very useful!
                    //{$text: {$search: this.query}}, 

                    {"meta.subject": {$regex: this.query}},
                    {"desc": {$regex: this.query}},
                    {"tags": {$regex: this.query}},
                    {"datatype_tags": {$regex: this.query}},
                    {"datatype": {$in: datatype_ids}},
                ]});
            }

            //count number of datasets already loaded
            var loaded = 0;
            this.pages.forEach(page=>{
                for(var subject in page) {
                    loaded += page[subject].length;
                }
            });
            for(var subject in this.last_groups) {      
                loaded += this.last_groups[subject].length;
            }
            if(loaded === this.total_datasets) return;

            console.log("fetching datasets", loaded);
            this.loading = true;
            var limit = 100;
            this.$http.get('dataset', {params: {
                find: JSON.stringify({$and: finds}),
                skip: loaded,
                limit,
                select: '-prov',
                sort: 'meta.subject -create_date'
            }})
            .then(res=>{
                this.total_datasets = res.body.count;
                var groups = this.last_groups; //start with the last subject group from previous load

                var last_subject = null;
                res.body.datasets.forEach(dataset=>{
                    dataset.checked = this.selected[dataset._id];
                    var subject = "nosub"; //not all datasets has subject tag
                    if(dataset.meta && dataset.meta.subject) subject = dataset.meta.subject; 
                    last_subject = subject;
                    if(!groups[subject]) groups[subject] = [];
                    groups[subject].push(dataset);
                });

                this.last_groups = {};
                loaded += res.body.datasets.length;
                if(this.total_datasets != loaded) {
                    //don't add last subject group - in case we might have more datasets for that key in the next page - so that we can join them together
                    this.last_groups[last_subject] = groups[last_subject];
                    delete groups[last_subject];
                }

                this.pages.push(groups);

                //remember the page height
                this.$nextTick(()=>{
                    var h = document.getElementById("scrolled-area").scrollHeight;
                    var prev = 0;
                    if(this.pages.length > 1) prev = this.page_info[this.pages.length-2].bottom;
                    this.page_info.push({top: prev, bottom: h-1, height: h-1-prev, visible: true});
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

        open_dataset: function(dataset_id) {
            //TODO - we should probably use semi-fullscreen modal to display dataset
            //window.open('#/dataset/'+dataset_id);
            this.$router.push('/dataset/'+dataset_id);
        },

        check: function(dataset) {
            if(this.selected[dataset._id]) {    
                dataset.checked = false;
                Vue.delete(this.selected, dataset._id);
            } else {
                dataset.checked = true;
                Vue.set(this.selected, dataset._id, dataset);
            }
            this.persist_selected();
        },
        persist_selected: function() {
            localStorage.setItem('datasets.selected', JSON.stringify(this.selected));
        },
        clear_selected: function() {
            //unselect all 
            this.pages.forEach(page=>{
                for(var subject in page) {
                    page[subject].forEach(dataset=>{
                        dataset.checked = false;
                    });
                }
            });
            this.selected = {};
            this.persist_selected();
        },
        remove_selected: function(dataset) {
            //NOTE - selected[] contains clone of the datasets selected - not the same object so I can't just do "dataset.checked = false"
            //find the real dataset object
            this.pages.forEach(page=>{
                for(var subject in page) {
                    var d = page[subject].find(d=>d._id == dataset._id);
                    if(d) d.checked = false;
                }
            });
            dataset.checked = false;
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

        temp_stage_selected: function(instance/*, resource*/) {
            //create config to download all selected data from archive
            var download = [];
            var datatypes = {};
            for(var dataset_id in this.selected) {
                download.push({
                    url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                    untar: "auto",
                    dir: dataset_id, 
                });

                var dataset = this.selected[dataset_id];
                var datatype = this.datatypes[dataset.datatype];
                datatypes[dataset_id] = datatype;
            }

            //remove in 48 hours (abcd-novnc should terminate in 24 hours)
            var remove_date = new Date();
            remove_date.setDate(remove_date.getDate()+2);

            return this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: instance._id,
                name: "brainlife.download.stage",
                service: "soichih/sca-product-raw",
                //preferred_resource_id: resource,
                config: { download, _datatypes : datatypes },
                remove_date: remove_date,
            }).then(res=>res.body.task);
        },

        view: function(v) {
            var download_instance = null;
            this.get_instance().then(instance=>{
                download_instance = instance;
                return this.temp_stage_selected(download_instance);
            }).then(task=>{
                window.open("#/view/"+download_instance._id+"/"+task._id+"/"+v.ui, "", "width=1200,height=800,resizable=no,menubar=no"); 
            });
        },

        download: function() {
            var download_instance = null;
            this.get_instance().then(instance=>{
                download_instance = instance;
                return this.temp_stage_selected(instance);
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

                    var download_path = "../"+download_task._id+"/"+dataset_id;

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
            this.$http.post(Vue.config.wf_api+'/instance', {
                config: {
                    brainlife: true,
                    type: "v2",
                },
            }).then(res=>{
                var instance = res.body;

                //submit data staging task (TODO - Instead of downloading each datatypes, I feel I should group by subject)
                var tid = 0;
                var did = 0;
                async.eachOfSeries(this.group_selected, (datasets, datatype_id, next_group)=>{
                    var download = [];
                    var _outputs = [];
                    for(var dataset_id in datasets) {
                        download.push({
                            url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                            untar: "auto",
                            dir: dataset_id,
                        });
                        _outputs.push(Object.assign(datasets[dataset_id], {
                            id: dataset_id, 
                            did: did++,
                            subdir: dataset_id, 
                            dataset_id,
                            prov: null,
                        }));
                    }
                    this.$http.post(Vue.config.wf_api+'/task', {
                        instance_id: instance._id,
                        name: "Staged Datasets - "+this.datatypes[datatype_id].name,
                        service: "soichih/sca-product-raw",
                        config: { download, _outputs, _tid: tid++ },
                    }).then(res=>{
                        console.log("submitted download task", res.body.task);
                        next_group();
                    });
                }, err=>{
                    this.$router.push("/processes/"+instance._id);
                });
            });
        }
    },

    /*
	destroyed() {
		window.removeEventListener("scroll", this.page_scrolled, true);
	}
    */
}
</script>

<style scoped>
.page-header,
.page-content {
position: fixed;
left: 320px;
padding-left: 10px;
right: 0;
}

h4 {
font-size: 15px;
font-weight: bold;
margin-bottom: 7px;
}

.page-header {
top: 63px;
margin-right: 15px; /*to align with scrollbar*/
}
.page-header h4 {
font-size: 16px;
font-weight: bold;
color: #999;
}

.page-content {
background-color: white;
transition: right 0.2s, bottom 0.2s;
top: 90px;
overflow-y: scroll;
overflow-x: hidden;
font-size: 12px;
}
.rightopen .page-content,
.rightopen .page-header {
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
    right: -250px;
    width: 250px;
    top: 50px;
    bottom: 0px;
    z-index: 2;
    transition: right 0.2s;
}
.selected-view-open {
    right: 0px;
}
.selected-view {
    color: #eee;
}
.selected-view .selected-item:hover {
    background-color: #eee;
    cursor: pointer;
}
.selected-view .select-group,
.selected-view .select-action {
    padding: 10px;
    box-sizing: border-box;
}
.selected-view .select-group {
    box-shadow: inset 3px 0px 3px #999;
    background-color: white;
    color: #333;
}
.selected-view .select-action p {
    margin-bottom: 10px;
}

.header-content {
    position: fixed;
    left: 320px;
    top: 0px;
    padding-top: 7px;
    right: 250px;
    z-index: 10;
}

.header {
    padding: 10px 0px 3px 10px;
    text-transform: uppercase;
}
.list .dataset {
    transition: background-color 0.3s;
    margin: 1px;
    padding: 1px;
}
.list .dataset.clickable:hover {
    background-color: #ccc;
}
.list .dataset.selected,
.list .dataset.selected:hover {
    background-color: #2693ff;
}
.list .list-header {
    padding: 10px 0px;
}
.list .subjects {
    border-top: 1px solid #eee;
    padding: 5px 0px;
}
.list .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: fade clip; 
}
.loading {
    position: fixed;
    bottom: 25px;
    left: 350px; 
    z-index: 10;
    opacity: 0.5;  
}
.dataset-checker {
    width: 22px;
    height: 22px;
    float: left;
    margin-right: 5px;
}
.button-fixed.selected-view-open {
right: 300px;
}
</style>

