<template>
<div class="citation">
    <p v-if="!citation" class="text-muted">Loading.. <icon name="cog" spin/></p>
    <pre v-if="accept == 'application/x-bibtex'">{{citation}}</pre>
    <i v-else>{{citation}}</i>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    components: { },
    props: {
        doi: String,
        accept: { type: String, default: "text/x-bibliography; style=harvard3" },
    },
    data() {
        return {
            citation: null
        }
    },
    mounted: function() {
        /*
        if(Vue.config.debug) {
            console.log("running in debug mode - using test doi");
            this.doi = "10.25663/bl.p.3"; //for test
        }
        */

        this.$http.get('pub/doi', {params: {
            doi: this.doi,
            accept: this.accept,

        }}).then(res=>{
            this.citation = res.body;
        }).catch(res=>{
            console.error(res);
            this.citation = res.status;
        });
    },
    methods: {
    },
}
</script>

<style scoped>
.citation {
}
</style>
