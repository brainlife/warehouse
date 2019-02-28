<template>
<iframe v-if="ready" src="/ui/tractview"></iframe>
</template>

<script>

import Vue from 'vue'

export default {
    props: ['task', 'subdir'],
    data()  {
        return {
            ready: false,
        }
    },
    mounted() {
        var basepath = "";
        if(this.subdir) basepath += this.subdir+"/";
        let api = Vue.config.amaretti_api+"/task/download/"+this.task._id;
        this.$http.get(api+"/"+basepath+"tracts/tracts.json")
        .then(res=>{
            var tracts = res.data;
            if(!Array.isArray(tracts)) tracts = [tracts]; //make it an array if it's not.. some app just output a single tract without wrapped in []
            tracts.forEach(tract=>{
                tract.url = api+"/"+basepath+"tracts/"+tract.filename;
            });

            //TODO - I should also try loading surfaces/surfaces.json soon
        
            window.config = {tracts};
            this.ready = true;
        }).catch(err=>{
            console.error(err);
            console.error("failed to load tracts.json - probably output from old afq. using afq.tract.json template");
            fetch("https://brainlife.io/ui/tractview/afq.tracts.json")
                .then(res=>res.json())
                .then(tracts=>{
                tracts.forEach(tract=>{
                    tract.url = api+"/"+basepath+"tracts/"+tract.filename;
                });
                window.config = {tracts};
                this.ready = true;
            });
        });
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
