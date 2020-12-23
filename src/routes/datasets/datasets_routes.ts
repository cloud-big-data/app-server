import express from 'express';
import csv from 'csvtojson';
import expressUpload from 'express-fileupload';
import aws from 'aws-sdk';
import * as R from 'ramda';
import parseFormData from './lib/parseFormData';
import Dataset from '../../models/dataset';

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
  })
    .lean()
    .exec();

  return res.json(datasets);
});

router.get('/:datasetId', async (req: any, res) => {
  const { datasetId } = req.params;
  const dataset = await Dataset.findById(datasetId).lean().exec();
  const s3Params = {
    Bucket: 'skyvue-datasets',
    Key: `${req.user._id}-${datasetId}`,
  };
  try {
    const head = await s3.headObject(s3Params).promise();
    res.json({ dataset, head });
  } catch (e) {
    console.log(e, `${req.user._id}-${datasetId}`);
    res.sendStatus(500);
  }
});

router.patch('/:datasetId', async (req: any, res) => {
  await Dataset.findByIdAndUpdate(req.params.datasetId, req.body).lean().exec();
  return res.sendStatus(200);
});

router.delete('/:datasetId', async (req: any, res) => {
  try {
    await Dataset.findByIdAndDelete(req.params.datasetId).lean().exec();
    const s3Params = {
      Bucket: 'skyvue-datasets',
      Key: `${req.user._id}-${req.params.datasetId}`,
    };
    await s3.deleteObject(s3Params).promise();

    return res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(500);
  }
});

router.post('/upload', async (req: any, res) => {
  const csvAsJson: Array<any> = await csv().fromString(
    req.files.csv.data.toString('utf8'),
  );
  const userId = req.user._id.toString();
  const { name } = req.files.csv;
  const fileName = name.substring(0, name.length - '.csv'.length);
  const boardData = parseFormData(fileName, userId, csvAsJson);

  const dataset = new Dataset({
    userId,
    title: fileName,
    visibilitySettings: boardData.visibilitySettings,
  });

  await dataset.save();

  const s3Params = {
    Bucket: 'skyvue-datasets',
    Key: `${userId}-${dataset._id}`,
    Body: JSON.stringify(R.omit(['title'], boardData)),
    ContentType: 'application/json',
  };

  try {
    await s3.putObject(s3Params).promise();
    res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
