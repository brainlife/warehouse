<template>
<div v-if="datatype">
    <datatypetag :datatype="datatype" :tags="datatype_tags" :title="id" :clickable="clickable"/> 
    <slot name="tag_extra"/>
    <p style="margin-bottom: 0px;"><small style="opacity:.7;">{{datatype.desc}}</small></p>
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
        clickable: { type: Boolean, default: true, },
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
    },
    /*
    methods: {
        click() {
            this.$router.push('/datatypes/'+this.datatype._id);
        },
    }
    */
}
</script>

<style scoped>
</style>
