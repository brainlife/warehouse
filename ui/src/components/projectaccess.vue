<template>
<div style="display: inline-block;">
    <div  v-if="access == 'public'">
        <h4><b-badge variant="success">Public</b-badge></h4>
        <!--<span class="text-muted">Datasets are accessible to any users but only project member can update them.</span>-->
    </div>
    <div v-if="access == 'private'">
        <h4><b-badge variant="danger">Private</b-badge></h4>
        <!--<span class="text-muted">Only the members of project can access datasets</span>-->
    </div>
</div>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['access'],
}
</script>
