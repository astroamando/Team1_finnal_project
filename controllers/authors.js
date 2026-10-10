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

const stringArray = (value, field) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw createError(400, `${field} must be an array of strings.`);
  }

  return value.map((item) => item.trim());
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

const requieredValidBirthDate = (value, field) => {
  // set the min & max values
  const minLenght = 10;
  const maxLenght = 10;

  // validate against all of the requierements
  // firsdt check if it's an String, then continue with the validation.
  const item = requiredString(value, field);
  requieredMinLenght(value, field, minLenght);
  requieredMaxLenght(value, field, maxLenght);

  // once the validation is done, return the item
  return item;
};

const validateAuthorData = (data) => {
  if (!data || typeof data !== "object") {
    throw createError(400, "Author data is required.");
  }

  return {
    firstName: requiredString(data.firstName, "Author firstName"),
    lastName: requiredString(data.lastName, "Author lastName"),
    birthDate: requieredValidBirthDate(data.birthDate, "Author birthDate"),
    nationality: requiredString(data.nationality, "Author nationality"),
    biography: requiredString(data.biography, "Author biography"),
    books: stringArray(data.books, "Author books"),
    awards: stringArray(data.awards, "Author awards"),
  };
};

const getAll = async (req, res, next) => {
  //#swagger.tags=["Authors"]
  try {
    const result = await mongodb.getDatabase().collection("authors").find();
    const authors = await result.toArray();

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(authors);
  } catch (err) {
    console.error("Error fetching authors:", err.message);
    err.status = 500;
    next(err);
  }
};

const getSingle = async (req, res, next) => {
  //#swagger.tags=["Authors"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid author ID.");
    }

    const authorId = new ObjectId(req.params.id);
    const result = await mongodb
      .getDatabase()
      .collection("authors")
      .find({ _id: authorId });

    const authors = await result.toArray();

    if (!authors || authors.length === 0) {
      return res
        .status(404)
        .json({ message: "Error fetching author: Not found" });
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(authors[0]);
  } catch (err) {
    console.error("Error fetching author:", err.message);
    next(err);
  }
};

const createAuthor = async (req, res, next) => {
  //#swagger.tags=["Authors"]
  try {
    const author = validateAuthorData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("authors")
      .insertOne(author);

    res.status(201).json({
      _id: result.insertedId,
      ...author,
    });
  } catch (err) {
    console.error("Error creating author:", err.message);
    next(err);
  }
};

const updateAuthor = async (req, res, next) => {
  //#swagger.tags=["Authors"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid author ID.");
    }

    const author = validateAuthorData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("authors")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: author },
        { returnDocument: "after" },
      );

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error updating author: Not found" });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error updating author:", err.message);
    next(err);
  }
};

const deleteAuthor = async (req, res, next) => {
  //#swagger.tags=["Authors"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid author ID.");
    }

    const result = await mongodb
      .getDatabase()
      .collection("authors")
      .findOneAndDelete({ _id: new ObjectId(req.params.id) });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error deleting author: Not found" });
    }

    res.status(200).json({ message: "Author deleted successfully" });
  } catch (err) {
    console.error("Error deleting author:", err.message);
    next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};
