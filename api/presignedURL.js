const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Read the AWS secret access key from the aws.key file
const secretAccessKey = fs.readFileSync(path.join(__dirname, 'config', 'aws.key'), 'utf8').trim();

// Configure AWS with credentials and region
const s3 = new AWS.S3({
    accessKeyId: 'FQAQ3RWRSCR6POF2NCQC',
    secretAccessKey: secretAccessKey,
    endpoint: 'https://s3.msi.umn.edu',
    s3ForcePathStyle: true,
    region: 'us-east-1'
});

// Function to list objects in a bucket
const listObjects = async (bucketName) => {
    const params = {
        Bucket: bucketName
    };

    try {
        const data = await s3.listObjectsV2(params).promise();
        console.log('Objects in bucket:', data.Contents);

        // Filter the objects to only show zarr files
        // const zarrFiles = data.Contents.filter(obj => obj.Key.endsWith('.zarr'));
        // console.log('Zarr files in bucket:', zarrFiles);
    } catch (err) {
        console.error('Error listing objects:', err);
    }
};

// Function to generate a presigned URL for an S3 object
const generatePresignedURL = (bucketName, key, expiresIn) => {
    const params = {
        Bucket: bucketName,
        Key: key,
        Expires: expiresIn
    };

    return s3.getSignedUrl('getObject', params);
};

const bucketName = 'midb-cmc-nonhuman';
const key = 'PS-OCT/KQRH/3D Tiles/A1A2/slice_155_tile_33_CH1.mat';
const expiresIn = 60 * 10; // URL expires in 10 minutes

const url = generatePresignedURL(bucketName, key, expiresIn);
console.log('Presigned URL:', url);

// listObjects(bucketName);
