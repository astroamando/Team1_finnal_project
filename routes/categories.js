// add express and set the router
const router = require("express").Router();

// require the controllers
const categoriesControllers = require("../controllers/categories");
const { requireAuth } = require("../middleware/auth");

// GET ALL
router.get("/", categoriesControllers.getAll);

// GET BY ID
router.get("/:id", categoriesControllers.getSingle);

// CREATE
router.post("/", requireAuth, (req, res, next) => {
  /* #swagger.parameters['body'] = {
		in: 'body',
		required: true,
		schema: {
			name: "Classic Fiction",
			description: "Timeless novels considered part of the literary canon."
		}
	} */
  categoriesControllers.createCategory(req, res, next);
});

// UPDATE
router.put("/:id", requireAuth, (req, res, next) => {
  /* #swagger.parameters['body'] = {
		in: 'body',
		required: true,
		schema: {
			name: "Classic Fiction",
			description: "Timeless novels considered part of the literary canon."
		}
	} */
  categoriesControllers.updateCategory(req, res, next);
});

// DELETE
router.delete("/:id", requireAuth, categoriesControllers.deleteCategory);

module.exports = router;
