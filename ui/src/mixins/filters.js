import Vue from 'vue'

export default {
    methods: {
        avgRuntime(mean, std) {
            let min = Math.round((mean-std/3)/(1000*60));
            if(min < 0) min = 0;
            let max = Math.round((mean+std/3)/(1000*60));
            if(max<90) {
                return min+" - "+max+" min";
            }
            let min_hours = Math.round(min/60*10)/10;
            let max_hours = Math.round(max/60*10)/10;
            return min_hours+" - "+max_hours+" hour";
        },
    },
}
