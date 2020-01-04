const axios = require("axios");
var request = require("request");
const CustomException = require("../libs/exception");
module.exports = function(server, queryString) {
  server.get("/api/files/download/*", (req, res) => {
    return res.send({
      downloadPath: process.env.API_DOMAIN_URL_10004 + req.path
    });
  });
  server.get("/download/:hash/:filename", async (req, res) => {
    let authorization = "";
    if (req.headers["authorization"]) {
      authorization = req.headers["authorization"];
    }
    if (req.cookies["aToken"]) {
      authorization = "Bearer " + req.cookies["aToken"];
    }
    const headers = {
      Authorization: authorization
    };
    let getParams = req.query;
    const stringified = queryString.stringify(getParams);
    let url = `${process.env.API_DOMAIN_URL_10004}/api/files/download/${req.params.hash}`;
    if (getParams) {
      url = url + "?" + stringified;
    }
    try {
      let rq = request.get(url, {
        headers: headers,
        strictSSL: false,
        agent: new (require("https")).Agent({
          rejectUnauthorized: false
        }),
        timeout: 60 * 1000
      });
      rq.pipefilter = function(response, dest) {
        try {
          let disposition = response.headers["content-disposition"];
          if (disposition != undefined && disposition) {
            console.log(disposition.toLowerCase());
            if (disposition.toLowerCase().indexOf(".pdf") !== -1) {
              dest.removeHeader("content-type");
              dest.removeHeader("content-disposition");
              dest.setHeader("content-type", "application/pdf");
            } else if (disposition.toLowerCase().indexOf(".txt") !== -1) {
              dest.removeHeader("content-type");
              dest.removeHeader("content-disposition");
              dest.setHeader("content-type", "text/plain");
            } else if (
              disposition.toLowerCase().indexOf(".jpg") !== -1 ||
              disposition.toLowerCase().indexOf(".jpeg") !== -1
            ) {
              dest.removeHeader("content-type");
              dest.removeHeader("content-disposition");
              dest.setHeader("content-type", "image/jpg");
            } else if (disposition.toLowerCase().indexOf(".png") !== -1) {
              dest.removeHeader("content-type");
              dest.removeHeader("content-disposition");
              dest.setHeader("content-type", "image/png");
            }
          }
        } catch (err) {}
      };
      rq.pipe(res);
    } catch (error) {
      return CustomException.ApiException(error, req, res);
      res.end();
    }
  });
};
