<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="header-content">
        <div class="row">
             <div class="col-md-6">
                <el-input
                    placeholder="Filter Datasets" 
                    icon="search"
                    @change="change_query_debounce()"
                    v-model="query">
                </el-input>
            </div>
            <div class="col-md-6">
                <b-button variant="success" @click="go('/upload')">Upload Data</b-button>
            </div>
        </div>
    </div>
    <div :class="{rightopen: selected_count}">
        <projectmenu :active="project_id"></projectmenu>
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
                <div class="text-muted list-header">Total Datasets <b>{{total_datasets}}</b></div>
                <div v-for="(page, page_idx) in pages">
                    <!--show empty div to speed rendering up if it's outside the view-->
                    <div v-if="page_info[page_idx] && page_info[page_idx].visible === false" :style="{height: page_info[page_idx].height}">&nbsp;</div>
                    <div class="row subjects" v-for="(datasets, subject) in page" :key="subject" v-else>
                        <div class="col-md-2">
                            <strong>{{subject}}</strong>
                        </div>
                        <div class="col-md-10">
                            <div v-for="dataset in datasets" :key="dataset._id" @click="go('/dataset/'+dataset._id)" class="dataset clickable" :class="{selected: dataset.checked}">
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
                                        <time>{{dataset.create_date | date}}</time>
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
        </div><!--page-content-->
    </div>

    <div class="selected-view" :class="{'selected-view-open':selected_count}" v-if="datatypes">
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
            <b-button size="sm" variant="link" @click="clear_selected()" style="padding: 0px;"><icon name="close"/> Unselect All</b-button>
        </div>
        <div class="select-action">
            <b-button-group>
                <b-button size="sm" @click="download()" 
                    title="Organize selected datasets into BIDS data structure and download.">Download</b-button>
                <b-button size="sm" @click="process()" 
                    title="Run applications on selected datasets by creating a new process.">Process</b-button>
            </b-button-group>
            <br>
            <br>
            <viewerselect @select="view"></viewerselect>
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

var query_debounce = null;
var scroll_debounce = null;

export default {
    components: { 
        sidemenu, tags, metadata, 
        pageheader, projectmenu, viewerselect,
        datatypetag, 
    },
    data () {
        return {
            pages: [], //groups of datasets 
            total_datasets: null, //number of datasets for this project
            page_info: [], //{top/bottom/visible/}
            loading: false,

            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id
            project_id: null, //project to limit search result

            query: localStorage.getItem('datasets.query'),

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
            this.load();
        }).catch(err=>{
            console.error(err);
        });
    },

    mounted() {
        this.selected = JSON.parse(localStorage.getItem('datasets.selected')) || {};
		window.addEventListener("scroll", this.page_scrolled, true);
    },

    watch: {
        //when user select different project, this gets called (mounted() won't be called anymore)
        $route: function() {
            this.check_project_id();
            this.reload();
        },
    },

	methods: {
        reload: function() {
            this.pages = [];
            this.page_info = [];
            this.total_datasets = null;
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
        
		page_scrolled: function(e) {

            /*
            //prevent calling this too often
            if(scroll_debounce && Date.now()- scroll_debounce < 100) {
                return;
            }
            scroll_debounce = Date.now();
            */
            
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
            localStorage.setItem('datasets.query', this.query);
            this.reload();
        },

        load: function() {
            if(this.loading) return;

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

            //count number of datasets loaded
            var loaded = 0;
            this.pages.forEach(page=>{
                for(var subject in page) {
                    loaded += page[subject].length;
                }
            });
            if(loaded === this.total_datasets) return;
            
            this.loading = true;
            var limit = 100;
            this.$http.get('dataset', {params: {
                find: JSON.stringify(find),
                skip: loaded,
                limit,
                select: '-prov',
                sort: 'meta.subject -create_date'
            }})
            .then(res=>{
                this.total_datasets = res.body.count;

                //set checked flag for each dataset
                var groups = {};
                res.body.datasets.forEach(dataset=>{
                    //Vue.set(dataset, 'checked', this.selected[dataset._id]);
                    dataset.checked = this.selected[dataset._id];

                    var subject = "nosub"; //not all datasets has subject tag
                    if(dataset.meta && dataset.meta.subject) subject = dataset.meta.subject; 
                    if(!groups[subject]) groups[subject] = [];
                    groups[subject].push(dataset);
                });
                this.pages.push(groups);

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

        stage_selected: function(instance/*, resource*/) {
            //create config to download all selected data from archive
            var download = [];
            for(var dataset_id in this.selected) {
                download.push({
                    url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                    untar: "auto",
                    //dir: "download/"+dataset_id, 
                    dir: dataset_id, 
                });
            }

            //remove in 48 hours (abcd-novnc should terminate in 24 hours)
            var remove_date = new Date();
            remove_date.setDate(remove_date.getDate()+2);

            return this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: instance._id,
                name: "brainlife.download.stage",
                service: "soichih/sca-product-raw",
                //preferred_resource_id: resource,
                config: { download },
                remove_date: remove_date,
            }).then(res=>res.body.task);
        },

        view: function(type) {
            var download_instance = null;
            this.get_instance().then(instance=>{
                download_instance = instance;
                return this.stage_selected(download_instance);
            }).then(task=>{
                //if type contains /, I need to replace it with . (see processes/view.vue)
                window.open("#/view/"+download_instance._id+"/"+task._id+"/"+type, "", "width=1200,height=800,resizable=no,menubar=no"); 
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

                //TODO - I think I should go head and create staging task - and simplify the data staging dialog

                this.$router.push("/processes/"+instance._id);
            });
        }
    },

	destroyed() {
		window.removeEventListener("scroll", this.page_scrolled, true);
	}
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

.page-header {
top: 63px;
color: #888;
margin-right: 15px; /*to align with scrollbar*/
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
    left: 330px;
    top: 0px;
    padding-top: 7px;
    right: 200px;
    z-index: 10;
}

.header {
    padding: 10px 0px 3px 10px;
    text-transform: uppercase;
}
.list .dataset {
    transition: background-color 0.3s;
    padding: 2px;
    height: 25px;
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
    text-overflow: ellipsis; 
}
.loading {
    position: fixed;
    bottom: 25px;
    left: 350px; 
    z-index: 10;
    opacity: 0.5;  
}
.dataset-checker {
    width: 17px;
    height: 17px;
    float: left;
    margin-right: 5px;
}
</style>

