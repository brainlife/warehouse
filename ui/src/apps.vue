<template>
<div>
    <!-- main view -->
    <sidemenu active="apps"></sidemenu>
    <div class="ui pusher">
        <div class="margin20">
            <div class="ui fluid category search">
                <button class="ui right floated primary button" @click="go('/app/_/edit')">
                    <i class="ui icon add"></i> Register
                </button>
                <div class="ui icon input">
                    <input class="prompt" type="text" v-model="query" placeholder="Search ...">
                    <i class="search icon"></i>
                </div>
                <div class="results"></div>
            </div>

            <br>

            <div class="ui cards">
                <app v-for="app in apps" key="app._id" :app="app"></app>
            </div><!--v-for-->
        </div><!--magin20-->
    </div><!--pusher-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import app from '@/components/app'

export default {
    name: 'apps',
    data () {
        return {
            apps: [],
            query: "",
        }
    },

    mounted: function() {
        this.$http.get('app', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.apps = res.body.apps;
        }, res=>{
            console.error(res);
        });
    },
    methods: {
        go: function(path) {
            this.$router.push(path);
        }
    },
    components: { sidemenu, app },
}
</script>

<style scoped>
</style>
