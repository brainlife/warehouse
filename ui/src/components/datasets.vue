<template>
<div>
    <div :class="{rightopen: selected_count}">
        <div v-if="loading" class="loading" :class="{sidemenuwide: $root.sidemenuWide}"><icon name="cog" spin scale="2"/></div>
        <div class="table-header onRight">
            <div style="float: right; position: relative; top: 4px;">
                <b-form-input id="filter" class="filter" :class="{'filter-active': query != ''}" size="sm" v-model="query" placeholder="Filter" @input="change_query_debounce"></b-form-input>
            </div>

            <div style="padding: 5px 0px; margin-bottom: 10px;">
                <b>{{total_subjects}}</b> Subjects &nbsp;&nbsp;&nbsp; <b>{{total_datasets}}</b> Objects
                <span v-if="total_size">({{total_size|filesize}})</span>
            </div>

            <b-row class="table-column">
                <b-col cols="2"><h4>Subject <small style="opacity: 0.5">/ Ses</small></h4></b-col>
                <b-col cols="10">
                    <b-row>
                        <b-col cols="3"><h4>Datatype</h4></b-col>
                        <b-col cols="3"><h4>App/Description</h4></b-col>
                        <b-col cols="3"><h4>Create&nbsp;Date</h4></b-col>
                        <b-col cols="3"><h4>Tags</h4></b-col>
                    </b-row>
                </b-col>
            </b-row>
        </div>

        <div class="page-content" ref="scrolled-area" @scroll="page_scrolled">
            <div v-if="!loading && total_datasets == 0" style="margin: 20px; opacity: 0.8;">
                Please upload data by clicking the button on the right bottom corner of the page. You can also copy data from another project.
            </div>
            
            <!--start of dataset list-->
            <div v-for="(page, page_idx) in pages" v-if="datatypes" :key="page_idx" style="font-size: 12px;">
                <div v-if="page_info[page_idx] && !page_info[page_idx].visible" :style="{'height': page_info[page_idx].height+'px'}">
                </div>
                <b-row class="subjects" v-for="group in Object.keys(page).sort()" :key="group" :ref="'sub-'+group" v-else>
                    <b-col cols="2" class="subject-column truncate">
                        <strong>{{group}}</strong>

                        <div class="participantInfo" v-if="participants">
                            <span v-for="(v, k) in participantsObj[page[group]._subject]" :key="k">
                                <small>{{k}}</small> {{v}}
                            </span>
                        </div>
                    </b-col>
                    <b-col cols="10">
                        <div v-for="dataset in page[group]" :key="dataset._id" @click="open(dataset._id)" class="dataset clickable" 
                            :class="{selected: dataset.checked, removed: dataset.removed}">
                            <b-row v-if="visible_subjects.includes(group)">
                                <b-col cols="3" class="truncate">
                                    <input :disabled="dataset.removed" type="checkbox" v-model="dataset.checked" 
                                        @click.stop="check(dataset, $event)" class="dataset-checker">
                                    <datatypetag :datatype="datatypes[dataset.datatype]" :clickable="false" :tags="dataset.datatype_tags"/>
                                </b-col>
                                <b-col cols="3" class="truncate">
                                    <icon v-if="dataset.status == 'storing'" name="cog" :spin="true" style="color: #2693ff;" scale="0.8"/>
                                    <icon v-if="dataset.status == 'failed'" name="exclamation-triangle" style="color: red;" scale="0.8"/>
                                    <icon v-if="dataset.status == 'archived'" name="archive" scale="0.8"/>
                                    <icon v-if="!dataset.status" name="question-circle" style="color: gray;" scale="0.8"/>
                                    <b-badge size="small" v-if="dataset.storage != 'osiris'">{{dataset.storage}}</b-badge>
                                    <small style="font-size: 80%;" v-if="dataset.prov && dataset.prov.task && dataset.prov.task.name">
                                        {{dataset.prov.task.name}} / 
                                    </small>
                                    <span>{{dataset.desc||'&nbsp;'}}</span>
                                </b-col>
                                <b-col cols="3" class="truncate">
                                    <small v-if="dataset.size" style="float: right;" :class="{'text-danger': dataset.size > 1000000000}">
                                        {{dataset.size|filesize}}</small>
                                    <time>{{new Date(dataset.create_date).toLocaleString()}}</time>
                                </b-col>
                                <b-col cols="3" class="truncate">
                                    <tags :tags="dataset.tags"></tags>
                                </b-col>
                            </b-row>
                        </div>
                    </b-col>
                </b-row>
            </div> 
        </div><!--list-->

        <b-btn class="button-fixed" v-b-modal.uploader 
            @click="set_uploader_options" v-if="isadmin() || ismember()"
            :class="{'selected-view-open':selected_count}">
            Upload Data
        </b-btn>

    </div>

    <div class="selected-view onRight" :class="{'selected-view-open':selected_count}" v-if="datatypes">
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
            <p v-if="config.user">
                <!-- 
                    I can't add  v-if="isadmin() || ismember()" here.. because user could mix datasets from other project.
                    I need to analyze which dataset can be edited
                -->
                <b-btn size="sm" @click="remove" variant="outline-danger"><icon name="trash" scale="0.8"/> Remove<!--<span v-if="remove_remain">({{remove_remain}})</span>--></b-btn>
            </p>
        </div>

        <div v-for="(_datasets, did) in group_selected" :key="did" v-if="datatypes[did]" class="select-group">
            <datatypetag :datatype="datatypes[did]" style="padding: 5px;"/>
            <div class="selected-item" v-for="(dataset, id) in _datasets" :key="id" @click="open(id)">
                <div @click.stop="unselect(dataset)" style="float: right; padding-right: 3px;" title="Unselect">
                    <icon name="times"></icon>
                </div>
                <span v-if="dataset.meta">{{dataset.meta.subject}}</span>
                <small>
                    <tags :tags="dataset.datatype_tags"></tags>
                </small>
                <!-- how could the project be different?
                <small v-if="dataset.project != project._id" style="opacity: 0.5">
                    <icon name="shield-alt"/> {{projects[dataset.project].name}}</span>
                </small>
                -->
            </div>
        </div>

        <p style="opacity: 0.5; margin: 10px">You can select multiple objects by holding the shift key on first and last object that you'd like to select.</p>
        <br clear="both">
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import pageheader from '@/components/pageheader'
import tags from '@/components/tags'
import datatypetag from '@/components/datatypetag'

import agreementMixin from '@/mixins/agreement'
import datatypesMixin from '@/mixins/datatypes'

const async = require('async');

let query_debounce = null;
let scroll_debounce = null;

import ReconnectingWebSocket from 'reconnectingwebsocket'

import axios from 'axios'

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default {
    mixins: [
        agreementMixin,
        datatypesMixin,
    ],
    components: { 
        tags, pageheader, datatypetag, 
    },
    props: ['project', 'participants'],
    data () {
        return {
            pages: [], //groups of datasets 

            participantsObj: {},

            total_datasets: null, //number of datasets for this project
            total_subjects: null, //number of subjects for this project
            total_size: null,

            page_info: [], //{top/bottom/visible/}
            visible_subjects: [],

            loading: false,

            last_groups: {},
            last_meta: null,

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

        //used to do range select
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
        this.loadDatatypes({}, err=>{
            if(err) console.error(err);
            this.reload();
        });

        let subid = this.$route.params.subid;
        if(subid) {
            this.$root.$emit('dataset.view', {id: subid, back: './'});
        }

        this.applyParticipants();
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
                //console.log("canceling load");
                source.cancel('cancel due to project navigation');
                this.loading = false;
            }
            this.reload();
        },
        '$route': function() {
            var tab_id = this.$route.params.tab;
            if(tab_id == "dataset") {
                let subid = this.$route.params.subid;
                this.$root.$emit('dataset.view', {id: subid, back: './'});
            }
        },

        participants() {
            this.applyParticipants();
        },
    },

	methods: {
        applyParticipants() {
            if(this.participants) {
                if(Array.isArray(this.participants)) {
                    this.participants.forEach(rec=>{
                        this.participantsObj[rec.subject] = rec;
                    });
                } else {
                    //deprecated format.. 
                    this.participantsObj = this.participants;
                }
            }
        },

        isadmin() {
            if(!this.project) return false;
            if(!Vue.config.user) return false;
            if(~this.project.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember() {
            if(!this.project) return false;
            if(!Vue.config.user) return false;
            if(~this.project.members.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        reload() {
            this.pages = [];
            this.page_info = [];
            this.last_groups = {};
            this.last_meta = null;
            this.total_datasets = null;
            this.total_size = null;
            this.total_subjects = null;
            this.load();

            //get number of subjects stored 
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify(this.get_mongo_query()),
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

                //TODO - maybe I should listen to this in project.vue? components/process.vue also listens to dataset events
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse",
                        key: "dataset.update.*."+this.project._id+".#",
                    }
                }));
            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                if(!event.dinfo) return; //??
                if(this.removing) return; //ignore rush of removed datasets events that slows down UI update
                let dataset = event.msg;

                let routingKey = event.dinfo.routingKey; //"dataset.update.1.5aaeb3dc7bc1.5e309"
                let dataset_id = routingKey.split(".")[4];
                //console.log(routingKey, dataset_id);

                //look for the dataset
                this.pages.forEach(page=>{
                    let old_dataset = null;
                    for(var subject in page) {
                        var datasets = page[subject];
                        old_dataset = datasets.find(d=>d._id == dataset_id);
                        if(old_dataset) break;
                    }
                    if(old_dataset) {
                        //console.log("updating");
                        //apply updates (don't apply all changes.. it could blow up populated field)
                        if(dataset.desc !== undefined) old_dataset.desc = dataset.desc;
                        if(dataset.tags) old_dataset.tags = dataset.tags;
                        if(dataset.meta) old_dataset.meta = dataset.meta;
                        if(dataset.removed !== undefined) {
                            old_dataset.removed = dataset.removed;
                            if(dataset.removed) this.unselect(dataset);
                        }
                        if(dataset.status) old_dataset.status = dataset.status;
                    }
                });
            }
        },
        
		page_scrolled() {
            let e = this.$refs["scrolled-area"];
            var scroll_top = e.scrollTop;
            var client_height = e.clientHeight;
            var page_margin_bottom = e.scrollHeight - scroll_top - client_height;
            if (page_margin_bottom < 2000) {
                this.load();
            }

            //hide page that's not in the view
            //TODO - now that we do subject level visibility check, we might not need to check for page visibility..
            this.page_info.forEach(page=>{
                if(page.bottom+1000 < scroll_top || page.top-1000 > scroll_top+client_height) page.visible = false;
                else page.visible = true;
            });

            this.update_subject_visibility();
        },

        update_subject_visibility() {
            //show record that are in view
            this.visible_subjects = [];

            let page = this.$refs["scrolled-area"];
            var scroll_top = page.scrollTop;
            var client_height = page.clientHeight;

            for(let i = 0;i < this.pages.length;++i) {
                let page = this.pages[i];
                if(!this.page_info[i].visible) continue;
                for(var subject in page) {
                    let subject_e = this.$refs['sub-'+subject][0];
                    if(!subject_e) continue; //odd?
                    if((subject_e.offsetTop+subject_e.clientHeight+1000) < scroll_top || 
                        subject_e.offsetTop-1000 > scroll_top+client_height) continue; //out of view
                    this.visible_subjects.push(subject);
                }
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
			var finds = {
                removed: false,
                project: this.project._id,
            };

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
                finds["$and"] = ands;
            }
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
            let query = this.get_mongo_query();
            //add "skip" statements. The actual mongo skip is too slow
            if(this.last_meta) {
                if(!this.last_meta.session) {
                    //we don't have session, so just start from the last subject
                    query["meta.subject"] = {$gte: this.last_meta.subject};
                } else {
                    //we have both subject/session. this is a bit tricky because we want to skip the
                    //sessions already loaded for the current subject
                    query["$or"] = [
                        //we want following session on the last subject
                        {
                            "meta.subject": this.last_meta.subject,
                            "meta.session": {$gte: this.last_meta.session},
                        },

                        //and all subjects/session greater than the current one
                        {
                            "meta.subject": {$gt: this.last_meta.subject}
                        }                    
                    ];
                }
                /*
                if(this.last_meta.subject) or.push({
                    "meta.subject": {$gte: this.last_meta.subject},
                });
                if(this.last_meta.session) or.push({
                    "meta.subject": this.last_meta.subject,
                    "meta.session": {$gte: this.last_meta.session},
                });
                */
            }

            this.$http.get('dataset', {
                params: {
                    find: JSON.stringify(query),
                    limit: 500,  //needs to be bigger than the largest dataset per subject x2 (bigger == slower for vue to render)
                    sort: 'meta.subject meta.session -create_date',
                    select: 'create_date datatype datatype_tags prov.task.name desc size tags meta.subject meta.session meta.run status removed project storage',
                },
                cancelToken: source.token
            })
            .then(res=>{
                this.loading = false;
                if(this.last_meta == null)  {
                    this.total_datasets = res.data.count;
                    this.total_size = res.data.size;
                }
                let groups = this.last_groups; //start with the last subject group from previous load
                let last_group = null;

                res.data.datasets.forEach((dataset, idx)=>{
                    dataset.checked = this.selected[dataset._id]; //TODO - what is this?
                    var group = "nosub"; //not all datasets has subject tag(TODO - should be required?)

                    this.last_meta = dataset.meta;
                    if(dataset.meta.subject) group = dataset.meta.subject; 
                    if(dataset.meta.session) group += " / " + dataset.meta.session;
                    last_group = group;
                    if(!groups[group]) Vue.set(groups, group, []);
                    groups[group]._subject = dataset.meta.subject; //to help with displaying meta data for this subject
                    //when reload the next page, we start from the last subject/session to load remaining
                    //items for that subject/session. this means we could end up with duplicate items on the
                    //first group. I need to "dedupe" if that happens
                    let duplicate = groups[group].find(d=>d._id == dataset._id);
                    if(!duplicate) {
                        //dataset.desc = (loaded+1)+" "+dataset.sec; //debug
                        groups[group].push(dataset);
                        //console.log(group, dataset.desc);
                        loaded++;
                    }
                });

                this.last_groups = {};
                if(this.total_datasets != loaded) {
                    //don't add last subject group - in case we might have more datasets for that key in the next page - so that we can join them together
                    this.last_groups[last_group] = groups[last_group];
                    delete groups[last_group];
                }

                //Vue.set(this.pages, this.pages.length, groups);
                this.pages.push(groups);

                this.$nextTick(this.rememberHeights);
                this.loading = false;
            }, err=>{
                this.loading = false;
                console.error(err);
            });
        },

        rememberHeights() {
            //remember the page height
            var h = this.$refs["scrolled-area"].scrollHeight;
            var prev = 0;
            if(this.pages.length > 1) prev = this.page_info[this.pages.length-2].bottom;
            let info = {
                top: prev, 
                bottom: h, 
                height: h-prev, 
                visible: true
            };
            this.page_info.push(info);
            this.update_subject_visibility();
        }, 

        start_upload() {
            this.uploading = true;
        },

        open(dataset_id) {
            this.$router.replace('/project/'+this.project._id+'/dataset/'+dataset_id);
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
            if(!Vue.config.user) return alert("Please Sign Up/Login first to run analysis on this dataset");
            this.check_agreements(this.project, ()=>{
                this.$root.$emit('instanceselecter.open', opt=>{
                    if(opt.instance) {
                        //using existing instance.. just submit staging task
                        this.submit_process(opt.project_id, opt.instance);
                    } else {
                        //need to create a new instance
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
            if(!Vue.config.user) return alert("Please Sign Up/Login first to copy this dataset");
            this.check_agreements(this.project, ()=>{
                this.$root.$emit('copytarget.open', opt=>{
                    let dataset_ids = [];
                    Object.values(this.group_selected).forEach(group=>{
                        dataset_ids = dataset_ids.concat(Object.keys(group));
                    });
                    this.$root.$emit("loading",{message: "Copying objects ..."});
                    this.$http.post('dataset/copy', {
                        dataset_ids,
                        project: opt.project_id,
                    }).then(res=>{
                        this.$root.$emit("loading", {show: false});
                        this.clear_selected();
                        this.$router.push("/project/"+opt.project_id);
                    }).catch(err=>{
                        this.$root.$emit("loading", {show: false});
                        this.$notify({text: err.response.data.message, type: "error"});
                    });
                });
            });
        },

        downscript() {
            if(!Vue.config.user) return alert("Please Sign Up/Login first to download this dataset");
            this.check_agreements(this.project, ()=>{
                let ids = [];
                for(let id in this.selected) {
                    ids.push(id);
                }
                let query = {_id: ids};
                this.$root.$emit("downscript.open", {query});
            });
        },

        remove() {
            if(confirm("Do you really want to remove all selected objects?")) {
                this.check_agreements(this.project, ()=>{
                    this.$notify({type: "info", text: "Removing all selected objects.."});
                    this.removing = true;
                    axios({
                        method: 'delete',
                        url: '/dataset',
                        data: { ids: Object.keys(this.selected) },
                    }).then(res=>{
                        this.$notify({type: "success", text: "Removed "+res.data.removed+" objects"});
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
                this.$router.replace("/project/"+project_id+"/process/"+instance._id);
            }).catch(err=>{
                this.$notify({type: "error", text: err.toString()})
            });
        },
    },
}
</script>

<style scoped>
.table-header {
    position: fixed;
    top: 100px;
    left: 40px;
    overflow-x: hidden;
    padding-left: 10px;
    padding-right: 16px;
    color: #999;

    transition: left 0.2s, right 0.2s;
}
.sidewide .table-header {
    left: 180px;
}

.table-column {
    text-transform: uppercase;
}

.page-content {
    transition: right 0.2s, left 0.2s;
    top: 165px;
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

.rightopen .page-content,
.rightopen .table-header {
    right: 280px;
}
.rightviewOpen .rightopen .page-content,
.rightviewOpen .rightopen .table-header {
    right: 600px;
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
    margin-right: -250px;
    width: 250px;
    top: 95px;
    bottom: 0px;
    z-index: 2;
    transition: margin-right 0.2s, right 0.2s;
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
    margin-right: 0px;
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
    padding: 5px 10px;
}
.select-group {
    margin-bottom: 10px;
}
.dataset {
    transition: background-color 0.3s;
    padding: 1px;
    margin-bottom: 1px;
    height: 20px;
}
.dataset.clickable:hover {
    background-color: #ccc;
}
.dataset.selected,
.dataset.selected:hover {
    background-color: #2693ff;
}
.stats {
    opacity: 0.5;
}
.subjects {
    border-top: 1px solid #eee;
    padding: 5px 0px;
}
.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.loading {
    position: fixed;
    bottom: 25px;
    left: 50px;
    z-index: 10;
    opacity: 0.5;  
}
.loading.sidemenuwide {
    left: 200px;
}
.dataset-checker {
    float: left;
    margin: 1px 3px;
    margin-right: 5px;
    opacity: 0.25;
    transition: opacity 0.3s;
    height: 16px;
    width: 16px;
}
.dataset:hover .dataset-checker,
.dataset.selected .dataset-checker {
    opacity: inherit; 
}

/*why don't I just *hide* removed objects? because remove() doesn't recalculate page height to preseve the current scroll position*/
.removed {
    background-color: #ccc;
    color: white;
}
.button-fixed.selected-view-open {
    margin-right: 300px;
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
.participantInfo {
    font-size: 90%;
}
.subject-column {
    min-height: 35px;
}
</style>

