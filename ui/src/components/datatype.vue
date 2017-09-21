<template>
<el-card class="box-card" v-if="datatype">
    <div slot="header">
        <el-row>
            <el-col :span="6">
                <datatypetag :datatype="datatype" :tags="datatype_tags"/>
            </el-col>
            <el-col :span="18">
                <b>{{id}}</b>
                <small class="text-muted">({{datatype.desc}})</small>
            </el-col>
        </el-row>
    </div>

    <!--<small>Files</small>-->
    <el-row :gutter="20">
    <el-col :span="6" v-for="file in datatype.files" :key="file.id">
        <div style="margin-bottom: 8px;">
            <span v-if="file.filename"><icon name="file-o"></icon> <b>{{file.id}}</b> 
                    <small class="text-muted"><code>{{file.filename}}</code></small></span>
            <span v-if="file.dirname"><icon name="folder"></icon> <b>{{file.id}}</b> 
                    <small class="text-muted"><code>{{file.dirname}}</code></small>
            </span>
        </div>
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

<style scoped>
.file {
margin-bottom: 10px;
}
</style>
