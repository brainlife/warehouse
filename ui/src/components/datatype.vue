<template>
<b-card v-if="datatype" style="margin-bottom: 5px">
    <div slot="header">
        <b style="opacity: 0.5;">{{id}}</b>
        <datatypetag :datatype="datatype" :tags="datatype_tags"/>
        <small class="text-muted">{{datatype.desc}}</small>
    </div>

    <b-row>
    <b-col cols="4" v-for="file in datatype.files" :key="file.id" :class="{'text-muted': !file.required}">
        <span v-if="file.filename">
            <icon name="file-o"></icon> 
            {{file.filename}}
        </span>
        <span v-if="file.dirname">
            <icon name="folder"></icon> 
            {{file.dirname}}
        </span>
        <span v-if="!file.required">(optional)</span>
    </b-col>
    </b-row>
</b-card>
</template>

<script>
import tags from '@/components/tags'
import datatypetag from '@/components/datatypetag'

export default {
    components: { tags, datatypetag },
    props: ['datatype', 'datatype_tags', 'id'],
    data() {
        return {
            activeSections: ['files']
        }
    }

}
</script>

<style scoped>
.file {
margin-bottom: 10px;
}
</style>
