<template>
<div>
    <!--set app.uiid and submit it on process -->
    <acpcalignment v-if="uiid == 'vue/acpcalign'" :task="task"></acpcalignment>
    <dtiinit v-else-if="uiid == 'vue/dtiinit'" :task="task"></dtiinit>
    <freesurfer v-else-if="uiid == 'vue/freesurfer'" :task="task"></freesurfer>
    <life v-else-if="uiid == 'vue/life'" :task="task"></life>
    <evaluator v-else-if="uiid == 'vue/evaluator'" :task="task"></evaluator>
    <p v-else>No inline viewer registered for this application</p>
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
    components: { 
        acpcalignment,
        dtiinit,
        freesurfer,
        life,
        evaluator,
    },
    props: ['task', 'uiid'],
}
</script>
