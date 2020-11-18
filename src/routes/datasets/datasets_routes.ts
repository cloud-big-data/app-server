import express from 'express';
import csv from 'csvtojson';
import expressUpload from 'express-fileupload';
import parseFormData from './lib/parseFormData';
import aws from 'aws-sdk';
import Dataset from '../../models/dataset';
import * as R from 'ramda';

const router = express.Router();

const awsConfig = new aws.Config({
  region: 'us-west-1',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3(awsConfig);

router.use(expressUpload());

router.get('/', async (req: any, res) => {
  const datasets = await Dataset.find({
    userId: req.user._id.toString(),
  }).lean().exec()

  return res.json(datasets);
})

router.get('/:datasetId', async (req: any, res) => {
  const { datasetId } = req.params;
  const dataset = await Dataset.findById(datasetId).lean().exec()
  const s3Params = {
    Bucket: 'skyvue-datasets',
    Key: `${req.user._id}-${datasetId}`
  }
  const head = await s3.headObject(s3Params).promise();

  return res.json({ dataset, head });
})

router.patch('/:datasetId', async (req: any, res) => {
  await Dataset.findByIdAndUpdate(req.params.datasetId, req.body).lean().exec();
  return res.sendStatus(200);
})

router.delete('/:datasetId', async (req: any, res) => {
  try {
    await Dataset.findByIdAndDelete(req.params.datasetId).lean().exec();
    const s3Params = {
      Bucket: 'skyvue-datasets',
      Key: `${req.user._id}-${req.params.datasetId}`
    }
    await s3.deleteObject(s3Params).promise();

    return res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(500);
  }
})

router.post('/upload', async (req: any, res) => {
  const csvAsJson: Array<any> = await csv().fromString(req.files.csv.data.toString('utf8'));
  const userId = req.user._id.toString();
  const { name } = req.files.csv;
  const fileName = name.substring(0, name.length - '.csv'.length);
  const boardData = parseFormData(fileName, userId, csvAsJson);

  const dataset = new Dataset({
    userId,
    title: fileName,
    visibilitySettings: boardData.visibilitySettings,
  })

  await dataset.save();

  const s3Params = {
    Bucket: 'skyvue-datasets',
    Key: `${userId}-${dataset._id}`,
    Body: JSON.stringify(R.omit(['title'], boardData)),
    ContentType: 'application/json',
  };

  await s3.putObject(s3Params).promise();

  res.sendStatus(200);
});

module.exports = router;
