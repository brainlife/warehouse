<template>
<el-dropdown @command="select">
    <el-button :size="size">
        View<i class="el-icon-caret-bottom el-icon--right"></i>
    </el-button>
    <el-dropdown-menu slot="dropdown">

        <el-dropdown-item :command="datatype" v-if="datatype == 'neuro/dtiinit'">dtiInit Output</el-dropdown-item>
        <!--
            TODO - we can only display surface view on freesurfer output generate by app-freesurfer
            <el-dropdown-item :command="datatype" v-else-if="datatype == 'neuro/freesurfer'">Surface View</el-dropdown-item>
        -->

        <el-dropdown-item :command="datatype" v-else-if="datatype == 'neuro/wmc'">TractView</el-dropdown-item>
        <el-dropdown-item :command="datatype" v-else-if="datatype == 'neuro/life_output'">Life Output</el-dropdown-item>
        <el-dropdown-item :command="datatype" v-else-if="datatype == 'neuro/conneval_output'">Evaluator Result</el-dropdown-item>
        <el-dropdown-item :command="datatype" v-else-if="datatype == 'generic/images'">Images</el-dropdown-item>
        <el-dropdown-item :command="datatype" v-else-if="datatype == 'neuro/anat/t1w'">VolumeViewer</el-dropdown-item>

        <!--native UI TODO - only show viewer that makes sense for datatype -->
        <el-dropdown-item command="raw">Raw Data</el-dropdown-item>
        <el-dropdown-item command="fslview" divided>FSL View</el-dropdown-item>
        <el-dropdown-item command="freeview">Free View</el-dropdown-item>
        <el-dropdown-item command="mrview">MR View</el-dropdown-item>
        <el-dropdown-item command="fibernavigator">Fiber Navigator</el-dropdown-item>

    </el-dropdown-menu>
</el-dropdown>
</template>
<script>
import Vue from 'vue'

export default {
    props: [ 'size', 'datatype' ],
    components: { 
    },
    data () {
        return {
            config: Vue.config,
        }
    },
	methods: {
        select: function(com) {
            console.log("selected", com);
            this.$emit('select', com);  
        }
    }
}

</script>
