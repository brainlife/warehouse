<template>
<div>
    <div v-if="noaccess" class="page-content">
        <b-container>
            <h3 style="padding: 50px 0 15px 0;opacity: 0.7"><icon name="lock" class="text-secondary" scale="1.5"/> Private App</h3>
            <b-alert show variant="secondary">
                The App you are trying access is a private App (belongs to a specific brainlife project). You must be logged in and also must be a member 
                of the project to which this App belongs. Please contact the current maintainer of this App.
            </b-alert>
        </b-container>
    </div>
    <div v-if="app" class="page-content">
        <div class="header">
            <b-container style="position: relative;">
                <div @click="back()" class="button button-page">
                    <icon name="angle-left" scale="1.5"/>
                </div>
                <b-row>
                    <b-col cols="9"><!--hide avatar when screen is narrow-->
                        <div style="float: right; position: relative; z-index: 3">
                            <a :href="'https://github.com/'+app.github" :target="app.github"><span class="button" title="github"><icon name="brands/github" scale="1.25"/></span></a>
                           
                            <span class="button" @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" title="Edit"><icon name="edit" scale="1.25"/></span>                
                            <b-dropdown size="sm" variant="link" toggle-class="text-decoration-none" no-caret>
                                <template v-slot:button-content style="padding: 0px;">
                                    <span class="button"><icon name="ellipsis-v" scale="1.25"/></span>
                                </template>
                                <b-dropdown-item @click="copy()" v-if="app._canedit" title="Copy" style="opacity: 0.7;">
                                    <icon name="copy" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Clone
                                </b-dropdown-item>
                                <b-dropdown-item @click="remove()" v-if="app._canedit" title="Remove" style="opacity: 0.7;">
                                    <icon name="trash" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Remove
                                </b-dropdown-item>
                                <b-dropdown-item @click="download_app()" style="opacity: 0.7;">
                                    <icon name="download" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Download
                                </b-dropdown-item>
                                <b-dropdown-item @click="show_badge_url('/app/'+app._id+'/badge')" style="opacity: 0.7;" >
                                    <icon name="certificate" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Generate Badge
                                </b-dropdown-item>
                            </b-dropdown>
                            <b-btn @click="execute" variant="primary" size="sm" style="margin-top: 3px;"><icon name="play"/>&nbsp;&nbsp;&nbsp;<b>Execute</b></b-btn>    
 
                        </div>
                
                        <h5 style="margin-bottom: 3px;">
                            <b-badge v-if="app.projects && app.projects.length > 0" variant="secondary" title="Private App">
                                <icon name="lock" scale="0.8"/>
                            </b-badge>
                            {{app.name}}
                        </h5>
                        <h6 style="opacity: 0.8;">
                            <a target="github" :href="'https://github.com/'+app.github+'/tree/'+(app.github_branch||'master')" style="color: gray;">{{app.github}}</a>
                            <small><b-badge variant="secondary" v-if="app.github_branch" style="position: relative; top: -2px"><icon name="code-branch" scale="0.6"/> {{app.github_branch}}</b-badge></small>
                        </h6>
                        <p style="opacity: 0.85">
                            {{app.desc_override||app.desc}}
                        </p>
                    </b-col>
                    <b-col cols="3">
                        <appavatar :app="app" style="margin-bottom: 20px;"/>
                    </b-col>
                </b-row>
            </b-container>
            <b-alert :show="app.removed" variant="secondary">This App has been removed.</b-alert>
        </div><!--header-->

        <b-container>
            <!-- detail -->
            <div v-if="tab_index == 0">
                <b-row>

                    <b-col cols="9">

                        <b-card v-if="app.deprecated_by" no-body style="margin-bottom: 10px">
                            <span slot="header">
                                <icon name="regular/calendar-times"/> This App has been deprecated by the following App
                            </span>
                            <app :appid="app.deprecated_by"/>
                        </b-card>

                        <!--input/output-->
                        <p><small class="text-muted">This App uses the following input/output datatypes</small></p>
                        <div style="position: relative;">
                            <b-row>
                                <!--input-->
                                <b-col style="padding-bottom: 10px;">
                                    <div style="height: 100%; border: 2px solid #007bff; border-radius: 4px;">
                                        <div style="background-color: #007bffd0; padding: 5px 15px; font-weight: bold; color: white;">Input</div>
                                        <b-alert show variant="primary" v-if="!app.inputs || app.inputs.length == 0">No Input</b-alert>
                                        <div v-if="app.inputs && app.inputs.length > 0" style="padding: 5px">
                                            <div v-for="input in app.inputs" :key="input.id" class="io-card">
                                                <small style="opacity: 0.5; float: right;">{{input.id}}</small><!--internal output id-->
                                                <datatype :datatype="input.datatype" :datatype_tags="input.datatype_tags">
                                                    <template slot="tag_extra">
                                                        <span v-if="input.multi" style="opacity: 0.8">(multi)</span>
                                                        <b-badge v-if="input.optional" style="opacity: 0.8">optional</b-badge>
                                                        <p v-if="input.desc" style="margin-bottom: 0px; font-size: 80%;">{{input.desc}}</p>
                                                    </template>
                                                </datatype>
                                            </div>
                                        </div>
                                    </div>
                                </b-col>

                                <!--output-->
                                <b-col style="margin-bottom: 10px;">
                                    <icon name="arrow-right" style="position: absolute; top: 50%; left: -10px; opacity: 0.5" scale="1.5"/>
                                    <div style="height: 100%; border: 2px solid #28a745; border-radius: 4px;">
                                        <div style="background-color: #28a745d0; padding: 5px 15px; font-weight: bold; color: white;">Output</div>
                                        <b-alert show variant="success" v-if="!app.outputs || app.outputs.length == 0">No Output</b-alert>
                                        <div v-if="app.outputs && app.outputs.length > 0" style="padding: 5px;">
                                            <div v-for="output in app.outputs" :key="output.id" class="io-card">
                                                <small style="opacity: 0.5; float: right;">{{output.id}}</small><!--internal output id-->
                                                <datatype :datatype="output.datatype" 
                                                        :datatype_tags="output.datatype_tags" 
                                                        :tag_pass="output.datatype_tags_pass">
                                                    <template slot="tag_extra">
                                                        <span v-if="output.datatype_tags_pass" title="tag pass through from this input dataset">+ <b>{{output.datatype_tags_pass}}</b></span>
                                                        <p v-if="output.desc" style="margin-bottom: 0px; font-size: 80%;">{{output.desc}}</p>
                                                    </template>
                                                </datatype>
                                                <small style="position: relative" v-if="output.output_on_root && output.files"> 
                                                    <b>Output Mapping</b>
                                                    <!--<pre v-highlightjs v-if="output.files"><code class="json hljs">{{output.files}}</code></pre>-->
                                                    <editor v-if="output.files" v-bind:value="JSON.stringify(output.files, null, 4)" @init="editorInit" lang="json" theme="chrome"></editor>
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </b-col>
                            </b-row>
                            <br>
                        </div><!--input/ouput-->

                        <div v-if="app.projects && app.projects.length > 0">
                            <span class="form-header">Projects</span>
                            <p><small class="text-muted">Only the members of the following project(s) can view and execute this App.</small></p>
                            <div v-for="project in app.projects" :key="project._id" class="project-card" @click="go('/project/'+project._id)">
                                <b-row>
                                    <b-col cols="2">
                                        <projectavatar :project="project" :height="50" :width="50"/>
                                    </b-col>
                                    <b-col>
                                        <b>{{project.name}}</b>
                                        <p style="margin-bottom: 0px; color: gray;" class="text">{{project.desc}}</p>
                                    </b-col>
                                </b-row>
                            </div>
                            <br>
                        </div>

                        <div v-if="app.retry">
                            <span class="form-header">Retry</span>
                            <p>If this App fails, it will automatically be rerun up to <b>{{app.retry}}</b> times.</p>
                            <br>
                        </div>

                        <div v-if="resources">
                            <span class="form-header">Computing Resources</span>
                            <b-alert show variant="secondary" v-if="resources.length == 0" style="margin-bottom: 10px;">
                                This App is not registered to run on any resource that you have access to. 
                            </b-alert>
                            <b-alert show variant="secondary" v-else-if="!preferred_resource" style="margin-bottom: 10px;">
                                This App can not run on any resources that you have access to at the moment.
                            </b-alert>
                            <b-alert show variant="secondary" v-else-if="shared_resources.length == 0" style="margin-bottom: 10px;">
                                This App is only enabled on your private resource(s). Other users may not be able to run this App.
                            </b-alert>
                            <p v-else>
                                <small class="text-muted">This App can run on the following resources.</small>
                            </p>

                            <b-row>
                                <b-col cols="6" v-for="resource in resources" :key="resource._id">
                                    <div class="resource" v-b-popover.hover.d1000="resource.config.desc+'\n\n'+resource.detail.msg+'\nstatus:'+resource.status" :title="null">
                                        <!--
                                        <p style="padding: 10px; margin-bottom: 0px;">
                                            <icon v-if="resource.gids.length > 0" name="users" style="opacity: 0.4; float: right"/>
                                            <icon v-else name="lock" class="text-secondary" style="float: right" title="Private resource"/>

                                            <b>{{resource.name}}</b><br>
                                            <small>{{resource.config.desc}}</small>
                                        </p>
                                        -->
                                        <resource :resource="resource" style="0px 0px 3px #0002;"/>

                                        <div v-if="resource.status != 'ok'" class="resource-status bg-secondary">
                                            <icon name="exclamation" style="position: relative; top: -3px;"/>
                                            {{resource.status}}
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                        <div v-else-if="resource.score == 0" class="resource-status bg-warning">
                                            <icon name="hourglass" style="position: relative; top: -3px;"/>
                                            Busy
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                        <div v-else-if="resource.id == preferred_resource._id" class="resource-status bg-success" title="This resource will be used to execute this App.">
                                            <icon name="thumbs-up" style="position: relative; top: -3px;"/>
                                            <!--Best-->
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                        <div v-else class="resource-status" style="color: #888;">        
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                    </div>
                                </b-col>
                            </b-row>
                            <br>
                        </div>

                        <b-row>
                            <b-col>
                                <span class="form-header">Maintaners</span>
                                <p style="height: 30px;"><small class="text-muted">List of users who currently maintains this App.</small></p>
                                <p v-for="c in app.admins" :key="c._id">
                                    <contact :id="c"/>
                                </p>
                                <br>
                            </b-col>
                            <b-col>
                                <div v-if="app.contributors.length > 0">
                                    <span class="form-header">Contributors</span>
                                    <p style="height: 30px;"><small class="text-muted">List of code contributors.({{app.github}}).</small></p>
                                    <p v-for="dev in app.contributors" :key="dev._id">
                                        <contact :fullname="dev.name" :email="dev.email"/>
                                    </p>
                                    <br>
                                </div>
                            </b-col>
                        </b-row>

                        <div v-if="readme">
                            <p style="float: right;"><small class="text-muted">From github repo / README.md</small></p>
                            <span class="form-header">README</span>
                            <vue-markdown :source="readme" class="readme box"></vue-markdown>
                        </div>
                        <vue-disqus shortname="brain-life" :identifier="app._id"/>
                    </b-col>

                    <b-col cols="3">
                        <p v-if="app.doi || app.stats.serviceinfo">
                            <doibadge :doi="app.doi" v-if="app.doi"/>
                            <!--
                            <img :src="config.api+'/app/'+app._id+'/badge'" @click="show_badge_url('/app/'+app._id+'/badge')" class="clickable" v-if="app.stats.serviceinfo"/>
                            -->
                        </p>
                        <!--<span class="form-header">Topics</span>-->
                        <p style="line-height: 250%;">
                            <b-badge v-for="tag in app.tags" :key="tag" class="topic">{{tag}}</b-badge>
                        </p>

                        <p title="Users who executed this App">
                            <b-badge pill v-if="app.stats.users" class="bigpill">
                                <icon name="user-cog" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{app.stats.users}}&nbsp;&nbsp;<small>Users</small>
                            </b-badge>
                        </p>

                        <p title="Number of time this App was requested">
                            <b-badge pill v-if="app.stats.requested" class="bigpill">
                                <icon name="play" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{app.stats.requested}}&nbsp;&nbsp;<small>Requests</small>
                            </b-badge>
                        </p>

                        <p title="Registration Date">
                            <b-badge pill v-if="app.stats.serviceinfo && app.stats.serviceinfo.runtime_mean" class="bigpill">
                                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Registerd</small>&nbsp;&nbsp;{{new Date(app.create_date).toLocaleDateString()}}
                            </b-badge>
                        </p>

                        <p title="Average Runtime">
                            <b-badge pill v-if="app.stats.serviceinfo && app.stats.serviceinfo.runtime_mean" class="bigpill">
                                <icon name="clock" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{avg_runtime(app.stats.serviceinfo.runtime_mean, app.stats.serviceinfo.runtime_std)}}
                            </b-badge>
                        </p>

                        <div class='altmetric-embed' 
                            data-badge-type='medium-donut' 
                            data-badge-details="right" 
                            :data-doi="app.doi" 
                            data-hide-no-mentions="true"/>

                        <p v-if="app.stats.serviceinfo && app.stats.serviceinfo.success_rate" v-b-tooltip.hover.d1000.right title="finished/(failed+finished). Same request could be re-submitted / rerun.">
                            <!--<span class="form-header">Success Rate</span>-->
                            <svg width="70" height="70">
                                <circle :r="140/(2*Math.PI)" cx="35" cy="35" fill="transparent" stroke="#666" stroke-width="15"/>
                                <circle :r="140/(2*Math.PI)" cx="35" cy="35" fill="transparent" stroke="#28a745" stroke-width="15" 
                                    :stroke-dasharray="app.stats.serviceinfo.success_rate*(140/100)+' '+(100-app.stats.serviceinfo.success_rate)*(140/100)" stroke-dashoffset="-105"/>
                            </svg>
                            <b>{{app.stats.serviceinfo.success_rate.toFixed(1)}}%</b> <span style="opacity: 0.5">Success Rate</span>
                        </p>
                       
                    </b-col>

                </b-row>
            </div>

            <br>
            <br>
            <br>
            <br>
            <br>
        </b-container>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'

import app from '@/components/app'
import contact from '@/components/contact'
import tags from '@/components/tags'
import datatype from '@/components/datatype'
import datatypefile from '@/components/datatypefile'
import datatypetag from '@/components/datatypetag'
import appavatar from '@/components/appavatar'
import VueMarkdown from 'vue-markdown'
import statustag from '@/components/statustag'
import projectavatar from '@/components/projectavatar'
import doibadge from '@/components/doibadge'
import resource from '@/components/resource'

export default {
    components: { 
        contact, 
        tags, datatype, appavatar,
        VueMarkdown, statustag, 
        datatypetag, datatypefile,
        projectavatar,
        doibadge, app,
        resource,
        editor: require('vue2-ace-editor'),
    },

    /*
    metaInfo: {
        meta: [
            { charset: 'utf-8' },
            { name: 'here is my thing', content: 'appppp' }
        ]
    },
    */

    data () {
        return {
            app: null,
            noaccess: false,

            preferred_resource: null,
            resources: null,
            readme: null,
            //info: null,

            selfurl: document.location.href,

            tab_index: 0,

            config: Vue.config,
        }
    },

    watch: {
        '$route': function() {
            var app_id = this.$route.params.id;
            console.log("route update", app_id);
            if(app_id && this.app && app_id != this.app._id) {
                console.log("reopening different app");
                this.open_app();
            }
        },
    },

    mounted: function() {
        console.log("app mounted");

        this.$on('editor-update', c=>{
            console.log("update", c);
        });

        this.open_app();
    },

    computed: {
        shared_resources() {
            if(!this.resources) return [];
            return this.resources.filter(r=>r.gids.length > 0);
        },
    },

    methods: {
        /**
         * Supports:
         * github.com/name/project
         * http://github.com/name/project
         * https://github.com/name/project
         *                   https://github.com/name/project
         * (in the last example, whitespace is automatically trimmed)
         */
        trimGit: (text) => text.replace(/^[ \t]*(https?:\/\/)?github\.com\/?/g, ''),

        avg_runtime(mean, std) {
            let min = Math.round((mean-std/3)/(1000*60));
            if(min < 0) min = 0;
            let max = Math.round((mean+std/3)/(1000*60));
            if(max<90) {
                return min+"-"+max+" min";
            }
            let min_hours = Math.round(min/60*10)/10;
            let max_hours = Math.round(max/60*10)/10;
            return min_hours+"-"+max_hours+" hour";
        },

        open_app() {
            //load app
            this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.$route.params.id}),
                populate: 'inputs.datatype outputs.datatype projects',
                limit: 500, //TODO - this is not sustailable
            }})
            .then(res=>{
                if(res.data.apps.length == 0) {
                    this.noaccess = true;
                    throw "private app";
                }

                this.app = res.data.apps[0];
                if(this.config.user) this.find_resources(this.app.github);

                Vue.nextTick(()=>{
                    console.log("initializing altemtric badge");
                    //re-initialize altmetric badge - now that we have badge <div> placed
                    _altmetric_embed_init(this.$el);
                });

                //then load github README
                var branch = this.app.github_branch||"master";
                return fetch("https://raw.githubusercontent.com/"+this.app.github+"/"+branch+"/README.md")
            }).then(res=>{
                if(res.status == "200") return res.text()
            }).then(readme=>{
                this.readme = readme;
            }).catch(err=>{
                console.error(err);
            });
        },

        copy() {
            this.$router.push('/app/'+this.app._id+'/copy');
        },

        go(path) {
            this.$router.push(path);
        },

        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/apps');
        },

        download_app() {
            var branch = this.app.github_branch||"master";
            document.location = "https://github.com/"+this.app.github+"/archive/"+branch+".zip";
        },

        execute() {
            if(Vue.config.user) {
                this.$root.$emit("appsubmit.open", this.app._id);
            } else {
                alert("Please sign up / login first to execute Apps.");
            }
        },

        find_resources(service) {
            this.$http.get(Vue.config.amaretti_api + '/resource/best', {params: {
                service,
            }})
            .then(res => {
                if(res.data.resource) this.preferred_resource = res.data.resource;
                this.resources = res.data.considered.sort((a, b) => {
                    if (a.score < b.score) return 1;
                    if (a.score > b.score) return -1;
                    return 0;
                });
            })
            .catch(err => {
                console.error(err);
            });
        },

        show_badge_url() {
            prompt("The Badge Markdown", "[![brainlife.io/app](https://img.shields.io/badge/brainlife.io-app-green.svg)]("+this.selfurl+")");
        },

        remove() {
            if(confirm("Do you really want to remove this app ?")) {
                this.$http.delete('app/'+this.app._id)
                .then(res=>{
                    this.go('/apps');        
                });
            }
        },

        /*
        bibtex() {
            document.location = '/api/warehouse/app/bibtex/'+this.app._id;
        },
        */

        find_by_id(list, id) {
            var item = list.find(it=>it.id == id);
            if(!item) {
                console.error("failed to find_by_id", id);
                console.dir(list);
            }
            return item;
        },

        editorInit(editor) {
            console.log("initializing editor");

            //require('brace/ext/language_tools')

            require('brace/mode/json')
            require('brace/theme/chrome')
            require('brace/snippets/javascript')

            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
            editor.setReadOnly(true);  // false to make it editable

            editor.setAutoScrollEditorIntoView(true);
            editor.setOption("maxLines", 30);
            editor.setOption("minLines", 3);

            editor.setShowPrintMargin(true);
        },
    },
}
</script>

<style scoped>
.page-content {
top: 0px;
}

.header {
background-color: white;
margin-bottom: 30px;
padding: 15px 0px 0px 0px;
border-bottom: 1px solid #eee;
position: sticky;
top: 0;
z-index: 5;/*has to be above vue-ace line number*/
}

.topic {
padding: 8px; 
background-color: #eee;
text-transform: uppercase;
color: #999;
border-radius: 0px;
margin-right: 4px;
}
.preferred-icon {
color: green;
position: absolute;
left: 0px;
font-weight: bold;
}
.project-card {
cursor: pointer;
background-color: white;
padding: 5px;
margin-bottom: 5px;
}
.project-card:hover {
background-color: #ddd;
}
.resource {
background-color: white;
box-shadow: 2px 2px 2px #0001;
position: relative;
}
.resource-status {
font-size: 10pt;
color: white;
text-transform: uppercase;
background-color: #ddd;
height: 30px;
padding: 5px 10px;
width: 100%;
margin-bottom: 10px;
}
.resource-status .score {
float: right;
}
.box {
background-color: white;
padding: 20px;
box-shadow: 2px 2px 5px #eee;
margin-bottom: 10px;
margin-left: -20px;
}
.io-card {
padding: 8px; 
background-color: white; 
margin-bottom: 5px; 
}
.button-page {
position: absolute;
left: -30px;
z-index: 1;
opacity: 0.6;
}

</style>
