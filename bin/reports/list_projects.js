#!/usr/bin/env node
const config = require("../../api/config");
const db = require('../../api/models');

function escape(v) {
	if(v === undefined) return v;
	return "\""+v.replaceAll("\"", "\\\"")+"\"";
}

db.init(async err=>{
	if(err) throw err;
	let projects = await db.Projects.find({removed: false});
	console.log("id,access,objects,adminCount,memberCount,importedDataset,name");
	projects.forEach(p=>{
		let objects = null;
		if(p.stats && p.stats.datasets) objects = p.stats.datasets.count;
		if(!objects) return;
		console.log(`${p._id},${p.access},${objects},${p.admins.length},${p.members.length},${p.importedDLDatasets.length},${escape(p.name)}`);
	});
	db.disconnect();
});
