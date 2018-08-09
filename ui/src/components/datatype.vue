<template>
<div v-if="datatype" class="datatype">
    <div class="header">
        <datatypetag :datatype="datatype" :tags="datatype_tags" :title="id"/>
        <small class="text-muted">{{datatype.desc}}</small>
    </div>
    <div class="body">
        <b-row>
            <b-col cols="4" v-for="file in datatype.files" :key="file.id" :class="{'text-muted': !file.required}">
                <datatypefile :file="file"/>
            </b-col>
        </b-row>
    </div>
</div>
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

<style scoped>
.datatype {
box-shadow: 1px 1px 2px rgba(0,0,0,0.10);
}
.header {
padding: 10px;
}
.body {
padding: 10px;
background-color: white;
}
</style>


