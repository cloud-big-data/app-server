import express from 'express';
import csv from 'csvtojson';
import expressUpload from 'express-fileupload';
import aws from 'aws-sdk';
import * as R from 'ramda';
import { AuthenticatedRoute } from 'types/requestTypes';
import authCheck from '../../middleware/authCheck';
import parseFormData from './lib/parseFormData';
import Dataset from '../../models/dataset';

const router = express.Router();

const spacesEndpoint = new aws.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
});

router.use(authCheck);
router.use(expressUpload());

router.get('/', async (req: AuthenticatedRoute, res) => {
  const datasets = await Dataset.find({
    userId: req.user?._id.toString(),
  })
    .lean()
    .exec();

  return res.json(datasets);
});

router.get('/:datasetId', async (req: AuthenticatedRoute, res) => {
  const { datasetId } = req.params;
  try {
    const dataset = await Dataset.findById(datasetId).lean().exec();
    const s3Params = {
      Bucket: 'skyvue-datasets',
      Key: datasetId.toString(),
    };
    const head = await s3.headObject(s3Params).promise();
    res.json({ dataset, head });
  } catch (e) {
    res.status(404).json({});
  }
});

router.patch('/:datasetId', async (req: AuthenticatedRoute, res) => {
  try {
    await Dataset.findByIdAndUpdate(req.params.datasetId, req.body).lean().exec();
  } catch (e) {
    return res.status(400).json({ error: e });
  }
  return res.sendStatus(200);
});

router.delete('/:datasetId', async (req: AuthenticatedRoute, res) => {
  try {
    await Dataset.findByIdAndDelete(req.params.datasetId).lean().exec();
    const s3Params = {
      Bucket: 'skyvue-datasets',
      Key: req.params.datasetId.toString(),
    };
    await s3.deleteObject(s3Params).promise();

    return res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(400);
  }
});

router.post('/duplicate/:datasetId', async (req: AuthenticatedRoute, res) => {
  const { newTitle, raw } = req.body;
  const { datasetId } = req.params;

  if (!datasetId || !req.user._id) res.sendStatus(400);

  const current = await Dataset.findById(datasetId).lean().exec();
  const newDataset = new Dataset({
    userId: req.user._id,
    title: newTitle ?? `${current.title} (copy)`,
    visibilitySettings: {
      owner: req.user._id,
    },
  });

  await newDataset.save();

  if (raw) {
    const s3Params = {
      Bucket: 'skyvue-datasets',
      Key: current._id.toString(),
    };
    const s3Res = await s3.getObject(s3Params).promise();
    const currentBoardData = JSON.parse(s3Res.Body.toString('utf-8'));

    try {
      await s3
        .putObject({
          ...s3Params,
          Key: newDataset._id.toString(),
          Body: JSON.stringify(R.omit(['title'], currentBoardData)),
          ContentType: 'application/json',
        })
        .promise();
    } catch (e) {
      console.log(e);
      return res.sendStatus(400);
    }
  }

  res.json(newDataset);
});

router.post('/upload', async (req: AuthenticatedRoute, res) => {
  const csvAsJson: Array<any> = await csv().fromString(
    // @ts-ignore
    req.files.csv.data.toString('utf8'),
  );
  const userId = req.user._id.toString();
  // @ts-ignore
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
    Key: dataset._id.toString(),
    Body: JSON.stringify(R.omit(['title'], boardData)),
    ContentType: 'application/json',
  };

  try {
    await s3.putObject(s3Params).promise();
    res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    res.sendStatus(400);
  }
});

module.exports = router;
