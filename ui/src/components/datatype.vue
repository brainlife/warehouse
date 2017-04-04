<template>
<div class="ui segment">
    <div class="ui top attached label">
        {{datatype.name}} <small>{{datatype.desc}}</small>
    </div>

    <!--
    <el-row v-if="datatype_tags && datatype_tags.length > 0">
        <el-col :span="4">
            <h5>Datatype Tags</h5>
        </el-col>
        <el-col :span="20">
            <tags :tags="datatype_tags"></tags>
        </el-col>
    </el-row>
    -->
    <tags :tags="datatype_tags"></tags>

    <!--
    <el-collapse v-model="activeSections">
        <el-collapse-item title="Metadata" name="meta">
            <el-tag v-for="m in datatype.meta" key="m.id"><b>{{m.id}}</b> ({{m.type}}) <span v-if="m.required">*</span></el-tag>
        </el-collapse-item>
        <el-collapse-item title="Files" name="files">
            <div class="ui segment" v-for="file in datatype.files">
                <i class="file outline icon" v-if="file.filename"></i>
                <i class="folder icon" v-if="file.dirname"></i>
                {{file.filename||file.dirname}}
            </div>
        </el-collapse-item>
    </el-collapse>
    -->
    <div class="ui segment" v-for="file in datatype.files">
        <i class="file outline icon" v-if="file.filename"></i>
        <i class="folder icon" v-if="file.dirname"></i>
        {{file.filename||file.dirname}}
    </div>
</div>
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
