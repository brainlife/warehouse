<template>
<p class="citation" @click="show_bibtext">
    <span v-if="!citation" class="text-muted">Resolving {{doi}}.. <icon name="cog" spin/></span>
    <i v-html="citation"></i>
</p>

</template>

<script>
import Vue from 'vue'

export default {
    components: { },
    props: {
        doi: String,
        //accept: { type: String, default: "text/x-bibliography; style=harvard3" },
    },
    data() {
        return {
            citation: null
        }
    },
    mounted: function() {
        this.$http.get('pub/doi', {params: {
            //doi: "10.25663/bl.p.3",
            doi: this.doi,
            //accept: this.accept,
            accept: "text/x-bibliography; style=harvard3",
        }}).then(res=>{
            this.citation = res.data;
        }).catch(res=>{
            console.error(res);
            this.citation = res.toString() + " "+this.doi;
        });
    },

    methods: {
        show_bibtext() {
            let doi = this.doi||Vue.config.debug_doi;

            this.$http.get('pub/doi', {params: {
                //doi: "10.25663/bl.p.3",
                doi: this.doi,
                //accept: this.accept,
                accept: "application/x-bibtex",
            }}).then(res=>{
                prompt("bibtex", res.data);
            }).catch(res=>{
                this.$notify({type: "error", text: res.toString()})
            });           
        }
    },
}
</script>

<style scoped>
.citation {
cursor: pointer;
}
</style>
