<template>
<div style="display: inline-block;">
    <span v-for="(tag, i) in deco_tags" :key="i" class="badge" :class="{'badge-default': !tag.neg, 'badge-danger': tag.neg}">
        <icon name="ban" v-if="tag.neg" scale="0.5"></icon>
        {{tag.name}}
    </span>
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
.badge {
padding: 5px;
margin-right: 3px;
}
.badge-default {
background-color: #999;
}
</style>
