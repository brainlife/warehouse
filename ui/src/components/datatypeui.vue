<template>
    <dtiinit v-if="datatype == 'neuro/dtiinit_output'" :task="task" :subdir="subdir"></dtiinit>
    <freesurfer v-else-if="datatype == 'neuro/freesurfer'" :task="task" :subdir="subdir"></freesurfer>
    <afq v-else-if="datatype == 'neuro/afq_output'" :task="task" :subdir="subdir"></afq>
    <life v-else-if="datatype == 'neuro/life'" :task="task" :subdir="subdir"></life>
    <evaluator v-else-if="datatype == 'neuro/conneval_output'" :task="task" :subdir="subdir"></evaluator>
</template>

<script>
import Vue from 'vue'

import dtiinit from '@/components/appuis/dtiinit'
import freesurfer from '@/components/appuis/freesurfer'
import afq from '@/components/appuis/afq'
import life from '@/components/appuis/life'
import evaluator from '@/components/appuis/evaluator'

export default {
    props: ['datatype', 'task', 'subdir'],
    components: { 
        dtiinit,
        freesurfer,
        afq,
        life,
        evaluator,
    },
}
</script>
