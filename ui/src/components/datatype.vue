<template>
<el-card class="box-card" v-if="datatype">
    <div slot="header">
        <datatypetag :datatype="datatype" :tags="datatype_tags"/>
        <b-badge>{{id}}</b-badge>
        <small class="text-muted">{{datatype.desc}}</small>
    </div>

    <el-row :gutter="20">
    <el-col :span="6" v-for="file in datatype.files" :key="file.id">
        <span v-if="file.filename">
            <icon name="file-o"></icon> 
            {{file.id}}
            <small class="text-muted"><code>{{file.filename}}</code></small>
        </span>
        <span v-if="file.dirname">
            <icon name="folder"></icon> 
            {{file.id}}
            <small class="text-muted"><code>{{file.dirname}}</code></small>
        </span>
    </el-col>
    </el-row>

    <slot></slot>
</el-card>
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
