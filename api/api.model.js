const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
var striptags = require("striptags");
var path = require("path");
module.exports = function(server, queryString) {
  server.get("/model/m/:filename", async (req, res) => {
    try {
      let f = req.params.filename;
      res.sendFile(
        path.join(__dirname, "../", "columns/mobiles/" + f + ".json")
      );
    } catch (error) {
      console.log("*** Problem while get mobile model ");
      CustomException.ApiException(error, req, res);
    }
  });
  server.get("/model/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_12000 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      await b2papi.call(url, {}, req, res);
    } catch (error) {
      console.log("*** Problem while get model ");
      CustomException.ApiException(error, req, res);
    }
  });
  server.post("/model/*", async (req, res) => {
    try {
      let getParams = req.query;
      if (getParams) {
        let query = [];
        for (var x in req.query) {
          query[x] = striptags(req.query[x]);
        }
        getParams = query;
      }
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_12000 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      // console.log(url, JSON.stringify(req.body));
      let opts = {
        method: "post",
        query: req.query,
        data: JSON.stringify(req.body)
      };
      await b2papi.call(url, opts, req, res);
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
};
