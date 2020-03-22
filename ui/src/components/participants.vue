<template>
<div class="participants">
    <div class="table-responsive">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th scope="col" @click="updateSort('subject')" class="header" :class="{headerSorted: sort == 'subject'}">
                        subject&nbsp;
                        <span style="width: 15px;">
                            <icon name="caret-up" v-if="sort == 'subject' && sort_reverse"/>
                            <icon name="caret-down" v-if="sort == 'subject' && !sort_reverse"/>
                        </span>
                    </th>
                    <th scope="col" @click="updateSort(key)" v-for="(column, key) in columns" :key="key" class="header" :class="{headerSorted: sort == key}">
                        {{column.LongName}}
                        &nbsp;
                        <span style="width: 15px;">
                            <icon name="caret-up" v-if="sort == key && sort_reverse"/>
                            <icon name="caret-down" v-if="sort == key && !sort_reverse"/>
                        </span>
                    </th>
                    <!--
                    <th class="header" style="text-align: right; width: 110px;">
                        <b-button size="sm"><icon name="edit"/> Columns</b-button>
                    </th>
                    -->
                </tr>
            </thead>
            <tbody>
                <tr v-for="subject in subjects" :key="subject">
                    <th scope="row">{{subject}}</th>
                    <td v-for="(column,k) in columns" :key="k">
                        <!--<input type="text" v-model="rows[subject][k]"/>-->
                        {{rows[subject][k]}}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <!--
    <b-table hover :item="rows"/>
    {{columns}}
    {{rows}}
    -->
</div>
</template>

<script>

import Vue from 'vue'

/*
import projectaccess from '@/components/projectaccess'
import projectavatar from '@/components/projectavatar'
import datatypetag from '@/components/datatypetag'
import contact from '@/components/contact'
import stateprogress from '@/components/stateprogress'
*/

export default {
    components: {
        //projectavatar, contact, projectaccess, datatypetag, stateprogress,
    },

    props: {
        rows: { type: Object },
        columns: { type: Object },
    },

    data() {
        return {
            sort: 'subject', //column to sort by default
            sort_reverse: false, //sort in reverse
            config: Vue.config,
        }
    },

    mounted() {
        //add missing columns
        for(let subject in this.rows) {
            let row = this.rows[subject]; 
            let keys = Object.keys(row);
            keys.forEach(key=>{
                if(!this.columns[key]) {
                    this.columns[key] = {LongName: key};
                }
            });
        }
    },

    computed: {
        subjects() {
            return Object.keys(this.rows);
        },
    },

    methods: {
        updateSort(key) {
            if(this.sort == key) this.sort_reverse = !this.sort_reverse;
            else this.sort = key;
            
            this.subjects.sort((a,b)=>{
                if(this.sort != "subject") {
                    a = this.rows[a][this.sort];
                    b = this.rows[b][this.sort];
                }
                if(typeof a == 'string') {
                    if(this.sort_reverse) return b.localeCompare(a);
                    else return a.localeCompare(b);
                } else {
                    if(this.sort_reverse) return b-a;
                    else return a-b;
                }
            });
        },
    },
}
</script>

<style scoped>
/*
.participants {
position: fixed;
top: 95px;
bottom: 0;
left: 40px;
right: 0;
overflow-y: scroll;
}
*/
.table .header {
cursor: pointer;
font-size: 80%;
}
.table tbody {
background-color: white;
}
.table input {
width: 100%;
border: none;
}

.table .headerSorted {
color: #2693ff;
}
</style>
