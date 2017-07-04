<template>
<el-dropdown @command="select">
    <el-button size="small">
        View<i class="el-icon-caret-bottom el-icon--right"></i>
    </el-button>
    <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="fslview">FSL View</el-dropdown-item>
        <el-dropdown-item command="freeview">Free View</el-dropdown-item>
        <el-dropdown-item command="mrview">MR View</el-dropdown-item>
        <el-dropdown-item command="fibernavigator">Fiber Navigator</el-dropdown-item>
    </el-dropdown-menu>
</el-dropdown>
</template>
<script>
import Vue from 'vue'

export default {
    components: { },
    data () {
        return {
            config: Vue.config,
        }
    },
	methods: {
        select: function(com) {
            //console.log("viewselect: ", com);
            this.$emit('select', com);  
        }
    }
}

</script>
