<template>
<b-modal title="Select Datatypes" ref="modal" size="lg" @ok="submit" ok-only>
    <div v-if="ready">
        <b-alert v-if="allSubjects.length == 0" show variant="danger">There are no archived data to publish in this project.</b-alert>
        <div v-else>
            <p class="text-muted">Please select datatypes you'd like to publish</p>
            <div style="height: 400px; overflow-y: scroll; overflow-x: hidden;">
                <div v-for="(group, datatype_id) in datatype_groups" :key="datatype_id" v-if="datatypes">
                    <div v-for="(stat, tags_s) in group.datatype_tags" :key="tags_s" :class="{included: stat.include}" style="padding: 1px 5px; margin: 1px; transition: all 0.3s">
                        <b-row>
                            <b-col cols="1">
                                <b-form-checkbox v-model="stat.include"/>
                            </b-col>
                            <b-col>
                                <datatypetag :datatype="datatypes[datatype_id]" :tags="JSON.parse(tags_s)" :clickable="false"/>
                            </b-col>
                            <!--
                            <b-col>
                                <small>{{datatypes[datatype_id].desc}}</small>
                            </b-col>
                            -->
                            <b-col>
                                 <b>{{stat.count}}</b> <span style="opacity: 0.8">datasets</span> ({{stat.size|filesize}})
                            </b-col>
                        </b-row>

                        <!--additional filter-->
                        <b-row v-if="stat.include">
                            <b-col cols="1"></b-col>
                            <b-col>
                                <tageditor v-model="stat.tags" placeholder="Enter object tags to filter (leave empty to select all. can use !negative tags)"/>
                            </b-col>
                        </b-row>
                    </div>
                </div>
            </div>
            <br>

            <div>
                <p class="text-muted">Please select subjects you'd like to publish</p>
                <v-select v-model="subjects" :options="allSubjects" :multiple="true" placeholder="Leave this blank to select All subject"/>
                <b-button variant="light" size="sm" style="float: right; margin-top: 5px;" @click="selectAll">Add all subjects to the list</b-button>
            </div>
        </div>
    </div>
    <br>
</b-modal>
</template>

<script>

import Vue from 'vue'
import datatypetag from '@/components/datatypetag'
import tageditor from '@/components/tageditor'

export default {
    components: { 
        datatypetag,
        tageditor,
    },
    data() {
        return {
            ready: false,
            project: null,
            datatype_groups: {},
            datatypes: null, 
            allSubjects: [],
            subjects: [],
            
            config: Vue.config,
        }
    },

    mounted() {
        this.$root.$on("datatypeselecter.open", opt=>{
            if(!this.$refs.modal) return console.log("received datatypeselecter.open but this.$refs.modal not yet initialized");
            this.project = opt.project;
            this.ready = false;
            this.$refs.modal.show();
        });
    },

    methods: {
        submit: function(evt) {

            //create list of datatype / tags that we want to publish 
            let sets = []
            for(let datatype in this.datatype_groups) {
                let group = this.datatype_groups[datatype];
                for(let tags_s in group.datatype_tags) {
                    let stat = group.datatype_tags[tags_s];
                    if(stat.include) {
                        sets.push({
                            datatype: this.datatypes[datatype], 
                            datatype_tags: JSON.parse(tags_s),
                            count: stat.count,
                            size: stat.size,
                            subjects: this.subjects,
                            tags: stat.tags,
                        });
                    }
                }
            }

            this.$root.$emit("datatypeselecter.submit", sets);
            console.log("hiding modal");
        },

        selectAll() {
            this.subjects = this.allSubjects;
        }
    },

    watch: {
        project: function(project) {
            if(!project) return;

            this.ready = false;
            this.allSubjects = [];

            this.project = null;
            this.datatype_groups = {};
            this.datatypes = null;
            this.subjects = [];

            //load dataset inventory..
            this.$http.get('dataset/inventory', {params: {
                find: JSON.stringify({
                    removed: false,
                    project: project._id,
                }),
            }})
            .then(res=>{
                //group datasets by datatype
                let groups = {};
                res.data.forEach(rec=>{
                    let subject = rec._id.subject;
                    if(!this.allSubjects.includes(subject)) {
                        //this.subjects.push(subject);
                        this.allSubjects.push(subject);
                    }

                    let datatype = rec._id.datatype;
                    let datatype_tags = rec._id.datatype_tags;
                    let datatype_tags_s = JSON.stringify(rec._id.datatype_tags);
                    if(!groups[datatype]) {
                        groups[datatype] = { size: 0, count:0, datatype_tags: {}};
                    }
                    if(!groups[datatype].datatype_tags[datatype_tags_s]) {
                        groups[datatype].datatype_tags[datatype_tags_s] = {size: 0, count: 0, include: false};
                    }
                    let name = datatype+"."+datatype_tags.join(":");
                    groups[datatype].datatype_tags[datatype_tags_s].size += rec.size;
                    groups[datatype].datatype_tags[datatype_tags_s].count += rec.count;
                    groups[datatype].size += rec.size;
                    groups[datatype].count += rec.count;
                });
                this.datatype_groups = groups;
                this.allSubjects.sort();

                //load datatype details
                return this.$http.get('datatype', {params: {
                    find: JSON.stringify({_id: {$in: Object.keys(this.datatype_groups)}}),
                }});
            }) 
            .then(res=>{
                this.datatypes = {};
                res.data.datatypes.forEach((d)=>{
                    this.datatypes[d._id] = d;
                });
                this.ready = true;
                this.$forceUpdate();
            }).catch(console.error);
        },
    },
}
</script>
<style scoped>
</style>
