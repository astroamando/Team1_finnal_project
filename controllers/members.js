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

const requiredEmail = (value, field) => {
  const email = requiredString(value, field);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError(400, `${field} must be a valid email address.`);
  }

  return email;
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

const requieredValidPhone = (value, field) => {
  // set the min & max values
  const minLenght = 8;
  const maxLenght = 18;

  // validate against all of the requierements
  // firsdt check if it's an string, then continue with the validation.
  const item = requiredString(value, field);
  requieredMinLenght(value, field, minLenght);
  requieredMaxLenght(value, field, maxLenght);

  // once the validation is done, return the item
  return item;
};

const requieredValidMembershipType = (value, field) => {
  const item = requiredString(value, field);
  const validMembershipTypes = ["Free", "Bronze", "Silver", "Gold"];

  if (!validMembershipTypes.includes(value)) {
    throw createError(
      400,
      `The membership must be one of the valid types: 'Free', 'Bronze', 'Silver' or 'Gold'`,
    );
  }

  return item;
};

const validateMemberData = (data) => {
  if (!data || typeof data !== "object") {
    throw createError(400, "Member data is required.");
  }

  return {
    firstName: requiredString(data.firstName, "Member firstName"),
    lastName: requiredString(data.lastName, "Member lastName"),
    email: requiredEmail(data.email, "Member email"),
    phone: requieredValidPhone(data.phone, "Member phone"),
    membershipType: requieredValidMembershipType(
      data.membershipType,
      "Member membershipType",
    ),
  };
};

const getAll = async (req, res, next) => {
  //#swagger.tags=["Members"]
  try {
    const result = await mongodb.getDatabase().collection("members").find();
    const members = await result.toArray();

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(members);
  } catch (err) {
    console.error("Error fetching members:", err.message);
    err.status = 500;
    next(err);
  }
};

const getSingle = async (req, res, next) => {
  //#swagger.tags=["Members"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid member ID.");
    }

    const memberId = new ObjectId(req.params.id);
    const result = await mongodb
      .getDatabase()
      .collection("members")
      .find({ _id: memberId });

    const members = await result.toArray();

    if (!members || members.length === 0) {
      return res
        .status(404)
        .json({ message: "Error fetching member: Not found" });
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(members[0]);
  } catch (err) {
    console.error("Error fetching member:", err.message);
    next(err);
  }
};

const createMember = async (req, res, next) => {
  //#swagger.tags=["Members"]
  try {
    const member = validateMemberData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("members")
      .insertOne(member);

    res.status(201).json({
      _id: result.insertedId,
      ...member,
    });
  } catch (err) {
    console.error("Error creating member:", err.message);
    next(err);
  }
};

const updateMember = async (req, res, next) => {
  //#swagger.tags=["Members"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid member ID.");
    }

    const member = validateMemberData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("members")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: member },
        { returnDocument: "after" },
      );

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error updating member: Not found" });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error updating member:", err.message);
    next(err);
  }
};

const deleteMember = async (req, res, next) => {
  //#swagger.tags=["Members"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid member ID.");
    }

    const result = await mongodb
      .getDatabase()
      .collection("members")
      .findOneAndDelete({ _id: new ObjectId(req.params.id) });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error deleting member: Not found" });
    }

    res.status(200).json({ message: "Member deleted successfully" });
  } catch (err) {
    console.error("Error deleting member:", err.message);
    next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createMember,
  updateMember,
  deleteMember,
};
