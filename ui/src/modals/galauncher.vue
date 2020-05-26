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
                <h4 style="margin-top: 5px;">Launch Group Analysis</h4>
            </div><!--header-->

            <!--container selecter-->
            <div v-if="!selected" style="margin: 10px;">
                <p>Please select the type of analysis you'd like to perform.</p>
                <b-card-group columns v-if="!selected">
                    <b-card v-for="(app, idx) in apps" :key="idx" :title="app.name" :img-src="app.img" @click="selected = app" class="app">
                        <b-card-text>{{app.desc}}</b-card-text>
                        <template v-slot:footer>
                            <small class="text-muted">{{app.container}}:{{app.tag}}</small>
                        </template>
                    </b-card> 

                </b-card-group>
            </div>

            <!--configurator-->
            <div v-if="selected">
                <b-form @submit="submit">
                <div class="submit-form">
                    <pre>{{selected}}</pre>
                    TODO - show any parameters to set..
                    <b-form-textarea v-model="form.desc" placeholder="Optional description for this analysis" :rows="3" :max-rows="6" required/>
                </div>
                <div class="form-action">
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

//const async = require("async");
//import agreementMixin from '@/mixins/agreement'

export default {
    //mixins: [agreementMixin],

    data () {
        return {
            open: false,

            form: {
                desc: "",
                config: {},
            },
            
            //project: null, //project to submit this under
            instance: null, //project to submit this under
            cb: null, //cb to call when launcher is submitted

            selected: null, //selected app

            //will come from db someday
            apps: [
                {
                    name: "Jupyter Datascience Lab", 
                    img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    desc: "Jupyter Datascience Notebook (lab-2.1.1)",
                    container: "jupyter/datascience-notebook", 
                    tag: "lab-2.1.1", 
                },
                {
                    name: "Jupyter Scipy Notebook", 
                    img: "https://www.dataquest.io/wp-content/uploads/2019/01/interface-screenshot.png",
                    desc: "Jupyter Notebook Scientific Python Stack from https://github.com/jupyter/docker-stacks",
                    container: "jupyter/scipy-notebook", 
                    tag: "latest",
                },   
                {
                    name: "Jupyter Tensorflow Notebook", 
                    img: "https://i.imgur.com/n0PmXQn.gif",
                    desc: "Jupyter Notebook Scientific Python Stack w/ Tensorflow from https://github.com/jupyter/docker-stacks",
                    container: "jupyter/tensorflow-notebook", 
                    tag: "latest",
                },
            ],

            config: Vue.config,
        }
    },

    created() {
        this.$root.$on("galauncher.open", opts=>{
            //reset form
            this.form.desc = "";
            this.form.config = {};
            this.selected = null;

            this.cb = opts.cb;
            this.instance = opts.instance;

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

            //prevent double submit
            if(!this.open) return; 
            this.open = false;

            this.$http.post('secondary/launchga', {
                instance_id: this.instance._id,
                container: this.selected.container,
                tag: this.selected.tag,
                desc: this.form.desc,
                config: this.form.config,
            }).then(res=>{
                this.cb(null, res.data);
            }).catch(this.cb);
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
</style>
