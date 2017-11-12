<script>
export default {
    props: ['task', 'subdir'],
    mounted() {
        var subdir_string = '';
        if (this.subdir) subdir_string = '&sdir='+encodeURIComponent(this.subdir);
        document.location = '/ui/surfaceview'+ '?free='+this.task._id+subdir_string;
    }
}
</script>

