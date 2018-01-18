<template>
<div v-if="instances">
    <div class="page-header">
        <!--TODO.. show this in dropdown menu
        <div>
            <b-tabs class="brainlife-tab-dark" v-model="process_filter_tab">
                <b-tab v-for="tabinfo in process_filter_tabs" :key="tabinfo.id" :title="tabinfo.label"/>
            </b-tabs>
        </div>
        -->
        <div style="float: right;margin-top: 2px;">
            <b>{{instances.length}}</b> Processes
        </div>
    </div>
    <table class="table table-hover table-sm instances">
        <thead>
            <tr class="table-header">
                <th width="20px"></th>
                <th>Description</th>
                <th width="175px">Status</th>
                <th width="175px">Creator</th>
                <th width="175px">Date</th>
            </tr>
        </thead>
        <tbody>
        <tr v-for="instance in instances" :key="instance._id" 
            :id="instance._id" class="instance" :class="'instance-'+instance.status"
            @click="click(instance)" 
            v-if="process_filter_tabs[process_filter_tab].id == 'all' || process_filter_tabs[process_filter_tab].id == instance.status">
            <td></td>
            <td>
                {{instance.desc}}
                <span v-if="!instance.desc" class="text-muted">No Description ({{instance._id}})</span>
            </td>
            <td><statustag :status="instance.status"/></td>
            <td>
                <contact short="true" :id="instance.user_id"/>
            </td>
            <td style="opacity: 0.5;">
                <timeago :since="instance.create_date"/>
            </td>
        </tr>
        </tbody>
    </table>
    <b-button class="button-fixed" @click="newprocess" title="Create New Process"><icon name="plus" scale="2"/></b-button>
</div>
</template>

<script>
import Vue from 'vue'

import statustag from '@/components/statustag'
import contact from '@/components/contact'
//import process2 from '@/process2'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    props: [ 'project' ], 
    components: { 
        statustag, contact,
    },
    data () {
        return {
            instances: null,
            query: "",
            apps: null, //keyed by _id
            ws: null, //websocket
            
            process_filter_tab: 0,
            process_filter_tabs: [ 
                {id: "all", label: "All"},
                {id: "running", label: "Running"},
                {id: "finished", label: "Finished"},
            ],

            config: Vue.config,
        }
    },

    mounted: function() {
        console.log("loading instatnces");
        this.$http.get(Vue.config.wf_api+'/instance', {params: {
            find: JSON.stringify({
                "config.brainlife": true,
                status: {$ne: "removed"},
                group_id: {$exists: false},
                "config.removing": {$exists: false},
            }),
            limit: 2000,
            sort: '-create_date',
        }}).then(res=>{
            var old = new Date();
            old.setHours(0,0,0,0);
            res.body.instances.forEach(instance=>{
                instance.create_date = new Date(instance.create_date);
                if(instance.create_date < old) instance._old = true;
            });
            this.instances = res.body.instances;
            console.log("done loading instatnces");

            //subscribe to instance updates
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("binding to all instance updates");
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.instance",
                        //key: Vue.config.user.sub+".#",
                        key: "na.#", //any instance under "na" group (instances that doen't belong to any group)
                    }
                }));
            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                console.log("instance update----------------", event);
                if(event.dinfo && event.dinfo.exchange == "wf.instance") {
                    var instance = this.instances.find(i=>i._id == event.msg._id);
                    if(instance) {
                        for(var k in event.msg) instance[k] = event.msg[k];
                    }
                } 
            }
        }).catch(err=>{
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        });
    },

    methods: {
        click: function(instance) {
            this.$router.replace("/processes/"+instance._id);
        },

        newprocess: function() {
            this.$http.post(Vue.config.wf_api+'/instance', {
                config: {
                    brainlife: true,
                    type: "v2",
                },
                group_id: this.project.group_id,
            }).then(res=>{
                this.instances.unshift(res.body);
                this.$router.replace("/processes/"+res.body._id);
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err.body.message});
            });
        },

        /*
        rowclass: function(instance) {
            switch(instance.status) {
            case "requested": 
                return "table-info";
            case "running": 
                return "table-primary";
            case "failed": 
                return "table-danger";
            case "finished": 
                return "table-success";
            case "removed": 
                return "table-active";
            default: 
                return "table-warning";
            }
        }
        */
    },
}

</script>

<style scoped>
.page-header {
background-color: #f9f9f9;
position: fixed;
top: 100px;
left: 350px;
padding: 10px;
right: 15px;
height: 45px;
color: #999;
z-index: 1;
}
.instances {
background-color: white;
margin-top: 45px;
}
.instance {
cursor: pointer;
}
.button-fixed {
right: 50px;
}
.table-header th {
padding: 8px 5px;
}


/*
.status {
display: inline-block;
width: 20px;
text-align: center;
position: relative;
left: -2px;
}
.status-finished {
color: green;
}
.status-failed {
color: #c00;
}
.status-running {
color: #2693ff;
}
#process-list li.selected .status {
color: white;
}
.page-top textarea {
background-color: inherit;
border: none;
}
.page-top textarea:focus {
background-color: white;
}
*/
/*
tr.instance-finished {
border-left: 5px solid green;
}
tr.instance-failed {
border-left: 5px solid #dc3545;
}
tr.instance-undefined {
border-left: 5px solid #ffc107;
}
tr.instance-requested {
border-left: 5px solid #2693ff;
}
tr.instance-running {
border-left: 5px solid #007bff;
}
*/
</style>

