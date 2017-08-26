<template>
<div style="display: inline-block;">
    <b-badge v-for="(tag, i) in deco_tags" :key="i" :variant="tag.neg?'danger':'default'">
        <icon name="ban" v-if="tag.neg" scale="0.5"></icon>
        {{tag.name}}
    </b-badge>
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
border-radius: 0;
font-size: inherit;
margin-right: 3px;
font-weight: normal;
padding: 5px;
}
.badge-default {
color: #666;
background-color: #eee;
}
</style>
