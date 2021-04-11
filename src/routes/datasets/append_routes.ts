import express from 'express';
import Joi from 'joi';
import { AuthenticatedRoute } from 'types/requestTypes';

import authCheck from '../../middleware/authCheck';
import datasetsServiceCheck from '../../middleware/datasetsServiceCheck';
import Append from '../../models/dataset_append';

const router = express.Router();

const LogSchema = Joi.object({
  userId: Joi.string(),
  datasetId: Joi.string(),
  beginningRowCount: Joi.number(),
  endingRowCount: Joi.number(),
});

router.use('/log', datasetsServiceCheck);
router.post('/log', async (req, res) => {
  try {
    await LogSchema.validateAsync(req.body);
  } catch (e) {
    res.status(400).json(e);
  }

  const { userId, datasetId, beginningRowCount, endingRowCount } = req.body;

  try {
    const doc = Append.create({
      userId,
      datasetId,
      beginningRowCount,
      endingRowCount,
    });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

router.get('/:datasetId', authCheck, async (req: AuthenticatedRoute, res) => {
  try {
    const docs = await Append.find({
      datasetId: req.params.datasetId,
    })
      .lean()
      .exec();

    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

module.exports = router;
