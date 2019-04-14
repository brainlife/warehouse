<template>
<b-modal :no-close-on-backdrop='true' title="Download Datasets" ref="modal" size="lg">
     <div v-if="single_dataset_url">
        <p>
            <b-button block variant="secondary" @click="direct_download">
                Download to your computer
            </b-button>
        </p>
        <center style="opacity: 0.7; font-weight: bold;">or</center>
        <br>
    </div>
 

    <div style="border-left: 5px solid #eee; padding-left: 10px;">
        <h5>BIDS</h5>
        <p>Copy and paste the following command on your bash terminal where you want to download the datasets.</p>
        <div class="downscript-area">
            <textarea class="downscript" ref="downscript" readonly>{{downscript}}</textarea>
            <b-btn @click="copy_downscript" size="sm" variant="secondary" class="downscript-copy"><icon name="copy"/></b-btn>
        </div>

        <p class="text-muted">
            The above command will download selected datasets inside sub directories for each subject. 
            The command will also create <a href="http://bids.neuroimaging.io" target="_bids">BIDS</a> a directory (/bids) containing symbolic links to organize downloaded files into a BIDS derivative format - for BIDS compatible datatypes.
        </p>

        <p class="text-muted">
            For Windows users, please install <a href="https://itsfoss.com/install-bash-on-windows/">bash shell</a> before running the above command.
        </p>
    </div>

    <div style="border-left: 5px solid #eee; padding-left: 10px;" v-if="query && query.find && query.find._id">
        <h5>CLI</h5>
        <p class="text-muted">
            You can also download this dataset via <a href="https://brainlife.io/docs/cli/download/">Brainlife CLI</a>
            <pre class="code">bl dataset download --id {{query.find._id[0]}}</pre>
        </p>
    </div>

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
            return JSON.stringify(json);
        },

        headers() {
            let headers = "-H 'Content-Type: application/json'";
            if(Vue.config.jwt) headers += " -H 'Authorization: Bearer "+Vue.config.jwt+"'";
            return headers;
        },

        single_dataset_url() {
            if(this.query && this.query.find && this.query.find._id && this.query.find._id.length == 1) {
                let dataset_id = this.query.find._id[0];
                var url = Vue.config.api+'/dataset/download/'+dataset_id;
                if(Vue.config.user) url += '?at='+Vue.config.jwt; //guest can download without jwt for published datasets
                return url;
            }
            return null; 
        },
        downscript() {
            return `curl ${this.headers} -d '${this.json}' -X POST ${Vue.config.api}/dataset/downscript | bash`
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
font-size: 65%;
padding: 10px;
overflow: auto;
margin-bottom: 10px;
width: 100%;
height: 180px;
border: none;
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
</style>
