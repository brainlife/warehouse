#!/usr/bin/env nodejs

const fs = require('fs');
const os = require('os');

const meta = JSON.parse(fs.readFileSync(process.argv[2]));
const dest = process.argv[3];
let indexhtml = fs.readFileSync(dest+"/index.html", "utf8");

//remove <title>
let title_start = indexhtml.indexOf("<title>");
let title_end = indexhtml.indexOf("</title>")+8;

let before = indexhtml.substring(0, title_start);
let after = indexhtml.substring(title_end);

let urls = [];

function esc(str) {
	if(str === null) return null;
	return str.replace(/"/g, '"');
}

function render(info, path, schema) {
    /*
   { ID: '5aca13defd018278d693215a',
     description: 'Extensive longitudinal acquisition on a single individual',
     'og:title': 'Openneuro / ds000031',
     'og:description': 'Extensive longitudinal acquisition on a single individual',
     citation_title: 'Openneuro / ds000031',
     publish_date: '2018-04-08' } }
    */ 
    
        //let m = before+"\n\n<title>"+escape(info.title)+"</title>\n";
        let m = before+"\n\n<title>Brainlife</title>\n";
        for(let key in info.meta) {
		let v = info.meta[key];
		if(key != "og:image") v = esc(v);
                m += "<meta name=\""+key+"\" content=\""+v+"\"/>\n";
        }       
        //m += htmlMetaTags(info.meta);
        m += "\n"+after;

        //create noscript content (for SEO?)
        let b = `<noscript>
            <h1>${info.title}</h1>
            <h2>${info.meta.doi || info.meta.citation_doi || info.meta.ID}</h2>
            <time>${info.meta.date || info.meta.publish_date || info.meta.citation_date}</time>
            <p>${info.meta.description}</p>
        </noscript>`;

        //insert <noscript>
        let body_start = m.indexOf("<body>")+6;
        let s = "";
        if(schema) s = `<script type='application/ld+json'>${JSON.stringify(schema, null, 4)}</script>`
        m = m.slice(0, body_start) + b + s + m.slice(body_start);
        fs.writeFileSync(path, m, "utf8");
}

for(let id in meta.apps) {
	let app = meta.apps[id];
	render(app, dest+"/app/"+id);
	urls.push("/app/"+id);
}

for(let id in meta.pubs) {
	let pub = meta.pubs[id];
    let url = "/pub/"+id;
    let fullurl = "https://"+os.hostname()+url;
    
    //create publication schema (for google dataset search)
    let schema = {
        "@context": "https://schema.org/",
        //"@id": "https://doi.org/"+pub.meta.citation_doi,
        "@id": "https://doi.org/"+pub.meta.citation_doi,
        "@type": "Dataset",
        name: pub.title,
        description: pub.meta.description,
        url: fullurl,
        keywords: pub.meta.keywords.split(", "),
        creator: [],
        datePublished: pub.meta.citation_date,
        //dateModified: ...
        //dateCreated: ...
        distribution: [
            {
                "@type": "DataDownload",
                "encodingFormat": "ascii",
                contentUrl: fullurl, //TODO - point to downscript link?
            }
        ],
        //identifier: pub.meta.citation_doi,
        publisher: {
            "@type": "Organization",
            name: "brainlife.io"
        },
        inLanguage: {
            "@type": "Language",
            alternateName: "eng",
            name: "English",
        },
        license: pub.meta.copyright,
        //version: "1.0.0"
    };
    pub.meta.citation_author.split(", ").forEach(author=>{
        schema.creator.push({
          //'@id': "https://orcid.org/0000-0003-0320-1257",
          '@type': "Person",
          //affiliation: "Nathan Kline Institute",
          name: author,
        });
    });

	render(pub, dest+"/pub/"+id, schema);
	urls.push(url);
}

for(let id in meta.projs) {
	let proj = meta.projs[id];
	render(proj, dest+"/project/"+id);
	urls.push("/project/"+id);
}

//generate sitemap xml
let xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
urls.forEach(url=>{
	//TODO - add <lastmod>2018-06-04</lastmod>
	xml += "<url><loc>https://"+os.hostname()+url+"</loc></url>\n";
});
xml += "</urlset>";
fs.writeFileSync(dest+"/sitemap.xml", xml);
