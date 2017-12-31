<template>
<div>
    <p class="text-muted" style="margin: 5px;" v-if="!files">
        <span :style="{marginLeft: offset}">
            <icon name="cog" spin></icon> Loading..
        </span>
    </p>
    <el-alert v-if="error" :title="error" type="error" :closable="false"></el-alert>
    <div v-if="files">
        <div :style="{marginLeft: offset}">
            <div class="button" @click="download()" title="Download"><icon name="download"/></div>
            <div class="button" @click="load()" title="Refresh"><icon name="refresh"/></div>
        </div>

        <p v-if="files.length == 0" class="text-muted" :style="{marginLeft: offset}">Empty Directory</p>

        <div v-for="file in files">
            <div class="fileitem" @click="click(file)">
                    <span class="text-muted" :style="{marginLeft: offset}">
                        <icon name="file-o" v-if="!file.directory"></icon>
                        <icon name="folder-open" v-if="file.directory && file.open" style="color: #2693ff"></icon>
                        <icon name="folder" v-if="file.directory && !file.open" style="color: #2693ff"></icon>
                    </span>
                    {{file.filename}}
                    <span style="float: right; width: 150px;">{{new Date(file.attrs.mtime*1000).toLocaleString()}}</span>
                    <mute style="float: right; margin-right: 20px;">{{file.attrs.size|filesize}}</mute>
            </div>
            <div class="content" v-if="file.open">
                <filebrowser :task="task" :path="fullpath+'/'+file.filename" :depth="depth+1"></filebrowser>
            </div>
            <div v-if="file.content" style="position: relative;">
                <el-button-group v-if="file.content != '(empty)\n'" 
                    style="position: absolute; top: 0px; right: 0px; opacity: 0.7;">
                    <el-button size="mini" @click="download_file(file)" icon="document">Download</el-button>
                    <el-button size="mini" @click="refresh_file(file)"><icon scale="0.6" name="refresh"></icon> Refresh</el-button>
                </el-button-group>
                <pre v-highlightjs="file.content" class="file-content"><code :class="file.type+' hljs'"></code></pre>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import mute from '@/components/mute'

export default {
    name: "filebrowser", //needed to recurse itself
    props: {
        task: { type: Object },
        path: { type: String },
        depth: { type: Number, default: 1}
    },
    components: { mute },

    data() {
        return {
            fullpath: null,
            files: null,
            error: null,
        }
    },

    computed: {
        offset: function() {
            return this.depth * 15 + 'px';
        },
    },

    watch: {
        task: function(v) {
            console.log('todo.. task update detected by filebroser - need to refresh content');
        }
    },

    mounted: function() {
        this.fullpath = this.path;
        if(!this.fullpath) this.fullpath = this.task.instance_id+'/'+this.task._id;
        console.log("loading", this.fullpath);
        this.load();
    },
    
    methods: {
        get_download_url: function(file) {
            var p = this.fullpath;
            if(file) p+='/'+file.filename;
            var url = Vue.config.wf_api+'/resource/download'+
                '?r='+this.task.resource_id+
                '&p='+encodeURIComponent(p)+
                '&at='+Vue.config.jwt;
            return url;
        },

        download: function() {
            console.log("downloading",url);
            var url = this.get_download_url();
            document.location = url;
        },

        load: function() {
            this.$http.get(Vue.config.wf_api+'/resource/ls/'+this.task.resource_id+'?path='+encodeURIComponent(this.fullpath)).then(res=>{
                this.files = res.body.files.sort((a, b)=>{
                    if(a.attrs.mtime == b.attrs.mtime) {
                        return a.attrs.filename||a.attrs.dirname > b.attrs.filename||b.attrs.dirname;
                    }
                    return a.attrs.mtime - b.attrs.mtime;
                });

            }).catch(err=>{
                console.error(err);
                this.error = err.body.message || err.statusText;
            })
        },

        download_file: function(file) {
            document.location = this.get_download_url(file);
        },

        refresh_file: function(file) {
            file.content = "";
            this.click(file);
        },

        click: function(file){
            if(file.content) {
                //*close* file
                file.content = "";
                return;
            }

            var url = this.get_download_url(file);

            if(file.directory) Vue.set(file, 'open', !file.open); //for directory, just open
            else if(file.attrs.size > 1024*1024) document.location = url; //for large file, download
            else {
                //for small files, download content and display
                this.$http.get(url).then(res=>{
                    //set file type (TODO - can't highlight.js do this?)
                    var mime = res.headers.get("Content-Type");
                    if(!mime) mime = "unknown";
                    let type = null;
                    switch(mime) {
                    case "application/json": type = "json"; break;
                    case "application/x-sh": type = "bash"; break;
                    case "text/plain": type = "text"; break;
                    case "text/csv": type = "csv"; break;
                    case "unknown":
                        //for unknown content type, guess file type from extension
                        var tokens = file.filename.split(".");
                        var ext = tokens[tokens.length-1];
                        switch(ext) {
                        case "bvals": 
                        case "bvecs": 
                        case "err": 
                            type = "text"; break;
                        }
                    }
                    if(type) {
                        res.text().then(c=>{

                            //reformat json content
                            if(type == "json") {
                                var j = JSON.parse(c);
                                c = JSON.stringify(j, null, 4);
                            }

                            if(c == "") c = "(empty)";
                            Vue.set(file, 'type', type);

                            //TODO - can't get slideDown to work via css.. last ditch attempt to animte height
                            var lines = c.trim().split("\n");
                            Vue.set(file, 'content', "");
                            function addline() {
                                file.content += lines.shift()+"\n";
                                if(lines.length) setTimeout(addline, 10);
                            }
                            setTimeout(addline, 10);
                        });
                    } else {
                        console.log("opening new window - unknown file type", mime);
                        document.location = url;
                    } 
                });
            }
        }
    }
}
</script>

<style scoped>
.fileitem {
line-height: 150%;
margin: 0px;
padding: 2px 4px;
font-size: 13px;
}
.fileitem:hover {
color: #2185D0;
cursor: pointer;
background-color: #ddd;
}
.hljs {
background: #f0f0f0;
}
pre.file-content {
overflow: auto;
font-family: 'monospace';
margin: 0px;
margin-left: 4px;
margin-bottom: 15px;
padding: 0px;
padding-left: 10px;
max-height: 400px;
background-color: #d7d7d7;
}
</style>
