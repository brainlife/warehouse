<template>
<div>
    <p v-if="error">{{error}}</p>
    <b-input-group prepend="Branch/Tag" v-if="!error">
        <b-form-select v-model="selection" @change="update">
            <optgroup label="Branches" v-if="branches.length > 0">
                <option v-for="branch in branches" :key="branch" :value="branch">{{branch}}</option>
            </optgroup>
            <optgroup label="Tags" v-if="tags.length > 0">
                <option v-for="tag in tags" :key="tag" :value="tag">{{tag}}</option>
            </optgroup>
        </b-form-select>
    </b-input-group>
</div>
</template>

<script>

let debounce;

import Vue from 'vue'
export default {
    props: {
        service: String,
        value: String, //initial
    },

    data() {
        return {
            branches: [],
            tags: [],

            selection: null,

            error: null,

            config: Vue.config,
        }
    },

    watch: {
        service() {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.load();
            }, 300);
        }
    },

    mounted() {
        //this.selection = this.value;
        this.load();
    },

    methods: {
        load() {
            //this.tags = [];
            //this.branches = [];
            if(!this.service) {
                this.error = "Please specify service";
                return;
            }
            this.$http.get("/app/info/"+this.service).then(res=>{
                this.error = null;
                this.tags = res.data.tags.map(b => {
                    return b.name;
                });
                this.branches = res.data.branches.map(b => {
                    return b.name;
                });
                //console.log("finished loading tag/branches. now setting selection to "+this.value);
                this.selection = this.value;
            }).catch(err=>{
                if(err.response.status == "404") {
                    this.error = "Please enter in orgname/reponame format";
                    return;
                }
                this.error = err.response.data.message;
            });
        },

        update(v) {
            this.$emit('input', v);
        }
    },
}
</script>

<style>
.menu-item {
    display:inline-block;
}
/* these thins should probably go to component/datasetselecter.vue*/
.menu-item time {
    margin-left:10px;
    color:#999;
    float: right;
}
.select2-results__option--highlighted .tag,
.select2-results__option--highlighted time {
    color: #ddd;
}

/* Hide the 'Searching...' text */
.select2-results__option.loading-results {
    display:none;
}
/* fix some odd indentation issue on the first result option inside each group*/
.select2-container--default .select2-results__option .select2-results__option {
    padding-left: 6px;
}
.select2-container--default .select2-results__option {
    font-size: 10pt;
}
.select2-container--default .select2-selection--multiple .select2-selection__choice {
    border: none;
    border-radius: 0px;
}
.select2-dropdown {
    z-index: 9900;
}
</style>
