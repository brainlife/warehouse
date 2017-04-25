<template>
<div style="display: inline-block;">
    <el-tag v-for="(tag, i) in deco_tags" :type="tag.neg?'danger':'gray'" :key="i">
        <icon name="ban" v-if="tag.neg"></icon>
        {{tag.name}}
    </el-tag>
</div>
</template>

<script>
export default {
    props: [ 'tags' ],
    computed: {
        deco_tags: function() {
            if(!this.tags) return [];
            var tags = this.tags.map(tag=>{
                var t = {name: tag};
                if(tag[0] == '!') {
                    t.neg = true;
                    t.name = t.name.substring(1);
                } 
                return t;
            });
            return tags;
       }
    }
}
</script>

<style scoped>
.el-tag {
    margin-right: 5px;
}
</style>
