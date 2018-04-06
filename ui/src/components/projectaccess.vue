<template>
<span>
    <b-badge v-if="access == 'public'" variant="success" title="Public: Datasets are accessible to any users but only project member can update them."><icon name="unlock"/></b-badge>
    <b-badge v-if="access == 'private'" variant="danger" title="Private: Only the members of project can access datasets"><icon name="lock"/></b-badge>
</span>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['access'],
}
</script>
