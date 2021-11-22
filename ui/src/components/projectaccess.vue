<template>
<b-badge v-if="access == 'private'" 
    variant="secondary" 
    title="Private: Only the members of project can access datasets">
    <icon name="lock" scale="0.7"/>
</b-badge>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['access'],
}
</script>
