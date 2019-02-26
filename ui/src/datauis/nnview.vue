<template>
<iframe src="/ui/nnview"></iframe>
</template>

<script>

import Vue from 'vue'

export default {
    props: ['task', 'subdir'],
    data()  {
        return {
        }
    },
    mounted() {
        var basepath = "";
        if(this.subdir) basepath += this.subdir+"/";
        window.config = {
            urlbase: Vue.config.amaretti_api+"/task/download/"+this.task._id+"/"+basepath,
            jwt: Vue.config.jwt
        };
    },
}
</script>

<style scoped>
iframe {
border:none;
width:100%;
height:100%;
}
</style>
