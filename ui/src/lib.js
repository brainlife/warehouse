
//pick apps that dataset can be used as input - based on its datatype_id and _tags
function filter_apps(dataset, apps) {
    console.log("filter_apps");
    //TODO - maybe I should move this filtering logic to server
    return apps.filter((app)=> {
        var has_matching_input = false;
        app.inputs.forEach((input)=> {
            if(input.datatype._id == dataset.datatype._id) {
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

export { filter_apps };
