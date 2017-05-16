<template>
<span>
    <icon v-if="status == 'finished'" :scale="scale" name="check"></icon>
    <icon v-if="status == 'running'" :scale="scale" name="cog" spin></icon>
    <icon v-if="status == 'requested'" :scale="scale" name="hourglass-o"></icon>
    <icon v-if="status == 'failed'" :scale="scale" name="exclamation"></icon>
    <icon v-if="status == 'removed'" :scale="scale" name="trash"></icon>

    <icon v-if="status == 'stop_requested'" :scale="scale" name="hand-paper-o"></icon>
    <icon v-if="status == 'stopped'" :scale="scale" name="hand-paper-o"></icon>
</span>
</template>

<script>
export default {
    props: [ 'status', 'scale' ],
}
</script>
