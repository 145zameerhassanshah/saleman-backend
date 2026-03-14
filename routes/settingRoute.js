const router = require("express").Router();
const settingController = require("../controllers/SettingController");
const upload = require("../middleware/upload"); // multer

router.get("/", settingController.getSettings);

router.post(
  "/update",
  upload.fields([
    { name: "company_logo", maxCount: 1 },
    { name: "dashboard_logo", maxCount: 1 }
  ]),
  settingController.updateSettings
);

module.exports = router;