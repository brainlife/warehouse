<template>
<v-select v-model="selected" :options="datatypes" label="name" v-if="datatypes">
    <template slot="option" slot-scope="datatype">
        <datatype :datatype="datatype" :clickable="false"/>
    </template>
</v-select>
<!--
<el-select v-model="selected" placeholder="Select" v-if="datatypes">
    <el-option v-for="datatype in datatypes" :key="datatype._id" :label="datatype.name" :value="datatype._id">
        <datatype :datatype="datatype"/>
    </el-option>
</el-select>
-->
</template>

<script>
import Vue from 'vue'

import datatypefile from '@/components/datatypefile'
import datatype from '@/components/datatype'

export default {
    components: { datatype },
    props: [ 'value' ],
    
    data () {
        return {
            selected: null,
            datatypes: null,
        };
    },
    
    mounted () {
        this.$http.get('datatype', {params: {
            limit: 0,
            skip: 0,
            sort: 'name'
        }})
        .then(res => {
            this.datatypes = res.data.datatypes;
            this.datatypes.forEach(datatype => {
                if (datatype._id == this.value) {
                    this.selected = datatype;
                }
            })
        })
        .catch(err => {
            console.error(err);
        });
    },
    
    watch: {
        "selected": function(v) {
            let value = null;
            if (this.selected) value = this.selected._id;
            if(this.value != value) this.$emit('input', value);
        }
    },
}
</script>
