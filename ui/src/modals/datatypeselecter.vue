<template>
<b-modal title="Select Datatypes" ref="modal" size="lg" @ok="submit" ok-only>
    <!--<h4>Select Datasets</h4>-->
    <b-alert v-if="Object.keys(datatype_groups).length == 0" show variant="danger">There are no datasets to publish</b-alert>
    <p v-else class="text-muted">Please select datasets you'd like to publish (and make them publically downloadable)</p>
    <div v-for="(group, datatype_id) in datatype_groups" :key="datatype_id" v-if="datatypes">
        <div v-for="(stat, tags_s) in group.datatype_tags" :key="tags_s" :class="{included: stat.include}" style="padding: 1px 5px; margin: 1px; transition: all 0.3s">
            <b-row>
                <b-col cols="1">
                    <b-form-checkbox v-model="stat.include"/>
                </b-col>
                <b-col>
                    <datatypetag :datatype="datatypes[datatype_id]" :tags="JSON.parse(tags_s)"/>
                </b-col>
                <b-col>
                    <small>{{datatypes[datatype_id].desc}}</small>
                </b-col>
                <b-col>
                     <b>{{stat.count}}</b> <span style="opacity: 0.8">datasets</span> ({{stat.size|filesize}})
                </b-col>
            </b-row>
        </div>
    </div>
    <br>
</b-modal>
</template>

<script>

import Vue from 'vue'
import datatypetag from '@/components/datatypetag'

export default {
    //mixins: [agreementMixin],
    //components: { metadata, tags, projectselecter, select2, datatypetag },

    components: { datatypetag },
    data() {
        return {
            project: null,
            datatype_groups: {},
            datatypes: null, 
            //selected: null, 
            
            config: Vue.config,
        }
    },

    mounted() {
        this.$root.$on("datatypeselecter.open", opt=>{
            if(!this.$refs.modal) return console.log("received datatypeselecter.open but this.$refs.modal not yet initialized");
            this.project = opt.project;
            this.$refs.modal.show()
        });
    },

    methods: {
        close: function() {
            console.log("resetting datasetselecter");
            this.project = null;
            this.datatype_groups = {};
            this.datatypes = null;
            this.$refs.modal.hide()
        },

        submit: function(evt) {
            evt.preventDefault();

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
                        });
                    }
                }
            }

            this.$root.$emit("datatypeselecter.submit", sets);
            this.close();
        },
    },

    watch: {
        project: function(project) {
            if(!project) return;

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
                    //if(selected.includes(name)) groups[datatype].datatype_tags[datatype_tags_s].include = true;
                    groups[datatype].datatype_tags[datatype_tags_s].size += rec.size;
                    groups[datatype].datatype_tags[datatype_tags_s].count += rec.count;
                    groups[datatype].size += rec.size;
                    groups[datatype].count += rec.count;
                });
                this.datatype_groups = groups;

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
                this.$forceUpdate();
            }).catch(console.error);
        },
    },
}
</script>

