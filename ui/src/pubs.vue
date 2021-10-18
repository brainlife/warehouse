<template>
<div>
        <div class="page-header">
            <div class="search-box onRight">
                    <b-form-input v-model="query" type="text" placeholder="Search Publications" @input="changeQueryDebounce" class="input"/>
                    <icon name="search" class="search-icon" scale="1.5"/>
                    <icon name="times" class="clear-search" scale="1.5" @click="clearQuery()" v-if="query"/>
            </div>
        </div>
    <div class="page-content">
        <b-container>
            <div v-if="!pubs" style="margin: 40px;"><h3>Loading ..</h3></div>
            <div v-if="!pubs.length && query">
                <p style="opacity: 0.5; margin: 20px; font-size: 120%;">No matching publications</p>
            </div>
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
let queryDebounce;
export default {
    components: { pubcard },
    data () {
        return {
            pubs: [],
            config: Vue.config,
            query: "",
            filtered : [],
        }
    },

    // created: function() {
    //     this.$http.get('pub', {params: {
    //         find: JSON.stringify({ 
    //             removed: false 
    //         }),
    //         populate: 'project',
    //         select: '-readme', //ignore some heavy stuff
    //         deref_contacts: true,
    //     }})
    //     .then(res=>{
    //         this.pubs = res.data.pubs;

    //         Vue.nextTick(()=>{
    //             console.log("initializing altmetric embed")
    //             _altmetric_embed_init(this.$el);
    //         });

    //     }, res=>{
    //         console.error(res);
    //     });
    // },
    mounted() {
        this.load();
    },
    watch : {
        query() {
            this.load();
        }
    },

    methods: {
        load() {
            this.$http.get('pub/query', {params: {
                select: '-readme',
                q: this.query,
            }}).then(res=>{
                this.pubs = res.data.pubs;
                console.dir(this.pubs);
                Vue.nextTick(()=>{
                    console.log("initializing altmetric embed")
                    _altmetric_embed_init(this.$el);
                });
            }).catch(err=>{
                console.error(err);
            });
        },
        
        clearQuery() {
            this.query = ''
            this.changeQuery();
        },

        changeQueryDebounce() {
            clearTimeout(queryDebounce);
            queryDebounce = setTimeout(this.changeQuery, 300);        
        },

        changeQuery() {
            if(!this.datatypes) return setTimeout(this.changeQuery, 300);
            sessionStorage.setItem("pubs.query", this.query);
            this.load();
        },
    }
}
</script>

<style scoped>
.page-content {
top: 50px;
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
