<script>
export default {
    props: ['task', 'subdir'],
    mounted() {
        console.log("computing volumeviewer url");
        var subdir_string = '';
        if (this.subdir) subdir_string = '&sdir='+encodeURIComponent(this.subdir);
        document.location = '/ui/volumeviewer'+'?task='+this.task._id+subdir_string;
    },
}
</script>
