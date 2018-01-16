<template>
<div v-if="task">
    <slot name="header">
        <h3><icon name="paper-plane"></icon> {{task.name||task.service}}</h3>
    </slot>

    <!--status indicator-->
    <b-card :class="task.status" style="clear: both; border: none;">
        <statusicon :status="task.status" scale="1.5" style="float: left; padding: 2px 8px;" @click.native="poke"/>
        <div style="padding-left: 45px;">
            <div style="float: right;">
                <div class="button" v-if="task.status == 'failed' || task.status == 'finished' || task.status == 'removed' || task.status == 'stopped'" title="Rerun Task" @click="rerun()">
                    <icon name="repeat"/>
                </div>
                <div class="button" v-if="task.status == 'requested' || task.status == 'running'" @click="stop()" title="Stop Task"><icon name="stop"/>
                </div>
                <div class="button" v-if="task.status != 'removed' && task.status != 'remove_requested'" @click="remove()" title="Remove Task"><icon name="trash"/>
                </div>
            </div>
            <h4><strong style="text-transform: uppercase;">{{task.status}}</strong>
                <small>
                    <time v-if="task.status == 'finished'"><timeago :since="task.finish_date" :format="formatTime" :auto-update="60"></timeago></time>
                    <time v-if="task.status == 'running'">since <timeago :since="task.start_date" :format="formatTime" :auto-update="60"></timeago></time>
                    <time v-if="task.status == 'requested'"><timeago :since="task.create_date" :format="formatTime" :auto-update="60"></timeago></time>
                    <time v-if="task.status == 'failed'"><timeago :since="task.fail_date" :format="formatTime" :auto-update="60"></timeago></time>
                    <time v-if="task.status == 'removed'"><timeago :since="task.remove_date" :format="formatTime" :auto-update="60"></timeago></time>
                </small>
            </h4>
            <i>{{task.status_msg.trim()||'...'}}</i>
        </div>
    </b-card>

    <div @click="toggle('config')" class="toggler">
        <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.config}"/> Configuration
    </div>
    <transition name="fadeHeight">
        <div v-if="activeSections.config">
            <taskconfig :task="task" style="padding: 10px; background-color: #f0f0f0;"/>
        </div>
    </transition>

    <div v-if="has_input_slot">
        <div @click="toggle('input')" class="toggler">
            <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.input}"/> Input
        </div>
        <transition name="fadeHeight">
            <div v-if="activeSections.input" style="padding: 10px; background-color: #f0f0f0;">
                <slot name="input"></slot>
            </div>
        </transition>
    </div>

    <div @click="toggle('output')" class="toggler">
        <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.output}"/> Output
    </div>
    <transition name="fadeHeight">
        <div v-if="activeSections.output" style="padding: 10px; background-color: #f0f0f0;">
            <slot name="output"></slot>
        </div>
    </transition>

    <div v-if="task.status != 'removed'">
        <div @click="toggle('rawoutput')" class="toggler">
            <icon name="chevron-right" class="caret" :class="{'caret-open': activeSections.rawoutput}"/> Raw Output
        </div>
        <transition name="fadeHeight">
            <div v-if="activeSections.rawoutput" style="padding: 10px; background-color: #f0f0f0;">
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
import VueTimeago from 'vue-timeago'

Vue.use(VueTimeago, {
    name: 'timeago',
    locale: 'en-US',
    locales: {
        'en-US': require('vue-timeago/locales/en-US.json')
    }
});

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
        toggle(section) {
            if(this.activeSections[section] === undefined) {
                Vue.set(this.activeSections, section, true);
            } else this.activeSections[section] = !this.activeSections[section];
        },

        formatTime(time) {
            return new Date(time).toLocaleString();
        },
        rerun() {
            this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.task._id)
            .then(res=>{
                console.dir(res); 
            })
            .catch(err=>{
                console.error(err); 
            });
        },
        stop() {
            this.$http.put(Vue.config.wf_api+'/task/stop/'+this.task._id)
            .then(res=>{
                console.dir(res); 
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
            console.log("poking", this.task._id);
            this.$http.put(Vue.config.wf_api+'/task/poke/'+this.task._id)
            .then(res=>{
                this.$notify({text: "poked", type: 'success'});
            })
            .catch(err=>{
                console.error(err); 
            });
        },
    },
}
</script>

<style scoped>
.card-body {
padding: 8px;
}
.card.finished {
color: white;
background-color: green;
}
.card.failed {
color: white;
background-color: #c00;
}
.card.running {
color: white;
background-color: #2693ff;
}
.card.requested {
color: white;
background-color: #50bfff;
}
.card.removed,
.card.stopped {
color: white;
background-color: gray;
}
.card .button {
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
color: #666;
border-top: 1px solid #eee;
}
.toggler:hover {
background-color: #ddd;
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
