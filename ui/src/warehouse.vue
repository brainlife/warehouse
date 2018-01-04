<template>
<div id="warehouse">
    <router-view/>
    <notifications position="bottom right"/>

    <!-- dialogs that can be called from any view -->
    <datasetselecter/>
    <viewselecter/>
    <dataset/>
    <datatype/>
    <uploader/>
</div>
</template>

<script>

import datasetselecter from '@/modals/datasetselecter'
import viewselecter from '@/modals/viewselecter'
import dataset from '@/modals/dataset'
import datatype from '@/modals/datatype'
import uploader from '@/modals/uploader'

export default {
    components: {
        viewselecter, datasetselecter, dataset, datatype, uploader,
    },
}

</script>

<style scoped>
#warehouse {
height: 100%;
background-color: #f9f9f9;
color: #444;
font-size: 14px; 
}
</style>


