'use strict';

const express = require('express');
const router = express.Router();
const async = require('async');


const config = require('../config');
const db = require('../models');
const common = require('../common');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const mammoth = require("mammoth");

/**
 * @apiGroup Project
 * @api {post} /ezgov/project         Post Project
 * @apiDescription              Register a new project
 *
 * 
 * @apiParam {String} [title]    name for this project 
 * @apiParam {String} [description]    Description for this dataset 
 *
 * @apiParam {Object[]} members List of project members
 * @apiParam {String} member._id Member ID
 * @apiParam {String} member.role Member role
 * @apiParam {String} member.position Member position
 * @apiParam {String} member.name Member name
 * 
 * @apiParam {Object[]} [documents] List of project documents
 * @apiParam {String} documents._id Document ID
 * @apiParam {String} documents.projectId Project ID
 * @apiParam {String} documents.fileUrl URL of the document file
 * @apiParam {String} documents.fileName Name of the document file
 * @apiParam {Object} documents.uploadedBy Information about the uploader
 * @apiParam {Date} documents.uploadDate Date of upload
 * @apiParam {String} documents.type Type of the document
 * @apiParam {String[]} documents.lifecycle Lifecycle stages of the document
 * @apiParam {String[]} [documents.tags] Tags associated with the document
 * @apiParam {String} [documents.template] Template ID for the document
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token in the format "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Project record registered
 */


router.post('/project', common.jwt(), async (req, res) => {
    try {
        const projectData = req.body;
        const isAdmin = projectData.members.some(member => member._id === req.user.id && member.role === 'admin');
        
        if (!isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Only admins can create projects' });
        }

        //TODO: user.id / user._id
        if(!projectData['createdBy']) projectData['createdBy'] = req.user.id;
        
        const requiredFields = ['title', 'description', 'primaryInstitute', 'members'];
        
        for (const field of requiredFields) {
            if (!projectData[field]) {
                return res.status(400).json({ message: `Bad Request: Missing required field ${field}` });
            }
        }

        const newProject = new db.ezGovProjects(projectData);
        const savedProject = await newProject.save();

        res.status(200).json(savedProject);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


/**
 * @apiGroup Project
 * @api {put} /ezgov/project/:id Update Project
 * @apiDescription              Update an existing project
 *
 * @apiParam [title]    name for this project 
 * @apiParam {String} [description]    Description for this dataset 
 * @apiParam {Object[]} members List of project members
 * @apiParam {String} members._id Member ID
 * @apiParam {String} members.role Member role
 * @apiParam {String} members.position Member position
 * 
 * @apiParam {Object[]} [documents] List of project documents
 * @apiParam {String} documents._id Document ID
 * @apiParam {String} documents.projectId Project ID
 * @apiParam {String} documents.fileUrl URL of the document file
 * @apiParam {String} documents.fileName Name of the document file
 * @apiParam {Date} documents.uploadDate Date of upload
 * @apiParam {String} documents.type Type of the document
 * @apiParam {String[]} documents.lifecycle Lifecycle stages of the document
 * @apiParam {String[]} [documents.tags] Tags associated with the document
 * @apiParam {String} [documents.template] Template ID for the document
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token in the format "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Project record updated
 */

router.put('/project/:id', common.jwt(), async (req, res) => {
    try {
        const projectId = req.params.id;
        const projectData = req.body;

        const project = await db.ezGovProjects.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isAdmin = project.members.some(member => member._id.toString() === req.user.id && member.role === 'admin');
        if (!isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Only admins can update projects' });
        }

        const updatedProject = await db.ezGovProjects.findByIdAndUpdate(projectId, projectData, { new: true });

        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


/**
 * @apiGroup Project
 * @api {get} /ezgov/projects   Get All Projects
 * @apiDescription              Retrieve all projects
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token in the format "Bearer: xxxxx"
 *
 * @apiSuccess {Object[]}       List of projects
 */

router.get('/projects', common.jwt(), async (req, res) => {
    try {
        const projects = await db.ezGovProjects.find({ 'members._id': req.user.id });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


/**
 * @apiGroup Project
 * @api {get} /ezgov/project/:id Get Specific Project
 * @apiDescription              Retrieve a specific project by ID
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token in the format "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Project record
 */

router.get('/project/:id', common.jwt(), async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await db.ezGovProjects.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isMemberOrAdmin = project.members.some(member => member._id.toString() === req.user.id);
        if (!isMemberOrAdmin) {
            return res.status(403).json({ message: 'Forbidden: Only project members or admins can access this project' });
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Set up Multer for file uploads
const upload = multer({ dest: '/mnt/ezgov/temp/' }); // Temporary upload directory

router.post('/upload/:projectId', upload.any(), common.jwt(), async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id; 
    const { type, lifecycle, tags, template } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    try {
        let documents = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const src_path = file.path;
            const dest_path = path.resolve(`/mnt/ezgov/upload/${projectId}/${file.originalname}`);
            
            console.log(`Source path: ${src_path}`);
            console.log(`Destination path: ${dest_path}`);

            if (!dest_path.startsWith('/mnt/ezgov/upload')) {
                return res.status(400).send("Invalid path: " + dest_path);
            }

            const destdir = path.dirname(dest_path);
            console.log(`Destination directory: ${destdir}`);

            mkdirp.sync(destdir);

            // Move the file from temp to the destination directory
            try {
                fs.renameSync(src_path, dest_path);
            } catch (err) {
                console.error(`Error moving file from ${src_path} to ${dest_path}`, err);
                return res.status(500).send("Error moving file.");
            }

            // Create a new document record
            const document = {
                fileUrl: `/mnt/ezgov/upload/${projectId}/${file.originalname}`,
                fileName: file.originalname,
                uploadedBy: mongoose.Types.ObjectId(userId) ,
                type: type,
                lifecycle: lifecycle ? lifecycle.split(',') : [],
                tags: tags ? tags.split(',') : [],
            };

            documents.push(document);
        }

        // Update the project with the new documents
        await db.ezGovProjects.findByIdAndUpdate(
            projectId,
            { $push: { documents: { $each: documents } } },
            { new: true, useFindAndModify: false }
        );

        res.status(200).send(documents);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error.");
    }
});


router.get('/project/:id/document/:docId', common.jwt(), async(req,res) => {
    try {
        const projectId = req.params.id;
        const docId = req.params.docId;

        const project = await db.ezGovProjects.findById(projectId);
        await checkProjectAccess(project, req.user.id);
        const document = project.documents.id(docId);

        if(document) res.status(200).json(document);
        else res.status(404).json({message: "Document not Found"});
       
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
})

router.put('/project/:id/document/:docId', common.jwt(), async (req, res) => {
    try {
        const projectId = req.params.id;
        const docId = req.params.docId;
        const updateData = req.body;

        const project = await db.ezGovProjects.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isAdmin = project.members.some(member => member._id.toString() === req.user.id && member.role === 'admin');
        if (!isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Only admins can update documents' });
        }

        // Find the document by ID within the project
        const document = project.documents.id(docId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        console.log(updateData);

        // Update the document with the provided data
        Object.keys(updateData).forEach(key => {
            document[key] = updateData[key];
        });

        // Save the project with the updated document
        await project.save();

        res.status(200).json({ message: 'Document updated successfully', document });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

const checkProjectAccess = async (project, userID) => {

    console.log(project);

    const isMemberOrAdmin = project.members.some(member => member._id.toString() == userID);
    if (!isMemberOrAdmin) {
        return res.status(403).json({ message: 'Forbidden: Only project members or admins can access this project' });
    }

    return project;
};

// Route to serve files
router.get('/project/:projectId/file/:docId', async (req, res) => {   

    const projectId = req.params.projectId;
    const docId = req.params.docId;

    const project = await db.ezGovProjects.findById(projectId);
    const document = project.documents.id(docId);
    const filePath = document.fileUrl;

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }

        // Serve the file
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error serving file:', err);
                res.status(500).send('Internal Server Error');
            }
        });
    });

});




router.get('/project/:projectId/file/:docId/getText', async (req, res) => {
    const projectId = req.params.projectId;
    const docId = req.params.docId;

    try {
        const project = await db.ezGovProjects.findById(projectId);
        if (!project) {
            return res.status(404).send('Project not found');
        }

        const document = project.documents.id(docId);
        if (!document) {
            return res.status(404).send('Document not found');
        }

        const filePath = document.fileUrl;

        fs.access(filePath, fs.constants.F_OK, async (err) => {
            if (err) {
                return res.status(404).send('File not found');
            }
            const result = await mammoth.extractRawText({ path: filePath });
            const text = result.value;
            return res.status(200).send(text);
        });

    } catch (err) {
        return res.status(500).send('Internal server error');
    }
});



module.exports = router;

