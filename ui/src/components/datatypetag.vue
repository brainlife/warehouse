<template>
<div class="dt">
    <div class="dot" :style="{backgroundColor: color}">{{name}}</div
    ><div class="tags" v-for="tag in tags" :key="tag">
        <span v-if="tag[0] == '!'"><small class="text-danger">!NOT</small> {{tag.substring(1)}}</span>
        <span v-else>{{tag}}</span>
    </div>
</div>
</template>

<script>
export default {
    props: [ 'datatype', 'tags' ],
    computed: {
        name: function() {
            //trim fist token
            if(!this.datatype) return "unknown";
            if(!this.datatype.name) {
                console.error("name ot set");
                console.error(this.datatype);
            }
            var tokens = this.datatype.name.split("/");
            if(tokens.length > 1) tokens = tokens.splice(1);
            return tokens.join("/");
        },
        color: function() {
            //map datatype.name to 0 - 360
            if(!this.datatype) return {color: "#666"};
            if(!this.datatype.name) {
                console.error("name ot set");
                console.error(this.datatype);
            }
            var hash = this.datatype.name.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
            var numhash = Math.abs(hash+120)%360;
            return "hsl("+(numhash%360)+", 50%, 60%)"
        }
    },
    mounted() {
        //console.log("tags is et to ", this.tags);
    }
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
