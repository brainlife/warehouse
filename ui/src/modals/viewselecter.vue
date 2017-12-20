<template>
<b-modal title="Select Viewer" ref="modal" id="viewSelecter" size="lg" hide-footer>
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
    <h4>
        <b-badge variant="dark">Web UI</b-badge>
        <b-badge variant="success">Docker</b-badge>
    </h4>
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
    //props: [ 'datatype_name', 'datatype_names' ],
    data () {
        return {
            //set by viewselecter.option
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
        //document.body.appendChild(this.$refs.modal.$el); //move to root
        this.$root.$on("viewselecter.option", (opt)=>{
            this.datatype_name = opt.datatype_name;
            this.datatype_names = opt.datatype_names;
            this.task = opt.task;
            this.task_cb = opt.task_cb;
            this.subdir = opt.subdir;
        });

        //TODO - move to db (part of datatype?)
        var catalog = [
            {
                ui: "raw",
                name: "File Viewer",
                desc: "Browse / download files via Brain-Life's File Browser",
                avatar: "http://www.brainlife.io/images/ui-logos/raw.png",
                datatypes: [], //supported by all
            },
            {   
                ui: "lifeview",
                name: "Life Tract View",
                desc: "Show non-0 weight tracts with varying colors based on weight.",
                avatar: "http://www.brainlife.io/images/ui-logos/ui-lifeview.png",
                datatypes: [ "neuro/life" ],
            },
            {
                ui: "lifestats",
                name: "Life Stats",
                desc: "Display basic statistics from the LiFE output.",
                avatar: "http://www.brainlife.io/images/ui-logos/lifestat.png",
                datatypes: [ "neuro/life" ],
            },
            {
                ui: "t1pdd",
                name: "dtiInit T1PDD",
                desc: "Show T1 background and the principal diffusion directions as an RGB overlay",
                avatar: "http://www.brainlife.io/images/ui-logos/dtiinit.png",
                datatypes: [ "neuro/dtiinit" ],
            },
            {
                ui: "tractview",
                name: "WMC Tract View",
                desc: "to-be-written.",
                avatar: "http://www.brainlife.io/images/ui-logos/tractview.png",
                datatypes: [ "neuro/wmc" ],
            },
            {
                ui: "images",
                name: "Image Tile",
                desc: "to-be-written.",
                avatar: "http://www.brainlife.io/images/ui-logos/images.png",
                datatypes: ["generic/images"],
            },
            {
                ui: "volumeviewer",
                name: "Volume Viewer",
                desc: "to-be-written.",
                avatar: "http://www.brainlife.io/images/ui-logos/ui-volumeviewer.png",
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/mask" ],
            },
            {
                ui: "fslview",
                name: "FSLView",
                desc: "to-be-written.",
                avatar: "http://www.brainlife.io/images/ui-logos/fslview.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi" ],
            },
            {
                ui: "mrview",
                name: "mrView",
                desc: "to-be-written.",
                avatar: "http://www.brainlife.io/images/ui-logos/mrview.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi" ],
            },
            {
                ui: "fibernavigator",
                name: "fiberNavigator",
                desc: "to-be-written.",
                avatar: "http://www.brainlife.io/images/ui-logos/fibernavigator.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi" ],
            },
            {
                ui: "freeview-gpu",
                name: "FreeView",
                desc: "to-be-written.",
                avatar: "http://www.brainlife.io/images/ui-logos/freeview.png",
                docker: true,
                datatypes: [ "neuro/anat/t2w", "neuro/anat/t1w", "neuro/dwi", "neuro/freesurfer" ],
            },

            {
                ui: "conneval",
                name: "Connectome Evaluator",
                desc: "Display results from connectome evaluator showing the quality of your connectome data determined by LiFE",
                avatar: "http://www.brainlife.io/images/ui-logos/conneval.png",
                datatypes: [ "neuro/conneval" ],
            },

            {
                ui: "conn",
                name: "CONN",
                desc: "Experimental",
                avatar: "http://www.brainlife.io/images/ui-logos/conn.png",
                docker: true,
                datatypes: [ "raw" ], 
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
        }
    },

	methods: {
        list_views_single: function() {
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
            if(JSON.stringify(sorted_names) == JSON.stringify(["neuro/dwi/recon", "neuro/wmc"])) {
                views.push(this.view_catalog["tractview"]);
            }
            if(JSON.stringify(sorted_names) == JSON.stringify(["neuro/wmc", "raw"])) {
                views.push(this.view_catalog["tractview"]);
            }

            return views;
        },

        select: function(view) {
            this.$refs.modal.hide(); 
            if(this.task) this.openview(view, this.task, this.subdir);
            if(this.task_cb) this.task_cb(task=>{
                this.openview(view, task, this.subdir);
            });
        },

        openview: function(view, task, subdir) {
            console.log("openview", view, task);

            //let view = view.split('/').join('.'); //replace all / with .
            let path;
            if(view.docker) {
                path = "/warehouse/novnc/"+task.instance_id+"/"+task._id+'/'+view.ui;
            } else {
                path = "/warehouse/view/"+task.instance_id+"/"+task._id+'/'+view.ui;
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
