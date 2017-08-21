<template>
<div ref="network">
    <!-- TODO -->
</div>
</template>

<script>

import Vue from 'vue'
import vis from 'vis'

export default {
    data() {
        return {
            network: null,
            
            nodes: {},
            edges: {},
            
            options: {}
        }
    },
    mounted () {
        this.nodes = [
            { id: 1, label: 'Node 1' },
            { id: 2, label: 'Node 2' },
            { id: 3, label: 'Node 3' },
            { id: 4, label: 'Node 4' }
        ];

        // create an array with edges
        this.edges = [
            { from: 1, to: 3 },
            { from: 1, to: 2 },
            { from: 2, to: 4 }
        ];
        this.updateNetwork();
    },
    methods: {
        updateNetwork: function() {
            this.network = new vis.Network(this.$refs.network,
                                { nodes: new vis.DataSet(this.nodes),
                                  edges: new vis.DataSet(this.edges) },
                                this.options);
            
        }
    }
}

</script>