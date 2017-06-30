<template>
<div v-if="app_">
    <!--set app.uiid and submit it on process -->
    <acpcalignment v-if="app_.uiid == 'vue/acpcalign'" :task="task"></acpcalignment>
    <dtiinit v-else-if="app_.uiid == 'vue/dtiinit'" :task="task"></dtiinit>
    <freesurfer v-else-if="app_.uiid == 'vue/freesurfer'" :task="task"></freesurfer>
    <life v-else-if="app_.uiid == 'vue/life'" :task="task"></life>
    <evaluator v-else-if="app_.uiid == 'vue/evaluator'" :task="task"></evaluator>
</div>
</template>

<script>
import Vue from 'vue'

import acpcalignment from '@/components/appuis/acpcalignment'
import dtiinit from '@/components/appuis/dtiinit'
import freesurfer from '@/components/appuis/freesurfer'
import life from '@/components/appuis/life'
import evaluator from '@/components/appuis/evaluator'

export default {
    props: ['task', 'appid', 'app'],
    components: { 
        acpcalignment,
        dtiinit,
        freesurfer,
        life,
        evaluator,
    },
    data() {
        return {
            app_: null,
        }
    },
    created: function() {
        if(this.appid) {
            this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.appid}),
            }}).then(res=>{
                this.app_ = res.body.apps[0];
            });
        }
        if(this.app) this.app_ = this.app;
    }
}
</script>
