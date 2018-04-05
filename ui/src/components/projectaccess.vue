<template>
<span>
    <b-badge v-if="access == 'public'" variant="success" title="Datasets are accessible to any users but only project member can update them.">Public</b-badge>
    <b-badge v-if="access == 'private'" variant="danger" title="Only the members of project can access datasets"><icon name="lock"/> Private</b-badge>
</span>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['access'],
}
</script>
