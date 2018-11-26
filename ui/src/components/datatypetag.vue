<template>
<div v-if="ready" class="dt" @click="click"
    v-b-popover.hover.top.d500.html="'<small>'+_datatype.desc+'</small>'" :title="'<small><b>'+_datatype.name+'</b></small>'">
    <div class="dot" :style="{backgroundColor: color}">{{name}}</div
    ><div class="tags" v-for="tag in tags" :key="tag">
        <span v-if="tag[0] == '!'" class="text-danger"><b-badge variant="danger">not</b-badge> {{tag.substring(1)}}</span>
        <span v-else>{{tag}}</span>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

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

    mounted() {
        this.init();
    },

    methods: {
        init: function() {
            this.ready = false;

            if(!this.datatype) return;

            //user could pass datatype as string(id) or an object
            //TODO - I should cache datatype results?
            if(typeof this.datatype != "string") {
                this.post_init(this.datatype);
            } else {
                //if passed as string (id), dereference it from db
                this.$http.get("datatype", {params: {
                    find: JSON.stringify({
                        _id: this.datatype,
                    })
                }}).then(res=>{
                    this.post_init(res.body.datatypes[0]);
                });
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
            this.color = "hsl("+(numhash%360)+", 50%, 60%)"

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
