<template>
<div>
    <b-row>
        <b-col class="text-muted" style="text-align:right; margin-bottom: 5px;">
            <div class="advanced-options-toggle" style="display:inline-block;" @click="show = !show">
                <icon v-if="show" name="caret-down" />
                <icon name="caret-right" v-else />
                <span>Advanced</span>
            </div>
        </b-col>
    </b-row>
    
    <div v-if="show">
        <slot/>
        <hr>
        <b-row>
            <b-col cols="3" class="text-muted">Preferred Resource</b-col>
            <b-col>
                <b-form-select v-if="preferrable_resources.length > 0"
                        :options="preferrable_resources"
                        v-model='preferred_resource' class="mb-3" />
            </b-col>
        </b-row>
        <b-row v-if="github_branches">
            <b-col cols="3" class="text-muted">Github Branch</b-col>
            <b-col>
                <b-form-select style="width:100%;" :options="github_branches" v-model='github_branch'></b-form-select>
            </b-col>
        </b-row>
        <br>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: [ 'app', 'value' ],
    
    data () {
        return {
            show: false,
            
            preferrable_resources: [],
            preferred_resource: null,
            
            github_branches: [],
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

            return this.$http.get('https://api.github.com/repos/' + this.app.github + '/branches', { headers: { Authorization: null } });
        })
        .then(res => {
            this.github_branches = res.data.map(b => {
                return {
                    value: b.name,
                    text: b.name
                };
            });
            
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
