<template>
<span>
    <!--task status-->
    <icon v-if="status == 'finished'" :scale="scale" name="check"/>
    <icon v-if="status == 'waiting'" :scale="scale" name="hourglass-start"/>
    <icon v-if="status == 'running'" :scale="scale" name="cog" spin/>
    <icon v-if="status == 'running_sync'" :scale="scale" name="cog" spin/>
    <icon v-if="status == 'requested'" :scale="scale" name="hourglass-half"/>
    <icon v-if="status == 'failed'" :scale="scale" name="exclamation-circle"/>
    <icon v-if="status == 'removed'" :scale="scale" name="trash"/>
    <icon v-if="status == 'stop_requested'" :scale="scale" name="hand-paper-o"/>
    <icon v-if="status == 'stopped'" :scale="scale" name="hand-paper-o"/>
    <icon v-if="status == null" :scale="scale" name="question"/>

    <!--resource status-->
    <icon v-if="status == 'ok'" :scale="scale" name="check"/>
</span>
</template>

<script>
export default {
    props: [ 'status', 'scale' ],
}
</script>
