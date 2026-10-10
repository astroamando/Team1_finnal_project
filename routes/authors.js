// add express and set the router
const router = require("express").Router();

// require the controllers and the OAuth middleware
const authorsControllers = require("../controllers/authors");
const { requireAuth } = require("../middleware/auth");

// GET ALL
router.get("/", authorsControllers.getAll);

// GET BY ID
router.get("/:id", authorsControllers.getSingle);

// CREATE (protected by GitHub OAuth)
router.post("/", requireAuth, (req, res, next) => {
  /* #swagger.security = [{ "Bearer": [] }] */
  /* #swagger.parameters['body'] = {
		in: 'body',
		required: true,
		schema: {
			firstName: "Gabriel",
			lastName: "Garcia Marquez",
			birthDate: "1927-03-06",
			nationality: "Colombian",
			biography: "Example biography",
			books: ["B004"],
			awards: ["Nobel Prize in Literature"]
		}
	} */
  authorsControllers.createAuthor(req, res, next);
});

// UPDATE (protected by GitHub OAuth)
router.put("/:id", requireAuth, (req, res, next) => {
  /* #swagger.security = [{ "Bearer": [] }] */
  /* #swagger.parameters['body'] = {
		in: 'body',
		required: true,
		schema: {
			firstName: "Gabriel",
			lastName: "Garcia Marquez",
			birthDate: "1927-03-06",
			nationality: "Colombian",
			biography: "Example biography",
			books: ["B004"],
			awards: ["Nobel Prize in Literature"]
		}
	} */
  authorsControllers.updateAuthor(req, res, next);
});

// DELETE
router.delete("/:id", requireAuth, authorsControllers.deleteAuthor);

module.exports = router;
