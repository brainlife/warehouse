<template>
<div class="page-content">
    <div class="header">
        <b-container>
            <b-tabs class="brainlife-tab" v-model="tab">
                <b-tab title="Profile"/>
                <b-tab title="Account"/>
                <b-tab title="Notification"/>
                <b-tab v-if="config.hasRole('admin')" title="Groups"/>
            </b-tabs>
        </b-container>
    </div>

    <b-container>
        <!--user settings-->
        <settingsProfile v-if="tab == 0"/>
        <settingsAccount v-if="tab == 1"/>
        <settingsNotification v-if="tab == 2"/>

        <!--administrative settings-->
        <!-- <settingsUsers v-if="tab == 3"/> -->
        <settingsGroups v-if="tab == 3"/>
    </b-container>
    <br>
    <br>
</div><!--page-content-->
</template>

<script>
import Vue from 'vue'

import settingsProfile from '@/components/settings/profile'
import settingsAccount from '@/components/settings/account'
import settingsNotification from '@/components/settings/notification'
// import settingsUsers from '@/components/settings/users'
import settingsGroups from '@/components/settings/groups'

export default {
    components: {
        settingsProfile,
        settingsAccount,
        settingsNotification,
        settingsGroups,
    },

    data () {
        return {
            tab: 0,
            /*
            tabs: [
                {id: "profile", label: "Profile"},
                {id: "account", label: "Account"},
                {id: "notification", label: "Notification"},
                {id: "users", label: "Users"},
                {id: "groups", label: "Groups"},
            ],
            */
            tabIndices: ["profile", "account", "notification", "users", "groups"],
            config: Vue.config,
        }
    },

    mounted() {
        this.handleRouteParams();
    },

    methods: {
        handleRouteParams() {
            let tab_id = this.$route.params.tab;
            if(tab_id) {
                this.$nextTick(()=>{
                    this.tab = this.tabIndices.indexOf(tab_id);
                });
            }
        },

    },

    computed: {
    },

    watch: {
        tab: function() {
            this.$router.replace("/settings/"+this.tabIndices[this.tab]);
        },
    },
}
</script>

<style scoped>
.page-content {
    top: 0px;
    background-color: #f9f9f9;
}
.page-content h2 {
    margin-bottom: 0px;
    padding: 10px 0px;
    font-size: 20pt;
}
.header {
    padding-top: 5px;
    padding-bottom: 0px;
    margin-bottom: 20px;
    background-color: white;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 0;
    z-index: 4;
}

/deep/ .container h5 {
    padding-bottom: 10px;
    margin-bottom: 10px;
    opacity: 0.7;
    border-bottom: 1px solid #ddd;
}
/*
.well {
    padding: 10px;
    margin-bottom: 10px;
    background-color: #fff;
    display: block;
    clear: both;
}
.headingbtnGroup {
    color: #5F5F5F;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 13px;
}
*/
</style>
