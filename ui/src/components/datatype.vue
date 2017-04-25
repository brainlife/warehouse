<template>
<el-card class="box-card">
    <div slot="header">
        <el-row>
            <el-col :span="6">
                <b>{{id}}</b>
            </el-col>
            <el-col :span="18">
                <span>{{datatype.name}}</span> 
                <small class="text-muted">({{datatype.desc}})</small>
                <tags :tags="datatype_tags"></tags>
            </el-col>
        </el-row>
    </div>

    <el-row :gutter="20">
    <el-col :span="6" v-for="file in datatype.files" :key="file.id">
        <el-card class="file">
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
    props: [ 'datatype', 'datatype_tags', 'id'],
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
