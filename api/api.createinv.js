///api/purchaseorders?purchaseOrderNumber=311&page=1&pageSize=50&statuses=CONFIRMED
const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const unmatchedCode = require("../configs/unmatchedCode.config.json");
module.exports = function(server, queryString) {
  server.get("/api/invcreate/posearch", async (req, res) => {
    let params = {
      purchaseOrderNumber: 311,
      page: 1,
      pageSize: 50,
      statuses: "CONFIRMED"
    };
    let getParams = req.query;
    for (let k in getParams) {
      params[k] = getParams[k];
    }
    const resp = await apis.get(
      req,
      res,
      process.env.API_DOMAIN_URL_10004 + "/api/purchaseorders",
      "get",
      true,
      params
    );
    if (!resp) {
      return res.status(500).json(resp);
    }
    return res.status(200).json(resp);
  });
  server.get(
    "/api/invcreate/purchaseitems/:purchaseOrderLinearId",
    async (req, res) => {
      let params = {
        purchaseOrderLinearId: "",
        deleteFlag: "IS_NULL",
        page: 1,
        pageSize: 50
      };
      let getParams = req.query;
      if (req.params.purchaseOrderLinearId == "") {
        return res.status(404).json({
          error: "not_found",
          error_description: "purchaseOrderLinearId couldn't be null."
        });
      }

      for (let k in getParams) {
        params[k] = getParams[k];
      }
      for (let k in req.params) {
        params[k] = req.params[k];
      }
      console.log(params);
      const resp = await apis.get(
        req,
        res,
        process.env.API_DOMAIN_URL_10004 + "/api/purchaseitems",
        "get",
        true,
        params
      );
      if (!resp) {
        return res.status(500).json(resp);
      }
      return res.status(200).json({
        purchaseitems: resp.rows
      });
    }
  );
};
