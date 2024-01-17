<template>
<transition name="fade">
    <div v-if="open" class="brainlife-modal-overlay">
        <b-container class="brainlife-modal">

            <!--header-->
            <div class="brainlife-modal-header">
                <div class="brainlife-modal-header-buttons">
                    <div class="button" @click="open = false" style="margin-left: 20px; opacity: 0.8;">
                        <icon name="times" scale="1.5"/>
                    </div>
                </div>
                <h4 style="margin-top: 5px;">New Session</h4>
            </div>

            <p style="padding: 10px;">Please select a template notebook to launch your new session.</p>

            <div v-if="!selected" class="app-selecter">
                <span class="form-header">Blank Notebooks</span>
                <b-row>
                    <b-col cols="4" v-for="(app, idx) in templates" :key="idx">
                        <div :title="app.name" :img-src="app.img" @click="selected = app" class="app">
                            <small><span style="opacity: 0.8"><icon name="brands/docker"/> {{app.container}}</span></small><br>
                            <b>{{app.name}}</b><br>
                            <small>{{app.desc}}</small><br>
                        </div>
                    </b-col>
                </b-row>
            </div>

            <div v-if="!selected" class="app-selecter">
                <span class="loading" v-if="!notebooks">Loading..</span>
                <b-row>
                    <b-col cols="5">
                        <span class="form-header">Published Notebooks</span>
                    </b-col>
                    <b-col>
                        <small>Published In</small>
                    </b-col>
                </b-row>

                <p v-if="!notebooks.length">None</p>
                <div v-for="(app, idx) in notebooks" :key="app.dataset_id" 
                    :img-src="app.img" @click="selected = app" class="published-notebook">
                    <b-row>
                        <b-col cols="5">
                            <small style="opacity: 1"><icon name="brands/docker"/> {{app.container}}</small><br>
                            <small class="serif">{{app.name}}</small><br>
                        </b-col>
                        <b-col>
                            <div style="font-size: 80%; opacity: 0.75;">
                                <span style="float: right; margin-left: 10px;">
                                    <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;{{new Date(app.release.create_date).toLocaleDateString()}}
                                </span>
                                <p>{{app.pub.name}}</p>

                                <p>
                                    <contact v-for="c in app.pub.authors" :key="c" :id="c" size="small" style="line-height: 150%;"/>
                                </p>

                                <small style="font-size: 60%; float: right;" title="data object id">{{app.dataset_id}}</small>
                                <p>
                                    <span style="opacity: 0.8">Release /</span> <b>{{app.release.name}}</b><br>
                                    <small v-if="app.release.desc">{{app.release.desc}}</small><br>
                                    <releaseset v-if="app.release.sets" :set="set" v-for="(set, idx) in app.release.sets.filter(set=>set.datatype.groupAnalysis)" :key="idx"/>
                                </p>
                            </div>
                        </b-col>
                    </b-row>
                </div>
            </div>

            <!--configurator-->
            <div v-if="selected">
                <b-form @submit="submit">
                    <!--
                    <div style="padding: 10px; background-color: #eee;">
                        <small class="text-muted"><icon name="brands/docker"/> {{selected.container}}</small><br>
                        {{selected.text}}<br>
                    </div>
                    -->
                    <p style="padding: 10px; background-color: #eee;">
                        <gaarchive :gaarchive="selected" style="background-color: white;"/>
                    </p>
                    <div style="padding: 10px">
                        <p>
                            <span class="form-header">Project</span>
                            <projectselector canwrite="true" v-model="project" placeholder="Project you'd like to create this session" :required="true"/>
                            <small>Project to launch this analysis</small>
                        </p>

                        <p>
                            <span class="form-header">Description</span>
                            <b-form-textarea v-model="form.desc" placeholder="Optional description for this data analysis" :rows="3" :max-rows="6"/>
                        </p>
                    </div>

                    <div class="form-action">
                        <b-button variant="secondary" type="button" @click="selected = null">Back</b-button>
                        <b-button variant="primary" type="submit">Launch</b-button>
                    </div>
                </b-form>
            </div>
        </b-container>
    </div>
</transition>
</template>

<script>
import Vue from 'vue'

//import agreementMixin from '@/mixins/agreement'
import projectselector from '@/components/projectselector'
import gainstance from '@/mixins/gainstance' //for createOrFindGAInstance
import contact from '@/components/contact'
import releaseset from '@/components/releaseset'
import gaarchive from '@/components/gaarchive'

export default {
    components: { 
        projectselector, 
        contact, 
        releaseset,
        gaarchive,
    },
    mixins: [
        projectselector,
        gainstance,
    ],
    data () {
        return {
            open: false,

            form: {
                desc: "",
                config: {},
            },
            
            instance: null, //instance to submit the session
            cb: null, //cb to call when launcher is submitted

            project: null, //project to submit the session
            notebooks: null, //published notebooks that user can launch

            templates: [
                // {
                //     name: "Python3", 
                //     desc: "Python Notebook (lab-3.2.8) with Dipy(1.4.1) and Fury",
                //     container: "brainlife/ga-python:lab328-dipy141",
                //     app: "brainlife/ga-python",
                // },
                // {
                //     name: "Python3", 
                //     desc: "Python Notebook",
                //     container: "brainlife/ga-python:lab328-dipy141",
                //     app: "brainlife/ga-python",
                // },
                {
                    name: "Python3", 
                    desc: "Python Notebook",
                    container: "brainlife/ga-python:lab328-dipy141-pybrainlife-1.0",
                    app: "brainlife/ga-python",
                },
                {
                    name: "Octave(matlab)", 
                    desc: "Octave Notebook (lab-2.1.1)",
                    container: "brainlife/ga-octave:1.0",
                    app: "brainlife/ga-octave",
                },
            ],
            preSelectedGAID: null,
            selected: null, 

            config: Vue.config,
        }
    },

    created() {
        this.$root.$on("galauncher.open", opts=>{
            //reset form
            this.form.desc = "";
            this.form.config = {};
            this.selected = null;
            this.preSelectedGAID = opts.preSelectedGAID;

            //set from opts
            this.project = opts.project; //default project
            this.cb = opts.cb;

            this.loadNotebooks();
            this.open = true;
        });

        //ESC to close launcher
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.open = false;
            }
        });
    },

    destroyed() {
        this.$root.$off("galauncher.open");
    },

    methods: {

        submit(evt) {
            evt.preventDefault();

            //lookup group_id of selected project
            this.$http.get("project", {
                params: {
                    find: JSON.stringify({_id: this.project}),
                }
            }).then(res=>{
                const project = res.data.projects[0];
                //use that to find ga instance
                this.createOrFindGAInstance(project.group_id, async (err, instance)=>{
                    if(err) throw err;

                    try {
                        let gaconfig = {
                            instance_id: instance._id,
                            name: this.selected.name,
                            desc: this.form.desc, 
                            config: { 
                                container: this.selected.container,
                            },
                        }

                        if(this.selected.dataset_id) {
                            //stage notebook archive
                            let res = await this.$http.post('dataset/stage', {
                                instance_id: instance._id,
                                dataset_ids: [ this.selected.dataset_id ],
                            });
                            const stageTask = res.data.task;
                            gaconfig.deps_config = [{task: stageTask._id}];
                            gaconfig.config.notebook = "../"+stageTask._id+"/"+this.selected.dataset_id+"/notebook";
                        } else {
                            //for app/template
                            gaconfig.config.app = this.selected.app;
                        }

                        res = await this.$http.post('secondary/launchga', gaconfig);
                        let task = res.data;
                        this.open = false;
                        this.cb(null, {
                            task, 
                            project: this.project,
                            app: this.selected,
                        });
                    } catch (err) {
                        console.error(err);
                        this.$notify({type: 'error', text: err.response.data.message});
                    }
                });
            });

        },

        loadNotebooks() {
            this.notebooks = [];

            //load published notebooks
            this.$http.get('/pub', {
                params: {
                    find: JSON.stringify({
                        //can't get the query to work..
                        //"releases.gaarchives": {$exists: true, $ne: []},
                        //"releases.removed": false,
                    }),
                    select: "releases name authors",
                }
            }).then(res=>{
                res.data.pubs.forEach(pub=>{

                    if(pub.removed) return;
                    if(!pub.releases) return;

                    pub.releases.forEach(release=>{

                        if(release.removed) return;
                        if(!release.gaarchives) return;

                        release.gaarchives.forEach(archive=>{
                            this.notebooks.push({
                                name: archive.name,
                                container: archive.container,
                                dataset_id: archive.dataset_id,

                                pub,
                                release,
                                archive,
                            });
                        });
                    });

                    //select preselected notebook
                    if(this.preSelectedGAID) {
                        this.selected = this.notebooks.find(notebook=>
                            notebook.archive._id == this.preSelectedGAID);
                    }
                });
            });
        },
    }
}
</script>

<style scoped>
.submit-form {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 60px;
    padding: 20px;
    bottom: 60px;
    overflow: auto;
    background-color: #f9f9f9;
}
.form-action {
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 60px;
    box-shadow: inset 0px 1px 1px #ddd;
    background-color: #eee;
    padding: 10px 20px;
    text-align: right;
}
.app {
    transition: box-shadow 0.5s;
    background-color: white;
    padding: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
}
.app:hover,
.published-notebook:hover {
    cursor: pointer;
    box-shadow: 0 0 5px #0004;
}
.app-selecter {
    background-color: #f9f9f9;
    padding: 10px;
}
.published-in {
    position: absolute; 
    top: -30px; 
    left: 115px; 
    background-color: white; 
    padding: 5px; 
    color: #999;
}
.published-notebook {
    background-color: white;
    margin-bottom: 10px;
    box-shadow: 0px 1px 3px #ddd;
    padding: 10px 20px;
    transition: box-shadow 0.5s;
}
</style>
