<template>
<div>
    <div :class="{rightopen: selected_count}">
        <div class="page-header">
            <div style="float: right; position: relative; top: -3px;">
                <b-form-input class="filter" :class="{'filter-active': query != ''}" size="sm" v-model="query" placeholder="Filter" @input="change_query_debounce"></b-form-input>
            </div>
            <div style="margin-top: 2px;">
                <b>{{total_subjects}}</b> Subjects &nbsp;&nbsp;&nbsp; <b>{{total_datasets}}</b> Datasets
            </div>
        </div>

        <div class="page-content">
            <div v-if="loading" class="loading"><icon name="cog" spin scale="2"/></div>

            <b-row class="list-header">
                <b-col cols="2"><h4>Subject</h4></b-col>
                <!--everything under subject is grouped, thus a odd layout-->
                <b-col>
                    <b-row>
                        <b-col><h4>Datatype</h4></b-col>
                        <b-col><h4>Description</h4></b-col>
                        <b-col><h4>Create&nbsp;Date</h4></b-col>
                        <b-col><h4>Tags</h4></b-col>
                    </b-row>
                </b-col>
            </b-row>

            <!--start of dataset list-->
            <div class="list" id="scrolled-area">
                <div v-for="(page, page_idx) in pages" v-if="datatypes">
                    <div v-if="page_info[page_idx] && page_info[page_idx].visible === false" 
                        :style="{height: page_info[page_idx].height}">
                        <!--show empty div to speed up rendering if it's outside the view-->
                        <pre>{{page_info[page_idx].height}}</pre>
                    </div>
                    <b-row class="subjects" v-for="(datasets, subject) in page" :key="subject" v-else>
                        <b-col cols="2">
                            <strong>{{subject}}</strong>
                        </b-col>
                        <b-col>
                            <div v-for="dataset in datasets" :key="dataset._id" @click="open(dataset._id)" class="dataset clickable" :class="{selected: dataset.checked}">
                                <div class="row" v-if="!dataset.removed">
                                    <div class="col-md-3 truncate">
                                        <input type="checkbox" v-model="dataset.checked" @click.stop="check(dataset)" class="dataset-checker">
                                        <datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags" style="margin-top: 1px;"></datatypetag>
                                        <icon v-if="dataset.status == 'storing'" name="cog" :spin="true" style="color: #2693ff;" scale="0.8"/>
                                        <icon v-if="dataset.status == 'failed'" name="exclamation-triangle" style="color: red;" scale="0.8"/>
                                        <icon v-if="dataset.status == 'archived'" name="archive" scale="0.8"/>
                                        <icon v-if="!dataset.status" name="question-circle" style="color: gray;" scale="0.8"/>
                                        <span class="text-primary" v-if="dataset.publications && dataset.publications.length > 0">
                                            <icon name="book" scale="0.8"/>
                                            <small v-if="dataset.publications.length > 1">{{dataset.publications.length}}</small>
                                        </span>
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
                                <!--<p v-else>Removed</p>-->
                            </div>
                        </b-col>
                    </b-row>
                 </div> 
            </div><!--scrolled-area-->

            <b-button class="button-fixed" v-b-modal.uploader 
                @click="set_uploader_options" v-if="isadmin() || ismember()"
                title="Upload Dataset" 
                :class="{'selected-view-open':selected_count}">
                <icon name="plus" scale="2"/>
            </b-button>

        </div><!--page-content-->
    </div>

    <div class="selected-view" :class="{'selected-view-open':selected_count}" v-if="datatypes">
        <h4 class="header">
            <div class="button" style="float: right; position: relative; top: -3px" @click="clear_selected()"><icon name="times"/></div>
            <icon name="check-square" style="position: relative; top: 3px; margin-right: 10px;"/> {{selected_count}} Selected 
        </h4>

        <div v-for="(_datasets, did) in group_selected" :key="did" v-if="datatypes[did]" class="select-group">
            <datatypetag :datatype="datatypes[did]"/>
            <div class="selected-item" v-for="(dataset, id) in _datasets" :key="id" @click="open(id)">
                <div @click.stop="remove_selected(dataset)" style="display: inline;" title="Unselect">
                    <icon name="times"></icon>
                </div>
                {{dataset.meta.subject}} 
                <small>
                    <tags :tags="dataset.datatype_tags"></tags>
                </small>
                <small v-if="dataset.project != project._id" style="opacity: 0.5">
                    <icon name="shield-alt"/> {{projects[dataset.project].name}}</span>
                </small>
            </div>
        </div>

        <div class="select-action">
            <p>
                <b-button size="sm" @click="download">
                    <icon name="download" scale="0.8"/> Dowload (BIDS)
                    <small v-if="selected_size > 0"> | {{selected_size|filesize}}</small>
                </b-button>
            </p>
            <p>
                <b-button size="sm" @click="process"><icon name="paper-plane" scale="0.8"/> Stage For Processing</b-button>
            </p>
            <p>
                <b-button size="sm" @click="remove" variant="danger"><icon name="trash" scale="0.8"/> Remove</b-button>
            </p>
        </div>
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

var query_debounce = null;
var scroll_debounce = null;

import ReconnectingWebSocket from 'reconnectingwebsocket'

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
            loading: null,

            last_groups: {},

            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id

            query: "", //localStorage.getItem('datasets.query'), //I don't think I should persist .. causes more confusing
            ws: null, //websocket

            //cache
            datatypes: null,

            config: Vue.config,
        }
    },

    computed: {
        selected_count: function() {
            return Object.keys(this.selected).length;
        },
        selected_size: function() {
            var size = 0;
            for(var did in this.selected) {
                if(this.selected[did].size) {
                    size += this.selected[did].size;
                } else {
                    console.log("size not set for dataset", did);
                }
            }
            return size;
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
        //load all datatypes (TODO .. cache it?)
        return this.$http.get('datatype')
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
        var area = document.getElementById("scrolled-area").parentNode;
		area.addEventListener("scroll", this.page_scrolled);

        let subid = this.$route.params.subid;
        if(subid) this.$root.$emit('dataset.view', {id: subid, back: './'});
    },

    watch: {
        //when user select different project, this gets called (mounted() won't be called anymore)
        project: function() {
            this.query = ""; //clear query to avoid confusion
            if(this.loading) this.loading.abort();
            this.reload();
        },
        '$route': function() {
            let subid = this.$route.params.subid;
            console.log("route change", subid);
            this.$root.$emit('dataset.view', {id: subid, back: './'});
        },
    },

	methods: {

        isadmin() {
            if(!this.project) return false;
            if(~this.project.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember: function() {
            if(!this.project) return false;
            if(~this.project.members.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        reload: function() {
            console.log("datasets reloaeed..................");
            this.pages = [];
            this.page_info = [];
            this.last_groups = {};
            this.total_datasets = null;
            this.total_subjects = null;
            this.load();

            //get number of subjects stored 
            //console.log("querying subjects");
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({$and: this.get_mongo_query()}),
                distinct: 'meta.subject'
            }}).then(res=>{
                this.total_subjects = res.body.length;
            });

            console.log("listen to all dataset change enent under this project", this.project._id);
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            if(this.ws) this.ws.close();
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("binding to dataset updates for project:", this.project._id);
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
                            if(dataset.removed) this.remove_selected(dataset);
                            this.$forceUpdate(); //need this because I am not inside vue hook?
                        }
                    });
                 } 
            }
        },
        
		page_scrolled: function() {
            var e = document.getElementById("scrolled-area").parentNode;
            var scroll_top = e.scrollTop;
            var client_height = e.clientHeight;
            var page_margin_bottom = e.scrollHeight - scroll_top - client_height;
            if (page_margin_bottom < 300) {
                this.load();
            }
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

        get_mongo_query: function() {
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
                        if(this.datatypes[id].name.includes(q)) datatype_ids.push(id);
                    }
                    ands.push({$or: [
                        {"meta.subject": {$regex: q}},
                        {"desc": {$regex: q}},
                        {"tags": {$regex: q}},
                        {"datatype_tags": {$regex: q}},
                        {"datatype": {$in: datatype_ids}},
                    ]});
                });
                finds.push({$and: ands});
            }
            return finds;
        },

        load: function() {
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

            //console.log("fetching datasets");
            this.$http.get('dataset', {
                before(request) {
                    //console.log("loading ..........");
                    this.loading = request;
                },
                params: {
                    find: JSON.stringify({$and: this.get_mongo_query()}),
                    skip: loaded,
                    limit: 200, 
                    //select: '-prov',
                    sort: 'meta.subject meta.session -create_date'
                }
            })
            .then(res=>{
                this.total_datasets = res.body.count;
                var groups = this.last_groups; //start with the last subject group from previous load

                var last_subject = null;
                res.body.datasets.forEach(dataset=>{
                    dataset.checked = this.selected[dataset._id];
                    var subject = "nosub"; //not all datasets has subject tag
                    if(dataset.meta && dataset.meta.subject) subject = dataset.meta.subject; 
                    if(dataset.meta.session) subject += " session "+dataset.meta.session;
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
                    var h = document.getElementById("scrolled-area").parentNode.scrollHeight;
                    var prev = 0;
                    if(this.pages.length > 1) prev = this.page_info[this.pages.length-2].bottom;
                    this.page_info.push({top: prev, bottom: h, height: h-prev, visible: true});

                    //console.log("done loading..");
                    this.loading = null;
                });
            }, err=>{
                console.error(err);
                this.loading = null;
            });
        },

        start_upload: function() {
            this.uploading = true;
        },

        open: function(dataset_id) {
            this.$router.push('/project/'+this.project._id+'/dataset/'+dataset_id);
            this.$root.$emit('dataset.view', {id: dataset_id,  back: './'});
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

        temp_stage_selected: function(instance) {
            //create config to download all selected data from archive
            var download = [];
            var datatypes = {};

            return this.$http.get('dataset/token', {
                params: {
                    ids: JSON.stringify(Object.keys(this.selected))
                },
            }).then(res=>{
                var jwt = res.body.jwt;
                for(var dataset_id in this.selected) {
                    download.push({
                        url: Vue.config.api+"/dataset/download/safe/"+dataset_id+"?at="+jwt,
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

                //now submit
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "brainlife.download.stage",
                    service: "soichih/sca-product-raw",
                    config: { download },
                    remove_date: remove_date,
                });
            }).then(res=>res.body.task);
        },

        set_uploader_options: function() {
            //dialog itself is opened via ref= on b-button, but I still need to pass some info to the dialog and retain task._id
            this.$root.$emit("uploader.option", {
                project: this.project,
            });
        },

        download: function() {
            this.check_agreements(this.project, ()=>{
                var download_instance = null;
                var download_task = null;
                this.get_instance().then(instance=>{
                    download_instance = instance;
                    return this.temp_stage_selected(instance);
                }).then(task=>{
                    download_task = task;

                    //load task prov
                    let task_ids = [];
                    for(var dataset_id in this.selected) {
                        let dataset = this.selected[dataset_id]; 
                        if(!dataset.prov || !dataset.prov.task_id) return;
                        task_ids.push(dataset.prov.task_id); 
                    } 
                    return this.$http.get(Vue.config.amaretti_api+'/task', {
                        params: {
                            find: JSON.stringify({_id: {$in: task_ids}})
                        },
                    });
                })
                .then(res=>{
                    var tasks = res.body.tasks;

                    //submit another sca-product-raw service to organize files 
                    var symlink = [];
                    for(var dataset_id in this.selected) {
                        var dataset = this.selected[dataset_id]; 
                        var datatype = this.datatypes[dataset.datatype];
                        var datatype_tags = dataset.datatype_tags;

                        var subject = null;
                        if(dataset.meta && dataset.meta.subject) subject = dataset.meta.subject;

                        var download_path = "../"+download_task._id+"/"+dataset_id;

                        //figure out the best process name
                        var process_name = "brainlife-upload"; 
                        if(dataset.prov && dataset.prov.task_id) {
                            var task = tasks.find(t=>t._id == dataset.prov.task_id);
                            if(task) process_name = task.service.replace("/", "-");
                        }

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
                    this.clear_selected();
                    this.$router.push("/download/"+download_instance._id);
                }).catch(res=>{
                    this.$notify({type: 'error', text: res.toString()});
                });
            });
        },

        process: function() {
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
                            group_id: opt.group_id,
                        }).then(res=>{
                            this.submit_process(opt.project_id, res.body);
                        }).catch(err=>{
                            console.error(err);
                            this.$notify({type: 'error', text: err.body.message});
                        })
                    }
                });
            });
        },

        remove: function() {
            if(confirm("Do you really want to remove all selected datasets?")) {
                this.check_agreements(this.project, ()=>{
                    async.forEach(this.selected, (dataset, next)=>{
                        if(!dataset._canedit) {
                            this.$notify({type: "error", text: "You don't have permission to remove this dataset: "+dataset._id});
                            return next();
                        }
                        console.log("deleting", dataset);
                        this.$http.delete('dataset/'+dataset._id).then(res=>{
                            next();
                        }).catch(next);
                    }, err=>{
                        if(err) {
                            this.$notify({type: "error", text: err.body.message});
                        } else {
                            this.$notify({type: "success", text: "dataset(s) successfully removed"});
                        }
                    });
                });
            }
        },

        submit_process: function(project_id, instance) {
            //submit data staging task (TODO - Instead of downloading each datatypes, I feel I should group by subject)
            var tid = 0;
            //var did = 0;
            async.eachOfSeries(this.group_selected, (datasets, datatype_id, next_group)=>{
                var download = [];
                var _outputs = [];
                this.$http.get('dataset/token', {
                    params: {
                        ids: JSON.stringify(Object.keys(datasets))
                    },
                }).then(res=>{
                    var jwt = res.body.jwt;
                    for(var dataset_id in datasets) {
                        download.push({
                            url: Vue.config.api+"/dataset/download/safe/"+dataset_id+"?at="+jwt,
                            untar: "auto",
                            dir: dataset_id,
                        });
                        _outputs.push(Object.assign(datasets[dataset_id], {
                            id: dataset_id, 
                            //did: did++,
                            subdir: dataset_id, 
                            dataset_id,
                            prov: null,
                        }));
                    }
                    return this.$http.post(Vue.config.wf_api+'/task', {
                        instance_id: instance._id,
                        name: "Staging Datasets - "+this.datatypes[datatype_id].name,
                        service: "soichih/sca-product-raw",
                        config: { download, _outputs, _tid: tid++ },
                    });
                }).then(res=>{
                    console.log("submitted download task", res.body.task);
                    next_group();
                }).catch(err=>{
                    next_group(err.body.message);
                });
            }, err=>{
                if(err) {
                    console.error(err);
                    this.$notify({type: 'error', text: err});
                    return;
                }

                this.clear_selected();
                this.$router.push("/project/"+project_id+"/process/"+instance._id);
            });
        }
    },
}
</script>

<style scoped>

.page-header {
position: fixed;
top: 100px;
left: 350px;
padding: 10px;
right: 15px;
height: 45px;
color: #999;
z-index: 1;
}

.page-content {
position: fixed;
margin-top: 50px;
left: 350px;
padding-left: 10px;
right: 0;
/*
overflow-y: hidden;
padding-right: 14px;
background-color: white;
*/
}
/*
.page-content::-webkit-scrollbar {
width: 30px;
overflow-y: scroll;
}
*/
.page-content:hover {
/*
padding-right: 0px;
*/
overflow-y: visible;
}

h4 {
font-size: 15px;
font-weight: bold;
margin-bottom: 7px;
}

.page-header h4 {
font-size: 16px;
font-weight: bold;
color: #999;
}

.page-content {
background-color: white;
transition: right 0.2s, bottom 0.2s;
top: 95px;
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
    border-left: 1px solid #ddd;
    background-color: #eee;
    overflow-x: hidden;
    position: fixed;
    right: -250px;
    width: 250px;
    top: 100px;
    bottom: 0px;
    z-index: 2;
    transition: right 0.2s;
}
.selected-view .header {
    color: #666;
    background-color: rgba(0,0,0,0.1);
    padding: 10px;
    text-transform: uppercase;
}
.selected-view-open {
    right: 0px;
}
.selected-view .selected-item {
    background-color: rgba(0,0,0,0.04);
    margin-bottom: 1px;
    padding: 4px;
    padding-left: 10px;
}
.selected-view .selected-item:hover {
    color: #2693ff;
    cursor: pointer;
}
.selected-view .select-action {
    border-top: 1px solid #ddd;
    margin-top: 10px;
    padding: 10px;
}
.select-group {
    margin-bottom: 10px;
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
.stats {
    opacity: 0.5;
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
    left: 380px; 
    z-index: 10;
    opacity: 0.5;  
}
.dataset-checker {
    width: 20px;
    height: 20px;
    float: left;
    margin-right: 5px;
}
.button-fixed.selected-view-open {
right: 300px;
}
.filter {
opacity: 0.7;
width: 50px;
cursor: pointer;
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
.list-header {
opacity: 0.4;
padding-top: 5px;
text-transform: uppercase;
}
.row {
flex-wrap:nowrap;
}
</style>

