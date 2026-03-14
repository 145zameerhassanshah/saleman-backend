const { settingModel } = require("../models/exporter");

async function getSettings(req, res) {
  try {

    let setting = await settingModel.findOne();

    if (!setting) {
      setting = {};
    }

    return res.status(200).json({
      setting
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong"
    });

  }
}


/* ================================
   UPDATE SETTINGS
================================ */

async function updateSettings(req, res) {

  try {

    let setting = await settingModel.findOne();

    if (!setting) {
      setting = new settingModel();
    }


    /* COMPANY LOGO UPLOAD */

    if (req.files?.company_logo) {

      const file = req.files.company_logo[0];

      setting.company_logo =
        "assets/admin/uploads/setting/CompanyLogo/" + file.filename;

    }


    /* DASHBOARD LOGO UPLOAD */

    if (req.files?.dashboard_logo) {

      const file = req.files.dashboard_logo[0];

      setting.dashboard_logo =
        "assets/admin/uploads/setting/DashboardLogo/" + file.filename;

    }


    /* NORMAL FIELDS */

    setting.company_name = req.body.company_name;
    setting.company_email = req.body.company_email;
    setting.company_address = req.body.company_address;
    setting.phone_no = req.body.phone_no;
    setting.notes = req.body.notes;


    await setting.save();


    return res.status(200).json({
      message: "Settings Updated Successfully",
      setting
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong"
    });

  }

}


module.exports = {
  getSettings,
  updateSettings
};