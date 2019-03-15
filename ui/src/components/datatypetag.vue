<template>
<div v-if="ready" class="dt" @click="click"
    v-b-popover.hover.top.d1000.html="'<small>'+_datatype.desc+'</small>'" :title="'<small><b>'+_datatype.name+'</b></small>'">
    <div class="dot" :style="{backgroundColor: color}">{{name}}</div
    ><div class="tags" v-if="tags" v-for="(tag, idx) in tags" :key="idx">
        <span v-if="tag && tag[0] == '!'" class="text-danger"><b-badge variant="danger">not</b-badge> {{tag.substring(1)}}</span>
        <span v-else>{{tag}}</span>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

let cache_datatypes_loading = null;
let cache_datatypes = null;

export default {
    props: {
        datatype: [String, Object],
        tags: { type: Array, }, 
        trimname: { type: Boolean, default: true, },
        clickable: { type: Boolean, default: true, },
    },
    
    data() {
        return {
            ready: false,

            _datatype: null,
            name: null, 
            color: null, 
        }
    },

    watch: {
        datatype: function() {
            this.init();
        }
    },
    
    computed: {
    },

    created() {
        if(cache_datatypes) return this.init(); //cache already loaded.
        if(cache_datatypes_loading) {
            //someone else is loading.. wait for it
            cache_datatypes_loading.then(()=>{
                this.init();
            });
        } else {
            //loading cache for the first time
            cache_datatypes_loading = this.$http.get("datatype", {params: {
                find: JSON.stringify(),
                limit: 500,
            }}).then(res=>{
                cache_datatypes = {};
                res.data.datatypes.forEach(datatype=>{
                    cache_datatypes[datatype._id] = datatype;
                });
                this.init();
            });
        }
    },

    methods: {
        init: function() {
            this.ready = false;

            if(!this.datatype) return;

            //user could pass datatype as string(id) or an object
            if(typeof this.datatype != "string") {
                this.post_init(this.datatype);
            } else {
                this.post_init(cache_datatypes[this.datatype]);
            }
        },

        post_init: function(datatype) {
            this._datatype = datatype;

            if(!this._datatype) return "unknown";
            if(!this._datatype.name) {
                console.error("name not set", this._datatype);
            }

            var tokens = this._datatype.name.split("/");
            if(this.trimname && tokens.length > 1) tokens = tokens.splice(1);
            this.name = tokens.join("/");

            //map datatype.name to 0 - 360
            if(!this._datatype) return {color: "#666"};
            if(!this._datatype.name) {
                console.error("name not set");
                console.error(this._datatype);
            }
            var hash = this._datatype.name.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
            var numhash = Math.abs(hash+120)%360;
            this.color = "hsl("+(numhash%360)+", 40%, 50%)"

            this.ready = true;
        },
        click() {
            if(this.clickable) {
                this.$router.push('/datatypes/'+this._datatype._id);
            } 
        },
    },
}
</script>

<style scoped>
.dt {
    display: inline-block;
    white-space: nowrap;
    cursor: pointer;
}
.dot {
    display: inline-block;
    padding: 0px 5px;
    margin: 0px;
    color: white;
}
.tags {
    display: inline-block;
    padding: 0px 5px;
    margin: 0px;
    background-color: #eee;
    color: #666;
}
.tags:not(:last-child) {
    border-right: 1px solid #ccc;
}
</style>
