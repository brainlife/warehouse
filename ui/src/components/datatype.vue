<template>
<div v-if="datatype">
    <datatypetag :datatype="datatype" :tags="datatype_tags" :title="id"/> <small style="opacity:.7;">{{datatype.desc}}</small>
    <div>
        <small v-for="(file, idx) in datatype.files" :key="file.id" style='opacity:.5;'>
            {{ idx == 0 ? '' : '&bull;' }}
            <i>{{ file.id }}:</i> {{ file.filename || file.dirname + '/' }}
        </small>
    </div>
</div>
</template>

<script>

import tags from '@/components/tags'
import datatypetag from '@/components/datatypetag'
import datatypefile from '@/components/datatypefile'

export default {
    components: { tags, datatypetag, datatypefile },
    props: {
        datatype: Object,
        datatype_tags: Array,
        id: String,
        /*
        showtag: {
            type: Boolean,
            default: true,
        }
        */
    },
    data() {
        return {
            activeSections: ['files']
        }
    }
}
</script>

<style scoped>
.datatype {
    font-size:15px;
    text-overflow:ellipsis;
    overflow:hidden;
    white-space:normal !important;
}
</style>
