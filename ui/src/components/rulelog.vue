<template>
<div style="min-height: 35px;">
    <div style="opacity: 0.5; margin: 10px; position: relative; top: -45px;">
        <div style="float: right;">
            <div class="button" @click="load"><icon name="sync-alt"/></div>
            <span v-if="err">No log</span>
            <span v-if="stats"><timeago :datetime="stats.mtime" :auto-update="10"/></span>
        </div>
        <!--<b>{{taskcount}} Active Tasks</b>-->
    </div>
    <!-- <pre v-if="logs" v-highlightjs="logs"><code class="plaintext hljs"></code></pre> -->
    <editor v-if="logs" v-bind:value="logs" @init="editorInit" lang="text" theme="chrome"></editor>
</div>
</template>

<script>
import Vue from 'vue'

const lib = require('@/lib');

export default {
    props: {
        id: { type: String },
    },

    components: { 
        editor: require('vue2-ace-editor'),
    },

    watch: {
        id: function() {
            this.load();
        },
    },

    data() {
        return {
            stats: null,
            logs: null,
            err: null,

            //taskcount: null,
        }
    },
    destroyed() {
        //clearInterval(this.intv);
    },
    
    mounted() {
        this.load();
        //this.intv = setInterval(this.load, 1000*15); 
    },
    
    methods: {
        load: function() {
            if(!this.id) return;
            this.err = null;
            this.logs = null;
            this.stats = null;

            this.$http.get('rule/log/'+this.id).then(res=>{
                this.logs = res.data.logs;
                this.stats = res.data.stats;
            }).catch(res=>{
                //no log usually means the rule hasn't been executed yet
            });
        },

        editorInit(editor) {
            lib.editorInit(editor, err=>{
                editor.container.style.lineHeight = 1.25;
                editor.renderer.updateFontSize();
                editor.setReadOnly(true);  // false to make it editable

                editor.setAutoScrollEditorIntoView(true);
                editor.setOption("maxLines", 30);
                editor.setOption("minLines", 3);

                editor.setShowPrintMargin(true);
            });
        },
    }
}
</script>
<style scoped>
pre {
background-color: #f9f9f9;
font-size: 75%;
padding: 10px; 
max-height: 350px; 
overflow-y: auto;
}
</style>
