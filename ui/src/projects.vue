<template>
<div>
    <div class="page-header">
        <div class="search-box onRight">
            <b-form-input v-model="query" type="text" placeholder="Search Projects" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
            <icon name="times" class="clear-search" scale="1.5" @click="clearQuery()" v-if="query != ''"/>
        </div>
    </div>

    <div class="page-content" @scroll="handleScroll" ref="scrollable">
        <div v-if="loading" style="margin: 40px; opacity: 0.5"><h3><icon name="cog" spin scale="2"/> Loading ..</h3></div>
        <div v-else>
            <div class="mode-toggler onRight">
                <b-form-group>
                <b-form-radio-group v-model="mode" buttons button-variant="outline-secondary">
                    <b-form-radio value="tile"><icon name="th"/></b-form-radio>
                    <b-form-radio value="list"><icon name="list"/></b-form-radio>
                </b-form-radio-group>
                </b-form-group>
            </div>

            <div v-if="query.length && !other_projects.length && !my_projects.length">
                <p style="padding: 20px; opacity: 0.8;">No matching Projects</p>
            </div>

            <!--TODO - should refactor this.. similar to public y projects-->
            <div v-if="recentProjects.length && my_projects.length > 20" class="position: relative">
                <h4 class="group-title">Recent Projects</h4>
                <div style="padding: 10px;" v-if="mode == 'tile'">
                    <div v-for="project in recentProjects" :key="project._id">
                        <projectcard :project="project" v-if="project._visible"/>
                        <div v-else class="projectcard" ref="project" :id="project._id"/> <!--placeholder-->
                    </div>
                </div>
                <div style="padding: 10px;" v-if="mode == 'list'">
                    <div v-for="project in recentProjects" :key="project._id">
                        <projectbar :project="project" v-if="project._visible"/>
                        <div v-else style="height: 40px; color: white;" ref="project" :id="project._id"/> <!--placeholder-->
                    </div>
                </div>
                <br v-if="recentProjects.length > 0" clear="both">
            </div>

            <!--TODO - should refactor this.. similar to public y projects-->
            <div v-if="config.user" class="position: relative">
                <aupAgreementModal v-if="config.user && config.profile"></aupAgreementModal>                     
                <h4 class="group-title">My Projects </h4>
                <p v-if="my_projects.length == 0 && query == ''" style="margin: 20px; opacity: 0.5;">
                    Please create your project by clicking the <b>New Project</b> button below.
                </p>
                <div style="padding: 10px;" v-if="mode == 'tile'">
                    <div v-for="project in my_projects" :key="project._id">
                        <projectcard :project="project" v-if="project._visible"/>
                        <div v-else class="projectcard" ref="project" :id="project._id"/> <!--placeholder-->
                    </div>
                </div>
                <div style="padding: 10px;" v-if="mode == 'list'">
                    <div v-for="project in my_projects" :key="project._id">
                        <projectbar :project="project" v-if="project._visible"/>
                        <div v-else style="height: 40px; color: white;" ref="project" :id="project._id"/> <!--placeholder-->
                    </div>
                </div>
                <br v-if="my_projects.length > 0" clear="both">
            </div>

            <!--TODO - should refactor this.. similar to my projects-->
            <div v-if="other_projects.length > 0" style="position: relative;">
                <h4 class="group-title">Public<small>/Protected</small> Projects</h4>
                <div style="padding: 10px;" v-if="mode == 'tile'">
                    <div v-for="project in other_projects" :key="project._id">
                        <projectcard :project="project" v-if="project._visible"/>
                        <div v-else class="projectcard" ref="project" :id="project._id"/> <!--placeholder-->
                    </div>
                </div>
                <div style="padding: 10px;" v-if="mode == 'list'">
                    <div v-for="project in other_projects" :key="project._id">
                        <projectbar :project="project" v-if="project._visible"/>
                        <div v-else style="height: 40px; color: white;" ref="project" :id="project._id"/> <!--placeholder-->
                    </div>
                </div>
                <br clear="both">
            </div>
        </div><!--v-if="!loading"-->
    </div>
    <b-button class="button-fixed" @click="newproject">
        New Project
    </b-button>
</div>
</template>

<script>
import Vue from 'vue'
import projectbar from '@/components/projectbar'
import aupAgreementModal from '@/modals/aup_agreement';

let query_debounce;

export default {
    components: { 
        projectcard: ()=>import('@/components/projectcard'), 
        projectbar: ()=>import('@/components/projectbar'), 
        aupAgreementModal: ()=>import('@/modals/aup_agreement'),
    },
    data () {
        return {   
            projects: [],
            my_projects: [],
            other_projects: [],
            recentProjects: [],

            loading: false,

            query: "",
            datatypeName : {},
            mode: localStorage.getItem("projects.mode")||"tile",
            config: Vue.config,
        }
    },

    mounted() {
        this.query = sessionStorage.getItem("projects.query")||"";
        this.load();

    },

    watch: {
        mode() {
            localStorage.setItem("projects.mode", this.mode);
            this.projects.forEach(p=>{p._visible = false});
            this.$nextTick(()=>{
                this.handleScroll();
            });
        }
    },

    methods: {
        handleScroll() {
            if(this.$refs.project) {
                const e = this.$refs.scrollable;
                this.$refs.project.forEach(elem=>{
                    const project = this.projects.find(p=>p._id == elem.id);
                    if(elem.offsetTop > e.scrollTop - e.clientHeight/2 && elem.offsetTop < e.scrollTop + e.clientHeight) {
                        Vue.set(project, '_visible', true);
                    }
                });
                this.$forceUpdate();
            }
        },

        clearQuery() {
            this.query = ''
            this.change_query();
        },

        load() {
            //load all projects that user has summary access (including removed ones so we can open it)
            this.projects = [];
            this.my_projects = [];
            this.other_projects = [];
            this.recentProjects = [];

            this.loading = true;
            this.$http.get('project/query', {params: {
                q: this.query,
                select: 'name desc avatar group_id stats.datasets stats.instances create_date admins members guests access',
            }}).then(res=>{
                this.projects = res.data;

                let lastMonth = new Date();
                lastMonth.setDate(lastMonth.getDate() - 30);

                //if user access this page for the first time, we don't want to show all project as "new"
                //so let's assume that all projects are at least month old
                if(!localStorage.getItem('project.initialized')) {
                    localStorage.setItem('project.initialized',"true");
                    this.projects.forEach(project=>{
                        localStorage.setItem('project.'+project._id+".lastOpened",lastMonth.getTime());
                    });
                }

                this.projects.forEach(p=>{
                    if(Vue.config.user && (
                        p.admins.includes(Vue.config.user.sub) ||
                        p.members.includes(Vue.config.user.sub) ||
                        p.guests.includes(Vue.config.user.sub))
                    ) {
                        this.my_projects.push(p);
                    } else {
                        this.other_projects.push(p);
                    }

                    const lastOpened = localStorage.getItem('project.'+p._id+".lastOpened");

                    //if _lastOpened is not set (newly added) or _lastOpened is set but it's recent
                    //then add it to recentProject list
                    if(!lastOpened) p.new = true;
                    if(p.new || lastOpened > lastMonth) this.recentProjects.push(p);
                });
                this.loading = false;
                this.$nextTick(()=>{
                    this.handleScroll();
                });
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err.toString()});
                this.loading = false;
            });
        },
        change_query_debounce() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query() {
            sessionStorage.setItem("projects.query", this.query);
            this.load();
        },
       
        newproject() {
            if(Vue.config.user) {
                this.$router.push('/project/_/edit');
            } else {
                alert('Please signup/login first to create a new project');
            }
        },
    },
}
</script>

<style scoped>
.mode-toggler {
    float: right;
    position: sticky;
    top: 10px;
    z-index: 2;
    opacity: 0.5;
    transition: opacity 0.3s;
}
.mode-toggler:hover {
    opacity: 1;
}
.group-title {
    color: #999;
    text-transform: uppercase;
    padding: 15px 20px;
    margin-bottom: 10px;
    background-color: white;
    position: sticky;
    top: 0px;
    z-index: 1;
    opacity: 0.8;
}
.projectcard {
    width: 325px;
    height: 178px;
    float: left;
    margin-right: 10px;
    margin-bottom: 10px;
    box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    transition: box-shadow 0.5s;
}
.projectcard:hover {
    box-shadow: 2px 2px 8px rgba(0,0,0,0.3);
}
</style>
