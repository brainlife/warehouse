import Vue from 'vue'

let debounce;

export default {
    data() {
        return {
            search_apps: [],
            search_apps_ignore: [], //list of apps to ignore (set by the client)
        }
    },
    methods: {
        search_app(search, loading) {
            loading(true);
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                let find = {
                    $or: [
                        { name: {$regex: search, $options: 'i' }},
                        { desc: {$regex: search, $options: 'i' }},
                        { github: {$regex: search, $options: 'i' }},

                        //$text index search can't do substring search, which is not very intuitive
                        //https://stackoverflow.com/questions/24343156/mongodb-prefix-wildcard-fulltext-search-text-find-part-with-search-string
                        //{ '$text': {'$search': search} },
                    ],
                    _id: {$nin: this.search_apps_ignore },
                    removed: false,
                };
                this.$http.get('app', {params: {
                    find: JSON.stringify(find),
                    populate: 'inputs.datatype outputs.datatype contributors', //to display app detail
                    limit: 20,
                }})
                .then(res=>{
                    this.search_apps = res.data.apps;
                    loading(false);
                });
            }, 300);
        },
    },
}
