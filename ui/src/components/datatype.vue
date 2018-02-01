<template>
<b-card v-if="datatype" style="margin-bottom: 5px">
    <div slot="header">
        <!--<b style="opacity: 0.5;">{{id}}</b>-->
        <datatypetag :datatype="datatype" :tags="datatype_tags" :title="id"/>
        <small class="text-muted">{{datatype.desc}}</small>
    </div>

    <b-row>
    <b-col cols="4" v-for="file in datatype.files" :key="file.id" :class="{'text-muted': !file.required}">
        <datatypefile :file="file"/>
    </b-col>
    </b-row>
</b-card>
</template>

<script>

import tags from '@/components/tags'
import datatypetag from '@/components/datatypetag'
import datatypefile from '@/components/datatypefile'

export default {
    components: { tags, datatypetag, datatypefile },
    props: ['datatype', 'datatype_tags', 'id'],
    data() {
        return {
            activeSections: ['files']
        }
    }
}
</script>


