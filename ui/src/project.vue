<template>
<div>
    <div v-if="error" class="page-content error">{{error}}</div>
    <div v-if="selected">
        <div class="page-header">
            <div style="float: right;">
                <div @click="edit()" v-if="isadmin()" class="button">
                    <icon name="edit" scale="1.25"/>
                </div>
            </div>
            <h4>
                <projectaccess :access="selected.access" style="position: relative; top: -3px;"/> 
                {{selected.name}}
            </h4>
        </div>
        <div class="page-content tabs">
            <b-tabs class="brainlife-tab" v-model="tab">
                <!--without setting active="true" on active tab, b-tabs emits change event back to tab 0 at mount-->
                <b-tab v-for="(tabinfo, idx) in tabs" :key="tabinfo.id" :title="tabinfo.label" :active="tab == idx">
                    <template v-slot:title>
                        {{tabinfo.label}}

                        <!--let's show tab specific info-->
                        <span v-if="tabinfo.id == 'detail'">
                        </span>
                        
                        <span v-if="tabinfo.id == 'dataset'" style="opacity: 0.6; font-size: 80%;">
                            <span title="Number of subjects stored in archive" 
                                v-if="selected.stats && selected.stats.datasets && selected.stats.datasets.subject_count">
                               &nbsp;<icon name="user-friends" scale="0.8"/>&nbsp;&nbsp;{{selected.stats.datasets.subject_count}} 
                            </span>
                            <span title="Number of data-objects stored in archive"
                                v-if="selected.stats && selected.stats.datasets && selected.stats.datasets.count">
                                &nbsp;<icon name="cubes" scale="0.8"/>&nbsp;&nbsp;{{selected.stats.datasets.count}}
                            </span>
                        </span>
                        
                        <span v-if="tabinfo.id == 'process'" title="Number of tasks" style="opacity: 0.8;"> 
                            <div v-if="selected.stats && get_total(selected.stats.instances) > 0" style="display: inline-block; width: 75px;">
                                <stateprogress :states="selected.stats.instances"/>
                            </div>
                        </span>
                        
                        <span v-if="tabinfo.id == 'pipeline' && selected.stats && selected.stats.rules && (selected.stats.rules.active||selected.stats.rules.inactive)" 
                            title="Number of pipeline rules" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{selected.stats.rules.active}} <small>/ {{selected.stats.rules.active + selected.stats.rules.inactive}}</small>
                        </span>

                        <span v-if="tabinfo.id == 'groupanalysis' && selected.stats && selected.stats.groupanalysis && selected.stats.groupanalysis.sessions.length > 0" 
                            title="Number of Group Analysis Sessions" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{selected.stats.groupanalysis.sessions.length}}
                        </span>

                        <span v-if="tabinfo.id == 'pub' && selected.stats && selected.stats.publications > 0" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{selected.stats.publications}}
                        </span>
                    </template>
                </b-tab>
            </b-tabs>
        </div>
        <div v-if="tabs[tab].id == 'detail'">
            <div class="page-content">
                <!--detail-->
                <div class="project-header">
                    <projectavatar :project="selected" :height="140" :width="140" style="float: right; margin: -20px 100px 0 30px;"/>
                    <p style="line-height: 2.5em; margin-bottom: 0px; position: relative; top: -8px">
                        <b-badge pill class="bigpill" title="Project creation date">
                            <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;
                            {{new Date(selected.create_date).toLocaleDateString()}}
                        </b-badge>
                        <b-badge pill class="bigpill" title="Total size of data stored in archive"
                            v-if="selected.stats && selected.stats.datasets && selected.stats.datasets.size">
                            <icon name="folder" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.stats.datasets.size|filesize}}
                            <small>Total</small> <br>
                        </b-badge>
                        <b-badge pill class="bigpill" v-if="selected.stats && selected.stats.rules && selected.stats.rules.active > 0" title="Number of pipeline rules configured for this project">
                            <icon name="robot" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.stats.rules.active}}
                            <small>Active Pipeline Rules</small>
                        </b-badge>
                        <b-badge pill class="bigpill" title="Total CPU hours consumed by this project">
                            <icon name="server" style="opacity: 0.4;"/>&nbsp;&nbsp;{{(total_walltime/(3600*1000)).toFixed(2)}}
                            <small>CPU Hours</small>
                        </b-badge>
                        <b-badge pill class="bigpill" title="Group ID used by amaretti">
                            <icon name="id-badge" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.group_id}}
                            <small>Group ID</small>
                        </b-badge>
                    </p>
                    <p style="opacity: 0.8; margin-bottom: 0">
                        {{selected.desc||'no description.'}}
                    </p>
                </div><!--project header-->

                <b-alert :show="selected.removed" style="border-radius: 0px" variant="secondary">This project has been removed.</b-alert>
                <b-alert :show="selected.access == 'private' && selected.listed" style="border-radius: 0px; color: #888;" variant="secondary">
                    This project is listed for all users but only the members of the project can access its datasets, processes, and pipelines.
                </b-alert>
            
                <!--datatype box-->
                <div class="side" v-if="selected.stats">
                    <span class="form-header">Datatypes</span>
                    <p><small>This project contains the following datatypes</small></p>
                    <!--datatype was deprecated by datatype_details-->
                    <p v-if="!selected.stats.datasets.datatype_details">
                        <span v-for="datatype_id in selected.stats.datasets.datatypes" :key="datatype_id">
                            <b-badge variant="light">
                                <datatypetag :datatype="datatype_id"/> 
                            </b-badge>
                            &nbsp;
                        </span>
                    </p>

                    <div v-if="selected.stats.datasets.datatypes_detail">
                        <p v-for="detail in selected.stats.datasets.datatypes_detail" :key="detail.type">
                            <datatypetag :datatype="detail.type"/> 
                            <br>
                            <small style="opacity: 0.6;">
                                <icon name="user-friends"/> {{detail.subject_count}}
                                <icon name="cubes"/> {{detail.count}}
                                <span v-if="detail.size">({{detail.size|filesize}})</span>
                            </small>
                        </p>
                    </div>
                </div>

                <div class="main">
                    <div v-if="selected.agreements && selected.agreements.length > 0">
                        <span class="form-header">Agreements</span>
                        <p> <small class="text-muted">You must consent to the following agreement(s) before accessing data on this project.</small> </p>
                        <agreements :agreements="selected.agreements"/>
                        <br>
                    </div>

                    <div class="box">
                        <b-row>
                            <b-col lg>
                                <span class="form-header">Admins</span>
                                <p style="height: 50px; margin-bottom: 3px;">
                                    <small class="text-muted">can update project details, share processes, and create rules / publications.</small>
                                </p>
                                <contact v-for="c in selected.admins" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                <br>
                            </b-col>

                            <b-col lg>
                                <span class="form-header">Members</span>
                                <p style="height: 50px; margin-bottom: 3px;">
                                    <small class="text-muted">has read/write access to data, share processes, and create rules / publications.</small>
                                </p>
                                <contact v-for="c in selected.members" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                <p class="text-muted" v-if="selected.members.length == 0"><small>No Members</small></p>
                                <br>
                            </b-col>

                            <b-col lg v-if="config.user && selected.access == 'private' && selected.guests && selected.guests.length > 0">
                                <span class="form-header">Guests</span>
                                <p style="height: 50px; margin-bottom: 3px;">
                                    <small class="text-muted">has read access to data.</small>
                                </p>
                                <contact v-for="c in selected.guests" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                <br>
                            </b-col>
                        </b-row>
                    </div>

                    <!--
                    <div class="box" v-else>
                        <h3> Related Articles </h3>
                        <p>We couldn't find related articles please add more details to the description of the project</p>
                    </div>
                    -->


                    <div v-if="selected.readme" class="box">
                        <span class="form-header">Readme</span>
                        <br>
                        <vue-markdown v-if="selected.readme" :source="selected.readme" class="readme"></vue-markdown>
                    </div>

                    <div class="box" v-if="participants && Object.keys(participants).length > 0">
                        <span class="form-header">Participants Info</span>     
                        <p><small>Participants info provides information for each subject and can be used for the group analysis.</small></p>                        
                        <participants :subjects="participants" :columns="participants_columns" style="max-height: 500px; overflow: auto;"/>
                    </div>

                    <div class="box" v-if="selected.stats.apps && selected.stats.apps.length > 0">
                        <span class="form-header">App Usage</span>     
                        <p><small>Data archived in this project was generated using the following set of Apps</small></p>                        
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>DOI</th>
                                    <th>Github</th>
                                    <th>Branch</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="rec in selected.stats.apps" :key="rec._id">
                                    <td>{{rec.name}}</td>
                                    <td><a :href="'https://doi.org/'+rec.doi" :target="'doi_'+rec.doi">{{rec.doi}}</a></td>
                                    <td><a :href="'https://github.com/'+rec.service+'/tree/'+(rec.service_branch||'master')" :target="'github_'+rec.service">{{rec.service}}</a></td>
                                    <td>{{rec.service_branch||'master'}}</td>
                                    <td>{{rec.count}}</td>
                                </tr>
                            </tbody>
                        </table>

                    </div>

                    <div v-if="resource_usage && total_walltime > 3600*1000" class="box">      
                        <span class="form-header">Resource Usage</span>     
                        <p><small>Data-objects on this project has been computed using the following apps/resources.</small></p>             
                        <Plotly :data="resource_usage.data" 
                                :layout="resource_usage.layout" 
                                :options="resource_usage.options"
                                ref="resource_usage" 
                                :autoResize="true" 
                                :watchShallow="true"/>
                    </div>

                    <!--loading citations takes time and LOCK UP THE BROWSER WHILE LOADING IT!!!-->
                    <div v-if="selected.stats.apps && selected.stats.apps.length > 0">
                        <p v-if="!showCitations">
                            <b-button variant="outline-secondary" size="sm" @click="showCitations = true">Load Citation</b-button>
                        </p>
                        <div class="box" v-if="showCitations">
                            <span class="form-header">Citations</span>
                            <p><small>Please use the following citations to cite the Apps used by this project.</small></p>
                            <p v-for="app in uniqueApps" :key="app._id">
                                <icon name="robot" style="opacity: 0.5;"/> <b>{{app.name}}</b><br>
                                <citation :doi="app.doi"/> 
                            </p>

                            <div v-if="resource_citations.length > 0">
                                <p><small>Please use the following citations to cite the resources used by this project.</small></p>
                                <p v-for="(resource_citation, idx) in resource_citations" :key="idx">
                                    <icon name="server" style="opacity: 0.5;"/> <b>{{resource_citation.resource.name}}</b><br>
                                    <!--<small>{{resource_citation.resource.config.desc}}</small>-->
                                    <i>{{resource_citation.citation}}</i>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="box" v-if="selected.relatedPapers && selected.relatedPapers.length > 0">
                        <span class="form-header">Related Articles</span>
                        <p>
                            <small>We found the following journals/articles related to this project based on name/description through MAG</small>
                        </p>
                        <hr>
                        <div v-for="paper in selected.relatedPapers" :key="paper._id">
                            <mag  :paper="paper"/>
                            <br>
                        </div>
                    </div>

                    <vue-disqus ref="disqus" shortname="brain-life" :identifier="selected._id"/>

                    <div v-if="config.debug">
                        <pre>{{selected.mag}}</pre>
                        <pre>{{selected}}</pre>
                    </div>
                </div><!-- main content-->
            </div><!-- project detail content-->
            
        </div>

        <div v-if="tabs[tab].id == 'dataset'" class="page-content">
            <b-alert show variant="secondary" v-if="!config.user">
                Please login to see archived data objects.
            </b-alert>
            <b-alert show variant="secondary" v-else-if="selected.access != 'public' && !(ismember()||isadmin()||isguest())">
                For non public project, only the admin/members/guests of this project can access processes.
            </b-alert>
            <datasets :project="selected" :projects="projects" v-else :participants="participants"/>
        </div>

        <div v-if="tabs[tab].id == 'process'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">
                Only the admins or members of this project can access processes. Please contact the project admins to give you access.
            </b-alert>
            <processes :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'pipeline'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">
                Only the admins or members of this project can access pipelines. Please contact the project admin to give you access.
            </b-alert>
            <pipelines :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'groupanalysis'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access group analysis page. Please contact the project admin to give you access.</b-alert>
            <div v-else>
                <groupAnalysis :project="selected"/>
                <!--
                <div v-else class="margin20 text-muted">
                    <br>
                    Group Analysis is not enable for this project.
                </div>
                -->
            </div>
        </div>

        <div v-if="tabs[tab].id == 'pub'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access publications. Please contact the project admin to give you access.</b-alert>
            <publications :project="selected" v-else/>
        </div>

        <newtask-modal/>
        <datatypeselecter-modal/>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'
import VueMarkdown from 'vue-markdown'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import projectaccess from '@/components/projectaccess'
import projectavatar from '@/components/projectavatar'
import license from '@/components/license'
import pubcard from '@/components/pubcard'
import datasets from '@/components/datasets'
import processes from '@/components/processes'
import publications from '@/components/publications'
import pipelines from '@/components/pipelines'
import agreements from '@/components/agreements'
import stateprogress from '@/components/stateprogress'
//import noprocess from '@/assets/noprocess'
import resource from '@/components/resource'
import datatypetag from '@/components/datatypetag'
import participants from '@/components/participants'
import doibadge from '@/components/doibadge'
import mag from '@/components/mag'




import { Plotly } from 'vue-plotly'

//modals
import newtaskModal from '@/modals/newtask'
import datatypeselecterModal from '@/modals/datatypeselecter'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import citation from '@/components/citation'

let ps;

export default {
    components: { 
        projectaccess, 
        pageheader,     
        contact, 
        VueMarkdown, 
        projectavatar, 
        license,
        pubcard, 
        datasets,
        processes, 
        publications, 
        pipelines,
        agreements, 
        datatypetag, 
        participants,
        mag,
        doibadge,

        'groupAnalysis': ()=> import('@/components/groupanalysis'),

        //noprocess, 
        resource, 
        Plotly,

        newtaskModal, 
        datatypeselecterModal, 
        stateprogress,
        citation,
    },

    data () {
        return {
            selected: null, 
            resource_usage: null,
            total_walltime: 0,

            participants: null,
            participants_columns: null,

            tabs: [
                {id: "detail", label: "Detail"},
                {id: "dataset", label: "Archive"},
                {id: "process", label: "Preprocess"},
                {id: "pipeline", label: "Pipeline"},
                {id: "groupanalysis", label: "Analysis"},
                {id: "pub", label: "Publication"},
            ],
            tab: 0, //initial tab top open

            projects: null, //all projects that user can see summary of

            showCitations: false,
            datatypes: {}, //datatypes loadded (used by datatype_groups)

            error: null, //used to display error message while loading a project

            resource_citations: [],

            ws: null,

            config: Vue.config,

        }
    },

    watch: {
        /* needed by dataset modal > instanceselecter but it causes infinite redraw bug*/
        '$route': function() {
            var project_id = this.$route.params.id;
            if(project_id && this.selected && this.selected._id != project_id) {
                console.log("project chagned from", this.selected._id, "to", project_id)
                this.open_project(this.projects[project_id]);
            } else {
                this.handleRouteParams();
            }
        },

        tab: function() {
            //TODO - maybe make pubform a modal so that I don't have to do this.
            this.publishing = false;
            this.pub_editing = null;
            if(this.$route.params.tab != this.tabs[this.tab].id) {
                console.log("switching to different tab............");
                this.$router.replace("/project/"+this.selected._id+"/"+this.tabs[this.tab].id);
            }
        },
    },

    computed: {
        uniqueApps() {
            if(!this.selected ||
                !this.selected.stats ||
                !this.selected.stats.apps) return [];
            let dois = [];
            let apps = [];
            this.selected.stats.apps.forEach(app=>{
                if(dois.includes(app.doi)) return;
                dois.push(app.doi);
                apps.push(app);
            });
            return apps;
        }
    },

    mounted() {
        //load all projects that user has summary access (including removed ones so we can open it)
        this.$http.get('project', {params: {
            limit: 500,
            select: '-readme'
        }}).then(res=>{
            this.projects = {};
            res.data.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

            //decide which project to open
            let project_id = this.$route.params.id
            if(!this.projects[project_id]) {
                this.error = "You don't have access to the project, or the project ID is invalid. Please contact the project owner and ask to add you to the member/guest of the project.";
                return;
            }
  
            if(!project_id) {
                //if no project id is specified, use last_projectid_used
                let ids = Object.keys(this.projects); 
                project_id = localStorage.getItem("last_projectid_used");
                if(!this.projects[project_id]) project_id = ids[0];
            }
            this.open_project(this.projects[project_id]);

            /*
            this.$bvToast.toast('toast to you', {
                //autoHideDelay: 5000,
            });
            */
    
        }).catch(err=>{
            console.error(err);
            if(err.response) {
                this.$notify({type: 'error', text: err.response.data.message});
                this.error = err.response.data.message;
            }
        });
    },

    destroyed() {
        if(this.ws) this.ws.close();
    },

    methods: {

        get_total(instances) {
            if(!instances) return 0;
            let counts = 0;
            for(let key in instances) {
                counts += instances[key];
            }
            return counts;
        },

        handleRouteParams() {
            console.log("handleRouteParams", this.$route.params)
            var tab_id = this.$route.params.tab;
            if(tab_id) {
                //lookup tab index from the tab_id
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == tab_id) {
                        this.tab = idx; 
                    }
                });
            } else {
                //console.log("tab is not set.. switching to detail tab");
                //this.$router.replace("/project/"+this.selected._id+"/detail");
                //this.tab = "detail"; //should fire tab watcher
            }
        },

        edit() {
            this.$router.push('/project/'+this.selected._id+'/edit');
        },

        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/projects');
        },

        openneuro() {
            document.location = "https://openneuro.org/datasets/"+this.selected.openneuro.dataset_id;
        },

        isguest() {
            if(!Vue.config.user) return false;
            if(!this.selected) return false;
            if(~this.selected.guests.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        isadmin() {
            if(!Vue.config.user) return false;
            if(!this.selected) return false;
            if(~this.selected.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember() {
            if(!Vue.config.user) return false;
            if(!this.selected) return false;
            if(~this.selected.members.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        remove() {
            if(confirm("Do you really want to remove this project?")) {
                this.$http.delete('project/'+this.selected._id)
                .then(res=>{
                    this.selected.removed = true;
                    this.$router.push('/project');        
                });
            }
        },

        open_project(project) {
            this.selected = project;
            this.$http.get('project', {params: {
                find: JSON.stringify({
                    _id: project._id,
                }),
            }}).then(res=>{
                let full_project = res.data.projects[0];
                for(var key in full_project) {
                    this.selected[key] = full_project[key];
                }
                localStorage.setItem("last_projectid_used", project._id);

                //https://github.com/ktquez/vue-disqus/issues/11#issuecomment-354023326
                if(this.$refs.disqus && window.DISQUS) {
                    this.$refs.disqus.reset(window.DISQUS);
                }

                this.handleRouteParams();
            });

            //optionally.. load participant info
            if(this.isadmin() || this.ismember()) {
                this.participants = null;
                this.axios.get("/participant/"+project._id).then(res=>{
                    if(res.data) {
                        this.participants = res.data.subjects||{}; 
                        this.participants_columns = res.data.columns||{}; 
                    }
                });
            }

            if(this.ws) {
                this.ws.close();
            }
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                //console.debug("connecting to warehouse ex (project.update)");
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse",
                        key: "project.update.*."+project._id,
                    }
                }));
                this.ws.onmessage = (json)=>{
                    var event = JSON.parse(json.data);
                    for(let k in event.msg) {
                        if(this.selected[k] === undefined) this.selected[k] = event.msg[k];
                        else Object.assign(this.selected[k], event.msg[k]);
                    }
                };
            };
            this.update_resource_usage_graph();
        },

        update_resource_usage_graph() {
            
            //create resource usage graph
            if(this.selected.stats && this.selected.stats.resources) {
                let resources = {};
                this.total_walltime = 0;
                let services = [];
                this.selected.stats.resources.forEach(stat=>{
                    if(stat.total_walltime == 0) return;
                    this.total_walltime += stat.total_walltime;
                    if(!resources[stat.resource_id]) {
                        resources[stat.resource_id] = {
                            x: [], //walltime
                            y: [], //list of apps for this resource
                            text: [], //count?
                            name: stat.resource_id+" (private)",
                            type: "bar",
                            orientation: 'h'
                        };
                    }
                    let d = resources[stat.resource_id];
                    if(!services.includes(stat.service)) services.push(stat.service);
                    if(!d.x.includes(stat.service)) {
                        d.x.push(stat.total_walltime/(3600*1000));
                        d.y.push(stat.service);
                        d.text.push(stat.count.toString()+" tasks");
                    }
                });

                //query resource info
                let resource_ids = Object.keys(resources);
                this.$http.get(Vue.config.amaretti_api+"/resource", {params: {
                    find: JSON.stringify({
                        _id: {$in: resource_ids},
                    }),
                    select: 'name config.desc',
                }})
                .then(res=>{
                    //set resource names
                    res.data.resources.forEach(resource=>{
                        resources[resource._id].name = resource.name;
                    });

                    //collect resource citation
                    this.selected.stats.resources.forEach(stat=>{
                        if(!stat.citation) return; //don't show resources with no citations
                        let resource = res.data.resources.find(r=>r._id == stat.resource_id);
                        if(!resource) return; //no such resource?
                        let resource_citations = this.resource_citations.find(r=>r.resource._id == stat.resource_id);
                        if(!resource_citations) this.resource_citations.push({resource, citation: stat.citation});    
                    });

                    //create plotly graph
                    var data = Object.values(resources);
                    var layout = {
                        yaxis: {
                            //title: 'Apps'
                        },
                        xaxis: {
                            title: 'Total Walltime (hour)',  
                            type: 'log',
                            //autorange: true
                            showgrid: true,
                        },
                        barmode: 'relative',
                        margin: {
                            t: 20,
                            l: 240,
                            pad: 10
                        },
                        height: 17*services.length+120,
                        font: Vue.config.plotly.font,
                        paper_bgcolor: "#fff0",
                    };

                    let options = {
                        //until my PR gets accepted, we need to resize this ... https://github.com/statnett/vue-plotly/pull/18
                        toImageButtonOptions: {
                            width: 1200,
                            height: 600,
                        },
                        
                        modeBarButtonsToAdd: [{
                            name: 'SVG',

                            //TODO - I should find a better logo for svg export
                            icon: {
                                'width': 1792,
                                'path': 'M1344 1344q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h465l135 136q58 56 136 56t136-56l136-136h464q40 0 68 28t28 68zm-325-569q17 41-14 70l-448 448q-18 19-45 19t-45-19l-448-448q-31-29-14-70 17-39 59-39h256v-448q0-26 19-45t45-19h256q26 0 45 19t19 45v448h256q42 0 59 39z',
                                'ascent': 1792,
                                'descent': 0,
                            },
                            click: ()=>{
                                let plot = this.$refs.resource_usage;
                                plot.downloadImage({format: 'svg'/*, height: plot.$el.clientHeight, width: plot.$el.clientWidth*/});
                            }
                        }],
                    }
                    this.resource_usage = {options, data, layout};
                });
            }
        },

        getvariant(state) {
            switch(state) {
            case "running": return "primary";
            case "requested": return "info";
            case "finished": return "success";
            case "stopped": return "secondary";
            case "failed": return "danger";
            default: return "dark";
            }
        },
    },
}
</script>

<style scoped>
.page-header {
padding: 10px 20px;    
}

.page-header h4 {
margin-right: 150px; 
}

.page-content {
overflow-x: hidden;
top: 95px;
}
.project-header {
padding: 20px; 
box-shadow: 0 0 2px #ccc;
background-color: white;
top: 0px;
z-index: 7;
overflow: hidden;
}
.tabs {
top: 50px;
height: 45px;
background-color: white; 
box-shadow: 0px 0px 2px #ccc;
z-index: 1;
}

.datasets_link {
color:#44f;
cursor:pointer;
font-weight:bold;
}

.datasets_link:hover {
color:#88f;
}

.pub-removed {
background-color: #aaa;
opacity: 0.6;
}
.pub:hover {
background-color: #eee;
}
.box {
background-color: #fff; 
padding: 20px; 
margin-bottom: 20px;
box-shadow: 0 0 3px #0002;
border-radius: 4px;
}
.button-page {
float: left;
position: relative;
left: -10px;
z-index: 1;
opacity: 0.6;
}

p.info {
position: relative;
margin-left: 25px;
}
p.info .fa-icon {
position: absolute;
left: -25px;
top: 2px;
}
.datatypes {
padding: 10px;
box-shadow: 1px 1px 3px #ddd;
margin-bottom: 10px;
}
.datatypes .datatypes-header {
opacity: 0.5; 
font-weight: bold; 
font-size: 85%;
margin-bottom: 5px; 
text-transform: uppercase;    
}
.bigpill {
padding: 5px 10px;
}
.error {
    top: 0px;
    padding: 20px;
    background-color: #eee;
    color: #666;
}

.side {
    float: right; 
    width: 280px; 
    padding: 20px; 
    position: sticky; 
    top: 0px;
}
.main {
    margin: 20px; 
    margin-right: 300px;
}

@media only screen and (max-width: 1100px) {
    .side {
        display: none;
    }
    .main {
        margin-right: 20px;
    }
}
</style>
