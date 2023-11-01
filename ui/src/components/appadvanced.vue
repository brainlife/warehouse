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
                <branchselector v-model="github_branch" :service="app.github"/>
            </b-col>
        </b-row>
        <br>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import branchselector from '@/components/branchselector'

export default {
    props: [ 
        'app', 
        'value', //selected resource.id
        'gids', //gids to query for best resource
    ],

    components: {
        branchselector,
    },

    data () {
        return {
            show: false,

            preferrable_resources: [],
            preferred_resource: null,

            github_branch: null,

        };
    },

    mounted () {
        this.$http.get(Vue.config.amaretti_api + '/resource/best', {params: {
            service: this.app.github,
            gids: this.gids,
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
