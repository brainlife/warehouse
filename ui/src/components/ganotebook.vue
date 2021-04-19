<template>
<div>
    <div ref="host" style="background-color: white;"/>
    <small v-if="error">{{error}}</small>
</div>
</template>
<script>
export default {
    props: {
        error: null,
        ga: {type: Object},
    },
    mounted() {
        this.$http.get("secondary/"+this.ga.sectask_id+"/html/index.html").then(res=>{
            const shadow = this.$refs.host.attachShadow({mode: 'open'});
            shadow.innerHTML = res.data;
        }).catch(err=>{
            console.error(err);
            this.error = "Failed to load notebook";
        });
    },
}
</script>
