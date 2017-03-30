<template>
<div class="ui segment">
    <div class="ui top attached label">
        {{datatype.name}} / {{datatype.desc}}
    </div>

    <el-row v-if="datatype_tags && datatype_tags.length > 0">
        <el-col :span="4">
            <h5>Datatype Tags</h5>
        </el-col>
        <el-col :span="20">
            <tags :tags="datatype_tags"></tags>
            <br>
        </el-col>
    </el-row>

    <el-row v-if="datatype.meta">
        <el-col :span="4">
            <h5>Metadata</h5>
        </el-col>
        <el-col :span="20">
            <p>
                <el-tag v-for="m in datatype.meta" key="m.id"><b>{{m.id}}</b> ({{m.type}}) <span v-if="m.required">*</span></el-tag>
            </p>
            <br>
        </el-col>
    </el-row>

    <el-row>
        <el-col :span="4">
            <h5>Files</h5>
        </el-col>
        <el-col :span="20">
            <div class="ui segment" v-for="file in datatype.files">
                <i class="file outline icon" v-if="file.filename"></i>
                <i class="folder icon" v-if="file.dirname"></i>
                {{file.filename||file.dirname}}
            </div>
            <br>
        </el-col>
    </el-row>
</div>
</template>

<script>
import tags from '@/components/tags'

export default {
    components: { tags },
    props: [ 'datatype', 'datatype_tags'],
    computed: {
    }
}
</script>
