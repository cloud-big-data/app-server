const express = require('express');

const router = new express.Router();

import User from '../../models/user';

const Joi = require('joi');
const bcrypt = require('bcrypt');
const saltRounds = 10;

import stripeService from "../../services/stripeService";
import * as EmailValidator from 'email-validator';
import createTokens from "./lib/createTokens";

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
      message: 'Missing parameters',
    });
  }

  const { email, password, firstName, lastName, phone } = req.body;

  const emailValid = EmailValidator.validate(email);
  if (!emailValid) {
    return res.status(400).json({
      message: "email_invalid",
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
      return res.status(400).json({ message: "email_exists" });
    }
    
    return res.status(400).json({ message: "unknown_error" });
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
      message: 'Missing parameters',
    });
  }

  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  }).exec();

  if (!user) {
    return res.status(400).json({ message: "bad_login" });
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    return res.status(400).json({ message: "bad_login" });
  }

  const userWithUpdatedCount = await User.findByIdAndUpdate(user._id, {
    refreshAuthCount: user.refreshAuthCount + 1,
  }).exec();

  const { refreshToken, accessToken } = createTokens({
    userId: user._id,
    email,
    count: userWithUpdatedCount.refreshAuthCount,
  });

  return res.status(200).json({ refreshToken, accessToken });
})

module.exports = router;
