const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');

router.post('/', async (req, res, next) => {
    try {
        const { industry } = req.body;
        const code = slugify(industry, {lower: true});
        const results = await db.query(
            `INSERT INTO industries (code, industry)
             VALUES ($1, $2)
             RETURNING code, industry`, [code, industry]);
        return res.status(201).json({industry: results.rows[0]});
    } catch (err) {
        return next(err);
    }
});

module.exports = router