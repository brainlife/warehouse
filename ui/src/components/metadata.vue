<template>
<pre v-highlightjs="JSON.stringify(metadata, null, 4)"><code class="json hljs"></code></pre>
<!--
<div>
    <span v-for="(v, k) in metadata" key="k" class="md">
        <b>{{k}}</b> {{v}}
    </span>
</div>
-->
</template>

<script>
export default {
    props: [ 'metadata' ],
}
</script>

<style scoped>
.md {
background-color: #666;
padding: 5px 10px;
color: white;
line-height: 150%;
}
</style>
