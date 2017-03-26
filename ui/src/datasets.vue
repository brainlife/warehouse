<template>
<div>
    <sidemenu active="datasets"></sidemenu>
    <!--
    <div class="ui top fixed menu">
        Top Fixed
        </div>
    -->
    <div class="ui pusher"> <!-- main view -->
        <div class="margin20" :class="{rightopen: selected_count}">
            <div class="ui fluid category search">
                <button class="ui right floated primary button" @click="go('/data/upload')">
                    <i class="ui icon add"></i> Upload
                </button>
                <div class="ui icon input">
                    <input class="prompt" type="text" v-model="query" placeholder="Search ...">
                    <i class="search icon"></i>
                </div>
                <div class="results"></div>
            </div>

            <table class="ui compact definition table">
            <thead>
                <tr>
                    <th style="width: 25px; background-color: #f0f0f0; box-shadow: -1px -1px 0 1px #f0f0f0;"></th>
                    <th></th>
                    <th>Data Type</th>
                    <th style="min-width: 200px;">Project</th>
                    <th>Name/Desc</th>
                    <th>Tags</th>
                    <th style="min-width: 150px;">Create Date</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="dataset in filtered_datasets" :class="{dataset: true, selected: selected[dataset._id]}">
                    <td>
                        <div class="ui checkbox">
                            <input type="checkbox" :checked="selected[dataset._id]" @click="check(dataset)">
                            <label></label><!-- need this somehow-->
                        </div>
                    </td>
                    <td>
                          <i class="browser icon" @click="go('/dataset/'+dataset._id)" style="cursor: pointer;"></i>
                    </td>
                    <td>
                        <!--<a class="ui blue ribbon label">{{dataset.datatype.name}}</a>-->
                        {{dataset.datatype.name}}
                        <!--<div class="ui label" v-for="tag in dataset.datatype_tags" style="display: inline;">{{tag}}</div>-->
                        <tags :tags="dataset.datatype_tags"></tags>
                    </td>
                    <td>
                        <div class="ui green horizontal label" v-if="dataset.project.access == 'public'">Public</div>
                        <div class="ui red horizontal label" v-if="dataset.project.access == 'private'">Private</div>
                        {{dataset.project.name}}
                    </td>
                    <td>
                        <b>{{dataset.name}}</b><br>
                        <small>{{dataset.desc}}</small>
                    </td>
                    <td>
                        <div class="ui label" v-for="tag in dataset.tags" style="display: inline;">{{tag}}</div>
                    </td>
                    <td>
                        <small>{{dataset.create_date | date}}</small>
                    </td>
                </tr>
            </tbody>
            </table>

            <div class="ui right sidebar visible selected-view" v-if="selected_count">
                <div class="ui relaxed divided list" style="margin: 5px;">
                    <div class="item">
                        <h3>
                            <button class="ui right floated tiny button" @click="clear_selected()"> Clear </button>
                            <i class="checkmark box icon"></i> {{selected_count}} selected
                        </h3>
                    </div>
                    <div class="item selected-item" v-for="(dataset, id) in selected">
                        <div class="content" @click="go('/dataset/'+id)">
                            <i class="trash icon right floated" @click.stop="remove_selected(id)"></i>
                            <span class="ui label">{{dataset.datatype.name}}</span> {{dataset.name}}
                        </div>
                    </div>
                    <hr>
                </div><!--segment-->
            </div>

        </div><!--margin20-->
    </div><!--pusher-->
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import tags from '@/components/tags'

export default {
    name: 'datasets',
    components: { sidemenu, tags },
    data () {
        return {
          datasets: [],
          selected: {},
          query: "",
        }
    },
  computed: {
    selected_count: function() {
      console.log("computing selected count");
      return Object.keys(this.selected).length;
    },

    filtered_datasets: function() {
      if(!this.query) return this.datasets;
      return this.datasets.filter((dataset)=>{
        var lquery = this.query.toLowerCase();
        if(~dataset.name.toLowerCase().indexOf(lquery)) return true;
        if(~dataset.desc.toLowerCase().indexOf(lquery)) return true;
        if(~dataset.project.name.toLowerCase().indexOf(lquery)) return true;
        if(~dataset.datatype.name.toLowerCase().indexOf(lquery)) return true;

        if(~dataset.tags.indexOf(lquery)) return true; //TODO need to do something a bit smarter..
        if(~dataset.datatype_tags.indexOf(lquery)) return true; //TODO need to do something a bit smarter..
        return false;
      });
    },
  },

  mounted: function() {
    this.$http.get('dataset', {params: {
        select: 'datatype datatype_tags project create_date name desc tags',
    }})
    .then(res=>{
      this.datasets = res.body.datasets;
      Vue.nextTick(()=>{
        console.log("shown dataset");
        $(this.$el).find('.ui.dropdown').dropdown()
      });
    }, res=>{
      console.error(res);
    });

    this.selected = JSON.parse(localStorage.getItem('datasets.selected')) || {};
  },

    methods: {
        opendataset: function(dataset) {
            console.dir(dataset);
        },
        go: function(path) {
            this.$router.push(path);
        },
        check: function(dataset) {
            //Vue.set(dataset, 'selected', !dataset.selected);
            /*
            var pos = this.selected.indexOf(dataset._id);
            if(~pos) this.selected.splice(pos, 1);
            else this.selected.push(dataset._id);
            localStorage.setItem('datasets.selected', JSON.stringify(this.selected));
            */
            if(this.selected[dataset._id]) Vue.delete(this.selected, dataset._id);
            else Vue.set(this.selected, dataset._id, dataset);
            this.persist_selected();
        },
        persist_selected: function() {
            localStorage.setItem('datasets.selected', JSON.stringify(this.selected));
        },
        clear_selected: function() {
            this.selected = {};
            this.persist_selected();
        },
        remove_selected: function(id) {
            Vue.delete(this.selected, id);
            this.persist_selected();
        },
    },
}
</script>

<style scoped>
/*
.dataset:hover {
    cursor: pointer;
    background-color: #ddd;
}
*/
.rightopen {
/*transition: margin-right 0.5s;*/
  margin-right: 300px;
}
.dataset.selected {
transition: color, background-color 0.2s;
background-color: #2185d0;
color: white;
}
.selected-view {
  background-color: #f5f5f5;
  overflow-x: hidden;
}
.selected-view .selected-item:hover {
background-color: #eee;
cursor: pointer;
}
</style>
