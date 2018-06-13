<template>
<div v-if='datatypes'>
    <v-select v-model="selected" :options="datatypes" label="name" placeholder="datatype">
        <template slot="option" slot-scope="datatype">
            <div class="item">
                <div class='datatype_name' :style="{ background: make_color(datatype.name) }">
                    {{get_short_name(datatype.name)}}
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
        </template>
    </v-select>
</div>
</template>

<script>
import Vue from 'vue'
import vSelect from 'vue-select'

import datatypetag from '@/components/datatypetag'
import datatypefile from '@/components/datatypefile'
import datatypecolor from '@/mixins/datatypecolor'

export default {
    components: { vSelect, datatypetag, datatypefile },
    props: [ 'value' ],
    mixins: [ datatypecolor ],
    
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
        "selected": function() {
            let value = null;
            if (this.selected) value = this.selected._id;
            
            this.$emit('input', value);
        }
    },
    
    methods: {
        get_short_name: function(name) {
            if (name.indexOf("/") == -1) return name;
            return name.substring(name.indexOf("/") + 1);
        }
    }
}
</script>

<style scoped>
.item {
    font-size:15px;
    text-overflow:ellipsis;
    overflow:hidden;
    white-space:normal !important;
}
.datatype_name {
    display:inline-block;
    color:white;
    padding-left:5px;
    padding-right:5px;
}
</style>