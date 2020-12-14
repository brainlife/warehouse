<template>
<div v-if="ready" class="dt" :class="{'dt-clickable': clickable}" @click="click">
    <icon v-if="_datatype.groupAnalysis" name="dot-circle" :style="{color}" scale="1" class="dot"/>
    <icon v-else name="circle" :style="{color}" scale="1" class="dot"/>
    <!--<span class="dot" :style="{backgroundColor: color}"></span>--> {{name}}
    <div class="tags" v-if="tags" v-for="(tag, idx) in tags" :key="idx">
        <span v-if="tag && tag[0] == '!'" class="text-danger"><b-badge variant="danger">not</b-badge> {{tag.substring(1)}}</span>
        <span v-else>{{tag}}</span>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import datatypecache from '@/mixins/datatypecache'

export default {
    mixins: [ datatypecache ],
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
            this.init_id_or_object(this.datatype);
        }
    },
    
    mounted() {
        if(!this.datatype) return;
        this.init_id_or_object(this.datatype);
    },

    methods: {
        init_id_or_object(datatype) {
            if(typeof datatype == "string") {
                this.datatypecache(datatype, (err, datatype_obj)=>{
                    if(err) alert(err);
                    this.init_object(datatype_obj);
                });
            } else {
                //assume the full datatype object is fed..
                this.init_object(datatype);
            }
        },

        init_object(datatype) {
            this._datatype = datatype;

            if(!this._datatype) return "unknown";
            if(!this._datatype.desc) {
                console.error("desc not set", this._datatype);
            }
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
            this.color = "hsl("+(numhash%360)+", 50%, 55%)"

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
    display: inline;
}
.dt-clickable {
    cursor: pointer;
}
.dt-clickable:hover {
    color: #2693ff;
}
.dot {
    display: inline-block;
    color: white;
    height: 0.8em;
    width: 0.8em;
    border-radius: 50%;
}
.tags {
    display: inline;
    padding: 0px 5px;
    margin: 0px;
    background-color: #eee;
    color: #666;
}
.tags:not(:last-child) {
    border-right: 1px solid #0001;
}
</style>
