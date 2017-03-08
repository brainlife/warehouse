<template>
<div>
  <select class="ui fluid search dropdown" multiple v-model="selected">
    <option v-for="profile in profiles" v-bind:value="profile.id">
      {{profile.fullname}}
      <code><{{profile.email}}></code>
    </option>
  </select>
</div><!--root-->
</template>

<script>
import Vue from 'vue'

export default {
  name: "contactlist",
  data () {
    return {
      profiles: [],
      selected: [],
    }
  },

  methods: {
    /*
    changed: function(v) {
        console.log("changed");
        console.dir(v);
        this.$emit('changed', v);
    }
    */
  },

  mounted: function() {
    //TODO I should cache this somehow.. (or does browser do that?)
    this.$http.get(Vue.config.auth_api+'/profiles').then(res=>{
        this.profiles = res.body;
        //console.dir(this.profiles);

        //I have to initialize dropdown *after* Vue had chance to insert all
        //<option> tags - I can't do this during mounted step.
        Vue.nextTick(()=>{
          $(this.$el).find('.dropdown').dropdown('set exactly', this.uids);
          //inform parent of selection change
          $(this.$el).find('.dropdown').dropdown('setting', 'onChange', (v)=>{
              this.$emit('changed', v);
          });
        });
    }, res=>{
      console.error(res);
    });
  },

  watch: {
    //initial uids to reset to..
    uids: function(val) {
      if(!val) return;
      var _val = val.map(function(v) { return v; });
      //console.log("uids changed....", _val);
      $(this.$el).find('.dropdown').dropdown('set exactly', _val);
    }
  },

  destroy: function () {
    $(this.$el).find('.dropdown').dropdown('destroy');
  },

  props: ['uids'],
  //components: { sidemenu, contactlist },
}
</script>
