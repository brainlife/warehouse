<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>

    <div class="page-top" v-if="selected">
        <div style="margin: 10px; float: right;">
            <el-button v-if="!selected.config.removing" @click="remove()" icon="delete" title="Remove this process"/>
        </div>
        <statusicon :status="selected.status" :scale="1.75" style="width: 40px; text-align: center; float: left; margin: 10px;opacity: 0.6;"/>
        <!--<b class="text-muted" style="float: left; margin-top: 8px;">Description</b>-->
        <div style="margin-left: 60px; margin-right: 100px;">
            <div v-if="editdesc">
                <el-input type="textarea" placeholder="Process Description" style="padding-top: 3px;"
                    @change="changedesc()" v-model="selected.desc" :rows="2"></el-input>
            </div>
            <p v-else @click="editdesc = true" style="height: 100%;padding: 10px;" class="clickable text-muted">{{selected.desc||'no description'}}</p>
        </div>
    </div>

    <div class="process-list" v-if="instances" id="process-list">
        <div class="process-list-header">
            <h3>Processes</h3>
        </div>
        <ul>
            <li v-for="instance in instances" :id="instance._id" :key="instance._id" @click="click(instance)" :class="{selected: selected == instance}">
                <div style="float: left">
                    <span class="status status-finished" v-if="instance.status == 'finished'" style="font-size: 140%;"><icon name="check"/></span>
                    <span class="status status-running" v-if="instance.status == 'running'"><icon name="cog" :spin="true"/></span>
                    <span class="status status-failed" v-if="instance.status == 'failed'"><icon name="exclamation-circle"/></span>
                </div>
                <div style="margin-left: 25px;">
                    <time v-if="instance._old">{{instance.create_date|date('%x')}}</time>
                    <time v-else>{{instance.create_date|date('%I:%M %p')}}</time>

                    <div class="type" v-if="instance.config.type != 'v2'" style="display: inline-block;">
                        <span v-if="instance.config.type == 'simple'">
                            {{apps[instance.config.prov.app].name}}
                        </span> 
                        <span v-else>{{instance.config.type}}</span>
                    </div>
                    {{instance.desc||'no description'}}
                </div>
            </li>
        </ul>
        <el-button class="fixed" @click="newprocess()" title="Create New Process"><icon name="plus" scale="2"/></el-button>
    </div>

    <div class="page-content">
        <h3 class="text-muted" v-if="instances && !selected" style="padding: 30px;">Please select or create a new process</h3>
        <div v-else>
            <simpleprocess @view="view" v-if="selected && selected.config.type == 'simple'" :instance="selected"></simpleprocess>
            <process @view="view" v-if="selected && selected.config.type == 'v1'" :instance="selected"></process>
            <process2 @view="view" v-if="selected && selected.config.type == 'v2'" :instance="selected"></process2>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import statusicon from '@/components/statusicon'

import simpleprocess from '@/simpleprocess'
import process from '@/process'
import process2 from '@/process2'

var debounce = null;

export default {
    components: { 
        sidemenu, pageheader, statusicon,
        simpleprocess, process, process2,
    },
    data () {
        return {
            instances: null,

            selected : null, //selected instance to show

            query: "",
            
            //cache
            //projects: null, //keyed by _id
            apps: null, //keyed by _id

            editdesc: false,

            config: Vue.config,
        }
    },
    mounted: function() {
        console.log("loading app, instances");

        //load application details
        this.$http.get('app', {params: {
            find: JSON.stringify({ removed: false }),
        }})
        .then(res=>{
            this.apps = {};
            res.body.apps.forEach((a)=>{
                this.apps[a._id] = a;
            });

            //then load instances (processes)
            return this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    //_id: this.$route.params.id,
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    "config.removing": {$exists: false},
                }),
                limit: 2000,
                sort: '-create_date',
            }});
        })
        .then(res=>{
            var old = new Date();
            old.setHours(0,0,0,0);
            res.body.instances.forEach(instance=>{
                instance.create_date = new Date(instance.create_date);
                if(instance.create_date < old) instance._old = true;
            });
            this.instances = res.body.instances;

            //preselect
            var selected_id = this.$route.params.id;
            if(!selected_id) {
                //instace id not specified! let's open the latest one
                this.$router.replace("/processes/"+this.instances[0]._id);
                return;
            }
            this.selected = this.instances.find(i=>i._id == selected_id);

            //scroll to it
            Vue.nextTick(()=>{
                var elem = document.getElementById(selected_id);
                var area = document.getElementById("process-list");
                //scroll to elem if it's outside the scrolling window
                if(area.clientHeight < elem.offsetTop) {
                    area.scrollTop = elem.offsetTop - area.clientHeight/2;
                }
            });
        }).catch(err=>{
          console.error(err);
        });
    },

    methods: {
        click: function(instance) {
            this.$router.replace("/processes/"+instance._id);
        },
        changedesc: function() {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.put(Vue.config.wf_api+'/instance/'+this.selected._id, this.selected).then(res=>{
                    this.$notify({ text: 'Updated description', type: 'success' });
                    this.editdesc = false;
                });
            }, 2000);        
        },
        newprocess: function() {
            this.$http.post(Vue.config.wf_api+'/instance', {
                //name: "brainlife.process",
                config: {
                    brainlife: true,
                    type: "v2",
                },
                desc: "",
            }).then(res=>{
                this.instances.unshift(res.body);
                this.$router.replace("/processes/"+res.body._id);
            });
        },
        remove: function() {
            if(confirm("Do you really want to remove this process and all tasks?")) {
                this.$http.delete(Vue.config.wf_api+'/instance/'+this.selected._id).then(res=>{
                    var idx = this.instances.indexOf(this.selected);
                    this.instances.splice(idx, 1);
                    this.selected = null;
                    this.$notify({type: "success", text: "Removed the process"});
                });
            }
        },
        view: function(opt) {
            var view = opt.view.split('/').join('.'); //replace / with .
            var path = "#/view/"+opt.instanceid+"/"+opt.taskid+'/'+view;
            if(opt.subdir) path += '/'+opt.subdir;
            window.open(path, "", "width=1200,height=800,resizable=no,menubar=no"); 
        }
    },
    watch: {
        '$route': function() {
            var selected_id = this.$route.params.id;
            this.selected = this.instances.find(i=>i._id == selected_id);
        },
    }
}

</script>

<style scoped>
.page-top {
height: 60px;
box-shadow: 0px 1px 1px rgba(0,0,0,0.2);
position: fixed;
top: 50px;
right: 0px;
left:390px;
z-index: 1;
background-color: #eee;
overflow: hidden;
}
.page-content {
margin-left: 300px;
position: relative;
}
.process-list-header {
padding: 10px 20px;
color: #777;
text-transform: uppercase;
margin-bottom: 0px;
}
.process-list-header .count {
margin: 10px;
margin-top:17px;
opacity: 0.7;
}
.process-list {
background-color: #444;
/*box-shadow: 1px 0px 1px rgba(0,0,0,0.2);*/
position: fixed;
top: 50px;
bottom: 0px;
left: 90px;
overflow-y: auto;
overflow-x: hidden;
width: 300px;
z-index: 5;
/*word-break: break-all;*/
}
.process-list ul {
list-style: none;
margin: 0;
padding: 0;
}
.process-list li {
padding: 5px 10px;
/*border-top: 1px solid #414141;*/
font-size: 90%;
line-height: 150%;
color: #bbb;
transition: color, background-color 0.3s;
/*
max-height: 50px;
overflow: hidden;
text-overflow: ellipsis;
*/
}
.process-list li time {
float: right;
opacity: 0.4;
}
.process-list li .type {
background-color: #333;
color: #999;
font-size: 80%;
padding: 0px 3px;
}
.process-list li:hover {
background-color: #000;
cursor: pointer;
color: white;
}
.process-list li.selected {
background-color: #2693ff;
color: white;
}
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
.process-list li.selected .status {
color: white;
}

.el-button.fixed {
position: fixed;
bottom: 20px;
left: 290px;
border-radius: 25px;
width: 50px;
height: 50px;
padding: 10px;
margin: 10px;
font-weight: bold;
color: white;
background-color: gray;
border: none;
box-shadow: 0px 0px 10px #333;
transition: background-color 0.3s;
}
.el-button.fixed:hover {
background-color: #2693ff;
}
</style>

