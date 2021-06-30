'use strict';

const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../config');
const common = require('../common');
/**
 * @apiGroup Projects
 * @api {get} /project/data
 * @apiDescription              Query data for pie chart
 * 
 * @apiHeader {String} [authorization]
 *                                  A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object (JSON) }             Pie Chart Data
 */
 router.get('/data', common.jwt({credentialsRequired: true}), (req, res, next)=> {
    // if(!req.headers.authorization) next();
    if(!common.hasScope(req, "admin")) return next("You need to be admin to access this");
    request.get({ url : config.auth.api+'/profile/list', headers: { authorization: req.headers.authorization}}, (err, _res, json)=> {
        if(err) return next(err);
        if(json.length == 0) return res.json([]); 
        //now we have the json, we need to filter it
        let dataFiltered = JSON.parse(json).profiles.map(entry => {
            if(entry.profile.private.position) return {position : entry.profile.private.position};
        });
        if(!dataFiltered.length) return res.json([]);
        const LabelNameMatch = {
            "PhD Student": ["doctoral student", "graduate student","phd candidate","grad student","phd student"],
            "Faculty" : ["prof", "senior research fellow", "chair", "instructor", "director", "scientist", "advisor", "principal investigator", "pi", "teacher","scholar", "lec"],
            "Postdoctoral Researcher" : ["postdoctoral" ,"fellow", "research associate", "post", "phd" ,"research"],
            "Research Assistant" : ["research assistant", "research coordinator", "intern","ra"],
            "High School Student" : ["high school"],
            "Clinician" : ["chief physician","clinical researcher","advanced imaging neuroscientist","presurgical tumor evaluation","md","radiologist","neuroradiologist",
                        "logist","physic","clinician","medical doctor","physician","neurologist"],
            "College Student" : ["under", "teaching assistant",],
            "Industry" : ["software", "product", "manager", "owner", "developer", "des", "engineer"],
            "Masters Student" : ["masters", "phil", "mtech", "msc"],
            "Student (unspecified)" : ["studen"],
        }
        let dataFileurl = [
                {
                    "institution": "Indiana University / Psychological and Brian Sciences",
                    "bio": "A software engineer at Indiana University Brain Science department working to make supercomputers easier to use for everyone!",
                    "position": "Software Engineer",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University/Port and Pestilli Labs",
                    "bio": "Graduate student in Nicholas Port and Franco Pestilli's labs interested in the effects of TBI and repetitive head impacts on brain tissue microstructure",
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University",
                    "bio": null,
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": null,
                    "bio": "This is a guest account created for NSF reviewers.",
                    "position": null,
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Columbia University Medical Center",
                    "bio": "This is Jiook Cha, an assistant professor in the Psychiatry Department at Columbia University Medical Center",
                    "position": null,
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "The University of Texas at Austin",
                    "bio": "Associate Professor in the Department of Psychology at the University of Texas, Austin. Dr. Pestilli joined the University of Texas in 2020. Prior to that, he was Associate Professor at Indiana University. Dr. Pestilli holds a Ph.D. from New York University and a B.A. from the University of Rome La Sapienza and received Postdoctoral Training at Stanford University and Columbia University.  \n\nDr. Pestilli is the author of over 60 publications spanning multiple fields of science, such as Cognitive and Computational Neuroscience, Vision, Neuroanatomy, Computer Science, and Neuroinformatics. Dr. Pestilli's scientific projects have been funded by the National Science Foundation, the National Institute of Health, the Department of Defense, the Association for Psychological Science, the Indiana University Emergent Areas of Research, Pervasive Technology Institute, and Microsoft Research. \n\nDr. Pestilli is elected Fellow of the Association for Psychological Science and Psychonomics Society and has received a Microsoft Faculty Fellowship, the Janet Taylor Spence Award for Transformative Early Career Achievements by the Association for Psychological Science as well as the Early Career Travel Award from the Japanese Neuroscience Society. He is an editorial board member for Scientific Data, Scientific Reports, and Brain Structure and Function. Dr. Pestilli is Principal Investigator for the Midwest Big Data Hub. He is director of the Advanced Computational Neuroscience Network and founder and director of the open science platform brainlife.io.",
                    "position": "Associate Professor",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University",
                    "bio": null,
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Texas Advanced Computing Center",
                    "bio": "Protein:Protein Interface researcher.\nDallas/Fort Worth, Life Sciences, and Jetstream Liaison",
                    "position": null,
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": null,
                    "position": "Graduate student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Division of Cognitive Neuroscience, University of Basel",
                    "bio": null,
                    "position": "Postdoc",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University of Colorado",
                    "bio": null,
                    "position": "Assistant Professor",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University of Pennsylvania",
                    "bio": "Connectome/network researcher.",
                    "position": null,
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Garyfallidis Research Group - Indiana University",
                    "bio": null,
                    "position": "Software Developer",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Duke Center for Cognitive Neuroscience",
                    "bio": null,
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Duke University",
                    "bio": "Kendra Seaman is a Postdoctoral Scholar at Duke University, funded by T32 AG000029-41 through the Center for the Study of Aging and Human Development.  She works on her research in the Motivated Cognition and Aging Brain Laboratory under the direction of Gregory Samanez-Larkin.  Her research examines the intersections of learning, motivation, and decision making across the adult lifespan using a variety of behavioral, modeling and neuroimaging techniques. Prior to earning her Ph.D. in Applied/Experimental Psychology at The Catholic University of America, she served as a Teach For America corps member, teaching science at Frick Middle School in Oakland, California, and as a teacher and department chair at KIPP DC: KEY Academy in Washington, DC.",
                    "position": null,
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Otto-von-Guericke University",
                    "bio": "PhD student at the Otto-von-Guericke Univertsity Magdeburg",
                    "position": "PhD Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University Medical Center Groningen",
                    "bio": null,
                    "position": "PhD student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University Medical Center Groningen",
                    "bio": "Prof Visual Neuroscience, Laboratory of Experimental Ophthalmology, University Medical Center Groningen, University of Groningen",
                    "position": null,
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University PLAB",
                    "bio": null,
                    "position": "Postdoctoral Research Associate",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University",
                    "bio": null,
                    "position": "Postdoctoral Researcher",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Simon Fraser University",
                    "bio": "P.hD in Medical and Biomedical Imaging, University College London\nM.Phil in Ophthalmology, The University of Hong Kong\nM.Eng in Electronic and Communication Engineering, The University of Hong Kong",
                    "position": "Research Fellow",
                    "purpose": "Promote Code/Data/Research_Result sharing and exchange on projects about human/rat/mouse brain/retinal imaging data and data analysis.",
                    "register": null
                },
                {
                    "institution": "Bruno Kessler Foundation (FBK)",
                    "bio": null,
                    "position": "PhD candidate",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Tehran University of Medical Sciences",
                    "bio": null,
                    "position": "Researcher",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "My research focuses on the neural circuitry children and adolescents use to learn about different aspects of their environment, how such circuits are shaped by early life stress, and why neural changes due to this stress confer risks for negative outcomes. Through this work, I have found that the risks for different forms of psychopathology associated with early life stress are conveyed by specific alterations in brain circuitry responsible for reward and socio-emotional information processing.",
                    "position": "Assistant Professor",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University",
                    "bio": null,
                    "position": "graduate student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Northwestern University / NIACAL",
                    "bio": null,
                    "position": "Research Assistant Professor",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University",
                    "bio": "Undergraduate from Louisville, Kentucky studying Neuro and military sciences.",
                    "position": "Undergraduate Researcher",
                    "purpose": "To make Soichi's job harder. ",
                    "register": null
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": null,
                    "position": "Undergraduate student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Peking University",
                    "bio": null,
                    "position": "Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University",
                    "bio": null,
                    "position": "Part-time developer",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University Bloomington - Garyfallidis Research Group",
                    "bio": null,
                    "position": "Ph.D. Student - Research Assistant",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "UCL",
                    "bio": null,
                    "position": "Senior postdoc",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Tehran University of Medical Sciences",
                    "bio": "MD, interested in neuroimaging correlates and biomarkers of neuropsychiatric disorders.",
                    "position": "Researcher",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University of Massachusetts Medical School",
                    "bio": null,
                    "position": "Professor",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "NorthShore University Hospital",
                    "bio": null,
                    "position": "Research Assistant",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University of Washington",
                    "bio": "Although I am semi-retired, I still have a funded project to study Gulf-war veteran illness in collaboration with Dr. Elaine Peskind at the Veterans Administration Hospital in Seattle, WA. My role in this study is to oversee both the acquisition and data analysis of the MRI brain scans of the veterans. Specifically, we are correlating clinical status,pain status and cognitive functions with brain measures that we have derived from diffusion MRI, functional MRI, and neurochemistry (using MR spectroscopy scans).\nMy 263 publications can be seen on my researchgate profile\nhttps://www.researchgate.net/profile/Todd_Richards",
                    "position": "Professor Emeritus",
                    "purpose": "I am interested in both the software and datasets for brain imaging processing.",
                    "register": null
                },
                {
                    "institution": "Fondazione Bruno Kessler (IT)",
                    "bio": "Emanuele Olivetti received his master's degree in physics and his Ph.D. in computer science from the University of Trento, Italy. He is a researcher at the Bruno Kessler Foundation (FBK) working on machine learning for neuroimaging experiments jointly with the local center for mind and brain sciences (CIMeC) within the University of Trento. His research interests include brain decoding, learning algorithms for diffusion MRI data, joint analysis of multiple neuroimaging data sources, active learning, and Bayesian inference.\n",
                    "position": "Research scientist",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University",
                    "bio": null,
                    "position": "PhD Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "MIT",
                    "bio": null,
                    "position": "Principal Research Scientist",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": null,
                    "position": "Graduate Research Assistant",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Indiana University/PuceLab",
                    "bio": "Social neuroscientist studying brain basis of non-verbal communication; MEG, EEG, fMRI, anatomical MRI, tractography, TMS",
                    "position": "Eleanor Cox Riggs Professor",
                    "purpose": "This is a practice project - a sandbox for my lab. I will be using brainlife.io for multimodal datasets. In particular I will be bringing in MEG & EEG data to brainlife.io for the first time.",
                    "register": null
                },
                {
                    "institution": "Northwestern University",
                    "bio": null,
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Experimental Psychology Lab University of Cyprus",
                    "bio": null,
                    "position": "PhD Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "UT Austin",
                    "bio": null,
                    "position": "Research Scientist",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": null,
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Fondazione Bruno Kessler / NeuroInformatics Laboratory  (NILab)",
                    "bio": null,
                    "position": "PhD student",
                    "purpose": null,
                    "register": null
                },
                {
                    "institution": "Asian University for Women",
                    "bio": "An AI enthusiastic, majoring in Bioinformatics and minoring in Computer Science and Mathematics.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Ghent University",
                    "bio": "I use and sometimes build tools for the analysis of brain connectivity, both EEG and fMRI, some computational modelling too.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "The University of Nottingham",
                    "bio": null,
                    "position": "Post-doctoral researcher",
                    "purpose": null
                },
                {
                    "institution": "University of Bologna",
                    "bio": "I have to write my thesis about big data in neuroscience",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "University of Notre Dame",
                    "bio": "Lowly undergrad",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Concordia University",
                    "bio": "http://users.encs.concordia.ca/~tglatard",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Indraprastha Institute of Information Technology, Delhi",
                    "bio": "Generally excited about accelerating science through software and learning algorithms.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Cognitive Neuroscience Center @ UMCG, The Netherlands",
                    "bio": null,
                    "position": "Staff scientist",
                    "purpose": null
                },
                {
                    "institution": "Montreal Neurological Institute, McGill University",
                    "bio": "Data manager and Technical project liaison, LORIS / EEG / neurodevelopment",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "University of Nottingham",
                    "bio": null,
                    "position": "PhD student",
                    "purpose": null
                },
                {
                    "institution": "University of Oxford",
                    "bio": "Alexander Laurence is a MSc graduate in Integrative Neuroscience. He spent most of his research career at the University of Edinburgh’s Centre for Clinical Brain Sciences where he worked on awake rodent fMRI research, whilst also collaborating with Chang-Gung University in Taiwan. His most recent work is with the UCL Institute of Child Health under his own IT project (Celestial Interactive) which saw the development of 2 data-driven apps for neurodevelopmental research. Alexander is currently enrolled on a Machine Learning short programme at the University of Oxford. Later this year, he will be working as a data science researcher for Hitachi in Tokyo, Japan. Alexander’s main passions are artificial intelligence and brain– computer interfaces.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "The University of Queensland",
                    "bio": null,
                    "position": "Research Fellow",
                    "purpose": null
                },
                {
                    "institution": "Institut de Neurosciences de la Timone, CNRS - Aix Marseille Université, Marseille, France",
                    "bio": "http://www.int.univ-amu.fr/TAKERKART-Sylvain?lang=en",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Monash Biomedical Imaging",
                    "bio": "Neuroscience researcher and lecturer",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Robarts Research Institute, London, Ontario, Canada",
                    "bio": "I am a Scientist at the Robarts Research Institute and Assistant Professor in the Department of Medical Biophysics and Medical Imaging at Western University, London, Ontario, Canada.  I use 3T and 7T structural and diffusion imaging to develop image analytics for neurological diagnosis and neurosurgical therapies.",
                    "position": "Assistant Professor",
                    "purpose": null
                },
                {
                    "institution": "Image Processing Systems Institute RAS",
                    "bio": "Microoptics, high-performance computing, distributed computing, time series analysis",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": null,
                    "bio": "na",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Connectomics Lab, Department of Radiology, University Hospital of Lausanne, Switzerland",
                    "bio": "Sébastien Tourbier received his BSc and MSc degrees in Communication Systems with specialization in Signal and Image Processing from the School of Computer and Communication Sciences of the Swiss Federal Institute of Technology (EPFL), Lausanne, Switzerland, in 2011. Between February 2011 and May 2012, he worked as an Intern and then as a R&D Engineer for the Ultrasound Physics Department of the Geneva Research Center of Bracco Imaging, focusing on the development of a segmentation method for the tracking of carotid plaque in dynamic contrast-enhanced ultrasound (CEUS) modality, and its integration into VueBox ™, a Bracco-developped perfusion quantification software tool. Between October 2012 and September 2016, he pursued a PhD at the Center for Biomedical Imaging (CIBM) and the Medical Image Analysis Laboratory (MIAL) of the University of Lausanne (UNIL), under the supervision of Prof. Reto Meuli and Dr. Meritxell Bach Cuadra. He successfully developed novel image processing methods for automated fetal brain magnetic resonance image analysis, and made them publicly available through the MIAL Super Resolution Toolkit (MIALSRTK), a set of C++ tools, necessary to perform the whole reconstruction pipeline. Since March 2017, he is part of the Connectomics Lab, led by Prof. Patric Hagmann and he is currently working as a postdoctoral research fellow within the Brain Communication Pathways Sinergia Consortium. He is in charge of data processing coordination as well as the development of the new release of the Connectome Mapper, where he has reinforced its expertise not only in MRI data analysis but also in the development of highly portable and reproducible image processing pipelines.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Shanghai Second Polytechnic University",
                    "bio": null,
                    "position": "Student",
                    "purpose": null
                },
                {
                    "institution": "Indiana University",
                    "bio": null,
                    "position": "Postdoctoral Researcher",
                    "purpose": null
                },
                {
                    "institution": "University of Luxembourg",
                    "bio": null,
                    "position": "PhD Student",
                    "purpose": null
                },
                {
                    "institution": "Child Mind Institute",
                    "bio": "https://binarybottle.com\nhttps://matter.childmind.org",
                    "position": "Director of the MATTER Lab",
                    "purpose": "Testing platform for use."
                },
                {
                    "institution": "Tilburg University",
                    "bio": "Currently writing my master thesis on early diagnosis of Alzheimer's disease with Deep Learning.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "University of Oxford",
                    "bio": "https://www.ndcn.ox.ac.uk/team/jasleen-jolly",
                    "position": "Clinical researcher",
                    "purpose": null
                },
                {
                    "institution": "Squishymedia",
                    "bio": "I'm a developer on OpenNeuro.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "Springboard",
                    "bio": "After going through a period of mental health struggles personally, I found it necessary to learn as much as I can about the mind so that I can understand myself and how to find the best possible future for all people who will soon undergo similar struggles if they haven't already.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "dpz",
                    "bio": "aa",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "NIMH",
                    "bio": "https://www.nimh.nih.gov/research/research-conducted-at-nimh/principal-investigators/adam-g-thomas-p",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": null,
                    "position": "Postdoctoral Fellow",
                    "purpose": null
                },
                {
                    "institution": "Georgia State University",
                    "bio": "Martin Norgaard is Associate Professor of Music Education at Georgia State University in Atlanta where he is collaborating with faculty in neuroscience, mathematics, computer science, occupational therapy, and physics to investigate the cognitive processes underlying improvisation and related therapeutic applications. His research appears in the Journal of Research in Music Education, Brain Connectivity, The International Journal of Music Education, and Music Perception.",
                    "position": null,
                    "purpose": null
                },
                {
                    "institution": "University of Bergen",
                    "bio": null,
                    "position": "Student",
                    "purpose": null,
                    "register": "2019-09-01T11:31:01.687Z"
                },
                {
                    "institution": "Institute of Medical Science and Technology",
                    "bio": null,
                    "position": "Researcher",
                    "purpose": null,
                    "register": "2019-09-13T12:22:17.908Z"
                },
                {
                    "institution": "Fleni",
                    "bio": null,
                    "position": "MRI ",
                    "purpose": null,
                    "register": "2019-09-23T18:08:46.012Z"
                },
                {
                    "institution": "University of Pisa",
                    "bio": null,
                    "position": "PhD",
                    "purpose": null,
                    "register": "2019-09-24T07:52:21.753Z"
                },
                {
                    "institution": "University of Pennsylvania",
                    "bio": null,
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": "2019-09-26T18:45:31.495Z"
                },
                {
                    "institution": "Northwestern University",
                    "bio": null,
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": "2019-10-09T16:01:03.572Z"
                },
                {
                    "institution": "Shanghai Research Center for Brain Science and Brain-Inspired Intelligence (sub contractor)",
                    "bio": "master degree major in EE from SJTU.\n10+ years in IT/data project management.",
                    "position": "project manager",
                    "purpose": "help PI / sub-PI to use information system/tools more efficiently in research work.",
                    "register": "2019-10-14T06:12:31.467Z"
                },
                {
                    "institution": "Pontificia Universidad Javeriana",
                    "bio": null,
                    "position": "Researcher",
                    "purpose": null,
                    "register": "2019-10-16T21:55:46.745Z"
                },
                {
                    "institution": "SFEDU",
                    "bio": null,
                    "position": "researcher",
                    "purpose": null,
                    "register": "2019-10-24T09:56:01Z"
                },
                {
                    "institution": "Faculty of Sciences of Tunis/ ATSSEE",
                    "bio": null,
                    "position": "Student",
                    "purpose": null,
                    "register": "2019-11-01T01:44:10.536Z"
                },
                {
                    "institution": "Donders Institute",
                    "bio": null,
                    "position": "Associate Principal Investigator",
                    "purpose": null,
                    "register": "2019-11-01T13:45:06.453Z"
                },
                {
                    "institution": "Indiana University, Indiana University Network Science Institute",
                    "bio": null,
                    "position": "Outreach Coordinator",
                    "purpose": null,
                    "register": "2019-11-05T19:47:14.317Z"
                },
                {
                    "institution": "Cornell",
                    "bio": null,
                    "position": "Student",
                    "purpose": null,
                    "register": "2019-11-05T20:04:37.209Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": null,
                    "position": "Student",
                    "purpose": null,
                    "register": "2019-11-21T19:47:50.092Z"
                },
                {
                    "institution": "ICM - Paris",
                    "bio": null,
                    "position": "Research associate",
                    "purpose": null,
                    "register": "2019-11-25T20:53:57.795Z"
                },
                {
                    "institution": "radiology department of jn medical college",
                    "bio": "do reseach on brain by using 3t mri",
                    "position": null,
                    "purpose": null,
                    "register": "2019-11-28T05:59:51.849Z"
                },
                {
                    "institution": "University Of Colorado Anschutz Medical Campus",
                    "bio": null,
                    "position": "Professional Research Assistant ",
                    "purpose": null,
                    "register": "2019-12-04T21:02:37.754Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "This is only used by guest user",
                    "position": "Guest",
                    "purpose": "To be used as a guest account"
                },
                {
                    "institution": "Xrathus",
                    "bio": "I studied at UTDallas for Video Game Design, now looking to branch out.",
                    "position": "UX Designer",
                    "purpose": "Just want to test it out, heard good things about it.",
                    "register": "2019-12-10T00:00:05.897Z"
                },
                {
                    "institution": "University of Liege",
                    "bio": "Postdoctoral Fellow in GIGA-Cyclotron Research Center (CRC) In-vivo Imaging and Chronobiology Lab at University of liege, Belgium with extensive research experience in the field of Alzheimer's disease. Area of expertise includes genomics, pharmacogenomics, neuroimaging, systems pharmacology and network biology.",
                    "position": "Postdoc",
                    "purpose": "I am interested in Segmentation of thalamic nuclei.",
                    "register": "2019-12-13T11:48:42.693Z"
                },
                {
                    "institution": "University of Liege",
                    "bio": "Postdoctoral Fellow in GIGA-Cyclotron Research Center (CRC) In-vivo Imaging and Chronobiology Lab at University of liege, Belgium with extensive research experience in the field of Alzheimer's disease. Area of expertise includes genomics, pharmacogenomics, neuroimaging, systems pharmacology and network biology.",
                    "position": "Postdoc",
                    "purpose": "I am interested in Segmentation of thalamic nuclei",
                    "register": "2019-12-13T11:57:32.154Z"
                },
                {
                    "institution": "NIMHANS",
                    "bio": "I am a researcher.",
                    "position": "PhD Scholar",
                    "purpose": "Learn the neuroimaging",
                    "register": "2019-12-16T18:11:16.865Z"
                },
                {
                    "institution": "INRIA",
                    "bio": "I'm currently research director (DR, HDR) at Inria in the Parietal Team. My work is on statistical machine learning, signal and image processing, optimization, scientific computing and software engineering with primary applications in brain functional imaging (MEG, EEG, fMRI). Before joining Inria, I was an assistant professor for 5 years at Telecom ParisTech in the signal processing and machine learning department and before I was at the Martinos Center for Biomedical Imaging at Harvard University in Boston.",
                    "position": "Senior Researcher",
                    "purpose": "Work with MEG/EEG using MNE-Python based bids-apps",
                    "register": "2019-12-17T07:56:23.982Z"
                },
                {
                    "institution": "York University Neuropsychology lab",
                    "bio": "I'm a software developer and work as a part time researcher at the Neuropsychology lab at York U Glendon campus",
                    "position": "Research Assistant / Programmer",
                    "purpose": "To evaluate the safe use of models when running in mobile devices",
                    "register": "2019-12-19T04:00:11.975Z"
                },
                {
                    "institution": "Indiana University Apostolova Lab",
                    "bio": "I graduated from CU Boulder with a Bachelor's in Neuroscience and a minor in Computer Science where I became interested in all things Neuroimaging. I received my master's degree from the Neuroimaging and Informatics program at the University of Southern California and have joined the Apostolova lab as a research technologist primarily analyzing LEADS data. I am open to any opportunities to collaborate or start new projects involving other datasets available to the lab such as ADNI and ImaGene.",
                    "position": "Research Technologist",
                    "purpose": "I would like to use the platform for collaborations with various data sets and code sets. I would love the opportunity to start new projects or receive collaborations on current projects in the lab as well as share pipelines for processing various imaging data.",
                    "register": "2019-12-20T18:20:13.351Z"
                },
                {
                    "institution": "University of Calcutta",
                    "bio": "I'm an undergrad chemical engineering student.",
                    "position": "Student",
                    "purpose": "I want to analyze data and find the communities.",
                    "register": "2019-12-21T20:34:46.875Z"
                },
                {
                    "institution": "Infoservices llc",
                    "bio": "Machine Learning engineer working on AI projects for various domains",
                    "position": "Software Architect",
                    "purpose": "End To End project life cycle",
                    "register": "2019-12-23T01:53:42.059Z"
                },
                {
                    "institution": "Korea Advanced Institute of Science and Technology",
                    "bio": "Bio and Brain Engineering Department, Korea Advanced Institute of Science and Technology",
                    "position": "Undergraduate Student",
                    "purpose": "Process MRI images",
                    "register": "2019-12-31T03:16:54.979Z"
                },
                {
                    "institution": "Radiology department of Shandong Provincial Hospital",
                    "bio": "focus on the development of human brain",
                    "position": "Doctor",
                    "purpose": "looking for some codes which is suitable to my research",
                    "register": "2020-01-02T03:02:15.587Z"
                },
                {
                    "institution": "Cherry Creek High School",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "Research with DTI and connectomes",
                    "register": "2020-01-07T01:57:32.793Z"
                },
                {
                    "institution": "Pandit Deendayal Petroleum University",
                    "bio": "I am computer science student with major in machine learning and exploring the vast field of neuroscience.",
                    "position": "Student",
                    "purpose": "I intend to use datasets available in brain.io for research purposes.",
                    "register": "2020-01-08T09:01:29.688Z"
                },
                {
                    "institution": "Laboratory for Computational Neurodiagnostics",
                    "bio": "I am currently working on a project modeling neural recruitment with game theory and control theory.",
                    "position": "High School Researcher",
                    "purpose": "I would like to acquire data to analyze for my current and future projects.",
                    "register": "2020-01-08T20:52:02.773Z"
                },
                {
                    "institution": "Savitribai Phule Pune University",
                    "bio": "I am a student pursuing my masters degree in statistics. I am in final final year.",
                    "position": "Student",
                    "purpose": "A good source and clean data.",
                    "register": "2020-01-09T10:01:27.931Z"
                },
                {
                    "institution": "tehran university of medical science",
                    "bio": "biomedical engineering student",
                    "position": "student",
                    "purpose": "learn how to analysis brain image data",
                    "register": "2020-01-11T20:43:54.21Z"
                },
                {
                    "institution": "Northwestern University",
                    "bio": "PhD student at Northwestern studying functional brain networks",
                    "position": "PhD student",
                    "purpose": "I'd like to be able to get a sense of a data set before I actually do the work of getting it in my development environment",
                    "register": "2020-01-14T22:22:12.934Z"
                },
                {
                    "institution": "University Medical Center Hamburg-Eppendorf",
                    "bio": "Computer scientist in neuroscience",
                    "position": "Research assistant",
                    "purpose": "Infrastructure research",
                    "register": "2020-01-15T13:13:37.158Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I’ve published papers and developed software on many scientific fields, including bioinformatics, text analysis, scientometry, information science, and urban networks. My current focus is in science of science and network visualization.",
                    "position": "Research Scientist",
                    "purpose": "My interests include developing and implementing new techniques for analyzing, modeling and understanding real-world systems through complex networks, machine learning and data visualization."
                },
                {
                    "institution": "aude",
                    "bio": "28 years",
                    "position": "ceo",
                    "purpose": "nice",
                    "register": "2020-01-17T21:55:28.193Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Cognitive Science student learning about the mind",
                    "position": "Student",
                    "purpose": "I would like to become familiar with the software so that I can learn more about the brain and go on to use it for the implementation of future research questions and projects of my own.",
                    "register": "2020-01-20T05:20:34.321Z"
                },
                {
                    "institution": "University of Hildesheim",
                    "bio": "I am currently scientific officer and PhD candidate in Germany.",
                    "position": "PhD candidate",
                    "purpose": "I'd like to search through brainlife for paper publication.",
                    "register": "2020-01-20T09:09:32.422Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Student at Indiana University Bloomington.",
                    "position": "Student",
                    "purpose": "Collaborate with Professor and students.",
                    "register": "2020-01-20T15:33:36.211Z"
                },
                {
                    "institution": "SJTU",
                    "bio": "focus on neurology",
                    "position": "graduate",
                    "purpose": "learning",
                    "register": "2020-01-20T16:41:20.196Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "PhD student in Andrea Hohmann's lab. Studying cannabinoids and pain.",
                    "position": "Student",
                    "purpose": "Learn neuroanatomy",
                    "register": "2020-01-20T20:59:01.733Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "Hi. I am a first year graduate student in Department of Psychological and Brain Sciences at Indiana University Bloomington. I am pursuing PhD in two majors: Neuroscience and Psychology.",
                    "position": "Graduate Student",
                    "purpose": "I would use it as an aid along with class lectures for the course N501 Neural Sciences II, to better understand the neuroanatomy.",
                    "register": "2020-01-20T21:49:41.908Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am a Senior Psychology student at Indiana University",
                    "position": "student",
                    "purpose": "i expect to learn about the program and utilize it in my class",
                    "register": "2020-01-20T23:05:56.289Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am a senior at Indiana University aiming to become a physician scientist.",
                    "position": "Student",
                    "purpose": "I will be using brainlife as a tool to learn to analyze brain imaging data.",
                    "register": "2020-01-21T01:23:49.217Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Epidemiology PhD student minoring in neuroscience with the hope of increasing the body of research in Population Neuroscience",
                    "position": "Student",
                    "purpose": "Learn more brain things",
                    "register": "2020-01-21T01:33:24.779Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am a PhD student in the Neuroscience Program at Indiana University who is very excited to broaden my wheelhouse of expertise and interests.",
                    "position": "Graduate Student",
                    "purpose": "I want to become well-versed in knowing the different areas of the brain and their specific functions' within the central nervous system. Once I do obtain that knowledge, I want this resource to help me maintain that knowledge.",
                    "register": "2020-01-21T02:26:53.683Z"
                },
                {
                    "institution": "Indiana University-Bradshaw/Straiker Lab",
                    "bio": "I recently graduated with a BA in Biology from a small liberal arts college in Wisconsin. I want to take the experience and knowledge I've gained from my time as an undergraduate and use it to enhance my time as a PhD student in the Neuroscience Program at Indiana.",
                    "position": "Graduate Student",
                    "purpose": "I would like Brainlife.io to help boost my knowledge on both the central and peripheral nervous systems. I know there are things about the brain I could review and become more knowledgeable about and that is what I am hoping this platform allows me to do.",
                    "register": "2020-01-21T02:35:07.789Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "I am a pediatric physical therapist with further interest in neuroscience.",
                    "position": "Graduate student",
                    "purpose": "Get illustrated pictures of cortical and subcortical structures for a better understanding of neuroanatomy.",
                    "register": "2020-01-21T03:12:54.473Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "Dual major PhD student in Neuroscience and Kinesiology at IUB.",
                    "position": "Student",
                    "purpose": "Know more about the brain anatomy.",
                    "register": "2020-01-21T12:19:45.691Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "Graduate student in Sensorimotor Neurophysiology Lab",
                    "position": "Graduate student",
                    "purpose": "Explore the website",
                    "register": "2020-01-21T12:49:29.355Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Graduate student of Neuroscience and Psychology",
                    "position": "Graduate student",
                    "purpose": "Class requirements/research",
                    "register": "2020-01-21T13:42:22.999Z"
                },
                {
                    "institution": "Indiana University, Bloomington Crystal Lab",
                    "bio": "I study animal models of mTBI",
                    "position": "Grad Student",
                    "purpose": "Use for class",
                    "register": "2020-01-21T13:44:00.176Z"
                },
                {
                    "institution": "University of Tehran",
                    "bio": "Master Student in University of Tehran",
                    "position": "Master Student",
                    "purpose": "brain datasets",
                    "register": "2020-01-21T21:41:41.661Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am creating a test user account to demonstrate how to create an account on brainlife.io",
                    "position": "Student",
                    "purpose": "Creating a test user account to demonstrate how to create an account on brainlife",
                    "register": "2020-01-21T22:33:48.387Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Student at Indiana University",
                    "position": "Student",
                    "purpose": "Signing up for class.",
                    "register": "2020-01-22T01:23:07.643Z"
                },
                {
                    "institution": "LAB IN COGNITIVE AND COMPUTATIONAL NEUROSCIENCE",
                    "bio": "I am currently a junior studying neuroscience.",
                    "position": "Student",
                    "purpose": "I want to learn how to use the platform for data analysis, manage data​, contribute to the documentation ​and generate publications",
                    "register": "2020-01-22T17:57:50.97Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I will add it later!",
                    "position": "Student",
                    "purpose": "Hopefully, to understand the procedure of data analyzing using the application!",
                    "register": "2020-01-22T18:03:13.392Z"
                },
                {
                    "institution": "Stanford University",
                    "bio": "BS Physics, PhD Neuroscience",
                    "position": "postdoctoral fellow",
                    "purpose": "possibly add new analysis tools",
                    "register": "2020-01-22T18:58:22.212Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "Undergraduate Senior majoring in Psychology",
                    "position": "Student",
                    "purpose": "Experience the processes involved in data analysis and cognitive computation.",
                    "register": "2020-01-22T20:22:13.28Z"
                },
                {
                    "institution": "Indiana University-Bloomington",
                    "bio": "I'm a senior studying Psychology, Neuroscience, Italian, and Spanish at Indiana University.",
                    "position": "Undergraduate Student",
                    "purpose": "I would like to understand the platform well enough that I would be able to share it to professionals in the future.",
                    "register": "2020-01-22T20:26:46.61Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am a senior studying Psychology.",
                    "position": "Student",
                    "purpose": "Following along with my courses.",
                    "register": "2020-01-22T20:34:43.23Z"
                },
                {
                    "institution": "University of Toronto",
                    "bio": "A student who is interested in learning the secrets hidden in the brain.",
                    "position": "Student",
                    "purpose": "Obtain data for undergrad thesis involving computational methods of investigating consciousness.",
                    "register": "2020-01-22T21:52:42.102Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "n/a",
                    "position": "Student",
                    "purpose": "n/a",
                    "register": "2020-01-22T22:05:44.334Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Senior Undergrad studying Neuroscience.",
                    "position": "RA",
                    "purpose": "Collect Data",
                    "register": "2020-01-22T22:06:17.934Z"
                },
                {
                    "institution": "indiana University",
                    "bio": "I am a neuroscience major",
                    "position": "Student",
                    "purpose": "To learn more about data collections.",
                    "register": "2020-01-22T22:10:15.617Z"
                },
                {
                    "institution": "DynaCSE",
                    "bio": "In between master and PhD, i'm working on new skills (biology and computing) to be ready for it. Particularly interested in exploring social interaction and so cultural organization through new methodologies.",
                    "position": "Student",
                    "purpose": "Having access to DTI data and connectivity matrices to be able to construct neural-mass models.",
                    "register": "2020-01-23T12:20:08.148Z"
                },
                {
                    "institution": "HCI",
                    "bio": "This is Sparta !!",
                    "position": "Lead Developer",
                    "purpose": "To be the best",
                    "register": "2020-01-24T19:11:29.721Z"
                },
                {
                    "institution": "Northeastern University",
                    "bio": "A postdoc interested in brain networks, aging, and memory.",
                    "position": "Postdoctoral Research Associate",
                    "purpose": "Fast and efficient processing of DTI data with visualization capabilities without having to depend on the local graphic resources.",
                    "register": "2020-01-28T16:36:36.357Z"
                },
                {
                    "institution": "University of Luxembourg",
                    "bio": "PostDoctoral Scholar",
                    "position": "PostDoctoral Scholar",
                    "purpose": "Upload data",
                    "register": "2020-01-29T22:53:43.092Z"
                },
                {
                    "institution": "Institute for fundamental studies IPM",
                    "bio": "M.D. graduate, highly enthusiastic about brain and brain science.",
                    "position": "Research assistant",
                    "purpose": "Participate in neuroimaging studies and ultimately publish a paper based on the available datasets.",
                    "register": "2020-01-30T15:30:37.268Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "undergrad in the pestilli lab",
                    "position": "student RA",
                    "purpose": "learning to analyze data",
                    "register": "2020-01-31T18:06:58.721Z"
                },
                {
                    "institution": "Skolttech",
                    "bio": "-",
                    "position": "head of Cobrain Development",
                    "purpose": "look into!",
                    "register": "2020-02-01T02:28:51.342Z"
                },
                {
                    "institution": "Fudan University",
                    "bio": "I am researching on medical image",
                    "position": "student for MD",
                    "purpose": "freesurfer. Now I lack enough computation to do this using my own computer",
                    "register": "2020-02-02T03:19:57.584Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Computer science major with an interest in machine learning",
                    "position": "Student",
                    "purpose": "Use datasets to conduct neuro imaging research",
                    "register": "2020-02-03T19:45:09.872Z"
                },
                {
                    "institution": "Indiana University, Bloomington",
                    "bio": "Student with interest in machine learning",
                    "position": "Student",
                    "purpose": "Using for research in neuro imaging",
                    "register": "2020-02-03T21:56:37.502Z"
                },
                {
                    "institution": "Ewha womans university",
                    "bio": "interested in neuroscience",
                    "position": "Student",
                    "purpose": "to learn about more things",
                    "register": "2020-02-04T04:50:42.761Z"
                },
                {
                    "institution": "Bejing University of Chinese Medicine",
                    "bio": "I got my MD at 2000 in BUCM. Now I 'm  working in nerurology departement of Dongzhimen hosipital.",
                    "position": "Chief physician of Neurology Departement",
                    "purpose": "To visualize symptoms of traditional chinese medicine using fmri and dti",
                    "register": "2020-02-05T02:04:45.125Z"
                },
                {
                    "institution": "SUNY Geneseo / Social-Emotional Development Lab",
                    "bio": "Developmental cognitive neuroscientist",
                    "position": "Visiting Assistant Professor",
                    "purpose": "Not sure yet",
                    "register": "2020-02-05T02:58:15.631Z"
                },
                {
                    "institution": "Brigham Women's Hospital",
                    "bio": "Hi I'm Kevin",
                    "position": "Postdoc",
                    "purpose": "Want to look at how it works.",
                    "register": "2020-02-05T14:44:17.836Z"
                },
                {
                    "institution": "Franco Pestilli",
                    "bio": "Sophomore at Indiana University Bloomington",
                    "position": "Research Assistant",
                    "purpose": "Learn more about how neuroimaging data set works and are organized",
                    "register": "2020-02-05T17:07:53.173Z"
                },
                {
                    "institution": "Columbia Uniersity",
                    "bio": "PhD Candidate in Biomedical Engineering",
                    "position": "PhD Candidate",
                    "purpose": "EEG, fMRI, neuroscience, image processing, machine and deep learning",
                    "register": "2020-02-05T21:17:51.341Z"
                },
                {
                    "institution": "Blue Brain Project",
                    "bio": "Engineer, Data Scientist, Product Manager",
                    "position": "Product Manager",
                    "purpose": "Some inspiration",
                    "register": "2020-02-10T14:41:29.923Z"
                },
                {
                    "institution": "University of Florida",
                    "bio": "I'm a graduate Electrical Engineering student and I'm interested in testing and applying machine learning algorithms on medical data",
                    "position": "Student",
                    "purpose": "Use accurate datasets",
                    "register": "2020-02-13T01:50:49.929Z"
                },
                {
                    "institution": "Open connectomes project of Jovo's lab",
                    "bio": "Our goal is to work together with neuro experimentalists to discover fundamental principles governing the relationship between mind and brain, via building and deploying open source data-driven tools that run at scale.",
                    "position": "Student researcher",
                    "purpose": "We are a group of student researchers under Professor Vogelstein at Johns Hopkins University working on collecting publically available dMRI datasets for connectome generation. The goal is to process these brain dMRI datasets and publish the resulting connectomes as an open source datasets. In addition we will submit a publication of these results as a data descriptor paper in scientific data.",
                    "register": "2020-02-14T20:50:03.264Z"
                },
                {
                    "institution": "captial normal university",
                    "bio": "Graduate student of applied psychology",
                    "position": "Beijing China",
                    "purpose": "Learn how to process data",
                    "register": "2020-02-15T04:36:07.695Z"
                },
                {
                    "institution": "Boston University",
                    "bio": "Neuroscience graduate student studying the human visual system.",
                    "position": "Graduate Student",
                    "purpose": "Big data analyses exploration",
                    "register": "2020-02-16T00:32:55.25Z"
                },
                {
                    "institution": "IMT School for Advanced Studies Lucca",
                    "bio": "PhD Student in Cognitive, Computational and Social Neuroscience",
                    "position": "PhD Student",
                    "purpose": "Data preprocessing and analysis",
                    "register": "2020-02-17T10:39:28.955Z"
                },
                {
                    "institution": "University of Sydney",
                    "bio": "I have just completed my PhD",
                    "position": "PhD candidate",
                    "purpose": "I would like to gain some experience processing and analysing different types of data",
                    "register": "2020-02-17T11:19:06.167Z"
                },
                {
                    "institution": "DrMohit",
                    "bio": "fMRI, DTI\nPresurgical Planning",
                    "position": "Advanced Imaging NeuroScientist",
                    "purpose": "convert one format to others",
                    "register": "2020-02-17T21:30:20.024Z"
                },
                {
                    "institution": "Brain Science and Brain Inspired Institute",
                    "bio": "Currently just an associate engineer",
                    "position": "associate engineer",
                    "purpose": "explore the combination of neuroscience softwares",
                    "register": "2020-02-18T08:29:40.655Z"
                },
                {
                    "institution": "Innovation Alpha",
                    "bio": "Designer – not a scientist",
                    "position": "Head of Design",
                    "purpose": "Exploring whether brain scan data could be used as a source for a design project. Just looking for inspiration.",
                    "register": "2020-02-18T13:12:02.492Z"
                },
                {
                    "institution": "University of California Berkeley",
                    "bio": ".",
                    "position": "Research Associate",
                    "purpose": "To promote and access open sharing data",
                    "register": "2020-02-18T20:29:02.903Z"
                },
                {
                    "institution": "University at Buffalo",
                    "bio": "As director of UB’s Neuroengineering and Informatics for Rehabilitation Laboratory (NIRlab), I conduct interdisciplinary research in neural engineering, the application of engineering to the neurosciences. My academic and research training in neurotechnology, motor rehabilitation, clinical neurophysiology and cerebrovascular medicine provides me with the expertise for translational research focused on developing computational models and hardware technologies for neural interfaces to monitor and activate beneficial neural function.",
                    "position": "Assistant Professor",
                    "purpose": "data analysis",
                    "register": "2020-02-19T04:03:09.629Z"
                },
                {
                    "institution": "University of Sheffield",
                    "bio": "I work in the School of Education at the University of Sheffield, teaching cognitive and developmental psychology.",
                    "position": "Lead Technician",
                    "purpose": "I would like to experiment with looking at fMRI based datasets and showing to students how neuroimaging data can be processed.",
                    "register": "2020-02-21T04:13:25.902Z"
                },
                {
                    "institution": "northwestern medicine",
                    "bio": "Neuroimaging",
                    "position": "presurgical tumor evaluation",
                    "purpose": "convert tck to trk",
                    "register": "2020-02-21T20:29:56.238Z"
                },
                {
                    "institution": "University of Chicago",
                    "bio": "PhD student in Psychology, Integrative Neuroscience",
                    "position": "PhD Student",
                    "purpose": "Data analysis",
                    "register": "2020-02-22T15:27:35.194Z"
                },
                {
                    "institution": "Instute of Psychology, CAS",
                    "bio": "A researcher.",
                    "position": "Postdoc",
                    "purpose": "To learn more about replicable fMRI data processing, to use the shared data for research and to share data and data analysis."
                },
                {
                    "institution": "CUSB Gaya",
                    "bio": "student",
                    "position": "research scholar",
                    "purpose": null,
                    "register": "2020-02-24T06:12:39.341Z"
                },
                {
                    "institution": "University hospital Mannheim, Germany, Neurology dept.",
                    "bio": "MD  Resident Neurology, interested in cognitive neuroscience, memory and pain",
                    "position": "MD",
                    "purpose": "Share code, get support from community",
                    "register": "2020-02-24T12:29:17.41Z"
                },
                {
                    "institution": "Metal Whale",
                    "bio": "Interested in multi-model deep learning",
                    "position": "Developer",
                    "purpose": "Find datasets and share my experiences with people",
                    "register": "2020-02-25T02:37:56.978Z"
                },
                {
                    "institution": "University of Toronto",
                    "bio": "Developmental cognitive neuroscientist",
                    "position": "Assistant Professor",
                    "purpose": "Learn about brainlife!",
                    "register": "2020-02-25T19:05:08.072Z"
                },
                {
                    "institution": "Boston University",
                    "bio": "Research Technologist, merging artificial intelligence and neuroscience data.",
                    "position": "Research Assistant",
                    "purpose": "Initially, testing to compare against other neuroimaging software.",
                    "register": "2020-02-26T06:25:13.584Z"
                },
                {
                    "institution": "Hanyang University",
                    "bio": "I am a postdoctoral researcher at Hanyang University Colledge of Medicine,  majoring in biomedical engineering.",
                    "position": "post-doctoral researcher",
                    "purpose": "The goal of my research program is to develop methods for vision neuroscience.",
                    "register": "2020-02-26T20:13:16.533Z"
                },
                {
                    "institution": "Amrita University",
                    "bio": "I am a student of BioMedical Engineering",
                    "position": "Student",
                    "purpose": "To analyse the Brain Data and observers various functionalities",
                    "register": "2020-02-28T01:49:07.518Z"
                },
                {
                    "institution": "Independent",
                    "bio": "Semi-retired former Chief Information Officer with 35 years experience in consulting and government agencies. Educated at UofW and Harvard. My technical academic background is in statistics and IT. My most recent business application work has been in applying AI tools in help desk applications. I have also recently been  diagnosed with Alzheimer’s Disease, and a reduction over time in hippocampus volume, based upon 2 data points established 4 years apart.  I refuse to accept my health prognosis and so I am working with my neurological team on a broad program of aerobic & other exercise, nutrition, calorie restriction (temporary fasting) and more. I hope to participate in some clinical trials. My daughter is currently an M.D. practicing at the Yale Medical Health Center and also trying to find opportunities for me as I might as an interesting test and use case for many future Alzheimer’s solutions",
                    "position": "Semi-retired former CIO, former university educator ( statistics, IT and signal theory). 8 years ago I was one of the first CIO’s in the world to implement an all silicon array high IO storage and computing environment in business - for specific uses I faced, eg high data transfer demands upon data ingestion and compute needs eg real-time crisis management and AI application use.",
                    "purpose": "Devote my time and effort to the use of AI and other tools to improve Alzheimer’s Disease diagnostic tools, prevention, and the improvement of the human condition. Given my own recent diagnosis of Alzheimer’s Disease, this a very personal quest for me.",
                    "register": "2020-02-28T04:03:02.7Z"
                },
                {
                    "institution": "Instituto Superior Técnico",
                    "bio": "MSc Biomedical Engineering",
                    "position": "Msc Biomedical Engineering",
                    "purpose": "study brain connectivity in grain and disease through fMRI",
                    "register": "2020-02-28T14:48:31.72Z"
                },
                {
                    "institution": "Yale University",
                    "bio": "Geneticist working with population and individual data to understand how genetics influence language.",
                    "position": "Associate Research Scientist",
                    "purpose": "I'm interested in replicating some of my results from our imaging genetics study here at Yale.",
                    "register": "2020-02-29T15:04:36.102Z"
                },
                {
                    "institution": "North Carolina School of Science and Mathematics",
                    "bio": "Student researcher",
                    "position": "Student",
                    "purpose": "Learn how to analyze brain imaging data",
                    "register": "2020-03-01T18:36:16.906Z"
                },
                {
                    "institution": "Colorado State University",
                    "bio": "Cognitive Neuroscientist",
                    "position": "Graduate Student",
                    "purpose": "Streamline processing for undergraduates",
                    "register": "2020-03-02T17:05:40.608Z"
                },
                {
                    "institution": "UFMG",
                    "bio": "Neuroscientist",
                    "position": "Post-graduation student",
                    "purpose": "Having a great lab notebook",
                    "register": "2020-03-03T00:03:19.989Z"
                },
                {
                    "institution": "Shanghai Jiao Tong University Affiliated Sixth People's Hospital",
                    "bio": "Radiologist for 20 years",
                    "position": "Radiologist",
                    "purpose": "To determine the prevalence of carotid web in patients with acute TIA and ischemic stroke and identify the clinical and imaging characteristics.",
                    "register": "2020-03-03T09:05:26.166Z"
                },
                {
                    "institution": "Sainy-Petersburg state university",
                    "bio": "Student of the biology faculty. Working on the research of neurophysiology correlates of insight.",
                    "position": "Student",
                    "purpose": "I would like to use brainlife apps for our fMRI data.",
                    "register": "2020-03-03T20:44:30.987Z"
                },
                {
                    "institution": "Brainbits",
                    "bio": "Neurophile and everything brainish",
                    "position": "Director",
                    "purpose": "Brain and Reading research",
                    "register": "2020-03-03T21:20:43.491Z"
                },
                {
                    "institution": "Human-Engaged",
                    "bio": "neuroscience",
                    "position": "researcher",
                    "purpose": "study data processing",
                    "register": "2020-03-05T08:09:52.687Z"
                },
                {
                    "institution": "McGill University",
                    "bio": "[]",
                    "position": "Ph.D. Student",
                    "purpose": "Import and analyze my studies MRI data",
                    "register": "2020-03-05T13:31:50.419Z"
                },
                {
                    "institution": "Social Neuroscience and Psychopathology Laboratory; Rush University Medical Center",
                    "bio": "Clinical psychologist and psychosis researcher interested in memory, social cognition and sleep.",
                    "position": "Assistant Professor",
                    "purpose": "We have limited neuroimaging processing power and a lot of data - I'm looking to lighten the load and this service came highly recommended by Lei Wang.",
                    "register": "2020-03-05T22:46:12.624Z"
                },
                {
                    "institution": "Bogazici University",
                    "bio": "student",
                    "position": "student",
                    "purpose": "looking dataset",
                    "register": "2020-03-06T11:28:33.722Z"
                },
                {
                    "institution": "URJC",
                    "bio": "Biomedical Engineering",
                    "position": "Student",
                    "purpose": "Download a database",
                    "register": "2020-03-06T17:32:06.386Z"
                },
                {
                    "institution": "Sapienza",
                    "bio": "Neuroimaging and Medical Student",
                    "position": "Researcher and student",
                    "purpose": "i hope it can become a very valuable tool to be used everyday in the lab",
                    "register": "2020-03-09T09:17:07.955Z"
                },
                {
                    "institution": "inje university student",
                    "bio": "student studying medical image",
                    "position": "student",
                    "purpose": "studying medical image",
                    "register": "2020-03-09T09:43:44.329Z"
                },
                {
                    "institution": "Lund University",
                    "bio": "- PhD in Applied Mathematics in Paris Saclay University (2013-2017)\n- PostDoc in Neuroimaging in Cambridge University (2017-2019)\n- PostDoc in Neuroimaging in Lund University (2019-current)",
                    "position": "PostDoc Researcher",
                    "purpose": "Compare different methods, reproduce published results.",
                    "register": "2020-03-09T12:17:41.792Z"
                },
                {
                    "institution": "Charité - Universitätsmedizin Berlin",
                    "bio": "I am a young investigator and clinician scientist (MD) at the Movement Disorder and Neuromodulation Unit at Charité Berlin. I have built an expertise in movement disorders neurophysiology and deep brain stimulation. My strengths are the implementation of methods for multimodal and multidimensional data analysis for clinical neuroscience applications. My current work combines computational modelling, deep learning, structural and functional connectivity mapping (fMRI), invasive (LFP/ECoG) and non-invasive (EEG/MEG) recordings, to elucidate the role of the basal ganglia in health and disease.",
                    "position": "Assistant Professor (W1) for Interventional and Cognitive Neuromodulation",
                    "purpose": "I would like to standardize data analysis routines to improve reprdocuibility of my research.",
                    "register": "2020-03-09T20:04:43.761Z"
                },
                {
                    "institution": "Neurocogcialab, School of Psychology, UNAM.",
                    "bio": "Undergraduate psychology student with special focus in neuroscience.",
                    "position": "Undergraduate Research Assistant",
                    "purpose": "I'd like to conduct my preprocessing pipelines of fMRI data in a more clear and efficient way, I expect it to be easier than most tools available at my univeristy, specially for the computation power.",
                    "register": "2020-03-10T05:01:27.368Z"
                },
                {
                    "institution": "National Tsing Hua University / Behavioral Informatics & Interaction Computation Lab",
                    "bio": "Hi I'm Chad from Taiwan. Currently I am a Ph.D student enthusiastic in behavior science. The main research area includes but not limited to affective multi-media, physiological signal processing, and neuro-image processing.",
                    "position": "Student",
                    "purpose": "Get intouch more open dataset.",
                    "register": "2020-03-10T06:31:16.23Z"
                },
                {
                    "institution": "VU university",
                    "bio": "PhD student",
                    "position": "PhD candidate",
                    "purpose": "share and use the data",
                    "register": "2020-03-10T13:05:14.624Z"
                },
                {
                    "institution": "UT Dallas",
                    "bio": "Interested in brain networks in healthy and disease populations as well as machine learning",
                    "position": "Ph.D. Student",
                    "purpose": "Learn more about advancing neuroimaging techniques and methods",
                    "register": "2020-03-10T21:27:42.262Z"
                },
                {
                    "institution": "Georgia Institute of Technology",
                    "bio": null,
                    "position": "Masters Student, Music Technology",
                    "purpose": null,
                    "register": "2020-03-10T21:36:26.284Z"
                },
                {
                    "institution": "Indiana university",
                    "bio": "Computer Vision student",
                    "position": "student",
                    "purpose": "Research",
                    "register": "2020-03-11T13:13:31.23Z"
                },
                {
                    "institution": "ITC SB RAS",
                    "bio": "yep.",
                    "position": "Jr. Researcher",
                    "purpose": "Share and collaborate. Collaborate and share.",
                    "register": "2020-03-12T07:26:57.317Z"
                },
                {
                    "institution": "Ural Federal University",
                    "bio": "Research Assistant at the laboratory of the Brain Technology",
                    "position": "Research Assistant",
                    "purpose": "working on cognitive impairments after stroke",
                    "register": "2020-03-12T14:05:10.786Z"
                },
                {
                    "institution": "Google",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "Research",
                    "register": "2020-03-13T01:28:54.78Z"
                },
                {
                    "institution": "université de Strasbourg",
                    "bio": "i'm a PhD student",
                    "position": "PhD student",
                    "purpose": "download a database",
                    "register": "2020-03-13T22:15:14.486Z"
                },
                {
                    "institution": "xENI lab, neurologic department University Medical Center Hamburg-Eppendorf",
                    "bio": "After I graduated from secondary school, I moved from my hometown Bonn to Hamburg to study medicine and to pursue my goal of becoming a physician. I have taken an interest in neurosciences early in my studies and I have not lost it since. In addition to that I have a passion for music, for culture overall and for football.",
                    "position": "I am a medical doctorate",
                    "purpose": "I am hoping that my use of brainlife will help me in preparing for my doctoral thesis and to gain more insight in the methods and tools of neuroscience.",
                    "register": "2020-03-15T16:25:33.297Z"
                },
                {
                    "institution": "The University of Texas at Dallas",
                    "bio": "cog neuro postdoc @ CVL-UT Dallas",
                    "position": "Postdoc",
                    "purpose": "Test machine learning work on neuroimaging data.",
                    "register": "2020-03-15T20:50:28.854Z"
                },
                {
                    "institution": "MSU",
                    "bio": "Communication Neuroscience",
                    "position": "Asst. Prof",
                    "purpose": "use fMRIprep and other things!",
                    "register": "2020-03-17T21:55:54.258Z"
                },
                {
                    "institution": "University of Minnesota",
                    "bio": "Researcher in image analysis (mostly microscopy) and Director of Applications and Services at the Informatics Institute",
                    "position": "Director of Applications and Services, UMII",
                    "purpose": "Interested in workflow automation in neuroimaging",
                    "register": "2020-03-18T17:10:54.635Z"
                },
                {
                    "institution": "Prof. Eleonora Aronica's lab",
                    "bio": "Post doc",
                    "position": "pathology resident",
                    "purpose": "share imaging data of various specialities",
                    "register": "2020-03-19T13:48:17.23Z"
                },
                {
                    "institution": "University of Delaware",
                    "bio": "I am a cognitive neuroscientist studying language development using multiple neuroimaging methods.",
                    "position": "Assistant Professor",
                    "purpose": "I am hoping to discover novel neuroimaging tools. I also greatly appreciate the transparency and openness of this platform that allows collaboration and reproducible analyses.",
                    "register": "2020-03-20T17:42:14.045Z"
                },
                {
                    "institution": "University of Nottingham",
                    "bio": "Assistant Professor in Psychology",
                    "position": "Assistant Professor",
                    "purpose": "Process MRI data online",
                    "register": "2020-03-21T22:05:51.247Z"
                },
                {
                    "institution": "SRBIAU",
                    "bio": "I'm Master Student in Biomedical engineering",
                    "position": "Master Student",
                    "purpose": "Looking for a new Platform to Analysis my eeg-fMRI data",
                    "register": "2020-03-22T13:05:33.132Z"
                },
                {
                    "institution": "Emory University",
                    "bio": "I am working at Department of Radiology, Emory University. My research area is diffusion MRI, perfusion MRI and molecular imaing.",
                    "position": "Research Associate",
                    "purpose": "We would like to optime AI imaging analysis method for perfusion MRI.",
                    "register": "2020-03-22T15:41:26.437Z"
                },
                {
                    "institution": "University of South Carolina",
                    "bio": "I received my PhD in Cognitive Neuroscience in 2014 at the University of California, Irvine, Dept. of Cognitive Sciences (advisor: Gregory Hickok). I am now an Assistant Prof. in the Dept. of Communication Sciences and Disorders at the University of South Carolina. I study the neurobiology of language, focusing on syntax and sentence processing, using mostly fMRI and lesion-symptom mapping in people with Aphasia.",
                    "position": "Assistant Professor",
                    "purpose": "To find useful datasets that can advance my research, in potential combination with data I've already collected (fMRI, lesion mapping).",
                    "register": "2020-03-24T14:04:57.656Z"
                },
                {
                    "institution": "UAM",
                    "bio": "MRI Researcher",
                    "position": "Researcher",
                    "purpose": "Testing",
                    "register": "2020-03-24T23:57:12.717Z"
                },
                {
                    "institution": "PKU",
                    "bio": "I'm a post-doc from school of physics in Peking University. My research topics are diffusion  imaging and fMRI.",
                    "position": "post doc",
                    "purpose": "I want to use some apps from braininfo for neuroimage data processing.",
                    "register": "2020-03-25T04:34:05.3Z"
                },
                {
                    "institution": "Indian Institute of Gandhinagar",
                    "bio": "Cognitive Science student",
                    "position": "Master student",
                    "purpose": "Cognitive neuroscience using EEG, fMRI, MEG",
                    "register": "2020-03-25T11:51:59.764Z"
                },
                {
                    "institution": "Cognitive NeuroLab",
                    "bio": "Curious young man",
                    "position": "Researcher",
                    "purpose": "Recon-all all",
                    "register": "2020-03-27T14:59:40.329Z"
                },
                {
                    "institution": "University of Sheffield",
                    "bio": "I am a postgraduate student.",
                    "position": "Student",
                    "purpose": "To access the data and finish the dissertation.",
                    "register": "2020-03-27T15:43:38.627Z"
                },
                {
                    "institution": "shanghaiTech",
                    "bio": "a student",
                    "position": "student",
                    "purpose": "learning",
                    "register": "2020-03-28T16:17:36.399Z"
                },
                {
                    "institution": "University of Melbourne",
                    "bio": "Neuroscience PhD student at the Melbourne Neuropsychiatry Centre investigating brain connectivity and structure in individuals with schizophrenia.",
                    "position": "PhD student",
                    "purpose": "I would like to segment the thalamus nucleus",
                    "register": "2020-03-29T01:16:14.532Z"
                },
                {
                    "institution": "epen",
                    "bio": "coder",
                    "position": "ai engineer",
                    "purpose": "life it self does not have any porpuse",
                    "register": "2020-03-30T21:21:55.761Z"
                },
                {
                    "institution": "Weill Cornell Medicine",
                    "bio": "I am a second year medical student who has conducted research in neuroscience for the past four years.",
                    "position": "Medical Student",
                    "purpose": "I would like to obtain access to the datasets available on this site to enhance my neuroimaging analysis skills.",
                    "register": "2020-03-31T21:47:28.99Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "I am an interdisciplinary doctoral student tackling problems at the intersection of neuroscience, statistics, psychiatry, and software engineering. My research involves developing new methods of graph statistical learning learning to forecast outcomes for psychiatric disorders.",
                    "position": "Graduate Student Research",
                    "purpose": "Compute resources",
                    "register": "2020-04-01T22:01:23.29Z"
                },
                {
                    "institution": "UiO",
                    "bio": "Currently working on ADHD-EEG",
                    "position": "Post doc",
                    "purpose": "I wish to see options/adding new analytical tools",
                    "register": "2020-04-02T10:30:54.523Z"
                },
                {
                    "institution": "University of Malaga",
                    "bio": "Postdoc researcher working on brain plasticity, aphasia recovery, language learning, reading, structural and functional neuroimaging",
                    "position": "Postdoc researcher",
                    "purpose": "Neuroimaging",
                    "register": "2020-04-02T14:41:11.161Z"
                },
                {
                    "institution": "University of Malaga",
                    "bio": "I am a junior researcher working on aphasia rehabilitation and language processing, particularly in repetition mechanisms and models of language expertise.",
                    "position": "Researcher",
                    "purpose": "Neuroimaging analysis pipeline and resource for processing",
                    "register": "2020-04-02T14:42:31.359Z"
                },
                {
                    "institution": "Temple University",
                    "bio": "A researcher working in the Neuroeconomics Lab and Social Developmental Neuroscience Lab at Temple University.",
                    "position": "Researcher",
                    "purpose": "I am here to learn more about analysis and to improve my workflows!",
                    "register": "2020-04-02T14:45:46.865Z"
                },
                {
                    "institution": "Temple University",
                    "bio": "I am an upcoming PhD student looking into the neural basis of social memory. I use FSL and DIPY to process DWI data.",
                    "position": "Graduate Student",
                    "purpose": "I would like to be able to use DIPY on this website in order to batch process subjects quickly.",
                    "register": "2020-04-02T15:49:29.676Z"
                },
                {
                    "institution": "UT Southwestern Medical Center",
                    "bio": "Interested in methods of processing and reproducibility.",
                    "position": "Neuroimaging Systems Engineer",
                    "purpose": "better, reproducible processing stream",
                    "register": "2020-04-02T17:29:10.684Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "Evolving from a consumer researcher to a consumer neuroscientist...",
                    "position": "Professor",
                    "purpose": "Learning neuroimaging data analysis tools",
                    "register": "2020-04-02T20:44:37.037Z"
                },
                {
                    "institution": "BCBL",
                    "bio": "Cognitive Neuroscience researcher, trained as a physician, interested in philosophy, history, economics and everything else!",
                    "position": "Post doc fellow.",
                    "purpose": "For the purpose of fMRI and MEG data analysis.",
                    "register": "2020-04-02T22:27:41.89Z"
                },
                {
                    "institution": "Research Center Jülich",
                    "bio": "Nerd turned psychologist turned programmer",
                    "position": "Group leader Psychoinformatics",
                    "purpose": "World domination!",
                    "register": "2020-04-03T05:32:34.54Z"
                },
                {
                    "institution": "Biocruces",
                    "bio": "In a PhD process.",
                    "position": "Engineer",
                    "purpose": "Study",
                    "register": "2020-04-03T11:58:45.511Z"
                },
                {
                    "institution": "Department of Neurology, University Hospital Knappschaftskrankenhaus Bochum, Ruhr University Bochum, Bochum, Germany",
                    "bio": "Clinical neuropsychologist and Ph.D. student in neuroscience, working on metacognitive processes and their neural signature in patients with dissociative seizures. I am skilled in the acquisition and analysis of structural neuroimaging data, behavioral, and psychometric data, as well as trained in working with neurological and psychiatric patients in clinical and research setting.",
                    "position": "Ph.D. candidate",
                    "purpose": "Structural (DTI, surface-based) neuroimaging analysis",
                    "register": "2020-04-03T12:38:48.971Z"
                },
                {
                    "institution": "Krembil Center for Neuroinformatics, CAMH",
                    "bio": "Brain imaging data engineer with expertise in large scale data analysis and ETL processes for MRI/EEG datasets.",
                    "position": "Brain Imaging Data Engineer",
                    "purpose": "We would like to incorporate brainlife into our imaging analysis workflow.",
                    "register": "2020-04-03T14:35:13.094Z"
                },
                {
                    "institution": "The University of Sydney",
                    "bio": "I am a theoretical neuroscientist working to understand the mechanisms of cognition and attention using functional brain imaging, both in health and disease. I am currently working as a Robinson/SOAR fellow at The University of Sydney to understand the factors that drive the network-level reorganization of the human brain. I completed my post-doc with Russell Poldrack at Stanford University, received my PhD from Sydney University in 2013 (PI: Simon JG Lewis), my MBBS from Sydney University in 2007 and my BSc from the University of Sydney in 2003.",
                    "position": "Robinson Fellow",
                    "purpose": "Data access and analysis",
                    "register": "2020-04-03T20:48:33.772Z"
                },
                {
                    "institution": "UCLA",
                    "bio": "I'm a student in Data Science and is interested in Neuroscience.",
                    "position": "Student",
                    "purpose": "I would like to explore data about neuroscience",
                    "register": "2020-04-04T22:29:48.364Z"
                },
                {
                    "institution": "German institute of Human Nutrition",
                    "bio": "Psychologist/Neuroscientist",
                    "position": "Postdoctoral researcher",
                    "purpose": "I'd like to try and explore the platform",
                    "register": "2020-04-05T05:54:48.13Z"
                },
                {
                    "institution": "UB",
                    "bio": "Yo mero",
                    "position": "Investigation",
                    "purpose": "Contribute with information and share experiences",
                    "register": "2020-04-05T15:10:38.837Z"
                },
                {
                    "institution": "UCSF",
                    "bio": "I'm interested in neurodevelopment and it's connection to cognition during normal aging and disease.",
                    "position": "Research Coordinator",
                    "purpose": "Perform analyses of DTI and rsfMRI data from the ABCD initiative.",
                    "register": "2020-04-06T23:33:04.738Z"
                },
                {
                    "institution": "School of Psychology, Bangor University",
                    "bio": "I was educated at James Cook University in Australia, where I received a Bachelor of Science (Honours), majoring in Chemistry and Biochemistry.  I have a PhD from the University of Queensland, Australia, performed while working for SmithKline Beecham Pharmaceuticals using MR methodologies to study small animal models of stroke. During this PhD I further developed my interest in the brain and how brain cells communicate, and respond, to external stimuli, injury and illness.  My PhD was followed with post-docs at Georgetown University and then the University of New Mexico, using MRI and MRS to study traumatic brain injury and Schizophrenia among other central nervous system disorders. \n\nCurrently Director of the Bangor NeuroImaging Unit, and Reader in Neuroimaging in the department of Psychology, I collaborate with researchers from the College of Human Sciences on neuroimaging study design, data acquisition and processing and resources available to help with their research questions.  I am also the course organiser for the Masters in Neuroimaging.\n\t\nActively involved in research using magnetic resonance imaging and spectroscopy to measure physiology and neurochemistry in central nervous system function and disorders, my research falls into three broad areas: development and validation of MRS techniques for the detection of neurotransmitters; the use of these techniques to measure changes associated with neurotransmission and neural activity in health and disease; and the use of magnetic resonance imaging to investigate basic neurologic and physiologic processes in health and disease. Ongoing research is focused on two of these areas: the study of functional neurochemical changes using functional magnetic resonance spectroscopy (fMRS); and measurement of changes in cerebral physiology and blood flow in response to environmental and physiologic stressors.",
                    "position": "Reader, Director of the Bangor Imaging Unit",
                    "purpose": "To see if it is possible to use these tools in my Neuroimaging classes, and to analyse some of our latest imaging data.",
                    "register": "2020-04-07T11:21:10.798Z"
                },
                {
                    "institution": "Self-Employed",
                    "bio": "Data analyst for medical imaging.",
                    "position": "Engineer",
                    "purpose": "Perform quick quality check on diffusion data.",
                    "register": "2020-04-07T14:17:43.645Z"
                },
                {
                    "institution": "IU Bloomington",
                    "bio": "Comp/Net/Cog Neuro",
                    "position": "Asst Prof",
                    "purpose": "Curious",
                    "register": "2020-04-07T14:45:51.916Z"
                },
                {
                    "institution": "Univeristy of Iowa",
                    "bio": null,
                    "position": "Assistant Professor",
                    "purpose": null,
                    "register": "2020-04-07T20:10:20.469Z"
                },
                {
                    "institution": "University of Szeged",
                    "bio": "MA 2007 University of Szeged\nPhD 2013 University of Connecticut",
                    "position": "assistant professor of psychology",
                    "purpose": "teaching analytic methods and tools",
                    "register": "2020-04-10T10:06:48.143Z"
                },
                {
                    "institution": "University of Szeged",
                    "bio": "interest, study: Psychology MA, Cognitive- and neuropsychology",
                    "position": "student",
                    "purpose": "Help for data analization",
                    "register": "2020-04-10T10:31:45.152Z"
                },
                {
                    "institution": "Szegedi Tudományegyetem",
                    "bio": "-",
                    "position": "-",
                    "purpose": "-",
                    "register": "2020-04-10T11:38:08.039Z"
                },
                {
                    "institution": "University of California, Santa Cruz",
                    "bio": "Mainly focus on medical applications of machine learning.",
                    "position": "Researcher",
                    "purpose": "Use datasets for projects.",
                    "register": "2020-04-10T19:26:48.941Z"
                },
                {
                    "institution": "University of Delaware",
                    "bio": "Ph.D. in Arts & Science inside Neuroscience & Development division at the University of Dundee, Dundee, United Kingdom (2009-2014) http://ethos.bl.uk/OrderDetails.do?uin=uk.bl.ethos.683947 \nLaboratory: Cognitive Electrophysiology (University of Dundee)\nLaboratory: Linear modelling on signal processing (University of Edinburgh)\nTitle: EEG and fMRI studies of the effects of stimulus properties on the control of attention\nSupervisors: Benjamin Vincent, Douglas Potter and Benjamin Tatler (University of Dundee)\nCo-supervisors: Guillaume Rousselet (University of Glasgow), Cyril Pernet (University of Edinburgh)\n\nM.Sc. in Electrical Engineering inside Telecommunication and Control Department at Electronic Systems at University of São Paulo (USP) – Brazil  (2004-2006)\nhttp://www.teses.usp.br/teses/disponiveis/3/3142/tde-16112006-174121/pt-br.php \nLaboratory: Computational Neuroscience\nTitle: Mathematical modeling and simulation of motor unit action potentials. (Advisor: André Fabio Kohn)\n\nProfessional degree in Electronic Engineering at Pontifical Catholic University of Peru (1999 - 2001). \t\nLaboratory: Group of Research and Development of Medical Equipment and Systems (GIDEMS)\nTitle: Analysis, design and testing of flow gases transducer (Advisor: Willy E. Carrera Soria)",
                    "position": "Visiting Scholar",
                    "purpose": "Study and learn more about cognitive neurodynamics.",
                    "register": "2020-04-10T23:28:01.266Z"
                },
                {
                    "institution": "IIT Guwahati",
                    "bio": "---",
                    "position": "Student",
                    "purpose": "Education",
                    "register": "2020-04-13T09:52:57.343Z"
                },
                {
                    "institution": "University of Szeged",
                    "bio": "https://www.linkedin.com/in/viktoriabarcsi/",
                    "position": "Student",
                    "purpose": "Studying data analysis",
                    "register": "2020-04-13T17:00:38.444Z"
                },
                {
                    "institution": "Keyframed",
                    "bio": "Video artist",
                    "position": "Producer",
                    "purpose": "visual experiment",
                    "register": "2020-04-13T19:55:30.931Z"
                },
                {
                    "institution": "University of Cyprus",
                    "bio": "Undergraduate Psychology Student",
                    "position": "Student",
                    "purpose": "brain data analysis",
                    "register": "2020-04-14T08:58:53.276Z"
                },
                {
                    "institution": "University of Michigan",
                    "bio": "fMRI analyst in the Department of Psychiatry at UMich. Interested in machine learning, deep learning, and open science.",
                    "position": "Research Computer Specialist",
                    "purpose": "To learn more about cloud computing.",
                    "register": "2020-04-15T19:39:31.272Z"
                },
                {
                    "institution": "University of California, Los Angeles",
                    "bio": "Doctoral student studying developmental neuroscience and affective science",
                    "position": "Doctoral Student",
                    "purpose": "Signing up to see what it's about right now and to check if I can maybe use some of the apps",
                    "register": "2020-04-15T20:08:22.441Z"
                },
                {
                    "institution": "Bryn Mawr College",
                    "bio": "Interested in early development, autism research and environmental factors that affect the brain development",
                    "position": "Thesis Student",
                    "purpose": "Learn more about coding and analyzing neuroimaging data",
                    "register": "2020-04-15T20:28:48.295Z"
                },
                {
                    "institution": "Florida International University",
                    "bio": "I am a PhD student working with Dr. Angela Laird at FIU.",
                    "position": "Graduate student",
                    "purpose": "I am very interested in reproducible science, and would like to use Brainlife.io to improve my own research by sharing runnable workflows associated with my publications.",
                    "register": "2020-04-15T21:03:45.593Z"
                },
                {
                    "institution": "Florida International University",
                    "bio": "A Cognitive Neuroscience Ph.D student working under Aaron Mattfeld in the Mattfeld Lab at FIU. I'm interested changes in memory system dynamics over time and across development.",
                    "position": "Graduate Research Assistant",
                    "purpose": "D",
                    "register": "2020-04-15T21:20:52.447Z"
                },
                {
                    "institution": "University of Illinois at Urbana-Champaign",
                    "bio": "I am a Ph.D. student at the University of Illinois at Urbana-Champaign. My research interests are broadly in cognitive neuroscience, psychopathology, and neuroimaging. I am especially interested in the application of machine learning to better understand the etiology of mood and anxiety disorders.",
                    "position": "Graduate Student",
                    "purpose": "Utilize open source tools for neuroimaging and to learn more about open science.",
                    "register": "2020-04-16T01:02:05.939Z"
                },
                {
                    "institution": "IITGN / Brain And Informatics Lab",
                    "bio": "PhD scholar. Researching BCI with Deep RL.",
                    "position": "PhD Scholar",
                    "purpose": "Understand brain",
                    "register": "2020-04-16T01:18:57.137Z"
                },
                {
                    "institution": "University of Tübingen",
                    "bio": "Post-doc at Vision and Cognition Lab.",
                    "position": "Post-doc",
                    "purpose": "test hypotheses on available datasets",
                    "register": "2020-04-16T10:18:29.671Z"
                },
                {
                    "institution": "Montreal Neurological Institute",
                    "bio": "Started with a Master, now I'm here",
                    "position": "PhD student",
                    "purpose": "Look at brains",
                    "register": "2020-04-16T14:01:01.54Z"
                },
                {
                    "institution": "LMU",
                    "bio": "PostDoc in psychiatry and radiology; PhD in psychiatry; master thesis on EEG. Institution: Ludwig Maximilians University (LMU)",
                    "position": "PostDoc",
                    "purpose": "I find the project very exciting and wanted to have a closer look at it with my own data.",
                    "register": "2020-04-16T21:16:33.132Z"
                },
                {
                    "institution": "University of Szeged, Hungary - Szegedi Tudományegyetem Bölcsészettudományi Kar Pszichológiai Intézet",
                    "bio": "I am a psychology student in Hungary. I would like to be a neuropsychologist.",
                    "position": "university student",
                    "purpose": "I would learn using databases and analyse items.",
                    "register": "2020-04-17T11:44:35.194Z"
                },
                {
                    "institution": "University College London",
                    "bio": "Professional background\n\nI am Consultant Neuroradiologist and MRI Lead in the Department of Neuroradiology at the National Hospital for Neurology in London, Associate Professor of Neuroradiology at the Institute of Neurology University College London, and Professor of Radiology at Eberhard Karls University in Tübingen, Germany. I have finished his MD thesis in Psychiatry after joint studies at University of Athens, Greece and University of Mainz, Germany. I am trained in Radiology and Neuroradiology at Hannover Medical School, University of Frankfurt, and University of Tübingen, Germany.\nI have completed a post-doctoral scholarship in Neuroradiology Research at the Medical University of South Carolina, USA. I hold an MSc. degree in “Advanced Oncology” from University of Ulm, Germany and am also Fellow of the European Society of Head and Neck Radiology. My expertise fields include advanced CT, intraoperative MRI, advanced and functional MRI and molecular MR-PET imaging in brain diseases.\n\nI have authored more than 130 peer-reviewed publications (h-index > 30) and 7 book chapters. Currently, I am Clinical Lead of the flagship program in neurooncology, a joint initiative of the Institute of Healthcare Engineering and the National Hospital of Neurology and Neurosurgery. I serve as member of the editorial board of several leading journals in Radiology and Neuroradiology, I am reviewer for leading journals in Neuroimaging, member of the Executive Committee of the European Society of Head and Neck Radiology, and member of the Head and Neck committee of the European Society of Neuroradiology.\n\nResearch interests\nNeurooncology, Dementia, Neurodegeneration, Metabolic diseases, Translational and advanced neuroimaging, MRI-PET",
                    "position": "Associate Professor",
                    "purpose": "To improve the post-processing pipelines in my Department for research in dementia, TBI, and tumours. Also, to contribute to the Brainlife community with our original research results.",
                    "register": "2020-04-17T15:00:28.228Z"
                },
                {
                    "institution": "osr",
                    "bio": "resident NS",
                    "position": "resident",
                    "purpose": "research",
                    "register": "2020-04-17T23:01:44.627Z"
                },
                {
                    "institution": "Jadavpur University",
                    "bio": "I work in the domain of NeuroInformatics",
                    "position": "Undergraduate Student",
                    "purpose": "Analyze NeuroImaging data",
                    "register": "2020-04-18T00:21:37.398Z"
                },
                {
                    "institution": "Southwest University",
                    "bio": "A network neuroscience fan.",
                    "position": "Ph.D Candidate",
                    "purpose": "Tools aplications.",
                    "register": "2020-04-18T08:10:51.926Z"
                },
                {
                    "institution": "test",
                    "bio": "test",
                    "position": "test",
                    "purpose": "test",
                    "register": "2020-04-18T18:59:16.318Z"
                },
                {
                    "institution": "Jadavpur University",
                    "bio": "Sleepless boy.",
                    "position": "Student",
                    "purpose": "Research",
                    "register": "2020-04-18T19:55:46.084Z"
                },
                {
                    "institution": "University of Pennsylvania",
                    "bio": "An alumni.",
                    "position": "Research assistant at WWBP.",
                    "purpose": "Just exploring.",
                    "register": "2020-04-19T02:44:36.517Z"
                },
                {
                    "institution": "The University of Trento",
                    "bio": "Open Data Technician at CIMeC - Center for Mind / Brain Sciences",
                    "position": "Open Data Technician",
                    "purpose": "learning",
                    "register": "2020-04-19T14:28:34.019Z"
                },
                {
                    "institution": "TReNDS",
                    "bio": "PHD Student",
                    "position": "PHD Student",
                    "purpose": "Research",
                    "register": "2020-04-19T19:45:21.669Z"
                },
                {
                    "institution": "self",
                    "bio": "taught",
                    "position": "ceo",
                    "purpose": "study",
                    "register": "2020-04-20T00:39:10.107Z"
                },
                {
                    "institution": "Jadavpur University",
                    "bio": "3rd year student in computer science working on pattern detection of brain activity on different tasks",
                    "position": "Student",
                    "purpose": "A better way to process our data that we are unable to do on our local system",
                    "register": "2020-04-20T12:46:30.441Z"
                },
                {
                    "institution": "University of Chile",
                    "bio": "Im a first year student in Neuroscience Studies",
                    "position": "student",
                    "purpose": "Study, test",
                    "register": "2020-04-21T04:59:16.615Z"
                },
                {
                    "institution": "The Pennsylvania State University",
                    "bio": "An R&D Engineer, with a passion for Neuropsychology",
                    "position": "Collaborator",
                    "purpose": "I would like to learn, and re-enter the neuropsyhology field.",
                    "register": "2020-04-21T18:13:13.983Z"
                },
                {
                    "institution": "Indiana University - Bloomington",
                    "bio": "A cognitive science major",
                    "position": "Cognitive science major",
                    "purpose": "Learn key concepts of brain image data analysis",
                    "register": "2020-04-22T06:56:31.411Z"
                },
                {
                    "institution": "SocieteGenerale",
                    "bio": "Working as a Data Scientist in Societe Generale. In my free time, I research about how the brain works and how can it be implemented through code, to create the perfect AI.",
                    "position": "Data Scientist",
                    "purpose": "Just an enthusiastic graduate exploring how the brain works, so that AI could be made better.",
                    "register": "2020-04-22T17:27:14.224Z"
                },
                {
                    "institution": "Peking University",
                    "bio": "I'm a Phd candidate in Peking University, who focus on diffusion imaging and resting-state fMRI.",
                    "position": "PhD",
                    "purpose": "Using brain life to process some neuro imaging data.",
                    "register": "2020-04-23T03:45:20.332Z"
                },
                {
                    "institution": "Child Mind Institute",
                    "bio": "I'm an associate software developer in the Computational Neuroimaging Lab at the Child Mind Institute. I mostly work on C-PAC, the Configurable Pipeline for the Analysis of Connectomes.",
                    "position": "Associate Software Developer",
                    "purpose": "Involved in adding C-PAC to Brainlife.",
                    "register": "2020-04-23T18:37:27.793Z"
                },
                {
                    "institution": "Rutgers University",
                    "bio": "Curious about all things neuro.",
                    "position": "Laboratory Manager",
                    "purpose": "Diffusion techniques.",
                    "register": "2020-04-24T05:50:05.265Z"
                },
                {
                    "institution": "American University of Beirut Medical Center",
                    "bio": "Salem Hannoun received his PhD in Biomedical Engineering in 2011 from the Claude Bernard Lyon 1 University (UCBL1) in Lyon, France. He is currently a Research Associate at the Nehme and Therese Tohme Multiple Sclerosis Center, and Abu-Haidar Neuroscience Institute in the American University of Beirut Medical Center (AUBMC). He specializes in magnetic resonance imaging (MRI) data acquisition, management and processing in Multiple Sclerosis (MS) and several other neurological disorders (such as Ataxia and Apraxia, Epilepsy, Autism…). He is part of the imaging working group of the French Observatory of Multiple Sclerosis (OFSEP) in which he has helped put in place a common standardized MRI protocol for MS patients in France.",
                    "position": "Research associate",
                    "purpose": "By using brainlife.io, i expect to perform MRI data analysis that are not available at my institution.",
                    "register": "2020-04-24T08:59:41.661Z"
                },
                {
                    "institution": "Northwestern University",
                    "bio": "Research associate in the lab of Prof. Vania Apkarian.",
                    "position": "Research Associate",
                    "purpose": "Brain Imaging research.",
                    "register": "2020-04-28T18:00:02.87Z"
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "Student researcher",
                    "position": "Student researcher",
                    "purpose": "Finish online fMRI analysis class",
                    "register": "2020-04-29T16:21:12.633Z"
                },
                {
                    "institution": "Omniscient",
                    "bio": "Data scientist, electrical engineer. Interested in MRI tractography, functional connectomes and graph analysis",
                    "position": "Data Scientist",
                    "purpose": "MRI tractography on open data sets",
                    "register": "2020-04-30T13:18:18.92Z"
                },
                {
                    "institution": "Texas Tech University",
                    "bio": "Hi",
                    "position": "Postdoctoral Research Associate",
                    "purpose": "A lot",
                    "register": "2020-05-01T00:05:03.022Z"
                },
                {
                    "institution": "Gachon University",
                    "bio": "Tractography",
                    "position": "Researcher",
                    "purpose": "tractography",
                    "register": "2020-05-01T04:55:57.828Z"
                },
                {
                    "institution": "Cognitive and Computational Neuroscience Lab",
                    "bio": "From criminology to psychology to neuroscience, to understand human, mind and behaviour. From Cádiz to Madrid to Edimburgh, to explore the world and its beauty.",
                    "position": "PhD Student",
                    "purpose": "I am working on whole brain simulation with mass models and TVB. I want to learn how to process neuroimaging data to be able to compare my simulations' results with empirical data.",
                    "register": "2020-05-01T09:02:54.753Z"
                },
                {
                    "institution": "Weill Cornell Medicine",
                    "bio": "Neuroscience Ph.D candidate with a biomedical engineering background, focus mainly on network theoretical models of the brain and multi-modal fusion of brain imaging data.",
                    "position": "Ph.D candidate",
                    "purpose": "Improve reproducibility and data sharing from my own works!",
                    "register": "2020-05-01T18:37:29.445Z"
                },
                {
                    "institution": "Dartmouth College",
                    "bio": "I am a master chef who lost his way into a doctorate in experimental psychology and cognitive neuroscience. Original PyMVPA groupie. Currently living near the ocean.",
                    "position": "Systems Admin+ at Dartmouth Brain Imaging Center,",
                    "purpose": "Improve efficiency and capabilities for neuroimaging science at Dartmouth Brain imaging center.",
                    "register": "2020-05-01T19:17:22.143Z"
                },
                {
                    "institution": "University of Washington",
                    "bio": "I am a postdoc working with Dr. Ione Fine at the University of Washington. I study the plasticity in the visual system that takes place after visual deprivation early in life using psychophysical, computational, and neuroimaging methods.",
                    "position": "Postdoc",
                    "purpose": "I would like to try visualizing white matter tracts",
                    "register": "2020-05-01T20:36:08.664Z"
                },
                {
                    "institution": "Università degli Studi di Salerno",
                    "bio": "I am a student attending the last accademic year in Digital Health and Bioinformatic Engineering master degree at University of Salerno (Italy).\nCurrently developing a strong interest in neurosciences!",
                    "position": "Student",
                    "purpose": "I think brainlife.io will provide me with powerful tools to easily build neuroimaging data pipelines. Furthermore, I am expecting it to be robust enough to accomplish my neuroimaging analysis.",
                    "register": "2020-05-02T11:58:07.997Z"
                },
                {
                    "institution": "ETH Zürich",
                    "bio": "Student Translational Neuromodeling 2020",
                    "position": "Student",
                    "purpose": "Try to download the \"UCLA Consortium for Neuropsychiatric Phenomics LA5c Study\" dataset, since it doesn't seem to work on openneuro.org",
                    "register": "2020-05-02T13:54:12.487Z"
                },
                {
                    "institution": "Vanderbilt University",
                    "bio": "PhD Candidate in neuroscience",
                    "position": "Graduate student",
                    "purpose": "To learn and utilize the apps on the platform.",
                    "register": "2020-05-02T23:37:46.526Z"
                },
                {
                    "institution": "TCS Research & Innovation, Tata Consultancy Services",
                    "bio": "Presently working as a researcher in TCS Research and Innovation. Completed PhD in Jadavpur University on analysis of cognitive factors in assessment of textual content using physiological sensing.",
                    "position": "Researcher",
                    "purpose": "Would like to run the preprocessing fmriprep on some of the public fmri datasets",
                    "register": "2020-05-03T14:52:36.818Z"
                },
                {
                    "institution": "Ghent University",
                    "bio": "Doctorate in Experimental Psychology",
                    "position": "Postdoctoral assistent",
                    "purpose": null,
                    "register": "2020-05-05T11:55:34.142Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Transformative, data-driven professional leveraging proven experience and education in data science to drive cross functional data science projects from inception to completion.\n Finely tuned analytical skills with a dedication to continually streamlining and improving work processes, effectively interfacing with management to collaborate on issues and resolve problems.\n Adept at developing and maintaining detailed administrative and procedural processes that reduce redundancy, improve accuracy and efficiency, and achieve organizational objectives.\n Proven ability to build relationships with cross-functional teams, identify and address areas of contention, collect and analyze data, research, prototype, build out data science pipelines and models in production, and present methodology and key insights to stakeholders.\n Propel collaborative efforts with business leaders, subject matter experts, key stakeholders, and decision makers to parameterize, develop, and implement success criteria, while also optimizing new products, features, policies, and models.",
                    "position": "Data Science Graduate",
                    "purpose": "Design and development of machine learning and deep learning systems",
                    "register": "2020-05-05T18:43:14.077Z"
                },
                {
                    "institution": "University of Alabama",
                    "bio": "Faculty working on neural bases of sign language.",
                    "position": "Associate Professor",
                    "purpose": "Teach students to work with neuroimaging data",
                    "register": "2020-05-07T11:08:44.297Z"
                },
                {
                    "institution": "Weill Cornell Medicine",
                    "bio": "I am a researcher in the field of biomedical engineering, applying analytical skills to clinical problems in the imaging, diagnosis and treatment of major brain diseases. The predominant drive of my career has been in applying automated techniques and performing analysis to current issues in neuroimaging. As I continue my research career, I plan to extend my work by expanding my research pursuits and collaborations while concurrently maintaining my interest in the development and application of brain imaging.",
                    "position": "Research Data Specialist",
                    "purpose": "Through this platform I hope to utilize publicly available and cloud computing resources to process numerous datasets.",
                    "register": "2020-05-07T17:02:27.4Z"
                },
                {
                    "institution": "Lisgar Collegiate Institute",
                    "bio": "Student studying neural responses to music.",
                    "position": "Head Researcher",
                    "purpose": "Use fMRI data of participants processing pleasurable auditory information to infer the reliability of the reward prediction error hypothesis as a framework for analyzing neural responses to music.",
                    "register": "2020-05-08T14:24:36.809Z"
                },
                {
                    "institution": "University Hospital RWTH Aachen",
                    "bio": null,
                    "position": "Senior Researcher / Group Leader",
                    "purpose": "potentially sharing data and analyses with collaborators and publicly",
                    "register": "2020-05-08T19:15:20.686Z"
                },
                {
                    "institution": "Johns Hopkins university",
                    "bio": "PhD student in neuroscience.",
                    "position": "PhD student",
                    "purpose": "Use open source scripts.",
                    "register": "2020-05-08T22:54:13.056Z"
                },
                {
                    "institution": "Princeton University",
                    "bio": "Junior Undergrad Concentrating in Neuroscience.",
                    "position": "Undergraduate Student",
                    "purpose": "Analyze fMRI data for research purposes.",
                    "register": "2020-05-11T16:25:05.42Z"
                },
                {
                    "institution": "UC San Diego",
                    "bio": "Grad student in Brady & Serences labs",
                    "position": "graduate student",
                    "purpose": "Look at BOLD5000 data set",
                    "register": "2020-05-12T00:43:09.051Z"
                },
                {
                    "institution": "Dartmouth College",
                    "bio": "Dr. Luke Chang, PhD is an Assistant Professor of Psychological and Brain Sciences at Dartmouth College and directs the Computational Social Affective Neuroscience Laboratory. He completed a BA in psychology at Reed College, an MA in psychology at the New School for Social Research, and a PhD in clinical psychology and cognitive neuroscience at the University of Arizona. In addition, Luke completed his predoctoral clinical internship training in behavioral medicine at the University of California Los Angeles and a postdoctoral fellowship at the University of Colorado Boulder in multivariate neuroimaging techniques. His research program is focused on understanding the neurobiological and computational mechanisms underlying emotions and social interactions and his research spans the emerging fields of social, affective, and decision neurosciences.",
                    "position": "Assistant Professor",
                    "purpose": "analyze data, learn more about cloud computing applications.",
                    "register": "2020-05-13T12:13:04.526Z"
                },
                {
                    "institution": "Baycrest",
                    "bio": "Analyzing LEMON dataset",
                    "position": "Research Assistant",
                    "purpose": "Analyzing LEMON dataset",
                    "register": "2020-05-13T18:14:57.607Z"
                },
                {
                    "institution": "UCSF",
                    "bio": "Neuroscientist and Neuroradiologist.  Phd with Bill Newsome on effects of reward/value on neuronal responses in wake behaving primates. Now trying to using imaging methods to study the same circuits in humans with the hope of learning something about how those circuits are disrupted in neuropsychiatric disease.",
                    "position": "Assistant Professor, Dept of Radiology and Biomedical Imaging",
                    "purpose": "Explore its use as a tool to explore imaging results in large data sets and for possible collaboration between labs/institutions.",
                    "register": "2020-05-14T01:00:25.432Z"
                },
                {
                    "institution": "university of calgary",
                    "bio": "PhD student studying neurophysics",
                    "position": "PhD",
                    "purpose": "share data and connect with other research groups.",
                    "register": "2020-05-14T22:15:16.583Z"
                },
                {
                    "institution": "IU",
                    "bio": "Machine Learning",
                    "position": "Graduate student",
                    "purpose": "Contribute",
                    "register": "2020-05-15T01:04:36.732Z"
                },
                {
                    "institution": "Centro Nacional Investigaciones Cardiovasculares",
                    "bio": "I'm a final year PhD student who has spent most of his time working on comparative anatomy and creating customized preprocessing tools for animal brains. My undergraduate studies were in biochemistry but I've since made the switch to neuroimaging and have never looked back.",
                    "position": "PhD Student",
                    "purpose": "Develop new analysis methods to link the brain and body via publicly available physiological and fMRI data sets.",
                    "register": "2020-05-15T07:32:11.297Z"
                },
                {
                    "institution": "Stanford University",
                    "bio": "-",
                    "position": "-",
                    "purpose": "-",
                    "register": "2020-05-15T20:56:45.277Z"
                },
                {
                    "institution": "SZTE",
                    "bio": "SZTE",
                    "position": "Student",
                    "purpose": "Data search",
                    "register": "2020-05-18T17:19:42.247Z"
                },
                {
                    "institution": "Qualia Research Institute",
                    "bio": "Exploring the statespace of consciousness",
                    "position": "Lead Engineer",
                    "purpose": "I'd like to be able to download datasets in .gii format for use in an analysis technique for understanding emotional valence.",
                    "register": "2020-05-18T18:49:41.468Z"
                },
                {
                    "institution": "Bilkent",
                    "bio": "No.",
                    "position": "Student",
                    "purpose": "LEAVE ME ALONE DAMMIT",
                    "register": "2020-05-20T10:52:19.189Z"
                },
                {
                    "institution": "University of Zurich",
                    "bio": "I'm a student in neuroscience",
                    "position": "student",
                    "purpose": "semester projet",
                    "register": "2020-05-21T11:54:32.522Z"
                },
                {
                    "institution": "Miami University",
                    "bio": "I am a PhD candidate, human neuroscience researcher, and I'm coming onto the job market. Here we go class of 2020.",
                    "position": "EEG Researcher, Graduate Student.",
                    "purpose": "To get access to data!",
                    "register": "2020-05-21T23:52:20.168Z"
                },
                {
                    "institution": "university of Verona",
                    "bio": "I am a student",
                    "position": "student",
                    "purpose": "to study",
                    "register": "2020-05-22T10:42:16.875Z"
                },
                {
                    "institution": "Istanbul Florence Nightingale Hospital Neurological Sciences Center",
                    "bio": "Professor of Neurology from Istanbul, Turkey",
                    "position": "Professor of Neurology",
                    "purpose": "Analyzing data on Alzheimer's disease and neurobiology of decision making",
                    "register": "2020-05-22T20:38:55.545Z"
                },
                {
                    "institution": "UESTC",
                    "bio": "An postgraduate in UESTC",
                    "position": "postgraduate",
                    "purpose": "Study brain network",
                    "register": "2020-05-23T08:40:41.915Z"
                },
                {
                    "institution": "UCSF",
                    "bio": "Radiology resident researching structural and functional abnormalities in psychiatric disorders using big data from the ABCD study.",
                    "position": "Resident physician",
                    "purpose": "Collaborate and expand on our research",
                    "register": "2020-05-23T17:44:54.654Z"
                },
                {
                    "institution": "IMT Atlantique",
                    "bio": "Final year engineering  student",
                    "position": "Student",
                    "purpose": "Brain data analysis",
                    "register": "2020-05-23T23:47:41.246Z"
                },
                {
                    "institution": "University of Groningen",
                    "bio": "I am a neuroscientist passionate about novel and innovative methods and their applications to further understand the human brain.",
                    "position": "PhD student",
                    "purpose": "implementation of new apps, upload new dataset",
                    "register": "2020-05-24T19:08:53.408Z"
                },
                {
                    "institution": "University of Virginia",
                    "bio": "Hi, I am a double major in Neuroscience and Statistics that is really interested in the intersection between Medicine and Data Analytics.",
                    "position": "Student, Research Assistant",
                    "purpose": "I would like to look at larger data sets from different fields of neuroscience and medicine so I can have a better understanding of different types of data and also gain insight into what big data in health/medicine may look like.",
                    "register": "2020-05-25T09:37:37.295Z"
                },
                {
                    "institution": "Cognitive Neuroscience Center, UMCG",
                    "bio": "Master’s degree in chemistry\nPhD degree in physics topic: auditory fMRI\nInvolved in fMRI data analysis  since 1998, loving it ever since",
                    "position": "MR physicist",
                    "purpose": "(f)MRI data analysis in general. pRF and related techniques specifically.",
                    "register": "2020-05-26T06:38:02.488Z"
                },
                {
                    "institution": "Cognitive Neuroscience Center, UMCG",
                    "bio": "Master’s degree in chemistry topic: NMR of protein \nPhD degree in physics topic: auditory fMRI\nInvolved in fMRI data analysis since 1998, loving it ever since",
                    "position": "MR physicist",
                    "purpose": "(f)MRI data analysis in general. pRF and related techniques specifically.",
                    "register": "2020-05-26T06:50:42.726Z"
                },
                {
                    "institution": "Universidade Federal do Rio Grande do Sul",
                    "bio": "I have a BS degree in Biomedical Sciences and I am currently studying Engineering Physics.",
                    "position": "Student",
                    "purpose": "Use machine learning techniques for neuroimaging analysis.",
                    "register": "2020-05-26T22:21:53.065Z"
                },
                {
                    "institution": "Pariveda Solutions",
                    "bio": "Software developer interested in neural imaging.",
                    "position": "Consultant",
                    "purpose": "Interested in exploring the datasets more fully to grow in understanding.",
                    "register": "2020-05-27T13:52:09.306Z"
                },
                {
                    "institution": "Pariveda",
                    "bio": "Amateur data scientist",
                    "position": "Lead data scientist",
                    "purpose": "Learn about fmri!",
                    "register": "2020-05-27T20:11:09.041Z"
                },
                {
                    "institution": "UCLA",
                    "bio": "Hi!",
                    "position": "Student",
                    "purpose": "-",
                    "register": "2020-05-27T22:54:54.165Z"
                },
                {
                    "institution": "University of Sussex",
                    "bio": "Neuroscientist",
                    "position": "Postdoc research fellow",
                    "purpose": "explore this service",
                    "register": "2020-05-28T11:35:23.597Z"
                },
                {
                    "institution": "Champalimaud Foundation",
                    "bio": "Joana graduated in Biomedical Engineering and Biophysics followed by a PhD in Computational Visual Neuroscience at the university of Groningen. She joined the Shemesh lab as a post doctoral researcher in January 2020.",
                    "position": "Post Doctoral Fellow",
                    "purpose": "Study Brain Plasticity",
                    "register": "2020-05-28T13:09:56.172Z"
                },
                {
                    "institution": "Barcelonaβeta Brain Research Center",
                    "bio": "Computing scientist interested in neuroimaging",
                    "position": "Neuroimaging ICT specialist",
                    "purpose": "For now I am mainly interested in exploring Brainlife capabilities",
                    "register": "2020-05-28T19:34:07.407Z"
                },
                {
                    "institution": "PLC",
                    "bio": "Year 12 science extension course 2020",
                    "position": "Student",
                    "purpose": "collect data for research",
                    "register": "2020-05-29T11:00:40.146Z"
                },
                {
                    "institution": "Cleveland",
                    "bio": "NA",
                    "position": "PhD",
                    "purpose": "Continue projects",
                    "register": "2020-05-29T15:28:07.438Z"
                },
                {
                    "institution": "University of Arizona",
                    "bio": "I am an MRI physicist with interest in developing MRI acquisition and reconstruction technologies, and application of MRI to studies of neurological diseases",
                    "position": "Associate Professor",
                    "purpose": "I am very interested in learning and promoting online data sharing and processing in a highly reproducible and transparent manner.",
                    "register": "2020-05-30T00:31:17.881Z"
                },
                {
                    "institution": "IUST",
                    "bio": "m.sc student.",
                    "position": "student",
                    "purpose": "work on proposal",
                    "register": "2020-05-31T09:06:13.047Z"
                },
                {
                    "institution": "Brigham and Women's Hospital",
                    "bio": "A computer scientist by training, Sylvain has been working with the Psychiatry NeuroImaging Laboratory at Brigham and Women's Hospital since 2003. He received his B.Eng. from Institut Polytechnique de Sevenans, France his M.Sc. from the University of Kansas and his Ph.D. from McGill University. His research interests include shape analysis of anatomical structures and evaluation of medical imaging techniques. His main duty is to act as a mediator between computer scientists and neuroscientists to help improve computer tools for neuroimaging studies.",
                    "position": "Associate Professor",
                    "purpose": "Data exploration and processing possible collaboration.",
                    "register": "2020-05-31T15:45:11.126Z"
                },
                {
                    "institution": "UPCH",
                    "bio": "STUDENT",
                    "position": "STUDENT",
                    "purpose": "TESIS",
                    "register": "2020-05-31T19:41:49.291Z"
                },
                {
                    "institution": "The University of Melbourne",
                    "bio": "Investigating WM changes in auditory system",
                    "position": "Early career researcher",
                    "purpose": "Interested in different imaging analysis tools",
                    "register": "2020-06-01T03:17:33.177Z"
                },
                {
                    "institution": "Xi'an  Jiaotong University",
                    "bio": "A graduate student in brain science",
                    "position": "student",
                    "purpose": "Learn to analyze and process fMRI data",
                    "register": "2020-06-03T16:56:39.92Z"
                },
                {
                    "institution": "Zhejiang University",
                    "bio": "A neuroimaging researcher.",
                    "position": "Fellow",
                    "purpose": "Brain segmentation",
                    "register": "2020-06-04T13:17:05.103Z"
                },
                {
                    "institution": "University of Calcutta",
                    "bio": "I am a Ph.D. research scholar in Neuroinformatics from CPEPA(UGC) Centre, University of Calcutta.",
                    "position": "DBT-BINC recipient Senior Research Fellow",
                    "purpose": "I wish to analyze the open source fMRI data for my thesis research.",
                    "register": "2020-06-04T15:03:01.266Z"
                },
                {
                    "institution": "Southwest University",
                    "bio": "Phd student",
                    "position": "Phd student",
                    "purpose": "fMRI and DWI data analysis",
                    "register": "2020-06-05T09:09:19.903Z"
                },
                {
                    "institution": "Southwest University",
                    "bio": "Phd student",
                    "position": "Phd student",
                    "purpose": "fMRI and DWI data analysis",
                    "register": "2020-06-05T09:23:01.295Z"
                },
                {
                    "institution": "San Francisco",
                    "bio": "fMRI researcher focused on object decoding",
                    "position": "researcher",
                    "purpose": "learn about what it is",
                    "register": "2020-06-06T03:37:51.15Z"
                },
                {
                    "institution": "Harvard / MIT",
                    "bio": "I am a PhD student in the Harvard / MIT Program in Speech and Hearing Bioscience and Technology (SHBT). I am broadly interested in the intersection of music and neuroscience, focusing on benefits conferred by music-induced neural plasticity.",
                    "position": "Graduate Student",
                    "purpose": "I would like to test and implement cloud-based MRI processing pipelines for my lab.",
                    "register": "2020-06-07T19:09:44.046Z"
                },
                {
                    "institution": "MIT",
                    "bio": "PhD in Physics, Computational Support Specialist at MIT",
                    "position": "Computational Support Specialist",
                    "purpose": "Use it on our cluster for neuron research.",
                    "register": "2020-06-08T15:40:25.204Z"
                },
                {
                    "institution": "Institute of Management Sciences",
                    "bio": "upcoming software engineer with some research skills.",
                    "position": "Student",
                    "purpose": "Get dataset for my final year project to ensure it's quality.",
                    "register": "2020-06-09T12:21:07.77Z"
                },
                {
                    "institution": "D'Or Institute for Research and Education (IDOR)",
                    "bio": "I am a neuroscientist.",
                    "position": "Postdoc",
                    "purpose": "My expectations are that I would have access to several tools that will make my data analysis easier.",
                    "register": "2020-06-10T00:20:38.972Z"
                },
                {
                    "institution": "Arizona State University",
                    "bio": "Student curious in studying neuroscience and psychology.",
                    "position": "Research Assistant / Intern",
                    "purpose": ".",
                    "register": "2020-06-10T20:45:59.089Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I study brain networks",
                    "position": "Graduate Student",
                    "purpose": null,
                    "register": "2020-06-13T19:16:33.156Z"
                },
                {
                    "institution": "Self",
                    "bio": "No thanks",
                    "position": "Engineer",
                    "purpose": "Learning",
                    "register": "2020-06-14T17:47:47.345Z"
                },
                {
                    "institution": "FZ-Juelich",
                    "bio": "I am a post doctoral researcher in Germany. I hold a Bsc in Computing Systems (Pireaus-Greece), an Msc in Electronics (Patras- Greece) & Information Processing and a PhD in neuroimaging (Liege- Belgium). Recently I joined the applied machine learning group of the Institute of Neuroscience and Medicine -Brain and Behavior based in Juelich research center. Currently i am working on the comparison of various preprocessing algorithms",
                    "position": "Postdoctoral researcher",
                    "purpose": "Research purposes (currently testing preprocessing pipelines",
                    "register": "2020-06-15T13:52:41.176Z"
                },
                {
                    "institution": "Saint Thomas Hospital",
                    "bio": "tech consultant and project manager",
                    "position": "clinical coordinator  Brain and Spine Tumor center",
                    "purpose": "explore new machine learning applications",
                    "register": "2020-06-15T16:12:16.498Z"
                },
                {
                    "institution": "UCSF",
                    "bio": "Medical Student",
                    "position": "Medical Student",
                    "purpose": "Brain imaging research.",
                    "register": "2020-06-15T20:56:15.399Z"
                },
                {
                    "institution": "ZJU",
                    "bio": "NEUROSCIENCE MOTIVATOR",
                    "position": "STUDENT",
                    "purpose": "FOR DATA PREPARATION",
                    "register": "2020-06-17T12:36:53.104Z"
                },
                {
                    "institution": "TUZ",
                    "bio": "T",
                    "position": "owner",
                    "purpose": "the cognitive neuroscience of sleep",
                    "register": "2020-06-18T13:55:18.91Z"
                },
                {
                    "institution": "Shanghai Jiao Tong University",
                    "bio": "PhD student",
                    "position": "PhD student",
                    "purpose": "learn more knowledge",
                    "register": "2020-06-19T01:37:41.349Z"
                },
                {
                    "institution": "Queen Mary University of London",
                    "bio": "Undergraduate Computer Science student @Queen Mary University of London",
                    "position": "Student",
                    "purpose": "Explore the capabilities of the software",
                    "register": "2020-06-21T13:44:19.991Z"
                },
                {
                    "institution": "Ryerson University",
                    "bio": "Student",
                    "position": "Master's Student",
                    "purpose": "Obtain depression database",
                    "register": "2020-06-23T10:41:32.702Z"
                },
                {
                    "institution": "Universidad Nacional Autonoma de Mexico",
                    "bio": "I am a researcher interested in using quantitative MRI, particularly (but not limited to) diffusion-weighted MRI, for the study of neurological disorders, with special interest in epilepsy. Along with the great people in the lab, we try to understand what causes some specific brain lesions to be epileptogenic, how this process evolves over time, and how it affects cognitive abilities. Some of these questions can be addressed in clinical research, but when it is not possible, we turn to animal models, where we have more control, and are able to use other methods on top of MRI. So much work on the temporal lobe has piqued my interest in how the auditory cortices make sense of acoustic stimuli that vary over time, a topic we have investigated using functional MRI. I joined the National Autonomous University of Mexico in 2010, and started the Brain Connectivity Laboratory in 2012. The type of work that I most enjoy is multidisciplinary by nature, and I have the fortune of having great collaborators.\n\nSInce 2014, I lead the National Laboratory for magnetic resonance imaging, which serves several research groups from all over Mexico. This has fortunately forced me to keep up with different quantitative MRI methods.",
                    "position": "Associate Professor",
                    "purpose": "Use tools available and share my own tools for DWI analyses.",
                    "register": "2020-06-23T16:48:17.501Z"
                },
                {
                    "institution": "Vanderbilt University Institute of Imaging Science",
                    "bio": "Neuroimaging methods and analysis",
                    "position": "Research Associate Professor",
                    "purpose": "Just looking!",
                    "register": "2020-06-23T17:02:12.726Z"
                },
                {
                    "institution": "UPMC",
                    "bio": "Data coordinator",
                    "position": "Data Coordinator",
                    "purpose": "reproducible and shareable preprocessing of adolescent development neuroimaging datasets",
                    "register": "2020-06-23T18:00:04.68Z"
                },
                {
                    "institution": "Gimnasia 261",
                    "bio": "Machine Learner",
                    "position": "Nothing",
                    "purpose": "To learn a neural network on mri to understand how does it work.",
                    "register": "2020-06-23T20:59:40.773Z"
                },
                {
                    "institution": "University of California San Francisco Dept of Radiology",
                    "bio": "Systems Administrator 37 years, 22 at UCSF",
                    "position": "System Administrator",
                    "purpose": "A professor is interested in your apps.\nI am checking it out for their labs use.",
                    "register": "2020-06-24T00:40:28.994Z"
                },
                {
                    "institution": "None",
                    "bio": "A computer engineering student that is curious and ambitious to join the field of neuroscience and discover its datasets.",
                    "position": "Student",
                    "purpose": "Explore datasets and hopefully find some useful applications, study the current projects and increase my knowledge about the subject.",
                    "register": "2020-06-24T02:28:28.641Z"
                },
                {
                    "institution": "Philips",
                    "bio": "I work as Software technologist in Philips.The project I am working on is based on data science. So we need patient datasets to model our algorithms.",
                    "position": "Software technologist",
                    "purpose": "The project I am working on is based on data science. So we need patient datasets to model our algorithms.I found the datasets available in brainlife.io suits our need to test neuro models.",
                    "register": "2020-06-24T04:55:01.378Z"
                },
                {
                    "institution": "University",
                    "bio": "R&D Advisor",
                    "position": "R&D Advisor",
                    "purpose": "Research",
                    "register": "2020-06-24T18:01:51.776Z"
                },
                {
                    "institution": "EPFL",
                    "bio": "None",
                    "position": "PhD",
                    "purpose": "academic .",
                    "register": "2020-06-25T11:26:57.295Z"
                },
                {
                    "institution": "University of Southern California",
                    "bio": "I'm currently a PhD student at University of Southern California",
                    "position": "PhD student",
                    "purpose": "viewing fMRI and brain datasets",
                    "register": "2020-06-25T19:54:43.617Z"
                },
                {
                    "institution": "Tel Aviv University",
                    "bio": "PhD candidate working on fMRI and electrophysiology",
                    "position": "PhD candidate",
                    "purpose": "learn more about use cases of imaging in research",
                    "register": "2020-06-26T07:42:42.717Z"
                },
                {
                    "institution": "NINDS",
                    "bio": "Postdoctoral Fellow",
                    "position": "Postdoctoral Fellow",
                    "purpose": "Exploring functionality and perform analysis on structural and diffusion data",
                    "register": "2020-06-26T21:48:20.463Z"
                },
                {
                    "institution": "Institut des Neurosciences de la Timone",
                    "bio": "Image  Processing Engineer",
                    "position": "Image  Processing Engineer",
                    "purpose": "I would like to use fmrirep and analyse a MTDB",
                    "register": "2020-06-29T07:44:06.766Z"
                },
                {
                    "institution": "Stevens Institute of Technology",
                    "bio": "I'm a Ph.D. student working on disease progression through connectome",
                    "position": "Ph.D. student",
                    "purpose": "I am looking for diffusion MRI post-processed data to build a connectome",
                    "register": "2020-06-29T20:54:02.798Z"
                },
                {
                    "institution": "Northeastern Illinois University",
                    "bio": "Faculty in psychology department, teaching undergrads.i do research in vision and behavior using the zebrafish.",
                    "position": "Associate Professor",
                    "purpose": "I would like to use it to teach students about research in biopsychology.",
                    "register": "2020-06-30T13:58:54.492Z"
                },
                {
                    "institution": "università degli studi di Palermo",
                    "bio": "Medical physics student in Palermo",
                    "position": "Student",
                    "purpose": "Use ACPC rotation software",
                    "register": "2020-06-30T14:50:43.427Z"
                },
                {
                    "institution": "California State University, Sacramento",
                    "bio": "Research Interests: Exercise Physiology, Neurophysiology, Medicine",
                    "position": "Graduate Student",
                    "purpose": "Learning tool.",
                    "register": "2020-07-01T06:37:28.989Z"
                },
                {
                    "institution": "MHH",
                    "bio": "PhD student investigating neuroplasticity in an elderly population",
                    "position": "PhD Student",
                    "purpose": "Help with my data analysis",
                    "register": "2020-07-02T10:54:21.949Z"
                },
                {
                    "institution": "University College London",
                    "bio": "Boat dwelling neuroscientist.",
                    "position": "Associate Professor",
                    "purpose": "42.",
                    "register": "2020-07-02T11:25:12.632Z"
                },
                {
                    "institution": "Jammyt",
                    "bio": "Investigador independiente",
                    "position": "Director",
                    "purpose": "Aprender",
                    "register": "2020-07-02T11:36:57.511Z"
                },
                {
                    "institution": "ICM",
                    "bio": "Reshearch engineer at Sorbonne Université - ICM for the CATI\nhttps://cati-neuroimaging.com/",
                    "position": "Engineer",
                    "purpose": "discover, use and share pipeline analysis",
                    "register": "2020-07-03T08:08:04.689Z"
                },
                {
                    "institution": "Yonsei University School of Medicine",
                    "bio": "MD., PhD.\nImage processing and analysis \nPublications in fields of epilepsy and neurodegenerative disorders",
                    "position": "Assistant professor",
                    "purpose": "Boosting power in Image analysis",
                    "register": "2020-07-03T14:17:20.319Z"
                },
                {
                    "institution": "Shahid Beheshti University of Medical Sciences",
                    "bio": "I am a Phd Studnet in Biostatistics.",
                    "position": "PhD Student of Biostatistics",
                    "purpose": "I'm working on EEG-fMRI dataset as an example of my proposed model in  my thesis.",
                    "register": "2020-07-03T16:14:59.875Z"
                },
                {
                    "institution": "PNL, BWH, Boston, Massachusetts",
                    "bio": "I analyze MRI using computer science techniques.",
                    "position": "Researcher",
                    "purpose": "Find out if brainlife would be useful for us",
                    "register": "2020-07-03T21:11:30.631Z"
                },
                {
                    "institution": "11",
                    "bio": "11",
                    "position": "11",
                    "purpose": "11",
                    "register": "2020-07-04T01:44:03.488Z"
                },
                {
                    "institution": "Freie Universität Berlin",
                    "bio": "I am a masters student. Currently studying Neuroscience.",
                    "position": "Student",
                    "purpose": "Carryout analysis of neurodata",
                    "register": "2020-07-05T00:08:43.709Z"
                },
                {
                    "institution": "tjcu",
                    "bio": "Neuroscientist",
                    "position": "AP",
                    "purpose": "To explore the relationship between brain and behaviors",
                    "register": "2020-07-05T08:46:10.036Z"
                },
                {
                    "institution": "Delhi Technological University",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "To get datasets and analyse them accordingly",
                    "register": "2020-07-06T16:57:22.525Z"
                },
                {
                    "institution": "Universidad Autónoma de Querétaro",
                    "bio": "Stedent of Artificial Intelligence.",
                    "position": "Student",
                    "purpose": "Use an algorithm of machine learning and train it with the signals",
                    "register": "2020-07-07T00:31:35.06Z"
                },
                {
                    "institution": "UCL",
                    "bio": "MRes student",
                    "position": "RA",
                    "purpose": "PPI",
                    "register": "2020-07-07T11:48:10.207Z"
                },
                {
                    "institution": "University of Nebraska Medical Center",
                    "bio": "Neuroimaging and Neurosurgery research assistant.",
                    "position": "Research Data Analyst",
                    "purpose": "I don't know yet. I am just checking it out.",
                    "register": "2020-07-07T14:21:43.204Z"
                },
                {
                    "institution": "uestc",
                    "bio": "BME",
                    "position": "student doctor",
                    "purpose": "learn",
                    "register": "2020-07-07T15:49:05.03Z"
                },
                {
                    "institution": "universidad autonoma de queretaro",
                    "bio": "Student of Artificial intelligence",
                    "position": "student",
                    "purpose": "train model of deep learning",
                    "register": "2020-07-07T17:52:11.235Z"
                },
                {
                    "institution": "Stanford VPNL",
                    "bio": "Post-doctoral scholar at Stanford",
                    "position": "Post-doc",
                    "purpose": "Covert tck to trk",
                    "register": "2020-07-07T19:28:54.723Z"
                },
                {
                    "institution": "George Mason University",
                    "bio": "PhD student in psychology interested in reward, psychosis, fMRI, and EEG.",
                    "position": "Graduate Research Assistant",
                    "purpose": "Help me download datasets that I can use to play around with machine learning techniques",
                    "register": "2020-07-07T19:33:02.65Z"
                },
                {
                    "institution": "Harvard University",
                    "bio": "Research Assistant in Psychiatry Neuroimaging",
                    "position": "Research Assistant",
                    "purpose": "Help students in different parts of the world learn to process images with freesurfer.",
                    "register": "2020-07-07T20:38:35.583Z"
                },
                {
                    "institution": "UNIVERSITY OF CALIFORNIA - SAN FRANCISCO",
                    "bio": "I have a background in functional and structural imaging",
                    "position": "PhD student",
                    "purpose": "I want to create a pipeline that is easily accessible to my colleagues using FSL's Feat package.",
                    "register": "2020-07-08T17:24:29.24Z"
                },
                {
                    "institution": "None",
                    "bio": "Just trying",
                    "position": "Limbo",
                    "purpose": "Experiencing the toolbox",
                    "register": "2020-07-09T10:47:19.123Z"
                },
                {
                    "institution": "Università degli studi di Palermo",
                    "bio": "Medical physics student in Palermo",
                    "position": "Student",
                    "purpose": "learn about ac-pc rotations",
                    "register": "2020-07-10T11:00:20.094Z"
                },
                {
                    "institution": "GIN-IMN",
                    "bio": "Neuroanatomist",
                    "position": "PhD, Researcher",
                    "purpose": "Don't know yet",
                    "register": "2020-07-11T07:14:14.31Z"
                },
                {
                    "institution": "UniTN",
                    "bio": "Clinical neuroscientist",
                    "position": "Researcher",
                    "purpose": "Exploring brainlife potential",
                    "register": "2020-07-11T12:52:55.421Z"
                },
                {
                    "institution": "University of California Santa Cruz",
                    "bio": "I am a second year master's student in computer science with focus on AI.",
                    "position": "Master's student",
                    "purpose": "I am trying to do my master's project on this dataset and need to preprocess it. Hopefully this way I can improve my initial ML results",
                    "register": "2020-07-11T18:26:31.148Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Interested in using computational methods to accelerate neuropsychiatric discovery. Notably focused on neurological / psychiatric disorders such as Alzheimer's/Dementia and Affective Disorders (Depression, PTSD, Anxiety)",
                    "position": "Dual PhD in Complex Network Systems and Intelligent Systems Engineering",
                    "purpose": "Using for brain visualization(s) & semantic bridge between language and brain.",
                    "register": "2020-07-12T05:46:15.818Z"
                },
                {
                    "institution": "MRC Cognition and Brain Sciences Unit",
                    "bio": "Research Associate & Data Manager for Cambridge Centre for Ageing and Neuroscience (CamCAN)",
                    "position": "Research Associate & Data Manager for Cambridge Centre for Ageing and Neuroscience (CamCAN)",
                    "purpose": "Assess multimodal pipeline capabilities",
                    "register": "2020-07-12T15:33:52.083Z"
                },
                {
                    "institution": "YPIE",
                    "bio": "Volunteer instructor for high school students",
                    "position": "Instructor",
                    "purpose": "Assist students in data analysis",
                    "register": "2020-07-13T16:25:55.939Z"
                },
                {
                    "institution": "Northwestern University",
                    "bio": "Data Analyst at Northwestern University, M.S. in Data Science",
                    "position": "Data Analyst",
                    "purpose": "Use MRIQC",
                    "register": "2020-07-13T18:09:06.621Z"
                },
                {
                    "institution": "Boston childrens hospital",
                    "bio": "research",
                    "position": "research assistant",
                    "purpose": "check dwi data if it's correct.",
                    "register": "2020-07-14T03:03:11.36Z"
                },
                {
                    "institution": "Skoltech",
                    "bio": "25 yo, phd student, Skoltech",
                    "position": "phd student",
                    "purpose": "explore datasets from openneuro",
                    "register": "2020-07-14T14:48:17.281Z"
                },
                {
                    "institution": "UCL (University College London)",
                    "bio": "Xiangming Li",
                    "position": "student",
                    "purpose": "for my research project",
                    "register": "2020-07-14T20:00:36.588Z"
                },
                {
                    "institution": "central south university",
                    "bio": "keeping on brain research",
                    "position": "assistant professor",
                    "purpose": "dti fiber segment",
                    "register": "2020-07-15T09:06:49.766Z"
                },
                {
                    "institution": "Personal Use",
                    "bio": "This is a Test Account",
                    "position": "N/A",
                    "purpose": "This is a Test Account",
                    "register": "2020-07-15T21:07:18.174Z"
                },
                {
                    "institution": "Boston University",
                    "bio": "PhD Student in Neuroscience",
                    "position": "Student",
                    "purpose": "Work with open dataset",
                    "register": "2020-07-16T05:31:54.921Z"
                },
                {
                    "institution": "Eotvos Lorand University",
                    "bio": "I'm a PhD student at Eotvos Lorand University, my topic is human memory",
                    "position": "PhD student",
                    "purpose": "I'd like to use a dataset for a project at Neuromatch Academy summer school",
                    "register": "2020-07-16T06:41:52.57Z"
                },
                {
                    "institution": "MSU",
                    "bio": "MSU",
                    "position": "PhD student",
                    "purpose": "to analyze fMRI data",
                    "register": "2020-07-16T06:48:26.213Z"
                },
                {
                    "institution": "Newcastle University",
                    "bio": "PhD student interested in connectomes and dynamical modeling",
                    "position": "PhD student",
                    "purpose": "to use the data for my thesis and future projects",
                    "register": "2020-07-16T06:49:45.604Z"
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "Research assistant at the LIFE-Lab in Pitt's Learning Research and Development Center (LRDC).",
                    "position": "Research Assistant",
                    "purpose": "Use with MR-image analysis to preprocess and run common programs to obtain derivative measures off the original images.",
                    "register": "2020-07-16T18:18:55.554Z"
                },
                {
                    "institution": "QU",
                    "bio": "Statistics",
                    "position": "Associate prof.",
                    "purpose": "research",
                    "register": "2020-07-17T00:16:54.899Z"
                },
                {
                    "institution": "UC Berkeley",
                    "bio": "UC Berkeley PhD student checking out what brainlife.io is about!",
                    "position": "Graduate Student",
                    "purpose": "I just learned about brainlife.io today, and I currently don't have any expectations but it seems very exciting! I'm in the Neuromatch Academy Summer course and I'm just looking at convenient ways of sharing code for fMRI analysis (and fMRI data) across a collaborative group for our Summer Course project.",
                    "register": "2020-07-17T02:14:10.756Z"
                },
                {
                    "institution": "UCLA",
                    "bio": "Graduate student in cognitive neuroscience",
                    "position": "Graduate student",
                    "purpose": "Analyze data",
                    "register": "2020-07-17T16:04:28.263Z"
                },
                {
                    "institution": "University of California, Berkeley",
                    "bio": "Postdoc",
                    "position": "Postdoc",
                    "purpose": "Testing my analysis stream",
                    "register": "2020-07-17T20:05:04.21Z"
                },
                {
                    "institution": "Siemens CT",
                    "bio": "Involved in AI-related projects.",
                    "position": "Expert Scientist",
                    "purpose": "Being able to produce new innovation through the information and data provided here.",
                    "register": "2020-07-18T15:41:56.566Z"
                },
                {
                    "institution": "UCSD",
                    "bio": "UCSD BS Mathematics - 2018",
                    "position": "Volunteer",
                    "purpose": "exploring out of curiosity",
                    "register": "2020-07-18T21:36:21.178Z"
                },
                {
                    "institution": "Universidad Nacional Autónoma de México",
                    "bio": "Neuroimager, interested in brain development and neuropsychiatric disorders.",
                    "position": "Assistant Professor",
                    "purpose": "Quickly test available software tools and potentially implement our own apps.",
                    "register": "2020-07-19T17:51:40.392Z"
                },
                {
                    "institution": "Instituto de Neurobiología, UNAM",
                    "bio": "I am interested in cognitive neuroscience, development, glutamate/GABA spectroscopy, and neuroimaging.",
                    "position": "Master's Student",
                    "purpose": "I want to upload data to analyze it alongside other colleagues",
                    "register": "2020-07-19T20:25:48.703Z"
                },
                {
                    "institution": "VIT University",
                    "bio": "Student B.Tech Biotechnology",
                    "position": "student",
                    "purpose": "apply deep learning algorithms to classify neuroimages",
                    "register": "2020-07-20T19:20:22.9Z"
                },
                {
                    "institution": "Center of Molecular and Behavioral Neuroscience, Rutgers University - Newark",
                    "bio": "Hello! I'm a research intern for Cole Lab in the Center of Molecular and Behavioral Neuroscience at Rutgers University - Newark.",
                    "position": "Research Intern",
                    "purpose": "I would like to accomplish obtaining more knowledge of data analysis and neuroscience with brainlife.io.",
                    "register": "2020-07-21T20:34:12.075Z"
                },
                {
                    "institution": "Rutgers University-Newark",
                    "bio": "Grad student",
                    "position": "PhD Student",
                    "purpose": "New to diffusion imaging.  Trying to processing and analyze some data.",
                    "register": "2020-07-21T20:38:38.113Z"
                },
                {
                    "institution": "yale nus",
                    "bio": "im a student",
                    "position": "student",
                    "purpose": "research",
                    "register": "2020-07-22T04:38:48.051Z"
                },
                {
                    "institution": "Pomona College",
                    "bio": "Neuroscience Undergraduate student",
                    "position": "Student",
                    "purpose": "To use the datasets for academic research purposes",
                    "register": "2020-07-23T00:45:02.688Z"
                },
                {
                    "institution": "The University of Chicago",
                    "bio": "University of Chicago Masters in Analytics Student",
                    "position": "Student",
                    "purpose": "Brain Scan Data",
                    "register": "2020-07-23T01:25:17.437Z"
                },
                {
                    "institution": "Columbia University",
                    "bio": "Hello!",
                    "position": "Graduate Student",
                    "purpose": "Carrying out a group project.",
                    "register": "2020-07-23T14:10:31.095Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "Cognitive neuroscientist. I study memory and decision making. I mostly use fMRI.",
                    "position": "Professor",
                    "purpose": "I hope to use your online apps to preprocess fMRI data for research and teaching purposes.",
                    "register": "2020-07-23T16:08:51.352Z"
                },
                {
                    "institution": "Lanzhou university UAIS",
                    "bio": "A postgraduate.",
                    "position": "Learning",
                    "purpose": "Use data.",
                    "register": "2020-07-27T07:35:00.34Z"
                },
                {
                    "institution": "Indiana University - Bloomington",
                    "bio": "Neuroscience and Vision Science PhD student working with Dr. Nicholas Port and Dr. Franco Pestilli. My primary focus is on blood biomarkers and visual symptoms in conjunction with neuroimaging following sports-related concussion.",
                    "position": "PhD Student",
                    "purpose": "I would like to better understand code and the practices involved with analyzing MRI data, structural, functional, and diffusion-based.",
                    "register": "2020-07-27T15:27:01.886Z"
                },
                {
                    "institution": "Voronezh State University",
                    "bio": "Bioinformatician, data scientist and evolutionary biologist",
                    "position": "Research fellow",
                    "purpose": "I am currently developing R package for EEG time series analysis and classification",
                    "register": "2020-07-27T19:14:37.103Z"
                },
                {
                    "institution": "IIT, Kanpur",
                    "bio": "I am interested in Computational modeling of Psychiatric disorders.",
                    "position": "Student",
                    "purpose": "Looking to assess huge datasets and also use it as a platform for learning.",
                    "register": "2020-07-27T19:14:49.395Z"
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "Interested in early life adversity, developmental psychopathology, and mental health disparities.",
                    "position": "Lab Manager",
                    "purpose": "I will be working on various projects to help process MRI data as part of the LIFE Lab at University of Pittsburgh, looking at early life stress and developmental outcomes.",
                    "register": "2020-07-27T20:15:33.94Z"
                },
                {
                    "institution": "University of Illinois at Chicago",
                    "bio": "I am a 4th year PhD student at University of Illinois at Chicago advised by Dr. Christine Hooker at Rush University Medical Center. My research centers on the neural mechanisms of social cognitive deficits across the psychosis spectrum.",
                    "position": "Graduate Student",
                    "purpose": "Use it to run MRIQC and fMRI prep for data for my preliminary project and dissertation, as well as process data from the larger dataset as a part of my research assistantship duties",
                    "register": "2020-07-27T21:29:11.865Z"
                },
                {
                    "institution": "Hospital Universitário de Brasília",
                    "bio": "Neuroradiologist",
                    "position": "Neuroradiologist",
                    "purpose": "Trying to upgrade my skills",
                    "register": "2020-07-27T21:33:08.494Z"
                },
                {
                    "institution": "Rush University",
                    "bio": "Research Coordinator fo Rush Snap Lab",
                    "position": "Research Coordinator",
                    "purpose": "Pre-processing data",
                    "register": "2020-07-27T21:33:50.991Z"
                },
                {
                    "institution": "Rush University Medical Center",
                    "bio": "Research assistant at the Social Neuroscience and Psychopathology Lab at Rush Medical Center.",
                    "position": "Research Assistant",
                    "purpose": "To do data pre- and post-processing for the data from our studies.",
                    "register": "2020-07-27T21:51:59.363Z"
                },
                {
                    "institution": "Showa University",
                    "bio": "Interested in neuroimaging (fMRI/DWI) and development.",
                    "position": "Senior Assistant Professor",
                    "purpose": "Understanding psychiatric disorders using the state-of-art analytical methods",
                    "register": "2020-07-28T06:55:28.556Z"
                },
                {
                    "institution": "Ecole Nationale d'ingénieurs de Carthage",
                    "bio": "i'm a second year engineering student , i'm studyinng machine learning and deep learning",
                    "position": "engineering student",
                    "purpose": "i want to get datasets to work my projects about brain anomalies detection",
                    "register": "2020-07-29T13:20:02.465Z"
                },
                {
                    "institution": "LPNC",
                    "bio": "Cognitive neuroscience\nEpilepsy & neurological affections\nConnectome\nMachine learning\nNeuroplasticity",
                    "position": "PostDoc",
                    "purpose": "Analyses and visualisation of multimodal data",
                    "register": "2020-07-29T19:05:13.779Z"
                },
                {
                    "institution": "Allen Institute",
                    "bio": "I am neuroscientist working at the Allen Institute in Seattle",
                    "position": "Scientist",
                    "purpose": "get acquainted with fMRI data",
                    "register": "2020-07-30T06:28:30.77Z"
                },
                {
                    "institution": "National Brain Research Centre (NBRC) India",
                    "bio": "Dipanjan Roy is currently affiliated with National Brain Research Center, India. He is leading a Cognitive Brain Dynamics and Connectivity Lab working on various research aspects related to Neuroimaging, Multi-scale computational modeling, EEG, and Behavior. The specific areas in which the group contributes computational models and methods pertained to learning and memory, Perception, and attention, Aging, and Multi-sensory processing. His group is also involved in the connectomics dynamical systems and machine learning-based approach to determine age effects on cognition, neurodegenerative disorders, and reorganization of neurocognitive brain networks. In particular, the group is looking at the relationship between structural perturbations, lesions in patients, and investigating mechanisms of the reorganization of functional connectivity using Computational Modeling and noninvasive probes.  He has made several key contributions to understanding the computational role of time delay, time-scale separation, structure-function relationship, and plasticity that unfolds in a dynamical landscape in the brain. His research combines developing methods to analyze EEG, fMRI recordings at rest and task conditions along with whole-brain computational modeling. Research methods also cover the acquisition of behavioral response under naturalistic, psychophysical stimuli from participants, and investigating neural correlates of behavior.",
                    "position": "Associate Professor",
                    "purpose": "We will use the naturalistic task, lab-based conventional task data and resting multimodal data for developing our in-house analysis and computational and machine learning models to add more to understanding how large-scale Brain connectivity and dynamics shed insight onto Neurodevelopment and Aging and linking with behavior & cognitive functions such as episodic memory, working memory, attention, and perception.",
                    "register": "2020-07-30T06:33:11.498Z"
                },
                {
                    "institution": "UNIVERSITY OF MANCHESTER",
                    "bio": "A POSTGRADUATE STUDENT IN UNIVERSITY OF MANCHESTER",
                    "position": "STUDENT",
                    "purpose": "TO DO MY DISSERTATION",
                    "register": "2020-07-30T14:43:19.71Z"
                },
                {
                    "institution": "Politecnico di Milano",
                    "bio": "Department of Mechanical Engineering",
                    "position": "Ph.D. candidate",
                    "purpose": "having a look at the data measured by different devices and making a comparison",
                    "register": "2020-07-30T16:59:39.112Z"
                },
                {
                    "institution": "Beauchamp's Lab",
                    "bio": "RAVE framework designer - https://openwetware.org/wiki/RAVE",
                    "position": "PhD Student",
                    "purpose": "Seek possibilities to integrate RAVE pipelines and its FreeSurfer 3D-viewer",
                    "register": "2020-07-30T18:21:40.791Z"
                },
                {
                    "institution": "University at Buffalo",
                    "bio": "I am a student studying Computer Science.",
                    "position": "Student",
                    "purpose": "Understanding more about MRI",
                    "register": "2020-07-31T09:00:46.671Z"
                },
                {
                    "institution": "BCBL",
                    "bio": "cognitive neuroscience phd",
                    "position": "phd",
                    "purpose": "analysis data",
                    "register": "2020-07-31T13:53:54.107Z"
                },
                {
                    "institution": "UC San Diego",
                    "bio": "Neuroimaging Research Associate",
                    "position": "Neuroimaging research",
                    "purpose": "Run fMRI prep on dataset.",
                    "register": "2020-08-01T05:22:35.838Z"
                },
                {
                    "institution": "Bioinformatics4All",
                    "bio": "ML",
                    "position": "Co-Founder",
                    "purpose": "Utilizing the platform to analyze publicly available data.",
                    "register": "2020-08-02T18:22:16.009Z"
                },
                {
                    "institution": "New York University Abu Dhabi",
                    "bio": "MRI Physicist, interested in  neuroimaging applications.",
                    "position": "MRI Physicist",
                    "purpose": "Access open source data and analysis code\nUpload my own datasets from publications",
                    "register": "2020-08-03T02:01:01.347Z"
                },
                {
                    "institution": "Michigan",
                    "bio": "Interested in Imaging and AI",
                    "position": "Student",
                    "purpose": "Ease of analysis",
                    "register": "2020-08-03T11:37:48.044Z"
                },
                {
                    "institution": "MIT",
                    "bio": "I am a research scientist at MIT interesting in immunology, neuroscience, and chromatin organization.",
                    "position": "Research scientist",
                    "purpose": "Explore visualization techniques of brain images",
                    "register": "2020-08-03T13:26:56.551Z"
                },
                {
                    "institution": "Universidad de Antioquia",
                    "bio": "Estudiante de bioingeniería",
                    "position": "Student",
                    "purpose": "Learn about neuroimaging",
                    "register": "2020-08-03T22:15:43.532Z"
                },
                {
                    "institution": "Seoul National University",
                    "bio": "Dep of Statistics\nPh.d. students",
                    "position": "Spatio-temporal classification",
                    "purpose": "Analysis fMRI Data",
                    "register": "2020-08-05T08:05:44.364Z"
                },
                {
                    "institution": "Student",
                    "bio": "A medical student trying to gain a little more insight on neuroanatomy.",
                    "position": "Student",
                    "purpose": "A medical student trying to gain a little more insight on neuroanatomy.",
                    "register": "2020-08-05T14:22:23.826Z"
                },
                {
                    "institution": "Erciyes Universiry",
                    "bio": "I am a graduate student at Erciyes University.",
                    "position": "I am a graduate student at Erciyes University.",
                    "purpose": "Obtaining functional MR data for my master thesis.",
                    "register": "2020-08-05T18:06:17.041Z"
                },
                {
                    "institution": "Stanford University",
                    "bio": "Neurologist and neuroscientist",
                    "position": "Instructor",
                    "purpose": "Data science",
                    "register": "2020-08-05T22:42:41.102Z"
                },
                {
                    "institution": "SIMPLICITY Lab",
                    "bio": "Clinician-scientist",
                    "position": "Clinician-Scientist",
                    "purpose": "Interested in NODDI, Freesurfer, HCP",
                    "register": "2020-08-06T02:33:53.722Z"
                },
                {
                    "institution": "Aalto University",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "get more knowledge",
                    "register": "2020-08-06T11:22:06.904Z"
                },
                {
                    "institution": "NYU",
                    "bio": "MRI physicist interested in brain applications",
                    "position": "MRI Physicist",
                    "purpose": "Download and analyze data using the available tools",
                    "register": "2020-08-06T11:49:43.809Z"
                },
                {
                    "institution": "INSSEA",
                    "bio": "Rear",
                    "position": "Student",
                    "purpose": "hlbbjze",
                    "register": "2020-08-08T00:43:25.253Z"
                },
                {
                    "institution": "Institute of Psychology, Chinese Academy of Sciences",
                    "bio": "I got my bachelor degree in 2012 at Wuhan University, China, and Ph.D. in 2018 at Institute of Psycholog, CAS. My research interest includes the behavioral and neural mechanisms of cognitive control, selective attention and crossmodal processing.",
                    "position": "postdoc",
                    "purpose": "Analyze fMRI data with replicable pipeline.",
                    "register": "2020-08-08T05:01:14.298Z"
                },
                {
                    "institution": "Chiba University",
                    "bio": "Neuroanatomist to perform white matter dissection.",
                    "position": "PI",
                    "purpose": "Tractography, fMRI to investigate the sensorimotor transformation.",
                    "register": "2020-08-08T06:54:56.511Z"
                },
                {
                    "institution": "n/a",
                    "bio": "student",
                    "position": "student",
                    "purpose": "I would like to improve my data analysis skills.",
                    "register": "2020-08-09T20:05:31.92Z"
                },
                {
                    "institution": "Ahmedabad University",
                    "bio": "I am doing Ph. D. and my research area is EEG signal analysis. I am working on effects of different conditions on brain waves.",
                    "position": "Research Scholar",
                    "purpose": "I want brainwaves data for my research work in Ph. D. I want to study brainwaves under different conditions. I am trying to classify EEG signals and extract information from that.",
                    "register": "2020-08-10T12:20:59.709Z"
                },
                {
                    "institution": "Louisiana State University",
                    "bio": "Developmental cognitive neuroscientist studying how children learn words in under resourced communities.",
                    "position": "Assistant Professor",
                    "purpose": "Analyze NSF funded project",
                    "register": "2020-08-11T16:18:45.842Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "My name is Elijah (Eli) Baughan. Born and raised in Greensboro, North Carolina. I am always trying to learn and think of ways to discover the interconnectedness between brain regions. Currently, the neurobiology of obsessive-compulsive symptoms are particularly interesting to me.",
                    "position": "Research Assistant",
                    "purpose": "Brainlife.io will help organize my data throughout the analysis process.",
                    "register": "2020-08-11T16:38:37.089Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am currently a Psychology PhD student at Brigham Young University studying Cognitive and Behavioral Neuroscience.",
                    "position": "Graduate Student",
                    "purpose": "Conduct fMRI and structural MRI analyses.",
                    "register": "2020-08-11T23:12:44.286Z"
                },
                {
                    "institution": "University of Cincinnati",
                    "bio": "Neuroscience graduate student",
                    "position": "Student",
                    "purpose": "See datasets",
                    "register": "2020-08-12T15:47:39.329Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "BYU undergraduate",
                    "position": "Research Assistant",
                    "purpose": "I'm hoping to use brainlife to optimize some processes for our research.",
                    "register": "2020-08-12T19:19:24.014Z"
                },
                {
                    "institution": "Stanford",
                    "bio": "Research coordinator in the spanlab!",
                    "position": "Research Coordinator",
                    "purpose": "I would like to help continue research with the ABCD data set.",
                    "register": "2020-08-12T20:56:21.318Z"
                },
                {
                    "institution": "The Ohio State University",
                    "bio": "Clinical Psychology Ph.D. candidate at OSU. Research interests include multimodal imaging, lifestyle interventions, multiple sclerosis, healthy aging, and food.",
                    "position": "Graduate Student",
                    "purpose": "I would like to collaborate on a project started as part of the NeuroHackademy's 2020 Hackathon involving machine learning with multimodal neuroimaging data.",
                    "register": "2020-08-13T18:49:44.323Z"
                },
                {
                    "institution": "JHU/APL",
                    "bio": "Research Scientist",
                    "position": "Research Scientist",
                    "purpose": "Development",
                    "register": "2020-08-13T20:31:15.916Z"
                },
                {
                    "institution": "Johns Hopkins University Applied Physics Lab - NeuroAI and Connectomics group",
                    "bio": "Neuroscientist at JHU APL in the NeuroAI and Connectomics group",
                    "position": "NeuroAI and Connectomics group",
                    "purpose": "fast neuroimaging processing",
                    "register": "2020-08-13T21:03:11.856Z"
                },
                {
                    "institution": "JPMC",
                    "bio": "Software engineer for JPMC. Brain imaging enthusiasts.",
                    "position": "Software Engineer",
                    "purpose": "Collaborate on a creating a multi-modal connectome toolbox in python.",
                    "register": "2020-08-13T22:19:21.425Z"
                },
                {
                    "institution": "University of Washington / Rokem's lab",
                    "bio": "I have a bachelor's degree in computer engineering from University of Washington. I have been working with Ariel Rokem to develop a software called pyAFQ which analyzes dwi data.",
                    "position": "Research Scientist",
                    "purpose": "Coordinate on a group project, share / store data and analysis.",
                    "register": "2020-08-13T23:18:39.088Z"
                },
                {
                    "institution": "George Washington University",
                    "bio": "Post Doctoral Scientist in Attention and Cognition Lab",
                    "position": "Post Doctoral Scientist in Attention and Cognition Lab",
                    "purpose": "I'm in a project group in NeuroHackademy 2020. Our goal is to investigate how we can optimize use of functional, structural, and anatomical data (e.g., fMRI, DTI, and FLAIR/MPRAGE images) to predict clinically relevant phenotypes. We plan to use machine learning to search for features (including lesions) that can predict different cognitive functions, and to build a model on lesion topology, lesion volume, or potentially raw FLAIR images.",
                    "register": "2020-08-14T00:04:00.126Z"
                },
                {
                    "institution": "NA",
                    "bio": "NA",
                    "position": "NA",
                    "purpose": "NA",
                    "register": "2020-08-14T13:25:15.082Z"
                },
                {
                    "institution": "KI",
                    "bio": "Interested in computational methods for Neuroimaging",
                    "position": "Postdoc",
                    "purpose": "Project collaboration",
                    "register": "2020-08-14T15:41:39.04Z"
                },
                {
                    "institution": "Johns Hopkins University Applied Physics Laboratory",
                    "bio": "Hannah Cowley is an Associate Research Scientist at the Johns Hopkins University Applied Physics Laboratory in Laurel, MD. Cowley's interests lie in the intersection of data science and neuroscience, specifically in whole-brain macroscale connectomics in vulnerable populations",
                    "position": "Associate Research Scientist",
                    "purpose": "Share data with collaborators within our institution and collaborate on pipelines for extracting connectomes from whole brain DWI.",
                    "register": "2020-08-14T15:55:11.748Z"
                },
                {
                    "institution": "University of Washington",
                    "bio": "Masters Student in Applied Chemical Science and Technology",
                    "position": "Research Assistant",
                    "purpose": "Machine learning for neuroimaging",
                    "register": "2020-08-14T15:59:54.225Z"
                },
                {
                    "institution": "San Diego Supercomputer Center (SDSC), UCSD",
                    "bio": "Division Director, Data Enabled Scientific Computing Division, SDSC\nAssociate Professor, Department of Radiation Medicine and Applied Sciences, UCSD\nR&D interest in High Performance Computing, cyberinfrastructure (especially for large scale neuroscience modeling and data processing), and parallel computing.",
                    "position": "Division Director of High Performance Computing and Scientific Computing related activities at SDSC.",
                    "purpose": "Interested in computing of brain data.",
                    "register": "2020-08-14T17:30:25.256Z"
                },
                {
                    "institution": "McMaster University",
                    "bio": null,
                    "position": "Student",
                    "purpose": null,
                    "register": "2020-08-16T18:31:38.578Z"
                },
                {
                    "institution": "The University of Texas Austin (Huk Lab, CPS/PSY)",
                    "bio": null,
                    "position": "Graduate student",
                    "purpose": null,
                    "register": "2020-08-17T19:54:04.448Z"
                },
                {
                    "institution": "Dartmouth College",
                    "bio": null,
                    "position": "Ph.D. student",
                    "purpose": null,
                    "register": "2020-08-17T21:19:18.56Z"
                },
                {
                    "institution": "Boston Children's Hospital",
                    "bio": "I'm a research fellow for anesthesia, studying white matter abnormalities in chronic pain.",
                    "position": "Research Fellow",
                    "purpose": "My main interest here is using tractseg to delineate specific WM bundles.",
                    "register": "2020-08-18T04:06:41.327Z"
                },
                {
                    "institution": "JHUAPL",
                    "bio": "Researcher",
                    "position": "Researcher",
                    "purpose": "Development",
                    "register": "2020-08-18T15:46:29.304Z"
                },
                {
                    "institution": "JHUAPL",
                    "bio": "CIRCUIT intern",
                    "position": "Research Intern",
                    "purpose": "Research Human Brain Biomarkers",
                    "register": "2020-08-18T17:47:19.703Z"
                },
                {
                    "institution": "Johns Hopkins Applied Physics Laboratory",
                    "bio": "CIRCUIT Intern",
                    "position": "CIRCUIT Intern",
                    "purpose": "Research for Human Brain Biomarkers",
                    "register": "2020-08-18T17:48:30.667Z"
                },
                {
                    "institution": "Johns Hopkins University Applied Physics Lab",
                    "bio": "Hi, I'm Ben.  I am a high school student from Baltimore County MD on an internship with JHU APL",
                    "position": "Intern",
                    "purpose": "My mentors are using this software for brain imaging, and would like me view the data they're working on.",
                    "register": "2020-08-19T13:57:15.407Z"
                },
                {
                    "institution": "Johns Hopkins University Applied Physics Lab",
                    "bio": "Hello, my name is Scott Talley, and I am a high school student working an internship for APL.  I'm working more on the data visualization side of things, and the data is mostly being processed here.",
                    "position": "High School Intern",
                    "purpose": "I will use it to see what my team members and mentors are up to with their data processing.",
                    "register": "2020-08-19T14:18:56.215Z"
                },
                {
                    "institution": "Stanford University",
                    "bio": "Hello! I'm a cognitive neuroscientist",
                    "position": "postdoc",
                    "purpose": "Hope to get some good data/processing power",
                    "register": "2020-08-20T18:00:27.08Z"
                },
                {
                    "institution": "rq2jiang",
                    "bio": "cs student",
                    "position": "student",
                    "purpose": "to see if there are obvious applications of ml",
                    "register": "2020-08-21T02:38:37.426Z"
                },
                {
                    "institution": "University of Washington",
                    "bio": "I am a Ph.D. student at the University of Washington, in Biomedical and Health Informatics. I am working with neuroimaging data for Alzheimer's disease as part of my dissertation research.",
                    "position": "University of Washington",
                    "purpose": "I am part of a team that wants to develop a toolbox for processing multi-modal neuroimaging and biomarker data to predict disease status for neurological disorders. We plan to use brainlife.io to store data that we will use to develop our models and methods.",
                    "register": "2020-08-21T05:03:01.995Z"
                },
                {
                    "institution": "University of Rocheter",
                    "bio": "-",
                    "position": "Assistant Professor",
                    "purpose": "Not sure, just exploring for now.",
                    "register": "2020-08-21T21:02:51.191Z"
                },
                {
                    "institution": "Stremler Lab, University of Toronto",
                    "bio": "Student at the University of Toronto",
                    "position": "Student",
                    "purpose": "Explore sleep-related MRI and EEG data sets.",
                    "register": "2020-08-23T04:44:33.499Z"
                },
                {
                    "institution": "The University of Texas at Austin",
                    "bio": "I am a graduate student at the University of Texas at Austin in Dr. Juan Dominguez's lab. My research interests are in neural-endocrine regulation of motivated behaviors and associated disorders such as addiction, anxiety, and depression",
                    "position": "Graduate student",
                    "purpose": "I am signing up because it is required for my cognitive and computational neuroscience class.",
                    "register": "2020-08-23T19:25:11.125Z"
                },
                {
                    "institution": "University of Texas at Austin\nDevelopmental Cognitive Neuroscience Lab",
                    "bio": "Third year graduate student in psychology. I study sleep patterns in children with control disorders and how it affects brain networks.",
                    "position": "Graduate Student/Teaching Assistant",
                    "purpose": "Analysis of Neuroimaging Data",
                    "register": "2020-08-24T15:48:07.727Z"
                },
                {
                    "institution": "DCN Lab - UT Austin",
                    "bio": "I am interested primarily in how functional network organization changes during development and in atypically developing populations.",
                    "position": "PhD Candidate",
                    "purpose": "Pipeline creation for projects as a source of easy replication.",
                    "register": "2020-08-24T16:28:26.311Z"
                },
                {
                    "institution": "University of Arkansas",
                    "bio": "My name is Stephanie and I am a graduate student at the University of Arkansas.",
                    "position": "graduate student",
                    "purpose": "I will be using Brainlife in my neuroimaging course.",
                    "register": "2020-08-25T21:05:16.708Z"
                },
                {
                    "institution": "university of science and technology of china",
                    "bio": "I am a doctoral student, majoring in pattern recognition and intelligent systems, and focusing on the research of brain functional networks.At present, it focuses on the analysis and research of abnormal brain functional network caused by various brain diseases or mental diseases by using machine learning and complex network methods.",
                    "position": "doctoral student",
                    "purpose": "I and other researchers in our lab are preparing to use Brainlife's open data to study brain functional networks, especially dynamic functional networks, and in conjunction with our clinical hospitals, to translate the findings into clinical practice.",
                    "register": "2020-08-26T03:10:56.695Z"
                },
                {
                    "institution": "Iran national brain mapping centre",
                    "bio": "Medical student at shahid beheshti university of medical science\nIntrested in neuroscience and brain mapping",
                    "position": "Student",
                    "purpose": "Fmri preproccessing in a project about changing brain connectivity in alzhiemer's disease.\n",
                    "register": "2020-08-26T16:49:55.532Z"
                },
                {
                    "institution": "Università degli studi di Cagliari",
                    "bio": "Just a med student from Sardinia trying to build my future",
                    "position": "Student",
                    "purpose": "Help with my thesis project",
                    "register": "2020-08-26T18:39:27.531Z"
                },
                {
                    "institution": "MoCA Lab",
                    "bio": "Graduate Student",
                    "position": "Graduate Student",
                    "purpose": "For now, a class in which I am learning to analyze and interpret MR data, but eventually will be using for my own research",
                    "register": "2020-08-26T21:41:44.738Z"
                },
                {
                    "institution": "University of Arkansas",
                    "bio": "Experimental Psychology PhD student in Grant Shield's lab",
                    "position": "Graduate Student",
                    "purpose": "Neuroimaging course work",
                    "register": "2020-08-26T21:41:56.967Z"
                },
                {
                    "institution": "University of Arkansas",
                    "bio": "PhD student in neuroscience",
                    "position": "PhD student",
                    "purpose": "Learning neuroimaging data analysis",
                    "register": "2020-08-26T21:42:25.37Z"
                },
                {
                    "institution": "University of Arkansas",
                    "bio": "Graduate Assistant",
                    "position": "Graduate Assistant",
                    "purpose": "Neuroimaging Course",
                    "register": "2020-08-26T21:46:11.569Z"
                },
                {
                    "institution": "UNIFI psicologia",
                    "bio": "I'm a student who wants to achieve skills about neuroscience",
                    "position": "student",
                    "purpose": "this platform is the heaven for neuroscientists",
                    "register": "2020-08-27T14:18:31.391Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "I am a graduate student at the University of Texas at Austin. My research focus is on using real-time fMRI neurofeedback to improve fine motor control in patients after stroke.",
                    "position": "Graduate Student",
                    "purpose": "I am required to sign up here for class.",
                    "register": "2020-08-27T18:59:05.336Z"
                },
                {
                    "institution": "The University of Texas at Austin",
                    "bio": "I am a Ph.D. student at the University of Texas at Austin in the department of Psychology in the Departmental Neuroscience area",
                    "position": "researcher",
                    "purpose": "registered for a course",
                    "register": "2020-08-27T21:41:24.673Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "MSCS Student",
                    "position": "Master's Student",
                    "purpose": "Data access & processing",
                    "register": "2020-08-27T21:42:04.422Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "to be completed",
                    "position": "Graduate research assistant",
                    "purpose": "Rehabilitation robotics",
                    "register": "2020-08-27T21:42:19.409Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "research assistant at the university of texas at asutin",
                    "position": "research assistant",
                    "purpose": "learning more about processing data",
                    "register": "2020-08-27T21:43:03.613Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "I perform research on neural reorganization and plasticity after stroke",
                    "position": "research assistant",
                    "purpose": null,
                    "register": "2020-08-27T21:46:47.137Z"
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "I'm a neuroscience Ph.D. student investigating the development of cognitive control and emotion regulation circuitry and associated psychiatric disorders.",
                    "position": "Graduate Student Researcher",
                    "purpose": "I want to sharpen my computational skills and contribute to open-data projects.",
                    "register": "2020-08-28T03:48:19.959Z"
                },
                {
                    "institution": "University of Waterloo",
                    "bio": "PhD student at the University of Waterloo, working on nonparametric methods for complex data.",
                    "position": "PhD Student",
                    "purpose": "I would like to use it in my research, and help develop inference for these data.",
                    "register": "2020-08-28T21:13:26.739Z"
                },
                {
                    "institution": "Haukeland University Hospital",
                    "bio": "Post.doc at the Bergen Center for Brain Plasticity",
                    "position": "Post.doc",
                    "purpose": "Try out apps",
                    "register": "2020-08-29T10:17:53.774Z"
                },
                {
                    "institution": "University of Cagliari",
                    "bio": "Luca Saba is full professor of Radioloy and Chief of the Department of Radiology in the A.O.U. of Cagliari. Professor Saba research fields are focused on Multi-Detector-Row Computed Tomography, Magnetic Resonance, Ultrasound, Neuroradiology, and Diagnostic in Vascular Sciences.",
                    "position": "Full Professor of Radiology",
                    "purpose": "Research",
                    "register": "2020-08-29T19:41:08.005Z"
                },
                {
                    "institution": "n/a",
                    "bio": "I am working on a spike detection project.",
                    "position": "n/a",
                    "purpose": "I want to use the data to help me create a hardware design that will perform spike detection in real time.",
                    "register": "2020-08-30T19:33:50.911Z"
                },
                {
                    "institution": "University of tehran",
                    "bio": "Phd student, working on diffusion MRI",
                    "position": "Student",
                    "purpose": "To facilitate the dmri processing through my phd project",
                    "register": "2020-08-31T19:17:43.744Z"
                },
                {
                    "institution": "tianjin university",
                    "bio": "Brain science research",
                    "position": "student",
                    "purpose": "to eeg machine learning algorithm",
                    "register": "2020-09-01T01:08:43.518Z"
                },
                {
                    "institution": "University of Michigan",
                    "bio": "My lab investigates how the human brain integrates information from auditory, visual, and tactile modalities to generate computationally efficient estimates of the world.",
                    "position": "Assistant Professor",
                    "purpose": "Interest in creating a pipeline for processing EEG/iEEG data",
                    "register": "2020-09-01T10:40:54.76Z"
                },
                {
                    "institution": "University of North Texas",
                    "bio": "Philosopher, Student, Teacher, Artist, Entrepreneur, Love for the Movies, Free Spirit, Interest in Neuroscience as well as Genetics and Chemistry.",
                    "position": "Student Teacher",
                    "purpose": "Practice with analyzing data",
                    "register": "2020-09-02T02:45:29.195Z"
                },
                {
                    "institution": "University of North Carolina - Chapel Hill, DayanLab",
                    "bio": "I'm a 2nd year graduate student in Eran Dayan's lab. I have research experience in molecular neuroscience, image processing, and computational neuroscience. I'm interested in studying the general properties of robustness in complex systems, and in particular how this relates to resilience to the effects of aging and neurodegenerative diseases in the brain.",
                    "position": "Graduate Research Assistant",
                    "purpose": "I hope to use this repository to access and analyze DTI data, as well as learn about preprocessing pipelines since my lab has little experience working with DTI.",
                    "register": "2020-09-02T17:18:47.674Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "Assistant Professor in the School of Nursing. Research focus on the cognitive effects of cancer and cancer treatment.",
                    "position": "Assistant Professor",
                    "purpose": "I am currently enrolled in a graduate course on computational neuroscience where we are using this platform.",
                    "register": "2020-09-03T20:30:54.023Z"
                },
                {
                    "institution": "Imaging Genetic Center, USC",
                    "bio": "I am a research assistant at the Imaging Genetics Center, part of the Steven Neuroimaging and Informatics Institute at the Keck School of Medicine, USC.",
                    "position": "Research Assistant",
                    "purpose": "I would like to try out many of the useful tools, and learn what approaches other researchers are employing.",
                    "register": "2020-09-04T16:51:14.349Z"
                },
                {
                    "institution": "CAOs Lab",
                    "bio": "To be defined",
                    "position": "Research Scholar",
                    "purpose": "I would love to use brainlife.io to automatize some pipelines in the aspect of MRI, fMRI, and MRA datasets and comprise all the information in a centralized manner.",
                    "register": "2020-09-04T18:55:51.919Z"
                },
                {
                    "institution": "Texas Tech University",
                    "bio": "Speech-language pathologist, early child development specialist, autism researcher, family advocate, brain fanatic",
                    "position": "Doctoral Student, Graduate Research Assistant",
                    "purpose": "Eager to take some analysis courses and process secondary neuroimaging data from the ABIDE II (Autism Brain Imaging Database Exchange) dataset",
                    "register": "2020-09-04T19:09:40.178Z"
                },
                {
                    "institution": "Indiana University-Purdue University Indianapolis",
                    "bio": "I am assistant professor of statistics at Indiana University-Purdue University Indianapolis. I got my PhD in Statistics from Michigan State University in 2015. My research interests focus on functional/longitudinal data analysis, high dimensional data analysis, nonparametric smoothing, machine learning, causal inference and statistical genetics/genomics.",
                    "position": "Assistant Professor of Statistics",
                    "purpose": "I will use brainlife for research on brainimaging.",
                    "register": "2020-09-04T19:19:23.205Z"
                },
                {
                    "institution": "USC",
                    "bio": "Radiologist",
                    "position": "Los Angeles",
                    "purpose": "Do research.",
                    "register": "2020-09-04T20:39:10.895Z"
                },
                {
                    "institution": "University of Nebraska-Lincoln",
                    "bio": "I am a second-year master student in educational psychology. Also, I have a bachelor's degree in psychology and a master's degree in clinical psychology. Besides, I am a research assistant in the lab that conducts neuroimaging research.",
                    "position": "Master student",
                    "purpose": "For now, I just want to learn what this platform offers. I hope that it may help me to deepen my knowledge and acquire new skills in neuroimaging analysis.",
                    "register": "2020-09-06T00:17:01.765Z"
                },
                {
                    "institution": "Oxford Brookes University",
                    "bio": "3rd Year undergraduate Psychology student",
                    "position": "Student",
                    "purpose": "Explore and analyse brain scanning datasets",
                    "register": "2020-09-06T10:19:18.499Z"
                },
                {
                    "institution": "University of Puget Sound",
                    "bio": "Chair of Neuroscience",
                    "position": "Chair of Neuroscience",
                    "purpose": "Using in classrooms",
                    "register": "2020-09-06T18:25:41.458Z"
                },
                {
                    "institution": "The University of Alabama in Huntsville",
                    "bio": "Current graduate student pursuing a Master's in Experimental Psychology",
                    "position": "Graduate Student",
                    "purpose": "I would like to be able to examine many different studies and data archives to further learn about different areas of research.",
                    "register": "2020-09-07T22:49:16.239Z"
                },
                {
                    "institution": "UC Denver",
                    "bio": "I'm just a student researcher exploring the platform.",
                    "position": "student researcher",
                    "purpose": "I just want to learn more about the public database!",
                    "register": "2020-09-07T23:26:42.409Z"
                },
                {
                    "institution": "Télécom Paris",
                    "bio": "Associate Professor in Artificial Intelligence and Medical Imaging.",
                    "position": "Associate Professor",
                    "purpose": "Use both the data-sets and the proposed algorithms for educational and research purpose",
                    "register": "2020-09-08T09:54:52.048Z"
                },
                {
                    "institution": "University of Texas, Austin",
                    "bio": "I lead the Cloud and Interactive Computing group (CIC) at the Texas Advanced Computing Center at the University of Texas, Austin. CIC builds highly scalable distributed systems for research computing. Primarily funded by the NSF, we tackle fundamental problems in research computing such as portability and reproducibility. We are also interested in applying formal methods to establish desirable properties of systems. We teach courses as part of the Computational Engineering program at UT Austin.",
                    "position": "Research Associate",
                    "purpose": "I would like to evaluate and understand the functionality available in brainlife.",
                    "register": "2020-09-09T22:14:54.699Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "21, M, Bloomington",
                    "position": "Lab Assistant",
                    "purpose": "To learn to code and the application in Neuroscientific data",
                    "register": "2020-09-09T23:08:28.352Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "Undergraduate student studying biochemistry",
                    "position": "Student",
                    "purpose": "I would like to make a meaningful impact in this research",
                    "register": "2020-09-10T01:58:09.514Z"
                },
                {
                    "institution": "University of Sydney & Australian National Imaging Facility",
                    "bio": "* Bachelor of Electrical Engineering, University of New South Wales, Australia\n* PhD in diffusion MRI methods development, University of Melbourne, Australia\n* Post Doc in computational neuroscience, Okinawa Institute of Science and Technology, Japan\n* Informatics fellow, Monash University, Australia\n* Informatics fellow, University of Sydney, Australia",
                    "position": "Informatics Fellow",
                    "purpose": "I am interested in checking out the functionality of BrainLife, comparing it to other neuroimaging analysis platforms, and seeing how it could complement initiatives we are developing at our institution.",
                    "register": "2020-09-10T04:34:45.897Z"
                },
                {
                    "institution": "University of York",
                    "bio": "Professor in psychology / neuroscience",
                    "position": "Professor",
                    "purpose": "Facilitate distributed / collaborative neuroimaging analysis",
                    "register": "2020-09-10T08:34:00.775Z"
                },
                {
                    "institution": "University of Sao paulo/BRAINSMC Lab",
                    "bio": "Master Student Candidate in Neuroscience\nBrain Stimulation and Motor Control Laboratory\nUniversity of Sao Paulo (USP)\n\nLaboratory Technician\nLaboratory of Biomechanical and Motor Control\nSchool of Physical Education and Sport - USP\n\nGraduated in Physiotherapy\nRibeirao Preto Medical School - USP",
                    "position": "Master Degree Student",
                    "purpose": "BRAINLIFE is a great opportunity to interact and contribute with the neuroscience community. In my specific situation, inittialy I'm using it to run the app \"mrtrix3 preprocess\". I'm having trouble to run it in my computer because of cuda configurations.",
                    "register": "2020-09-10T17:12:32.117Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "Researcher in the  Cloud and Interactive Computing (CIC) group at the Texas Advanced Computing Center (TACC)",
                    "position": "Engineering Scientist",
                    "purpose": "Explore available applications, datatypes and resources. Run small demo applications.",
                    "register": "2020-09-10T19:47:24.785Z"
                },
                {
                    "institution": "University of Campania \"L. Vanvitelli\"",
                    "bio": "I'm a post-doctoral researcher at the Dept. of Mathematics and Physics of the University of Campania \"L. Vanvitelli\". My field of expertise is numerical optimization.",
                    "position": "Post-doc",
                    "purpose": "Test the performance of an optimization algorithm in the task of training a linear classifier with structured sparsity for fMRI data",
                    "register": "2020-09-11T08:49:14.759Z"
                },
                {
                    "institution": "Dr. Sivanthi Aditanar college of engineering",
                    "bio": "RA/TA, Computer Science and Engineering, Dr. Sivanthi Aditanar College of Engineering.",
                    "position": "Research Asst.",
                    "purpose": "Research",
                    "register": "2020-09-11T10:30:44.054Z"
                },
                {
                    "institution": "Medical Physics Group / Jena University Hospital",
                    "bio": "Researcher in MR diffusion and computational neuroscience",
                    "position": "Post-Doc",
                    "purpose": "Just want to test this platform",
                    "register": "2020-09-11T13:04:32.996Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "I'm a software engineer and researcher at the Texas Advanced Computing Center developing software tools and infrastructure to support scientific computing in cloud and HPC environments.  I work on middleware security and job processing on the NSF funded Tapis project (https://tapis-project.org/).",
                    "position": "Research Associate",
                    "purpose": "I'm interested exploring Brainlife from a software infrastructure perspective, to better understand how it supports reproducible science and to ways to integrate other software systems with it.",
                    "register": "2020-09-11T13:40:48.163Z"
                },
                {
                    "institution": "University of Aberdeen",
                    "bio": "I am a PhD Student at the University of Aberdeen investigating neurocorrelates between BMI and emotional awareness.",
                    "position": "PhD Student",
                    "purpose": "For the purposes of analysing data, writing my thesis, and collecting aggregate data for meta-analyses.",
                    "register": "2020-09-11T14:06:46.846Z"
                },
                {
                    "institution": "University of Southern California",
                    "bio": "Early career neuroscientist interested in brain imaging in neurodegenerative disorders.",
                    "position": "Postdoctoral Fellow",
                    "purpose": "I hope to use Brainlife to test new tractography tools on diffusion MRI data so I can find a suitable one to implement one on some larger-scale cohorts.",
                    "register": "2020-09-11T22:36:01.59Z"
                },
                {
                    "institution": "University of Sussex",
                    "bio": "PG",
                    "position": "Student",
                    "purpose": "Trying to learn how to process fMRI data.",
                    "register": "2020-09-12T08:15:30.018Z"
                },
                {
                    "institution": "University of Florida",
                    "bio": "I am beginning to use fmri as my primary research tool",
                    "position": "Graduate student",
                    "purpose": "Learning and expermentation",
                    "register": "2020-09-12T09:07:48.969Z"
                },
                {
                    "institution": "University of California-Irvine",
                    "bio": "I am a phd researcher",
                    "position": "PhD student",
                    "purpose": "I want to use brainlife for preprocessing of my data",
                    "register": "2020-09-12T12:40:04.019Z"
                },
                {
                    "institution": "Hospital Israelita Albert Einstein",
                    "bio": "Neuroscientist current analysing neuroimaging in movement disorder",
                    "position": "Graduate Student",
                    "purpose": "Creat open access to data and colaborate on scientific findings",
                    "register": "2020-09-13T16:46:17.527Z"
                },
                {
                    "institution": "Stevens Institute of Technology",
                    "bio": "I am a post doctoral fellow working on brain motion imaging",
                    "position": "Post doctoral fellow",
                    "purpose": "I need to process DTI data for a project",
                    "register": "2020-09-14T14:19:31.838Z"
                },
                {
                    "institution": "Unicamp",
                    "bio": "Research Engineer",
                    "position": "Researcher",
                    "purpose": "learn about EEG signals",
                    "register": "2020-09-14T18:41:43.825Z"
                },
                {
                    "institution": "Worcester Polytechnic Institute",
                    "bio": "Hey",
                    "position": "Temporary researcher",
                    "purpose": "We'd like to use it to validate our EEG data analysis algorithms.",
                    "register": "2020-09-14T18:51:53.492Z"
                },
                {
                    "institution": "SungkyunKwan University, South Korea/ Computer Security Lab",
                    "bio": "Currently I am a Master conducting my reasearch in the field of neuroimaging.",
                    "position": "Research Assistant",
                    "purpose": "I would try to learn how neuroimaging analysis is performed using this platform",
                    "register": "2020-09-14T19:30:22.482Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am a graduate student studying the brain network organization of individuals with Autism.",
                    "position": "Graduate Research Assistant",
                    "purpose": "I will be using this platform for learning data analysis in preparation for conducting my own research.",
                    "register": "2020-09-15T18:56:23.022Z"
                },
                {
                    "institution": "University of York",
                    "bio": "See Orcid",
                    "position": "Professor",
                    "purpose": "Testing could-based data analysis",
                    "register": "2020-09-16T09:20:12.595Z"
                },
                {
                    "institution": "American School of Brasilia",
                    "bio": "Teacher of IB biology",
                    "position": "Teacher",
                    "purpose": "Data analysis",
                    "register": "2020-09-16T14:00:52.923Z"
                },
                {
                    "institution": "UOL",
                    "bio": "DTI SCANS",
                    "position": "PHD STUDENT",
                    "purpose": "DTI ANALYSIS",
                    "register": "2020-09-16T17:50:07.642Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "Clinical Psychology student",
                    "position": "Clinical Psychology graduate student",
                    "purpose": "I need to use it for my Neuroimaging Analysis class",
                    "register": "2020-09-16T20:37:34.415Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am a graduate student at Brigham Young University.",
                    "position": "Graduate Student",
                    "purpose": "I would like to use braininfo learn and understand fMRI pipelines.",
                    "register": "2020-09-17T20:04:26.913Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I'm currently an undergrad (psychology) interested in neuropsychology and brain imaging!",
                    "position": "Research Assistant",
                    "purpose": "My plan is to use brainlife.io to help with analyses in a current neuroimaging class.",
                    "register": "2020-09-18T02:32:20.352Z"
                },
                {
                    "institution": "UTSA",
                    "bio": "My interest is the mathematical model of the biological process. My work involves creating models that are biologically grounded and behave like the modeled phenomena. Hopefully, the models would give us a better understanding and predictability of biology.",
                    "position": "postdoc",
                    "purpose": "Just exploring for now.",
                    "register": "2020-09-18T15:55:28.906Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am a PhD student at BYU studying psychology with an emphasis in cognitive neurosciencee.",
                    "position": "Graduate Student",
                    "purpose": "I am using brainlife.io as a way to share projects with collaborators (in this case, my course instructor and class peers) in our fMRI neuroimaging course. During this time, we will be sharing analyses and various neuroimaging data and resources as we continue to familiarize ourselves with this platform.",
                    "register": "2020-09-18T18:35:42.614Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "Clinical psychology PhD candidate",
                    "position": "PhD Candidate",
                    "purpose": "I would like to use brianlife to help with my fMRI datasets for my fMRI research.",
                    "register": "2020-09-18T21:35:03.629Z"
                },
                {
                    "institution": "CHUV",
                    "bio": "physician interested in neuroscience",
                    "position": "physician",
                    "purpose": "research",
                    "register": "2020-09-19T18:08:32.263Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "My research focuses on structural brain changes following traumatic brain injury (across the spectrum of injury severity) and how they relate to neurobehavioral functioning during recovery.",
                    "position": "Assistant Professor",
                    "purpose": "I am required to sign up to meet the requirements for an fMRI course to perform neuroimage analysis, but I hope to be able to use it for my own TBI research as well.",
                    "register": "2020-09-19T23:45:33.456Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am a master's student in neuroscience at Brigham Young University interested in reward, and addiction.",
                    "position": "Master's Student",
                    "purpose": "For use in learning fMRI procedure in association with a course on neuroimaging analysis.",
                    "register": "2020-09-20T00:02:07.499Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I study cognitive development (e.g., concussions, autism).",
                    "position": "Associate Professor",
                    "purpose": "Taking a class on analyzing neuroimages.",
                    "register": "2020-09-20T02:02:39.582Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am an undergraduate studying Biochemistry working in a cognitive psychology lab.  The lab is focused specifically on memory and utilizes fMRI to conduct research.",
                    "position": "Lab Manager",
                    "purpose": "I will use brainlife to prepare fMRI data gathered from the BYU MRI lab so that they can later be analyzed using AFNI.  This data will be used to conduct primary research and publish articles.",
                    "register": "2020-09-20T03:59:56.2Z"
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "A dMRI researcher at University of Pittsburgh",
                    "position": "Assistant Professor",
                    "purpose": "Processing DWI data using DSI Studio.",
                    "register": "2020-09-21T22:46:51.657Z"
                },
                {
                    "institution": "Thapar University",
                    "bio": "my name is syed Sajid Hussain . I have done my B.Tech In CSE and M.Tech in CSE also. I am presently doing PhD at Thapar University, India",
                    "position": "JRF",
                    "purpose": "I am doing Research on Imaging (MRI,fMRI,DTI) data . At Brainlife i will get an insight about my research",
                    "register": "2020-09-22T04:09:15.603Z"
                },
                {
                    "institution": "California Medical Innovations Institute",
                    "bio": "Computational modeling",
                    "position": "Assistant Research Professor",
                    "purpose": "Testing capabilities on the platform",
                    "register": "2020-09-22T05:00:34.802Z"
                },
                {
                    "institution": "King's College London",
                    "bio": "Graduate student at King's College London. Founder of Ness Labs. Ex-Google digital health team.",
                    "position": "Graduate Student",
                    "purpose": "Using datasets for training purposes.",
                    "register": "2020-09-22T14:16:30.842Z"
                },
                {
                    "institution": "BYU",
                    "bio": "I am currently a student at BYU studying Neuroscience",
                    "position": "student",
                    "purpose": "I am in a neuroimaging analysis class to and need access in order to complete assignments in my class and better understand fmri studies",
                    "register": "2020-09-22T17:03:43.174Z"
                },
                {
                    "institution": "Fukushima Medical University",
                    "bio": "My interests include awake brain surgery, neuroimaging, and cognitive brain functions.",
                    "position": "Postgraduate student",
                    "purpose": "I have been using many of the neuroimaging analysis software on my personal devices for years. It is going to be the first time I will try a cloud-based system. I hope it will allow me to achieve more results in lesser time.",
                    "register": "2020-09-23T06:35:24.226Z"
                },
                {
                    "institution": "University of Iowa",
                    "bio": "Neurosurgery resident interested in functional and brain tumor",
                    "position": "Resdienet",
                    "purpose": "Tractography in brain tumor and epilpesy surgery",
                    "register": "2020-09-23T15:06:56.831Z"
                },
                {
                    "institution": "UCSF",
                    "bio": "I am a research assistant at UCSF, aiming to study brain development/degeneration in children.",
                    "position": "Research Assistant",
                    "purpose": "I want to use brainlife to analyze morphometric brain data.",
                    "register": "2020-09-24T15:22:41.501Z"
                },
                {
                    "institution": "Institute of Medical Science and Technology",
                    "bio": "I'm Master's student at Shaheed Beheshti University. my field of interest is neuroscience.",
                    "position": "Master's Student",
                    "purpose": "I'm working on MRI and PET neuroimages and studying about AD. so I'll use this platform to do computational jobs on my dataset.",
                    "register": "2020-09-24T18:08:43.674Z"
                },
                {
                    "institution": "Neuroscience Research Australia",
                    "bio": "Physicist specialising in MR imaging.",
                    "position": "National Imaging Facility Fellow",
                    "purpose": "WM differentiation",
                    "register": "2020-09-25T00:16:17.918Z"
                },
                {
                    "institution": "Duke University",
                    "bio": "Neurosurgery resident at Duke University",
                    "position": "Resident Physician",
                    "purpose": "Surgical targeting and correlations of anatomy and clinical outcome",
                    "register": "2020-09-25T15:50:38.481Z"
                },
                {
                    "institution": "Imsat",
                    "bio": "Post doc researcher",
                    "position": "Post doctoral researcher",
                    "purpose": "Analyzing my data with fsl",
                    "register": "2020-09-27T12:42:33.157Z"
                },
                {
                    "institution": "University of Calgary",
                    "bio": "Honours thesis student.",
                    "position": "Honours thesis student.",
                    "purpose": "Will be used to aid in my thesis project.",
                    "register": "2020-09-27T21:31:01.583Z"
                },
                {
                    "institution": "Stanford University, Department of Neurosurgery",
                    "bio": "MD/researcher",
                    "position": "Researcher",
                    "purpose": "- Test and compare with existing technologies.",
                    "register": "2020-09-28T02:49:57.664Z"
                },
                {
                    "institution": "Appalachian State University",
                    "bio": "I am a senior that will graduating with a Computer Science (BS) degree in May of 2021.",
                    "position": "Student",
                    "purpose": "I expect to create neural network models using the fMRI data sets provided out of personal interest and with the aim of improving my data science skills.",
                    "register": "2020-09-28T18:51:21.681Z"
                },
                {
                    "institution": "theputernerd",
                    "bio": "Just doing ML",
                    "position": "Director",
                    "purpose": "Investigate the data",
                    "register": "2020-09-28T23:29:14.946Z"
                },
                {
                    "institution": "University of Sydney",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "Project",
                    "register": "2020-09-30T00:01:42.737Z"
                },
                {
                    "institution": "Ok",
                    "bio": "Ok",
                    "position": "Ok",
                    "purpose": "Ok",
                    "register": "2020-09-30T03:42:43.271Z"
                },
                {
                    "institution": "University Medical Center Utrecht",
                    "bio": "MRI scientist working in diffusion MRI methods development and applications.",
                    "position": "Senior Postdoc",
                    "purpose": "I am curious to explore the potential of the platform in applying multiple pipelines to existing dataset. Eventually going to use to study data of patients with Cerebrovascular Disease.",
                    "register": "2020-09-30T06:44:29.987Z"
                },
                {
                    "institution": "UC",
                    "bio": ".",
                    "position": "Master's student",
                    "purpose": "fiber tracking",
                    "register": "2020-10-01T13:26:28.79Z"
                },
                {
                    "institution": "INSERM",
                    "bio": "Research associate in Biomedical engineering",
                    "position": "Post doc",
                    "purpose": "Preprocessing DWI",
                    "register": "2020-10-02T13:43:17.026Z"
                },
                {
                    "institution": "University of Calgary",
                    "bio": "Postdoctoral research associate",
                    "position": "Postdoctoral association",
                    "purpose": "Studying brain structures in healthy aging and psychiatric disorders",
                    "register": "2020-10-02T19:56:41.307Z"
                },
                {
                    "institution": "Institute of Neuroscience, Consiglio Nazionale delle Ricerche",
                    "bio": "Central somatosensory systems drive the processing of the tactile and the noxious (pain) information, two important functions whose intrinsic mechanisms remain largely unveiled. A strong emphasis is given onto the mesoscopic perspective of neural circuits and onto the complementary involvement of other cellular compartments (glial and vascular endothelial cells). These are envisaged in view of their fundamental roles in overall brain dynamics and, more specifically, in the crucial transition from acute to chronic pain and in chronic pain maintenance. Eventually, in order to face the multivariate expression of neuronal populations it is also my aim to study neural circuit signals by formal tools provided by the complex network and dynamical system theories.",
                    "position": "Tenured Research Associate",
                    "purpose": "I would like to use brainlife.io to automatize tasks in exploring and analyzing public MRI and fMRI datasets. In particular I'll put my attention to pain and chronic pain public studies.",
                    "register": "2020-10-05T07:33:46.906Z"
                },
                {
                    "institution": "University of Oxford",
                    "bio": "I am a 4th year DPhil student in Clinical Neuroscience. My current project aims to understand the capacity for degeneration and reorganisation in the adult human visual cortex. I use the techniques of Magnetic Resonance Spectroscopy Imagining, Population Receptive Field mapping and Cortical Thickness to investigate changes in the visual cortex of patients with vision loss due to Stargardt disease.",
                    "position": "DPhil student",
                    "purpose": "I will use the anterior/posterior maps of the visual areas to calculate cortical thickness values between my patient group and controls.",
                    "register": "2020-10-05T10:46:22.16Z"
                },
                {
                    "institution": "Rutgers University",
                    "bio": "Hello! I am a student at Rutgers at the School of Public Health with a concentration in Global Public Health and doing research on the risk of Alzheimer's disease in the African American population over 60 years old.",
                    "position": "Student",
                    "purpose": "Will be using for my neuroimaging class at Rutgers University",
                    "register": "2020-10-05T13:32:23.593Z"
                },
                {
                    "institution": "Seoul National University",
                    "bio": "Woo-Young (Young) Ahn is an Associate Professor in the Department of Psychology at Seoul National University (September 2019 - Present; Assistant Professor from September 2017 to August 2019). He was previously an Assistant Professor in the Department of Psychology and an affiliated faculty at Translational Data Analytics at The Ohio State University (August 2015 – August 2017). He earned his B.S. in materials science & engineering in 2002 from Seoul National University and then went to Harvard University as a doctoral candidate for applied physics and received his S.M. in applied physics in 2003. Due to his interests in the human mind, he decided to change his major to clinical psychology so that he could study the human mind from multiple perspectives. He continued on to receive his M.A. in clinical psychology from Seoul National University in 2006, and his Ph.D. in clinical psychology from Indiana University, Bloomington in August 2012 co-advised by Jerome Busemeyer and Brian O’Donnell. He completed his (APA accredited) clinical psychology internship at the University of Illinois at Chicago (UIC) in June 2012. He worked then as a postdoc with Read Montague and Peter Dayan for two years at Virginia Tech Carilion Research Institute (VTCRI) and for a year at Virginia Commonwealth University Institute for Drug and Alcohol Studies.",
                    "position": "Associate Professor",
                    "purpose": "To analyze open data and advance knowledge",
                    "register": "2020-10-06T04:22:46.688Z"
                },
                {
                    "institution": "Northeastern University and Massachusetts General Hospital",
                    "bio": "A postdoc interested in aging, memory, functional networks, and neurodegeneration.",
                    "position": "Postdoctoral Research Fellow",
                    "purpose": "I would like to use this platform to perform massive processing and analysis of publicly available datasets.",
                    "register": "2020-10-06T14:10:15.911Z"
                },
                {
                    "institution": "Ghent University",
                    "bio": "I did a MsC physics and am now doing a PhD at the intersection of computational neuroscience, network physiology and bayesian inference.",
                    "position": "PhD student",
                    "purpose": "Access and preprocess data (up to region of interest extraction)",
                    "register": "2020-10-06T14:16:29.493Z"
                },
                {
                    "institution": "UW",
                    "bio": "Data engineer with experience using cloud, ML, Radiology",
                    "position": "Data Engineer",
                    "purpose": "research brains",
                    "register": "2020-10-06T20:10:52.217Z"
                },
                {
                    "institution": "VA Boston Healthcare System",
                    "bio": "test",
                    "position": "post-doctoral fellow",
                    "purpose": "test",
                    "register": "2020-10-07T14:58:17.438Z"
                },
                {
                    "institution": "Cornell University",
                    "bio": "PhD BME Student at Cornell",
                    "position": "Graduate Student",
                    "purpose": "I plan on using this website to complete a project for BME 5310: ML in BME.",
                    "register": "2020-10-07T16:25:32.386Z"
                },
                {
                    "institution": "Cornell U",
                    "bio": "Undergraduate BME",
                    "position": "Student",
                    "purpose": "Educational based project in ML",
                    "register": "2020-10-07T16:32:09.315Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "Dr. Lewis-Peacock received his B.S. in Electrical Engineering, M.S. in Computer Science, and Ph.D. in Psychology from the University of Wisconsin-Madison. He was a postdoctoral research fellow in the Department of Psychology and the Princeton Neuroscience Institute at Princeton University before joining the faculty at The University of Texas at Austin in 2013. His work investigates how the human brain supports our ability to accomplish goals. Specifically, he focuses on the intersection of cognitive control and memory for goal-directed behavior. His lab uses a combination of neuroimaging and computational techniques, including multivariate pattern analysis of fMRI data and real-time functional neuroimaging, to characterize core features of human cognition.",
                    "position": "Associate Professor",
                    "purpose": "Standardize and enhance the data analysis and computing capabilities in my lab.",
                    "register": "2020-10-07T20:18:30.855Z"
                },
                {
                    "institution": "University of California, Berkeley",
                    "bio": "5th Year MIDS student at UC Berkeley's School of Information",
                    "position": "Student",
                    "purpose": "Using interesting datasets for projects",
                    "register": "2020-10-08T02:54:10.002Z"
                },
                {
                    "institution": "UV",
                    "bio": "learning and enjoing",
                    "position": "student",
                    "purpose": "learn and investigation",
                    "register": "2020-10-08T03:48:42.046Z"
                },
                {
                    "institution": "Lille University Hospital",
                    "bio": "a bit of informatics, and a lot of test-retest...",
                    "position": "Research Engineer",
                    "purpose": "I like to test new stuff....especially about tractography ...so brainlife looks like teh best solution to minimize the time spend for this...",
                    "register": "2020-10-09T13:58:00.635Z"
                },
                {
                    "institution": "ICM",
                    "bio": "Neuroimaging, MRI, 3T, 7T, brain atlases, deep brain stimulation, basal ganglia, brainstem, image processing, registration",
                    "position": "Research engineer",
                    "purpose": "I would like to discover / use Brainlife as a user, before to upload methods and tools into it.",
                    "register": "2020-10-10T08:24:36.742Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "Graduate student",
                    "position": "PhD candidate",
                    "purpose": "testing out some preprocessing",
                    "register": "2020-10-10T17:01:28.296Z"
                },
                {
                    "institution": "Creatis - CNRS",
                    "bio": "I am a CNRS research engineer at the Creatis laboratory in Lyon, France, currently in charge of the VIP platform. My activity is focused on optimizing the execution of medical image processing applications on heterogeneous distributed systems.",
                    "position": "Research Engineer",
                    "purpose": "Discover the services provided for neorosciences.",
                    "register": "2020-10-12T14:20:08.937Z"
                },
                {
                    "institution": "UBC",
                    "bio": "science nerd",
                    "position": "postdoc",
                    "purpose": "I'll use data here to validate our analytic approches.",
                    "register": "2020-10-12T18:02:52.613Z"
                },
                {
                    "institution": "Cornell University",
                    "bio": "Student.",
                    "position": "Student",
                    "purpose": "Working on school project.",
                    "register": "2020-10-12T22:46:14.081Z"
                },
                {
                    "institution": "WUST",
                    "bio": "I am a student",
                    "position": "study",
                    "purpose": "download datas and study",
                    "register": "2020-10-13T02:43:01.61Z"
                },
                {
                    "institution": "Institute of Medical Sciences and Technology (IMSAT).",
                    "bio": "I am studying master of bio-medical engineering | I am interested in bio-medical signal processing and applications of machine learning in neuroimaging.",
                    "position": "student",
                    "purpose": "one of my friends introduced brainlife to me and when i see it, I found the Freesurfer  that I need it to calculate the cortical thickness",
                    "register": "2020-10-13T14:15:19.26Z"
                },
                {
                    "institution": "Singapore American School",
                    "bio": "student studying EEG dynamics",
                    "position": "Student",
                    "purpose": "Datasets for research purposes",
                    "register": "2020-10-15T08:33:59.019Z"
                },
                {
                    "institution": "Child Mind Institute",
                    "bio": "Passionate about brain computer interaction",
                    "position": "Assistant Research Engineer",
                    "purpose": "Maintain our software C-PAC",
                    "register": "2020-10-15T18:16:41.592Z"
                },
                {
                    "institution": "Child Mind Institute",
                    "bio": "Research Engineer @ Computational Neuroimaging Lab",
                    "position": "Research Engineer",
                    "purpose": "app to run C-PAC",
                    "register": "2020-10-15T18:49:27.363Z"
                },
                {
                    "institution": "NYIT College of Osteopathic Medicine",
                    "bio": "Neuroscientist interested in brain development.",
                    "position": "Faculty",
                    "purpose": "Download MRI of rodents for the study of brain development",
                    "register": "2020-10-15T18:51:49.034Z"
                },
                {
                    "institution": "Saint Thomas Hospital West",
                    "bio": "RN Clinical Specialist Neurooncology",
                    "position": "Clinical Coordinator Brain and Spine Tumor Center",
                    "purpose": "exploring brain mapping techniques for surgical planning",
                    "register": "2020-10-15T23:06:57.881Z"
                },
                {
                    "institution": "SUNGKYUNKWAN UNIVERSITY",
                    "bio": "I am a Ph.D. researcher at skku.",
                    "position": "researcher",
                    "purpose": "to learn, and execute my process",
                    "register": "2020-10-16T04:51:47.848Z"
                },
                {
                    "institution": "Academy for Science of the Czech Republic",
                    "bio": "Just a brain scientist",
                    "position": "Post-doc",
                    "purpose": "Current work aims to integrate structural connectivity with functional connectivity",
                    "register": "2020-10-19T22:59:13.892Z"
                },
                {
                    "institution": "Independent",
                    "bio": "TODO",
                    "position": "Chairman",
                    "purpose": "Evaluation",
                    "register": "2020-10-21T16:10:18.459Z"
                },
                {
                    "institution": "UDEM",
                    "bio": "Ambitiously sweeping since the 1990s",
                    "position": "Janitor",
                    "purpose": "hi"
                },
                {
                    "institution": "Vrije Universiteit Amsterdam",
                    "bio": "http://www.dutchconnectomelab.nl/person.php?pid=186",
                    "position": "Researcher",
                    "purpose": "No expected purpose yet.",
                    "register": "2020-10-21T20:26:13.138Z"
                },
                {
                    "institution": "University of Utah",
                    "bio": "I do neuroimaging.",
                    "position": "Research Associate",
                    "purpose": "Trying to convert tck to trk.",
                    "register": "2020-10-22T15:35:27.061Z"
                },
                {
                    "institution": "University of Virginia",
                    "bio": "Just happy to be here",
                    "position": "Professor",
                    "purpose": "World domination",
                    "register": "2020-10-22T17:13:22.768Z"
                },
                {
                    "institution": "Cornell University",
                    "bio": "Grad student at Cornell University",
                    "position": "Student",
                    "purpose": "To work on ML projects",
                    "register": "2020-10-22T19:35:59.493Z"
                },
                {
                    "institution": "Stanford University",
                    "bio": "Kevin obtained a PhD in Neuroscience from Northwestern University while working in the Physical Therapy and Human Movement Sciences Department and a BS/BA in Psychology and English from Boston College. His dissertation research focused on understanding the neural mechanisms underlying upper extremity impairments in individuals with chronic stroke and subsequent motor improvements following novel interventions. His postdoctoral work at Stanford with Dr. Helen Bronte-Stewart focuses on the neural features associated with gait impairment in individuals with Parkinson's disease using a combination of structural imaging, neurophysiology, and kinematic analysis. He was awarded a Postdoctoral Fellowship for Basic Scientists from the Parkinson's Foundation to investigate the cognitive correlates of gait impairment in Parkinson's disease",
                    "position": "Postdoctoral Scholar",
                    "purpose": "Test mri and diffusion analyses on different datasets",
                    "register": "2020-10-23T19:06:53.721Z"
                },
                {
                    "institution": "medical science and technology",
                    "bio": "biomedical engineer",
                    "position": "master student",
                    "purpose": "to run my codes more fast",
                    "register": "2020-10-24T10:06:02.492Z"
                },
                {
                    "institution": "Tehran university of medical science",
                    "bio": "medical student \ninterested in neuroscience, neuroimaging, and immunology.",
                    "position": "Student",
                    "purpose": "I want to use it for analyzing datas and saving them and sharing between people of project.",
                    "register": "2020-10-25T17:21:17.103Z"
                },
                {
                    "institution": "Thomas Jefferson High School for Science and Technology",
                    "bio": "I am a senior attending TJHSST.",
                    "position": "student",
                    "purpose": "I would like to use this account to access datasets for my senior research project.",
                    "register": "2020-10-25T19:42:08.366Z"
                },
                {
                    "institution": "KNTU",
                    "bio": "I graduated from KNTU",
                    "position": "graduate student",
                    "purpose": "I would like to learn about the preprocessing steps of dMRI data",
                    "register": "2020-10-26T08:57:40.262Z"
                },
                {
                    "institution": "ENS",
                    "bio": "neuroimaging, decoding, encoding, language, perception",
                    "position": "Researcher",
                    "purpose": "Test the platform",
                    "register": "2020-10-26T13:41:20.946Z"
                },
                {
                    "institution": "University of Kent, School of Engineering and Digital Arts",
                    "bio": "Final year undergraduate student in computer systems engineering",
                    "position": "Undergraduate Student",
                    "purpose": "Use of EEG databases for final year graduation project",
                    "register": "2020-10-26T17:25:03.71Z"
                },
                {
                    "institution": "MEDICOM - PUCRS",
                    "bio": "PhD student working with medical imaging.",
                    "position": "PhD student",
                    "purpose": "I hope to use BrainLife to analyze and visualize images.",
                    "register": "2020-10-27T14:16:53.914Z"
                },
                {
                    "institution": "BCH",
                    "bio": "Master degree.",
                    "position": "Research Assistant",
                    "purpose": "check gradient flip",
                    "register": "2020-10-29T15:48:48.781Z"
                },
                {
                    "institution": "Tehran University of Medical Sciences",
                    "bio": "M.D., great passion for neurology and neurology research",
                    "position": "Research assistant",
                    "purpose": "I want to learn image analysis on brainlife.io",
                    "register": "2020-10-30T13:07:36.044Z"
                },
                {
                    "institution": "CU Boulder",
                    "bio": "I like brains!",
                    "position": "Research Assistant",
                    "purpose": "I would like to use this resource to further my education on the analysis of neuroimaging data",
                    "register": "2020-10-30T17:38:43.249Z"
                },
                {
                    "institution": "Beijing Institute of Technology",
                    "bio": "my main research is whole brain segmentation based on deeping learning",
                    "position": "student",
                    "purpose": "I mainly use some data in brainlife.io for my research, such as whole brain segmentation, tracting white matter bundles.",
                    "register": "2020-11-02T09:18:52.297Z"
                },
                {
                    "institution": "CHUV",
                    "bio": "Research assistant at the Service des Troubles de l'Autisme et Apparentés (STSA)",
                    "position": "Postdoc",
                    "purpose": "Publication of diffusion MRI pipelines, code and data related to submitted papers.",
                    "register": "2020-11-02T10:57:06.021Z"
                },
                {
                    "institution": "The University of Sydney",
                    "bio": "I am a current PhD student in the field of neuroscience at the Brain and Mind Centre, The University of Sydney. I am exploring the role of neuromodulatory systems on brain function and degeneration.",
                    "position": "PhD Student",
                    "purpose": "My expectations of this platform is to be able to access and analyse data from open sources, specifically I want to be able to use the neuroimaging applications like fmriprep to pre-process open source data.",
                    "register": "2020-11-02T22:40:26.414Z"
                },
                {
                    "institution": "Linköping University",
                    "bio": "PhD student",
                    "position": "PhD student",
                    "purpose": "Own DTI development tools",
                    "register": "2020-11-07T19:04:25.303Z"
                },
                {
                    "institution": "RPI",
                    "bio": "I seek to develop computational models of the cortico-basal ganglia-thalamo-cortical loop.",
                    "position": "Research Assistant",
                    "purpose": "Learn fMRI data analysis.",
                    "register": "2020-11-09T04:31:16.371Z"
                },
                {
                    "institution": "Mia Jovanova",
                    "bio": "phd student",
                    "position": "phd student",
                    "purpose": "training",
                    "register": "2020-11-10T01:37:48.159Z"
                },
                {
                    "institution": "University of Kurdistan",
                    "bio": "Ahmad Sohrabi holds a PhD in Cognitive Science. He is an assistant professor at the Department of Psychology, University of Kurdistan, Sanandaj.",
                    "position": "assistant Professor at the Department of Psychology, , University of Kurdistan, Sanandaj.",
                    "purpose": "Teaching graduate courses in cognitive science and doing research.",
                    "register": "2020-11-10T08:00:35.066Z"
                },
                {
                    "institution": "Ağrı İbrahim Çeçen Universitesi",
                    "bio": "i am a teacher in Agri Ibrahim Cecen University.",
                    "position": "i am a ph.d student in Inonu inuversity.",
                    "purpose": "I want to convert brain mri  to Mini 152 space with ANTs.",
                    "register": "2020-11-10T08:29:13.993Z"
                },
                {
                    "institution": "Hacettepe University Department Of Neurosurgery",
                    "bio": "I am a resident Neurosurgeon at Hacettepe University\n\nMy main areas of research interest are computer applications in Neuroscience and Neurosurgery, namely Brain Computer Interfaces and Bio-Silicone Computers.",
                    "position": "Resident Neurosurgeon",
                    "purpose": "I would like to use the platform for DTI analysis.",
                    "register": "2020-11-10T18:37:31.001Z"
                },
                {
                    "institution": "MVMIP laboratory",
                    "bio": "Biomedical MSc student",
                    "position": "Research assistant",
                    "purpose": "I'd like to use it mainly for tractography and data visualization.",
                    "register": "2020-11-10T18:38:31.593Z"
                },
                {
                    "institution": "UW Madison",
                    "bio": "Research Scientist",
                    "position": "Scientist",
                    "purpose": "I would like to use some of the data to serve as control in a study.\nThank you.",
                    "register": "2020-11-10T18:39:14.534Z"
                },
                {
                    "institution": "Montgomery Blair high School",
                    "bio": "While pursuing a rigorous academic schedule, I have not only engaged myself in leadership activities like Student Government and Volunteering for years but committed myself as an artist by getting years of training since my kindergarten days. Along with Dance I play Clarinet and piano for 10 years. I performed and participated in numerous competitions on the State and National levels. My goal is to use music in Science to make research Experience interesting and productive.",
                    "position": "student",
                    "purpose": "I would like to get some help for my research.",
                    "register": "2020-11-11T12:55:55.114Z"
                },
                {
                    "institution": "UMBC",
                    "bio": "Student performing research on MRI segmentation",
                    "position": "Student",
                    "purpose": "Dataset",
                    "register": "2020-11-12T18:54:22.12Z"
                },
                {
                    "institution": "Shahid Beheshti University",
                    "bio": "psychology graduate, skilled in neuroimaging",
                    "position": "researcher",
                    "purpose": "I want to use this platform in order to perform MRI analyzes",
                    "register": "2020-11-13T09:50:33.01Z"
                },
                {
                    "institution": "University of South Carolina",
                    "bio": "Doctoral student",
                    "position": "Grad studnet",
                    "purpose": "from openneuro",
                    "register": "2020-11-13T20:44:45.7Z"
                },
                {
                    "institution": "University of California, Berkeley",
                    "bio": "A third year undergrad at UC Berkeley studying Computer Science and Molecular and Cell Biology (Neurobiology emphasis) double majors, passionate about computational neuroscience and aim to work as a computational biologist to demystify the human brain.",
                    "position": "Undergrad Student",
                    "purpose": "Would like to use the platform for some EEG and fMRI data analysis.",
                    "register": "2020-11-14T05:38:42.774Z"
                },
                {
                    "institution": "Duke University/Southwell Lab",
                    "bio": "MD/PhD student bound for academic neurosurgery",
                    "position": "MD/PhD Student",
                    "purpose": "Coding and research purposes",
                    "register": "2020-11-15T15:02:15.386Z"
                },
                {
                    "institution": "Jazan University",
                    "bio": "I am an Assistant professor in the faculty of pharmacy at Jazan University doing research on brain and neuroscience.",
                    "position": "Assistant Professor",
                    "purpose": "Research",
                    "register": "2020-11-16T20:45:42.275Z"
                },
                {
                    "institution": "Ghent University",
                    "bio": "-",
                    "position": "Postdoc",
                    "purpose": "Analyse language network and the effect of typical aging, using graph theory",
                    "register": "2020-11-18T16:41:09.232Z"
                },
                {
                    "institution": "University of Western Ontario",
                    "bio": "Patch-Clamp EPhysiology",
                    "position": "Graduate Students",
                    "purpose": "Provide lab tools for users dealing with ephys",
                    "register": "2020-11-19T00:01:33.776Z"
                },
                {
                    "institution": "University of Messina",
                    "bio": "I'm an Electronic Engineer with Phisics PhD and my research topic is neuroscience.",
                    "position": "Research Fellow",
                    "purpose": "I'd like to know brainlife",
                    "register": "2020-11-19T08:33:27.268Z"
                },
                {
                    "institution": "Student",
                    "bio": "noting",
                    "position": "Student",
                    "purpose": "to learn",
                    "register": "2020-11-19T10:35:45.026Z"
                },
                {
                    "institution": "Karolinska Institutet",
                    "bio": "Med doctor and researcher",
                    "position": "PhD Student",
                    "purpose": "Coding",
                    "register": "2020-11-19T14:56:49.033Z"
                },
                {
                    "institution": "University of Bergen, Dept. of Informatics",
                    "bio": "I have completed by Bachelors in Electronics Engineering in 2014 from Karachi Institute of Economics & Technology, Pakistan. I did my masters in Computer Engineering from Chosun University, South Korea. And currently I am pursuing my PhD in Computational Biology from University of Bergen, Norway.",
                    "position": "PhD Researcher",
                    "purpose": "A part of my research project deals with MRI brain images, and I hope the brainlife.io will make my life lot easier, where I can use the different pipelines already created to process the MRI data. I just found about brainlife.io, and I do not have much expectations at the moment but upon going through the YouTube videos and different apps at brainlife.io  it seems very interesting and I hope it will certainly help me in my project.",
                    "register": "2020-11-20T12:20:44.395Z"
                },
                {
                    "institution": "上海海事大学",
                    "bio": "硕士研究生",
                    "position": "学生",
                    "purpose": "科研",
                    "register": "2020-11-21T11:02:02.452Z"
                },
                {
                    "institution": "Unipd",
                    "bio": "researcher wannabe",
                    "position": "Researcher",
                    "purpose": "Process fmri data",
                    "register": "2020-11-21T17:34:38.777Z"
                },
                {
                    "institution": "UCSB",
                    "bio": "Undergraduate research intern at UCSB.",
                    "position": "Undergraduate Research Intern",
                    "purpose": "I will be preprocessing DWI.",
                    "register": "2020-11-22T23:15:27.116Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "Senior at BYU majoring in Neuroscience.",
                    "position": "Student",
                    "purpose": "To analyze fMRI data from study about cognitive benefits of bilingualism.",
                    "register": "2020-11-24T05:05:16.186Z"
                },
                {
                    "institution": "UOK",
                    "bio": "student in cognitive psychology",
                    "position": "student",
                    "purpose": "data analysis",
                    "register": "2020-11-24T12:15:27.857Z"
                },
                {
                    "institution": "uok",
                    "bio": "im a cognitive psychology student.",
                    "position": "student",
                    "purpose": "to see pictures",
                    "register": "2020-11-24T12:56:53.695Z"
                },
                {
                    "institution": "UOK of IRI",
                    "bio": "university student of cognitive science",
                    "position": "student",
                    "purpose": "learning",
                    "register": "2020-11-24T13:09:32.469Z"
                },
                {
                    "institution": "University of Kurdistan",
                    "bio": "I'm a psychologist. I interested in cognitive sciences.",
                    "position": "Master degree in cognitive psychology",
                    "purpose": "I'm a psychologist. I interested in cognitive sciences.",
                    "register": "2020-11-24T13:46:54.52Z"
                },
                {
                    "institution": "University of Padova",
                    "bio": "Psychiatrist, interested in neuro-imaging and pharmacology",
                    "position": "PhD student",
                    "purpose": "Team working on brain imaging",
                    "register": "2020-11-25T21:24:06.989Z"
                },
                {
                    "institution": "University of Padova",
                    "bio": "PhD student in computational neuroscience",
                    "position": "PhD Student",
                    "purpose": "Neuroimaging analysis",
                    "register": "2020-11-26T10:46:31.816Z"
                },
                {
                    "institution": "University of Padova",
                    "bio": "PhD student at the University of Padova, I'm currently working on eating disorders at the Padova Hospital",
                    "position": "PhD Student",
                    "purpose": "Neuorimaging workshop",
                    "register": "2020-11-26T10:47:55.568Z"
                },
                {
                    "institution": "University of Groningen",
                    "bio": "N/A",
                    "position": "Student",
                    "purpose": "N/A",
                    "register": "2020-11-27T10:32:50.137Z"
                },
                {
                    "institution": "Salzburg Universität",
                    "bio": "I did a bachelor in Psychology at the KU Leuven, followed by a master in cognitive neuroscience at Maastricht University. For my master thesis I looked into the population receptive fields of the visual word form area. Currently I am working as a PhD student in the doctoral college 'imaging the mind' under supervision of Prof. Florian Hutzler, focusing on developing methods that will enable the correct use of reverse inference in fMRI.",
                    "position": "Phd Student",
                    "purpose": "I am interested in working with data on OpenNeuro and I am mostly curious to find out what this platform will enable me to do.",
                    "register": "2020-11-27T11:43:57.032Z"
                },
                {
                    "institution": "University of Manchester",
                    "bio": "Undergraduate neuroscience student",
                    "position": "Student",
                    "purpose": "To acquire and analyse secondary data",
                    "register": "2020-11-27T13:07:31.363Z"
                },
                {
                    "institution": "Catalan Institute of Paleoecology and Social Evolution (IPHES)",
                    "bio": "Paleoneurologist",
                    "position": "P.hd. student",
                    "purpose": "Study human evolution",
                    "register": "2020-11-27T19:23:35.462Z"
                },
                {
                    "institution": "kordestan",
                    "bio": "student",
                    "position": "msc",
                    "purpose": "proclass",
                    "register": "2020-11-28T18:50:01.636Z"
                },
                {
                    "institution": "uok",
                    "bio": "i am a cognitive psychology student",
                    "position": "student",
                    "purpose": "to analyze data",
                    "register": "2020-11-28T19:02:18.705Z"
                },
                {
                    "institution": "University of California, Berkeley",
                    "bio": "Undergraduate Cognitive Science student at UC Berkeley and member of the NeuroTechnology Club.",
                    "position": "Student",
                    "purpose": "The main usage of this platform is to provide students within the NeuroTech club exposure to FMRI analysis using live datasets. The platform will be utilized for educational purposes.",
                    "register": "2020-11-28T23:40:41.009Z"
                },
                {
                    "institution": "university of kurdistan",
                    "bio": "student in cognitive science",
                    "position": "student",
                    "purpose": "development of science for all",
                    "register": "2020-11-29T08:16:37.059Z"
                },
                {
                    "institution": "ICM",
                    "bio": "qdfgfdq",
                    "position": "Paris",
                    "purpose": "dfgdfsg",
                    "register": "2020-11-30T14:31:10.567Z"
                },
                {
                    "institution": "Institut du Cerveau - Paris Brain Institute (ICM), CNRS / Inserm / Sorbonne Université",
                    "bio": "After a PhD on evoked potential studies of face processing, I did a post-doc in the Functional Imaging Laboratory\nof the Wellcome Departement for Cognitive Neuroscience of London. I then became a lecturer in the Université\nParis 8 (1998-2001) before being recruited as a research scientist at the CNRS. I was promoted as Research\nProfessor (DR2, CNRS) in 2012. My research focus has been on face perception from the early stages of my\ncareer. I moved from a focus on visual cognitive processes to the study of social and affective processes involved\nin face processing. I am now moving toward the study of the interaction between socio-affective processes and\nmotor control, with a focus on the electrophysiology of the involved subcortico-cortical networks. To tackle these\nissues, I use the variety of methods available in the field of human cognitive neuroscience, with an emphasis on\nEEG and MEG methods that give access to the dynamics of information processing",
                    "position": "CNRS Senior Scientist",
                    "purpose": "Using brainlife.io in the context of the CRCNS ANR-NSF grant for developping brainlifeMEEG",
                    "register": "2020-11-30T14:35:05.133Z"
                },
                {
                    "institution": "Kurdistan university",
                    "bio": "Msc student",
                    "position": "msc student",
                    "purpose": "doing class excersises",
                    "register": "2020-11-30T17:31:14.837Z"
                },
                {
                    "institution": "UOK",
                    "bio": "I AM AN ARCHITECT.",
                    "position": "STUDENT",
                    "purpose": "RESEARCH",
                    "register": "2020-11-30T18:24:45.003Z"
                },
                {
                    "institution": "Stanford University",
                    "bio": "I'm a cognitive neuroscientist interested in motivation, decision-making, and all kinds of brainy things.",
                    "position": "Postdoctoral fellow",
                    "purpose": "I intend to use brainlife for data processing and analysis",
                    "register": "2020-11-30T23:34:10.393Z"
                },
                {
                    "institution": "General sir john kotelawala defence university",
                    "bio": "PhD in Imaging Medicine",
                    "position": "Senior Lecturer",
                    "purpose": "Data analysis and visualization",
                    "register": "2020-12-01T03:52:45.172Z"
                },
                {
                    "institution": "UC San Diego",
                    "bio": "TBD",
                    "position": "Scientific and educational programmer",
                    "purpose": "Learned about this via an ECSS webinar on Jetstream. I am supporting a brain eeg/meg sleep study as part of XSEDE ECSS and wanted to learn more about what brainlife.io might provide.",
                    "register": "2020-12-01T18:17:02.253Z"
                },
                {
                    "institution": "university of Kordestan",
                    "bio": "cognitive science student",
                    "position": "student",
                    "purpose": "dd",
                    "register": "2020-12-01T20:54:16.551Z"
                },
                {
                    "institution": "METU",
                    "bio": "Medical Informatics MSc Student @ METU",
                    "position": "Graduate student",
                    "purpose": "Our lab can't work during the pandemic so I want to explore M/EEG data here.",
                    "register": "2020-12-02T14:33:38.722Z"
                },
                {
                    "institution": "University Of Kurdistan",
                    "bio": "Master student of cognitive psychology",
                    "position": "Student",
                    "purpose": "downloading apps",
                    "register": "2020-12-02T17:19:11.614Z"
                },
                {
                    "institution": "Indiana University Bloomington",
                    "bio": "Ph.D. student in BNBL lab",
                    "position": "Ph.D. Student",
                    "purpose": "Looking to process, analyze data and create apps.",
                    "register": "2020-12-02T20:24:24.204Z"
                },
                {
                    "institution": "UOK",
                    "bio": "Cognitive Psychology Master Student",
                    "position": "Student",
                    "purpose": "Research",
                    "register": "2020-12-02T22:11:20.5Z"
                },
                {
                    "institution": "Department of Cognitive Neuroscience and Philosophy, University of Skövde",
                    "bio": "Senior lecturer in Cognitive neuroscience, Program director of M.Sc. Cognitive neuroscience; research on body illusions, motor control, and multisensory integration",
                    "position": "Senior lecturer in Cognitive neuroscience, Program director of M.Sc. Cognitive neuroscience;",
                    "purpose": "I explore this as a potential tool to introduce fMRI data processing to my students.",
                    "register": "2020-12-04T11:10:25.554Z"
                },
                {
                    "institution": "BRAC University",
                    "bio": "I am an undergraduate student of Computer Science and Engineering. Currently doing my thesis on BCI.",
                    "position": "student",
                    "purpose": "Doing undergraduate thesis on BCI.",
                    "register": "2020-12-06T18:33:46.762Z"
                },
                {
                    "institution": "Center17",
                    "bio": "I work in Psychiatric Neuroimaging",
                    "position": "Researcher",
                    "purpose": "I have been tasked with using reproducible pipelines for analysis (singularity containers, BIDS input) for multi-site collaborative projects such as ENIGMA and I would like to evaluate Brainlife as a cloud resource for processing and sharing such work.",
                    "register": "2020-12-08T23:48:19.183Z"
                },
                {
                    "institution": "King's College London",
                    "bio": "Medical Imaging and Machine Learning Researcher",
                    "position": "Research Associate",
                    "purpose": "Access to standardized and pre-processed data.",
                    "register": "2020-12-09T14:42:39.164Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "PhD student at UT Austin",
                    "position": "PhD Student & GRA/TA",
                    "purpose": "To analyze and access neuroimaging data.",
                    "register": "2020-12-10T02:39:36.445Z"
                },
                {
                    "institution": "ANCP Lab, University of Oldenburg",
                    "bio": "Background in Computer Science (Software-Engineering). Doing research on decision making in adaptive human machine systems in my master's thesis.",
                    "position": "Master's student",
                    "purpose": "Gain better understanding of decision making processes using the open data sets.",
                    "register": "2020-12-10T07:25:38.936Z"
                },
                {
                    "institution": "Harvard University",
                    "bio": "DL Engineer",
                    "position": "Director of Solution Architecture",
                    "purpose": "DL Learning",
                    "register": "2020-12-11T01:06:27.45Z"
                },
                {
                    "institution": "IIT Ropar",
                    "bio": "Student of first year graduation in computer science and engineering",
                    "position": "student",
                    "purpose": "To learn medical image processing, reconstruction, segmentation etc.",
                    "register": "2020-12-11T11:53:06.649Z"
                },
                {
                    "institution": "Tarbiat Modares University",
                    "bio": "I get my Ph.D. and M.A. degrees in computer engineering from Tarbiat Modares University in 2019 and 2013 respectively. I acquired the B.Sc. degree in computer engineering from the university of Esfahan in 2011. I am interested in the theory and applications of complex networks in human brain based on fMRI data. My research interests are machine learning and computer vision in biomedical applications.",
                    "position": "Researcher",
                    "purpose": "I need to process and analyze fMRI image datasets related to my research.",
                    "register": "2020-12-12T03:17:25.276Z"
                },
                {
                    "institution": "Karolinska Institute",
                    "bio": "PhD neuroimaging Aberdeen University (ABIC)",
                    "position": "Student",
                    "purpose": "For investigating and pilot testing for new studies",
                    "register": "2020-12-13T19:42:49.7Z"
                },
                {
                    "institution": "institute of Biochemistry and Biophysics",
                    "bio": "I'm Tehran based PhD candidate in Bioinformatics. Currently, I'm working on connectomics is the brain in my PhD thesis.\nBy the way, I would like to list my research interests for future study  below:\n -  Computational molecular neuroscience\n -  Application of bioinformatics in drug delivery systems in the holistic approach.",
                    "position": "PhD candidate in Bioinformatics",
                    "purpose": "I want to analyse fMRI datasets from openneuro.",
                    "register": "2020-12-13T20:07:55.185Z"
                },
                {
                    "institution": "Università degli Studi di Padova - PNC",
                    "bio": "PhD Student in Cog.Nsc.",
                    "position": "PhD Student",
                    "purpose": "Purpose: develop a group project.\nExpectations: this will prove to be useful in the near future.",
                    "register": "2020-12-14T08:45:42.955Z"
                },
                {
                    "institution": "Università degli Studi di Padova - PNC",
                    "bio": "PhD Student.",
                    "position": "PhD Student.",
                    "purpose": "Purpose: to develop a group project.\nExpectations: to use it more in the near future.",
                    "register": "2020-12-14T08:49:34.666Z"
                },
                {
                    "institution": "University of Trento",
                    "bio": "PhD student",
                    "position": "PhD student",
                    "purpose": "NA",
                    "register": "2020-12-14T14:55:14.796Z"
                },
                {
                    "institution": "Instituto Federal do Espírito Santo",
                    "bio": "MSc Data Science",
                    "position": "Student",
                    "purpose": "Research",
                    "register": "2020-12-14T22:10:50.138Z"
                },
                {
                    "institution": "Johns Hopkins University Applied Physics Lab",
                    "bio": "Researcher/neural engineer in the Neuroscience group at JHU/APL: Research and Exploratory Development Department.",
                    "position": "Senior Professional Staff",
                    "purpose": "Sharing data within a project with other researchers at my institution",
                    "register": "2020-12-15T00:19:47.477Z"
                },
                {
                    "institution": "I.R.C.C.S. Neuromed",
                    "bio": "Neuroimaging researcher",
                    "position": "Researcher",
                    "purpose": "I plan to use brainlife as pipeline manager and to speed up my neuroimaging analysis data currently carried on a GPU-powered workstation",
                    "register": "2020-12-15T12:14:18.592Z"
                },
                {
                    "institution": "Institute of Psychology, CAS",
                    "bio": "PhD candidate in social neuroscience",
                    "position": "PhD candidate",
                    "purpose": "To process the fMRI data.",
                    "register": "2020-12-15T13:23:41.696Z"
                },
                {
                    "institution": "University of Florida",
                    "bio": "Deep brain stimulation, neuromodulation",
                    "position": "Neurologist",
                    "purpose": "Exploring this tool for potential applications",
                    "register": "2020-12-15T13:41:12.363Z"
                },
                {
                    "institution": "Adaptive Engineering",
                    "bio": "Signal processing development",
                    "position": "Owner",
                    "purpose": "Review of anatomical MRI data.",
                    "register": "2020-12-16T08:22:57.004Z"
                },
                {
                    "institution": "Krembil Centre for Neuroinformatics, University of Toronto",
                    "bio": "Working on neural field modelling of the human sleep data.",
                    "position": "Graduate Student",
                    "purpose": "Will use it to explore datasets for my MSc project, in addition to open-source projects in my spare time.",
                    "register": "2020-12-17T10:52:35.217Z"
                },
                {
                    "institution": "Emory University",
                    "bio": "Received PhD in Biology from Korea Advanced Institute of Science and Technology (South Korea)\nPostdoc in Biophyics/Microbiology at Physics Dept, Emory University,USA\nIBM - certified data scientist",
                    "position": "Postdoc",
                    "purpose": "Build machine learning models for pattern recognition in brain images",
                    "register": "2020-12-19T13:45:10.425Z"
                },
                {
                    "institution": "Springboard",
                    "bio": "Data science student focused on the use of statistics in research.",
                    "position": "Student",
                    "purpose": "Data science student looking for a dataset for my final image classifying project.",
                    "register": "2020-12-20T18:27:52.5Z"
                },
                {
                    "institution": "Padova Neuroscience Center, University of Padova, Padova, Italy",
                    "bio": "Interested in noninvasive brain stimulation techniques, personalized interventional approaches, multimodal neuroimaging and in the study of brain resilience!",
                    "position": "PhD student",
                    "purpose": "Facilitate communication between researchers",
                    "register": "2020-12-21T07:35:40.021Z"
                },
                {
                    "institution": "CIMeC - Center for Mind/Brain Sciences",
                    "bio": "I'm interested in brain waves recorded preferibly with MEG on the topic of auditory attention and conscious/unconscious information processing. I do my best to contribute to methodologies for Open Science and all things FLOSS (Heavy git user too).",
                    "position": "Before PhD Student, now guest associate",
                    "purpose": "Test the platform for MEEG data analysis.",
                    "register": "2020-12-21T18:07:06.846Z"
                },
                {
                    "institution": "Taipei Medical University",
                    "bio": "I am a Master's student at Taipei Medical University. My previous background is in Computer Engineering.",
                    "position": "Student",
                    "purpose": "I will use Brainlife for my projects in school.",
                    "register": "2020-12-22T04:18:48.377Z"
                },
                {
                    "institution": "Institute for Advanced Studies in Basic Sciences (IASBS)",
                    "bio": "PhD in computational neuroscience at IASBS, Iran",
                    "position": "Research assistant",
                    "purpose": "For now just be familiar with the service and see hiw I can use for my research, Maybe I also provide dome code to share.",
                    "register": "2020-12-22T07:44:06.405Z"
                },
                {
                    "institution": "New York University",
                    "bio": "Haiyang is a postdoctoral researcher in the lab. He studied his PhD at the University of Auckland, New Zealand. He is mainly interested in face processing and vision science. His projects investigate the role of experience in holistic processing of faces and non-face objects, and the relationship between subjective perception and the neural signatures of face processing (e.g., the N170 component, and activations in the face-specific cortical areas such as the FFA).",
                    "position": "Postdoctoral associate",
                    "purpose": "I would like to use brainlife to run fMRI analysis on the surface.",
                    "register": "2020-12-22T11:12:00.999Z"
                },
                {
                    "institution": "Osnabrueck University",
                    "bio": "Final year masters student in Cognitive Science",
                    "position": "Student",
                    "purpose": "Learning data visualization",
                    "register": "2020-12-22T18:42:52.288Z"
                },
                {
                    "institution": "Universitaet Osnabrueck",
                    "bio": "I am a philosopher and cognitive science master student exploring the human mind/brain.",
                    "position": "Master student",
                    "purpose": "I will be exploring some of the datasets provided on the website in order to further improve my understanding of the brain and to get more familiar with the analysis of neuroscientific data. I expect to be able to access, analyze, and process the data.",
                    "register": "2020-12-22T19:14:46.809Z"
                },
                {
                    "institution": "BNU",
                    "bio": "neuroscience",
                    "position": "china",
                    "purpose": "study",
                    "register": "2020-12-23T11:48:04.322Z"
                },
                {
                    "institution": "University of Sussex",
                    "bio": "Research Fellow, Psychology Department",
                    "position": "Research Fellow",
                    "purpose": "Learn what it is about. Use it to share data",
                    "register": "2020-12-23T16:38:49.848Z"
                },
                {
                    "institution": "University of Adelaide",
                    "bio": "I am a student",
                    "position": "student BA",
                    "purpose": "To learn",
                    "register": "2020-12-24T05:27:33.716Z"
                },
                {
                    "institution": "skoltech",
                    "bio": "I am data engineer, working with neuroimaging data, create data preprocess pipelines and so on",
                    "position": "research intern",
                    "purpose": "Just interest to test different preprocessing applications like freesurfer, on brainlife platform",
                    "register": "2020-12-24T08:28:44.123Z"
                },
                {
                    "institution": "TReNDS",
                    "bio": "Associate Directory of Innovation",
                    "position": "Associate Directory of Innovation",
                    "purpose": "Curious to see how platform works",
                    "register": "2020-12-24T13:07:28.808Z"
                },
                {
                    "institution": "FEEIT",
                    "bio": "I am a masters student doing a research in brain activity",
                    "position": "Researcher",
                    "purpose": "I would like to get access to databases and contribite with researc",
                    "register": "2020-12-24T23:34:53.897Z"
                },
                {
                    "institution": "Babes Bolyai University",
                    "bio": ": )",
                    "position": "Student",
                    "purpose": "I'd like to process neuroimaging data I am not able to with my current computational power.",
                    "register": "2020-12-25T04:18:16.384Z"
                },
                {
                    "institution": "Tsinghua University",
                    "bio": "Tsinghua University",
                    "position": "Ph.D. student",
                    "purpose": "Academic Use",
                    "register": "2020-12-25T08:32:15.39Z"
                },
                {
                    "institution": "SNUH",
                    "bio": "I am a research professor in Seoul National University Hospital.",
                    "position": "Research Professor",
                    "purpose": "I want to investigate brain network using resting state fMRI and PET in mouse.",
                    "register": "2020-12-26T13:26:58.486Z"
                },
                {
                    "institution": "University of Amsterdam",
                    "bio": "3rd year neuroscience student in Amsterdam",
                    "position": "Student",
                    "purpose": "I expect to use brainlife.io to run some data analysis for my bachelor thesis",
                    "register": "2021-01-02T13:15:56.937Z"
                },
                {
                    "institution": "Tata Memorial Hospital",
                    "bio": "Radiologist",
                    "position": "Assistant Professor",
                    "purpose": "research",
                    "register": "2021-01-03T20:22:33.869Z"
                },
                {
                    "institution": "Brain and Spine Institute",
                    "bio": "PhD in neuroscience",
                    "position": "Research Engineer",
                    "purpose": "Discover the data sets available, add some new data sets, and create Apps."
                },
                {
                    "institution": "Springer Nature",
                    "bio": "signing up to check the data are available",
                    "position": "data curator",
                    "purpose": "signing up to check the data are available",
                    "register": "2021-01-05T12:11:47.156Z"
                },
                {
                    "institution": "Beijing Institute of Technology",
                    "bio": "I am a undergraduate who major in computer science and want to use your laboratory data set to do graduation design",
                    "position": "student",
                    "purpose": "I am a undergraduate who major in computer science and want to use your laboratory data set to do graduation design",
                    "register": "2021-01-05T13:40:41.008Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Post doc interested in brainzzzz",
                    "position": "Post doctoral associate",
                    "purpose": "Trying to look at available tools.",
                    "register": "2021-01-06T13:56:50.651Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "asd",
                    "position": "postdoc",
                    "purpose": "asd",
                    "register": "2021-01-06T14:17:25.641Z"
                },
                {
                    "institution": "The National Institute of Engineering",
                    "bio": "Undergrad student in CSE, passionate about neuroscience",
                    "position": "student",
                    "purpose": "Trying to preprocess DWI",
                    "register": "2021-01-06T20:38:51.918Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Dr. Guiomar Niso research uses neuroimaging to study healthy and diseased brain states (e.g. epilepsy, Alzheimer’s disease, blindness). Dr. Niso has contributed to multiple open science initiatives: pioneering open data repositories (OMEGA), open software (Hermes, Brainstorm, Brainlife) and open standards (BIDS) to foster reproducibility and transparency in neuroscience. Currently, Dr. Niso chairs the BIDS Steering Group.",
                    "position": "Senior Researcher",
                    "purpose": "I would like to contribute to brainlife.io and implement MEEG tools.",
                    "register": "2021-01-07T17:46:00.42Z"
                },
                {
                    "institution": "UNIVERSITY OF PITTSBURGH AT PITTSBURGH",
                    "bio": "Hi! I love the brain. I love data.",
                    "position": "Assistant Professor",
                    "purpose": "I like to analyze brain data!",
                    "register": "2021-01-08T18:51:06.268Z"
                },
                {
                    "institution": "UPMC",
                    "bio": "Programmer for LNCD at UPMC.",
                    "position": "Data Analyst",
                    "purpose": "I'd like to explore brainlife.io to share data and processing pipelines for  projects related to adolescent development. I'm interested in both the convenience of cloud sharing and the improving local infrastructure.",
                    "register": "2021-01-08T19:05:51.463Z"
                },
                {
                    "institution": "Institute of Medical Science and Technology",
                    "bio": "Biomedical engineering student",
                    "position": "student",
                    "purpose": "Structural analysis",
                    "register": "2021-01-10T07:53:06.943Z"
                },
                {
                    "institution": "Yonsei University, Seoul, South Korea",
                    "bio": "I am a research analyst working at the MoNET laboratory @ Yonsei University.",
                    "position": "Research Analyst",
                    "purpose": "I am working on developing an automated fMRI preprocessing pipeline, I hope I can gain some insight from brainlife.io and leverage the apps/tools built here.",
                    "register": "2021-01-12T01:41:02.106Z"
                },
                {
                    "institution": "University of Delaware",
                    "bio": "I am a PhD student in the Department of Linguistics and Cognitive Science at the University of Delaware, where I work with Zhenghan Qi in the Language Acquisition and Brain Lab (QLab). My work is funded by the Unidel Distinguished Graduate Scholars Award. I am interested in the cognitive neuroscience of language, especially the association between individual differences in neural measures and behavior, as well how language is processed in the individual brain, and how this science can be used to help people. I use tools from computer science, statistics, and machine learning to investigate behavioral and neuroimaging data.",
                    "position": "PhD Student",
                    "purpose": "I plan to use Brainlife.io to conduct an analysis of diffusion tensor imaging data for a project involving language, music, and autism spectrum disorder.",
                    "register": "2021-01-12T13:53:07.113Z"
                },
                {
                    "institution": "Tehran university of medical sciences",
                    "bio": "M.D. & researcher",
                    "position": "Currently not employed",
                    "purpose": "To learn neuroimaging:))",
                    "register": "2021-01-12T21:06:43.94Z"
                },
                {
                    "institution": "UCLA",
                    "bio": "I am a research assistant at UCLA doing work under Jonathan Kao.",
                    "position": "Research Assistant",
                    "purpose": "I would like to better understand brainlife.",
                    "register": "2021-01-13T00:39:49.701Z"
                },
                {
                    "institution": "University of Wisconsin-Madison",
                    "bio": "d",
                    "position": "Postdoctoral Research Fellow",
                    "purpose": "Testing analytical pipelines.",
                    "register": "2021-01-13T21:05:08.611Z"
                },
                {
                    "institution": "University of Arkansas for Medical Sciences",
                    "bio": "Postdoc interested in  diffusion MRI research",
                    "position": "postdoc",
                    "purpose": "For diffusion MRI tractography and White matter bundle segmentation",
                    "register": "2021-01-14T02:43:28.964Z"
                },
                {
                    "institution": "Seoul National Univ / Statistics",
                    "bio": "I am a Ph.D student in Seoul National Univ in department of Statistics in Spatial Statistics Lab.",
                    "position": "Students",
                    "purpose": "To downloading fMRI datasets for further study",
                    "register": "2021-01-14T05:14:29.64Z"
                },
                {
                    "institution": "University College Cork",
                    "bio": "A medical student with an interest in artificial intelligence.",
                    "position": "Student",
                    "purpose": "My purpose is to build AI machines for medical research.",
                    "register": "2021-01-14T19:59:50.593Z"
                },
                {
                    "institution": "Fairfield University",
                    "bio": "Dr. Danushka Bandara received his Ph.D. in Electrical and Computer Engineering and M.S. in Computer Engineering from Syracuse University in 2018 and 2013, respectively, and B.S. in Electrical Engineering with honors from the University of Moratuwa in 2009. Prior to joining Fairfield University, he worked as a Data Scientist at Corning Incorporated. The focus of his PhD research was on the application of machine learning to brain activity data.",
                    "position": "Assistant Professor",
                    "purpose": "Explore the brain datasets available.",
                    "register": "2021-01-14T22:46:13.869Z"
                },
                {
                    "institution": "Uniklinik Leipzig, Germany",
                    "bio": "Medical Doctor\nResident, Department of Neurosurgery",
                    "position": "Resident",
                    "purpose": "Group analysis of patients with brain lesions, hydrocephalus or TBI. Network analysis speech and motor system.",
                    "register": "2021-01-15T07:16:09.005Z"
                },
                {
                    "institution": "Mondragon Uniberstitatea",
                    "bio": "I am a student in master of biomedical technologies",
                    "position": "Student",
                    "purpose": "For brain image pre-processing",
                    "register": "2021-01-15T14:06:18.363Z"
                },
                {
                    "institution": "mondragon unibertsitatea",
                    "bio": "My name is Maria and I am a biomedical engineer",
                    "position": "student",
                    "purpose": "I want brainlife to work with fmri data",
                    "register": "2021-01-15T15:55:00.78Z"
                },
                {
                    "institution": "Temple University",
                    "bio": "Researcher at Temple University",
                    "position": "Researcher",
                    "purpose": "Preprocessing",
                    "register": "2021-01-15T20:45:06.737Z"
                },
                {
                    "institution": "Haier",
                    "bio": "Electronics Eng.",
                    "position": "Engineer",
                    "purpose": "Research",
                    "register": "2021-01-16T14:49:38.979Z"
                },
                {
                    "institution": "ENS de Lyon",
                    "bio": "I am doing research on tractogram segmentation, and atlas transfer using geometric approaches.",
                    "position": "Postgraduate Student",
                    "purpose": "I would like to use Brainlife to understand better pipelines used in some papers, and be able to reproduce some of their results.",
                    "register": "2021-01-17T14:04:44.581Z"
                },
                {
                    "institution": "MAHE",
                    "bio": "Caffeine Dependent Life Form",
                    "position": "Independent researcher",
                    "purpose": "Research"
                },
                {
                    "institution": "Università di Pavia",
                    "bio": "Medical Doctor, graduated March 2020 at the University of Pavia, currently working as a psychiatry resident at the University of Florence",
                    "position": "Indipendent Researcher",
                    "purpose": "I would like to use brainlife.io to streamline my fMRI pipelines and share my results.",
                    "register": "2021-01-18T12:48:43.283Z"
                },
                {
                    "institution": "Stanford University",
                    "bio": "I am an MD and postdoctoral research at Stanford University interested in investigating circuit-based underpinnings of neuropsychiatric symptoms and conditions, as well as in defining brain targets for novel treatments.",
                    "position": "Postdoctoral Research Fellow",
                    "purpose": "I intend to use Brainlife to test hypothesis on large public datasets investigating circuit-based underpinnings of neuropsychiatric symptoms and conditions.",
                    "register": "2021-01-18T17:58:18.022Z"
                },
                {
                    "institution": "MDC Berlin",
                    "bio": "Ph.D. student",
                    "position": "Ph.D student",
                    "purpose": "Share and use fMRI repositories.",
                    "register": "2021-01-18T23:06:58.271Z"
                },
                {
                    "institution": "University of Zielona Góra",
                    "bio": "PHD in quantum physics.",
                    "position": "asistant",
                    "purpose": "Research about brain with use of maschine learning.",
                    "register": "2021-01-19T00:08:14.74Z"
                },
                {
                    "institution": "CMI",
                    "bio": "Math + CS background",
                    "position": "Research Scholar",
                    "purpose": "Understanding the inference pipeline for fMRI studies from a Bayesian viewpoint",
                    "register": "2021-01-19T15:28:05.274Z"
                },
                {
                    "institution": "Google",
                    "bio": "I am currently a software engineer at Google, Hyderabad. I just completed my masters in CS from Chennai Mathematical Institute, India. I am interested in cognitive neuroscience.",
                    "position": "Software Engineer",
                    "purpose": "I want to get a more in depth understanding of neuroscience apart from the pop sci account found in books. Also I feel that brainlife.io allows be to actively engage with the content compared to the books and helps me in understanding the paper.",
                    "register": "2021-01-19T15:36:06.137Z"
                },
                {
                    "institution": "Arizona State University",
                    "bio": "I am a grad student in computer science, interested in current neuroscience research.",
                    "position": "Student",
                    "purpose": "To try and understand current neuroscience research and to try and re-implement or validate existing research utilizing the datasets.",
                    "register": "2021-01-19T15:37:54.553Z"
                },
                {
                    "institution": "Lawrence Technological University",
                    "bio": "-",
                    "position": "Student",
                    "purpose": "-",
                    "register": "2021-01-19T20:15:05.766Z"
                },
                {
                    "institution": "Lawrence Technological University",
                    "bio": "Hello, I am Chantol Aspinall and a nursing major at LTU. This semester I am enrolled in the Behavioral Neuroscience course at my school.",
                    "position": "Student",
                    "purpose": "My Professor has encouraged us to sign up for this site as a learning tool for the class.",
                    "register": "2021-01-19T20:22:02.052Z"
                },
                {
                    "institution": "gatech",
                    "bio": "DL/ML",
                    "position": "GRA",
                    "purpose": "Deep Learning",
                    "register": "2021-01-19T22:11:32.546Z"
                },
                {
                    "institution": "Department of Biomedical Sciences, University of Sassari",
                    "bio": "Master Degree in Biology, Assistant Professor of Neuropharmacology, Head of the B.Sc Course in Psychology at the University of Sassari, Italy.",
                    "position": "Researcher",
                    "purpose": "At this very moment I'm just interested to explore how the Brainlife platform works, in order to understand if and how I can contribute to it and maybe use it in my courses.",
                    "register": "2021-01-20T11:58:30.688Z"
                },
                {
                    "institution": "Lawrence Technological University",
                    "bio": "Clinical Psychology major",
                    "position": "student",
                    "purpose": "for class",
                    "register": "2021-01-20T19:52:42.388Z"
                },
                {
                    "institution": "Lawrence Technological university",
                    "bio": "Computer Science student.",
                    "position": "Student",
                    "purpose": "For class.",
                    "register": "2021-01-20T19:58:38.836Z"
                },
                {
                    "institution": "University of Montreal",
                    "bio": "PhD student in psychology",
                    "position": "PhD Student",
                    "purpose": "Interested in some datasets hosted on brainlife and in trying out brainlife.",
                    "register": "2021-01-21T13:03:46.2Z"
                },
                {
                    "institution": "Lawrence Technological University",
                    "bio": "Clinical Psychology Student at LTU",
                    "position": "student",
                    "purpose": "Use it for my class",
                    "register": "2021-01-21T16:52:01.966Z"
                },
                {
                    "institution": "Lawrence Tech University",
                    "bio": "LTU Student",
                    "position": "Student",
                    "purpose": "Behavioral Neuroscience class",
                    "register": "2021-01-21T17:05:56.247Z"
                },
                {
                    "institution": "Lawrence Technological University",
                    "bio": "I am a 3rd year Clinical Psychology major using this platform as a part of my Behavioral Neuroscience course.",
                    "position": "I am a Student",
                    "purpose": "I would like to use Brainlife to record and analyze data as it relates to neuroscience.",
                    "register": "2021-01-21T18:36:35.826Z"
                },
                {
                    "institution": "Center for Translational Neuromedicine",
                    "bio": "Neuroscientist with interest in motor control and effects of exercise",
                    "position": "Researcher",
                    "purpose": "Experiments - visualization",
                    "register": "2021-01-22T12:50:58.785Z"
                },
                {
                    "institution": "University of California, Santa Cruz",
                    "bio": "I'm a 3rd year PhD student in computer science with a focus on biomedical applications of deep learning.",
                    "position": "graduate student researcher",
                    "purpose": "I hope to test novel machine learning approaches to EEG analysis.",
                    "register": "2021-01-25T00:48:27.294Z"
                },
                {
                    "institution": "taiyuan university of technology",
                    "bio": "i am a student,now my reseach is brain",
                    "position": "shanxi",
                    "purpose": "study",
                    "register": "2021-01-25T02:31:30.014Z"
                },
                {
                    "institution": "Charite",
                    "bio": ".",
                    "position": "Student",
                    "purpose": "look at available data",
                    "register": "2021-01-25T13:54:50.242Z"
                },
                {
                    "institution": "TUMS",
                    "bio": "biomedical engineering and AI developer in the field oh healthcare.",
                    "position": "researcher",
                    "purpose": "accessing data sets.",
                    "register": "2021-01-25T19:12:21.853Z"
                },
                {
                    "institution": "Johns Hopkins University",
                    "bio": "Graduate student working on large multi-center datasets.",
                    "position": "Graduate Student",
                    "purpose": "Investigating large platforms for running neuroimaging data.",
                    "register": "2021-01-25T20:03:22.153Z"
                },
                {
                    "institution": "Kasr Alainy school of Medicine, Cairo University, EGypt",
                    "bio": "Dr.Ali is an assistant lecturer and PhD student of diagnostic neuroradiology at Cairo university, Egypt. She has a MSc degree in diagnostic radiology and a MBBCh degree from Cairo university, Egypt. She is also near obtaining her MBA in health care management degree  from Brooklyn business school, New york, USA. Dr.Ali embraces the translational research in neuroscience as a robust solution o revolutionize the current clinical practice in managing various neurological and psycho-cognitive disease conditions.",
                    "position": "assistant lecturer of diagnostic neuroradiology",
                    "purpose": "I intend to use the platform as an fMRI analysis tool in my PhD thesis.",
                    "register": "2021-01-25T20:55:24.83Z"
                },
                {
                    "institution": "UCL",
                    "bio": "Neurosurgery / Neuroimaging",
                    "position": "PhD student",
                    "purpose": "To convert .tck to .trk",
                    "register": "2021-01-26T10:37:39.822Z"
                },
                {
                    "institution": "Lawrence Tech University",
                    "bio": "I am a student from Lawrence tech University and is taking the class Behavioral Neuroscience",
                    "position": "I am the student",
                    "purpose": "I will use it as learning reference for my class",
                    "register": "2021-01-26T19:46:02.034Z"
                },
                {
                    "institution": "Montreal Neurological Institute",
                    "bio": "PhD candidate at the Montreal Neurological Institute (McGill University) using SEEG and Tractography to develop patient-specific epilepsy networks to be used for surgical planning.",
                    "position": "PhD Candidate",
                    "purpose": "Using it for a converter tool (tck->trk).",
                    "register": "2021-01-27T03:06:21.334Z"
                },
                {
                    "institution": "Mondragon Unibertsitatea",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "MRI pre-processing",
                    "register": "2021-01-27T07:32:10.947Z"
                },
                {
                    "institution": "mondragon",
                    "bio": "An university",
                    "position": "student",
                    "purpose": "I would like to proccess MRI images"
                },
                {
                    "institution": "x",
                    "bio": "x",
                    "position": "x",
                    "purpose": "x"
                },
                {
                    "institution": "University of Tübingen",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "Student",
                    "register": "2021-01-30T13:37:37.342Z"
                },
                {
                    "institution": "University of Geneva Neurology & Imaging of Cognition Lab",
                    "bio": "I previously worked on the effect of noradrenaline on attention network in nonhuman primates. I recently joined the Patrik Vuilleumier’s team to explore the Pulvinar role in attention processes. My research is carried out in healthy subjects and in brain-damaged patients, using behavioral measures and neuroimaging methodology (fMRI).",
                    "position": "postdoctoral researcher",
                    "purpose": "I am curious about the content of the platform. I hope to find help for my analysis and potentially contribute to it in the future.",
                    "register": "2021-01-31T13:54:15.283Z"
                },
                {
                    "institution": "Donders Institute for Brain, Cognition, and Behaviour",
                    "bio": "NA",
                    "position": "Ph.D. student",
                    "purpose": "sign up for the dataset of Narratives",
                    "register": "2021-02-01T15:58:23.932Z"
                },
                {
                    "institution": "IIT/UniTN",
                    "bio": "PhD sudent interested in connectomics",
                    "position": "PhD student",
                    "purpose": "tractography visualization",
                    "register": "2021-02-01T20:23:22.07Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Freshman double majoring in Biochemistry and Neuroscience.",
                    "position": "Student researcher",
                    "purpose": "Record Neurological databases for White matter and Learning Research.",
                    "register": "2021-02-02T02:02:31.006Z"
                },
                {
                    "institution": "University of California, Berkeley",
                    "bio": "Why and how do brains do what they do?",
                    "position": "PhD student",
                    "purpose": "Primarily as a resource to find preprocessed data and derivatives, but may eventually play with running things here as well.",
                    "register": "2021-02-02T10:08:29.011Z"
                },
                {
                    "institution": "Epilepsy Center Brelin-Brandenburg",
                    "bio": ".",
                    "position": "Neuropsychologist",
                    "purpose": ".",
                    "register": "2021-02-03T15:37:47.874Z"
                },
                {
                    "institution": "Nicolaus Copernicus University",
                    "bio": "i'm cognitive science student",
                    "position": "Msc student",
                    "purpose": "i want to analyze the available neuroimaging data",
                    "register": "2021-02-03T20:37:49.138Z"
                },
                {
                    "institution": "CUNY Hunter College",
                    "bio": "IA",
                    "position": "Student",
                    "purpose": "Research",
                    "register": "2021-02-04T23:29:07.895Z"
                },
                {
                    "institution": "AVO",
                    "bio": "B.S. Chemical Engineer + MBA Global Management/Marketing\nEquipment applications engineer to technical consulting to corporate marketing to marketing strategy based on neuroscience and behavioral economics.",
                    "position": "Strategy Lead",
                    "purpose": "I'd like to better understand neuroscience data and how to consume it for the purposes of creating making a positive impact on the world.",
                    "register": "2021-02-05T18:41:05.497Z"
                },
                {
                    "institution": "HMC",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "Dataset access for ML",
                    "register": "2021-02-07T14:09:36.311Z"
                },
                {
                    "institution": "Colby College",
                    "bio": "I am an Assistant Professor of Psychology. I study the cognitive neuroscience of human navigation and memory using fMRI, EEG, VR, and real-world behavioral tasks. I teach courses in cognitive and behavioral neuroscience.",
                    "position": "Assistant Professor",
                    "purpose": "I plan to use brainlife.io in both my teaching and research. I will be teaching students how to analyze fMRI data and I am interested in exploring whether brainlife.io can simplify the preprocessing steps.",
                    "register": "2021-02-07T19:26:08.485Z"
                },
                {
                    "institution": "University of Groningen",
                    "bio": "I am a student of the MSc. Behavioural and Cognitive Neurosciences at the University of Groningen.",
                    "position": "Student",
                    "purpose": "I would like to use brainlife.io to do research for a thesis project of my MSc. degree program.",
                    "register": "2021-02-08T10:28:27.49Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Hello, I am a neuroscience and psychology major working in the Pestilli Lab under Sophia Vinci-Booher.",
                    "position": "Intern",
                    "purpose": "I am helping to create a child-friendly visual field task for use by the Lab",
                    "register": "2021-02-08T20:23:38.239Z"
                },
                {
                    "institution": "U of Manitoba",
                    "bio": "I am a second year medical student doing research at the U of Manitoba.",
                    "position": "Student reasercher",
                    "purpose": "I would like to use this program to run basic measurements on MRI.",
                    "register": "2021-02-08T21:52:11.208Z"
                },
                {
                    "institution": "Universiti Sains Malaysia",
                    "bio": "MSc Cognitive Neuroscience student",
                    "position": "student",
                    "purpose": "Finding datasets for Convoluted Neural Network modeling",
                    "register": "2021-02-10T04:18:59.335Z"
                },
                {
                    "institution": "University of the Cumberlands",
                    "bio": "I am a 3rd year PA student nearing graduation at the University of the Cumberlands.",
                    "position": "Studen",
                    "purpose": "I am working on a graduate research project that I need to present before graduation.",
                    "register": "2021-02-10T19:02:59.385Z"
                },
                {
                    "institution": "ISI-Kolkata",
                    "bio": "I am From India(Kolkata). I am pursuing my Phd from ISI-Kolkata",
                    "position": "Phd",
                    "purpose": "I am doing my Phd on brain networks. That is why I need to use/analyze various data and program.",
                    "register": "2021-02-11T14:25:09.271Z"
                },
                {
                    "institution": "University of California, San Diego",
                    "bio": "I am software engineer at the San Diego Supercomputer Center at UCSD. I am helping with development of a neuroscience gateway",
                    "position": "Systems Engineer",
                    "purpose": "I'm interested in see how brainlife work because I am developing a similar website for software dissemination for our neuroscience gatway",
                    "register": "2021-02-11T17:50:32.023Z"
                },
                {
                    "institution": "CMU",
                    "bio": "A student working in CMU",
                    "position": "Research assistant",
                    "purpose": "I would like to use brainlife to analyze the data before deciding to use some datasets for our research project.",
                    "register": "2021-02-11T22:47:23.225Z"
                },
                {
                    "institution": "Uni of Sheffield",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "Study task",
                    "register": "2021-02-12T10:40:41.941Z"
                },
                {
                    "institution": "RMIT University",
                    "bio": "Tabinda Sarwar is a Research Fellow in the Department of Computer Science and Software Engineering at RMIT University, Melbourne, Australia. She received her Ph.D. degree from the University of Melbourne. Previously, she was a lecturer at the COMSATS University, Pakistan. Her research interest includes machine learning, deep learning and neuroscience",
                    "position": "Research Fellow",
                    "purpose": "Intend to use brainlife.io for research purposes",
                    "register": "2021-02-13T11:35:47.903Z"
                },
                {
                    "institution": "Tehran University of Medical Scinces",
                    "bio": "M.D. B.Sc \nworking on deep learning and computer vision",
                    "position": "Researcher",
                    "purpose": "I want to use this website for preprocessing of Brain MRI data",
                    "register": "2021-02-14T12:11:59.73Z"
                },
                {
                    "institution": "Université de Strasbourg",
                    "bio": "Neurology resident.",
                    "position": "Student",
                    "purpose": "Exploring ideas",
                    "register": "2021-02-14T15:22:13.358Z"
                },
                {
                    "institution": "Institute of Space Technology",
                    "bio": "I am a student enrolled in a masters programs currently. My major is in signals and image processing and I am interested in working neuroscience for my thesis.",
                    "position": "Student",
                    "purpose": "I want to analyze datasets and check how they are informative for me.",
                    "register": "2021-02-15T18:28:57.801Z"
                },
                {
                    "institution": "University of Oxford",
                    "bio": "Neuroscientist",
                    "position": "Lecturer",
                    "purpose": "Teaching",
                    "register": "2021-02-17T21:00:22.615Z"
                },
                {
                    "institution": "MPI for Human Development",
                    "bio": "Handles a lot of computers.",
                    "position": "Scientific Programmer and IT",
                    "purpose": "Harmonize or migrate legacy computing workflows with the open science ecosystem.",
                    "register": "2021-02-18T14:34:39.016Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "Neuroscience student at Brigham Young University participating in research done in the Memory and Learning Lab.",
                    "position": "Research Assistant",
                    "purpose": "Learning how to conduct data analysis",
                    "register": "2021-02-18T17:13:31.414Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "Just a biology major in a neuroscience world",
                    "position": "student",
                    "purpose": "to be able to see and process image data for Kirwan Neuroscience lab",
                    "register": "2021-02-18T17:18:11.475Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "Neuroscience major at BYU. Research assistant for the Memory and Decision Making lab at BYU.",
                    "position": "Research Assistant",
                    "purpose": "Just recently introduced, my PI wants to get the research assistants prepared for things like pre-processing",
                    "register": "2021-02-18T17:20:49.516Z"
                },
                {
                    "institution": "Brigham Young University: Memory and Decision Making Lab",
                    "bio": "-Second-year Neuroscience student at BYU\n-Originally from San Diego, CA\n-Planning on going to Med School",
                    "position": "Research Assistant",
                    "purpose": "Data analysis for research",
                    "register": "2021-02-18T17:20:49.67Z"
                },
                {
                    "institution": "Brigham Young University / Kirwan Memory & Decision making lab",
                    "bio": "I'm a student at BYU working as a Research Assistant. I study psychology and am hoping to go to grad school to obtain a PhD",
                    "position": "Research Assistant",
                    "purpose": "We will be doing preprocessing and processing of MRI and behavioral data for experiments run with the Kirwan Memory Lab at BYU",
                    "register": "2021-02-18T17:21:28.291Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am a senior undergraduate research assistant working at the MRI research facility of Brigham Young University. I am a psychology major with a business minor.",
                    "position": "Research Assistant",
                    "purpose": "I would like to use Brain Life to pre-process and interpret fMRI data. I'd also like to use this platform to connect with more neuroimaging research personnel and find a community of like-minded scientists.",
                    "register": "2021-02-18T17:22:33.214Z"
                },
                {
                    "institution": "UCSF",
                    "bio": "I am a Postdoc in the Department of Radiology and Biomedical Imaging at UCSF.",
                    "position": "Postdoc",
                    "purpose": "I would like to make the most of this platform to train myself in processing brain imaging data",
                    "register": "2021-02-19T19:28:41.079Z"
                },
                {
                    "institution": "Johns Hopkins University",
                    "bio": "graduate student",
                    "position": "research assistant",
                    "purpose": "...",
                    "register": "2021-02-19T19:28:43.546Z"
                },
                {
                    "institution": "JHU",
                    "bio": "Graduate student",
                    "position": "RA",
                    "purpose": "n/a",
                    "register": "2021-02-19T19:59:34.288Z"
                },
                {
                    "institution": "Sathyabama Institute of Science and Technology",
                    "bio": "Associate Prof\nECE",
                    "position": "Associate Professor",
                    "purpose": "to analyse Parkinson's EEG",
                    "register": "2021-02-20T05:21:12.326Z"
                },
                {
                    "institution": "Stanford OHS",
                    "bio": "Siddhant Karmali, a sophomore at the Stanford University Online High School, has won awards for work on projects in biomimetics and biophysics involving how a biologically inspired machine can follow a route. He has also won fourth place at the regional Brain Bee competition in 2020. He is currently on a water polo team and has won a silver medal at the Junior Olympics during the 2019 season.",
                    "position": "Student",
                    "purpose": "I plan to use the data given in OpenFMRI to use as data to train and test data science algorithms (like neural networks). I will also use the data on OpenFMRI in projects I will do.",
                    "register": "2021-02-20T20:04:55.532Z"
                },
                {
                    "institution": "University of Basel",
                    "bio": "I am a postdoctoral researcher at the Center for Cognitive and Decision Sciences, University of Basel. My work focuses on the neural underpinnings of individual differences in risk preferences.",
                    "position": "Postdoctoral researcher",
                    "purpose": "I am working with diffusion-weighted imaging data (N=125) from a study examining the biological (neural, genetic, hormonal) underpinnings of individual differences in risk preference. The aim is to use brainlife for dwi data processing and tractography.",
                    "register": "2021-02-21T09:09:48.602Z"
                },
                {
                    "institution": "Queen's University",
                    "bio": "Life Sciences student specialized in neuroscience.",
                    "position": "Student",
                    "purpose": "General interest and learning.",
                    "register": "2021-02-22T20:10:03.047Z"
                },
                {
                    "institution": "UT Austin",
                    "bio": "Interested in organization and dynamic interaction amongst functional brain networks in healthy and clinical populations.",
                    "position": "Research Assistant Professor",
                    "purpose": "interested in processing fMRI data",
                    "register": "2021-02-22T22:03:57.793Z"
                },
                {
                    "institution": "university of manitoba",
                    "bio": "Psychology Student.",
                    "position": "student",
                    "purpose": "Visualization Course data.",
                    "register": "2021-02-23T02:48:06.749Z"
                },
                {
                    "institution": "MSc student",
                    "bio": "aspiring to be data scientist",
                    "position": "statistical analyst",
                    "purpose": "I want to have a carrier change into computational neuroscience. So would like to set a profile here and do small projects with the datasets or so.",
                    "register": "2021-02-23T03:35:38.54Z"
                },
                {
                    "institution": "UNSW",
                    "bio": "PhD Student",
                    "position": "PhD Student",
                    "purpose": "Run models",
                    "register": "2021-02-23T04:35:13.036Z"
                },
                {
                    "institution": "University of Chinese Academy of Sciences",
                    "bio": "MEEG Data analysis",
                    "position": "student",
                    "purpose": "MEEG Data analysis",
                    "register": "2021-02-24T02:10:50.897Z"
                },
                {
                    "institution": "Beijing Jiaotong University",
                    "bio": "My major is statistics, and i'm current working on multimodal neuroimage analysis via deep learning et al.",
                    "position": "Lecturer",
                    "purpose": "Multimodal neuroimage analysis",
                    "register": "2021-02-24T02:27:29.873Z"
                },
                {
                    "institution": "KAIST",
                    "bio": "--",
                    "position": "Student",
                    "purpose": "--",
                    "register": "2021-02-24T10:47:41.671Z"
                },
                {
                    "institution": "Brigham Young University Kirwan Memory and Decision Making Lab",
                    "bio": "Research Assistant for Dr. Kirwan's Memory and Decision Making Lab",
                    "position": "Research Assistant",
                    "purpose": "To processes fMRI scan data.",
                    "register": "2021-02-24T17:10:03.089Z"
                },
                {
                    "institution": "Universidad Veracruzana",
                    "bio": "Estudent",
                    "position": "Estudent",
                    "purpose": "Donwnload a dataset",
                    "register": "2021-02-24T22:25:04.596Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am a postdoctoral associate at Indiana University interested in studying brain networks.",
                    "position": "Postdoctoral Associate",
                    "purpose": "Interested in submitting network neuroscience tools to brainlife as apps",
                    "register": "2021-02-25T03:58:13.209Z"
                },
                {
                    "institution": "Western University",
                    "bio": "MSc student studying the neural basis of misophonia",
                    "position": "Graduate Student",
                    "purpose": "Aid in data visualization",
                    "register": "2021-02-25T16:14:53.386Z"
                },
                {
                    "institution": "CU Anschutz Medical Campus",
                    "bio": "Cognitive neuroscientist interested in utilizing biotechnology to optimize quality of life for people with neurocognitive impairments.",
                    "position": "Research Associate",
                    "purpose": "To use for processing MR and CT data in sEEG cases.",
                    "register": "2021-02-25T19:09:39.121Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am an undergraduate student completing fMRI research at BYU in the Kirwan lab.",
                    "position": "Researcher",
                    "purpose": "I would like to use brain life to better analyze the fMRI data collected from participants.",
                    "register": "2021-02-25T19:32:26.078Z"
                },
                {
                    "institution": "UFABC",
                    "bio": "Studente",
                    "position": "Studente",
                    "purpose": "Make an research",
                    "register": "2021-02-28T19:04:46.171Z"
                },
                {
                    "institution": "USTC",
                    "bio": "Student",
                    "position": "student",
                    "purpose": "learn",
                    "register": "2021-03-01T05:53:09.814Z"
                },
                {
                    "institution": "Indian Institute of Information Technology Kottayam",
                    "bio": "PhD scholar in ECE Dept.",
                    "position": "PhD scholar",
                    "purpose": "To explore the analysis of EEG signal",
                    "register": "2021-03-01T07:52:42.846Z"
                },
                {
                    "institution": "Chandigarh University",
                    "bio": "Research scholar",
                    "position": "Reseracher",
                    "purpose": "Play with datset",
                    "register": "2021-03-01T13:31:13.165Z"
                },
                {
                    "institution": "UT Dallas / Brain Performance Institute",
                    "bio": "Researcher & Study Participant",
                    "position": "Researcher",
                    "purpose": "Data Analysis",
                    "register": "2021-03-01T22:45:26.937Z"
                },
                {
                    "institution": "Bio-X institute, shanghai jiaotong university",
                    "bio": "My research field is neuroscience and I am interested in brain network, machine learning or other modal brain image data processing.",
                    "position": "doctor",
                    "purpose": "I want to do preliminary data processing exercises through this database.",
                    "register": "2021-03-02T09:18:38.957Z"
                },
                {
                    "institution": "Chalmers University",
                    "bio": "An interesting college student",
                    "position": "Student",
                    "purpose": "To learn more about computer science and neuroscience.",
                    "register": "2021-03-02T11:06:19.713Z"
                },
                {
                    "institution": "Instituto de Neurobiologia, Universidad Nacional Autonoma de Mexico",
                    "bio": "Assistant Professor in Neurobiology working in substance use disorders.",
                    "position": "Assistant Professor",
                    "purpose": "Research",
                    "register": "2021-03-02T22:24:53.49Z"
                },
                {
                    "institution": "Northwestern University",
                    "bio": "I am an undergraduate research assistant that is interested in exploring the field of neuroscience and neuroimaging by bringing in aspects of computer science",
                    "position": "Collaborator",
                    "purpose": "Explore DTI scans",
                    "register": "2021-03-03T02:29:52.889Z"
                },
                {
                    "institution": "Technische Universiät Berlin",
                    "bio": "research in using artifical intelligence to analyze fMRI data",
                    "position": "student",
                    "purpose": "research in using artifical intelligence to analyze fMRI data. Get an idea of how frmi data looks like",
                    "register": "2021-03-03T18:12:01.777Z"
                },
                {
                    "institution": "Padova Neuroscience Center (PNC)",
                    "bio": "Administering computing resources since 2003",
                    "position": "System Administrator",
                    "purpose": "I understand the big picture: decouple the technical nuances of using a computing cluster to allow researchers to just focus on the  tools. Very smart move!",
                    "register": "2021-03-04T07:51:45.849Z"
                },
                {
                    "institution": "UVA",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "I will be using this software for general imaging research for my MRI Brain Mapping class.",
                    "register": "2021-03-04T15:48:13.641Z"
                },
                {
                    "institution": "NHRC",
                    "bio": "A system and computational neuroscientist.",
                    "position": "Senior Neuroscientist",
                    "purpose": "A reliable and efficient cloud platform that will serve the purpose of streaming line the entire process of analyzing large EEG dataset.",
                    "register": "2021-03-04T16:31:39.291Z"
                },
                {
                    "institution": "Tehran University of Medical Sciences",
                    "bio": "I was born in 1980 in Iran. I am currently a doctoral student at Tehran University of Medical Sciences. I am in the pre-defense stage of my dissertation entitled \" \" The main idea of ​​my dissertation is to identify the main propagation pathways in the brain fibers so that we can correctly identify the different positions of these fibers. My main idea in the PhD project is to use local phase techniques and local directions in different directions of diffusion imaging and applying Q-ball imaging on masked images by local phase features to find ODF and corrected tracts. we evaluated our research work at phantom which we considered complicated tracts.\nIn addition, I completed two master's degrees in medical engineering and control engineering at the same time.\nI have also been working for 5 years in an ophthalmology hospital in Tehran and for 2 years in an ophthalmology research center under the supervision of Shahid Beheshti University of Medical Sciences.",
                    "position": "PhD Candidate",
                    "purpose": "Tractography\nDTI modeling\nFinding the trajectory of diseases such as Alzheimer's\nBrain fibers modeling",
                    "register": "2021-03-05T07:10:06.625Z"
                },
                {
                    "institution": "Max Planck Institute for Human Cognitive and Brain Sciences",
                    "bio": "I am a training neuroscientist with an interest in social cognition plasticity, development and pathology, and the possibility of state-of-the-art technology (virtual reality, deep learning, social robots) to expand our knowledge on and enhance our social cognitive processes.",
                    "position": "PhD candidate",
                    "purpose": "I intend to use brainlife.io as a means of communicating my findings with the rest of the scientific community, and enhancing my own research by browsing a variety of datasets and analysis tools under the open science framework.",
                    "register": "2021-03-05T11:14:50.18Z"
                },
                {
                    "institution": "Institut du Cerveau et de la Moelle Epinière",
                    "bio": "Internship.\nEngineering student from Sup'biotech Paris, e-health major at ESME. Developping a new brain multilayer networks technic :) ",
                    "position": "Internship",
                    "purpose": "I'll be working on multilayer brain networks applied to some neurodegenerative pathologies.",
                    "register": "2021-03-05T15:27:55.348Z"
                },
                {
                    "institution": "The University of Texas at Austin",
                    "bio": "I am a Ph.D. student in Health Behavior and Health Education at UT-Austin, my research interests focus on how exercise affects cognitive function and human brain.",
                    "position": "Ph.D. student",
                    "purpose": "Educational purposes.",
                    "register": "2021-03-07T00:34:38.639Z"
                },
                {
                    "institution": "Lakehead University",
                    "bio": "MSc Computer Science student",
                    "position": "MSc Computer Science student",
                    "purpose": "MSc project",
                    "register": "2021-03-07T18:45:40.432Z"
                },
                {
                    "institution": "UCLouvain",
                    "bio": "Doctoral Researcher interested in investigating motion and brain plasticity",
                    "position": "PhD Researcher",
                    "purpose": "Collaborate with the community in scientific projects, analyses and ideas.",
                    "register": "2021-03-07T22:10:35.693Z"
                },
                {
                    "institution": "San Diego",
                    "bio": "I am studying",
                    "position": "employee",
                    "purpose": "to analyze data",
                    "register": "2021-03-08T00:59:20.357Z"
                },
                {
                    "institution": "UNC-CH",
                    "bio": "Graduate student",
                    "position": "Graduate student",
                    "purpose": "To analyze neuro datasets without having to download them to my puny lil computer :)",
                    "register": "2021-03-08T20:27:38.612Z"
                },
                {
                    "institution": "BCH",
                    "bio": "research fellow",
                    "position": "research fellow",
                    "purpose": "convert files",
                    "register": "2021-03-08T21:59:18.678Z"
                },
                {
                    "institution": "University of Padova",
                    "bio": "I am a master degree student of the course \"Neuroscience and neuropsychological rehabilitation\" of the University of Padova. I would like to analyze some public dataset in order to write my thesis.",
                    "position": "Student",
                    "purpose": "I would like to use these dataset in order to analyze them for research purpose as a student.",
                    "register": "2021-03-09T17:23:16.392Z"
                },
                {
                    "institution": "Brigham Young University",
                    "bio": "I am Professor Emeritus of the Department of Communication Disorders and Neuroscience.  My research interests are in the use of ERPs and fMRI in exploring hearing, language, and brain function.",
                    "position": "Professor Emeritus",
                    "purpose": "To assist in the analysis of MRI and fMRI data sets.",
                    "register": "2021-03-09T22:22:45.021Z"
                },
                {
                    "institution": "Intelligent Sensitive Interaction LAB",
                    "bio": "Interested in exploring the relationship between brain and EEG signals.",
                    "position": "student",
                    "purpose": "Acquire the necessary brain-related dataset",
                    "register": "2021-03-10T14:03:17.866Z"
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "PhD student interested in the computational neuroscience of word production.",
                    "position": "Student",
                    "purpose": "I am hoping to use this platform for learning purposes",
                    "register": "2021-03-11T20:44:17.802Z"
                },
                {
                    "institution": "SUPCOM",
                    "bio": "ICT engineering student",
                    "position": "research assistant",
                    "purpose": "Make a great analysis of neuroimaging data",
                    "register": "2021-03-12T09:28:18.561Z"
                },
                {
                    "institution": "City University of Hong Kong",
                    "bio": "Abdelrahman B. M. Eldaly received his B.Sc. and M.Sc. degrees in Electrical Engineering from Minia University, Minia, Egypt in 2012 and 2017, respectively. He is currently pursuing his Ph.D. degree in Electrical Engineering at City University of Hong Kong, Hong Kong SAR.\nHe was awarded the top student in the Electrical Engineering Department and Faculty of Engineering, Minia University in 2012. In the same year, he joined the same department as a Teaching Assistant, where since 2017 he has been an Assistant Lecturer. His research interests include digital signal processing and machine learning.",
                    "position": "Ph.D. Student",
                    "purpose": "For scientific research purpose",
                    "register": "2021-03-12T09:33:47.584Z"
                },
                {
                    "institution": "UMCU",
                    "bio": "I'm studying Psychobiology at the University of Amsterdam and doing a research internship on the neonatology department of UMCU.",
                    "position": "Research Intern",
                    "purpose": "I would like to use a sample of MRI's to learn how to work with FSL",
                    "register": "2021-03-12T12:24:20.898Z"
                },
                {
                    "institution": "McGill University",
                    "bio": "Director, Operations and Development, at the McGill Centre for Integrative Neuroscience.",
                    "position": "Director, Operations and Development, MCIN",
                    "purpose": "To see how the platform supports data processing for neuroinformatics users.",
                    "register": "2021-03-12T21:34:28.535Z"
                },
                {
                    "institution": "Evangelisches Krankenhaus Oldenburg",
                    "bio": "clinical radiologist with scientific interest in neuroimaging data analysis",
                    "position": "Oberarzt",
                    "purpose": "introduction of students to open neuroscience principles",
                    "register": "2021-03-15T13:20:53.218Z"
                },
                {
                    "institution": "University of Southampton",
                    "bio": "I am a neuroimaging research fellow at Southampton General Hospital. I received PhD in Biomedical Engineering at Purdue University in August 2020.",
                    "position": "Research Fellow in Advanced Neuroimaging",
                    "purpose": "Contribute to the development of open-source neuroimaging research projects.",
                    "register": "2021-03-15T14:14:26.025Z"
                },
                {
                    "institution": "University of Pittsburgh",
                    "bio": "I'm a Clinical-Developmental Psychology Graduate Student at  Pitt.",
                    "position": "Graduate Student",
                    "purpose": "I'd like to use this platform for neuroimaging analysis. My lab (led by Professor Jamie Hanson, PhD) processes data on this platform from a variety of datasets.",
                    "register": "2021-03-15T19:16:31.626Z"
                },
                {
                    "institution": "University of São Paulo",
                    "bio": "Graduated in Biomolecular Physics at Universidade de São Paulo (2013) and Master's in Physic at the same institution (2016). Nowadays, is a doctoral student in neuroradiology, acting on the following subjects: fmri, 7T.",
                    "position": "Doctoral student",
                    "purpose": "I want to process my data from home (they are very big, and my notebook cannot support it). Here in Brazil, the pandemic is just getting started.\nSo, it will be very interesting for my group to get some help to process this data on the cloud.\nAnd, of course, I get super excited about this project, knowing people and collaborating, that's what science is about.",
                    "register": "2021-03-16T19:30:16.851Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "I am a third year graduate student in the doctoral program in clinical psychology at UT Austin. I am interested in sleep, aging, and memory.",
                    "position": "Graduate Student",
                    "purpose": "I am hoping to use this platform to assist with analysis of structural and functional neuroimaging data collected as part of a NIH NIA grant.",
                    "register": "2021-03-17T00:15:45.98Z"
                },
                {
                    "institution": "aston",
                    "bio": "neuroscience",
                    "position": "student",
                    "purpose": "To develop further knowledge about brain imaging.",
                    "register": "2021-03-18T00:55:57.674Z"
                },
                {
                    "institution": "Vanderbilt University",
                    "bio": "Ph.D. Candidate in Clinical Psychology",
                    "position": "Graduate Student",
                    "purpose": "Analyze fMRI data",
                    "register": "2021-03-18T22:56:17.57Z"
                },
                {
                    "institution": "UNAM / Unit for Stereotaxic and Functional Neurosurgery at General Hospital of Mexico",
                    "bio": "Physician and surgeon from the Autonomous University of Guadalajara, Professor of Subject “A” in the Faculty of Sciences of the UNAM, Neuroscience-Biomedical Sciences PhD Candidate at the Faculty of Medicine of the UNAM and of the General Hospital of Mexico “Dr. Eduardo Liceaga ”. Graduate student affiliated with the Center for Complexity Sciences of the UNAM, graduate student of the Functional Neurosurgery Unit of the Hospital General de México “Dr. Eduardo Liceaga ”, is a researcher in the bipolar spectrum group of the Hospital de Especialidades Centro Médico Nacional IMSS S.XXI UMAE, currently he is secretary of national projects of the American Association of Neurosurgery (AANS) student chapters of the University of Guadalajara.",
                    "position": "PhD candidate",
                    "purpose": "To colaborate with neuroimaging leading research groups.",
                    "register": "2021-03-19T19:25:32.744Z"
                },
                {
                    "institution": "De Montfort University",
                    "bio": "Interested in Responsible Governance of Neuroscience Research Data",
                    "position": "Research Fellow",
                    "purpose": "To access and use brain data",
                    "register": "2021-03-22T09:44:33.843Z"
                },
                {
                    "institution": "University of Bergen",
                    "bio": "Norwegian studying Behavioral Neuroscience at University of Bergen",
                    "position": "Student",
                    "purpose": "Currently working on my master's project, and I'm looking for tools that can be useful for structuring, processing, and analyzing my data.",
                    "register": "2021-03-22T12:31:37.653Z"
                },
                {
                    "institution": "Dassault Systèmes",
                    "bio": "I am a research engineer working on tractography",
                    "position": "Research Engineer",
                    "purpose": "I would like to use brainlife.io in order to be able to work with the Classyfiber app",
                    "register": "2021-03-23T13:24:51.442Z"
                },
                {
                    "institution": "taibah",
                    "bio": "i am student",
                    "position": "student",
                    "purpose": "to work on data sets",
                    "register": "2021-03-23T15:09:33.272Z"
                },
                {
                    "institution": "University of Sao Paulo, Ribeirao Preto Medical School",
                    "bio": "PhD student",
                    "position": "PhD student",
                    "purpose": "neuroimaging analysis of stroke patients",
                    "register": "2021-03-24T02:47:34.209Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am a professor of Cognitive Science",
                    "position": "Professor",
                    "purpose": "exploration",
                    "register": "2021-03-24T15:41:10.708Z"
                },
                {
                    "institution": "Pearl Data Firm",
                    "bio": "I am a passionate Data Scientist who is currently working on developing Nuero-interfaces... Someone has to.",
                    "position": "Data Scientist",
                    "purpose": "Develop model to recognise intention from EEG data",
                    "register": "2021-03-24T15:42:15.969Z"
                },
                {
                    "institution": "Aix-Marseille University",
                    "bio": "I studied Linguistics at Heidelberg university, Germany. I’m currently studying Cognitive Science at Aix-Marseille University, France.",
                    "position": "Master student",
                    "purpose": "My purpose is twofold. First, I would like to gain more experience working with neuroimaging data. Second, I would like to use some of the data for as a starting point for my Masters thesis.",
                    "register": "2021-03-24T15:44:16.823Z"
                },
                {
                    "institution": "CNMC",
                    "bio": "software engineer",
                    "position": "CNMC",
                    "purpose": "Testing for feasibility",
                    "register": "2021-03-24T17:24:00.361Z"
                },
                {
                    "institution": "Texas A&M University",
                    "bio": "Associate Professor of Cognition and Cognitive Neuroscience at Texas A&M University.  My central expertise is in developing and implementing formal models of learning and decision-making.  I mainly collaborate with people with stronger skills in neuroimaging when I conduct fMRI studies, and my role in these projects is usually to design studies, fit models to the behavioral data, and generate model-based regressors for fMRI analysis.",
                    "position": "Associate Professor",
                    "purpose": "I am collaborating with some people at the University of Texas at Austin and Texas Tech on a project that was funded by NIH.  They uploaded some Freesurfer data to this website, and said it could be viewed on here.",
                    "register": "2021-03-26T19:55:20.205Z"
                },
                {
                    "institution": "University of Michigan",
                    "bio": "Graduate student studying developmental neuroscience",
                    "position": "Graduate student",
                    "purpose": "Processing white matter diffusion data",
                    "register": "2021-03-27T15:41:51.291Z"
                },
                {
                    "institution": "SUNY Buffalo",
                    "bio": "As director of UB’s Neuroengineering and Informatics for Rehabilitation Laboratory (NIRlab), I conduct interdisciplinary research in neural engineering, the application of engineering to the neurosciences. My academic and research training in neurotechnology, motor rehabilitation, clinical neurophysiology and cerebrovascular medicine provides me with the expertise for translational research focused on developing computational models and hardware technologies for neural interfaces to monitor and activate beneficial neural function.",
                    "position": "Research Associate Professor",
                    "purpose": "If achieved, the bench-to-bedside translation of electroceuticals, developed through innovations in computational methods and instrumentation, will have a very high societal impact since neurological disorders—e.g., stroke and dementia-- will likely dramatically increase as the world population ages.",
                    "register": "2021-03-28T02:09:28.803Z"
                },
                {
                    "institution": "cardiff university",
                    "bio": "student",
                    "position": "student",
                    "purpose": "preprocess T1-w mri",
                    "register": "2021-03-29T13:43:50.459Z"
                },
                {
                    "institution": "Jadavpur University",
                    "bio": "I am a sophomore undergraduate studying in the department of Computer Science, Jadavpur University,Kolkata interested in brain computing, image processing.",
                    "position": "Student",
                    "purpose": "I have started working under Prof. Sanjoy Kumar Saha in fmri and related domain and looking to explore this platform right now.",
                    "register": "2021-03-30T14:32:03.308Z"
                },
                {
                    "institution": "Dipanjan Ray",
                    "bio": "Trained as a physician, interested in connectivity within and beyond brain.",
                    "position": "Post doctoral fellow",
                    "purpose": "Accessing and analysing neuroimaging data.",
                    "register": "2021-03-30T19:20:09.538Z"
                },
                {
                    "institution": "University of Utah",
                    "bio": "Not much to say compared to everyone else here.",
                    "position": "Staff",
                    "purpose": "I would just like to find out more about how you do what you do.",
                    "register": "2021-04-01T02:55:58.432Z"
                },
                {
                    "institution": "Bogazici University",
                    "bio": "PhD Candidate working on Brain MRI",
                    "position": "PhD Candidate",
                    "purpose": "I got here while trying to figure out how to share datasets and utilize public datasets.",
                    "register": "2021-04-01T14:59:57.333Z"
                },
                {
                    "institution": "ISSP",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "Help with neuro research.",
                    "register": "2021-04-01T22:29:11.546Z"
                },
                {
                    "institution": "deepbay",
                    "bio": "I'm Kevin",
                    "position": "developer",
                    "purpose": "Know more about eeg",
                    "register": "2021-04-02T15:45:09.638Z"
                },
                {
                    "institution": "Fielding Graduate University",
                    "bio": "Grad student at Fielding Graduate University",
                    "position": "Grad Student",
                    "purpose": "To assist in completing my grad school research and ongoing",
                    "register": "2021-04-03T06:06:23Z"
                },
                {
                    "institution": "The University of Texas at Austin",
                    "bio": "I am a second-year doctoral student at The University of Texas at Austin's Oden Institute for Computational Sciences and Engineering.",
                    "position": "Graduate Research Assistant",
                    "purpose": "I am hoping to use CPAC to process data for a class project.",
                    "register": "2021-04-04T17:02:13.455Z"
                },
                {
                    "institution": "Cornell University",
                    "bio": "PhD student",
                    "position": "PhD student",
                    "purpose": "Preprocess open-access brain imaging data",
                    "register": "2021-04-05T02:54:52.21Z"
                },
                {
                    "institution": "National Brain Research Centre, Manesar, India",
                    "bio": "I am a 2nd year PhD student. Currently, I am interested in mechanisms language comprehension in ecologically valid environment using naturalistic fMRI data.",
                    "position": "PhD Student",
                    "purpose": "I aim to use the publicly available datasets",
                    "register": "2021-04-05T05:49:08.674Z"
                },
                {
                    "institution": "Harvard HSPH",
                    "bio": "Master student in biostat",
                    "position": "student",
                    "purpose": "preprocess fMRI images",
                    "register": "2021-04-05T16:12:19.49Z"
                },
                {
                    "institution": "Center for the Study of Emotion and Attention at University of Florida",
                    "bio": "Graduate student conducting research on internalizing disorders",
                    "position": "Graduate Student",
                    "purpose": "Currently just for processing publicly available datasets.",
                    "register": "2021-04-05T18:49:12.899Z"
                },
                {
                    "institution": "UT Austin",
                    "bio": "Computer Graphics PhD at UT Austin",
                    "position": "Grad Student Researcher",
                    "purpose": "I would like to evaluate a volumetric paramterization/fitting technique I've been working on against the LiFE tool.  The version here seems to be the most up to date implementation available, wanted to sign up to be able to poke around and get a sense of the tools available.  Thanks!\n\nP.S. I am supervised by Dr. Etienne Vouga, I've been told that it's perhaps worth reaching out to talk to the Pestilli Lab by Justin Solomon at MIT and Alex Huth at UT :).",
                    "register": "2021-04-05T22:52:40.939Z"
                },
                {
                    "institution": "Swinburne University of Technology",
                    "bio": "I'm currently a PhD candidate at Swinburne University of Technology. My focus study is physiological state of aviation pilots.",
                    "position": "researcher",
                    "purpose": "I found this platform when I'm searching for EEG databases. It's totally online and the visualization looks really cool so I want to give a try",
                    "register": "2021-04-06T00:24:57.374Z"
                },
                {
                    "institution": "NCKU",
                    "bio": "App developer and filmmaker",
                    "position": "MA student",
                    "purpose": "Interesting in the neuroscience of movies",
                    "register": "2021-04-06T11:28:29.187Z"
                },
                {
                    "institution": "navy medical school",
                    "bio": "student",
                    "position": "doctor",
                    "purpose": "study",
                    "register": "2021-04-07T03:13:49.139Z"
                },
                {
                    "institution": "None",
                    "bio": "https://www.linkedin.com/in/jglmarques",
                    "position": "Engineering",
                    "purpose": "Learning about brain/neuron interaction",
                    "register": "2021-04-08T04:07:30.485Z"
                },
                {
                    "institution": "University of Texas at San Antonio",
                    "bio": "UTSA Matrix AI",
                    "position": "PhD Graduate Researcher",
                    "purpose": "developing ML to predict dementia using TF",
                    "register": "2021-04-08T05:55:34.003Z"
                },
                {
                    "institution": "HIT",
                    "bio": "Studying biological information",
                    "position": "Student",
                    "purpose": "Studying biological information",
                    "register": "2021-04-08T14:04:27.105Z"
                },
                {
                    "institution": "Maastricht University",
                    "bio": "Maastricht University",
                    "position": "PhD",
                    "purpose": "Reproduce diffusion study.",
                    "register": "2021-04-09T08:13:48.223Z"
                },
                {
                    "institution": "Riverstone international School",
                    "bio": "DP Biology instructor",
                    "position": "DP Coordinator",
                    "purpose": "I would like to use it with my students to do statistical analysis on brain imagery.",
                    "register": "2021-04-09T20:12:26.208Z"
                },
                {
                    "institution": "Technical University Munich",
                    "bio": "I am PhD student at Markus Ploner's lab.",
                    "position": "PhD student",
                    "purpose": "I am interested in automatic preprocessing of EEG data.",
                    "register": "2021-04-10T17:59:02.104Z"
                },
                {
                    "institution": "University Hospital Aachen, Germany",
                    "bio": "Currently PhD Student at the University Hospital Aachen",
                    "position": "research associate",
                    "purpose": "I would like to use brainlife to have a look into available date on my PhD topic to see the possibilities what can be done with the data and also to compare them with data that will be collected for our own study to check for similarities and differences.",
                    "register": "2021-04-12T10:43:48.296Z"
                },
                {
                    "institution": "Università di Cagliari",
                    "bio": "I'm a student who is working with ABIDE data.",
                    "position": "Student",
                    "purpose": "I'm a student who is working with ABIDE data.",
                    "register": "2021-04-12T12:17:42.311Z"
                },
                {
                    "institution": "Princeton University",
                    "bio": "Brain Development Lab",
                    "position": "Asst. Professor",
                    "purpose": "Derive fiber weights from a candidate connectome (e.g., fit LIFE).",
                    "register": "2021-04-12T22:55:33.923Z"
                },
                {
                    "institution": "Haeundae Paik Hospital",
                    "bio": "Hello!",
                    "position": "Radiologist",
                    "purpose": "For analysis, in clinical datasets",
                    "register": "2021-04-13T03:44:08.698Z"
                },
                {
                    "institution": "ETH",
                    "bio": "Reza Ranjandish (Member, IEEE) received the M.Sc. degree in electronic engineering circuits and systems from the University of Tehran, Tehran, Iran, in 2014, and the Ph.D. degree from the École polytechnique fédérale de Lausanne (EPFL) in 2019. He continued his research at EPFL, as a Post-Doctoral Research Fellow for eight months. Then, he joined ETH Zurich as a Post-Doctoral Researcher. He is currently with SynSense, Zurich, where he is designing neuromorphic and asynchronous circuits and systems. His current research and professional interests include the domain of analog/mixed mode and digital integrated circuit (IC) designs, light-weight machine learning, neuromorphic, and asynchronous architectures as well as implantable closed-loop stimulation systems.",
                    "position": "Guest Scientist",
                    "purpose": "Research",
                    "register": "2021-04-13T05:56:10.502Z"
                },
                {
                    "institution": "Omu medical faculty radiology department",
                    "bio": "I'm radiology resident at university hospital. I'm interested in neurosceince and DTI analysis.",
                    "position": "Ondokuz Mayis University",
                    "purpose": "I want to download dti pipelines .",
                    "register": "2021-04-13T19:46:31.013Z"
                },
                {
                    "institution": "Institute of Biophysics, CAS",
                    "bio": "Doctoral student at Ning Liu lab, Institute of Biophysics, CAS",
                    "position": "Student",
                    "purpose": "dMRI code availability",
                    "register": "2021-04-14T02:57:37.535Z"
                },
                {
                    "institution": "University of Florida",
                    "bio": "I'm a graduate student in the field of Biomedical Engineering",
                    "position": "Graduate Student",
                    "purpose": "I would like to better understand how to preprocess fMRI and DTI data and how to use these results in machine learning models.",
                    "register": "2021-04-14T04:03:25.111Z"
                },
                {
                    "institution": "The University of Texas at Austin",
                    "bio": "Carola’s work aims to understand the role played by reward (and the dopamine system) in creativity and insight problem-solving; the involvement of the vision system in idea generation; and the role of the right anterior temporal area when people have creative insights. She has experience working with TBI, Parkinson’s, and neglect patients, and has mastered several techniques of research such as eye-tracking, imaging, and brain stimulation.",
                    "position": "Research Associate",
                    "purpose": "Share data and projects.",
                    "register": "2021-04-14T23:08:22.368Z"
                },
                {
                    "institution": "University of Wisconsin - Madison",
                    "bio": "My research focuses on applications of phase contrast MRI to study cerebrovascular changes in Alzheimer's disease.",
                    "position": "Graduate Research Assistant",
                    "purpose": "Currently hoping to understand more about BIDS formatting.",
                    "register": "2021-04-16T01:42:00.647Z"
                },
                {
                    "institution": "National Engineering School of Tunis",
                    "bio": "I'm an engineer student in telecommunications",
                    "position": "student",
                    "purpose": "visualize my data",
                    "register": "2021-04-16T05:33:30.19Z"
                },
                {
                    "institution": "The Jikei University School of Medicine",
                    "bio": "medical university in Tokyo, Japan.",
                    "position": "Doctor",
                    "purpose": "to analyze MRI data of patients who suffer from eye disease.",
                    "register": "2021-04-17T02:30:15.252Z"
                },
                {
                    "institution": "Jadavpur University",
                    "bio": "Lorem ipsum dolor sit amet consectetuer",
                    "position": "Student",
                    "purpose": "Research"
                },
                {
                    "institution": "Princeton",
                    "bio": "I am currently a graduate student.",
                    "position": "Graduate Student",
                    "purpose": "I would like to learn analytic methods and have a fun time using this platform.",
                    "register": "2021-04-17T18:40:14.77Z"
                },
                {
                    "institution": "kmutt university faculty of science",
                    "bio": "college student",
                    "position": "college student",
                    "purpose": "I use this article to study fMRI data preprocessing.",
                    "register": "2021-04-17T20:26:43.548Z"
                },
                {
                    "institution": "The University of Queensland",
                    "bio": "National Imaging Facility - Informatics Fellow - Queensland",
                    "position": "Informatics Fellow",
                    "purpose": "Development and testing",
                    "register": "2021-04-19T04:27:20.086Z"
                },
                {
                    "institution": "IIAI",
                    "bio": "B. Ben Amor is currently Senior Scientist with the IIAI in Abu Dhabi, UAE. He is in Research sabbatical leave from his Full Professor position in Institut Mines-Télécom (IMT) Lille Douai and CRIStAL Research Center (UMR CNRS 9189), in France. He was awarded with the prestigious Fulbright Research Scholarship (in 2016-2017) to visit Florida State University (FL, USA). He earned the Habilitation to Supervise Research (H.D.R.) in Computer Science from the University of Lille (France), in Dec. 2014. He received the PhD (2006) and the MSc degrees (2003) also in Computer Science, both from Ecole Centrale de Lyon (France). In 2002, he was graduated with the Engineer degree in Computer Science from the National Engineering School of Sfax (ENIS), in Tunisia. He is  Senior Member of the IEEE and member of the IAPR. He was visiting researcher to the SSAMG group (FSU, USA) in 2013-14. He was the general co-chair of the international workshop RFMI in 2016 and 2017. He is now maintaining the liaison with the IAPR and the publisher Springer. He is also an active member of its Steering Committee. Prof. B. Ben Amor was the founding and former director of the Mastère Spécialisé® “Cyber. Engineering”, accredited by the CGE (Conference des Grandes Ecoles) and labeled SecNumEdu by the ANSSI (link) at IMT Lille Douai, in France.",
                    "position": "Senior scientist",
                    "purpose": "Data for cortical surface parcellation.",
                    "register": "2021-04-19T10:54:22.134Z"
                },
                {
                    "institution": "ICM & Sorbonne Université / ARAMIS Lab.",
                    "bio": "Theoretical Physicsist. Interested in the Physics of Complex Systems, Network Science and Network Neuroscience.",
                    "position": "PhD Student",
                    "purpose": "Sharing tools for data analysis. Network Neuroscience.",
                    "register": "2021-04-19T12:49:12.055Z"
                },
                {
                    "institution": "University of Oxford & Aarhus",
                    "bio": "Professor of Neuroscience",
                    "position": "Professor of Neuroscience",
                    "purpose": "To use for open access neuroimaging pipelines and analysis",
                    "register": "2021-04-19T19:49:11.913Z"
                },
                {
                    "institution": "Tsinghua University",
                    "bio": "a Ph.D. Candidate in Neuroscience\ninterested in how people understand each others via speech",
                    "position": "Ph.D. Candidate",
                    "purpose": "easy data analysis process",
                    "register": "2021-04-20T08:51:18.085Z"
                },
                {
                    "institution": "universite toulouse",
                    "bio": "A master degree student",
                    "position": "student",
                    "purpose": "internship",
                    "register": "2021-04-21T14:14:37.056Z"
                },
                {
                    "institution": "Institut de Myologie",
                    "bio": "Quantitative Engineer - from Finance to MRI Research",
                    "position": "PHD",
                    "purpose": "Datasets for training Magnetic Resonance Fingerprinting methods",
                    "register": "2021-04-21T15:03:25.011Z"
                },
                {
                    "institution": "Delwye",
                    "bio": "Independent research",
                    "position": "Owner",
                    "purpose": "Explore",
                    "register": "2021-04-22T01:06:56.88Z"
                },
                {
                    "institution": "University of Aveiro",
                    "bio": "I am a PhD research student enrolled in a Computer Engineering department and my research topic is related to 3D visualization of pathogen niche datasets.",
                    "position": "PhD research student",
                    "purpose": "I would like to try some visualization tools to visualize Microscopy images.",
                    "register": "2021-04-22T15:44:02.878Z"
                },
                {
                    "institution": "Shahid Beheshti University",
                    "bio": "I am a graduate student of Medical Science and Technology. I work on DTI images.",
                    "position": "student",
                    "purpose": "I want to analyze the DTI images with Free Surfer.",
                    "register": "2021-04-22T16:22:54.557Z"
                },
                {
                    "institution": "Drew University",
                    "bio": ".",
                    "position": "student",
                    "purpose": "."
                },
                {
                    "institution": "Hospital Universitário de Brasília (HUB)",
                    "bio": "I'm a neuroradiology fellow at an uninversity hospital in Brasília, Brazil.",
                    "position": "Neurorradiology Fellow",
                    "purpose": "I hope to learn about advanced method in neuroradiology.",
                    "register": "2021-04-23T11:14:01.407Z"
                },
                {
                    "institution": "wgoppsirpgt",
                    "bio": "wgoppsirpgt",
                    "position": "wgoppsirpgt",
                    "purpose": "wgoppsirpgt"
                },
                {
                    "institution": "Neurobiology Research Unit\nCopenhagen University Hospital, Rigshospitalet",
                    "bio": "Data enthusiast, neuroscience and code",
                    "position": "Senior Research Software Developer",
                    "purpose": "mostly playing around so see how to develop pipelines that will run on this platform",
                    "register": "2021-04-23T16:21:54.184Z"
                },
                {
                    "institution": "Yale University",
                    "bio": "Graduate student at Yale University",
                    "position": "Graduate Student",
                    "purpose": "Explore datasets that I may or may not use in my graduate thesis",
                    "register": "2021-04-23T16:31:58.258Z"
                },
                {
                    "institution": "University of Maryland Global",
                    "bio": "Computer Science student looking towards research and growth in the field of Data Science",
                    "position": "Student",
                    "purpose": "I am using the information on this site to further my education and application of data science principles, particularly in EEG data set processing, interpretation, and presentation.",
                    "register": "2021-04-24T17:14:23.504Z"
                },
                {
                    "institution": "New York State Psychiatric Institute/Columbia University",
                    "bio": "Dr. Yttredahl is interested in implicit emotion regulation and in using neuroimaging to optimize tDCS application as a treatment for maladaptive emotion regulation strategies in psychiatric illness. Dr. Yttredahl’s current work includes using fMRI and Ecological Momentary Assessment (EMA) to evaluate target engagement by tDCS as a treatment intervention for non-suicidal self-injury.",
                    "position": "Postdoctoral Research Scientist",
                    "purpose": "I learned about brainlife.io from C-PAC, which I am trying to setup to analyze resting-state fMRI data on a sample of patients and healthy volunteers with and without a family history of depression. This looks like a much easier way to test new packages, like C-PAC, without the major time and struggle it takes to install different softwares and chase compatibility bugs. I am also very interested in the code and data sharing emphasis here, primarily because I mentor undergraduate and graduate students learning MRI and it looks like this would provide a way to identify possible training datasets I could request for that purpose.",
                    "register": "2021-04-24T18:19:05.602Z"
                },
                {
                    "institution": "RaleighLabs",
                    "bio": "Computational Neuroscience",
                    "position": "CTO",
                    "purpose": "Analyze data",
                    "register": "2021-04-25T09:22:36.585Z"
                },
                {
                    "institution": "Google",
                    "bio": "Master student Interaction technology",
                    "position": "Graduate student",
                    "purpose": "Understanding EEG data",
                    "register": "2021-04-26T08:55:12.636Z"
                },
                {
                    "institution": "King's College London",
                    "bio": "Master's Neuroscience and AI student interested in the computational neuroscience of learning and free energy principle. Affiliations include: Utrecht University, University College Utrecht, University Medical Center Utrecht, Donders Institute and  Tsinghua University.",
                    "position": "Student",
                    "purpose": "Learn to use brain imaging data for exploratory tasks.",
                    "register": "2021-04-26T09:55:26.586Z"
                },
                {
                    "institution": "AMU",
                    "bio": "I'm interested in data informed brain network modeling and model inversion.",
                    "position": "postdoc",
                    "purpose": "I want to try to process openly available datasets for brain network modeling.",
                    "register": "2021-04-26T11:06:05.71Z"
                },
                {
                    "institution": "Eastern Mediterranean University",
                    "bio": "a",
                    "position": "Resource Asistant",
                    "purpose": "a",
                    "register": "2021-04-26T11:24:13.02Z"
                },
                {
                    "institution": "Dartmouth College",
                    "bio": "I'm cognitive neuroscience PhD candidate studying visual attention, perception, and consciousness.",
                    "position": "Graduate student",
                    "purpose": "It'd be great if brainlife.io provides the capability to reliably run preprocessing and parts of analysis on its cloud platform.",
                    "register": "2021-04-26T16:41:08.852Z"
                },
                {
                    "institution": "CNR",
                    "bio": "I am a researcher of the National Research Council, mainly interested in image processing",
                    "position": "Researcher",
                    "purpose": "Learning about image processing applied to neurosciences",
                    "register": "2021-04-26T17:46:42.844Z"
                },
                {
                    "institution": "The Wheeler School",
                    "bio": "High school student and research assistant at MIT and Brown.",
                    "position": "Student",
                    "purpose": "I am looking to prepare for working within a lab at MIT studying dyslexia this coming summer.",
                    "register": "2021-04-27T00:36:46.329Z"
                },
                {
                    "institution": "Harvard Medical School",
                    "bio": "Pain Researcher",
                    "position": "Instructor / Research Associate",
                    "purpose": "Data Quality",
                    "register": "2021-04-28T13:56:24.989Z"
                },
                {
                    "institution": "Swiss Federal Institute of Technology",
                    "bio": "Graduate Student at the Swiss Federal Institute of Technology, doing an MSc in Biomedical Engineering and interested in studying brain mechanisms of the diseased brain and altered states of consciousness.",
                    "position": "Student",
                    "purpose": "To collect and analyze supplementary datasets when reviewing the literature.",
                    "register": "2021-04-28T16:26:47.676Z"
                },
                {
                    "institution": "ETH Zurich",
                    "bio": "I am a master student studying at ETH Zurich.",
                    "position": "Student",
                    "purpose": "Need to download data",
                    "register": "2021-04-28T16:40:04.932Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "Research interset: Gait, Vision, Motivation, Motor Learning, and Data Science",
                    "position": "Associate Instructor, Kinesiology Department of Indiana University",
                    "purpose": "Use public datasets",
                    "register": "2021-04-28T17:59:46.975Z"
                },
                {
                    "institution": "Pitzer College",
                    "bio": null,
                    "position": "RA",
                    "purpose": "Course work, independent research",
                    "register": "2021-04-29T04:23:16.116Z"
                },
                {
                    "institution": "university of padova",
                    "bio": "associate professor",
                    "position": "associate professor",
                    "purpose": "teaching purposes",
                    "register": "2021-04-29T10:15:46.82Z"
                },
                {
                    "institution": "lanzhou university",
                    "bio": "a work hard student",
                    "position": "student",
                    "purpose": "I'm going to use DIPY to analyze DTI data to explore the structural brain network changes of white matter lesions",
                    "register": "2021-04-29T15:53:48.465Z"
                },
                {
                    "institution": "Western University",
                    "bio": "Open Science Software Developer at Western University in Ontario.",
                    "position": "Open Science Software Developer",
                    "purpose": "Help share data and pipelines, and make it easier for new personnel to use those resources.",
                    "register": "2021-04-29T20:41:18.036Z"
                },
                {
                    "institution": "The Ohio State University",
                    "bio": "Neuroscience Graduate Student at the Ohio State University",
                    "position": "Graduate Student",
                    "purpose": "To standardize pipelines for public datasets and use that data to make predictions and observations about diseases and cognitive states that can be useful for the public good",
                    "register": "2021-04-29T21:28:31.977Z"
                },
                {
                    "institution": "Fondazione Bruno Kessler",
                    "bio": "I'm student of Biomedical Engineering",
                    "position": "intern",
                    "purpose": "sharing data",
                    "register": "2021-04-30T06:53:55.89Z"
                },
                {
                    "institution": "Shanghai Jiao Tong University",
                    "bio": "Master Student in biomedical engineering",
                    "position": "student",
                    "purpose": "Acedemic use",
                    "register": "2021-05-02T03:13:29.051Z"
                },
                {
                    "institution": "Harvey Mudd College",
                    "bio": "I'm a Computation/Biology Student at Harvey Mudd College",
                    "position": "Student",
                    "purpose": "I am here to analyze fMRI data from research projects that I will cite.",
                    "register": "2021-05-02T17:45:01.817Z"
                },
                {
                    "institution": "Drew University",
                    "bio": "I am a neuroscience major",
                    "position": "Student",
                    "purpose": "I am using brain life to access data for a project.",
                    "register": "2021-05-02T18:58:18.365Z"
                },
                {
                    "institution": "University of Portsmouth",
                    "bio": "Neuropsychologist interested in Reinforcement Sensitivity Theory and anxiety.",
                    "position": "Senior Lecturer",
                    "purpose": "Research and education",
                    "register": "2021-05-03T16:05:54.25Z"
                },
                {
                    "institution": "Northwestern University",
                    "bio": "My career goal is to improve treatments for individuals with complex neuropsychiatric conditions, particularly those with traumatic brain injury (TBI) and co-occurring psychiatric sequelae. A better understanding the of the neuroscience underlying these illnesses will allow us to create better treatments to improve the lives of many and advance the field of psychiatry. I am a neuropsychiatrist with advanced training in the clinical care of those with complex neuropsychiatric conditions. I completed a Psychiatry Residency followed by a Clinical Neuroscience and Neuropsychiatry research fellowship at Northwestern University, Feinberg School of Medicine. \nI am a full time employee of the Hines VA. I work as a clinician 25% of the time, splitting my time between the neuromodulation service (performing electroconvulsive and transcranial magnetic stimulation (TMS) therapies) and outpatient clinic. I also serve as the team psychiatrist on the Hines VA polytrauma team, the team that caters to the complex needs of Veterans with TBI. 75% of my time is devoted to research endeavors. I maintain a position in the Department of Psychiatry & Behavioral Sciences at Northwestern University as an Adjunct Assistant Professor with ad hoc clinical duties in the Consult Liasion service. I teach psychiatry residents at the Feinberg School of Medicine at Northwestern Univeristy and the Stritch School of Medicine at Loyola University. I serve as an early career investigator at the Hines VA and was recently awarded a CDA1 grant for my project titled “Establishing Relationships and Developing a Therapeutic Target for Impulsivity and Suicidality Amond Veterans with Traumatic Brain Injury and Co-Occuring Conditions,” wherein I am attempting to establish a link between suicidality and impulsivity in Veterans with TBI.",
                    "position": "research psychiatrist",
                    "purpose": "I will be using Brainlife to store data and perform freesurfer volumetric analyses on brains of individuals with TBI with and without suicidal ideation to see if there are differences in those who are suicidal.",
                    "register": "2021-05-03T16:44:59.976Z"
                },
                {
                    "institution": "Texas Tech University",
                    "bio": "I  finished my Ph.D. at Texas Tech in Applied Mathematics  and received my B.Sc. in Mechanical Engineering from University of Peradeniya, Sri Lanka.",
                    "position": "Instructor",
                    "purpose": "to analyze data",
                    "register": "2021-05-04T16:48:59.312Z"
                },
                {
                    "institution": "lanzhou university",
                    "bio": "Doctoral candidate, majoring in neuroimaging related research",
                    "position": "Deputy chief physician",
                    "purpose": "The software was used to analyze the neuroimaging data",
                    "register": "2021-05-05T05:12:29.498Z"
                },
                {
                    "institution": "EPFL",
                    "bio": "Professor of Bioengineering",
                    "position": "Professor",
                    "purpose": "Try out",
                    "register": "2021-05-05T06:55:09.628Z"
                },
                {
                    "institution": "University of Oldenburg",
                    "bio": "I am second year Master student i the Prgram: neurocognitive Psychology. Currently in my final semester I am at the Laboratory of Neuroscience At the Aix-Marseille University. Here I am in charge of A project using DWI data, to which I am new.",
                    "position": "Master's Student in Neurocognitive Psychology",
                    "purpose": "I would like to explore the different applications that are meant for brain data processing. I am currently working in a project with DWI data and here, there is an app that can help me understand the preprocessing of this data. I expect Brainlife to help me not only giving me insight for this project but also for further inquiry regarding programming matters related to the processing of brain related data sets. Thank you.",
                    "register": "2021-05-05T13:14:48.522Z"
                },
                {
                    "institution": "Philips University Marburg",
                    "bio": "im a master student in cognitive neuroscience",
                    "position": "Master Student",
                    "purpose": "would like to use it for university purposes and training for data analysis",
                    "register": "2021-05-05T14:38:44.985Z"
                },
                {
                    "institution": "UPenn",
                    "bio": "Radiology resident interested in synaptic plasticity in addiction",
                    "position": "Resident",
                    "purpose": "I just found this and don’t know anything about it",
                    "register": "2021-05-06T22:13:56.181Z"
                },
                {
                    "institution": "ferdowsi university of mashhad",
                    "bio": "I am a student in faculty of engineering at Ferdowsi university of Mashhad, my major concludes topics related to  neural cognition science and medical engineering.",
                    "position": "student",
                    "purpose": "I am looking for normal and autism MRI data of toddlers involving ASD for my study.",
                    "register": "2021-05-07T08:46:07.807Z"
                },
                {
                    "institution": "TUA",
                    "bio": "bio",
                    "position": "sanrransisco",
                    "purpose": "science"
                },
                {
                    "institution": "Max Planck Institute for Informatics",
                    "bio": "Computer scientist working on methods to explore rich graph data",
                    "position": "Researcher",
                    "purpose": "Processing of fMRI data",
                    "register": "2021-05-09T08:44:40.374Z"
                },
                {
                    "institution": "Mediinfo",
                    "bio": "B.E (E & C ) worked with WANG .Developing Python based signal processing of EEG  for online elipepsy patients for a medical clinic of neurologists .",
                    "position": "CEO",
                    "purpose": "brainlife.io as a dataset and analysis company can help us in  exchanging data for future use.",
                    "register": "2021-05-10T10:14:24.515Z"
                },
                {
                    "institution": "The University of Texas at Austin",
                    "bio": "I'm a pediatric neurology physician-scientist with particular interest in neurodevelopment and neurodiversity. The long-term goal of my research program is to develop neuromodulation therapies based on an understanding of circuit-level physiology.",
                    "position": "Assistant Professor of Neurology, Pediatrics, and Neuroscience",
                    "purpose": "I'd like to optimize my use of open-source computational resources to advance my research program.",
                    "register": "2021-05-10T21:31:20.83Z"
                },
                {
                    "institution": "vuno",
                    "bio": "Hi",
                    "position": "researcher",
                    "purpose": "I expect to get medical image resources from this site.",
                    "register": "2021-05-11T14:36:16.616Z"
                },
                {
                    "institution": "University of Science and Technology Beijing",
                    "bio": "I am a student.",
                    "position": "Student",
                    "purpose": "Study",
                    "register": "2021-05-12T10:38:57.309Z"
                },
                {
                    "institution": "Yonsei University",
                    "bio": "Ph. D. in Developmental Cognitive Psychology",
                    "position": "Post Doctoral Researcher",
                    "purpose": "I want to use brainlife as a learning tool for grad and undergrad students in Developmental Cognitive Neuroscience class.",
                    "register": "2021-05-12T13:52:46.305Z"
                },
                {
                    "institution": "McGill University",
                    "bio": "We study memory at McGill",
                    "position": "Assistant Professor",
                    "purpose": "To conduct exploratory analyses on existing datasets",
                    "register": "2021-05-12T15:12:31.775Z"
                },
                {
                    "institution": "Ruhr-Universität Bochum",
                    "bio": "Psychologist, cognitive science student.",
                    "position": "Master student",
                    "purpose": "Method learning",
                    "register": "2021-05-13T18:17:15.967Z"
                },
                {
                    "institution": "Lawrence Livermore National Laboratory",
                    "bio": "Research scientist at Lawrence Livermore National Laboratory.",
                    "position": "Research Scientist",
                    "purpose": "Explore data/develop methods.",
                    "register": "2021-05-13T23:29:01.408Z"
                },
                {
                    "institution": "lycée Condorcet",
                    "bio": "I am a student in France in math and physics looking forward to being an engineer.",
                    "position": "Student",
                    "purpose": "I am working on spectral clustering and its applications in the medical field notably and I would like to have access to data in order to complete my work.",
                    "register": "2021-05-14T08:24:57.97Z"
                },
                {
                    "institution": "Universite Jean Monnet",
                    "bio": "Grad Student",
                    "position": "Grad Student",
                    "purpose": "To create a connectivity matrices",
                    "register": "2021-05-14T15:51:11.202Z"
                },
                {
                    "institution": "Northwestern Polytechnical University",
                    "bio": "。。。",
                    "position": "student",
                    "purpose": "study",
                    "register": "2021-05-15T07:00:55.352Z"
                },
                {
                    "institution": "Princeton",
                    "bio": "Graduate Student at Princeton University.",
                    "position": "Graduate Student",
                    "purpose": "I would like to use brainlife's tools to analyze data and make cool discoveries!",
                    "register": "2021-05-15T20:48:20.082Z"
                },
                {
                    "institution": "bjtu",
                    "bio": "student in bjtu",
                    "position": "student",
                    "purpose": "for data analysis",
                    "register": "2021-05-16T08:11:07.703Z"
                },
                {
                    "institution": "Erciyes University",
                    "bio": "I am master student at erciyes university.",
                    "position": "postgraduate",
                    "purpose": "I'll use it for a lesson assignment",
                    "register": "2021-05-17T12:17:29.793Z"
                },
                {
                    "institution": "Inria",
                    "bio": "PhD in Signal Processing",
                    "position": "Postdoc",
                    "purpose": "I would like to understand how brainlife can enhance my daily routine with medical images",
                    "register": "2021-05-18T08:45:25.03Z"
                },
                {
                    "institution": "Shenzhen University",
                    "bio": "Biomedical student. Working on medical images processing.",
                    "position": "student",
                    "purpose": "Woking on the study combine deep learning method with medical images",
                    "register": "2021-05-18T14:35:21.85Z"
                },
                {
                    "institution": "Tsinghua University",
                    "bio": "Msc Data Science student",
                    "position": "Researcher",
                    "purpose": "Be able to have contact with researches from the brain and also have contact with datasets/databases for future studies",
                    "register": "2021-05-19T19:44:30.198Z"
                },
                {
                    "institution": "University of North Texas",
                    "bio": "Mathematics BSc Student",
                    "position": "Surface",
                    "purpose": "To use and analyze data before downloading datasets.",
                    "register": "2021-05-20T00:32:09.03Z"
                },
                {
                    "institution": "Sarvajanik College of Engineering & Technology",
                    "bio": "Student\nInto Deep learning based EEG research",
                    "position": "Student",
                    "purpose": "To research the working of eeg and analysis through machine learning algorithms.",
                    "register": "2021-05-21T09:36:10.908Z"
                },
                {
                    "institution": "brittani555",
                    "bio": "test",
                    "position": "test",
                    "purpose": "test",
                    "register": "2021-05-21T12:06:04.675Z"
                },
                {
                    "institution": "Wylie East High School",
                    "bio": "High School student doing independent study.",
                    "position": "Student",
                    "purpose": "Process Data",
                    "register": "2021-05-21T16:50:55.332Z"
                },
                {
                    "institution": "Stanford",
                    "bio": "PhD Candidate",
                    "position": "Student",
                    "purpose": "Analyze fMRI",
                    "register": "2021-05-22T05:02:14.052Z"
                },
                {
                    "institution": "IIITDMJ",
                    "bio": "I am a Mtech student",
                    "position": "Mtech student",
                    "purpose": "Research work",
                    "register": "2021-05-24T21:41:36.538Z"
                },
                {
                    "institution": "Carnegie Mellon University",
                    "bio": "Postdoc fellow.",
                    "position": "Researcher",
                    "purpose": "Research",
                    "register": "2021-05-24T22:49:40.536Z"
                },
                {
                    "institution": "Donders Institute for Brain Cognition and Behaviour",
                    "bio": "I am me",
                    "position": "PhD Student",
                    "purpose": "run some apps yo",
                    "register": "2021-05-26T12:55:59.802Z"
                },
                {
                    "institution": "Donders Institute",
                    "bio": "no",
                    "position": "PhD Student",
                    "purpose": "analyses",
                    "register": "2021-05-26T12:59:45.34Z"
                },
                {
                    "institution": "Donders Institute",
                    "bio": "I am me",
                    "position": "PhD Student",
                    "purpose": "run apps",
                    "register": "2021-05-26T13:15:50.832Z"
                },
                {
                    "institution": "IISER",
                    "bio": "I AM GRAD STUDENT.",
                    "position": "STUDENT",
                    "purpose": "MRI DATA ANALYSIS",
                    "register": "2021-05-26T17:26:42.637Z"
                },
                {
                    "institution": "International Brain Laboratory",
                    "bio": "So many neurons, so little time...",
                    "position": "Data Architect",
                    "purpose": "Evaluating...",
                    "register": "2021-05-26T17:52:18.985Z"
                },
                {
                    "institution": "yugv",
                    "bio": "efgg",
                    "position": "dr",
                    "purpose": "reggeg",
                    "register": "2021-05-26T18:08:54.753Z"
                },
                {
                    "institution": "LIFE Lab, Learning Research and Development Center, University of Pittsburgh",
                    "bio": "researcher, programmer, data person. three linguists in a trenchcoat pretending to be a neuroscientist. she/her.",
                    "position": "Research Lab Coordinator",
                    "purpose": "Learn to work with the data my lab already hosts on this platform, run efficient analyses, and hopefully one day write some neuroimaging apps of my own.",
                    "register": "2021-05-26T20:39:30.926Z"
                },
                {
                    "institution": "University of the Philippines",
                    "bio": "Neuroscience enthusiast",
                    "position": "Student",
                    "purpose": "I want to start simple projects on publicly available brain imaging datasets",
                    "register": "2021-05-27T08:33:51.587Z"
                },
                {
                    "institution": "University of Toronto",
                    "bio": "Assistant Professor\nDepartment of Psychology",
                    "position": "Assistant Professor",
                    "purpose": "I will use brainlife.io to build and evaluate structural connectomes of individual participants and assess their relationship to learning ability.",
                    "register": "2021-05-27T15:23:59.643Z"
                },
                {
                    "institution": "Center for Body Computing",
                    "bio": "I am a project manager at the USC Center for Body Computing where we specialize in human performance optimization research.",
                    "position": "Project Manager",
                    "purpose": "Practice with EDA and machine learning techniques.",
                    "register": "2021-05-29T18:10:47.678Z"
                },
                {
                    "institution": "Indiana University",
                    "bio": "I am a neuroscientist interested in hippocampal function and white matter tract vulnerability in diseased condition.",
                    "position": "Postdoctoral Fellow",
                    "purpose": "Analyze research data to answer scientific question",
                    "register": "2021-05-29T18:15:33.491Z"
                },
                {
                    "institution": "Istanbul Medipol University",
                    "bio": "I am a teaching assistant. I finished my PhD in cognitive neuroscience",
                    "position": "Teaching assistant",
                    "purpose": "I wonder about new analysis techniques, and try to learn them",
                    "register": "2021-05-29T19:25:20.734Z"
                },
                {
                    "institution": "HIT",
                    "bio": "Student",
                    "position": "China",
                    "purpose": "Study and Research",
                    "register": "2021-05-30T12:44:50.645Z"
                },
                {
                    "institution": "Manipal Institute Of Technology",
                    "bio": "Student",
                    "position": "Student",
                    "purpose": "To get datasets",
                    "register": "2021-05-30T17:06:37.748Z"
                },
                {
                    "institution": "National Institute of informatics",
                    "bio": "https://researchmap.jp/yokoyamashigetoshi?lang=en",
                    "position": "Project Researcher",
                    "purpose": "I would like to build up RDM infra. using datalad as brainlife.io does. In order to do that I should learn how to do in this site.",
                    "register": "2021-05-31T01:05:44.515Z"
                },
                {
                    "institution": "Faculty of medicine Alexandria university",
                    "bio": "I am a neurology resident and neuroscience researcher. My master degree in neuroscience is about brain plasticity after stroke as shown by functional MRI studies and behavioural testing.",
                    "position": "neurology resident",
                    "purpose": "I am working on a thesis studying brain plasticity after stroke and I am using fMRI as a tool> I am expecting to gain more insight about the topic but seeing brainlife maps. Additionally, it will be a great opportunity to share our work in Alexandria university, Egypt.",
                    "register": "2021-05-31T04:31:23.421Z"
                },
                {
                    "institution": "University of Lisbon",
                    "bio": "Post-doctoral researcher at the Institute of Biophysics and Biomedical engineering in Lisbon, Portugal.",
                    "position": "Post-doc",
                    "purpose": "Organise data analysis, use as collaborative platform",
                    "register": "2021-06-01T09:35:04.01Z"
                },
                {
                    "institution": "BSC lab",
                    "bio": "PhD student",
                    "position": "Phd student",
                    "purpose": "use public toolboxes",
                    "register": "2021-06-01T11:05:02.66Z"
                },
                {
                    "institution": "University of Texas at Austin",
                    "bio": "Research Assistant at the University of Texas at Austin",
                    "position": "Research Assistant with the CogNeuro lab",
                    "purpose": "I hope to use the platform for data collection & analysis",
                    "register": "2021-06-01T20:59:55.62Z"
                },
                {
                    "institution": "University of Central Lancashire",
                    "bio": "since 2021 - Lecturer in Psychology @UCLan\n2019-2022 - principal investigater @OVGU, Magdeburg\n2016-2019 - PostDoc with Tino Zaehle @OVGU, Magdeburg\n2012-2016 - PostDoc with Nathan Weisz @CIMeC, Trento and @PLUS, Salzburg\n2012 - PhD @Uni Leizpig\n2008 - Diploma @Uni Leipzig",
                    "position": "Lecture in Psychology",
                    "purpose": "Store data (EEG/MEG/behavior) and analysis code, ready to share. so far I just want to try out the system if it is suitable for my needs",
                    "register": "2021-06-02T08:03:18.84Z"
                },
                {
                    "institution": "CNRS",
                    "bio": "I'm a biologist engineer in data analysis at the CNRS. I work in a shared department for “Methodological support to neuroimaging projects\" and with the working group on the data management policy and open science at the Centre.",
                    "position": "Research engineer",
                    "purpose": "Find if it is useful for our Centre.",
                    "register": "2021-06-02T14:13:01.382Z"
                },
                {
                    "institution": "INS, Aix Marseille University",
                    "bio": "I am working as a research engineer (Post doc) in the TNG, INS, Aix Marseille University. I will like to use the available resources and software as this project looks very exciting.",
                    "position": "Post Doc",
                    "purpose": "I expect to use the resources available to enhance my research findings.",
                    "register": "2021-06-03T08:44:34.838Z"
                },
                {
                    "institution": "IMT Atlantique",
                    "bio": "Professor at IMT Atlantique since 2015.",
                    "position": "Professor",
                    "purpose": "Research purpose on neuroimaging data.",
                    "register": "2021-06-03T12:33:28.033Z"
                },
                {
                    "institution": "University of Connecticut Health Center",
                    "bio": "I am an MD/PhD Candidate at UConn Health. I was formerly a researcher at Brandeis University, where I got my BS and MS in neuroscience.",
                    "position": "MD/PhD Student",
                    "purpose": "I'm just trying to learn more about neuroscience and how to analyze brain imaging datasets.",
                    "register": "2021-06-03T16:32:17.767Z"
                },
                {
                    "institution": "KHAAL Neuro Services",
                    "bio": "I am an upcoming researcher whom hopes to indentify all procedures in necessary gap-filling and a more advanced imaging techniques",
                    "position": "Founder/ Chief Strategist",
                    "purpose": "I want brain life to guide or help me out in terms code writing that has to do with an implanted device connected to an external device.",
                    "register": "2021-06-04T13:43:59.331Z"
                },
                {
                    "institution": "king abdulaziz university",
                    "bio": "i am lecturer and researcher in kau university in computer science",
                    "position": "lecturer",
                    "purpose": "for research purpose",
                    "register": "2021-06-05T15:21:56.461Z"
                },
                {
                    "institution": "Department of Radiology and Tianjin Key Laboratory of Functional Imaging, Tianjin Medical University General Hospital, Tianjin 300052, P.R. China",
                    "bio": "It is committed to the research of combining medical image with artificial intelligence. At present,  we want to  achieve multimodal image conversion by using adversarial generation network , that a method in the field of computer vision",
                    "position": "postgraduate",
                    "purpose": "Realize data sharing and make common progress",
                    "register": "2021-06-06T03:04:43.367Z"
                },
                {
                    "institution": "University of California, Santa Barbara",
                    "bio": "N/A",
                    "position": "Student",
                    "purpose": "N/A",
                    "register": "2021-06-06T04:42:58.364Z"
                },
                {
                    "institution": "UNIST",
                    "bio": "hi I'm unist student",
                    "position": "undergraduated",
                    "purpose": "use in assignment",
                    "register": "2021-06-06T11:48:11.106Z"
                },
                {
                    "institution": "Me",
                    "bio": "Just an artist",
                    "position": "Self",
                    "purpose": "Art"
                },
                {
                    "institution": "wuhan university",
                    "bio": "xuahuechen",
                    "position": "PHD",
                    "purpose": "xuahuechen",
                    "register": "2021-06-07T02:55:22.757Z"
                },
                {
                    "institution": "yonsei university",
                    "bio": "cognitive psychologist",
                    "position": "researcher",
                    "purpose": "investigate cognitive function in the brain",
                    "register": "2021-06-07T08:23:02.321Z"
                },
                {
                    "institution": "Stanford",
                    "bio": "HI",
                    "position": "Student",
                    "purpose": "hope to analyse data",
                    "register": "2021-06-07T13:27:10.945Z"
                },
                {
                    "institution": "NIH NIDDK",
                    "bio": "I'm a summer research intern.",
                    "position": "Undergrad researcher",
                    "purpose": "I'd like to use the data to complete my summer research project at the NIH NIDDK.",
                    "register": "2021-06-07T17:07:53.813Z"
                },
                {
                    "institution": "Miranda House",
                    "bio": "A student interested in neuroscience",
                    "position": "Student",
                    "purpose": "For data analysis and furthering my understanding of brain function.",
                    "register": "2021-06-08T07:02:41.875Z"
                },
                {
                    "institution": "Vrije Universiteit Amsterdam",
                    "bio": "PhD Candidate in Social AI",
                    "position": "PhD Candidate",
                    "purpose": "I want to use this platform for my user study related to food desire.",
                    "register": "2021-06-08T11:37:13.237Z"
                },
                {
                    "institution": "Jadavpur University",
                    "bio": "CSE Undergrad.",
                    "position": "Student",
                    "purpose": "TBD",
                    "register": "2021-06-09T15:30:54.926Z"
                },
                {
                    "institution": "University of Minnesota",
                    "bio": "PhD student, Cognitive Science",
                    "position": "Student & researcher",
                    "purpose": "Playing around with neuro-imaging data to improve my understanding of how such datasets are structured and how they can be analyzed.",
                    "register": "2021-06-09T17:06:48.835Z"
                },
                {
                    "institution": "USC",
                    "bio": "Clinical Science PhD student studying cognitive resilience and brain health in aging.",
                    "position": "Graduate student",
                    "purpose": "I plan to use Brainlife as a resource for analyzing DWI data.",
                    "register": "2021-06-09T19:00:18.224Z"
                },
                {
                    "institution": "Arizona State University",
                    "bio": "Student of neuroscience",
                    "position": "Student",
                    "purpose": "Student of neuroscience",
                    "register": "2021-06-10T20:15:27.97Z"
                },
                {
                    "institution": "Ohio State University / B.M.S. College of Engineering",
                    "bio": "Working at B.M.S. College of Engineering",
                    "position": "Assistant Professor",
                    "purpose": "Will work on some projects on fMRI, MRI and DTI",
                    "register": "2021-06-12T12:03:48.099Z"
                },
                {
                    "institution": "NHGRI",
                    "bio": "Am a Translational Bioinformaticist working on Smith-Magenis syndrome.",
                    "position": "Guest Researcher",
                    "purpose": "Want to use the database for developing a Smith-Magenis syndrome network.",
                    "register": "2021-06-14T09:02:17.049Z"
                },
                {
                    "institution": "Grove City College",
                    "bio": "Research Student",
                    "position": "Student",
                    "purpose": "To analyze data to use for research purposes",
                    "register": "2021-06-15T16:06:16.225Z"
                },
                {
                    "institution": "Vanderbilt University",
                    "bio": "I am an undergraduate student interested in diffusion tractography.",
                    "position": "Undergraduate Research Assistant",
                    "purpose": "I am interested in using some of the available apps to learn about diffusion tractography pipelines.",
                    "register": "2021-06-16T17:04:42.893Z"
                },
                {
                    "institution": "University of Louisville",
                    "bio": "This person is a student",
                    "position": "graduate teaching assistant",
                    "purpose": "I expect I will use the tools in the brainlife to analyze data.",
                    "register": "2021-06-16T18:57:31.351Z"
                },
                {
                    "institution": "Clermont Auvergne University",
                    "bio": "PhD student in Medical Imaging",
                    "position": "PhD Student",
                    "purpose": "Automated brain structures segmentation",
                    "register": "2021-06-17T08:48:55.235Z"
                },
                {
                    "institution": "Wake Forest School of Medicine",
                    "bio": "1st year PhD student in Neuroscience focused on neuroimaging and clinical biomarkers of Alzheimer's disease",
                    "position": "Graduate Student",
                    "purpose": "Learn more about machine learning techniques to analyze and interpret neuroimaging data for ADRD research",
                    "register": "2021-06-17T13:59:09.356Z"
                }
            ];

        let dataTest = dataFileurl.map(data => {
            if(data.position) return data.position;
        });
        let ds = filter(dataTest,LabelNameMatch);
        console.log(ds);
        return res.send(dataFiltered);
    });
});

function filter(data,LabelNameMatch) {
    let labelCount = [];
    let labelRes = [];
    let labels = Object.keys(LabelNameMatch);
    let totalValidCount = 0;
    data.forEach(entry=> {
        if(entry && entry.toLowerCase() != "n/a" && entry.length > 1){
            totalValidCount++;
            for (const [label,value] of Object.entries(LabelNameMatch)) {
                if(value.some(query=> entry.toLowerCase().includes(query) || entry.toLowerCase() == query)) {
                    if(!labelRes.includes(label)) {
                        labelRes.push(label);
                        labelCount.push(0);
                    }
                    labelCount[labelRes.indexOf(label)] += 1;
                    if(label=="College Student") console.log(entry,label);
                    break;
                }
            }
        }
    });
    let OtherCount = totalValidCount - labelCount.reduce((a, b) => a + b, 0);
    labelRes.push("Other");
    labelCount.push(OtherCount);
    return {labelRes, labelCount};
}


module.exports = router;
