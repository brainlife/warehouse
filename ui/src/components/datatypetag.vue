<template>
<div v-if="ready" class="dt" :title="_datatype.desc">
    <div class="dot" :style="{backgroundColor: color}">{{name}}</div
    ><div class="tags" v-for="tag in tags" :key="tag">
        <span v-if="tag[0] == '!'"><small class="text-danger">!NOT</small> {{tag.substring(1)}}</span>
        <span v-else>{{tag}}</span>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

export default {
    props: [ 'datatype', 'tags' ],
    data() {
        return {
            ready: false,
            _datatype: null,
        }
    },

    watch: {
        datatype: function() {
            console.log("watch dataatype.................");
            this.load();
        }
    },
    
    computed: {

        name: function() {
            //trim fist token
            if(!this._datatype) return "unknown";
            if(!this._datatype.name) {
                console.error("name not set", this._datatype);
            }
            var tokens = this._datatype.name.split("/");
            if(tokens.length > 1) tokens = tokens.splice(1);
            return tokens.join("/");
        },

        color: function() {
            //map datatype.name to 0 - 360
            if(!this._datatype) return {color: "#666"};
            if(!this._datatype.name) {
                console.error("name not set");
                console.error(this._datatype);
            }
            var hash = this._datatype.name.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
            var numhash = Math.abs(hash+120)%360;
            return "hsl("+(numhash%360)+", 50%, 60%)"
        }
    },

    mounted() {
        this.load();
    },

    methods: {
        load: function() {
            if(this.datatype) {
                //user could pass datatype as string(id) or an object
                //TODO - I should cache datatype results?
                if(typeof this.datatype == "string") {
                    //if passed as string, load it from db
                    this.$http.get("datatype", {params: {
                        find: JSON.stringify({
                            _id: this.datatype,
                        })
                    }}).then(res=>{
                        this._datatype = res.body.datatypes[0];
                        this.ready = true;
                    });
                } else {
                    this._datatype = this.datatype;
                    this.ready = true;
                }
            }
        },
    },
}
</script>

<style scoped>
.dt {
    display: inline-block;
    white-space: nowrap;
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
