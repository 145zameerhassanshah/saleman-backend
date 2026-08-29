// /utils/getDiff.js

const sanitizeAuditData = require("./sanitizeAuditData");

const normalizeValue = (value) => {
  if (value === undefined) return null;

  if (value && value._bsontype === "ObjectID") {
    return value.toString();
  }

  if (value && typeof value.toString === "function" && value._bsontype) {
    return value.toString();
  }

  return value;
};

const getDiff = (before = {}, after = {}) => {
  const oldData = sanitizeAuditData(before) || {};
  const newData = sanitizeAuditData(after) || {};

  const changes = {};

  const ignoredFields = ["createdAt", "updatedAt"];

  const allKeys = new Set([
    ...Object.keys(oldData),
    ...Object.keys(newData),
  ]);

  allKeys.forEach((key) => {
    if (ignoredFields.includes(key)) return;

    const oldValue = normalizeValue(oldData[key]);
    const newValue = normalizeValue(newData[key]);

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        from: oldValue,
        to: newValue,
      };
    }
  });

  return changes;
};

module.exports = getDiff;