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
            return this.datatype.name.split("/").splice(1).join("/");
        }
    },
    data() {
        //map datatype.name to 0 - 360
        var hash = hashCode(this.datatype.name);
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
    line-height: 100%;
}
.dot {
    display: inline-block;
    padding: 4px;
    margin: 0px;
    color: white;
}
.tags {
    display: inline-block;
    padding: 4px;
    margin: 0px;
    background-color: #eee;
    color: #666;
}
.tags:not(:last-child) {
    border-right: 1px solid #ccc;
}
</style>
