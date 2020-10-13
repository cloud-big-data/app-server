const express = require('express');

const router = new express.Router();

import User from '../../models/user';

const Joi = require('joi');
const bcrypt = require('bcrypt');
const saltRounds = 10;

import stripeService from "../../services/stripeService";
import * as EmailValidator from 'email-validator';
import createTokens from "./lib/createTokens";
import verifyRefreshToken from './lib/verifyRefreshToken';

/**
 * /auth/user routes
 */

router.post('/create', async (req, res) => {
  const reqSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.number(),
  });

  try {
    await reqSchema.validateAsync(req.body);
  } catch (err) {
    res.status(400).json({
      error: 'Missing parameters',
    });
  }

  const { email, password, firstName, lastName, phone } = req.body;

  const emailValid = EmailValidator.validate(email);
  if (!emailValid) {
    return res.status(400).json({
      error: "email_invalid",
    })
  }

  const hash = await bcrypt.hash(password, saltRounds);
  
  let user;
  try {
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hash,
    });

    await user.save();
  } catch(e) {
    console.error(e);

    if (e.code === 11000) {
      return res.status(400).json({ error: "email_exists" });
    }
    
    return res.status(400).json({ error: "unknown_error" });
  }

  const stripeCustomer = await stripeService.createCustomer({
    email,
    name: `${firstName} ${lastName}`,
    phone,
  });

  await User.findByIdAndUpdate(user._id, {
    stripeId: stripeCustomer.id,
  }).exec();

  const { refreshToken, accessToken } = createTokens({
    userId: user._id,
    email,
    count: 0,
  })

  return res.status(200).json({
    refreshToken,
    accessToken
  });
});


router.post('/login', async (req, res) => {
  const reqSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  });

  try {
    await reqSchema.validateAsync(req.body);
  } catch (err) {
    res.status(400).json({
      error: 'Missing parameters',
    });
  }

  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  }).exec();

  if (!user) {
    return res.status(400).json({ error: "bad_login" });
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    return res.status(400).json({ error: "bad_login" });
  }

  const userWithUpdatedCount = await User.findByIdAndUpdate(user._id, {
    refreshAuthCount: user.refreshAuthCount + 1,
  }, { new: true }).exec();

  const { refreshToken, accessToken } = createTokens({
    userId: user._id,
    email,
    count: userWithUpdatedCount.refreshAuthCount,
  });

  return res.status(200).json({ refreshToken, accessToken });
})

router.post('/refresh', async (req, res) => {
  const reqSchema = Joi.object({
    refreshToken: Joi.string().required(),
  })

  try {
    await reqSchema.validateAsync(req.body);
  } catch (err) {
    res.status(400).json({
      error: 'Missing parameters',
    });
  }

  const { refreshToken } = req.body;
  const decodedRefreshToken = verifyRefreshToken(refreshToken, process.env.JWT_SECRET);

  if (decodedRefreshToken.error) {
    return res.json({
      error: decodedRefreshToken.name,
    })
  }

  const user = await User.findById(decodedRefreshToken.userId).lean().exec();
  if (user.refreshAuthCount !== decodedRefreshToken.count) {
    return res.status(401).json({ error: 'Authorization error' })
  }

  const userWithUpdatedCount = await User.findByIdAndUpdate(user._id, {
    refreshAuthCount: user.refreshAuthCount + 1,
  }, { new: true }).exec();
  
  const newTokens = createTokens({
    userId: user._id,
    email: decodedRefreshToken.email,
    count: userWithUpdatedCount.refreshAuthCount,
  });

  res.json({ ...newTokens });
})

router.post('/revokeToken', async (req, res) => {
  const reqSchema = Joi.object({
    userId: Joi.string().required(),
  })

  try {
    await reqSchema.validateAsync(req.body);
  } catch (err) {
    res.status(400).json({
      error: 'Missing parameters',
    });
  }

  const { userId } = req.body;
  const user = await User.findById(userId).lean().exec();

  await User.findByIdAndUpdate(userId, {
    refreshAuthCount: user.refreshAuthCount + 1,
  }).exec();

  res.sendStatus(200);
})

module.exports = router;
