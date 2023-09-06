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
        value: String, //initial
        service: String,
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
        this.load();
    },

    methods: {
        load() {
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

