// add express and set the router
const router = require("express").Router();

// require the controllers
const membersControllers = require("../controllers/members");
const { requireAuth } = require("../middleware/auth");

// GET ALL
router.get("/", membersControllers.getAll);

// GET BY ID
router.get("/:id", membersControllers.getSingle);

// CREATE
router.post("/", requireAuth, (req, res, next) => {
  /* #swagger.parameters['body'] = {
		in: 'body',
		required: true,
		schema: {
			firstName: "Jordan",
			lastName: "Smith",
			email: "jordan.smith@example.com",
			phone: "208-555-0142",
			membershipType: "Free"
		}
	} */
  membersControllers.createMember(req, res, next);
});

// UPDATE
router.put("/:id", requireAuth, (req, res, next) => {
  /* #swagger.parameters['body'] = {
		in: 'body',
		required: true,
		schema: {
			firstName: "Jordan",
			lastName: "Smith",
			email: "jordan.smith@example.com",
			phone: "208-555-0142",
			membershipType: "Free"
		}
	} */
  membersControllers.updateMember(req, res, next);
});

// DELETE
router.delete("/:id", requireAuth, membersControllers.deleteMember);

module.exports = router;
