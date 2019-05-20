<template>
<div>
    <b-alert show variant="secondary">
        Only the admins or members of this project can access processes. Please contact the project admins to give you access.
    </b-alert>
    <div style="margin: 20px;">
        <h4>How can I analyze dataset on this project?</h4>
        <b-card>
            <b-list-group flush>
                <b-list-group-item>
                    <h5>1. Create Private Project</h5>
                    <p>This project is a read-only projects, so you will need to create a new project to host your analysis and data derivatives, using datasets on this
                    project as <b>inputs</b> for your analysis.</p>
                    <p>To create a new project, first go to the project list page (click the <b>&lt;</b> button at the top of this page.) 
                        and then click the <b-btn style="border-radius: 50%;" size="sm" variant="secondary"><icon name="plus"/></b-btn> button
                        at the bottom right corner of the project list page.</p>
                </b-list-group-item>

                <b-list-group-item>
                    <h5>2. Analyze Single Subject</h5>
                    <p>Before you bulk process datasets on this project, you probably want to run your analysis on a fewer subjects to test it.</p>
                    <p>
                        Look under <b>Archive</b> tab on this page, and select datasets from a single subjects by clicking the checkboxes next to each data. 
                        Then click <b><icon name="play"/> Stage to process</b> button to open <i>Stage Datasets</i> modal 
                        where you can select your own project to stage selected dataset to. Click Submit to create a new process.
                    </p>
                    <p>
                        Process is used to stage your input dataset and group your data derivatives. You can select an App that you'd like to run by clicking <b>Submit New App</b> button at the bottom of th process page. Please read our <a href="https://brainlife.io/docs/user/process/" target="doc">documentation</a> for more info.
                    </p>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/NTNyf1xjNME" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </b-list-group-item>

                <b-list-group-item>
                    <h5>3. Bulk Process (Analyze all Subjects)</h5>
                    <p>Once you know which Apps to run with which options, you can analyze all subjects using <b>Pipeline</b>.</p>
                    <p>On your private project, click <b>Pipelines</b> tab, then click the <b-btn style="border-radius: 50%;" size="sm" variant="secondary"><icon name="plus"/></b-btn> button to create a new pipelie rule. Enter any name you'd like, and select the App you want to run. Under the <b>Inputs</b> section, update the Project field to the project that contains the datasets that you'd like to use as input. Click Submit. 
                    </p>
                    <p>
                        You should now see an entry on the pipeline main page. Click the toggle switch ( <b-form-checkbox style="display: inline;" switch/>) to enable your pipeline rule. After a few minutes, you should start seeing your processes created for each subjects. All output will be archived to your project once the jobs are completed. Please see <a href="https://brainlife.io/docs/user/pipeline/" target="doc">documentation</a> for more information.
                    </p>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/Ewy3ahCVUzw" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    
                </b-list-group-item>

            </b-list-group>
            </b-card-text>
        </b-card>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    data () {
        return {
            config: Vue.config,
        }
    },

    methods: {
        newproject() {
            this.$router.push('/project/_/edit');
        }
    },

}
</script>

<style scoped>
</style>
