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
                        {{column.LongName||key}}&nbsp;<span style="width: 15px;">
                            <icon name="caret-up" v-if="sort == key && sort_reverse"/>
                            <icon name="caret-down" v-if="sort == key && !sort_reverse"/>
                        </span>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="subject in subject_names" :key="subject">
                    <th scope="row">{{subject}}</th>
                    <td v-for="(column,k) in columns" :key="k">
                        {{subjects[subject][k]}}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        subjects: { type: Array },
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
        for(let subject in this.subjects) {
            let row = this.subjects[subject]; 
            let keys = Object.keys(row);
            keys.forEach(key=>{
                if(!this.columns[key]) {
                    this.columns[key] = {LongName: key};
                }
            });
        }
    },

    computed: {
        subject_names() {
            return Object.keys(this.subjects);
        },
    },

    methods: {
        updateSort(key) {
            if(this.sort == key) this.sort_reverse = !this.sort_reverse;
            else this.sort = key;
            
            this.subjects_names.sort((a,b)=>{
                if(this.sort != "subject") {
                    a = this.subjects[a][this.sort];
                    b = this.subjects[b][this.sort];
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
.table .header {
    cursor: pointer;
    font-size: 80%;
    font-weight: normal;
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
