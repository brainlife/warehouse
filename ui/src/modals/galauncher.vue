<template>
<transition name="fade">
    <div v-if="open" class="brainlife-modal-overlay">
        <b-container class="brainlife-modal">
            <div class="brainlife-modal-header">
                <div class="brainlife-modal-header-buttons">
                    <div class="button" @click="open = false" style="margin-left: 20px; opacity: 0.8;">
                        <icon name="times" scale="1.5"/>
                    </div>
                </div>
                <h4 style="margin-top: 5px;">Launch New Analysis</h4>
            </div><!--header-->

            <!--container selecter-->
            <div v-if="!selected" class="app-selecter">
                <h5 style="opacity:0.8">Published Notebooks</h5>
                <span class="loading" v-if="!notebooks">Loading..</span>
                <b-card-group columns>
                    <b-card v-for="(app, idx) in notebooks" :key="idx" :title="app.name" :img-src="app.img" @click="selected = app" class="app">
                        Publication: {{app.pub.name}}<br>
                        Authors: {{app.pub.authors}}<br>

                        Release: {{app.release.name}}<br>
                        Release Desc: {{app.release.desc}}<br>
                        create_date: {{app.release.create_date}}<br>

                        container: {{app.container}}<br>
                        dataset_id: {{app.dataset_id}}<br>

                        <b>{{app.text}}</b><br>
                        <small>{{app.desc}}</small><br>
                        <!-- {{notebook.archive}}-->
                        
                    </b-card> 
                </b-card-group>

                <h5 style="opacity:0.8">Templates</h5>
                <p>Or.. start from a template session</p>
                <b-card-group columns>
                    <b-card v-for="(app, idx) in templates" :key="idx" :title="app.name" :img-src="app.img" @click="selected = app" class="app">
                        <b>{{app.text}}</b><br>
                        <small>{{app.desc}}</small><br>
                        <small class="text-muted">{{app.container}}</small>
                    </b-card> 

                </b-card-group>
            </div>

            <!--configurator-->
            <div v-if="selected">
                <b-form @submit="submit">
                    <div style="padding: 10px; background-color: #ddd;">
                        <!--selected session detail-->
                        <b>{{selected.text}}</b><br>
                        <small>{{selected.desc}}</small><br>
                        <small class="text-muted">{{selected.container}}</small>
                    </div>

                    <div style="padding: 10px">
                        <p>
                            <span class="form-header">Project</span>
                            <projectselecter canwrite="true" v-model="project" placeholder="Project you'd like to create this session" :required="true"/>
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
import projectselecter from '@/components/projectselecter'
import gainstance from '@/mixins/gainstance' //for createOrFindGAInstance

export default {
    components: { projectselecter },
    mixins: [
        //agreementMixin,
        projectselecter,
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
                {
                    text: "python/dipy", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    desc: "Jupyter Datascience Notebook (lab-2.1.1) with Dipy(1.3.0) and Fury",

                    container: "brainlife/ga-dipy:lab211-dipy130",
                    //app: "soichih/ga-test",
                    dataset_id: "11111111", //TODO - archive ga-test?
                },
                {
                    text: "Octave(matlab)", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    desc: "Jupyter Datascience Notebook (lab-2.1.1) with Octave",
                    container: "brainlife/ga-octave:1.0",
                    //app: "soichih/ga-test",
                    dataset_id: "11111111", //TODO - archive ga-test?
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
            this.preSelectedGAID = opts.preSelectedGAID;

            //set from opts
            this.project = opts.project; //default project
            this.cb = opts.cb;

            if(!this.notebooks) this.loadNotebooks();
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
                this.createOrFindGAInstance(project.group_id, (err, instance)=>{
                    if(err) throw err;

                    //stage notebook archive
                    this.$http.post('dataset/stage', {
                        instance_id: instance._id,
                        dataset_ids: [ this.selected.dataset_id ],
                    }).then(res=>{
                        const stageTask = res.data.task;

                        //then launchga in it
                        this.$http.post('secondary/launchga', {
                            instance_id: instance._id,
                            name: "todo..", //this.selected.container+":"+this.selected.tag,
                            desc: this.form.desc, 
                            deps_config: [{task: stageTask._id}],
                            config: { 
                                //archive: this.selected.archive,
                                //app: this.selected.app, //only for template
                                notebook: "../"+stageTask._id+"/"+this.selected.dataset_id+"/notebook",
                                container: this.selected.container,
                            }, 
                        }).then(res=>{
                            let task = res.data;
                            this.open = false;
                            this.cb(null, {
                                task, 
                                project: this.project,
                                app: this.selected,
                            });
                        }).catch(err=>{
                            console.error(err);
                            this.$notify({type: 'error', text: err.response.data.message});
                        });
                    });
                });
            });

        },

        loadNotebooks() {
            console.log("loading notebooks");

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
                this.notebooks = [];
                res.data.pubs.forEach(pub=>{

                    if(pub.removed) return;
                    if(!pub.releases) return;

                    pub.releases.forEach(release=>{

                        if(release.removed) return;
                        if(!release.gaarchives) return;

                        release.gaarchives.forEach(archive=>{
                            this.notebooks.push({
                                text: archive.name+" from "+release.name+" "+release.desc,
                                desc: archive.desc||"(no-desc)",

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
}
.app:hover {
cursor: pointer;
box-shadow: 0 0 5px #0004;
}
.app-selecter {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 60px;
    bottom: 0px;
    background-color: #f9f9f9;
    overflow: auto;
    padding: 10px;
}
</style>
