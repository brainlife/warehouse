<template>
<div>
    <datatypetag :datatype="set.datatype" :tags="set.datatype_tags" :clickable="false"/> 
    <small v-if="set.subjects && set.subjects.length == 0">({{set.count||0}} obj <span style="opacity:0.5">|</span> {{(set.size||0)|filesize}})</small>
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
