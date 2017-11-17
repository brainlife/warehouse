<template>
<div style="display: inline-block;">
    <div v-if="access == 'public'" title="Datasets are accessible to any users but only project member can update them.">
        <h4><b-badge variant="success">Public</b-badge></h4>
    </div>
    <div v-if="access == 'private'" title="Only the members of project can access datasets">
        <h4><b-badge variant="danger">Private</b-badge></h4>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['access'],
}
</script>
