const express = require('express');

const router = express.Router();

import User from '../../models/user';

const Joi = require('joi');
const bcrypt = require('bcrypt');
const saltRounds = 12;

import stripeService from "../../services/stripeService";
import * as EmailValidator from 'email-validator';
import createTokens from "./lib/createTokens";
import makePasswordResetToken from './lib/makePasswordResetToken';
import moment from 'moment';
import refreshUser from './lib/refreshUser';
import emailService from '../../services/emailService';
import jwt from 'jsonwebtoken';

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
    lastLoggedIn: moment().format(),
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
  const { error, ...newTokens } = await refreshUser(refreshToken);

  if (error) {
    return res.json(error)
  }

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

router.post('/forgot_password', async (req, res) => {
  const reqSchema = Joi.object({
    email: Joi.string().required(),
  })

  await reqSchema.validateAsync(req.body);

  const { email } = req.body;
  const user = await User.findOne({ email }).lean().exec();
  if (!user) return res.sendStatus(200);

  const passwordResetToken = makePasswordResetToken(user._id);
  const baseUrl = process.env.ENVIRONMENT === 'dev' ? 'http://localhost:3000' : 'https://app.skyvue.io';
  emailService.sendMail({
    from: 'admin@skyvue.io',
    to: email,
    subject: `Your Skyvue.io password reset link`,
    html: `
    <p>Skyvue.io received a request to reset your password. If you did not make this request, change your password immediately.</p>
    <a href="${baseUrl}/forgot_password/${passwordResetToken}">Click here</a> to reset your password.
    <br>
    <p>Link not working? Copy and paste this directly into your browser:
    <br>
    ${baseUrl}/forgot_password/${passwordResetToken}</p>
    `.trim(),
  })

  return res.sendStatus(200);
})

router.post('/forgot_password_validity', async (req, res) => {
  const reqSchema = Joi.object({
    token: Joi.string().required(),
  })

  await reqSchema.validateAsync(req.body);

  const { token } = req.body;

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    console.log(e);
    if (e.name === 'TokenExpiredError') {
      return res.json({ error: "token_expired" });
    }
    return res.status(500).json({ error: "unknown" });
  }

  return res.sendStatus(200);
})

router.post('/change_password', async (req, res) => {
  const reqSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().required(),
  })

  await reqSchema.validateAsync(req.body);
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.json({ error: "Passwords do not match" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    console.log(e);
    if (e.name === 'TokenExpiredError') {
      return res.json({ error: "token_expired" });
    }
    return res.status(500).json({ error: "token_invalid" });
  }

  const { userId } = jwt.decode(token) as { userId: string };
  
  const hash = await bcrypt.hash(password, saltRounds);
  await User.findByIdAndUpdate(
    userId,
    {
      password: hash,
    }
  )
    .lean()
    .exec();
  
  res.json({ success: true });
})


module.exports = router;
