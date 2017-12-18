<template>
<div id="warehouse">
    <router-view></router-view>
    <notifications position="bottom right"/>

    <!-- dialogs that can be called from any view -->
    <datasetselecter/>
    <viewselecter/>
    <dataset/>
    <uploader/>

</div>
</template>

<script>
import datasetselecter from '@/modals/datasetselecter'
import viewselecter from '@/modals/viewselecter'
import dataset from '@/modals/dataset'
import uploader from '@/modals/uploader'

export default {
    components: {
        viewselecter, datasetselecter, dataset, uploader,
    },
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
