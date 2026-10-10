// add express and set the router
const router = require("express").Router();

// require the controllers and the OAuth middleware
const booksControllers = require("../controllers/books");
const { requireAuth } = require("../middleware/auth");

// GET ALL
router.get("/", booksControllers.getAll);

// GET BY ID
router.get("/:id", booksControllers.getSingle);

// CREATE (protected by GitHub OAuth)
router.post("/", requireAuth, (req, res, next) => {
  // swagger.security = [{ Bearer: [] }];
  /* swagger.parameters["body"] = {
    in: "body",
    required: true,
    schema: {
      title: "Example title",
      isbn: "978-0-00-000000-0",
      authorId: "A004",
      categoryId: "C001",
      publishedYear: 2025,
      pages: 100,
      summary: "Example summary",
    },
  };*/
  booksControllers.createBook(req, res, next);
});

// UPDATE (protected by GitHub OAuth)
router.put("/:id", requireAuth, (req, res, next) => {
  // swagger.security = [{ Bearer: [] }];
  /* swagger.parameters["body"] = {
    in: "body",
    required: true,
    schema: {
      title: "Example title",
      isbn: "978-0-00-000000-0",
      authorId: "A004",
      categoryId: "C001",
      publishedYear: 2025,
      pages: 100,
      summary: "Example summary",
    },
  };*/
  booksControllers.updateBook(req, res, next);
});

// DELETE
router.delete("/:id", requireAuth, booksControllers.deleteBook);

module.exports = router;
