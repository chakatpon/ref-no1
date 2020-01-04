var ms = require("ms");
let tickTimeout = process.env.API_TIMEOUT || "5m";
let delay =
  typeof tickTimeout === "string" ? ms(tickTimeout) : Number(tickTimeout);
var maxTimeout = delay / 1000;
const axios = require("axios");
let axiosInstance = axios.create({
  timeout: delay
});
const wrapAxios = require("zipkin-instrumentation-axiosjs");
const { tracer } = require("./zipkinTracer");
const zipkinAxios =
  tracer != null ? wrapAxios(axiosInstance, { tracer }) : axios;
const CustomException = require("../libs/exception");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: "./tmp/",
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const fs = require("fs");
const upload = multer({ storage: storage });
const FormData = require("form-data");
exports.call = async (url, options, req, res, returnResult = false) => {
  //try {
  let authorization = "";
  if (
    req.headers["authorization"] &&
    req.headers["authorization"] !== null &&
    req.headers["authorization"] !== undefined
  ) {
    authorization = req.headers["authorization"];
  }
  if (
    req.cookies["aToken"] &&
    req.cookies["aToken"] !== null &&
    req.cookies["aToken"] !== undefined
  ) {
    authorization = "Bearer " + req.cookies["aToken"];
  } else {
    if (options.method == "POST" || options.method == "PUT") {
      CustomException.ApiException(
        {
          error: true,
          status: 504,
          message: "Invalid Token"
        },
        req,
        res
      );
      res.end();
    }
  }

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: authorization
  };
  if (!authorization) {
    res.status(401).json({
      statusCode: 401,
      error: "Unauthorize",
      message: "Unauthorize"
    });
    res.end();
  }
  if (!options) {
    options = {};
  }
  options = { ...options, headers };
  if (!options.method) {
    options.method = "get";
  }
  // if (options.method != "get" && options.method != "GET") {
  //   maxTimeout = 120;
  // }
  if (options.timeout) {
    options.timeout = maxTimeout * 1000;
  }
  console.log("Call api(Axios) : ", url);
  let resp = await zipkinAxios.request({ url, ...options });
  let respbody = resp.data;
  //console.log('respbody', respbody)
  let body = [];
  if (respbody.data && respbody.statusCode) {
    body = respbody.data;
  } else {
    body = respbody;
  }
  if (returnResult) {
    return body;
  } else {
    console.log("*** Error while call api (no result return): ", url);
    res.status(resp.status).send(body);
  }
  // } catch (error) {
  //   if (returnResult) {

  //     //throw new Error(error);
  //     //CustomException.ApiException(error, req, res);
  //     //res.end();
  //   } else {
  //     CustomException.ApiException(error, req, res);
  //     res.end();
  //   }
  // }
};
exports.singleUpload = async (url, options, req, res) => {
  try {
    let form = new FormData();
    form.append("files", fs.createReadStream(req.file.path));

    let authorization = "";
    if (req.headers["authorization"]) {
      authorization = req.headers["authorization"];
    }
    if (req.cookies["aToken"]) {
      authorization = "Bearer " + req.cookies["aToken"];
    }
    const headers = {
      Accept: "multipart/form-data",
      "Content-Type": "multipart/form-data",
      Authorization: authorization
    };
    if (!options) {
      options = {};
    }
    options = { ...options, headers };
    if (!options.method) {
      options.method = "post";
    }
    if (options.timeout) {
      options.timeout = maxTimeout * 1000;
    }
    let resp = await zipkinAxios({ url, form, ...options });
    let respbody = resp.data;
    //console.log('respbody', respbody)
    let body = [];
    if (respbody.data && respbody.statusCode) {
      body = respbody.data;
    } else {
      body = respbody;
    }
    fs.unlinkSync(req.file.path);
    res.status(resp.status).send(body);
  } catch (error) {
    console.log("*** Error while upload data to api : ", url);
    CustomException.ApiException(error, req, res);
    res.end();
  }
};
exports.standardCall = async (url, options, req, res, returnResult = false) => {
  try {
    let authorization = "";
    if (req.headers["authorization"] && req.headers["authorization"] !== null) {
      authorization = req.headers["authorization"];
    }
    if (req.cookies["aToken"] && req.cookies["aToken"] !== null) {
      authorization = "Bearer " + req.cookies["aToken"];
    }
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authorization
    };
    if (!authorization) {
      res.status(401).json({
        statusCode: 401,
        error: "Unauthorize",
        message: "Unauthorize"
      });
      return false;
    }
    if (!options) {
      options = {};
    }
    options = { ...options, headers };
    if (!options.method) {
      options.method = "get";
    }
    if (options.method != "get" && options.method != "GET") {
      maxTimeout = 120;
    }
    if (options.timeout) {
      options.timeout = maxTimeout * 1000;
    }
    let resp = await zipkinAxios({ url, ...options });
    let respbody = resp.data;
    //console.log('respbody', respbody)
    let body = [];
    if (respbody.data && respbody.statusCode) {
      body = { data: respbody.data, ...respbody.data };
      //body["data"] = respbody.dat              a;
    } else {
      body = respbody;
    }
    if (returnResult) {
      return body;
    } else {
      res.status(resp.status).send(body);
    }
  } catch (error) {
    console.log("*** Error while call standard api :", url);
    if (returnResult) {
      throw new Error(error);
    } else {
      CustomException.ApiException(error, req, res);
    }
  }
};
