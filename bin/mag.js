#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const axios = require('axios');
const fs = require('fs');
const redis = require('redis');

const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

console.log("running appinfo");

db.init(function(err) {
    if(err) throw err;
    rcon = redis.createClient(config.redis.port, config.redis.server);
    rcon.on('error', err=>{throw err});
    rcon.on('ready', ()=>{
        logger.info("connected to redis");
        setInterval(health_check, 1000*60*2); //start checking health 
        setTimeout(health_check, 1000*10); //run shortly after start
        run();
    });
});

var report = {
    status: "ok",
    maxage: 1000*60*30,
    project_counts: 0,
}

function health_check() {
    report.date = new Date();
    rcon.set("health.warehouse.projectinfo."+process.env.HOSTNAME+"-"+process.pid, JSON.stringify(report));
}

function run() {
	db.Projects.find({
        removed: false,
    })
    //.populate('app project')
    .exec((err, projects)=>{
		if(err) throw err;
        report.project_counts = projects.length;
        async.eachSeries(projects, handle_project, err=>{
            if(err) logger.error(err);
            console.log("done going through all projects sleeping.....");
            setTimeout(run, 1000*3600*3);
        });
	});
}


function generate_query(str){
    stopwords = ["a's" , "able" , "about" , "above" , "according" , "accordingly" , "across" , "actually" , "after" , "afterwards" , "again" , "against" , "ain't" , "all" , "allow" , "allows" , "almost" , "alone" , "along" , "already" , "also" , "although" , "always" , "am" , "among" , "amongst" , "an" , "and" , "another" , "any" , "anybody" , "anyhow" , "anyone" , "anything" , "anyway" , "anyways" , "anywhere" , "apart" , "appear" , "appreciate" , "appropriate" , "are" , "aren't" , "around" , "as" , "aside" , "ask" , "asking" , "associated" , "at" , "available" , "away" , "awfully" , "be" , "became" , "because" , "become" , "becomes" , "becoming" , "been" , "before" , "beforehand" , "behind" , "being" , "believe" , "below" , "beside" , "besides" , "best" , "better" , "between" , "beyond" , "both" , "brief" , "but" , "by" , "c'mon" , "c's" , "came" , "can" , "can't" , "cannot" , "cant" , "cause" , "causes" , "certain" , "certainly" , "changes" , "clearly" , "co" , "com" , "come" , "comes" , "concerning" , "consequently" , "consider" , "considering" , "contain" , "containing" , "contains" , "corresponding" , "could" , "couldn't" , "course" , "currently" , "definitely" , "described" , "despite" , "did" , "didn't" , "different" , "do" , "does" , "doesn't" , "doing" , "don't" , "done" , "down" , "downwards" , "during" , "each" , "edu" , "eg" , "eight" , "either" , "else" , "elsewhere" , "enough" , "entirely" , "especially" , "et" , "etc" , "even" , "ever" , "every" , "everybody" , "everyone" , "everything" , "everywhere" , "ex" , "exactly" , "example" , "except" , "far" , "few" , "fifth" , "first" , "five" , "followed" , "following" , "follows" , "for" , "former" , "formerly" , "forth" , "four" , "from" , "further" , "furthermore" , "get" , "gets" , "getting" , "given" , "gives" , "go" , "goes" , "going" , "gone" , "got" , "gotten" , "greetings" , "had" , "hadn't" , "happens" , "hardly" , "has" , "hasn't" , "have" , "haven't" , "having" , "he" , "he's" , "hello" , "help" , "hence" , "her" , "here" , "here's" , "hereafter" , "hereby" , "herein" , "hereupon" , "hers" , "herself" , "hi" , "him" , "himself" , "his" , "hither" , "hopefully" , "how" , "howbeit" , "however" , "i'd" , "i'll" , "i'm" , "i've" , "ie" , "if" , "ignored" , "immediate" , "in" , "inasmuch" , "inc" , "indeed" , "indicate" , "indicated" , "indicates" , "inner" , "insofar" , "instead" , "into" , "inward" , "is" , "isn't" , "it" , "it'd" , "it'll" , "it's" , "its" , "itself" , "just" , "keep" , "keeps" , "kept" , "know" , "known" , "knows" , "last" , "lately" , "later" , "latter" , "latterly" , "least" , "less" , "lest" , "let" , "let's" , "like" , "liked" , "likely" , "little" , "look" , "looking" , "looks" , "ltd" , "mainly" , "many" , "may" , "maybe" , "me" , "mean" , "meanwhile" , "merely" , "might" , "more" , "moreover" , "most" , "mostly" , "much" , "must" , "my" , "myself" , "name" , "namely" , "nd" , "near" , "nearly" , "necessary" , "need" , "needs" , "neither" , "never" , "nevertheless" , "new" , "next" , "nine" , "no" , "nobody" , "non" , "none" , "noone" , "nor" , "normally" , "not" , "nothing" , "novel" , "now" , "nowhere" , "obviously" , "of" , "off" , "often" , "oh" , "ok" , "okay" , "old" , "on" , "once" , "one" , "ones" , "only" , "onto" , "or" , "other" , "others" , "otherwise" , "ought" , "our" , "ours" , "ourselves" , "out" , "outside" , "over" , "overall" , "own" , "particular" , "particularly" , "per" , "perhaps" , "placed" , "please" , "plus" , "possible" , "presumably" , "probably" , "provides" , "que" , "quite" , "qv" , "rather" , "rd" , "re" , "really" , "reasonably" , "regarding" , "regardless" , "regards" , "relatively" , "respectively" , "right" , "said" , "same" , "saw" , "say" , "saying" , "says" , "second" , "secondly" , "see" , "seeing" , "seem" , "seemed" , "seeming" , "seems" , "seen" , "self" , "selves" , "sensible" , "sent" , "serious" , "seriously" , "seven" , "several" , "shall" , "she" , "should" , "shouldn't" , "since" , "six" , "so" , "some" , "somebody" , "somehow" , "someone" , "something" , "sometime" , "sometimes" , "somewhat" , "somewhere" , "soon" , "sorry" , "specified" , "specify" , "specifying" , "still" , "sub" , "such" , "sup" , "sure" , "t's" , "take" , "taken" , "tell" , "tends" , "th" , "than" , "thank" , "thanks" , "thanx" , "that" , "that's" , "thats" , "the" , "their" , "theirs" , "them" , "themselves" , "then" , "thence" , "there" , "there's" , "thereafter" , "thereby" , "therefore" , "therein" , "theres" , "thereupon" , "these" , "they" , "they'd" , "they'll" , "they're" , "they've" , "think" , "third" , "this" , "thorough" , "thoroughly" , "those" , "though" , "three" , "through" , "throughout" , "thru" , "thus" , "to" , "together" , "too" , "took" , "toward" , "towards" , "tried" , "tries" , "truly" , "try" , "trying" , "twice" , "two" , "un" , "under" , "unfortunately" , "unless" , "unlikely" , "until" , "unto" , "up" , "upon" , "us" , "use" , "used" , "useful" , "uses" , "using" , "usually" , "value" , "various" , "very" , "via" , "viz" , "vs" , "want" , "wants" , "was" , "wasn't" , "way" , "we" , "we'd" , "we'll" , "we're" , "we've" , "welcome" , "well" , "went" , "were" , "weren't" , "what" , "what's" , "whatever" , "when" , "whence" , "whenever" , "where" , "where's" , "whereafter" , "whereas" , "whereby" , "wherein" , "whereupon" , "wherever" , "whether" , "which" , "while" , "whither" , "who" , "who's" , "whoever" , "whole" , "whom" , "whose" , "why" , "will" , "willing" , "wish" , "with" , "within" , "without" , "won't" , "wonder" , "would" , "wouldn't" , "yes" , "yet" , "you" , "you'd" , "you'll" , "you're" , "you've" , "your" , "yours" , "yourself" , "yourselves" , "zero"]
    res = []
    query_string= ""
    query_string_before=""
    words = str.split(' ')
    for(i=0;i<words.length;i++) {
       word_clean = words[i].split(".").join("")
       if(!stopwords.includes(word_clean)) {
           res.push(word_clean)
           if(i != words.length-1){
               query_string +="W='"+word_clean+"'),"
           }else{
            query_string +="W='"+word_clean+"')"
           }
            }
    }

    for (i =0; i< res.length;i++){
        query_string_before +="OR("
    }

    return(query_string_before+query_string+"")
}



function handle_project(app, cb) {
    logger.debug("....................... %s %s", app.name, app._id.toString());

    str = ""+app.name+""+app.desc

    query = generate_query(str)
    

    async.series([
        //caching serviceinfo
        next=>{
            data = common.mag_evaluate(query,app.id)
            console.log(data)
            next()
        },
        
        //list shared resources that are registered to this app
        next=>{
            axios.get(config.amaretti.api+"/resource", {
                headers: { authorization: "Bearer "+config.warehouse.jwt },  //config.auth.jwt is deprecated
                params: {
                    find: JSON.stringify({
                        gids: 1, //shared globally
                        active: true,
                        status: "ok",
                        //"config.maxtask": {$gt: 0},
                        "config.services.name": app.github,
                        "config.services.score": {$gt: 0},
                    }),
                    select: '_id name',
                }
            }).then(res=>{
                if(res.status != 200) return next("couldn't obtain service stats "+res.status);
                app.stats.resources = res.data.resources.map(resource=>{
                    return {
                        resource_id: resource._id,
                        name: resource.name,
                    }
                });
                app.markModified('stats');
                common.update_appinfo(app, next);
            }).catch(next);
        },

        //issue doi
        next=>{
            if(app.doi) return next();
            logger.debug("minting doi");
            common.get_next_app_doi((err, doi)=>{
                if(err) return next(err);
                app.doi = doi;
                let metadata = common.compose_app_datacite_metadata(app);
                common.doi_post_metadata(metadata, err=>{
                    if(err) return next(err);
                    let url = config.warehouse.url+"/app/"+app._id;  
                    common.doi_put_url(app.doi, url, next);
                });
            });
        },

        //check doi
        next=>{
            let url = "https://doi.org/"+app.doi;
            console.log("checking doi", url);
            if(config.debug) url = "https://doi.org/10.25663/brainlife.app.448";
            axios.get(url).then(res=>{
                if(!res.status == 200) return next(app.doi+" "+res.status)
                console.log(app.doi+" is good");
                next();
            }).catch(err=>{
                console.error(err.message);
                console.error(err.status);
                //what if we have temporarly glitch on doi.org? this is too dangerous
                //TODO - I should set the *last* date that doi worked, and if it's been too long, then we should reset it (or notify us to manually reset it)
                //app.doi = undefined
                next();
            });
        },

        //now save the app
        next=>{
            app.save(next);
        },

    ], err=>{
        if(err) console.error(err);
        cb(); //let it continue
    });
}


