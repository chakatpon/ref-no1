const axios = require("axios");
const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
module.exports = function(server, queryString) {
  server.get("/standard/api/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_8999 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      await b2papi.standardCall(url, {}, req, res);
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
  server.post("/standard/api/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_8999 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      await b2papi.call(url, { method: "post" }, req, res);
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
  server.put("/standard/api/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_8999 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      await b2papi.call(url, { method: "put" }, req, res);
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
  server.delete("/standard/api/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_8999 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      await b2papi.call(url, { method: "delete" }, req, res);
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
};
