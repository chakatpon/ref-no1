require("dotenv").config();
require("./b2p.config").config();
const express = require("express");
var http = require("http");
var https = require("https");
var request = require("request");
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var csrf = require("csurf");
var fetch = require("isomorphic-unfetch");
var Cookies = require("js-cookie");
var timeout = require("connect-timeout");
var ms = require("ms");
var base64 = require("base-64");
const FormData = require("form-data");
var csrfProtection = csrf({ cookie: true });

const queryString = require("query-string");
const fs = require("fs");
const axios = require("axios");
const wrapAxios = require("zipkin-instrumentation-axiosjs");
const wrapFetch = require("zipkin-instrumentation-fetch");
const { tracer } = require("./libs/zipkinTracer");
const zipkinAxios = tracer != null ? wrapAxios(axios, { tracer }) : axios;
const zipkinFetch = tracer != null ? wrapFetch(fetch, { tracer }) : fetch;
//multer
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "./tmp/",
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

const URLSearchParams = require("url-search-params");
var json2xls = require("json2xls");
var json2xlsx = require("node-json-xlsx");

const socketCookieParser = require("socket.io-cookie-parser");
const CustomException = require("./libs/exception");
const b2papi = require("./libs/b2papi");

const nextI18NextMiddleware = require("next-i18next/middleware").default;

const nextI18next = require("./i18n");

var jwt_decode = require("jwt-decode");
const moment = require("moment");

const downloadFile = async (req, res) => {
  //console.log(req.params.hash);
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
      agent: new (require("https").Agent)({
        rejectUnauthorized: false
      }),
      timeout: 20 * 1000
    });
    rq.pipefilter = function(response, dest) {
      try {
        let disposition = response.headers["content-disposition"];
        if (disposition != undefined && disposition) {
          disposition = disposition.toLowerCase() || disposition;
          disposition = disposition.replace("attachment", "inline");

          if (disposition.indexOf(".pdf") !== -1) {
            dest.removeHeader("content-type");
            dest.removeHeader("content-disposition");
            dest.setHeader("content-type", "application/pdf");
          } else if (disposition.indexOf(".txt") !== -1) {
            dest.removeHeader("content-type");
            dest.removeHeader("content-disposition");
            dest.setHeader("content-type", "text/plain");
          } else if (disposition.indexOf(".jpg") !== -1) {
            console.log("jpg");
            dest.removeHeader("content-type");
            dest.removeHeader("content-disposition");
            dest.setHeader("content-type", "image/jpg");
            dest.setHeader("content-disposition", disposition);
          } else if (disposition.indexOf(".jpeg") !== -1) {
            console.log("jpeg");
            dest.removeHeader("content-type");
            dest.removeHeader("content-disposition");
            dest.setHeader("content-type", "image/jpg");
          } else if (disposition.indexOf(".png") !== -1) {
            dest.removeHeader("content-type");
            dest.removeHeader("content-disposition");
            dest.setHeader("content-type", "image/png");
          } else {
            console.log("other", disposition);
          }
          dest.setHeader("content-disposition", disposition);
        }
      } catch (err) {
        console.log("err", err.message);
      }
    };
    rq.pipe(res);
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
      res.status(500).send(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message);
      res.status(500).send(error.message);
    }
  }
};

app
  .prepare()
  .then(props => {
    const server = express();
    let tickTimeout = process.env.APP_TIMEOUT || "5m";
    var delay =
      typeof tickTimeout === "string" ? ms(tickTimeout) : Number(tickTimeout);
    // console.log("APP TIMEOUT", delay / 1000, "seconds");
    const middlewares = [
      json2xlsx.middleware,
      bodyParser.json({ limit: "10mb" }),
      bodyParser.urlencoded({ extended: true, limit: "10mb" }),
      cookieParser("sesh-dash"),
      timeout(tickTimeout)
    ];

    server.use(middlewares);
    server.set("views", __dirname + "/views");
    server.engine("html", require("ejs").renderFile);
    server.set("view engine", "html");
    server.use(nextI18NextMiddleware(nextI18next));
    // Add headers
    server.use(async (req, res, next) => {
      if (req.timedout) {
        res.send("503 (Service Unavailable)");
        res.end();
      }

      res.setHeader("Access-Control-Allow-Origin", process.env.APP_DOMAIN);
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,authorization,content-type"
      );
      res.setHeader("Access-Control-Allow-Credentials", true);
      let assetUrlPath = process.env.APP_DOMAIN;
      if (process.env.APP_PATH) {
        assetUrlPath += process.env.APP_PATH;
      }
      app.setAssetPrefix(assetUrlPath);
      try {
        if (
          req.url.indexOf("/static") == -1 &&
          req.url.indexOf("/_next") == -1
        ) {
          if (req.cookies["aToken"] && req.cookies["rToken"] != "") {
            let jwt;
            let rjwt;
            let exp;
            let rexp;
            if (!req.cookies["expireToken"]) {
              jwt = jwt_decode(req.cookies["aToken"]);
              rjwt = jwt_decode(req.cookies["rToken"]);
              exp = moment.unix(jwt.exp);
              rexp = moment.unix(rjwt.exp);
            } else {
              exp = moment.unix(req.cookies["expireToken"] / 1000);
              rexp = moment.unix(req.cookies["expireToken"] / 1000);
            }

            isExpire = exp.subtract(5, "minutes").isBefore(moment());
            isrExpire = rexp.isBefore(moment());
            var expduration = moment.duration(exp.diff(moment()));
            if (isExpire && !isrExpire && !req.cookies["lockRefreshToken"]) {
              console.log("Request refresh token.");
              res.cookie("lockRefreshToken", true, {
                maxAge: 60000
              });

              const headers = {
                "content-type":
                  "application/x-www-form-urlencoded; charset=utf-8",
                Authorization:
                  "Basic " +
                  base64.encode(
                    process.env.API_CLIENT_ID +
                      ":" +
                      process.env.API_CLIENT_SECRET
                  )
              };
              const callback = {
                grant_type: "refresh_token",
                redirect_uri: process.env.API_REDIRECT_URI,
                refresh_token: req.cookies["rToken"]
              };
              let resp = await zipkinAxios
                .post(
                  process.env.API_ENDPOINT_TOKEN,
                  queryString.stringify(callback),
                  {
                    timeout: 2000,
                    headers: headers
                  }
                )
                .catch(err => {
                  console.log(err);
                  console.warn(err.message);
                });
              if (resp.data.access_token) {
                if (resp.data.expires_on && resp.data.expires_in) {
                  diff = resp.data.expires_in * 1000;
                  let m = moment.unix(resp.data.expires_on);
                  res.cookie("expireToken", m.format("x"), {
                    maxAge: diff
                  });
                  console.warn(
                    "Access token is expire after ",
                    resp.data.expires_in,
                    "second."
                  );
                } else if (resp.data.expires_in) {
                  diff = resp.data.expires_in * 1000;
                  let exp = moment().add(resp.data.expires_in, "seconds");
                  var expduration = moment.duration(exp.diff(moment()));
                  res.cookie("expireToken", exp.format("x"), {
                    maxAge: diff
                  });
                  console.warn(
                    "Access token is expire on ",
                    exp.format(),
                    expduration.humanize()
                  );
                } else {
                  let jwt = jwt_decode(resp.data.access_token);
                  let rjwt = jwt_decode(resp.data.refresh_token);
                  let exp = moment.unix(jwt.exp);
                  let rexp = moment.unix(rjwt.exp);
                  var diff = rexp.diff(moment());
                  var expduration = moment.duration(exp.diff(moment()));
                  var rexpduration = moment.duration(rexp.diff(moment()));
                  console.warn(
                    "Access token is expire in ",
                    exp.format(),
                    expduration.humanize()
                  );
                  console.warn(
                    "Refresh token is expire in ",
                    rexp.format(),
                    rexpduration.humanize()
                  );
                }

                res.cookie("aToken", resp.data.access_token, {
                  maxAge: diff
                });
                res.cookie("rToken", resp.data.refresh_token, {
                  maxAge: diff
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      }

      next();
    });

    require("./api/api.model")(server, queryString);
    require("./api/api.invoice")(server, queryString);
    require("./api/api.gr")(server, queryString);
    require("./api/api.po")(server, queryString);
    require("./api/api.cn")(server, queryString);
    require("./api/api.3wm")(server, queryString);
    require("./api/api.3wm.new")(server, queryString);
    require("./api/api.2wm")(server, queryString);
    require("./api/api.doa")(server, queryString);
    require("./api/api.liv")(server, queryString);
    require("./api/api.filemonitoring")(server, queryString);
    require("./api/api.invoiceposting")(server, queryString);
    require("./api/api.po-delivery")(server, queryString);
    require("./api/api.createinv")(server, queryString);
    require("./api/api.tracking")(server, queryString);
    require("./api/api.download")(server, queryString);
    require("./api/api.upload")(server, queryString);
    require("./libs/service.auth")(server, queryString);
    require("./api/api.standard")(server, queryString);
    require("./api/api.other")(server, queryString);
    require("./libs/service.pagemapping")(server, queryString, app);
    require("./services/ApiProxyService")(server, queryString);
    //version print
    server.get("/version", async (req, res) => {
      const path = require("path");
      const options = {
        root: path.join(__dirname, "/src"),
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        }
      };
      fs.access(path.join(__dirname, "/src/version.txt"), fs.F_OK, err => {
        if (err) {
          return res.status(404).send("Not found");
        }
        res.status(200).sendFile("version.txt", options);
      });
    });

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    const serv = require("http").Server(server);
    const io = require("socket.io")(serv);
    io.use(socketCookieParser());
    const notification = io.of(`/notification`).clients((error, clients) => {
      if (error) throw error;
    });

    notification.on("connection", socket => {
      socket.on("userManager", username => {
        require("./api/io.inv")(io, notification, username);
        require("./api/io.3wm")(io, notification, username);
        require("./api/io.3wm-detail")(io, notification, username);
        require("./api/io.liv")(io, notification, username);
        require("./api/io.tester")(io, notification, username);
      });
    });

    notification.on("disconnect", socket => {
      console.log("notification is disconected : ", socket.id);
    });
    let tickTimeout2 = process.env.APP_TIMEOUT || "5m";
    var delay2 =
      typeof tickTimeout2 === "string"
        ? ms(tickTimeout2)
        : Number(tickTimeout2);

    serv.setTimeout(delay2);
    serv.listen(port, err => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch(ex => {
    console.error(ex);
    process.exit(1);
  });
