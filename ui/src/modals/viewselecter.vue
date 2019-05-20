<template>
<b-modal :no-close-on-backdrop='true' title="Select Viewer" ref="modal" id="viewSelecter" size="lg" hide-footer>
    <div v-if="datatype">
        <b-row>
            <b-col cols="4" v-for="(view, idx) in datatype.uis" :key="idx" style="margin-bottom: 20px;">
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
            <a :href="'mailto:brlife@iu.edu?subject=Requesting new visualization tool for '+datatype.name+' datatype&body=Hello. Please add ??? UI to handle this datatype.'" target="_blank" style="float: right;">Suggest a new visualization tool for this datatype</a>
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
            //set by viewselecter.open
            datatype: null,
            task: null, 
            subdir: null,
            config: Vue.config,
            //view_catalog: {}, 
        } 
    },
    mounted() {
        this.$root.$on("viewselecter.open", opt=>{
            this.datatype = opt.datatype;
            this.task = opt.task;
            this.subdir = opt.subdir;
            this.$refs.modal.show();
        });
    },

	methods: {
        select(view) {
            this.$refs.modal.hide(); 
            let path = "/view/"
            if(view.docker) path = "/novnc/";
            path += this.task._id+'/'+view.ui+'/'+btoa(this.datatype.name);
            if(this.subdir) path += '/'+this.subdir;
            window.open(path, "", "width=1200,height=800,resizable=no,menubar=no"); 
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
</style>
