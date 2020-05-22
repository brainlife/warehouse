<template>
<div class="groupanalysis">
    <iframe src="https://dev1.soichi.us/ipython/8888/lab?token=049ef8317db7560184c08f4b95468a17777cea2b985e9a75" width="100%" height="100%" frameBorder="0"/>
</div>
</template>

<script>
export default {
    props: {
        project: { type: Object },
    }
}
</script>

<style scoped>
.groupanalysis {
    position: fixed;
    left: 40px;
    right: 0;
    top: 95px;
    bottom: 0;
    /* this creates scrolling issue with iframe
    overflow: auto;
    */
}
</style>
