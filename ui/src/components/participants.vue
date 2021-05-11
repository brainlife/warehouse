<template>
<div class="participants">
    <table class="table table-sm">
        <thead>
            <tr>
                <th scope="col" @click="updateSort(key)" v-for="(column, key) in allcolumns" :key="key" class="header" :class="{headerSorted: sort == key}">
                    {{column.LongName||key}}&nbsp;<span style="width: 15px;">
                        <icon name="caret-up" v-if="sort == key && sort_reverse"/>
                        <icon name="caret-down" v-if="sort == key && !sort_reverse"/>
                    </span>
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="row in rows" :key="row.subject">
                <td v-for="(column,k) in allcolumns" :key="k">
                    {{row[k]}}
                </td>
            </tr>
        </tbody>
    </table>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        rows: { type: Array },
        columns: { type: Object },
    },

    data() {
        return {
            sort: 'subject', //column to sort by default
            sort_reverse: false, //sort in reverse
            config: Vue.config,
            allcolumns: null,
        }
    },

    mounted() {
        //add missing columns
        this.allcolumns = Object.assign({subject: {
            LongName: "Subject",
        }}, this.columns);
        this.rows.forEach(row=>{
            let keys = Object.keys(row);
            keys.forEach(key=>{
                if(!this.allcolumns[key]) {
                    console.log("adding missing column definition", key);
                    this.allcolumns[key] = {LongName: key};
                }
            });
        });
    },

    methods: {
        updateSort(key) {
            if(this.sort == key) this.sort_reverse = !this.sort_reverse;
            else this.sort = key;
            
            this.rows.sort((a,b)=>{
                const av = a[this.sort];
                const bv = b[this.sort];
                if(typeof av == 'string') {
                    if(this.sort_reverse) return bv.localeCompare(av);
                    else return av.localeCompare(bv);
                } else {
                    if(this.sort_reverse) return bv-av;
                    else return av-bv;
                }
            });
        },
    },
}
</script>

<style scoped>
.table .header {
    cursor: pointer;
    font-size: 80%;
    font-weight: normal;
    white-space: nowrap;
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
