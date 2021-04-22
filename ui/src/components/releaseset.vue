<template>
<div>
    <datatypetag :datatype="set.datatype" :tags="set.datatype_tags" :clickable="false"/> 
    <span v-if="set.subjects && set.subjects.length == 0">{{set.count||0}} objects ({{(set.size||0)|filesize}})</span>
</div>
</template>
<script>
import datatypetag from '@/components/datatypetag'

export default {
    props: {
        set: {type: Object},
    },
    components: {
        datatypetag,
    },
}
</script>
