<template>
<b-modal :no-close-on-backdrop='true' title="Select Viewer" ref="modal" id="viewSelecter" size="lg" hide-footer>
    {{datatype_name}}
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
    <div style="opacity: 0.7">
        <a :href="'mailto:brlife@iu.edu?subject=Requesting new visualization tool for '+datatype_name+' datatype'" target="_blank" style="float: right;">Suggest a new visualization tool</a>
        <h4>
            <b-badge variant="dark">Web UI</b-badge>
            <b-badge variant="success">Docker</b-badge>
        </h4>
    </div>
</b-modal>
</template>
<script>
import Vue from 'vue'

//from stackoverflow somewhere
if(![].chunk_inefficient) {
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
}

export default {
    data () {
        return {
            //set by viewselecter.open
            datatype_name: null,
            datatype_names: null,

            task: null, 
            task_cb: null, 
            subdir: null,

            config: Vue.config,
            view_catalog: {}, 
        } 
    },
    mounted() {
        this.$root.$on("viewselecter.open", (opt)=>{
            this.datatype_name = opt.datatype_name;
            this.datatype_names = opt.datatype_names;
            this.task = opt.task;
            this.task_cb = opt.task_cb;
            this.subdir = opt.subdir;
            this.$refs.modal.show();
        });

        //TODO - move to db (part of datatype?)
        var catalog = [
            {
                ui: "raw",
                name: "File Viewer",
                desc: "Browse / download files via Brain-Life's File Browser",
                avatar: "https://brainlife.io/images/ui-logos/raw.png",
                datatypes: [], //supported by all
            },
            {   
                ui: "lifeview",
                name: "Life Tract View",
                desc: "Show non-0 weight tracts with varying colors based on weight.",
                avatar: "https://brainlife.io/images/ui-logos/ui-lifeview.png",
                datatypes: [ "neuro/life" ],
            },

            {
                ui: "lifestats",
                name: "Life Stats",
                desc: "Display basic statistics from the LiFE output.",
                avatar: "https://brainlife.io/images/ui-logos/lifestat.png",
                datatypes: [ "neuro/life" ],
            },

            {
                ui: "t1pdd",
                name: "dtiInit T1PDD",
                desc: "Show T1 background and the principal diffusion directions as an RGB overlay",
                avatar: "https://brainlife.io/images/ui-logos/dtiinit.png",
                datatypes: [ "neuro/dtiinit" ],
            },
            {
                ui: "tractview",
                name: "WMC Tract View",
                desc: "Web-based visualization tools for white matter tracts.",
                avatar: "https://brainlife.io/images/ui-logos/tractview.png",
                datatypes: [ "neuro/wmc" ],
            },
            {
                ui: "images",
                name: "Image Tile",
                desc: "Generic image viewer",
                avatar: "https://brainlife.io/images/ui-logos/images.png",
                datatypes: ["generic/images"],
            },
            {
                ui: "volumeviewer",
                name: "Volume Viewer",
                desc: "Web-based visualization tools for neurological data.",
                avatar: "https://brainlife.io/images/ui-logos/ui-volumeviewer.png",
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/mask" ],
            },
            {
                ui: "fslview",
                name: "FSLView",
                desc: "An old 2d/3d brain volume viewer. Replaced by fsleyes",
                avatar: "https://brainlife.io/images/ui-logos/fslview.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/func/task" ],
            },
            {
                ui: "fsleyes",
                name: "FSLeyes",
                desc: "A 2d/3d brain volume viewer.",
                avatar: "https://brainlife.io/images/ui-logos/fsleyes.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/func/task" ],
            },
            {
                ui: "mrview",
                name: "mrView",
                desc: "The MRtrix image viewer.",
                avatar: "https://brainlife.io/images/ui-logos/mrview.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/func/task" ],
            },
            {
                ui: "mricrogl",
                name: "MRIcroGL",
                desc: "View 2D slices and renderings of your brain imaging data. It allows you to draw regions of interest which can aid lesion mapping and fMRI analysis.",
                avatar: "https://brainlife.io/images/ui-logos/mricrogl.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/func/task" ],
            },
            {
                ui: "fibernavigator",
                name: "fiberNavigator",
                desc: "A tool designed for a fast and versatile visualization of streamline datasets.",
                avatar: "https://brainlife.io/images/ui-logos/fibernavigator.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/func/task" ],
            },
            {
                ui: "freeview-gpu",
                name: "FreeView",
                desc: "A freesurfer program used to view and work with structural, anatomical scans.",
                avatar: "https://brainlife.io/images/ui-logos/freeview.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/freesurfer" ],
            },

            {
                ui: "conneval",
                name: "Connectome Evaluator",
                desc: "Display results from connectome evaluator showing the quality of your connectome data determined by LiFE",
                avatar: "https://brainlife.io/images/ui-logos/conneval.png",
                datatypes: [ "neuro/conneval" ],
            },

            /*
            {
                ui: "conn",
                name: "CONN",
                desc: "A Matlab-based cross-platform software for the computation, display, and analysis of functional connectivity in fMRI (fcMRI).",
                avatar: "https://brainlife.io/images/ui-logos/conn.png",
                docker: true,
                datatypes: [ "raw" ], 
            },
            */

            {
                ui: "surfaces",
                name: "3D Surfaces",
                desc: "Display 3D Surfaces (vtk) using THREE.js(WebGL)",
                avatar: "https://brainlife.io/images/ui-logos/surfaces.png",
                datatypes: [ "neuro/3Dsurfaces" ], 
            },

        ];
        
        //organize into object so that I can lookup via ui name
        catalog.forEach(view=>{
            this.view_catalog[view.ui] = view;
        });
    },

    computed: {
        views() {
            if(this.datatype_name) return this.list_views_single();
            if(this.datatype_names) return this.list_views_multi();
            return [];
        }
    },

	methods: {
        list_views_single() {
            var views = [];
            views.push(this.view_catalog["raw"]); //everyone gets this by default

            //find views that support specified datatype
            for(var ui in this.view_catalog) {
                var view = this.view_catalog[ui];
                if(~view.datatypes.indexOf(this.datatype_name)) {
                    views.push(view);
                }
            }

            return views;
        },

        list_views_multi() {
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
            if(JSON.stringify(sorted_names) == JSON.stringify(["neuro/dwi/recon", "neuro/wmc"])) {
                views.push(this.view_catalog["tractview"]);
            }
            if(JSON.stringify(sorted_names) == JSON.stringify(["neuro/wmc", "raw"])) {
                views.push(this.view_catalog["tractview"]);
            }

            return views;
        },

        select(view) {
            this.$refs.modal.hide(); 
            if(this.task) this.openview(view, this.task, this.subdir);
            if(this.task_cb) this.task_cb(task=>{
                this.openview(view, task, this.subdir);
            });
        },

        openview(view, task, subdir) {
            //console.log("openview", view, task);
            let path;
            if(view.docker) {
                path = "/novnc/"+task.instance_id+"/"+task._id+'/'+view.ui;
            } else {
                path = "/view/"+task.instance_id+"/"+task._id+'/'+view.ui;
            }
            if(subdir) path += '/'+subdir;
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
