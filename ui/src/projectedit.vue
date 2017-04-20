<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/projects"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20">
            <h1 v-if="$route.params.id == '_'">Register Project</h1>
            <h1 v-else><icon name="pencil" scale="2"/> Edit {{project.name}}</h1>

            <form class="ui form">
                <div class="field">
                    <label>Name</label>
                    <input type="text" v-model="project.name" placeholder="Project Name">
                </div>
                <div class="field">
                    <label>Description Name</label>
                    <textarea v-model="project.desc" placeholder="Enter description for this project."></textarea>
                </div>
                <div class="field" v-if="project.admins">
                    <label>Administrator</label>
                    <contactlist :uids="project.admins" @changed="changeadmins($event)"></contactlist>
                </div>
                <el-button type="primary" icon="check" @click="submit()" style="float: right;">Submit</el-button>
            </form>
            
            <br><br>

            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <h3>project</h3>
                <pre v-highlightjs="JSON.stringify(project, null, 4)"><code class="json hljs"></code></pre>
            </el-card>

        </div><!--margin20-->
        </div><!--page-content-->
    </div><!--page-->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'

export default {
    components: { sidemenu, contactlist, pageheader },
    data () {
        return {
            project: {
                _id: null,
                name: "",
                desc: "",
                access: "private",
                admins: [Vue.config.user.sub],
                members: [Vue.config.user.sub],
            },

            config: Vue.config,
        }
    },
    mounted: function() {
        /*
		$(this.$el).find('.repotype .item').tab({
            onVisible: (v)=> {
                this.repotype = v;
            }
        });
        */
        if(this.$route.params.id !== '_') {
            //load project to edit
            this.$http.get('project', {params: {
                find: JSON.stringify({_id: this.$route.params.id})
            }})
            .then(res=>{
                this.project = res.body.projects[0];
            });
        } else {
            //??
        } 
    },
    computed: {
    },
    methods: {
        changeadmins: function(admins) {
            this.project.admins = admins;
        },

        add: function(it) {
            it.push({
                id: "",
                datatype: null,
                datatype_tags: [],
            });
        },

        submit: function() {
            /*
            try {
                this.project.config = JSON.parse(this.app._config);     
            } catch(err) {
                this.$notify({ showClose: true, message: 'Failed to parse config template.', type: 'error' });
                return;
            }
            console.log("submitting", this.app);
            if(this.app._id !== '_') {
                //update
                this.$http.put('app/'+this.app._id, this.app)
                .then(res=>{
                    console.dir(res.body);
                    this.$router.push("/app/"+this.app._id);
                });
            } else {
                //new
                this.$http.post('app', this.app)
                .then(res=>{
                    console.dir(res.body);
                    this.$router.push("/app/"+res.body._id);
                });
            } 
            */
        }
    },
}
</script>

<style scoped>
</style>


