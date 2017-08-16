<template>
<span>
    <icon v-if="status == 'finished'" :scale="scale" name="check" class="statusicon-finished"></icon>
    <icon v-if="status == 'running'" :scale="scale" name="cog" spin class="statusicon-running"></icon>
    <icon v-if="status == 'requested'" :scale="scale" name="hourglass-o" class="statusicon-requested"></icon>
    <icon v-if="status == 'failed'" :scale="scale" name="exclamation-circle" class="statusicon-failed"></icon>
    <icon v-if="status == 'removed'" :scale="scale" name="trash" class="statusicon-removed"></icon>
    <icon v-if="status == 'stop_requested'" :scale="scale" name="hand-paper-o" class="statusicon-stop_requested"></icon>
    <icon v-if="status == 'stopped'" :scale="scale" name="hand-paper-o" class="statusicon-stopped"></icon>
    <icon v-if="status == null" :scale="scale" name="question" class="statusicon-unknown"></icon>
</span>
</template>

<script>
export default {
    props: [ 'status', 'scale' ],
}
</script>
