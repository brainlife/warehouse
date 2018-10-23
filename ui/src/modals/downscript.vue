<template>
<b-modal :no-close-on-backdrop='true' title="Download Selected Datasets" ref="modal" size="lg">
    <p class="text-muted">Please copy and paste the following command on your bash terminal to download your datasets.</p>
    <p class="code">curl -H "Authorization: Bearer {{config.jwt}}" -H "Content-Type: application/json" -d '{{json}}' -X POST {{config.api}}/dataset/downscript | bash</p>
    <div slot="modal-footer">
        <b-button variant="primary" @click="close">Close</b-button>
    </div>
    <p class="text-muted">
        The above command will download selected dataets to your local directory with sub directories for each subject. 
        The command will also creates <pre>bids</pre> directory containing symlinks to files in <a href="http://bids.neuroimaging.io/">BIDS derivative structure</a></p>
</b-modal>
</template>

<script>
import Vue from 'vue'

export default {
    components: { },

    data() {
        return {
            query: null,
            config: Vue.config,
        }
    },

    destroyed() {
        this.$root.$off("downscript.open");
    },

    computed: {
        json() {
            if(!this.query) return null;
            let json = {find: this.query.find};
            //if(this.query.find) json.find = JSON.stringify(this.query.find);
            return JSON.stringify(json);
        }
    },

    mounted() {
        console.log("listening downscript.open");
        this.$root.$on("downscript.open", query=>{
            this.query = query;
            this.$refs.modal.show()
        });
    },

    methods: {
        close: function() {
            this.$refs.modal.hide();
        },
    },
} 
</script>
<style scoped>
.code {
font-family: monospace; 
background-color: #eee; 
white-space: pre-wrap; 
font-size: 70%;
padding: 10px;
overflow: auto;
}
</style>
