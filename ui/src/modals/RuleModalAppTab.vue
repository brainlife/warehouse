<template>
    <b-container>
        <b-form-group label="Description" class="mt-3">
            <b-form-textarea v-model="name" placeholder="Please enter a description for this rule"/>
        </b-form-group>
    
        <b-form-group label="App *" horizontal>
            <v-select required label="name" :filterable="false" :options="search_apps" @search="search_app" @input="onSelectApp"
                placeholder="Search App">
                <template slot="no-options">
                    <b-container class="my-1" style="display: flex; align-items: start;">Please enter App name / desc to search</b-container>
                </template>
                <template slot="option" slot-scope="searchAppOption">
                    <App :app="searchAppOption" :compact="true" :clickable="false"/>
                </template>
                <template slot="selected-option" slot-scope="searchAppOption">
                    {{searchAppOption.name}}
                </template>
            </v-select>
    
            <div v-if="!app" style="height: 350px">
                &nbsp;
            </div>
    
            <div v-if="app">
                <App :app="app" :compact="true" :clickable="false" style="margin-top: 5px;"/>
                <div v-if="app.deprecated_by" style="margin-top: 10px">
                    <b-card v-if="app.deprecated_by" no-body style="margin-bottom: 10px">
                        <span slot="header">
                            <icon name="regular/calendar-times"/> This App has been deprecated by the following App
                        </span>
                        <App :appid="app.deprecated_by"/>
                    </b-card>
                </div>
            </div>
        </b-form-group>
    
        <div v-if="app">
            <b-form-group label="Branch" horizontal>
                <BranchSelector v-model="branch" :service="app.github"/>
            </b-form-group>
    
            <b-form-group label="Configuration" horizontal>
                <b-card>
                    <!-- while this works, this is not best practice... -->
                    <ConfigForm :spec="app.config" v-model="ruleConfig"/>
                    <div v-if="hasAdvancedOptions">
                        <hr>
                        <p><b>Advanced Options</b></p>
                        <!-- while this works, this is not best practice... -->
                        <ConfigForm :spec="app.config" v-model="ruleConfig" :advanced="true"/>
                    </div>
                </b-card>
            </b-form-group>
        </div>
    </b-container>
</template>

<script>
import search_app_mixin from '@/mixins/searchapp'

export default {
    mixins: [ search_app_mixin ],
    components: {
        App: () => import('@/components/app'),
        ConfigForm: () => import('@/components/configform'),
        BranchSelector: () => import('@/components/branchselector'),
        ConfigForm: () => import('@/components/configform')
    },
    props: {
        ruleName: String,
        ruleBranch: String,
        ruleApp: Object,
        ruleConfig: Object,
    },
    emits: [
        'update:rule-name',
        'update:rule-branch',
        'update:rule-app'
    ],
    computed: {
        branch: {
            get () { return this.ruleBranch },
            set (updatedRuleBranch) { this.$emit('update:rule-branch', updatedRuleBranch) }
        },
        app: function () {
            return this.ruleApp;
        },
        config: function () {
            return this.ruleConfig;
        },
        name: {
            get () { return this.ruleName },
            set (updatedRuleName) { this.$emit(`update:rule-name`, updatedRuleName) }
        },
        hasAdvancedOptions() {
            if (!this.app) return false;

            for(let key in this.app.config) {
                const configVal = this.app.config[key];
                if(configVal.advanced) return true;
            }
            return false;
        }
    },
    methods: {
        onSelectApp(selectedApp) {
            this.$emit(`update:rule-app`, selectedApp)
        }
    }
}
</script>

<style></style>