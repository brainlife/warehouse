<template>
<div v-if="selected">
    <div class="page-header">
        <div style="float: right;">
            <div @click="openneuro()" v-if="selected.openneuro" class="button">
                <icon name="external-link-alt" scale="1.25"/>
                OpenNeuro
            </div>
            <div @click="edit()" v-if="isadmin()" class="button">
                <icon name="edit" scale="1.25"/>
            </div>
        </div>
        <div @click="back()" class="button button-page">
            <icon name="angle-left" scale="1.25"/>
        </div>
        <h4>
            <projectaccess :access="selected.access" style="position: relative; top: -3px;"/> 
            {{selected.name}}
        </h4>
    </div>
    <div class="sub-header">
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
                    
                    <span v-if="tabinfo.id == 'pipeline' && selected.stats && selected.stats.rules && selected.stats.rules.active" title="Number of pipeline rules" style="opacity: 0.6; font-size: 80%;">
                        &nbsp;{{selected.stats.rules.active}}
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
                <p style="opacity: 0.8;  padding-bottom: 10px; height: 85px; overflow-y: auto;">
                    {{selected.desc||'no description.'}}
                </p>
                <br clear="left">
            </div><!--project header-->

            <b-alert :show="selected.removed" style="border-radius: 0px" variant="secondary">This project has been removed.</b-alert>
            <b-alert :show="selected.access == 'private' && selected.listed" style="border-radius: 0px; color: #888;" variant="secondary">
                This project is listed for all users but only the members of the project can access its datasets, processes, and pipelines.
            </b-alert>
        
            <!--datatype box-->
            <div style="float: right; width: 280px; padding: 20px; position: sticky; top: 140px;" v-if="selected.stats">
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

            <div style="margin: 20px; margin-right: 300px;">
                <div v-if="selected.agreements && selected.agreements.length > 0">
                    <span class="form-header">Agreements</span>
                    <p> <small class="text-muted">You must consent to the following agreement(s) before accessing data on this project.</small> </p>
                    <agreements :agreements="selected.agreements"/>
                    <br>
                </div>

                <div class="box">
                    <b-row>
                        <b-col>
                            <span class="form-header">Admins</span>
                            <p style="height: 50px; margin-bottom: 3px;">
                                <small class="text-muted">Update project details, share processes, and create rules / publications.</small>
                            </p>
                            <p v-for="c in selected.admins" :key="c._id" style="margin-bottom: 8px;">
                                <contact :id="c"/>
                            </p>
                            <br>
                        </b-col>

                        <b-col>
                            <span class="form-header">Members</span>
                            <p style="height: 50px; margin-bottom: 3px;">
                                <small class="text-muted">Read/Write access to data, share processes, and create rules / publications.</small>
                            </p>
                            <p v-for="c in selected.members" :key="c._id" style="margin-bottom: 8px;">
                                <contact :id="c"/>
                            </p>
                            <p class="text-muted" v-if="selected.members.length == 0"><small>No Members</small></p>
                            <br>
                        </b-col>

                        <b-col v-if="config.user && selected.access == 'private' && selected.guests && selected.guests.length > 0">
                                <span class="form-header">Guests</span>
                                <p style="height: 50px; margin-bottom: 3px;">
                                    <small class="text-muted">Read access to dataset.</small>
                                </p>
                                <p v-for="c in selected.guests" :key="c._id" style="margin-bottom: 8px;">
                                    <contact :id="c"/>
                                </p>
                                <!--
                                <p class="text-muted" v-if="!selected.guests || selected.guests.length == 0"><small>No Guests</small></p>
                                -->
                                <br>
                        </b-col>
                    </b-row>
                </div>

                <div v-if="selected.readme" class="box">
                    <span class="form-header">Readme</span>
                    <br>
                    <vue-markdown v-if="selected.readme" :source="selected.readme" class="readme"></vue-markdown>
                </div>

                <div class="box" v-if="participants && Object.keys(participants).length > 0">
                    <span class="form-header">Participants Info</span>     
                    <p><small>participants info provides information for each subject and can be used for the group analysis.</small></p>             
                    <participants :rows="participants" :columns="participants_columns" style="max-height: 500px; overflow: auto;"/>
                </div>

                <div v-if="resource_usage && total_walltime > 3600*1000" class="box">      
                    <span class="form-header">Resource Usage</span>     
                    <p><small>Data-objects on this project has been computed using the following apps/resources.</small></p>             
                    <vue-plotly :data="resource_usage.data" :layout="resource_usage.layout" :options="resource_usage.options"
                            ref="resource_usage" :autoResize="true" :watchShallow="true"/>
                </div>

                <div v-if="resource_citations.length > 0" class="box">
                    <span class="form-header">Resource Citations</span>
                    <p><small>Please use the following citations to cite the resources used by this project.</small></p>
                    <p v-for="(resource_citation, idx) in resource_citations" :key="idx">
                        <icon name="caret-right"/> <b>{{resource_citation.resource.name}}</b><br>
                        <small>{{resource_citation.resource.config.desc}}</small>
                        <br>
                        <i>{{resource_citation.citation}}</i>
                    </p>
                </div>

                <vue-disqus ref="disqus" shortname="brain-life" :identifier="selected._id"/>

                <div v-if="config.debug">
                    <pre>{{selected}}</pre>
                </div>
            </div><!-- main content-->
        </div><!-- project detail content-->
        
    </div>

    <!--
    <div v-if="tabs[tab].id == 'participants'" style="margin-left: 40px; margin-top: 95px">
        <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access participants information. Please contact the project admin to give you access.</b-alert>
        <participants :project="selected" v-else/>
    </div>
    -->

    <div v-if="tabs[tab].id == 'dataset'" style="margin-left: 40px; margin-top: 95px">
        <b-alert show variant="secondary" v-if="selected.access != 'public' && !(ismember()||isadmin()||isguest())">For non public project, only the admin/members/guests of this project can access processes.</b-alert>
        <datasets :project="selected" :projects="projects" v-else :participants="participants"/>
    </div>

    <div v-if="tabs[tab].id == 'process'" style="margin-left: 40px; margin-top: 95px">
        <noprocess v-if="!(ismember()||isadmin())"/>
        <processes :project="selected" v-else/>
    </div>

    <div v-if="tabs[tab].id == 'pipeline'" style="margin-left: 40px; margin-top: 95px">
        <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access pipelines. Please contact the project admin to give you access.</b-alert>
        <pipelines :project="selected" v-else/>
    </div>

    <div v-if="tabs[tab].id == 'groupanalysis'" style="margin-left: 40px; margin-top: 95px">
        <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access group analysis page. Please contact the project admin to give you access.</b-alert>
        <groupAnalysis :project="selected" v-else/>
    </div>

    <div v-if="tabs[tab].id == 'pub'" style="margin-left: 40px; margin-top: 95px">
        <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access publications. Please contact the project admin to give you access.</b-alert>
        <publications :project="selected" v-else/>
    </div>

    <newtask-modal/>
    <datatypeselecter-modal/>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'
import VueMarkdown from 'vue-markdown'
import VuePlotly from '@statnett/vue-plotly'

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
import noprocess from '@/assets/noprocess'
import resource from '@/components/resource'
import datatypetag from '@/components/datatypetag'
import participants from '@/components/participants'

//modals
import newtaskModal from '@/modals/newtask'
import datatypeselecterModal from '@/modals/datatypeselecter'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import PerfectScrollbar from 'perfect-scrollbar'

let ps;

export default {
    components: { 
        //TODO - use inline import..
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

        'groupAnalysis': ()=> import('@/components/groupanalysis'),

        noprocess, 
        resource, 
        VuePlotly,

        newtaskModal, 
        datatypeselecterModal, 
        stateprogress,
    },

    data () {
        return {
            selected: null, 
            resource_usage: null,
            total_walltime: 0,

            participants: null,
            participants_columns: null,
            //participants_editing: null,

            tabs: [],

            tab: 0, //initial tab
            projects: null, //all projects that user can see summary of
            config: Vue.config,

            datatypes: {}, //datatypes loadded (used by datatype_groups)

            resource_citations: [],

            ws: null, //websocket

        }
    },

    computed: {},

    watch: {
        '$route': function() {
            var project_id = this.$route.params.id;
            if(project_id && this.selected && project_id != this.selected._id) {
                this.open_project(this.projects[project_id]);
            }
            var tab_id = this.$route.params.tab;
            if(tab_id) {
                //find the tab requested
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == tab_id) {
                        this.tab = idx; 
                    }
                });
            }         
        },

        tab: function() {
            //tab gets changed even if value doesn't change.. so I have to hve if statement like this..
            //console.log(this.tab, this.tabs);
            var tabid = this.tabs[this.tab].id;
            if(tabid != this.$route.params.tab) {
                console.log("tab seems to have really changed", tabid);

                //TODO - maybe make pubform a modal so that I don't have to do this.
                this.publishing = false;
                this.pub_editing = null;

                this.$router.replace("/project/"+this.selected._id+"/"+this.tabs[this.tab].id);
            }
        },
    },

    mounted() {

        this.tabs.push({id: "detail", label: "Detail"});
        this.tabs.push({id: "dataset", label: "Archive"});
        this.tabs.push({id: "process", label: "Processes"});
        if(Vue.config.user) {
            this.tabs.push({id: "pipeline", label: "Pipelines"});
            if(Vue.config.debug) this.tabs.push({id: "groupanalysis", label: "Group Analysis"});
            this.tabs.push({id: "pub", label: "Publications"});
        }

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
                this.$notify({type: 'error', duration: 10000, text: "You don't have access to the project, or the project ID is invalid. Please contact the project owner and ask to add you to the member/guest of the project."});
                this.$router.replace("/projects");
                return;
            }
  
            if(!project_id) {
                //if no project id is specified, use last_projectid_used
                let ids = Object.keys(this.projects); 
                project_id = localStorage.getItem("last_projectid_used");
                if(!this.projects[project_id]) project_id = ids[0];
            }
            this.open_project(this.projects[project_id]);
    
            //open tab requested..
            if(this.$route.params.tab) {
                //find the tab requested
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == this.$route.params.tab) {
                        console.log("setting tab", idx);
                        this.tab = idx; //this has an effect of *clicking* the tab..
                    }
                });
            } else {
                //if no tab is opened, open first pag
                console.log("resetting url due to missing tab");
                this.$router.replace("/project/"+project_id+"/"+this.tabs[this.tab].id);
            }
        }).catch(err=>{
            console.error(err);
            this.$notify({type: 'error', text: err.response.data.message});
        });
    },

    destroyed() {
        if(this.ws) {
            console.log("disconnecting from ws - project");
            this.ws.close();
        }
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

        change_project(project) {
            console.log("change project");
            this.$router.push('/project/'+project._id+'/'+this.$route.params.tab);
            this.open_project(project);
        },

        open_project(project) {
            if(this.selected == project) return; //no point of opening project if it's already opened
            this.selected = project;

            //load full detail
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
            });

            //optionally.. load participant info
            if(this.isadmin() || this.ismember()) {
                console.log("loading participants info");
                this.participants = null;
                this.axios.get("/participant/"+project._id).then(res=>{
                    if(res.data) {
                        this.participants = res.data.rows||{}; 
                        this.participants_columns = res.data.columns||{}; 
                    }
                });
            }

            if(this.ws) this.ws.close();
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.debug("connecting to warehouse ex");
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse",
                        key: "project.update.*."+project._id,
                    }
                }));
                this.ws.onmessage = (json)=>{
                    var event = JSON.parse(json.data);
                    console.dir(event);

                    //update
                    for(var key in event.msg) {
                        this.selected[key] = event.msg[key];
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

        /*
        editParticipants() {
            this.participants_editing = JSON.stringify(this.participants, null, 4);
        },
        saveParticipants() {
            try {
                this.participants = JSON.parse(this.participants_editing);
                this.participants_editing = null;
                //TODO - save

            } catch(err) {
                this.$notify({type: 'error', text: err});
            }
        },
        */

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

.sub-header {
position: fixed;
top: 50px;
height: 45px;
left: 40px;  
right: 0px; 
background-color: white; 
box-shadow: 0px 0px 2px #ccc;
z-index: 1;
}
.page-content {
top: 95px;
overflow-x: hidden;
}
.project-header {
padding: 20px; 
box-shadow: 0 0 2px #ccc;
background-color: white;
position: sticky;
top: 0;
z-index: 7;
height: 140px;
overflow: hidden;
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
</style>
