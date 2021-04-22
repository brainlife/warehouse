<template>
<div>
    <div class="page-content">
        <div class="header">
            <b-container>
                <!--
                <a href="https://brainlife.io/docs/user/publication/" target="doc" style="margin: 10px; opacity: 0.4; float: right;"><icon name="book" scale="1.5"/></a>
                -->
                <h3>Publications</h3>
                <p style="opacity: 0.7; margin: 0px;">
                    Brainlife allows users to create snapshots of archived datasets from Brainlife project 
                    and create a "publication" containing full-provenance that can be used as data-citation for scientific papers. 
                </p>
                <br>
            </b-container>
        </div>
        <b-container>
            <div v-if="!pubs" style="margin: 40px;"><h3>Loading ..</h3></div>
            <div v-else style="margin: 10px 0px;">
                <div v-for="pub in pubs" :key="pub._id" style="margin-bottom: 30px; box-shadow: 1px 1px 4px #9996">
                    <pubcard :pub="pub"/>
                </div>
            </div>
        </b-container>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import pubcard from '@/components/pubcard'

export default {
    components: { pubcard },
    data () {
        return {
            pubs: [],
            config: Vue.config,
        }
    },

    created: function() {
        this.$http.get('pub', {params: {
            find: JSON.stringify({ 
                removed: false 
            }),
            populate: 'project',
            deref_contacts: true,
        }})
        .then(res=>{
            this.pubs = res.data.pubs;

            Vue.nextTick(()=>{
                console.log("initializing altmetric embed")
                _altmetric_embed_init(this.$el);
            });

        }, res=>{
            console.error(res);
        });
    },

    methods: {
    }
}
</script>

<style scoped>
.page-content {
top: 0px;
background-color: white;
}
.page-content h3 {
margin-bottom: 0px;
padding: 10px 0px;
}
.header {
padding: 10px;
background-color: white;
border-bottom: 1px solid #eee;
position: sticky;
z-index: 1;
top: 0px;
}
</style>
