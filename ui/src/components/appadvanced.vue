<template>
<div>
    <b-row>
        <b-col style="margin-bottom: 5px;">
            <div class="advanced-options-toggle" style="display:inline-block;" @click="show = !show">
                <icon v-if="show" name="caret-down" style="width: 20px"/>
                <icon name="caret-right" v-else style="width: 20px"/>
                <span>Advanced</span>
            </div>
        </b-col>
    </b-row>
    
    <div v-if="show">
        <!--this is where all the advanced options will go -->
        <slot/>
        <br>
        <br>
        <b-row>
            <b-col cols="3" class="text-muted">Preferred Resource</b-col>
            <b-col>
                <b-form-select v-if="preferrable_resources.length > 0"
                        :options="preferrable_resources"
                        v-model='preferred_resource' class="mb-3" />
            </b-col>
        </b-row>
        <b-row>
            <b-col cols="3" class="text-muted">Github Branch</b-col>
            <b-col>
                <!--
                <b-form-select v-model='github_branch'>
                    <optgroup label="Branches" v-if="github_branches">
                        <option v-for="branch in github_branches" :key="branch" :value="branch">{{branch}}</option>
                    </optgroup>
                    <optgroup label="Tags" v-if="github_tags">
                        <option v-for="tag in github_tags" :key="tag" :value="tag">{{tag}}</option>
                    </optgroup>
                </b-form-select>
                -->
                <branchselecter v-model="github_branch" :service="app.github"/>

            </b-col>
        </b-row>
        <br>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import branchselecter from '@/components/branchselecter'

export default {
    props: [ 'app', 'value' ],

    components: { 
        branchselecter,
    },
    
    data () {
        return {
            show: false,
            
            preferrable_resources: [],
            preferred_resource: null,
            
            //github_branches: [],
            //github_tags: [],

            github_branch: null,
            
        };
    },
    
    mounted () {
        this.$http.get(Vue.config.wf_api + '/resource/best', {params: {
            service: this.app.github
        }})
        .then(res => {
            this.preferrable_resources = res.data.considered.map(resource => {
                return {
                    value: resource.id,
                    text: resource.name,
                };
            });
            this.preferrable_resources.unshift({ value: null, text: "(None)" });
            this.preferrable_resources.sort((a, b) => a.score > b.score);

            this.github_branch = this.value.github_branch || this.app.github_branch || 'master';
        })
        .catch(console.error);
    },

    watch: {
        'preferred_resource': function() {
            this.update();
        },
        'github_branch': function() {
            this.update();
        },
    },
    
    methods: {
        update: function() {
            console.log("changed", this.github_branch);
            this.$emit('input', {
                resource: this.preferred_resource,
                branch: this.github_branch
            });
        }
    }
};
</script>

<style scoped>
.advanced-options-toggle {
    font-weight:bold;
    opacity:.7;
    cursor: pointer;
}
.advanced-options-toggle:hover {
    opacity:1;
}
</style>
