<template>
<div v-if='datatypes'>
    <v-select v-model="selected" :options="datatypes" label="name" placeholder="datatype">
        <template slot="option" slot-scope="datatype">
            <datatype :datatype="datatype"/>
            <!--
            <div class="item">
                <div>
                    <datatypetag :datatype="datatype" :tags="[]" />
                </div>
                <div>
                    <small style="opacity:.7;">{{datatype.desc}}</small>
                </div>
                <div>
                    <small v-for="(file, idx) in datatype.files" :key="file.id" style='opacity:.5;'>
                        {{ idx == 0 ? '' : '&bull;' }}
                        {{ file.filename || file.dirname + '/' }}
                    </small>
                </div>
            </div>
            -->
        </template>
    </v-select>
</div>
</template>

<script>
import Vue from 'vue'
import vSelect from 'vue-select'

import datatypefile from '@/components/datatypefile'
import datatype from '@/components/datatype'

export default {
    components: { vSelect, datatype},
    props: [ 'value' ],
    
    data () {
        return {
            selected: null,
            datatypes: []
        };
    },
    
    mounted () {
        this.$http.get('datatype', {
            limit: 0,
            skip: 0
        })
        .then(res => {
            this.datatypes = res.body.datatypes;
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
