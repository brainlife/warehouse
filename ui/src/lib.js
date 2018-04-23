
//pick apps that dataset can be used as input - based on its datatype_id and _tags
function filter_apps(dataset, apps) {
    //TODO - maybe I should move this filtering logic to server
    return apps.filter((app)=> {
        var has_matching_input = false;
        app.inputs.forEach((input)=> {
            var input_datatype_id = input.datatype._id || input.datatype;
            var dataset_datatype_id = dataset.datatype._id || dataset.datatype;
            if(input_datatype_id == dataset_datatype_id) {
                //make sure the data type meets all application datatype tags
                var reject = false;
                input.datatype_tags.forEach((tag)=> {
                    if(tag[0] == '!') {
                        //negative tag (dataset must't have)
                        if(~dataset.datatype_tags.indexOf(tag.substring(1))) {
                            reject = true;
                        }
                    } else {
                        //normal tag (dataset must have)
                        if(!~dataset.datatype_tags.indexOf(tag)) reject = true;
                    }
                });
                if(!reject) has_matching_input = true;
            }
        });
        return has_matching_input;
    });
}

//opposite of filter_apps. select datasets that can be used as input for app
function filter_datasets(datasets, input) {
    return datasets.filter(dataset=>{
        var input_datatype_id = input.datatype._id || input.datatype;
        var dataset_datatype_id = dataset.datatype._id || dataset.datatype;
        
        if(input_datatype_id != dataset_datatype_id) return false;

        var match = true;
        //see if all required tags exists
        input.datatype_tags.forEach(required_tag=>{
            if(required_tag[0] == "!") {
                //negative tag
                var neg_tag = required_tag.substring(1);
                if(~dataset.datatype_tags.indexOf(neg_tag)) match = false;
            } else {
                //required tag
                if(!~dataset.datatype_tags.indexOf(required_tag)) match = false;
            }
        });

        return match; 
    });
}

//dedupe an array
//https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

export { filter_apps, filter_datasets, uniq };
