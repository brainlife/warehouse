<template>
<div>
    <b-alert show variant="secondary">
        Only the admins or members of this project can access processes. Please contact the project admins to give you access.
    </b-alert>
    <!-- NEEDS TO BE UPDATED
    <div style="margin: 20px;">
        <h4>How can I analyze dataset on this project?</h4>
        <b-card>
            <b-list-group flush>
                <b-list-group-item>
                    <h5>1. Create Private Project</h5>
                    <p>This project is read-only. Please create a new project to analyze the datasets in this
                    project.
                    <p>To create a new project, go to the main projects page, then click "New Project" button at the bottom right corner of the page.</p>
                </b-list-group-item>

                <b-list-group-item>
                    <iframe width="444" height="250" style="float: right; margin-left: 20px;"
                        src="https://www.youtube.com/embed/u9Qlh0-iaAk" frameborder="0" 
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    <h5>2. Analyze a few Subjects</h5>
                    <p>You should test run several Apps on a few subjects before bulk processing the entire subjects.</p>
                    <p>
                        To do so, look under the <b>Archive</b> tab on your new project. 
                        Select data objects from a single subject by clicking the checkbox next to each DataType. 
                        Then click <b><icon name="play"/> Stage to process                     
                        <icon name="info-circle" title="Staging data for processing prepares and transfers selected datasets to a computational environment where they can be analyzed or processed according to project requirements"/>
                            </b> button to open <i>Stage Datasets</i> modal 
                        where you can select your own project to stage selected dataset to. Click Submit to create a new process.
                    </p>
                    <p>
                        The Process page is used to stage your input dataset and organize the data derivatives generated by your analyses. Once the dataset are Staged, you can select an App that you'd like to run by clicking <b>Submit New App</b> button at the bottom of th process page. Please read our <a href="https://brainlife.io/docs/user/process/" target="doc">documentation</a> for more info.
                    </p>
                </b-list-group-item>

                <b-list-group-item>
                    <iframe width="444" height="250" style="float: right; margin-left: 20px;"
                        src="https://www.youtube.com/embed/Ewy3ahCVUzw" frameborder="0" 
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    <h5>3. Analyze Multiple Subjects (Bulk Process)</h5>
                    <p>If you know the Apps you would like to run and their parameters set, you can analyze multiple (all) subjects in a Project using the <b>Pipeline</b> tab.</p>
                    <p>In your private project, go to the <b>Pipelines</b> tab, click the <b-btn style="border-radius: 50%;" size="sm" variant="secondary"><icon name="plus"/></b-btn> button to create a new pipelie rule. Enter any App name, select the App and run it. Under the <b>Inputs</b> section, update the Project field to the project that contains the datasets that you would like to use as input. Click <b>Submit</b>. 
                    </p>
                    <p>
                        You should now see a new entry on the pipeline main page. Click the toggle switch ( <b-form-checkbox style="display: inline;" switch/>) to enable your pipeline rule. After a few minutes, you should start seeing your processes created for each subjects. All output will be archived to your project once the jobs are completed. Please see <a href="https://brainlife.io/docs/user/pipeline/" target="doc">documentation</a> for more information.
                    </p>
                    
                </b-list-group-item>

            </b-list-group>
            </b-card-text>
        </b-card>
    </div>
    -->
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
        /*
        newproject() {
            this.$router.push('/project/_/edit');
        }
        */
    },

}
</script>

<style scoped>
</style>
