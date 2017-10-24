'use strict';
const express = require('express');
const router = express.Router();
const xss = require('xss');

const models = require('../models/index');

router
    .route('/register')
    .get((req, res) => {
        res.render('user/register', {});
    })
    .post((req, res) => {
        let userData = {
            username: xss(req.body.email),
            password: xss(req.body.password)
        };

        // check if this email address already exists
        // we can't use findOrCreate here because the password changes
        // each time we hash it, which sequelize sees as a new user :(
        models.Users
            .findOne({ where: { username: userData.username } })
            .then(user => {
                if (!user) {
                    // no user found, so make a new one
                    models.Users
                        .create(userData)
                        .then(newUser => {
                            res.send(newUser);
                        })
                        .catch(err => {
                            res.send(err);
                        });
                } else {
                    // this user already exists
                    res.send('username already taken');
                }
            })
            .catch(err => {
                res.send(err);
            });
    });

module.exports = router;
