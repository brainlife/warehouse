import Vue from 'vue'

let debounce;

export default {
    data() {
        return {
            search_apps: [],
        }
    },
    methods: {
        search_app(search, loading) {
            loading(true);
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.get('app', {params: {
                    find: JSON.stringify({
                        $or: [
                            { name: {$regex: search, $options: 'i' }},
                            { desc: {$regex: search, $options: 'i' }},
                            { service: {$regex: search, $options: 'i' }},

                            //$text index search can't do substring search, which is not very intuitive
                            //https://stackoverflow.com/questions/24343156/mongodb-prefix-wildcard-fulltext-search-text-find-part-with-search-string
                            //{ '$text': {'$search': search} },
                        ],
                        removed: false,
                    }),
                    populate: 'inputs.datatype outputs.datatype contributors', //to display app detail
                    limit: 500, //TODO - this is not sustailable
                }})
                .then(res=>{
                    this.search_apps = res.data.apps;
                    loading(false);
                });
            }, 300);
        },
    },
}
