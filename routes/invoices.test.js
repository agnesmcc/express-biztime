const request = require("supertest");
const app = require("../app");

process.env.NODE_ENV = "test";
const db = require("../db");

beforeEach(async () => {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
    
    await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.')");
    await db.query("INSERT INTO companies VALUES ('ibm', 'IBM', 'Big blue.')");

    await db.query("INSERT INTO invoices (comp_code, amt) VALUES ('apple', 100)");
    await db.query("INSERT INTO invoices (comp_code, amt) VALUES ('apple', 200)");
    await db.query("INSERT INTO invoices (comp_code, amt) VALUES ('ibm', 300)");
});

afterAll(async () => {
    await db.end();
});

test("GET /invoices", async () => {
    const response = await request(app).get("/invoices");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
        invoices:
            [
                {
                    id: expect.any(Number),
                    comp_code: "apple"
                },
                {
                    id: expect.any(Number),
                    comp_code: "apple"
                },
                {
                    id: expect.any(Number),
                    comp_code: "ibm"
                }
            ]
    });
})

test("GET /invoices/:id", async () => {
    const invoice1 = await db.query("SELECT * FROM invoices");
    const response = await request(app).get(`/invoices/${invoice1.rows[0].id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body.invoice).toHaveProperty('amt', 100);
    expect(response.body.invoice.company).toHaveProperty('code', 'apple');
})

test("GET /invoices/:id not found", async () => {
    const response = await request(app).get("/invoices/0");
    expect(response.statusCode).toEqual(404);
})

test("POST /invoices", async () => {
    const response = await request(app).post("/invoices").send({
        comp_code: "apple", amt: 100
    });
    expect(response.statusCode).toEqual(201);
    expect(response.body.invoice).toHaveProperty('amt', 100);
    expect(response.body.invoice).toHaveProperty('comp_code', 'apple');
})

test("PUT /invoices/:id", async () => {
    const invoice1 = await db.query("SELECT * FROM invoices");
    const response = await request(app).put(`/invoices/${invoice1.rows[0].id}`).send({
        comp_code: "apple", amt: 100
    });
    expect(response.statusCode).toEqual(200);
    expect(response.body.invoice).toHaveProperty('amt', 100);
    expect(response.body.invoice).toHaveProperty('comp_code', 'apple');
})

test("DELETE /invoices/:id", async () => {
    const invoice1 = await db.query("SELECT * FROM invoices");
    const response = await request(app).delete(`/invoices/${invoice1.rows[0].id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
})

test("GET /invoices/companies/:code", async () => {
    const response = await request(app).get("/invoices/companies/ibm");
    expect(response.statusCode).toEqual(200);
    expect(response.body.company).toHaveProperty('code', 'ibm');
})

test("GET /invoices/companies/:code not found", async () => {
    const response = await request(app).get("/invoices/companies/not-found");
    expect(response.statusCode).toEqual(404);
})