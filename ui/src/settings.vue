<template>
<div>
    <sidemenu active="/settings"></sidemenu>
    <div class="off-sidemenu">
        <div class="margin20">
            <div style="float: right">
                <span class="button" @click="signout">Sign Out</span>
            </div>
            <h1>Settings</h1>
            <p>TODO..</p>
            <p>Allow user to update account information..</p>
            <p>Allow user to update profile information..</p>
            <p>TODO..</p>
            <p>Allow user to configure when to receive what information and how.</p>
            <h4>User Token</h4>
            <pre v-highlightjs="JSON.stringify(user, null, 4)"><code class="json hljs"></code></pre>
        </div>
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
            active: ['user'],
            user: Vue.config.user,
        }
    },
    mounted: function() {
        //until we have our dedicated settings page, we are going to use sca's settings pages
        //so for the /settings itself, we are just going to redirect back to dashboard
        document.location = "#/";
    },
    methods: {
        //move to mixin?
        signout: function() {
            localStorage.removeItem('jwt');
            document.location = "/auth#!/signin";
        } 
    },
}
</script>

<style scoped>
</style>
