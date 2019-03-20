<template> 
<b-progress :max="max" :height="height" class="stateprogress">
    <b-progress-bar v-for="item in states_sorted" :key="item.state"
        :variant="getvariant(item.state)" 
        :animated="isanimated(item.state)"
        :value="item.count" 
        :label="label(item)" 
        :title="item.count+' '+item.state"/>
</b-progress>
</template>

<script>
export default {
    props: {
        states: Object,
        height: String,
        show_label: {
            type: Boolean,
            default: true,
        },
    }, //{running: 2, finished: 3, etc..}
    computed: {
        max() {
            if(!this.states) return 0;
            return Object.values(this.states).reduce((sum,v)=>sum+v, 0);
        },
        states_sorted() {
            let order = ["requested", "running", "running_sync", "failed", "finished", "stopped", "remove_requested", "removed"];
            let sorted = [];
            if(!this.states) return sorted;
            order.forEach(state=>{
                if(this.states[state]) sorted.push({state: state, count: this.states[state]});
            });

            //add states not listed in order at the end
            for(let state in this.states) {
                if(!order.includes(state)) sorted.push({state: state, count: this.states[state]});
            }

            return sorted;
        },

    },
    methods: {
        getvariant(state) {
            switch(state) {
            case "running": return "primary";
            case "requested": return "info";
            case "finished": return "success";
            case "stopped": return "secondary";
            case "failed": return "danger";
            default: return "dark";
            }
        },
        isanimated(state) {
            switch(state) {
            case "running": 
            case "requested":           
                return true;
            }
            return false;
        },
        label(item) {
            if(!this.show_label) return null;
            return item.count.toString();  
        },
    },
}
</script>

<style scoped>
.bg-info {
background-color: #50bfff !important;
}
</style>
