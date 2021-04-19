<template>
<b-modal :no-close-on-backdrop='true' title="Download Datasets" ref="modal" size="lg">
    <div v-if="single_dataset_url">
        <b-row>
            <b-col>
                <p style="opacity: 0.8; min-height: 40px">Click the below button to download to your browser.</p>
                <b-button block variant="secondary" @click="direct_download">
                    <icon name="download"/> Download
                </b-button>
            </b-col>
            <b-col cols="7" v-if="query && query.find && query.find._id">
                <p style="opacity: 0.8; min-height: 40px;">Or, copy and paste the following command where you want to download this dataset
                    using <a href="https://brainlife.io/docs/cli/download/">Brainlife CLI</a>.</p>
                <pre class="code">bl dataset download --id {{query.find._id[0]}}</pre>
            </b-col>
        </b-row>
    </div>
    <div v-if="single_dataset_url" style="border-bottom: 1px solid #eee;">
        <br>
        <br>
        <center style="opacity: 0.7; font-weight: bold;">OR</center>
        <br>
    </div>

    <div class="subsection">
        <h5>BIDS Download</h5>
        <p class="text-muted">
            Copy and paste the following command to your terminal on a computer where you want to download selected datasets.
            This command will also create a directory (/bids) containing symbolic links to organize downloaded files into 
            a <a href="http://bids.neuroimaging.io" target="_bids">BIDS</a> derivative format (for BIDS compatible datatypes).
        </p>
        <div class="downscript-area">
            <textarea class="downscript" ref="downscript" readonly>{{downscript}}</textarea>
            <b-btn @click="copy_downscript" size="sm" variant="secondary" class="downscript-copy"><icon name="copy"/></b-btn>
        </div>

        <p class="text-muted">
            For Windows users, you will need to install <a href="https://www.windowscentral.com/how-install-bash-shell-command-line-windows-10" target="_blank">BASH shell</a> before running the command.
        </p>
    </div>

    <div slot="modal-footer">
        <b-button variant="primary" @click="close">Cancel</b-button>
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
            return JSON.stringify(json);
        },

        headers() {
            let headers = "-H 'Content-Type: application/json'";
            if(Vue.config.jwt) headers += " -H 'Authorization: Bearer "+Vue.config.jwt+"'";
            return headers;
        },

        single_dataset_url() {
            if(this.query && this.query.find && this.query.find._id && this.query.find._id.length == 1) {
                const dataset_id = this.query.find._id[0];
                let url = Vue.config.api+'/dataset/download/'+dataset_id;
                if(Vue.config.user) url += '?at='+Vue.config.jwt; //guest can download without jwt for published datasets
                return url;
            }
            return null; 
        },
        downscript() {
            return `curl ${this.headers} -d '${this.json}' -X POST "${Vue.config.api}/dataset/downscript?limit=0" | bash`
        }
    },

    mounted() {
        //console.log("listening downscript.open");
        this.$root.$on("downscript.open", query=>{
            this.query = query;
            this.$refs.modal.show()
        });
    },

    methods: {
        close() {
            this.$refs.modal.hide();
        },

        direct_download() {
            this.$notify({type: 'info', text: "Download will start soon.."});
            document.location = this.single_dataset_url;
            this.$refs.modal.hide();
        },

        copy_downscript() {
            var copyText = this.$refs.downscript;
            copyText.select();
            document.execCommand("copy");
            this.$notify({type: 'success', text: "Copied to your clipboard"});
        }
    },
} 
</script>
<style scoped>
.downscript {
font-family: monospace; 
background-color: #eee; 
white-space: pre-wrap; 
font-size: 68%;
padding: 10px;
overflow: auto;
margin-bottom: 10px;
width: 100%;
height: 180px;
border: none;
color: #000; /*only needed for firefox?*/
}

.downscript-area {
position: relative;
}
.downscript-copy {
position: absolute;
right: 20px;
top: 10px;
opacity: 0;
transition: opacity 0.3s;
}
.downscript-area:hover .downscript-copy {
opacity: 1;
}
.code {
padding: 10px;
background-color: #eee;
}
.subsection {
padding: 20px;
}
</style>
