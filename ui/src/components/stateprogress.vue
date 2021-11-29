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
            return this.states_sorted.reduce((sum,v)=>sum+v.count, 0);
        },
        states_sorted() {
            let order = [
                "requested", 
                "running", 
                "running_sync", 
                "failed", 
                "finished", 
                "stopped", 
                //"remove_requested", 
                //"removed"
            ];
            let sorted = [];
            if(!this.states) return sorted;
            order.forEach(state=>{
                if(this.states[state]) sorted.push({state: state, count: this.states[state]});
            });

            //don't show any other states.. probably we don't care
            //add states not listed in order at the end
            /*
            for(let state in this.states) {
                if(!order.includes(state)) sorted.push({state: state, count: this.states[state]});
            }
            */

            return sorted;
        },

    },
    methods: {
        getvariant(state) {
            switch(state) {
            case "requested": return "info";
            case "running": return "primary";
            case "running_sync": return "primary";
            case "failed": return "danger";
            case "finished": return "success";
            case "stopped": return "secondary";
            default: return "dark";
            }
        },
        isanimated(state) {
            //animating progress bar causes high cpu usage on xps15
            //https://github.com/twbs/bootstrap/issues/5148
            return false;

            /*
            switch(state) {
            case "running": 
            case "requested":           
                return true;
            }
            return false;
            */
        },
        label(item) {
            if(!this.show_label) return null;
            return item.count.toString();  
        },
    },
}
</script>

<style scoped>
</style>
