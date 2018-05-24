<template>
<div>
    <div style="opacity: 0.5; padding: 10px">
            <div class="button" @click="load"><icon name="sync-alt"/></div>
            <span v-if="err">Hasn't run yet</span>
            <span v-if="stats"><timeago :since="stats.mtime" :auto-update="10"/></span>
    </div>
    <pre v-if="logs" v-highlightjs>{{logs}}</pre>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        id: { type: String },
    },

    components: { },

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
            //intv: null,
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
            //console.log("loading rulelog");
            if(!this.id) return;
            this.err = null;
            this.logs = null;
            this.stats = null;
            this.$http.get('rule/log/'+this.id).then(res=>{
                this.logs = res.body.logs;
                this.stats = res.body.stats;
            }).catch(res=>{
                console.error(res);
                this.err = res.body.err;
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
margin-right: 30px; 
max-height: 350px; 
overflow-y: auto;
}
</style>
