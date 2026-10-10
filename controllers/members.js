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

const requieredMinLenghtString = (value, field, minLenght) => {
  const item = requiredString(value, field);

  if (item.length() != minLenght) {
    throw createError(
      400,
      `${field} must be at least ${minLenght} characters long.`,
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
    phone: requieredMinLenghtString(data.phone, "Member phone"),
    membershipType: requiredString(
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
