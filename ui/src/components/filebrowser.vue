<template>
<div>
    <p class="text-muted" style="padding: 5px;" v-if="!files">
        <span :style="{marginLeft: offset}">
            <icon name="cog" spin></icon> Loading..
        </span>
    </p>
    <b-alert :show="error" variant="danger">{{error}}</b-alert>
    <div v-if="files && !error">
        <div :style="{marginLeft: offset}">
            <!--
            <div class="fileitem" style="float: right; margin-right: 20px;">
                {{files.length}}
            </div>
            -->
            <div  class="buttons">
                <div class="button" @click="download()" title="Download"><icon name="download" scale="0.9"/> {{files.length}} files</div>
                <div class="button" @click="load()" title="Refresh"><icon name="sync-alt" scale="0.9"/></div>
            </div>
        </div>

        <p v-if="files.length == 0" class="text-muted" :style="{marginLeft: offset}">Empty Directory</p>

        <div v-for="(file, idx) in files">
            <!--file/dir label-->
            <div class="fileitem" @click="click(file)" :class="{'fileitem-viewing': file.view}">
                <span :style="{marginLeft: offset, opacity: '0.7'}">
                    <icon name="link" v-if="!file.directory && file.link" class="text-warning"></icon>
                    <icon name="regular/file" v-if="!file.directory && !file.link"></icon>
                    <icon name="folder-open" v-if="file.directory && file.open" class="text-primary"></icon>
                    <icon name="folder" v-if="file.directory && !file.open" class="text-primary"></icon>
                </span>
                {{file.filename}}
                <span style="float: right; width: 150px; opacity: 0.7;">
                    <timeago :since="file.attrs.mtime*1000" :title="new Date(file.attrs.mtime*1000).toLocaleString()"/>
                </span>
                <span style="float: right; margin-right: 20px;" v-if="!file.link">{{file.attrs.size|filesize}}</span>
            </div>

            <!-- recursively show sub directory-->
            <div class="content" v-if="file.open">
                <filebrowser :task="task" :path="subpath(file)" :depth="depth+1"></filebrowser>
            </div>

            <!-- inline file view-->
            <div v-if="file.view" :style="{paddingLeft: 0}" class="file-content">
                <span v-if="file.downloading" :style="{marginLeft: offset}" style="padding: 10px;">
                    <icon name="cog" spin></icon> Loading..
                </span>
                <!-- controls -->
                <div v-if="file.content">
                    <div v-if="file.content != '(empty)\n'" class="file-content-buttons">
                        <div class="button" @click="download_file(file)" title="Download"><icon name="download" scale="0.8"/></div>
                        <div class="button" @click="refresh_file(file)" title="Refresh"><icon name="sync-alt" scale="0.8"/></div>
                    </div>
                    <pre :ref="'file.'+idx" v-highlightjs="file.content"><code :class="file.type+' hljs'"></code></pre>
                </div>
                <div v-if="file.image_src" style="margin-bottom: 20px;">
                    <a :href="file.image_src"><img style="max-width: 100%;" :src="file.image_src"/></a>
                </div>
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
            //fullpath: null,
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
        this.load();
    },
    
    methods: {
        subpath: function(file) {
            let subpath = "";
            if(this.path) subpath += this.path;
            if(file) {
                if(subpath) subpath += "/";
                subpath += file.filename;
            }
            return subpath;
        },
        get_download_url: function(file) {
            var url = Vue.config.wf_api+'/task/download/'+this.task._id+'?at='+Vue.config.jwt;
            var p = this.subpath(file);
            if(p) url += "&p="+encodeURIComponent(p);
            return url;
        },
        download: function() {
            this.$notify({text: "Downloading Requested.. Please wait."});
            var url = this.get_download_url();
            document.location = url;
        },
        load: function() {
            var url = Vue.config.wf_api+'/task/ls/'+this.task._id;
            if(this.path) url += '?p='+encodeURIComponent(this.path);
            this.$http.get(url).then(res=>{
                this.files = res.body.files.sort((a, b)=>{
                    if(a.attrs.mtime == b.attrs.mtime) {
                        return a.attrs.filename||a.attrs.dirname > b.attrs.filename||b.attrs.dirname;
                    }
                    return a.attrs.mtime - b.attrs.mtime;
                });

            }).catch(err=>{
                console.error(err);
                this.error = err.body.message || err.statusText;
                this.files = [];
            })
        },

        download_file: function(file) {
            document.location = this.get_download_url(file);
        },

        refresh_file: function(file) {
            file.view = false;
            this.click(file);
        },

        //subordiante of click method.. this and click methods are ugly..
        open_text: function(res, file, type) {
            res.text().then(c=>{
                //reformat json content
                if(type == "json") {
                    var j = JSON.parse(c);
                    c = JSON.stringify(j, null, 4);
                }

                if(c == "") c = "(empty)";
                Vue.set(file, 'type', type);
                Vue.set(file, 'content', c);
                Vue.set(file, 'view', true);

                //scroll to the buttom of the <pre>
                this.$nextTick(()=>{
                    let id = this.files.indexOf(file);
                    let pre = this.$refs["file."+id][0];
                    pre.scrollTop = pre.scrollTopMax;
                });
            });
        },

        click: function(file){
            //just close file view if it's open
            if(file.view) {
                file.view = false;
                return;
            }

            //for directory, just open       
            if(file.directory) {
                Vue.set(file, 'open', !file.open); 
                return;
            }

            var url = this.get_download_url(file);

            //for large file, just download
            if(file.attrs.size > 1024*1024*5) {
                console.log("loading file", url);
                document.location = url;
                return;
            }

            //start downloading file to see what the file type is
            Vue.set(file, 'downloading', true);
            this.$http.get(url).then(res=>{
                file.downloading = false;
                switch(res.headers.get("Content-Type")) {
                case "application/json": 
                        this.open_text(res, file, "json");
                        return;
                case "application/x-sh": 
                        this.open_text(res, file, "bash");
                        return;
                case "text/plain":
                        this.open_text(res, file, "text"); 
                        return;
                case "text/csv": 
                        this.open_text(res, file, "csv");
                        return;
                case "image/png":
                case "image/jpeg":
                case "image/gif":
                        Vue.set(file, 'image_src', url);
                        Vue.set(file, 'view', true);
                        return;

                case "application/octet-stream": //binary or unknown
                case null:
                    var tokens = file.filename.split(".");
                    var ext = tokens[tokens.length-1];
                    switch(ext) {
                    case "bvals": 
                    case "bvecs": 
                    case "err": 
                    case "jobid": 
                    case "main": 
                        this.open_text(res, file, "text");
                        return;
                    }
                }

                //don't know how to open it.. download.
                document.location = url;
            }).catch(err=>{
                console.error(err);
                file.downloading = false;
            });
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
cursor: pointer;
background-color: #eee;
}
.fileitem.fileitem-viewing {
color: #2185d0;
}
.hljs {
background-color: #fff;
}
.file-content pre {
overflow: auto;
font-family: 'monospace';
margin-bottom: 5px;
padding: 0px;
max-height: 400px;
box-shadow: 1px 1px 4px #aaa;
border-left: 15px solid #ddd;
}
.file-content {
position: relative;
}
.file-content-buttons {
position: absolute; 
top: 5px; 
right: 25px; 
opacity: 0;
transition: opacity 0.5s;
}
.file-content:hover .file-content-buttons {
opacity: 0.7;
}
.buttons {
padding-top: 5px;
opacity: 0.5;
}
</style>
