<template>
<el-card class="box-card">
    <div slot="header">
       <span style="font-weight: 600;">{{datatype.desc}}</span> <span class="text-muted">({{datatype.name}})</span>
        <tags :tags="datatype_tags"></tags>
    </div>

    <el-row :gutter="20">
    <el-col :span="6" v-for="file in datatype.files" :key="file.id">
        <el-card class="file">
            <i class="file outline icon" v-if="file.filename"></i>
            <i class="folder icon" v-if="file.dirname"></i>
            <span v-if="file.filename"><icon name="file-o"></icon> {{file.filename}}</span>
            <span v-if="file.dirname"><icon name="folder"></icon> {{file.dirname}}</span>
        </el-card>
    </el-col>
    </el-row>
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
