
import Vue from 'vue'

export default {
    data() {
        return {
            datatypes: {},
        }
    },
    methods: {
        async loadDatatypes(find, cb) {
            //load datatype catalog
            try {
                let res = await this.$http.get('datatype', {params: {
                    find: JSON.stringify(find),
                    select: '-readme -admins -bids -samples -uis',
                }});
                this.datatypes = {};
                res.data.datatypes.forEach(type=>{
                    this.datatypes[type._id] = type;
                    type._tags = type.datatype_tags.map(t=>t.datatype_tag);
                });

                //also load datatype_tags from all apps -- TODO - this is super inefficient!
                res = await this.$http.get('app', {params: {
                    select: 'inputs outputs',
                    limit: 500, //TODO - this is not sustailable
                }})

                var v = this;
                function aggregate_tags(io) {
                    if(!io.datatype_tags) return;
                    io.datatype_tags.forEach(tag=>{
                        var dt = v.datatypes[io.datatype];
                        if(dt && !~dt._tags.indexOf(tag)) dt._tags.push(tag);
                    });
                }

                res.data.apps.forEach(app=>{
                    app.inputs.forEach(aggregate_tags);
                    app.outputs.forEach(aggregate_tags);
                });

                cb();
            } catch (err) {
                cb(err);
            }
        },
        
    }
}
