const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT id, comp_code FROM invoices`);
        return res.json({invoices: results.rows});
    } catch (err) {
        return next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const results = await db.query(
            `SELECT id, amt, paid, add_date, paid_date, comp_code
             FROM invoices
             WHERE id = $1`, [id]);
        const invoice = results.rows[0];
        if (!invoice) throw new ExpressError(`Can't find invoice: ${id}`, 404);
        const comp_code = invoice.comp_code;
        const company_results = await db.query(
            `SELECT code, name, description
             FROM companies
             WHERE code = $1`, [comp_code]);
        invoice.company = company_results.rows[0];
        delete invoice.comp_code;
        return res.json({invoice: invoice});
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, add_date, paid, paid_date`,
            [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]});
    } catch (err) {
        return next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const { amt, paid } = req.body;
        let results = await db.query(
            `SELECT paid, paid_date FROM invoices
             WHERE id = $1`, [id]);
        if (!results.rows[0]) throw new ExpressError(`Can't find invoice: ${id}`, 404);
        let paid_date;
        if (results.rows[0].paid_date && paid) {
            paid_date = results.rows[0].paid_date;
        } else if (results.rows[0].paid && !paid) {
            paid_date = null;
        } else if (!results.rows[0].paid && paid) {
            paid_date = new Date().toUTCString();
        }
        results = await db.query(
            `UPDATE invoices
             SET amt=$1, paid=$2, paid_date=$3
             WHERE id=$4
             RETURNING id, comp_code, amt, add_date, paid, paid_date`,
            [amt, paid, paid_date, id]);
        return res.json({invoice: results.rows[0]});
    } catch (err) {
        return next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const results = await db.query(
            `DELETE FROM invoices
             WHERE id = $1
             RETURNING id`,
            [id]);
        if (!results.rows[0]) throw new ExpressError(`Can't find invoice: ${id}`, 404);
        return res.json({status: "deleted"});
    } catch (err) {
        return next(err);
    }
});

router.get('/companies/:code', async (req, res, next) => {  
    try {
        const code = req.params.code;
        const results = await db.query(
            `SELECT code, name, description
             FROM companies
             WHERE code = $1`, [code]);
        if (!results.rows[0]) throw new ExpressError(`Can't find company: ${code}`, 404);
        const company = results.rows[0];
        const invoice_results = await db.query(
            `SELECT *
             FROM invoices
             WHERE comp_code = $1`, [company.code]);
        company.invoices = invoice_results.rows;
        return res.json({company: company});
    } catch (err) {
        return next(err);
    }   
});

module.exports = router;
