function removeUndefinedOrNullProperties(obj) {
    for(let key in obj) {
        if(obj[key] === undefined || obj[key] === null) delete obj[key];
    }
    return obj;
}

function composeOutputTag(ruleName) {
    let tag = ruleName||new Date().toLocaleDateString();
    tag = tag.toLowerCase().replace(/\W/g, '_');
    return tag;
};

function getEmptyIOConfigObj() {
    return {
        // app tab stuff
        config: {},

        // input tab stuff
        subject_match: "", 
        session_match: "", 
        extra_datatype_tags: {},
        input_selection: {},
        input_multicount: {},
        input_project_override: {},
        input_subject: {},
        input_session: {},
        input_tags: {},
        input_dataset_tags: {},

        // output tab stuff
        output_tags: {}, 
        archive: {},
    }
}

export {
    removeUndefinedOrNullProperties,
    composeOutputTag,
    getEmptyIOConfigObj,
}