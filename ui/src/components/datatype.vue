<template>
<el-card class="box-card">
    <div slot="header">
       <span style="font-weight: 600;">{{datatype.desc}}</span> <span class="text-muted">({{datatype.name}})</span>
        <tags :tags="datatype_tags"></tags>
    </div>

    <el-card v-for="file in datatype.files" :key="file.id" class="file">
        <i class="file outline icon" v-if="file.filename"></i>
        <i class="folder icon" v-if="file.dirname"></i>
        {{file.filename||file.dirname}}
    </el-card>
</el-card>
</template>

<script>
import tags from '@/components/tags'

export default {
    components: { tags },
    props: [ 'datatype', 'datatype_tags'],
    computed: {
    },
    data() {
        return {
            activeSections: ['files']
        }
    }

}
</script>

<style scope>
.file {
margin-bottom: 10px;
}
</style>
