<template>
<div class="dt">
    <div class="dot" :style="{backgroundColor: color}">{{name}}</div><div class="tags" v-for="tag in tags" :key="tag">{{tag}}</div>
</div>
</template>

<script>
var hashCode = function(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

export default {
    components: { },
    props: [ 'datatype', 'tags' ],
    computed: {
        name: function() {
            //trim fist token
            if(!this.datatype) return "unknown";
            var tokens = this.datatype.name.split("/");
            if(tokens.length > 1) tokens = tokens.splice(1);
            return tokens.join("/");
        }
    },
    data() {
        //map datatype.name to 0 - 360
        if(!this.datatype) return {color: "gray"};
        var hash = Math.abs(hashCode(this.datatype.name)+120)%360;
        //console.log(this.datatype.name, hash);
        return {
            color: "hsl("+(hash%360)+", 50%, 60%)"
        }
    },
    mounted() {
        //console.log("tags is et to ", this.tags);
    }
}
</script>

<style scope>
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
