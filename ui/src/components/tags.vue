<template>
<div class="ui labels">
    <a class="ui label" v-for="tag in deco_tags" :class="{red: tag.neg}">
        <i class="minus circle icon" v-if="tag.neg"></i>
        {{tag.name}}
    </a>
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
