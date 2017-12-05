<template>
<div id="warehouse">
    <router-view></router-view>
    <notifications position="bottom right"/>

    <!-- dialogs that can be called from any view -->
    <datasetselecter/>
    <viewselecter/>

</div>
</template>

<script>
import datasetselecter from '@/modals/datasetselecter'
import viewselecter from '@/modals/viewselecter'

export default {
    components: {
        viewselecter, datasetselecter,
    },

    /*
    events: {
        "viewselecter.open": function(config) {
            console.log("viewselecter open called");
            console.dir(config);
            //TODO.. :datatype_name="vsel.datatype_name"
        },
    },
    */

    methods: {
    }
}
</script>

<style scoped>
#warehouse {
height: 100%;
background-color: #f9f9f9;
color: #444;
font-size: 14px; /*default is 16px for bootstrap*/
}
</style>
