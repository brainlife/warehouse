<template>
<b-modal title="Select Viewer" ref="modal" id="viewSelecter" size="lg" hide-footer>
    <b-card-group deck class="mb-1" style="padding-bottom: 10px;" v-for="(group, gidx) in views.chunk_inefficient(3)" :key="gidx">
        <b-card 
            v-for="(view,idx) in group" :key="idx"
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

//from stackoverflow somewhere
Object.defineProperty(Array.prototype, 'chunk_inefficient', {
    value: function(chunkSize) {
        var array=this;
        return [].concat.apply([],
            array.map(function(elem,i) {
                return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
            })
        );
    }
});

export default {
    props: [ 'datatype_name' ],
    components: { 
    },
    data () {
        return {
            config: Vue.config,
        }
    },
    mounted() {
        //I should display this at root
        document.body.appendChild(this.$refs.modal.$el);
    },

    computed: {
        views: function() {
            var views = [];

            //everyone gets raw view by default
            views.push({
                name: "Raw",
                desc: "Browse / download files via Brain-Life's File Browser",
                avatar: "http://www.brain-life.org/images/ui-logos/raw.png",
                ui: "raw",
            });

            //TODO - should load from the DB?
            switch(this.datatype_name) {
            case "neuro/life_output":
                views.push({
                    name: "Life Tract View",
                    desc: "Show non-0 weight tracts with varying colors based on weight.",
                    avatar: "http://www.brain-life.org/images/ui-logos/ui-lifeview.png",
                    ui: "lifeview",
                });
                views.push({
                    name: "Life Stats",
                    desc: "Display basic statistics from the LiFE output.",
                    avatar: "http://www.brain-life.org/images/ui-logos/lifestat.png",
                    ui: "neuro.life_output",
                });
                break;
            case "neuro/dtiinit":
                views.push({
                    name: "dtiInit Output",
                    desc: "to-be-written",
                    avatar: "http://www.brain-life.org/images/ui-logos/dtiinit.png",
                    ui: "neuro.dtiinit",
                });
                break;
            case "neuro/wmc":
                views.push({
                    name: "WMC Tract View",
                    desc: "to-be-written.",
                    avatar: "http://www.brain-life.org/images/ui-logos/tractview.png",
                    ui: "neuro.wmc",
                });
                break;
            case "generic/images":
                views.push({
                    name: "Image Tile",
                    desc: "to-be-written.",
                    avatar: "http://www.brain-life.org/images/ui-logos/images.png",
                    ui: "generic.images",
                });
                break;
            case "neuro/anat/t1w":
            case "neuro/anat/t2w":
                views.push({
                    name: "Volume Viewer",
                    desc: "to-be-written.",
                    avatar: "http://www.brain-life.org/images/ui-logos/ui-volumeviewer.png",
                    ui: "neuro.anat.t1w",
                });
            case "neuro/dwi":
                views.push({
                    name: "FSLView",
                    desc: "to-be-written.",
                    avatar: "http://www.brain-life.org/images/ui-logos/fslview.png",
                    ui: "fslview",
                    docker: true,
                });
                views.push({
                    name: "mrView",
                    desc: "to-be-written.",
                    avatar: "http://www.brain-life.org/images/ui-logos/mrview.png",
                    ui: "mrview",
                    docker: true,
                });
                views.push({
                    name: "fiberNavigator",
                    desc: "to-be-written.",
                    avatar: "http://www.brain-life.org/images/ui-logos/fibernavigator.png",
                    ui: "fibernavigator",
                    docker: true,
                });
            case "neuro/freesurfer":
                views.push({
                    name: "FreeView",
                    desc: "to-be-written.",
                    avatar: "http://www.brain-life.org/images/ui-logos/freeview.png",
                    ui: "freeview",
                    docker: true,
                });
                break;
            }

            return views;
        },
    },

	methods: {
        select: function(v) {
            console.dir(v);
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
