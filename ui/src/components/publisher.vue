<template>
<div v-if="datatypes">
    <transition name="slide-fade">
        <div v-if="page == 1">
            <!--<h4>Select Datasets</h4>-->
            <b-alert v-if="Object.keys(datatype_groups).length == 0" show variant="danger">There are no datasets to publish</b-alert>
            <p v-else class="text-muted">Please select datasets you'd like to publish (and make them publically downloadable)</p>
            <div v-for="(group, datatype_id) in datatype_groups" :key="datatype_id">
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
                             <b>{{stat.count}}</b> <span style="opacity: 0.8">datasets</span>
                            <div style="display: inline-block" v-if="stat.size">
                                <span style="opacity: 0.8">Size</span> <b>{{stat.size|filesize}}</b>
                            </div>
                        </b-col>
                    </b-row>
                </div>
            </div>
            <hr>
            <div class="form-action">
                <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
                <button type="button" class="btn btn-primary" @click="page++">Next</button>
            </div>
        </div>
    </transition>
    <transition name="slide-fade">
        <div v-if="page == 2">
            <!--<h4>Publication Details</h4>-->
            <p class="text-muted">Please enter details for your publications (you can update this information later).</p>
            <pubform :pub="pub" @submit.once="publish" @cancel="page--"/>
        </div>
    </transition>
    <br>
    <br>
</div>
</template>

<script>

import Vue from 'vue'
import select2 from '@/components/select2'
import pubform from '@/components/pubform'
import datatypetag from '@/components/datatypetag'

const async = require('async');

export default {
    components: { 
        select2, pubform, datatypetag,
    },

    props: {
        project: { type: Object },
    },

    data () {
        return {
            page: 1,
            pub: {
                //defaults
                name: (Vue.config.debug?"test":""),
                desc: "hello",
                tags: [],
                readme: (Vue.config.debug?"test":""),
                license: "ccby.40",
            
                publisher: "Nature",
                //publish_date: new Date(),
                //publication_year: new Date().getFullYear(),

                fundings: [],
                authors: [ Vue.config.user.sub ],
                contributors: [],
            },
            datatype_groups: {},
            datatypes: null, 
        }
    },

    created: function() {
        //load dataset inventory..
        this.$http.get('dataset/inventory', {params: {
            find: JSON.stringify({
                removed: false,
                project: this.project._id.toString(),
            }),
        }})
        .then(res=>{

            //group datasets by datatype
            let groups = {};
            res.body.forEach(rec=>{
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
            res.body.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });
            this.$forceUpdate();
        }).catch(console.error);
    },

    methods: {
        close() {
            this.page = 1;
            this.$emit("close");
        },

        publish() {
            //register publication record
            this.$http.post('pub', Object.assign({project: this.project._id}, this.pub)).then(res=>{
                let pub = res.body;
                console.log("registered pub", pub);

                //create list of datatype / tags that we want to publish 
                let sets = []
                for(let datatype in this.datatype_groups) {
                    let group = this.datatype_groups[datatype];
                    for(let tags_s in group.datatype_tags) {
                        let stat = group.datatype_tags[tags_s];
                        if(stat.include) {
                            sets.push({datatype, datatype_tags: JSON.parse(tags_s)});
                        }
                    }
                }

                //publish datasets
                async.forEach(sets, (set, next_set)=>{
                    console.log("publishing datasets", set);
                    this.$http.put('pub/'+pub._id+'/datasets', {
                        //project: this.project._id,
                        find: JSON.stringify({
                            datatype: set.datatype,
                            datatype_tags: set.datatype_tags,
                        })
                    }).then(res=>{
                        console.log("successfully published a set", set, res.body);
                        next_set();     
                    }).catch(res=>{
                        next_set(res.body);
                    });
                }, err=>{
                    if(err) return this.$notify(err);
                    console.log("done with publishing datasets");
                    this.$notify("Successfully published!");
                    this.$emit("submit", pub);
                })
            });
        }
    }
}
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: none;
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
.included {
background-color: #2693ff;
color: white;
}
h4 {
opacity: 0.8;
}
.form-action {
text-align: right; 
position: fixed; 
right: 0px; 
left: 350px; 
bottom: 0px; 
padding: 10px 30px;
background-color: rgba(100,100,100,0.4);
}
</style>

