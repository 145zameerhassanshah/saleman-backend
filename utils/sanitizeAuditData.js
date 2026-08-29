// src/utils/sanitizeAuditData.js

const SENSITIVE_FIELDS = [
  "password",
  "otp",
  "otpExpiry",
  "resetPasswordToken",
  "resetPasswordExpiry",
  "email_verification_token",
  "blocked_until",
  "__v",
];

const sanitizeAuditData = (data) => {
  if (!data) return null;

  let plainData = data;

  if (typeof data.toObject === "function") {
    plainData = data.toObject();
  }

  if (Array.isArray(plainData)) {
    return plainData.map((item) => sanitizeAuditData(item));
  }

  if (typeof plainData === "object") {
    const cleaned = {};

    Object.keys(plainData).forEach((key) => {
      if (SENSITIVE_FIELDS.includes(key)) return;

      if (plainData[key] instanceof Date) {
        cleaned[key] = plainData[key];
      } else if (
        plainData[key] &&
        typeof plainData[key] === "object" &&
        !plainData[key]._bsontype
      ) {
        cleaned[key] = sanitizeAuditData(plainData[key]);
      } else {
        cleaned[key] = plainData[key];
      }
    });

    return cleaned;
  }

  return plainData;
};

module.exports = sanitizeAuditData;