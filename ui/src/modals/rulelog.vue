<template>
<b-modal size="xl" id='modal-rulelog' hide-footer>
    <template #modal-header>
        <h5>{{title}}</h5>
        <!-- Emulate built in modal header close button action -->

        <b-button-group>
            <b-button size="sm" variant="info" @click="load"><icon name="sync-alt"/> Reload</b-button>
            <b-button size="sm" @click="close()">X</b-button>
        </b-button-group>
    </template>

    <span v-if="loading">Loading..</span>
    <span v-if="nolog">No logs. The rule not yet handled?</span>
    <div v-if="root" class="root">
        <b-row>
            <!-- not really useful
            <b-col>
                <span class="form-header">Rule State</span>
                <h5 style="text-transform: uppercase;">{{root.state}}</h5>
            </b-col>
            -->
            <b-col :cols="7">
                <span class="form-header">Group Count</span>
                <h5>{{root.groupCount}}</h5>
            </b-col>
            <b-col>
                <span class="form-header">Handled</span>
                <h5><timeago :datetime="stats.mtime" :auto-update="10"/></h5>
            </b-col>
        </b-row>
    </div>
    <b-row v-if="root">
        <b-col :cols="7">
            <div class="stategroups">
                <div v-for="stategroup in stategroups" :key="stategroup.state" class="stategroup">
                    <div v-if="stategroup.groups.length">
                        <span class="header">{{stategroup.state}} <small>{{stategroup.groups.length}}</small></span>
                        <p style="margin-bottom: 5px;"><small>{{stategroup.desc}}</small></p>
                        <p style="margin-bottom: 10px;">
                            <div v-for="g in stategroup.groups" :key="g.id" 
                                :class="groupClass(g)" @click="selectedGroupId = g.id">{{g.id}}</div>
                        </p>
                    </div>
                </div>
            </div>
        </b-col>
        <b-col>
            <small v-if="!selected">Please select a group to show logs</small>
            <div v-if="selected" class="log">
                <h5>{{selectedGroupId}} <!--<small>{{selected.state}}</small>--></h5>
                <ul>
                    <li v-for="(log, idx) in selected.logs" :key="idx" :class="[log.type]"> 
                        <!--<time v-if="idx == 0">{{new Date(log.time).toLocaleString()}}<br></time>-->
                        <pre>{{log.message}}</pre>
                    </li>
                </ul>
                <p class="taskinfo">
                    <span v-if="selected.taskStatus"><taskstatus :status="selected.taskStatus"/></span>
                    <small v-if="selected.taskId">{{selected.taskId}}</small><br>
                </p>
            </div>
        </b-col>
    </b-row>
</b-modal>
</template>

<script>

import Vue from 'vue'

export default {
    components: { 
        taskstatus: ()=>import('@/components/statustag'),
    },

    data () {
        return {
            rule: null,

            loading: false,
            stats: null, //file stats of the json
            root: null,
            stategroups: [
                {
                    state: "waiting",
                    desc: "Waiting for required input data to be archived by previous steps",
                    groups: [],
                },
                {
                    state: "ambiguous",
                    desc: "Multiple input objects matches the criteria and can't submit a task",
                    groups: [],
                },
                {
                    state: "submitted",
                    desc: "A task has been submitted by task handlers",
                    groups: [],
                },
                {
                    state: "archived",
                    desc: "Output is archived. Nothing to do for this group.",
                    groups: [],
                },
                /*
                {
                    state: "other",
                    desc: "Any group that are in other state (should be empty)",
                    groups: [],
                },
                */
            ], 
            groups: null, //all groups (not organized)
            selectedGroupId: null,
            nolog: false,
            config: Vue.config,

        }
    },
    computed: {
        title() {
            if(!this.rule) return;
            if(this.rule.name) return this.rule.name;
            if(this.rule.app) return this.rule.app.name;
        },

        selected() {
            if(!this.groups || !this.selectedGroupId) return null;
            return this.groups[this.selectedGroupId];
        },
    },

    mounted() {
        this.$root.$on("rulelog.open", rule=>{
            this.rule = rule;
            this.load();
            this.$root.$emit('bv::show::modal', 'modal-rulelog')
        });
    },

    destroyed() {
        this.$root.$off("rulelog.open");
    },

    methods: {
        load() {

            //reset
            this.root = null;
            this.groups = null;
            this.stats = null;
            this.selectedGroupId = null;
            this.nolog = false;

            this.loading = true;
            this.$http.get('rule/log/'+this.rule._id).then(res=>{
                this.root = res.data.root;
                this.groups = res.data.groups;
                this.stats = res.data.stats;
                this.loading = false;

                //console.dir(this.groups);

                //organize groups into separate groups
                this.stategroups.forEach(stategroup=>{
                    stategroup.groups = [];
                    for(const groupId in res.data.groups) {
                        const g = res.data.groups[groupId];
                        if(g.state == stategroup.state) stategroup.groups.push(g);
                        g.id = groupId;
                    }
                    stategroup.groups.sort((a,b)=>a.id - b.id);
                });
            }).catch(res=>{
                //no log usually means the rule hasn't been executed yet
                console.error(res);
                this.nolog = true;
                this.loading = false;
            });
        },

        close () {
            this.$root.$emit('bv::hide::modal', 'modal-rulelog')
        },

        groupClass(group) {
            const cs = ["group"]
            if(this.selectedGroupId == group.id) cs.push("group-selected");
            if(group.taskStatus) cs.push("group-"+group.taskStatus);
            return cs;
        },

    },
}
</script>

<style scoped>
.taskinfo {
}
.log ul {
    list-style: none;
    background: #333;
    color: white;
    padding: 10px;
    font-size: 90%;
    line-height: 120%;
    margin-bottom: 5px;
}

.log, .stategroups {
    max-height: 500px;
    overflow: auto;
}
.log pre {
    display: inline-block;
    color: white;
}
.log time {
    color: #ccc;
    float: right;
}
.log li.debug pre {
    color: gray;
}
.log li.info pre {
    color: white;
}
.log li.warning pre {
    color: #fff3cd;
}
.log li.error pre {
    color: #f8d7da;
}
.log h5 {
    opacity: 0.7;
    border-bottom: 1px solid #ddd;
}
.stategroup {
}
.stategroup .header {
    opacity: 0.7;
    border-bottom: 1px solid #ddd;
    text-transform: uppercase;
    font-size: 120%;
    font-weight: bold;
    display: block;
}
.clickable:hover {
    background-color: #888;
    color: white;
}
.group {
    background-color: #ddd;
    padding: 0 3px;
    margin-bottom: 3px;
    margin-right: 5px;
    display: inline-block;
    cursor: pointer;
    border: 2px solid #0000;
    line-height: 125%;
}
.group-selected {
    border: 2px solid #007bff;
}
.group-requested {
    background-color: #50bff;
    color: white;
}
.group-failed {
    background-color: #dc3545;
    color: white;
}
.group-running {
    background-color: #007bff;
    color: white;
}
.group-finished {
    background-color: #28a745;
    color: white;
}
.group:hover {
    background-color: #999;
    color: white;
}
.root {
    margin-bottom: 20px;
}
</style>

