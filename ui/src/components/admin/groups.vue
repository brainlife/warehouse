<template>
<div>
    <b-container>
        <div style="background-color: white; padding: 10px">
            <b-form-input v-model="query" type="text" placeholder="Search Groups"
            @input="changeQueryDebounce" class="input"/>
            <br>
            <b-pagination v-model="currentPage" :total-rows="totalrowCount" :per-page="perPage" aria-controls="my-table"/>
                <b-table :tbody-tr-class="rowClass" hover small
                    :items="groups"
                    :fields="fields"
                    :per-page="0"
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
                <b-pagination v-model="currentPage" :total-rows="totalrowCount" :per-page="perPage" aria-controls="my-table"/>
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
import Vue from 'vue';
let queryDebounce;
export default {
    components: {
        contactlist: ()=>import('@/components/contactlist'),
        contact: ()=>import('@/components/contact'),
    },

    data () {
        return {
            groups: [],

            fields: ["id", "active", "name", "desc", "admins", "members"],

            form: null,
            query: "",
            currentPage: 1,
            perPage: 50,
            totalrowCount: 500,
            config: Vue.config,
        }
    },

    watch: {
        query() {
            this.load();
        },
        currentPage() {
            this.load();
        }
    },

    mounted() {
        this.load();
    },
    methods: {
        rowClass(item, type) {
            if (!item || type !== 'row') return;
            if(this.form && this.form._id == item._id) return 'table-primary';
        },

        load() {
            const limit = 100;
            // if(!this.query.length) this.findGroups([]);
            this.$http.get(this.config.auth_api+'/users', {params:{
                find: JSON.stringify({
                    $or: [
                        {fullname: {$regex: this.query, $options : 'i'}},
                        {email: {$regex: this.query, $options : 'i'}},
                        {username: {$regex: this.query, $options : 'i'}}
                    ],
                }),
                limit,
            }}).then(res =>{
                this.queryGroups(res.data.users.map(user=>user._id));
            }).catch(err =>{
                this.$notify({type: 'error', text: err});
                console.error(err.response);
            })
        },
        queryGroups(userList) {
            const limit = 50;
            const skip = (this.currentPage - 1) * limit;
            const find = JSON.stringify({
                $or: [
                    {admins: {$in: userList}},
                    {members: {$in: userList}},
                ],
            });
            this.$http.get(Vue.config.auth_api+"/groups", {params: {
                find,
                skip,
                limit
            }}).then(res=>{
                this.totalrowCount = res.data.count;
                this.groups = res.data.groups;
                this.groups.forEach(group=>{
                    if(group.admins) group.admins = group.admins.map(admins=>admins.sub);
                    if(group.members) group.members = group.members.map(members=>members.sub);
                });
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err});
            });
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
            if(!this.form.name) {
                this.$notify({type: "error", text: 'Group Name can not be empty'});
                return;
            }
            if(!this.form._admins) {
                this.$notify({type: "error", text: 'Group is required to have atleast one admin'});
                return;
            }
            //convert back to numbers
            if(this.form._members) this.form.members = this.form._members.map(m=>parseInt(m));
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
        clearQuery() {
            this.query = '';
            this.changeQuery();
        },
        changeQueryDebounce() {
            clearTimeout(queryDebounce);
            queryDebounce = setTimeout(this.changeQuery, 300);
        },
        changeQuery() {
            this.load();
        },
    },
}
</script>
<style scoped>

</style>