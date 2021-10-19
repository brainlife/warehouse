'use strict';

import Vue from 'vue'

export default {
    data() {
        return {
<<<<<<< HEAD
            splitter_pos: parseInt(window.localStorage.getItem("splitter_pos"))||600,
=======
            splitter_pos: parseInt(window.localStorage.getItem("splitter_pos")) || 600,
>>>>>>> d988ccf231976e4db555f0b71c3eee14191c6b6c
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
<<<<<<< HEAD

            //disables context menu for mobile
            splitter.addEventListener("contextmenu", function(event) {
                event.preventDefault();
                event.stopPropagation(); // not necessary in my case, could leave in case stopImmediateProp isn't available? 
                event.stopImmediatePropagation();
                return false;
            });

            //works on all devices
            splitter.addEventListener("pointerdown", this.down);
            //only works on browser
            window.addEventListener("pointerup", this.up); 
            window.addEventListener("dragend", this.up); 
            window.addEventListener("mousemove", this.move); 

            //only works on mobile
            splitter.addEventListener("touchend", this.up); 
            //only works on mobile
            splitter.addEventListener("touchmove", this.move); 
        },
        
        down(e) {
            const x = e.clientX || e.touches[0].clientX;
            console.log('down', x);
            this.dragging = true;
            this.offset_x = e.offsetX;
            this.start_x = x - this.splitter_pos;
        },

        up(event) {
            if(!this.dragging) return;
            this.dragging = false;
        },

=======
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
>>>>>>> d988ccf231976e4db555f0b71c3eee14191c6b6c
        move(e) {
            const x = e.clientX || e.touches[0].clientX;
            if(!this.dragging) return;
            let new_x = x + this.start_x - this.offset_x*2;
            if(new_x < 400) new_x = 400;
<<<<<<< HEAD
            this.splitter_pos = new_x;  
=======
            this.splitter_pos = new_x;
>>>>>>> d988ccf231976e4db555f0b71c3eee14191c6b6c
        },
    }
}
