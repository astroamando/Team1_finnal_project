const mongodb = require("../data/database");
const ObjectId = require("mongodb").ObjectId;

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const requiredString = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    throw createError(400, `${field} is required.`);
  }

  return value.trim();
};

const requieredMinLenght = (value, field, minLenght) => {
  // DEBUG: Log the lenght of the value
  // console.log(value + " is " + value.length + " characters long");

  if (value.length < minLenght) {
    throw createError(
      400,
      `${field} must be at least ${minLenght} characters long.`,
    );
  }

  // these two validators don't return anything, they serve as middleware-like functions.
  return;
};

const requieredMaxLenght = (value, field, maxLenght) => {
  // DEBUG: Log the lenght of the value
  // console.log(value + " is " + value.length + " characters long");

  if (value.length > maxLenght) {
    throw createError(
      400,
      `${field} must be less than ${maxLenght} characters long.`,
    );
  }

  // these two validators don't return anything, they serve as middleware-like functions.
  return;
};

const requieredValidCategory = (value, field) => {
  // set the min & max values
  const minLenght = 30;
  const maxLenght = 500;

  // validate against all of the requierements
  // firsdt check if it's an string, then continue with the validation.
  const item = requiredString(value, field);
  requieredMinLenght(value, field, minLenght);
  requieredMaxLenght(value, field, maxLenght);

  // once the validation is done, return the item
  return item;
};

const validateCategoryData = (data) => {
  if (!data || typeof data !== "object") {
    throw createError(400, "Category data is required.");
  }

  return {
    name: requiredString(data.name, "Category name"),
    description: requieredValidCategory(
      data.description,
      "Category description",
    ),
  };
};

const getAll = async (req, res, next) => {
  //#swagger.tags=["Categories"]
  try {
    const result = await mongodb.getDatabase().collection("categories").find();
    const categories = await result.toArray();

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err.message);
    err.status = 500;
    next(err);
  }
};

const getSingle = async (req, res, next) => {
  //#swagger.tags=["Categories"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid category ID.");
    }

    const categoryId = new ObjectId(req.params.id);
    const result = await mongodb
      .getDatabase()
      .collection("categories")
      .find({ _id: categoryId });

    const categories = await result.toArray();

    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ message: "Error fetching category: Not found" });
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(categories[0]);
  } catch (err) {
    console.error("Error fetching category:", err.message);
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  //#swagger.tags=["Categories"]
  try {
    const category = validateCategoryData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("categories")
      .insertOne(category);

    res.status(201).json({
      _id: result.insertedId,
      ...category,
    });
  } catch (err) {
    console.error("Error creating category:", err.message);
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  //#swagger.tags=["Categories"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid category ID.");
    }

    const category = validateCategoryData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("categories")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: category },
        { returnDocument: "after" },
      );

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error updating category: Not found" });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error updating category:", err.message);
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  //#swagger.tags=["Categories"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid category ID.");
    }

    const result = await mongodb
      .getDatabase()
      .collection("categories")
      .findOneAndDelete({ _id: new ObjectId(req.params.id) });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error deleting category: Not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err.message);
    next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createCategory,
  updateCategory,
  deleteCategory,
};
