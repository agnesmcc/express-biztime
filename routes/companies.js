const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT code, name
             FROM companies
             ORDER BY name`);
        return res.json({companies: results.rows});
    } catch (err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const results = await db.query(
            `SELECT c.code, c.name, c.description, i.industry
             FROM companies c
             JOIN industries_companies ic ON c.code = ic.company
             JOIN industries i ON ic.industry = i.code
             WHERE c.code = $1`, [code]);
        const company = {
            code: results.rows[0].code,
            name: results.rows[0].name,
            description: results.rows[0].description,
            industries: results.rows.map(row => row.industry)
        };
        if (!company) throw new ExpressError(`Can't find company: ${code}`, 404);
        return res.json({company: company});
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        console.log(req.body)
        const { name, description } = req.body;
        const code = slugify(name, {lower: true});
        const results = await db.query(
            `INSERT INTO companies (code, name, description)
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
            [code, name, description]);
        return res.status(201).json({company: results.rows[0]});
    } catch (err) {
        return next(err);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const { name, description } = req.body;
        results = await db.query(
            `UPDATE companies
             SET name=$1, description=$2
             WHERE code=$3
             RETURNING code, name, description`,
            [name, description, code]);
        if (!results.rows[0]) throw new ExpressError(`Can't find company: ${code}`, 404);
        return res.json({company: results.rows[0]});
    } catch (err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const results = await db.query(
            `DELETE FROM companies
             WHERE code = $1
             RETURNING code`,
            [code]);
        if (!results.rows[0]) throw new ExpressError(`Can't find company: ${code}`, 404);
        return res.json({status: "deleted"});
    } catch (err) {
        return next(err);
    }
});

module.exports = router