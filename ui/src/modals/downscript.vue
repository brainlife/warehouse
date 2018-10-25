<template>
<b-modal :no-close-on-backdrop='true' title="Download Datasets" ref="modal" size="lg">
    <p>Please copy and paste the following command on your bash terminal to download your datasets.</p>
    <pre class="code">curl {{headers}} -d '{{json}}' -X POST {{config.api}}/dataset/downscript | bash</pre>

    <p class="text-muted">
        The above command will download selected datasets inside sub directories for each subject. 
        The command will also create <a href="http://bids.neuroimaging.io">BIDS</a> a directory (/bids) containing symlinks to organize files according to BIDS derivative standard.
    </p>

    <!--
    <p class="text-muted">
        For Windows users, please launch <b>bash</b> terminal from the command prompt.
    </p>
    -->

    <div slot="modal-footer">
        <b-button variant="primary" @click="close">Close</b-button>
    </div>
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
        },
        headers() {
            let headers = "-H 'Content-Type: application/json'";
            if(Vue.config.jwt) headers += " -H 'Authorization: Bearer "+Vue.config.jwt+"'";
            return headers;
        },
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
margin-bottom: 10px;
}
</style>
