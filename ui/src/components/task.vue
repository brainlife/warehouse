<template>
<div>
    <!--status-->
    <div class="ui icon message">
        <i class="notched circle loading icon blue" v-if="task.status == 'running'"></i>
        <i class="check icon green" v-if="task.status == 'finished'"></i>
        <i class="wait icon" v-if="task.status == 'requested'"></i>
        <i class="warning icon red" v-if="task.status == 'failed'"></i>
        <div class="content">
            <div class="header"> {{task.name}} <span class="ui label small">{{task.service}}</span> </div>
            <p>{{task.status_msg}}</p>
        </div>
    </div>
    <!--
    <div class="ui right aligned small segments">
        <div class="ui segment">
          <div class="ui right floated"><time>Requested {{task.start_date|date}}</time></div>
        </div>
        <div class="ui segment">
          <div class="ui right floated"><time>Started {{task.start_date|date}}</time></div>
        </div>
        <div class="ui segment">
          <div class="ui right floated"><time>Finished {{task.finish_date|date}}</time></div>
        </div>
    </div>
    -->

    {{task.desc}}

    <div class="ui accordion">
        <div class="title actgive">
            <i class="dropdown icon"></i> 
            Configuration
        </div>
        <div class="content">
            <pre v-highlightjs><code class="json hljs">{{task.config}}</code></pre>
        </div>

        <div class="title actgive">
            <i class="dropdown icon"></i> 
            Output
        </div>
        <div class="content">
            <filebrowser v-if="task.resource_id" :task="task"></filebrowser>
        </div>
    </div>

    <!--
    <div v-if="task.products">
        <h3>Products</h3>
        <pre v-highlightjs><code class="json hljs">{{task.products}}</code></pre>
    </div>
    -->
    <br>
</div>
</template>

<script>
import Vue from 'vue'

import filebrowser from '@/components/filebrowser'

export default {
    components: { filebrowser },
    name: "contact",
        data () {
        return {
        }
    },
    computed: {
    },
    mounted: function() {
        $(this.$el).find('.ui.accordion').accordion();
    },
    methods: {
    },
    props: ['task'],
}
</script>
