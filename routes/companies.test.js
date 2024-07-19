const request = require("supertest");
const app = require("../app");

process.env.NODE_ENV = "test";
const db = require("../db");

beforeEach(async () => {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");

    await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.')");
    await db.query("INSERT INTO companies VALUES ('ibm', 'IBM', 'Big blue.')");
});

afterAll(async () => {
    await db.end();
});

test("GET /companies", async () => {
    const response = await request(app).get("/companies");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
        companies:
            [
                {
                    code: "apple",
                    name: "Apple Computer"
                },
                {
                    code: "ibm",
                    name: "IBM"
                }
            ]
    });
})


test("GET /companies/:code", async () => {
    const response = await request(app).get("/companies/ibm");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
        company: {
            code: "ibm",
            name: "IBM",
            description: "Big blue."
        }
    });
})


test("GET /companies/:code not found", async () => {
    const response = await request(app).get("/companies/not-found");
    expect(response.statusCode).toEqual(404);
})

test("POST /companies", async () => {
    const response = await request(app).post("/companies").send({
        name: "Test Company", description: "Test Description" });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
        company: {
            code: "test-company",
            name: "Test Company",
            description: "Test Description"
        }
    });
})

test("PUT /companies/:code", async () => {
    const response = await request(app).put("/companies/ibm").send({
        name: "Test Company", description: "Test Description" });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
        company: {
            code: "ibm",
            name: "Test Company",
            description: "Test Description"
        }
    });
})

test("PUT /companies/:code not found", async () => {
    const response = await request(app).put("/companies/not-found").send({
        name: "Test Company", description: "Test Description" });
    expect(response.statusCode).toEqual(404);
})

test("DELETE /companies/:code", async () => {
    const response = await request(app).delete("/companies/ibm");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
})

test("DELETE /companies/:code not found", async () => {
    const response = await request(app).delete("/companies/not-found");
    expect(response.statusCode).toEqual(404);
})