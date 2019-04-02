<template>
<div>
    <div :class="{rightopen: selected_count}">
        <div v-if="loading" class="loading"><icon name="cog" spin scale="2"/></div>

        <div class="table-header">
            <div style="float: right; position: relative; top: 4px;">
                <b-form-input id="filter" class="filter" :class="{'filter-active': query != ''}" size="sm" v-model="query" placeholder="Filter" @input="change_query_debounce"></b-form-input>
            </div>

            <div style="padding: 5px 0px; margin-bottom: 10px;">
                <b>{{total_subjects}}</b> Subjects &nbsp;&nbsp;&nbsp; <b>{{total_datasets}}</b> Datasets
            </div>

            <b-row class="table-column">
                <b-col cols="2"><h4>Subject <small style="opacity: 0.5">/ Ses</small></h4></b-col>
                <b-col cols="10">
                    <b-row>
                        <b-col cols="3"><h4>Datatype</h4></b-col>
                        <b-col cols="3"><h4>Description</h4></b-col>
                        <b-col cols="3"><h4>Create&nbsp;Date</h4></b-col>
                        <b-col cols="3"><h4>Tags</h4></b-col>
                    </b-row>
                </b-col>
            </b-row>
        </div>

        <div class="list" id="scrolled-area">
            <div v-if="!loading && total_datasets == 0" style="margin: 20px; opacity: 0.8;">
                Please upload datasets by clicking the button on the right bottom corner of the page. You can also copy datasets from another project.
            </div>
            
            <!--start of dataset list-->
            <div v-for="(page, page_idx) in pages" v-if="datatypes" :key="page_idx" style="font-size: 12px;">
                <div v-if="page_info[page_idx] && page_info[page_idx].visible === false" 
                    :style="{height: page_info[page_idx].height}">
                    <!--show empty div to speed up rendering if it's outside the view-->
                    <pre>{{page_info[page_idx].height}}</pre>
                </div>
                <b-row class="subjects" v-for="(datasets, subject) in page" :key="subject" v-else>
                    <b-col cols="2">
                        <strong>{{subject}}</strong>
                    </b-col>
                    <b-col cols="10">
                        <div v-for="dataset in datasets" :key="dataset._id" @click="open(dataset._id)" class="dataset clickable" :class="{selected: dataset.checked, removed: dataset.removed}">
                            <b-row>
                                <b-col cols="3" class="truncate">
                                    <input :disabled="dataset.removed" type="checkbox" v-model="dataset.checked" @click.stop="check(dataset, $event)" class="dataset-checker">
                                    <datatypetag :datatype="datatypes[dataset.datatype]" :clickable="false" :tags="dataset.datatype_tags" style="margin-top: 1px;"/>
                                    <icon v-if="dataset.status == 'storing'" name="cog" :spin="true" style="color: #2693ff;" scale="0.8"/>
                                    <icon v-if="dataset.status == 'failed'" name="exclamation-triangle" style="color: red;" scale="0.8"/>
                                    <icon v-if="dataset.status == 'archived'" name="archive" scale="0.8"/>
                                    <icon v-if="!dataset.status" name="question-circle" style="color: gray;" scale="0.8"/>
                                </b-col>
                                <b-col cols="3" class="truncate">
                                    {{dataset.desc||'&nbsp;'}}
                                </b-col>
                                <b-col cols="3" class="truncate">
                                    <time>{{new Date(dataset.create_date).toLocaleString()}}</time>
                                </b-col>
                                <b-col cols="3" class="truncate">
                                    <tags :tags="dataset.tags"></tags> &nbsp;
                                </b-col>
                            </b-row>
                        </div>
                    </b-col>
                </b-row>
            </div> 
        </div><!--list-->

        <b-btn class="button-fixed" v-b-modal.uploader 
            @click="set_uploader_options" v-if="isadmin() || ismember()"
            title="Upload Dataset" 
            :class="{'selected-view-open':selected_count}">
            <icon name="plus" scale="2"/>
        </b-btn>

    </div>

    <div class="selected-view" :class="{'selected-view-open':selected_count}" v-if="datatypes">
        <h4>
            <div class="button" style="float: right; position: relative; top: -5px" @click="clear_selected"><icon name="times"/></div>
            <icon name="check-square" style="position: relative; margin-right: 10px;"/> {{selected_count}} Selected 
        </h4>

        <div class="select-action">
            <p>
                <b-btn size="sm" variant="outline-secondary" @click="downscript">
                    <icon name="download" scale="0.8"/> Download
                    <small v-if="selected_size > 0"> | {{selected_size|filesize}}</small>
                </b-btn>
            </p>
            <p>
                <b-btn size="sm" variant="outline-secondary" @click="process"><icon name="play" scale="0.8"/> Stage to process</b-btn>
            </p>
            <p>
                <b-btn size="sm" variant="outline-secondary" @click="copy"><icon name="copy" scale="0.8"/> Copy</b-btn>
            </p>
            <p>
                <!-- 
                    I can't add  v-if="isadmin() || ismember()" here.. because user could mix datasets from other project.
                    I need to analyze which dataset can be edited
                -->
                <b-btn size="sm" @click="remove" variant="outline-danger"><icon name="trash" scale="0.8"/> Remove<!--<span v-if="remove_remain">({{remove_remain}})</span>--></b-btn>
            </p>
        </div>

        <div v-for="(_datasets, did) in group_selected" :key="did" v-if="datatypes[did]" class="select-group">
            <datatypetag :datatype="datatypes[did]"/>
            <div class="selected-item" v-for="(dataset, id) in _datasets" :key="id" @click="open(id)">
                <div @click.stop="unselect(dataset)" style="float: right; padding-right: 3px;" title="Unselect">
                    <icon name="times"></icon>
                </div>
                <span v-if="dataset.meta">{{dataset.meta.subject}}</span>
                <small>
                    <tags :tags="dataset.datatype_tags"></tags>
                </small>
                <small v-if="dataset.project != project._id" style="opacity: 0.5">
                    <icon name="shield-alt"/> {{projects[dataset.project].name}}</span>
                </small>
            </div>
        </div>

        <p style="opacity: 0.5; margin: 10px">You can select multiple datasets by holding the shift key on first and last datasets that you'd like to select.</p>
        <br clear="both">
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
import datatypetag from '@/components/datatypetag'

import agreementMixin from '@/mixins/agreement'

const async = require('async');

let query_debounce = null;
let scroll_debounce = null;

import ReconnectingWebSocket from 'reconnectingwebsocket'

import axios from 'axios'

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default {
    mixins: [agreementMixin],
    components: { 
        sidemenu, tags, metadata, 
        pageheader, projectmenu, 
        datatypetag, 
    },
    props: ['project', 'projects'],
    data () {
        return {
            pages: [], //groups of datasets 

            total_datasets: null, //number of datasets for this project
            total_subjects: null, //number of subjects for this project

            page_info: [], //{top/bottom/visible/}
            loading: false,

            last_groups: {},

            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id
            last_dataset_checked: null,

            query: "", //localStorage.getItem('datasets.query'), //I don't think I should persist .. causes more confusing
            ws: null, //websocket
            removing: false,

            //cache
            datatypes: null,

            config: Vue.config,
        }
    },

    computed: {
        all_datasets() {
            let result = {};
            this.pages.forEach(page => {
                for (let subject in page) {
                    let datasets = page[subject];
                    datasets.forEach(dataset => {
                        if (!dataset.removed) {
                            result[dataset._id] = dataset;
                        }
                    });
                }
            });
            return result;
        },
        
        selected_count() {
            return Object.keys(this.selected).length;
        },
        selected_size() {
            var size = 0;
            for(var did in this.selected) {
                if(this.selected[did].size) {
                    size += this.selected[did].size;
                } else {
                    //console.log("size not set for dataset", did);
                }
            }
            return size;
        },

        selected_datatype_names() {
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

        group_selected() {
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

        //loading the entire datatype...
        this.$http.get('datatype')
        .then(res=>{
            this.datatypes = {};
            res.data.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });
            this.reload();
        }).catch(err=>{
            console.error(err);
        });

        var area = document.getElementById("scrolled-area");
        area.addEventListener("scroll", this.page_scrolled);

        let subid = this.$route.params.subid;
        if(subid) this.$root.$emit('dataset.view', {id: subid, back: './'});

        if(Vue.config.debug) {
            document.addEventListener('keydown', (event) => {
                const keyName = event.key;
                if(keyName == 'z') {
                    this.$root.$emit('dsimport.open', {});
                }
            });
        }
    },

    destroyed() {
        if(this.ws) this.ws.close();
    },

    watch: {
        //when user select different project, this gets called (mounted() won't be called anymore)
        project(nv, ov) {
            if(nv == ov) return; //why does this happen?
            this.query = ""; //clear query to avoid confusion
            if(this.loading) {
                console.log("canceling load");
                source.cancel('cancel due to project navigation');
                this.loading = false;
            }
            this.reload();
        },
        '$route': function() {
            let subid = this.$route.params.subid;
            this.$root.$emit('dataset.view', {id: subid, back: './'});
        },
    },

	methods: {
        isadmin() {
            if(!this.project) return false;
            if(~this.project.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember() {
            if(!this.project) return false;
            if(~this.project.members.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        reload() {
            this.pages = [];
            this.page_info = [];
            this.last_groups = {};
            this.total_datasets = null;
            this.total_subjects = null;
            this.load();

            //get number of subjects stored 
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({$and: this.get_mongo_query()}),
                distinct: 'meta.subject'
            }}).then(res=>{
                this.total_subjects = res.data.length;
            }).catch(res=>{
                this.$notify({type: 'error', text: res.data.message || JSON.stringify(res.data)});
            });

            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            if(this.ws) this.ws.close();
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse.dataset",
                        key: this.project._id+".#",
                    }
                }));
            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                if(!event.dinfo) return; //??
                if(this.removing) return; //ignore rush of removed datasets events that slows down UI update
                switch(event.dinfo.exchange) {
                case "warehouse.dataset":
                    let dataset = event.msg;

                    //look for the dataset
                    this.pages.forEach(page=>{
                        let old_dataset = null;
                        for(var subject in page) {
                            var datasets = page[subject];
                            old_dataset = datasets.find(d=>d._id == dataset._id);
                            if(old_dataset) break;
                        }
                        if(old_dataset) {
                            //apply updates (don't apply all changes.. it could blow up populated field)
                            old_dataset.desc = dataset.desc;
                            old_dataset.tags = dataset.tags;
                            old_dataset.meta = dataset.meta;
                            old_dataset.removed = dataset.removed;
                            old_dataset.status = dataset.status;
                            if(dataset.removed) this.unselect(dataset);
                        }
                    });
                 } 
            }
        },
        
		page_scrolled() {
            var e = document.getElementById("scrolled-area");
            var scroll_top = e.scrollTop;
            var client_height = e.clientHeight;
            var page_margin_bottom = e.scrollHeight - scroll_top - client_height;
            if (page_margin_bottom < 300) {
                this.load();
            }
        },

        change_query_debounce() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query() {
            if(this.loading) return setTimeout(this.change_query, 300);
            this.reload();
        },

        get_mongo_query() {
			var finds = [
                {removed: false},
                {project: this.project._id},
            ] 

            if(this.query) {
                let ands = [];

                //split query into each token and allow for regex search on each token
                //so that we can query against multiple fields simultanously
                this.query.split(" ").forEach(q=>{
                    if(q === "") return;

                    //lookup datatype ids that matches the query
                    let datatype_ids = [];
                    for(var id in this.datatypes) {
                        let _q = q;
                        if(q[0] == "!") _q = q.substring(1);
                        if(this.datatypes[id].name.includes(_q)) datatype_ids.push(id);
                    }

                    function compose_ors(q) {
                        return [
                            {"meta.subject": {$regex: q, $options: 'i'}},
                            {"desc": {$regex: q, $options: 'i'}},
                            {"tags": {$regex: q, $options: 'i'}},
                            {"datatype_tags": {$regex: q, $options: 'i'}},
                            {"datatype": {$in: datatype_ids}},
                        ];
                    }
                    if(q[0] == "!") {
                        //negative query!
                        ands.push({$nor: compose_ors(q.substring(1))}); //need to use $nor and perform query on all fields together..
                    } else {
                        ands.push({$or: compose_ors(q)});
                    }
                });
                finds.push({$and: ands});
            }
            //console.dir(finds);
            return finds;
        },

        load() {
            if(this.loading) return;

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

            this.loading = true;
            this.$http.get('dataset', {
                params: {
                    find: JSON.stringify({$and: this.get_mongo_query()}),
                    skip: loaded,
                    limit: 250,  //needs to be bigger than the largest dataset per subject (bigger == slower for vue to render)
                    sort: 'meta.subject meta.session -create_date'
                },
                cancelToken: source.token
            })
            .then(res=>{
                this.loading = false;
                this.total_datasets = res.data.count;
                var groups = this.last_groups; //start with the last subject group from previous load

                var last_subject = null;
                res.data.datasets.forEach((dataset, idx)=>{
                    dataset.checked = this.selected[dataset._id];
                    var subject = "nosub"; //not all datasets has subject tag
                    if(dataset.meta && dataset.meta.subject) subject = dataset.meta.subject; 
                    if(dataset.meta && dataset.meta.session) subject += " / " + dataset.meta.session;
                    last_subject = subject;
                    if(!groups[subject]) Vue.set(groups, subject, []);
                    groups[subject].push(dataset);
                });

                this.last_groups = {};
                loaded += res.data.datasets.length;
                if(this.total_datasets != loaded) {
                    //don't add last subject group - in case we might have more datasets for that key in the next page - so that we can join them together
                    this.last_groups[last_subject] = groups[last_subject];
                    delete groups[last_subject];
                }

                //this.pages.push(groups);
                Vue.set(this.pages, this.pages.length, groups);

                //remember the page height
                this.$nextTick(()=>{
                    var h = document.getElementById("scrolled-area").scrollHeight;
                    var prev = 0;
                    if(this.pages.length > 1) prev = this.page_info[this.pages.length-2].bottom;
                    this.page_info.push({top: prev, bottom: h, height: h-prev, visible: true});
                });
                
            }, err=>{
                this.loading = false;
                console.error(err);
            });
        },

        start_upload() {
            this.uploading = true;
        },

        open(dataset_id) {
            this.$router.replace('/project/'+this.project._id+'/dataset/'+dataset_id);
            this.$root.$emit('dataset.view', {id: dataset_id,  back: './'});
        },

        check(dataset, event) {
            if (event.shiftKey && this.last_dataset_checked) {
                let datasetIds = Object.keys(this.all_datasets);
                let indexOfLast = datasetIds.indexOf(this.last_dataset_checked._id);
                let indexOfCurrent = datasetIds.indexOf(dataset._id);
                let performCheck = !this.selected[dataset._id];
                
                if (indexOfLast > indexOfCurrent) {
                    let tmp = indexOfLast;
                    indexOfLast = indexOfCurrent;
                    indexOfCurrent = tmp;
                }
                for (let i = indexOfLast; i <= indexOfCurrent; i++) {
                    let datasetToCheckOrUncheck = this.all_datasets[datasetIds[i]];
                    
                    datasetToCheckOrUncheck.checked = performCheck;
                    if (performCheck) {
                        Vue.set(this.selected, datasetToCheckOrUncheck._id, datasetToCheckOrUncheck);
                    }
                    else {
                        if (this.selected[datasetToCheckOrUncheck._id]) {
                            Vue.delete(this.selected, datasetToCheckOrUncheck._id);
                        }
                    }
                }
                
                // if checking was performed,
                // then update the last dataset checked
                if (performCheck) {
                    this.last_dataset_checked = dataset;
                }
                else {
                    this.last_dataset_checked = null;
                }
            } else {
                if(this.selected[dataset._id]) {
                    dataset.checked = false;
                    Vue.delete(this.selected, dataset._id);
                    this.last_dataset_checked = null;
                } else {
                    dataset.checked = true;
                    Vue.set(this.selected, dataset._id, dataset);
                    this.last_dataset_checked = dataset;
                }
            }
            //this.persist_selected();
        },

        clear_selected() {
            //unselect all 
            this.pages.forEach(page=>{
                for(var subject in page) {
                    page[subject].forEach(dataset=>{
                        dataset.checked = false;
                    });
                }
            });
            this.selected = {};
        },

        unselect(dataset) {
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
        },

        get_instance() {
            //first create an instance to download things to
            return this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.download",
                config: {
                    selected: this.selected,
                }
            }).then(res=>res.data);
        },

        set_uploader_options() {
            //dialog itself is opened via ref= on b-button, but I still need to pass some info to the dialog and retain task._id
            this.$root.$emit("uploader.option", {
                project: this.project,
            });
        },

        process() {
            this.check_agreements(this.project, ()=>{
                this.$root.$emit('instanceselecter.open', opt=>{
                    if(opt.instance) {
                        //using existing instance.. just submit staging task
                        this.submit_process(opt.project_id, opt.instance);
                    } else {
                        //need to create a new instance
                        //var project = this.projects[opt.project_id];
                        this.$http.post(Vue.config.wf_api+'/instance', {
                            desc: opt.desc,
                            config: {
                                brainlife: true,
                            },
                            //I can't use this.project.group_id because user might be running it on another project
                            group_id: opt.group_id, 
                        }).then(res=>{
                            this.submit_process(opt.project_id, res.data);
                        }).catch(err=>{
                            console.error(err);
                            this.$notify({type: 'error', text: err.body.message});
                        })
                    }
                });
            });
        },

        copy() {
            this.check_agreements(this.project, ()=>{
                this.$root.$emit('copytarget.open', opt=>{
                    let dataset_ids = [];
                    Object.values(this.group_selected).forEach(group=>{
                        dataset_ids = dataset_ids.concat(Object.keys(group));
                    });
                    this.$http.post('dataset/copy', {
                        dataset_ids,
                        project: opt.project_id,
                    }).then(res=>{
                        this.clear_selected();
                        this.$router.push("/project/"+opt.project_id);
                    });
                });
            });
        },

        downscript() {
            this.check_agreements(this.project, ()=>{
                let ids = [];
                for(let id in this.selected) {
                    ids.push(id);
                }
                let query = {_id: ids};
                this.$root.$emit("downscript.open", {find: query});
            });
        },

        remove() {
            if(confirm("Do you really want to remove all selected datasets?")) {
                this.check_agreements(this.project, ()=>{
                    this.$notify({type: "info", text: "Removing all selected datasets.."});
                    this.removing = true;
                    axios({
                        method: 'delete',
                        url: '/dataset',
                        data: { ids: Object.keys(this.selected) },
                    }).then(res=>{
                        this.$notify({type: "success", text: "Removed "+res.data.removed+" datasets"});
                        Object.values(this.selected).forEach(dataset=>{dataset.removed = true;});
                        this.clear_selected();
                        this.removing = false;
                    }).catch(err=>{
                        this.$notify({type: "error", text: err.toString()})
                        this.removing = false;
                    });
                });
            }
        },

        submit_process(project_id, instance) {
            let dataset_ids = [];
            Object.values(this.group_selected).forEach(group=>{
                dataset_ids = dataset_ids.concat(Object.keys(group));
            });
            this.$http.post('dataset/stage', {
                instance_id: instance._id,
                dataset_ids,
            }).then(res=>{
                this.clear_selected();
                this.$router.push("/project/"+project_id+"/process/"+instance._id);
            });
         }
    },
}
</script>

<style scoped>
.table-header {
transition: 0.2s right, 0.2s bottom, 0.2s left;
position: fixed;
top: 100px;
left: 200px;
right: 0px;
overflow-x: hidden;
padding-left: 10px;
padding-right: 16px;
color: #999;
}

.table-column {
text-transform: uppercase;
}

.list {
transition: 0.2s right, 0.2s bottom, 0.2s left;
position: fixed;
top: 165px;
bottom: 0px;
left: 200px;
right: 0px;
overflow-y: scroll;
padding-left: 10px;
background-color: white;
overflow-x: hidden;
}

h4 {
font-size: 13px;
font-weight: bold;
margin-bottom: 5px;
}


.rightopen .list,
.rightopen .table-header {
right: 250px;
}

.selected {
    transition: color, background-color 0.2s;
    background-color: #2185d0;
    color: white;
}

.selected-view {
    border-left: 1px solid #ddd;
    background-color: #eee;
    overflow-x: hidden;
    position: fixed;
    right: -250px;
    width: 250px;
    top: 95px;
    bottom: 0px;
    z-index: 2;
    transition: right 0.2s;
}
.selected-view h4 {
    color: #666;
    background-color: rgba(0,0,0,0.05);
    padding: 10px;
    padding-top: 15px;
    text-transform: uppercase;
    height: 45px;
}
.selected-view-open {
    right: 0px;
}
.selected-view .selected-item {
    background-color: white;
    margin-bottom: 1px;
    padding: 3px;
    padding-left: 10px;
}
.selected-view .selected-item:hover {
    color: #2693ff;
    cursor: pointer;
}
.selected-view .select-action {
    padding: 10px;
}
.select-group {
    margin-bottom: 10px;
}
.list .dataset {
    transition: background-color 0.3s;
    padding: 1px;
    margin-bottom: 1px;
}
.list .dataset.clickable:hover {
    background-color: #ccc;
}
.list .dataset.selected,
.list .dataset.selected:hover {
    background-color: #2693ff;
}
.stats {
    opacity: 0.5;
}
.list  .subjects {
    border-top: 1px solid #eee;
    padding: 5px 0px;
}
.list  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: fade clip; 
}
.loading {
    position: fixed;
    bottom: 25px;
    left: 380px; 
    z-index: 10;
    opacity: 0.5;  
}
.dataset-checker {
    float: left;
    margin:3px;
    margin-right: 5px;
    opacity: 0.25;
    transition: opacity 0.3s;
    transform: scale(1.5);
}
.dataset:hover .dataset-checker,
.dataset.selected .dataset-checker {
    opacity: inherit; 
}

/*why don't I just *hide* removed datasets? because remove() doesn't recalculate page height to preseve the current scroll position*/
.removed {
background-color: #ccc;
color: white;
}
.button-fixed.selected-view-open {
right: 300px;
}
.filter {
float: right;
opacity: 0.7;
width: 50%;
cursor: pointer;
transition: width 0.3s;
}
.filter:focus {
opacity: 1;
width: 100%;
cursor: inherit;
}
.filter-active {
cursor: inherit;
opacity: 1;
background-color: #2693ff;
color: white;
width: 100%;
}
</style>

