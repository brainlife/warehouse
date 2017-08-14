<template>
<div>
    <pageheader :user="config.user" />
    <sidemenu active="/datatypeview" />
    
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'

export default {
    components: { sidemenu, pageheader },
    data () {
        return {
            config: Vue.config
        }
    },
    mounted () {
        console.log(this.$route.params);
    }
}

</script>