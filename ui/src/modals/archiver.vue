<template>
<b-modal v-if="output" :no-close-on-backdrop='true' title="Archive Data-Object" ref="archiver" size="lg" @ok="submit">
    <h5><datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/></h5>

    <!-- let's just force user to archive to the same project they are in
         this is mostly UI limitation - as we don't query datasets archived on other projects 
    <b-form-group label="Project">
        <projectselector :required="true" :canwrite="true" v-model="project" placeholder="Project to archive this data-object to"/>
    </b-form-group>
    -->

    <b-form-group>
        <b-form-textarea v-model="output.desc" placeholder="Enter Description" :rows="2" style="width: 100%;"></b-form-textarea>
    </b-form-group>

    <small>* You can override tags / metadata once the data-object is archived.</small>
</b-modal>
</template>

<script>
import Vue from 'vue'

//import projectaccess from '@/components/projectaccess'
//import projectselector from '@/components/projectselector'
import tageditor from '@/components/tageditor'
import datatypetag from '@/components/datatypetag'

export default {

    components: { 
        //projectaccess, 
        //projectselector, 
        tageditor, 
        datatypetag, 
        editor: require('vue2-ace-editor'),
    },

    data() {
        return {
            project: null,
            task: null,
            output: null,
            other_tags: [],
        }
    },

    watch: {
        output() {
            this.load_tags();
        },
        /*
        project() {
            this.load_tags();
        },
        */
    },
    
    created: function() {
        //{task, output}}
        this.$root.$on("archiver.show", opt=>{
            this.task = opt.task;
            this.project = opt.project;
            this.output = Object.assign({}, opt.output); //we let user override desc

            //wait for b-modal v-if flag to be triggered
            this.$nextTick(()=>{
                this.$refs.archiver.show();
            });
        });
    },

    destroyed() {
        //to prevent weird things from happening during debugging?
        this.$root.$off("archiver.show");
    },

    methods: {
        submit(evt) {
            evt.preventDefault();

            /*
            //TODO - project should be a required field, but somehow form validation isn't fireing. 
            //maybe because it's modal?
            if(!this.project) {
                this.$notify({text: "Please select project", type: "error"});
                return;
            }
            */

            this.$root.$emit("loading",{message: "Registering Data-object ..."});
            this.$nextTick(()=>{
                this.$refs.archiver.hide();
            });

            this.$http.post('dataset', {
                project: this.project,                 
                task_id: this.task._id,
                output_id: this.output.id, 
                desc: this.output.desc,
            }).then(res=>{
                this.$root.$emit("loading", {show: false});
                this.$notify({text: "Data-object registered", type: "success"});
            }).catch(err=>{
                this.$root.$emit("loading", {show: false});
                this.$notify({text: err.response.data.message, type: "error"});
            });
        },

        editorInit() {
            require('brace/mode/json')
        },

        load_tags() {
            if(!this.project || !this.output) return;

            //load dataset tags used on other datasets on this project
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({
                    project: this.project,
                    datatype: this.output.datatype,
                }),
                distinct: 'tags',
            }}).then(res=>{
                this.other_tags = res.data;
            });
        }
    },
}
</script>
<style scoped>
h5 {
font-size: 13pt;
}

</style>
