'use strict';

import Vue from 'vue'

export default {
    data() {
        return {
            splitter_pos: parseInt(window.localStorage.getItem("splitter_pos")) || 600,
            draggins: false,
            start_x: 0,
            offset_x: 0,
        }
    },
    methods: {
        init_splitter() {
            let splitter = this.$refs.splitter;
            if(!splitter) {
                console.error("refs.splitter not initialized");
                return;
            }
            //  disables context menu for mobile
            splitter.addEventListener("contextmenu", function(event) {
                event.preventDefault();
                event.stopPropagation(); // not necessary in my case, could leave in case stopImmediateProp isn't available?
                event.stopImmediatePropagation();
                return false;
            });
            //  works on all devices
            splitter.addEventListener("pointerdown", this.down);
            //  only works on browser
            window.addEventListener("pointerup", this.up);
            window.addEventListener("dragend", this.up);
            window.addEventListener("mousemove", this.move);
            splitter.addEventListener('touchstart', this.move, {passive: true});
            //  only works on mobile
            splitter.addEventListener("touchend", this.up, { passive: true});
            //  only works on mobile
            splitter.addEventListener("touchmove", this.move, { passive: true});
        },
        down(e) {
            const x = e.clientX || e.touches[0].clientX;
            // console.log('down', x);
            this.dragging = true;
            this.offset_x = e.offsetX;
            this.start_x = x - this.splitter_pos;
            document.body.classList.add("dragging");
        },
        up(event) {
            if(!this.dragging) return;
            this.dragging = false;
            document.body.classList.remove("dragging");
        },
        move(e) {
            const x = e.clientX || e.touches[0].clientX;
            if(!this.dragging) return;
            let new_x = x + this.start_x - this.offset_x*2;
            if(new_x < 400) new_x = 400;
            this.splitter_pos = new_x;
        },
    }
}
