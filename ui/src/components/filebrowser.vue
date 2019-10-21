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
            <div  class="buttons">
                <div class="button" @click="download()" title="Download"><icon name="download" scale="0.9"/> {{files.length}} files/dirs</div>
                <div class="button" @click="load()" title="Refresh"><icon name="sync-alt" scale="0.9"/></div>
            </div>
        </div>

        <p v-if="files.length == 0" class="text-muted" :style="{marginLeft: offset}">Empty Directory</p>

        <div v-for="(file, idx) in files" :key="idx">
            <!--file/dir label-->
            <div class="fileitem" @click="click(file)" :class="{'fileitem-viewing': file.view}">
                <span :style="{marginLeft: offset, opacity: '0.7'}">
                    <icon name="regular/file" v-if="!file.directory && !file.link"></icon>
                    <icon name="folder-open" v-if="file.directory && file.open" class="text-primary"></icon>
                    <icon name="folder" v-if="file.directory && !file.open" class="text-primary"></icon>
                    <icon name="link" v-if="file.link" class="text-warning" scale="0.80"></icon>
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
                <div v-if="file.content" style="position: relative;">
                    <div v-if="file.content != '(empty)\n'" class="file-content-buttons">
                        <div class="button" @click="download_file(file)" title="Download"><icon name="download" scale="0.8"/></div>
                        <div class="button" @click="refresh_file(file)" title="Refresh"><icon name="sync-alt" scale="0.8"/></div>
                    </div>
                    <editor :ref="'file.'+idx" v-model="file.content" @init="editorInit" :lang="file.lang" theme="chrome"></editor>
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

export default {
    name: "filebrowser", //needed to recurse itself
    props: {
        task: { type: Object },
        path: { type: String },
        depth: { type: Number, default: 1}
    },

    components: {       
        editor: require('vue2-ace-editor'), 
    },

    data() {
        return {
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
        editorInit(editor) {
            console.log("initializing editor");

            require('brace/ext/language_tools')

            require('brace/mode/sh')
            require('brace/mode/json')
            require('brace/mode/matlab')
            require('brace/mode/python')
            require('brace/mode/javascript')
            require('brace/mode/r')
            require('brace/mode/markdown')
            require('brace/mode/html')
            require('brace/mode/dockerfile')

            require('brace/theme/chrome')

            require('brace/snippets/javascript')

            //require('brace/theme/dawn')

            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
            editor.setReadOnly(true);  // false to make it editable

            editor.setAutoScrollEditorIntoView(true);
            editor.setOption("maxLines", 30);
            editor.setOption("minLines", 3);

            //editor.setHighlightActiveLine(false); //not enough.
            editor.setShowPrintMargin(true);
        },

        subpath(file) {
            let subpath = "";
            if(this.path) subpath += this.path;
            if(file) {
                if(subpath) subpath += "/";
                subpath += file.filename;
            }
            return subpath;
        },
        get_download_url(file) {
            var url = Vue.config.wf_api+'/task/download/'+this.task._id+'/';
            var p = this.subpath(file);
            if(p) url += p;
            url += '?at='+Vue.config.jwt;
            return url;
        },
        download() {
            this.$notify({text: "Downloading Requested.. Please wait."});
            var url = this.get_download_url();
            document.location = url;
        },
        load() {
            var url = Vue.config.wf_api+'/task/ls/'+this.task._id;
            if(this.path) url += '?p='+encodeURIComponent(this.path);
            this.$http.get(url).then(res=>{
                this.files = res.data.files.sort((a, b)=>{
                    if(a.attrs.mtime == b.attrs.mtime) {
                        return a.attrs.filename||a.attrs.dirname > b.attrs.filename||b.attrs.dirname;
                    }
                    return a.attrs.mtime - b.attrs.mtime;
                });
            }).catch(err=>{
                console.dir(err);
                this.error = err.message || err.statusText || err.toString();
                this.files = [];
            })
        },

        download_file(file) {
            document.location = this.get_download_url(file);
        },

        refresh_file(file) {
            file.view = false;
            this.click(file);
        },

        //subordiante of click method.. this and click methods are ugly..
        open_text(data, file, lang, scroll_to_bottom) {
            //sometime data arrives as nyumber.. and editor hates it
            if(typeof data === 'number') data = data.toString();

            //reformat json content
            if(lang == "json") {
                data = JSON.stringify(data, null, 4);
            }

            if(data == "") data = "(empty)";
            Vue.set(file, 'content', data); 
            Vue.set(file, 'lang', lang);
            Vue.set(file, 'view', true);

            if(scroll_to_bottom) this.$nextTick(()=>{
                let id = this.files.indexOf(file);
                let editor = this.$refs["file."+id][0].editor;
                let lines = editor.session.doc.$lines.length;
                editor.scrollToLine(lines, false, true); //false=center, true=animate
            });   
        },

        click(file){
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

            //start downloading file to see what the lang is
            Vue.set(file, 'downloading', true);
            this.$http.get(url).then(res=>{
                file.downloading = false;

                //known file names?
                switch(file.filename) { 
                case "_main": 
                case "main": 
                    this.open_text(res.data, file, "sh");
                    return;
                case "exit-code":                   
                case "jobid":                     
                case "pid":                     
                case ".gitignore":
                case ".dockerignore":  
                case "LICENSE":
                case "README":
                    this.open_text(res.data, file, "text");
                    return;
                case "Dockerfile":  
                    this.open_text(res.data, file, "dockerfile");
                    return;
                case "config.json.sample": 
                    this.open_text(res.data, file, "json");
                    return;
                }

                //known file extensions?
                let tokens = file.filename.split(".");
                let ext = tokens[tokens.length-1];
                let scroll_to_bottom = false;
                switch(ext) {
                case "log":
                case "err": 
                    scroll_to_bottom = true;
                case "txt": 
                case "csv": 
                case "bvals": 
                case "bvecs":
                    this.open_text(res.data, file, "text", scroll_to_bottom);
                    return;
                case "md": return this.open_text(res.data, file, "markdown");
                case "json": 
                    if(file.attrs.size > 1024*1024*2) return document.location = url; //don't open json that's too big.. (too slow)
                    return this.open_text(res.data, file, "json");
                case "sh":
                case "pbs":   
                    return this.open_text(res.data, file, "sh");
                case "m": return this.open_text(res.data, file, "matlab");
                case "js": return this.open_text(res.data, file, "javascript");
                case "R": return this.open_text(res.data, file, "r");
                case "py": return this.open_text(res.data, file, "python");
                case "png":
                case "jpeg":
                case "jpg":
                case "gif":
                case "svg":
                    Vue.set(file, 'image_src', url);
                    Vue.set(file, 'view', true);
                    return;
                case "html": 
                    this.open_text(res.data, file, "html");
                    return;
                }

                //known content-type?
                console.log("relying on content-type", res.headers["content-type"]);
                switch(res.headers["content-type"]) {
                case "application/json": 
                        this.open_text(res.data, file, "json");
                        return;
                case "application/x-sh": 
                        this.open_text(res.data, file, "sh");
                        return;
                case "text/markdown":
                case "text/plain":
                        this.open_text(res.data, file, "text"); 
                        return;
                //ace doesn't have csv mode?
                case "text/csv": 
                        this.open_text(res.data, file, "text"); //no csv with ace?
                        return;
                case "image/png":
                case "image/jpeg":
                case "image/gif":
                        Vue.set(file, 'image_src', url);
                        Vue.set(file, 'view', true);
                        return;
                /*
                case "application/octet-stream": //binary or unknown
                case null:
                */
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
.file-content {
margin-right: 30px;
}
.file-content-buttons {
position: absolute; 
top: 3px; 
right: 20px; 
opacity: 0;
transition: opacity 0.3s;
z-index: 1;
}
.file-content:hover .file-content-buttons {
opacity: 0.7;
}
.buttons {
padding-top: 5px;
opacity: 0.5;
}
</style>
