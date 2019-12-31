<template>
<div>
    <sidemenu active="/projects"></sidemenu>
    <div class="page-content">
        <img src="@/assets/images/openneuro.png" height="40px" align="left" style="margin-top: 10px;"/>
        <h2>/ {{$route.params.id}}</h2>
        <br>
        <p>
            This dataset is not yet available on brainlife.io. 
        </p>

        <p>
            Please contact <a target="mail" :href="'mailto:brlife@iu.edu?subject=Please expose openneuro '+$route.params.id+' on brainlife.io'">brainlife administrators</a> and request
            to make this dataset available on brainlife.io so that you and other users of brainlife.io can analyze this dataset using brainlife.io Apps.
        </p>

    </div>
    <div class="page-content page-subcontent">
        <p style="margin-top: 30px; float: right;">
            <img src="@/assets/images/logo.svg" height="100px" style="position: relative; float: right; top: -25px;"/>
            <a href="https://brainlife.io" style="font-size: 150%; margin-left: 20px;">What is brainlife?</a>
        </p>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'

export default {
    components: { sidemenu },
    data () {
        return {
            pubs: [],
            config: Vue.config,
        }
    },

    mounted: function() {
        /*
        this.$http.get('project', {params: {
            find: JSON.stringify({ 
                removed: false,
                "openneuro.dataset_id": this.$route.params.id,
            }),
        }})
        .then(res=>{
            //redirect if we are hosting this project
            if(res.data.count > 0) {
                let project = res.data.projects[0];
                console.log("redirecting to "+project._id);
                this.$router.push("/project/"+project._id+"/process");
            }
        }, res=>{
            console.error(res);
        });
        */

        this.$http.get('datalad/datasets', {params: {
            find: JSON.stringify({
                path: "datasets.datalad.org/openneuro/"+this.$route.params.id,
            })
        }})
        .then(res=>{
            console.dir(res.data);
            if(res.data.length == 0) return;
            //in case there are multiple.. let's pick the first one
            let dataset = res.data[0];
            console.log("redirecting to "+dataset._id);
            this.$router.push("/datasets/"+dataset._id);
        }).catch(console.error);
    },
}
</script>

<style scoped>
.page-content {
top: 0px;
background-color: #fff;
padding: 10px 20px;
}
.page-content h2 {
color: #999;
margin-bottom: 0px;
padding: 10px 0px;
}
.page-subcontent {
height: 120px;
top: inherit;
bottom: 0px;
background-color: #f9f9f9;
overflow: hidden;
}
</style>
