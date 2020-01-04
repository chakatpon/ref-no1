const axios = require("axios");
const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
module.exports = function(server, queryString) {
  server.get("/config", async (req, res) => {
    const fs = require("fs");
    const path = require("path");
    const configfile = process.env.CONFIG_FILE || "b2p.config.json";
    try {
      let configPath = path.resolve(process.cwd(), configfile);
      let envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath) === true) {
        console.log("Read config from .env", envPath);
        return {};
      }
      if (!fs.existsSync(configPath)) {
        console.log(configPath, "is not exists");
        return {};
      }
      console.log("Read config from ", configPath);
      let encoding /*: string */ = "utf8";
      const parsed = JSON.parse(fs.readFileSync(configPath, { encoding }));
      delete parsed.API_CLIENT_ID;
      delete parsed.API_CLIENT_SECRET;
      delete parsed.NODE_TLS_REJECT_UNAUTHORIZED;
      res.json(parsed);
    } catch (e) {
      res.json({});
    }
  });

  server.get("/announcement", async (req, res) => {
    const fs = require("fs");
    const path = require("path");
    const configfile = "announcement.json";
    try {
      let configPath = path.resolve(process.cwd(), configfile);
      let envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath) === true) {
        console.log("Read config from .env", envPath);
        return {};
      }
      if (!fs.existsSync(configPath)) {
        console.log(configPath, "is not exists");
        return {};
      }
      console.log("Read config from ", configPath);
      let encoding /*: string */ = "utf8";
      const parsed = JSON.parse(fs.readFileSync(configPath, { encoding }));
      delete parsed.API_CLIENT_ID;
      delete parsed.API_CLIENT_SECRET;
      delete parsed.NODE_TLS_REJECT_UNAUTHORIZED;
      res.json(parsed);
    } catch (e) {
      res.json({});
    }
  });
  server.get("/api/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_10004 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      await b2papi.call(url, {}, req, res);
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
  // server.get("/testtimeout", async (req, res) => {
  //   res.render("testtimeout.html");
  //   res.end();
  // });
  // server.get("/testtimeout/test/:timeinsec", async (req, res) => {
  //   let t = req.params.timeinsec || 60;
  //   //req.setTimeout((t+1)*1000);
  //   let tt = 0;
  //   var ss = setInterval(() => {
  //     tt = tt + 5;
  //     console.log(tt + "s");
  //   }, 5000);
  //   await setTimeout(() => {
  //     clearInterval(ss);
  //     res.send("testtimeout " + t + "s");
  //     res.end();
  //   }, t * 1000);
  //   clearInterval(ss);
  // });
  server.post("/api/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_10004 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      console.log(url, JSON.stringify(req.body));
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
  server.put("/api/*", async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_10004 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      console.log(url, JSON.stringify(req.body));
      let opts = {
        method: "put",
        strictSSL: false,
        query: req.query,
        data: JSON.stringify(req.body)
      };
      await b2papi.call(url, opts, req, res);
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
};
