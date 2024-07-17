const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

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
            `SELECT code, name, description
             FROM companies
             WHERE code = $1`, [code]);
        const company = results.rows[0];
        if (!company) throw new ExpressError(`Can't find company: ${code}`, 404);
        return res.json({company: company});
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        console.log(req.body)
        const { code, name, description } = req.body;
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