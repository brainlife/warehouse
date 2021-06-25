'use strict';

import Vue from 'vue'

export default {
    data() {
        return {
            splitter_pos: parseInt(window.localStorage.getItem("splitter_pos"))||600,
        }
    },
    methods: {
        init_splitter() {
            let splitter = this.$refs.splitter;

            if(!splitter) {
                console.error("refs.splitter not initialized");
                return;
            }

            let start_x;
            let new_x;
            let offset_x;

            splitter.onpointerdown = e=>{
                splitter.onpointermove = e=>{
                    new_x = e.clientX + start_x - offset_x*2;
                    if(new_x < 400) new_x = 400;
                    this.splitter_pos = new_x;  
                };
                splitter.setPointerCapture(e.pointerId);    
                offset_x = e.offsetX;
                start_x = e.clientX - this.splitter_pos;
            };

            splitter.onpointerup = e=>{
                window.localStorage.setItem("splitter_pos", this.splitter_pos);
                splitter.onpointermove = null;
                splitter.releasePointerCapture(e.pointerId);
            };
        },
    }
}
