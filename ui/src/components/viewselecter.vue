<template>
<b-modal title="Select Viewer" ref="modal" id="viewSelecter" size="lg" hide-footer>
    <b-card-group deck class="mb-1" style="padding-bottom: 10px;" v-for="(group, gidx) in views.chunk_inefficient(3)" :key="gidx">
        <b-card 
            v-for="(view, idx) in group" :key="idx"
            :header-bg-variant="view.docker?'success':'dark'" 
            header-text-variant="white" 
            :header="view.name" 
            @click="select(view)" 
            class="card" 
            style="max-width: 25rem;"
            :img-src="view.avatar"> 
            <p class="card-text">{{view.desc}}</p>
        </b-card>
    </b-card-group>
    <h4>
        <b-badge variant="dark">Web UI</b-badge>
        <b-badge variant="success">Docker</b-badge>
    </h4>
</b-modal>
</template>
<script>
import Vue from 'vue'

export default {
    props: [ 'datatype_name', 'datatype_names' ],
    components: { 
    },
    data () {
        return {
            config: Vue.config,
            view_catalog: {}, 
        } 
    },
    mounted() {
        //I should display this at root
        document.body.appendChild(this.$refs.modal.$el);

        //TODO - move to db
        var catalog = [
        {
            ui: "raw",
            name: "File Viewer",
            desc: "Browse / download files via Brain-Life's File Browser",
            avatar: "http://www.brain-life.org/images/ui-logos/raw.png",
            datatypes: [], //supported by all
        },
        {   
            ui: "lifeview",
            name: "Life Tract View",
            desc: "Show non-0 weight tracts with varying colors based on weight.",
            avatar: "http://www.brain-life.org/images/ui-logos/ui-lifeview.png",
            datatypes: [ "neuro/life" ],
        },
        {
            ui: "lifestats",
            name: "Life Stats",
            desc: "Display basic statistics from the LiFE output.",
            avatar: "http://www.brain-life.org/images/ui-logos/lifestat.png",
            datatypes: [ "neuro/life" ],
        },
        {
            ui: "t1pdd",
            name: "dtiInit T1PDD",
            desc: "Show T1 background and the principal diffusion directions as an RGB overlay",
            avatar: "http://www.brain-life.org/images/ui-logos/dtiinit.png",
            datatypes: [ "neuro/dtiinit" ],
        },
        {
            ui: "tractview",
            name: "WMC Tract View",
            desc: "to-be-written.",
            avatar: "http://www.brain-life.org/images/ui-logos/tractview.png",
            datatypes: [ "neuro/wmc" ],
        },
        {
            ui: "images",
            name: "Image Tile",
            desc: "to-be-written.",
            avatar: "http://www.brain-life.org/images/ui-logos/images.png",
            datatypes: ["generic/images"],
        },
        {
            ui: "volumeviewer",
            name: "Volume Viewer",
            desc: "to-be-written.",
            avatar: "http://www.brain-life.org/images/ui-logos/ui-volumeviewer.png",
            datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w" ],
        },
        {
            ui: "fslview",
            name: "FSLView",
            desc: "to-be-written.",
            avatar: "http://www.brain-life.org/images/ui-logos/fslview.png",
            docker: true,
            datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi" ],
        },
        {
            ui: "mrview",
            name: "mrView",
            desc: "to-be-written.",
            avatar: "http://www.brain-life.org/images/ui-logos/mrview.png",
            docker: true,
            datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi" ],
        },
        {
            ui: "fibernavigator",
            name: "fiberNavigator",
            desc: "to-be-written.",
            avatar: "http://www.brain-life.org/images/ui-logos/fibernavigator.png",
            docker: true,
            datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi" ],
        },
        {
            ui: "freeview",
            name: "FreeView",
            desc: "to-be-written.",
            avatar: "http://www.brain-life.org/images/ui-logos/freeview.png",
            docker: true,
            datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/freesurfer" ],
        },

        {
            ui: "conneval",
            name: "Connectome Evaluator",
            desc: "Display results from connectome evaluator showing the quality of your connectome data determined by LiFE",
            avatar: "http://www.brain-life.org/images/ui-logos/conneval.png",
            datatypes: [ "neuro/conneval" ],
        },

        ];
        
        //organize into object so that I can lookup via ui name
        catalog.forEach(view=>{
            this.view_catalog[view.ui] = view;
        });
    },

    computed: {
        views: function() {
            if(this.datatype_name) return this.list_views_single();
            if(this.datatype_names) return this.list_views_multi();
            return [];
        },
    },

	methods: {
        list_views_single: function() {
            var views = [];
            views.push(this.view_catalog["raw"]); //everyone gets this by default

            //find views that support specified datatype
            for(var ui in this.view_catalog) {
                var view = this.view_catalog[ui];
                if(~view.datatypes.indexOf(this.datatype_name)) views.push(view);
            }

            return views;
        },

        list_views_multi: function() {
            var views = [];
            views.push(this.view_catalog["raw"]); //we can always use raw view

            var sorted_names = this.datatype_names.sort();

            //if all t1, use freeview (and others?)
            var all_t1 = true;
            sorted_names.forEach(name=>{
                if(name != "neuro/anat/t1w") all_t1 = false;
            });
            if(all_t1) views.push(this.view_catalog["freeview"]);

            //dtiinit and wmc can be combined to show a single tractview
            if(JSON.stringify(sorted_names) == JSON.stringify(["neuro/dtiinit", "neuro/wmc"])) {
                views.push(this.view_catalog["tractview"]);
            }

            return views;
        },

        select: function(v) {
            this.$refs.modal.hide(); 
            this.$emit('select', v);
        },
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
