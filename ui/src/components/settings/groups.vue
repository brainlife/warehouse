<template>
<div>
    <b-container>
        <!--
        <b-form-input v-model="queryGroup" type="text" placeholder="Search Groups" class="input"/>
        -->
        <div style="background-color: white; padding: 10px;">
            <b-pagination v-model="currentPage" :total-rows="groups.length" :per-page="perPage" aria-controls="my-table"/>
            <b-table :tbody-tr-class="rowClass" hover small 
                :items="groups" 
                :fields="fields" 
                :per-page="perPage" 
                :current-page="currentPage"
                @row-clicked="selectGroup" v-b-modal.modal-groupedit>
                <template #cell(active)="data">
                    <b-badge variant="success" v-if="data.item.active">✓</b-badge>
                </template>
                <template #cell(admins)="data">
                    <contact v-for="c in data.item.admins" :key="c._id" :id="c.toString()" size="tiny"/>
                </template>
                <template #cell(members)="data">
                    <contact v-for="c in data.item.members" :key="c._id" :id="c.toString()" size="tiny"/>
                </template>
            </b-table>
            <b-pagination v-model="currentPage" :total-rows="groups.length" :per-page="perPage" aria-controls="my-table"/>
        </div>

        <b-modal v-if="form" id="modal-groupedit" :title="form.name||'(Untitled)'" @ok="submit">
            <b-form-checkbox v-model="form.active">Active</b-form-checkbox>
            <span class="form-header">Name</span>
            <b-form-input v-model="form.name"/>
            <span class="form-header">Admins</span>
            <contactlist v-model="form._admins"></contactlist>
            <span class="form-header">Members</span>
            <contactlist type="text" v-model="form._members"></contactlist>
            <small>* project admins/members are stored in project collection also</small>
            <span class="form-header">Description</span>
            <b-form-textarea v-model="form.desc" rows="8"/>
        </b-modal>
    </b-container>
    <b-button class="button-fixed" @click="newgroup">
        New Group
    </b-button>
    
</div>
</template>

<script>

import Vue from 'vue'

export default {
    components: { 
        contactlist: ()=>import('@/components/contactlist'),
        contact: ()=>import('@/components/contact'),
    },

    data () {
        return {
            groups: [],
            //filteredGroups: [],

            fields: ["id", "active", "name", "desc", "admins", "members"],

            form: null,

            currentPage: 1,
            perPage: 50,

            config: Vue.config,
        }
    },

    mounted() {
        //TODO - update to lazy fetch groups in the page
        this.$http.get(Vue.config.auth_api+"/groups").then(res=>{
            this.groups = res.data;
            this.groups.forEach(group=>{
                if(group.admins) group.admins = group.admins.map(admins=>admins.sub);
                if(group.members) group.members = group.members.map(members=>members.sub);
            });
        }).catch(err=>{
            console.error(err.response);
            this.$notify({type: "error", text: err});
        });
    },

    methods: {
        rowClass(item, type) {
            if (!item || type !== 'row') return;
            if(this.form && this.form._id == item._id) return 'table-primary';
        },

        selectGroup(group) {
            console.dir(group);
            this.form = JSON.parse(JSON.stringify(group)); //deep copy

            //all service other than auth deals with sub in string
            //we will update auth service to use string eventually 
            this.form._members = this.form.members.map(m=>m.toString());
            this.form._admins = this.form.admins.map(m=>m.toString());
        },

        closeModal() {
            this.$root.$emit('bv::hide::modal', 'modal-groupedit')
        },

        submit(e) {
            //e.preventDefault();

            //TODO validate?

            //convert back to numbers
            this.form.members = this.form._members.map(m=>parseInt(m));
            this.form.admins = this.form._admins.map(m=>parseInt(m));

            if(this.form.id) {
                //update
                this.$http.put(Vue.config.auth_api+"/group/"+this.form.id,this.form).then(res=>{
                    this.$notify({type: "success", text: res.data.message});

                    const group = this.groups.find(g=>g._id == this.form._id);
                    Object.assign(group, this.form);
                    this.closeModal();
                }).catch(this.handleError);                
            } else {
                //create new group
                this.$http.post(Vue.config.auth_api+"/group/",this.form).then(res=>{
                    this.$notify({type: "success", text: res.data.message});
                    this.groups.push(this.form);
                    this.closeModal();
                }).catch(this.handleError);
            }
        },

        handleError(err) {
            console.error(err);
            if(err.response && err.response.data && err.response.data.message) {
                this.$notify({type: "error", text: err.response.data.message});
            }
        },

        newgroup() {
            this.form = {
                name : "",
                desc : "",
                admins: [Vue.config.user.sub],
                members: [],
                active: true,
            }
            this.$nextTick(()=>{
                this.$root.$emit('bv::show::modal', 'modal-groupedit')
            });
        },

        /*
        queryGroup: function() {
            this.applyFilterGroup();
        },
        */

    },
}

</script>
<style scoped>
.form-header {
    margin-top: 7px;
}
</style>

