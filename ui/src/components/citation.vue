<template>
<div class="citation">
    <p v-if="!citation">Loading..</p>
    {{citation}}
</div>
</template>

<script>
import Vue from 'vue'

export default {
    components: { },
    props: {
        doi: String,
    },
    data() {
        return {
            citation: null
        }
    },
    mounted: function() {
        this.$http.get('pub/doi', {params: {

            doi: this.doi,
            //doi: "10.25663/bl.p.3", //for test
            accept: "text/x-bibliography; style=harvard3",

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
