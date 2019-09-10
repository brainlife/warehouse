<template>
<div v-if="task">
    <div class="task-header">
        <slot name="header">
            <!--default content.. normally client should override this slot-->
            <h4 style="background-color: white; padding: 7px; margin-bottom: 0px;"><icon name="paper-plane"></icon> {{task.name||task.service}}</h4>
        </slot>

        <!--status indicator-->
        <div class="status-card status-color" :class="task.status" style="position: relative;">
            <div v-if="estimated_remain(task)" class="remain" :style="{width: (estimated_remain(task)*100)+'%'}"/>
            <div style="float: left; padding: 6px 8px" @click="poke">
                <statusicon :status="task.status" scale="1.5"/>
            </div>
            <div style="margin-left: 45px; margin-right: 5px; padding-bottom: 4px; position: relative;">
                <div style="float: right;">
                    <div class="button" style="opacity: 0.7" v-if="!editing_desc" @click="editing_desc = true" title="Edit Notes"><icon name="edit"/></div>
                    <div class="button" style="opacity: 0.7" :id="'popover'+task.config._tid" @click="openinfo"><icon name="info"/></div>
                    <b-popover :target="'popover'+task.config._tid" triggers="hover">
                        <template slot="title"><span class="text-muted"><small>ID</small> {{task._id}}</span></template>
                        <p>
                            <contact :id="task.user_id" size="small"/>
                        </p>
                        <table class="table table-sm">
                        <tr>
                            <th>Created</th>
                            <td>{{new Date(this.task.create_date).toLocaleString()}}</td>
                        </tr>
                        <tr v-if="task.start_date">
                            <th>Started</th>
                            <td>{{new Date(this.task.start_date).toLocaleString()}}</td>
                        </tr>
                        <tr v-if="task.finish_date">
                            <th>Finished</th>
                            <td>{{new Date(this.task.finish_date).toLocaleString()}}</td>
                        </tr>
                        <tr v-if="task.fail_date">
                            <th>Failed</th>
                            <td>{{new Date(this.task.fail_date).toLocaleString()}}</td>
                        </tr>
                        <tr v-if="task.nice">
                            <th>Nice</th>
                            <td>{{task.nice}} <small style="opacity: 0.5">yeilds to less nice tasks</small></td>
                        </tr>
                        <tr v-if="task.config._rule">
                            <th>Rule</th>
                            <td>
                                <small>This task was submitted by {{task.config._rule.id}}
                                For subject:<b>{{task.config._rule.subject}}</b></small>
                            </td>
                        </tr>
                        <tr v-if="resource">
                            <th>Resource</th>
                            <td>{{this.resource.name}}</td>
                        </tr>
                        <tr v-if="task.next_date" style="opacity: 0.6;">
                            <th>Next&nbsp;Chk</th>
                            <td>{{new Date(this.task.next_date).toLocaleString()}}</td>
                        </tr>
                        </table>
                        <p v-if="task.status == 'finished'" style="opacity: 0.5;">
                            <icon name="exclamation-circle" scale="0.8"/> will be removed on {{remove_date.toLocaleDateString()}}
                        </p>
                    </b-popover>
                    <div class="button" v-if="task.status == 'failed' || task.status == 'finished' || task.status == 'removed' || task.status == 'stopped'" title="Rerun Task" @click="rerun">
                        <icon name="redo"/>
                    </div>
                    <div class="button" v-if="task.status == 'requested' || task.status == 'running'" @click="stop" title="Stop Task"><icon name="stop"/></div>
                    <div class="button" v-if="task.status != 'removed' && task.status != 'remove_requested'" @click="remove" title="Remove Task"><icon name="trash"/></div>
                </div><!--float right-->
                <h4>
                    <strong style="text-transform: uppercase;">{{task.status}}</strong>
                    <small>
                        <time v-if="task.status == 'requested'"><timeago :since="task.request_date" :auto-update="60"/></time>
                        <time v-if="task.status == 'waiting'">since <timeago :since="task.create_date" :auto-update="60"/></time>
                        <time v-if="task.status == 'running'">since <timeago :since="task.start_date" :auto-update="30"/></time>
                        <time v-if="task.status == 'finished'"><timeago :since="task.finish_date" :auto-update="60"/></time>
                        <time v-if="task.status == 'failed'"><timeago :since="task.fail_date" :auto-update="60"/></time>
                        <time v-if="task.status == 'removed'"><timeago :since="task.remove_date" :auto-update="60"/></time>
                    </small>
                </h4>
                <i style="font-size: 95%;">{{task.status_msg.trim()||'empty status message'}}</i>
            </div>
        </div><!--status-card-->
    </div><!--sticky top-->

    <!--task details-->
    <div class="status-color" :class="task.status" style="padding-left: 3px;">
        <div style="background-color: #fafafa; color: #555; position: relative;">
            <div class="note" v-if="task.desc || editing_desc">
                <div v-if="task.desc && !editing_desc" @click="editing_desc = true" class="note-text">
                    <vue-markdown :source="task.desc" class="readme" style="margin: 0px 5px;"/>
                </div>
                <div v-if="editing_desc" style="position: relative;">
                    <div class="button" @click="editing_desc = false" style="position: absolute; top: 0; right: 0px; background-color: #666; margin: 5px;"><icon name="times"/></div>
                    <b-form-textarea ref="desc_editor" v-model="task.desc" placeholder="Enter Notes in Markdown" :rows="3" style="background-color: #f0f0f0; border: none; border-radius: 0;"/>
                </div>
            </div>

            <div v-if="task.service!='soichih/sca-product-raw'&&task.service!='brainlife/app-stage'">
                <taskconfig :task="task" style="padding: 10px;"/>
            </div>

            <div v-if="has_input_slot">
                <div @click="toggle('input')" class="toggler">
                    <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.input}"/> Input
                </div>
                <transition name="fadeHeight">
                    <div v-if="activeSections.input">
                        <slot name="input"></slot>
                    </div>
                </transition>
            </div>

            <div v-if="has_output_slot">
                <div @click="toggle('output')" class="toggler">
                    <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.output}"/> Output 
                    <small v-if="remove_in_days < 7" style="float: right;">Will be removed in <b>{{remove_in_days}} days</b></small>
                </div>
                <transition name="fadeHeight">
                    <div v-if="activeSections.output">
                        <slot name="output"></slot>
                    </div>
                </transition>
            </div>

            <div v-if="task.resource_ids.length > 0">
                <div @click="toggle('rawoutput')" class="toggler">
                    <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.rawoutput}"/> Raw Output
                </div>
                <transition name="fadeHeight">
                    <div v-if="activeSections.rawoutput" style="background-color: #fafafa;">
                        <filebrowser v-if="task.resource_id" :task="task"></filebrowser>
                        <b-alert show v-else title="Not yet submitted to computing resource" :variant="warning"></b-alert>
                    </div>
                </transition>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import filebrowser from '@/components/filebrowser'
import statusicon from '@/components/statusicon'
//import mute from '@/components/mute'
//import tags from '@/components/tags'
import taskconfig from '@/components/taskconfig'
import contact from '@/components/contact'
import VueMarkdown from 'vue-markdown'

let resource_cache = {};
let desc_debounce = null;

export default {
    props: ['task'],
    components: { 
        filebrowser, statusicon, taskconfig, contact, VueMarkdown,
    },
    data () {
        return {
            activeSections: {
                output: true, 
                input: true,
            },
            show_masked_config: false,
            editing_desc: false,
            desc: null,

            resource: null,

            config: Vue.config,
        }
    },

    watch: {
        task: {
            deep: true,
            handler: function() {
                this.load_resource_info(this.task.resource_id);
            }
        },
        'task.desc'(nv, ov) {
            if(nv == null || ov == null) return;
            clearTimeout(desc_debounce);
            desc_debounce = setTimeout(this.update_desc, 2000);
        },
    },

    mounted() {
        if(this.task) this.load_resource_info(this.task.resource_id);
    },

    computed: {
        has_input_slot() {
            return !!this.$slots.input;
        },
        has_output_slot() {
            return !!this.$slots.output;
        },
        remove_date() {
            if(this.task.remove_date) {
                return new Date(this.task.remove_date);
            } else {
                //use finish date instead
                let d = new Date(this.task.finish_date);
                d.setDate(d.getDate() + 25); //should match with amaretti bin/task
                return d;
            }
        },
        remove_in_days() {
            var d = new Date();
            var i = this.remove_date.getTime() - d.getTime();
            return Math.round(i/(3600*24*1000));
        },

    },

    filters: {
        mask: function(config) {
            //mask config._something    
            let masked = {};
            for(let id in config) {
                if(id[0] != "_") masked[id] = config[id];
            }
            return masked;
        }
    },

    methods: {
        load_resource_info(id) {
            if(!id) return; //no resource assigned yet?

            this.resource = resource_cache[id];
            if(!this.resource) {
                this.$http.get(Vue.config.wf_api+'/resource/', {params: {
                    find: JSON.stringify({_id: id})
                }}).then(res=>{
                    this.resource = res.data.resources[0];
                    resource_cache[id] = this.resource;
                });
            }
        },

        toggle(section) {
            if(this.activeSections[section] === undefined) {
                Vue.set(this.activeSections, section, true);
            } else this.activeSections[section] = !this.activeSections[section];
        },

        rerun() {
            this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.task._id)
            .then(res=>{
                this.$notify({ text: res.data.message, type: 'success'});
            })
            .catch(err=>{
                this.$notify({ text: err.body.message, type: 'error'});
            });
        },

        stop() {
            this.$http.put(Vue.config.wf_api+'/task/stop/'+this.task._id)
            .then(res=>{
                this.$notify({ text: res.data.message, type: 'success'});
            })
            .catch(err=>{
                console.error(err); 
            });
        },

        remove() {
            this.$http.delete(Vue.config.wf_api+'/task/'+this.task._id)
            .then(res=>{
                this.$notify({ title: 'Removing Task', text: 'Task removal requested', type: 'success', });
                this.$emit("remove", this.task._id);
            })
            .catch(err=>{
                console.error(err); 
            });
        },

        poke() {
            this.$http.put(Vue.config.wf_api+'/task/poke/'+this.task._id)
            .then(res=>{
                this.$notify({text: res.data.message, type: 'success'});
            })
            .catch(err=>{
                console.error(err); 
            });
        },

        /*
        edit_desc() {
            this.editing_desc = this.task.desc||"";
            this.$nextTick(()=>{
                this.$refs.desc_editor.focus();
            });
        },
        */

        update_desc() {
            console.log(this.task.desc);
            this.$http.put(Vue.config.wf_api+'/task/'+this.task._id, {desc: this.task.desc})
            .then(res=>{
                this.$notify({text: "Note successfully updated", type: 'success'});
            }).catch(err=>{
                console.error(err); 
            });
        },

        openinfo() {
            this.$root.$emit("taskinfo.open", {task: this.task, resource: this.resource});
        },

        estimated_remain(task) {
            if(task.status != "running") return null;
            if(!task.app) return null;
            if(!task.app.stats) return null;
            if(!task.app.stats.serviceinfo) return null;
            let runtime_mean = task.app.stats.serviceinfo.runtime_mean;
            let runtime_std = task.app.stats.serviceinfo.runtime_std;
            let runtime = new Date().getTime() - new Date(task.start_date).getTime();
            let remain = 1-runtime/(runtime_mean+runtime_std/3);
            if(remain < 0) remain = 0; //making taking longer than expected?
            return remain;
        },
    },
}
</script>

<style scoped>
.task {
background-color: #fafafa;
}
.task-header {
/*position: sticky; */
top: 0; 
z-index: 7;  /*needs to be higher than z-index: 6 of ace scrollbar*/
box-shadow: 0 3px 3px #0002;
}
.status-card {
padding: 5px 0 0 4px;
border: none;
}
.status-color.finished {
color: white;
background-color: #28a745;
}
.status-color.failed {
color: white;
background-color: #c00;
}
.status-color.running_sync,
.status-color.running {
color: white;
background-color: #007bff;
}
.status-color.waiting {
color: white;
background-color: #50bfff;
}
.status-color.requested {
color: white;
background-color: #50bfff;
}
.status-color.removed,
.status-color.stop_requested,
.status-color.stopped {
color: white;
background-color: gray;
}
.status-color .button {
color: white;
}

time {
color: white;
opacity: 0.8;
}
h3 {
opacity: 0.8;
font-size: 19px;
font-weight: bold;
}
h4 {
font-size: 14px;
font-weight: bold;
margin-bottom: 2px;
}
.toggler {
padding: 10px;
padding-left: 18px;
color: #666;
border-top: 1px solid #f3f3f3;
background-color: white;
/*transition: background-color 0.5s;*/
}
.toggler:hover {
/*background-color: #f7f7f7;*/
cursor: pointer;
}
.toggler .caret {
position: relative;
margin-right: 5px;
transition: transform 0.3s;
opacity: 0.3;
}
.toggler .caret-open {
transform: rotate(90deg);
}

.fadeHeight-enter-active,
.fadeHeight-leave-active {
transition: all 0.2s;
max-height: 230px;
}
.fadeHeight-enter,
.fadeHeight-leave-to
{
opacity: 0;
max-height: 0px;
}
.note {
color: #333;
border-bottom: 1px solid #eee;
}
.note-text {
padding: 5px; 
font-size: 90%;
background-color: white;
}
.note-text:hover {
background-color: #fafafa;
cursor: pointer;
}
.remain {
background-color: #0003; 
width: 0%; 
position: absolute; 
height: 100%; 
top: 0; 
right: 0px;
transition: width 10s;
}
</style>
