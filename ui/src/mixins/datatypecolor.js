'use strict';

export default {
    /*
    created: function () {
    },
    */
    data: function() {
        return {
            user_agreements: {},
        }
    },
    created: function() {
        console.log("mixin/agreement created");
        this.load_agreement();
        this.$root.$on("agreements.updated", (id, b)=>{
            Vue.set(this.user_agreements, id, b);
        });
    },

    methods: {
        make_color: function(name) {
            //map datatype.name to 0 - 360
            if(!name) return "#666";
            let hash = name.split("").reduce(function(a,b){
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);
            let numhash = Math.abs(hash + 120) % 360;
            return "hsl(" + (numhash % 360) + ", 50%, 60%)";
        }
    }
}


