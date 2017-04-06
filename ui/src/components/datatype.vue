<template>
<el-card class="box-card">
    <div slot="header" class="clearfix">
       <b>{{datatype.name}}</b> | <small>{{datatype.desc}}</small>
    </div>

    <tags :tags="datatype_tags"></tags>

    <div class="ui segment" v-for="file in datatype.files">
        <i class="file outline icon" v-if="file.filename"></i>
        <i class="folder icon" v-if="file.dirname"></i>
        {{file.filename||file.dirname}}
    </div>
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
