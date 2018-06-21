<template>
<div v-if="task">
    <slot name="header">
        <h3><icon name="paper-plane"></icon> {{task.name||task.service}}</h3>
    </slot>

    <!--status indicator-->
    <div class="status-card" :class="task.status" style="border: none;">
        <div style="float: left; padding: 6px 8px" @click="poke">
            <statusicon :status="task.status" scale="1.5"/>
        </div>
        <div style="margin-left: 45px;">
            <div style="float: right;">
                <!--
                <contact :id="task.user_id" :short="true" style="position: relative; top: -3px; opacity: 0.9"/>
                -->
                <div class="button" style="opacity: 0.7" :id="'popover'+task.config._tid"><icon name="info"/></div>
                <b-popover :target="'popover'+task.config._tid" triggers="hover click focus">
                    <template slot="title"><span class="text-muted">ID {{task._id}}</span></template>
                    <p>
                        <contact :id="task.user_id" :short="true"/>
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
                    <tr v-if="task.next_date">
                        <th>Next Chk</th>
                        <td>{{new Date(this.task.next_date).toLocaleString()}}</td>
                    </tr>
                    <tr v-if="resource">
                        <th>Resource</th>
                        <td>{{this.resource.name}}</td>
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
            </div>
            <h4>
                <strong style="text-transform: uppercase;">{{task.status}}</strong>
                <small>
                    <time v-if="task.status == 'requested'"><timeago :since="task.create_date" :auto-update="60"/></time>
                    <time v-if="task.status == 'waiting'">since <timeago :since="task.create_date" :auto-update="60"/></time>
                    <time v-if="task.status == 'running'">since <timeago :since="task.start_date" :auto-update="30"/></time>
                    <time v-if="task.status == 'finished'"><timeago :since="task.finish_date" :auto-update="60"/></time>
                    <time v-if="task.status == 'failed'"><timeago :since="task.fail_date" :auto-update="60"/></time>
                    <time v-if="task.status == 'removed'"><timeago :since="task.remove_date" :auto-update="60"/></time>
                </small>
            </h4>
            <i>{{task.status_msg.trim()||'...'}}</i>
        </div>
    </div>

    <div v-if="task.service != 'soichih/sca-product-raw'">
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
            <small v-if="remove_in_days < 7" class="text-danger" style="float: right;">Will be removed in <b>{{remove_in_days.toFixed(0)}} days</b></small>
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
</template>

<script>
import Vue from 'vue'

import filebrowser from '@/components/filebrowser'
import statusicon from '@/components/statusicon'
import mute from '@/components/mute'
import tags from '@/components/tags'
import taskconfig from '@/components/taskconfig'
import contact from '@/components/contact'

let resource_cache = {};

export default {
    props: ['task'],
    components: { 
        filebrowser, statusicon, mute, tags, taskconfig, contact ,
    },
    data () {
        return {

            activeSections: {
                output: true, 
                input: true,
            },
            show_masked_config: false,

            resource: null,
        }
    },

    watch: {
        'task': {
            deep: true,
            handler: function() {
                this.load_resource_info(this.task.resource_id);
            }
        }
    },

    mounted() {
        this.load_resource_info(this.task.resource_id);
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
            return i/(3600*24*1000);
        }
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
                    this.resource = res.body.resources[0];
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
                this.$notify({ text: res.body.message, type: 'success'});
            })
            .catch(err=>{
                console.error(err); 
            });
        },
        stop() {
            this.$http.put(Vue.config.wf_api+'/task/stop/'+this.task._id)
            .then(res=>{
                this.$notify({ text: res.body.message, type: 'success'});
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
                this.$notify({text: res.body.message, type: 'success'});
            })
            .catch(err=>{
                console.error(err); 
            });
        },
    },
}
</script>

<style scoped>
.task {
background-color: #fafafa;
}
.status-card {
padding: 5px;
}
.status-card.finished {
color: white;
background-color: #28a745;
}
.status-card.failed {
color: white;
background-color: #c00;
}
.status-card.running_sync,
.status-card.running {
color: white;
/* background-color: #2693ff; */
background-color: #007bff;
}
.status-card.waiting {
color: white;
background-color: #50bfff;
}
.status-card.requested {
color: white;
background-color: #50bfff;
}
.status-card.removed,
.status-card.stop_requested,
.status-card.stopped {
color: white;
background-color: gray;
}
.status-card .button {
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
font-size: 15px;
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
top: 3px;
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
</style>
