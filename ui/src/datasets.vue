<template>
<div>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher"> <!-- main view -->
        <div class="page-content" :class="{rightopen: selected_count}">
        <div class="margin20">
            <div class="ui fluid category search">
                <button class="ui right floated primary button" @click="go('/datasets/upload')">
                    <i class="ui icon add"></i> Upload
                </button>
                <div class="ui icon input">
                    <input class="prompt" type="text" v-model="query" placeholder="Search ...">
                    <i class="search icon"></i>
                </div>
                <div class="results"></div>
            </div>

            <table class="ui compact definition table">
            <thead>
                <tr>
                    <th style="width: 25px; background-color: #f0f0f0; box-shadow: -1px -1px 0 1px #f0f0f0;"></th>
                    <th>Data Type</th>
                    <th>Project</th>
                    <th>Subject</th><!-- TODO list of metadata are different for each datatype -->
                    <th>Name/Desc</th>
                    <th>Tags</th>
                    <th style="min-width: 150px;">Create Date</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="dataset in filtered_datasets" 
                    :class="{'clickable-record': true, selected: is_selected(dataset)}" 
                    @click="go('/dataset/'+dataset._id)">
                    <td @click.stop="check(dataset)">
                        <div class="ui checkbox">
                            <input type="checkbox" :checked="is_selected(dataset)">
                            <label></label><!-- need this somehow-->
                        </div>
                    </td>
                    <!--
                    <td>
                          <i class="browser icon" @click="go('/dataset/'+dataset._id)" style="cursor: pointer;"></i>
                    </td>
                    -->
                    <td>
                        {{dataset.datatype.name}}
                        <tags :tags="dataset.datatype_tags"></tags>
                    </td>
                    <td>
                        <div class="ui green horizontal label" v-if="dataset.project.access == 'public'">Public</div>
                        <div class="ui red horizontal label" v-if="dataset.project.access == 'private'">Private</div>
                        {{dataset.project.name}}
                    </td>
                    <td>
                        <div v-if="dataset.meta && dataset.meta.subject">{{dataset.meta.subject}}</div>
                    
                    </td>
                    <td>
                        <b>{{dataset.name}}</b><br>
                        <small>{{dataset.desc}}</small>
                    </td>
                    <td>
                        <tags :tags="dataset.tags"></tags>
                    </td>
                    <td>
                        <small>{{dataset.create_date | date}}</small>
                    </td>
                </tr>
            </tbody>
            </table>
        </div><!--margin20-->
        </div><!--page-content-->
    </div><!--pusher-->

    <div class="selected-view" v-if="selected_count" style="padding: 10px 5px 0px 5px;">
        <h3 style="color: white;">
            <button class="ui right floated mini button" @click="clear_selected()"> Clear </button>
            <i class="checkmark box icon"></i> {{selected_count}} Selected
        </h3>
        <div class="ui segments">
            <div class="ui attached segment" v-for="(datasets, did) in selected" v-if="datatypes[did]">
                <h5>{{datatypes[did].name}}</h5>
                <div class="selected-item" v-for="(dataset, id) in datasets" @click="go('/dataset/'+id)">
                    <p>
                        <i class="trash icon right floated" @click.stop="remove_selected(dataset)"></i>
                        <small>
                            {{dataset.name}}
                            <tags :tags="dataset.datatype_tags"></tags>
                        </small>
                    </p>
                </div>
            </div>
        </div>
        <button v-if="!download_task" class="ui right floated tiny button" @click="download()"> <i class="download icon"></i> Download </button>
        {{download_task}}
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import tags from '@/components/tags'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    name: 'datasets',
    components: { sidemenu, tags },
    data () {
        return {
            datasets: [],
            selected: {}, //grouped by datatype_id, then array of datasets also keyed by dataset id
            query: "",

            datatypes: {}, //catalog of datatypes from dataset.datatype 

            download_task: null, //will be set if downloading
        }
    },

    computed: {
        
        selected_count: function() {
            var total = 0;
            for(var did in this.selected) {
                total += Object.keys(this.selected[did]).length;
            }
            console.log("selected count", total);
            return total;
        },

        filtered_datasets: function() {
            if(!this.query) return this.datasets;

            return this.datasets.filter((dataset)=>{
                var lquery = this.query.toLowerCase();
                if(~dataset.name.toLowerCase().indexOf(lquery)) return true;
                if(~dataset.desc.toLowerCase().indexOf(lquery)) return true;
                if(~dataset.project.name.toLowerCase().indexOf(lquery)) return true;
                if(~dataset.datatype.name.toLowerCase().indexOf(lquery)) return true;

                if(~dataset.tags.indexOf(lquery)) return true; //TODO need to do something a bit smarter..
                if(~dataset.datatype_tags.indexOf(lquery)) return true; //TODO need to do something a bit smarter..
                return false;
            });
        },
    },

    mounted: function() {
        this.$http.get('dataset', {params: {
            find: JSON.stringify({$or: [
                {removed: {$exists: false}},
                {removed: false},
            ]}),
            select: 'datatype datatype_tags project create_date name desc tags meta',
        }})
        .then(res=>{
            this.datasets = res.body.datasets;
            /*
            Vue.nextTick(()=>{
                console.log("shown dataset");
                $(this.$el).find('.ui.dropdown').dropdown()
            });
            */

            this.datasets.forEach(dataset=>{
                this.datatypes[dataset.datatype._id] = dataset.datatype;
            });
            
            //datatypes 
        }, res=>{
            console.error(res);
        });

        this.selected = JSON.parse(localStorage.getItem('datasets.selected')) || {};
    },

    methods: {
        is_selected: function(dataset) {
            if(this.selected[dataset.datatype._id] === undefined) return false;
            if(this.selected[dataset.datatype._id][dataset._id] === undefined) return false;
            return true;
        },
        opendataset: function(dataset) {
            console.dir(dataset);
        },
        go: function(path) {
            this.$router.push(path);
        },
        check: function(dataset) {
            var did = dataset.datatype._id;
            if(this.selected[did] === undefined) Vue.set(this.selected, did, {});
            if(this.selected[did][dataset._id]) Vue.delete(this.selected[did], dataset._id);
            else Vue.set(this.selected[did], dataset._id, dataset);
            this.persist_selected();
        },
        persist_selected: function() {
            localStorage.setItem('datasets.selected', JSON.stringify(this.selected));
        },
        clear_selected: function() {
            this.selected = {};
            this.persist_selected();
        },
        remove_selected: function(dataset) {
            var did = dataset.datatype._id;
            Vue.delete(this.selected[did], dataset._id);
            this.persist_selected();
        },
        download: function() {
            var download_instance = null;
            //first create an instance to download things to
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.download"
            }).then(res=>{
                download_instance = res.body;
                console.log("instance created", download_instance);

                //create config to download all selected data from archive
                var download = [];
                for(var datatype_id in this.selected) {
                    for(var dataset_id in this.selected[datatype_id]) {
                        download.push({
                            url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                            untar: "gz",
                            dir: "download/"+dataset_id, //TODO - organize into BIDS?
                        });
                    }
                }
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: download_instance._id,
                    name: "Staging download",
                    service: "soichih/sca-product-raw",
                    config: { download },
                })
            }).then(res=>{
                this.download_task = res.body.task;
                console.log("download_task", this.download_task);

                //listen to download task
                var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
                var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
                ws.onopen = (e)=>{
                    console.log("websocket opened", download_instance._id);
                     ws.send(JSON.stringify({
                        bind: {
                            ex: "wf.task",
                            key: Vue.config.user.sub+"."+download_instance._id+".#",
                        }
                    }));
                }
                  
                var downloading = false;
                ws.onmessage = (json)=>{
                    var event = JSON.parse(json.data);
                    var msg = event.msg;
                    if(!msg || !msg._id) return; //odd..
                    switch(event.dinfo.exchange) {
                    case "wf.task":
                        this.download_task = msg;    

                        if(!downloading && this.download_task.status == "finished") {
                            downloading = true;
                            var url = Vue.config.wf_api+'/resource/download'+
                                '?r='+this.download_task.resource_id+
                                '&p='+encodeURIComponent(this.download_task.instance_id+'/'+this.download_task._id+'/download')+
                                '&at='+Vue.config.jwt;
                            document.location = url;
                        }
                        break;
                    default:
                        console.error("unknown exchange", event.dinfo.exchange);
                    }
                }
            });
        }
    },
}
</script>

<style scoped>
.page-content {
/*transition: margin-right 0.5s;*/
position: fixed;
left: 200px;
right: 0px;
top: 0px;
bottom: 0px;
overflow: auto;
}
.rightopen {
right: 250px;
}
.selected {
transition: color, background-color 0.2s;
background-color: #2185d0;
color: white;
}
.selected-view {
background-color: #2185d0;
/*box-shadow: inset 3px 0px 3px #aaa;*/
overflow-x: hidden;
position: fixed;
right: 0px;
width: 250px;
top: 0px;
bottom: 0px;
}
.selected-view .selected-item:hover {
background-color: #eee;
cursor: pointer;
}
</style>

