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
                <div class="button" v-if="task.status == 'failed' || task.status == 'finished' || task.status == 'removed' || task.status == 'stopped'" title="Rerun Task" @click="rerun">
                    <icon name="repeat"/>
                </div>
                <div class="button" v-if="task.status == 'requested' || task.status == 'running'" @click="stop()" title="Stop Task"><icon name="stop"/>
                </div>
                <div class="button" v-if="task.status != 'removed' && task.status != 'remove_requested'" @click="remove()" title="Remove Task"><icon name="trash"/>
                </div>
            </div>
            <h4><strong style="text-transform: uppercase;">{{task.status}}</strong>
                <small>
                    <time v-if="task.status == 'requested'"><timeago :since="task.create_date"/></time>
                    <time v-if="task.status == 'waiting'">since <timeago :since="task.create_date"/></time>
                    <time v-if="task.status == 'running'">since <timeago :since="task.start_date"/></time>
                    <time v-if="task.status == 'finished'"><timeago :since="task.finish_date"/></time>
                    <time v-if="task.status == 'failed'"><timeago :since="task.fail_date"/></time>
                    <time v-if="task.status == 'removed'"><timeago :since="task.remove_date"/></time>
                    <!--<time v-if="task.status == 'stopped'"><timeago :since="task.stop_date"/></time>-->
                </small>
            </h4>
            <i>{{task.status_msg.trim()||'...'}}</i>
        </div>
    </div>

    <!--
    <div @click="toggle('config')" class="toggler">
        <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.config}"/> Configuration
    </div>
    <transition name="fadeHeight">
        <div v-if="activeSections.config">
            <taskconfig :task="task" class="task-content"/>
        </div>
    </transition>
    -->
    <div v-if="task.service != 'soichih/sca-product-raw'">
        <taskconfig :task="task" class="task-content"/>
    </div>
    <div v-if="has_input_slot">
        <div @click="toggle('input')" class="toggler">
            <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.input}"/> Input
        </div>
        <transition name="fadeHeight">
            <div v-if="activeSections.input" class="task-content">
                <slot name="input"></slot>
            </div>
        </transition>
    </div>

    <div v-if="has_output_slot">
        <div @click="toggle('output')" class="toggler">
            <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.output}"/> Output
        </div>
        <transition name="fadeHeight">
            <div v-if="activeSections.output" class="task-content">
                <slot name="output"></slot>
            </div>
        </transition>
    </div>

    <div v-if="task.resource_ids.length > 0">
        <div @click="toggle('rawoutput')" class="toggler">
            <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.rawoutput}"/> Raw Output
        </div>
        <transition name="fadeHeight">
            <div v-if="activeSections.rawoutput" class="task-content">
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

export default {
    props: ['task'],
    components: { filebrowser, statusicon, mute, tags, taskconfig },
    name: "contact",
    data () {
        return {
            activeSections: {
                output: true, 
                input: true,
            },
            show_masked_config: false,
        }
    },

    computed: {
        has_input_slot() {
            return !!this.$slots.input;
        },
        has_output_slot() {
            return !!this.$slots.output;
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
.task-content {
padding: 10px;
background-color: #fafafa;
}
</style>
