<template>
<b-modal :no-close-on-backdrop='true' title="Select Viewer" ref="modal" id="viewSelecter" size="lg" hide-footer>
    <div v-if="opt">
        <b-row>
            <b-col cols="4" v-for="(view, idx) in opt.datatype.uis" :key="idx" style="margin-bottom: 20px;">
                <b-card 
                    :header-bg-variant="view.docker?'success':'dark'" 
                    header-text-variant="white" 
                    :header="view.name" 
                    @click="select(view)" 
                    class="card" 
                    style="max-width: 25rem;"
                    :img-src="view.avatar"> 
                    <p class="card-text">{{view.desc}}</p>
                </b-card>
            </b-col>
        </b-row>
        <div style="opacity: 0.7">
            <a :href="'mailto:brlife@iu.edu?subject=Requesting new visualization tool for '+opt.datatype.name+' datatype&body=Hello. Please add ??? UI to handle this datatype.'" target="_blank" style="float: right;">Suggest a new visualization tool for this datatype</a>
            <h4>
                <b-badge variant="dark">Web UI</b-badge>
                <b-badge variant="success">VNC</b-badge>
            </h4>
        </div>
    </div>
</b-modal>
</template>

<script>

import Vue from 'vue'

export default {
    data () {
        return {
            opt: null,
            config: Vue.config,

        } 
    },

    mounted() {
        this.$root.$on("viewselecter.open", opt=>{
            this.opt = opt;
            this.$refs.modal.show();
        });
    },

    methods: {
        select(view) {
            this.$refs.modal.hide(); 

            let path = "/view/"
            if(view.docker) path = "/novnc/";

            //I will deprecate these in favor of ?config= parameters (TODO all datauis needs to switch to use config)
            path += this.opt.task._id+'/'+view.ui+'/'+btoa(this.opt.datatype.name);
            if(this.opt.subdir) path += '/'+this.opt.subdir;

            //uiconfig is the new kid in the block
            let uiconfig = {
                task_id: this.opt.task._id,
                type: view.ui,
                datatype: this.opt.datatype.name,
                subdir: this.opt.subdir,
                files: this.opt.files,
            }
            path += "#"+btoa(JSON.stringify(uiconfig));
            //console.log("opening", path, this.opt);
            window.open(path, this.opt.task._id+"."+this.opt.subdir+"."+view.ui, "width=1200,height=801,menubar=no"); //chrome opens window with 799 pixels if I specify 800.. why!?
        }
    }
}

</script>
<style scoped>
.card {
transition: box-shadow 0.5s;
}
.card:hover {
cursor: pointer;
box-shadow: 0px 0px 8px #666;
}
img.card-img {
height: 170px;
}
</style>
