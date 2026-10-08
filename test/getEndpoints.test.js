const { expect } = require("chai");
const request = require("supertest");
const sinon = require("sinon");
const { ObjectId } = require("mongodb");

const mongodb = require("../data/database");
const app = require("../app");

const bookId = new ObjectId();
const authorId = new ObjectId();
const categoryId = new ObjectId();
const memberId = new ObjectId();

const seed = {
  books: [
    {
      _id: bookId,
      title: "The Hobbit",
      isbn: "978-0-00-000002-0",
      authorId: "A001",
      categoryId: "C001",
      publishedYear: 1937,
      pages: 310,
      summary: "Bilbo Baggins goes on an unexpected adventure.",
    },
  ],
  authors: [
    {
      _id: authorId,
      firstName: "J.R.R.",
      lastName: "Tolkien",
      birthDate: "1892-01-03",
      nationality: "British",
      biography: "English writer and philologist.",
      books: ["B001"],
      awards: ["International Fantasy Award"],
    },
  ],
  categories: [
    {
      _id: categoryId,
      name: "Fantasy",
      description: "Stories set in imaginary worlds with magic and adventure.",
    },
  ],
  members: [
    {
      _id: memberId,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      phone: "208-555-0101",
      membershipType: "Student",
    },
  ],
};

const stubDatabase = () =>
  sinon.stub(mongodb, "getDatabase").returns({
    collection: (name) => ({
      find: (query = {}) => ({
        toArray: async () => {
          const docs = seed[name] || [];

          if (query._id) {
            return docs.filter((doc) => String(doc._id) === String(query._id));
          }

          return docs;
        },
      }),
    }),
  });

describe("GET endpoint unit tests", () => {
  beforeEach(() => {
    stubDatabase();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("GET / returns the health check message", async () => {
    const res = await request(app).get("/");

    expect(res.status).to.equal(200);
    expect(res.text).to.include("Library Management API is running");
  });

  it("GET /books returns all books", async () => {
    const res = await request(app).get("/books");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].title).to.equal("The Hobbit");
  });

  it("GET /authors returns all authors", async () => {
    const res = await request(app).get("/authors");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].lastName).to.equal("Tolkien");
  });

  it("GET /categories returns all categories", async () => {
    const res = await request(app).get("/categories");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].name).to.equal("Fantasy");
  });

  it("GET /members returns all members", async () => {
    const res = await request(app).get("/members");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].email).to.equal("jane.doe@example.com");
  });

  it("GET /books/:id returns a single book", async () => {
    const res = await request(app).get(`/books/${bookId}`);

    expect(res.status).to.equal(200);
    expect(res.body.title).to.equal("The Hobbit");
    expect(res.body._id).to.equal(bookId.toHexString());
  });

  it("GET /categories/:id returns a single category", async () => {
    const res = await request(app).get(`/categories/${categoryId}`);

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal("Fantasy");
  });

  it("GET /authors/:id returns a single author", async () => {
    const res = await request(app).get(`/authors/${authorId}`);

    expect(res.status).to.equal(200);
    expect(res.body.lastName).to.equal("Tolkien");
  });

  it("GET /members/:id returns a single member", async () => {
    const res = await request(app).get(`/members/${memberId}`);

    expect(res.status).to.equal(200);
    expect(res.body.email).to.equal("jane.doe@example.com");
  });

  it("GET /books/:id returns 400 for an invalid id", async () => {
    const res = await request(app).get("/books/not-a-valid-id");

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid book ID.");
  });

  it("GET /members/:id returns 400 for an invalid id", async () => {
    const res = await request(app).get("/members/not-a-valid-id");

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid member ID.");
  });
});

describe("OAuth protected endpoints", () => {
  beforeEach(() => {
    stubDatabase();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("POST /books without a token returns 401", async () => {
    const res = await request(app).post("/books").send({
      title: "No token",
      isbn: "978-0-00-000000-9",
      authorId: "A001",
      categoryId: "C001",
      publishedYear: 2025,
      pages: 100,
      summary: "Should be rejected",
    });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.include("Unauthorized");
  });

  it("POST /authors without a token returns 401", async () => {
    const res = await request(app).post("/authors").send({
      firstName: "No",
      lastName: "Token",
      birthDate: "2000-01-01",
      nationality: "Nowhere",
      biography: "Should be rejected",
      books: [],
      awards: [],
    });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.include("Unauthorized");
  });

  it("PUT /books/:id with an invalid token returns 401", async () => {
    const res = await request(app)
      .put(`/books/${bookId}`)
      .set("Authorization", "Bearer not-a-real-token")
      .send({
        title: "Bad token",
        isbn: "978-0-00-000000-9",
        authorId: "A001",
        categoryId: "C001",
        publishedYear: 2025,
        pages: 100,
        summary: "Should be rejected",
      });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.include("Unauthorized");
  });

  it("PUT /authors/:id without a token returns 401", async () => {
    const res = await request(app)
      .put(`/authors/${authorId}`)
      .send({
        firstName: "No",
        lastName: "Token",
        birthDate: "2000-01-01",
        nationality: "Nowhere",
        biography: "Should be rejected",
        books: [],
        awards: [],
      });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.include("Unauthorized");
  });

  it("GET /auth/user without a token returns 401", async () => {
    const res = await request(app).get("/auth/user");

    expect(res.status).to.equal(401);
    expect(res.body.message).to.include("Unauthorized");
  });
});
