<template>
<b-modal :no-close-on-backdrop="true" title="Import Datalad Dataset" ref="modal" size="lg" @ok="submit">
    <b-row v-if="dataset">
        <b-col class="text-muted" cols="3">Datatypes to Import</b-col>
        <b-col>
            <div v-for="(count, datatype_id) in dataset.stats.datatypes" :key="datatype_id">
                <b-form-checkbox v-model="datatypes" :value="datatype_id">
                    <datatypetag :datatype="datatype_id" :clickable="false"/> <small>{{count}}</small>
                </b-form-checkbox>
            </div>
        </b-col>
    </b-row>
    <br>

    <b-row>
        <b-col class="text-muted" cols="3">Project</b-col>
        <b-col>
            <b-form-radio-group v-model="createnew" style="margin-bottom: 5px;">
                <b-form-radio :value="true">Create a new Project</b-form-radio>
                <b-form-radio :value="false">Import to an existing Project</b-form-radio>
            </b-form-radio-group>
            <div v-if="createnew">
                <span class="form-header">Project Name</span>
                <b-form-input type="text" v-model="project_name" placeholder="Enter Name for the new project" required/>
                <br>
                <span class="form-header">Project Desc</span>
                <b-form-textarea rows="3" v-model="project_desc" placeholder="Enter Description for the new project" required/>
            </div>
            <div v-if="!createnew">
                <projectselector canwrite="true" v-model="project" :required="true"/> 
                <small class="text-muted">Select a project where you want to import this dataset to</small>
            </div>
        </b-col>
    </b-row>
    <br>

</b-modal>
</template>

<script>
import Vue from 'vue'

import projectselector from '@/components/projectselector'
import datatypetag from '@/components/datatypetag'

//singleton instance to handle upload request
export default {
    components: { 
        projectselector, datatypetag,
    },
    data () {
        return {
            project: null,
            datatypes: [],

            createnew: true,
            dataset: null, 
            subjects: null,

            project_name: "",
            project_desc: "",

            config: Vue.config,
        }
    },

    mounted() {
        this.$root.$on("importer.open", opt=>{
            this.dataset = opt.dataset;
            this.subjects = opt.subjects;

            this.project_name = this.dataset.dataset_description.Name;
            this.project_desc = "Imported from "+this.dataset.path;
            this.$refs.modal.show(); 
        });
    },

    destroyed() {
        //to prevent weird things from happening during debugging?
        this.$root.$off("importer.open");
    },

    methods: {
        submit(evt) {
            if(!this.createnew) return this.submit_import();
            if(this.datatypes.length == 0) {
                alert("Please specify at least one datatype to import");
                evt.preventDefault();
                return;
            }

            this.$notify({text: "Creating project"});
            this.$http.post('project', {
                name: this.project_name, 
                desc: this.project_desc,
            }).then(res=>{
                this.project = res.data._id;

                console.log("refreshing jwt.. so I can write to the project");
                this.$root.$emit("refresh_jwt", this.submit_import);
            }).catch(err=>{
                console.error(err);
                this.$notify({type: "error", text: err.response.data.message});
            });
        },

        submit_import() {
            this.$root.$emit("loading",{message: "Importing Dataset ..."});
            this.$http.post('datalad/import/'+this.dataset._id, {
                project: this.project, 
                datatypes: this.datatypes,
                //meta: this.get_meta(),
                //meta_info: this.dataset.participants_info,
            }).then(res=>{
                this.$root.$emit("loading", {show: false});
                this.$router.push("/project/"+this.project+"/dataset");
            }).catch(err=>{
                console.error(err);
                this.$root.$emit("loading", {show: false});
                this.$notify({type: "error", text: err.response.data.message});
            });
        }
    },
}
</script>

<style scoped>
</style>


