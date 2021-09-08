import express from 'express';
import expressUpload from 'express-fileupload';
import aws from 'aws-sdk';
import * as R from 'ramda';
import { AuthenticatedRoute } from 'types/requestTypes';
import { v4 as uuid } from 'uuid';
import datasetService from '../../services/datasetService';
import authCheck from '../../middleware/authCheck';
import Dataset from '../../models/dataset';
import m from '../../models';

const router = express.Router();

const s3 = new aws.S3({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESSKEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESSKEY,
});

router.use(authCheck);
router.use(expressUpload());

router.param('datasetId', async (req: AuthenticatedRoute, res, next) => {
  const dataset = await m.Dataset.findById(req.params.datasetId);
  if (!dataset) {
    return res.sendStatus(404);
  }

  req.dataset = dataset;

  const { visibilitySettings } = dataset;

  const checkPrivileges = (key: 'editors' | 'viewers' | 'owner') =>
    visibilitySettings[key].includes(req.user._id.toString());

  const userIs = {
    editor: checkPrivileges('editors'),
    viewer: checkPrivileges('viewers'),
    owner: visibilitySettings.owner === req.user._id.toString(),
  };

  const handleMethod = (truthCase: boolean) =>
    truthCase ? next() : res.sendStatus(403);

  switch (req.method) {
    case 'GET':
      return handleMethod(
        userIs.editor || userIs.viewer || visibilitySettings.isPublic,
      );
    case 'PATCH':
      return handleMethod(userIs.editor || userIs.owner);
    case 'DELETE':
      return handleMethod(userIs.owner);
    case 'POST':
      return handleMethod(userIs.owner || userIs.editor);
    case 'PUT':
      return handleMethod(userIs.owner || userIs.editor);
    default:
      return res.sendStatus(403);
  }
});

router.get('/', async (req: AuthenticatedRoute, res) => {
  const datasets = await Dataset.find({
    userId: req.user?._id.toString(),
  })
    .lean()
    .exec();

  return res.json(datasets);
});

router.post('/make_dataset_upload_url', async (req: AuthenticatedRoute, res) => {
  const { title } = req.body;
  const userId = req.user._id;

  const dataset = new Dataset({
    userId,
    title,
    visibilitySettings: {
      owner: userId,
      editors: [userId],
      viewers: [],
    },
  });

  s3.createPresignedPost(
    {
      Fields: {
        key: `${dataset._id}/0`,
      },
      Conditions: [['starts-with', '$Content-Type', 'text/']],
      Expires: 3600,
      Bucket: 'skyvue-datasets-queue',
    },
    async (error, signed) => {
      if (error) {
        return res.status(500).json({ error: 'Upload error' });
      }

      await dataset.save();
      res.json(signed);
    },
  );
});

router.post(
  '/make_dataset_append_url/:datasetId',
  async (req: AuthenticatedRoute, res) => {
    const { datasetId } = req.params;

    s3.createPresignedPost(
      {
        Fields: {
          key: `${datasetId}/0`,
        },
        Conditions: [['starts-with', '$Content-Type', 'text/']],
        Expires: 30,
        Bucket: 'skyvue-datasets-appends',
      },
      async (error, signed) => {
        if (error) {
          return res.status(500).json({ error: 'Upload error' });
        }

        res.json(signed);
      },
    );
  },
);

router.post('/make_dataset_preview_url', async (req: AuthenticatedRoute, res) => {
  const _id = uuid();
  s3.createPresignedPost(
    {
      Fields: {
        key: _id,
      },
      Conditions: [['starts-with', '$Content-Type', 'text/']],
      Expires: 30,
      Bucket: 'skyvue-upload-previews',
    },
    async (error, signed) => {
      if (error) {
        return res.status(500).json({ error: 'Upload error' });
      }

      res.json({
        _id,
        ...signed,
      });
    },
  );
});

router.post('/process_dataset', async (req: AuthenticatedRoute, res) => {
  const { body } = req;
  const { key } = body;
  if (!key) return res.sendStatus(400);

  try {
    res.sendStatus(200);

    await datasetService.post('/datasets/process_dataset', {
      key,
      userId: req.user._id,
    });
  } catch (e) {
    console.error('error in processing dataset', e);
    res.sendStatus(500);
  }
});

router.get('/:datasetId', async (req: AuthenticatedRoute, res) => {
  const { datasetId } = req.params;
  try {
    const dataset = await Dataset.findById(datasetId).lean().exec();
    const s3Params = {
      Bucket: 'skyvue-datasets',
      Key: `${datasetId.toString()}/columns/0`,
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

// deprecated
router.post('/duplicate/:datasetId', async (req: AuthenticatedRoute, res) => {
  const { newTitle } = req.body;
  const { datasetId } = req.params;

  if (!datasetId) res.sendStatus(400);
  if (!req.dataset) res.sendStatus(500);

  const newDataset = new Dataset({
    isProcessing: true,
    userId: req.user._id,
    title: newTitle ?? `${req.dataset.title} (copy)`,
    visibilitySettings: {
      owner: req.user._id,
      editors: [req.user._id],
      isPublic: false,
    },
  });

  await datasetService.post('/datasets/jobs/duplicateDataset', {
    oldDatasetId: datasetId,
    newDatasetId: newDataset._id,
  });

  newDataset.isProcessing = false;
  await newDataset.save();

  res.json(newDataset);
});

module.exports = router;
