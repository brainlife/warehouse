<template>
<el-card class="box-card">
    <div slot="header">
        <el-row>
            <el-col :span="6">
                <span>{{datatype.name}}</span> 
            </el-col>
            <el-col :span="18">
                <b>{{id}}</b>
                <small class="text-muted">({{datatype.desc}})</small>
                <tags :tags="datatype_tags"></tags>
            </el-col>
        </el-row>
    </div>

    <el-row :gutter="20">
    <el-col :span="6" v-for="file in datatype.files" :key="file.id">
        <el-card class="file">
            <span v-if="file.filename"><icon name="file-o"></icon> <b>{{file.id}}</b> <small class="text-muted">{{file.filename}}</small></span>
            <span v-if="file.dirname"><icon name="folder"></icon> <b>{{file.id}}</b> <small class="text-muted">{{file.dirname}}</small></span>
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
