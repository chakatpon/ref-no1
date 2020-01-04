const fs = require("fs");
const path = require("path");
const axios = require("axios");
const wrapAxios = require("zipkin-instrumentation-axiosjs");
const { tracer } = require("./zipkinTracer");
const zipkinAxios = tracer != null ? wrapAxios(axios, { tracer }) : axios;

const queryString = require("query-string");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
var numeral = require("numeral");
var moment = require("moment-timezone");
var format = require("date-format");
const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
require("../b2p.config").config("./configs/export.limit.json");
module.exports.getValue = (arr, key) => {
  let fk = key;
  if (key.indexOf(".") !== -1) {
    let k = key.split(".");
    fk = k[0];
    k.splice(0, 1);
    if (arr[fk] !== "" && arr[fk] !== undefined) {
      return this.getValue(arr[fk], k.join("."));
    } else {
      return "";
    }
  } else {
    if (arr[fk] !== "" && arr[fk] !== undefined) {
      return arr[fk];
    } else {
      return "";
    }
  }
};
module.exports.get = async (req, res, url, method, isauth, params) => {
  return await b2papi.call(url, {}, req, res, true);
};
module.exports.post = async (req, res, url, opt = {}, isauth = true) => {
  opt.method = "post";
  return await b2papi.call(url, opt, req, res, true);
};
module.exports.put = async (req, res, url, opt = [], isauth = true) => {
  opt.method = "put";
  return await b2papi.call(url, opt, req, res, true);
};
module.exports.ioput = (aToken, url, opt = [], isauth = true) => {
  let authorization = "";
  if (aToken) {
    authorization = "Bearer " + aToken;
  }
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (isauth) {
    if (!authorization) {
      return {
        error: "require_authentication",
        error_message:
          "Couldn't proxy data without API spec. Please authorize before use."
      };
    }
    headers.Authorization = authorization;
  }
  try {
    if (url.indexOf("https://")) {
      opt.httpsAgent = new (require("https").Agent)({
        rejectUnauthorized: false
      });
    }
    console.log("start axios", {
      url,
      method: "put",
      headers: headers,
      ...opt
    });
    return zipkinAxios({
      url,
      method: "put",
      headers: headers,
      ...opt
    })
      .then(res => {
        return res.data;
      })
      .catch(error => {
        if (error.response) {
          return {
            error: "api_error",
            error_message: error.response.data
          };
        }
      });
  } catch (error) {
    console.log("fix error upload ", error);
    if (error.response) {
      return {
        error: "api_error",
        error_message: error.response.data
      };
    } else if (error.request) {
      return {
        error: "api_error",
        error_message: error.request
      };
    } else {
      return {
        error: "api_error",
        error_message: error.message
      };
    }
  }
};

module.exports.iopost = (
  aToken,
  url,
  timeout = 600 * 1000,
  opt = [],
  isauth = true
) => {
  let authorization = "";
  if (aToken) {
    authorization = "Bearer " + aToken;
  }
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (isauth) {
    if (!authorization) {
      return {
        error: "require_authentication",
        error_message:
          "Couldn't proxy data without API spec. Please authorize before use."
      };
    }
    headers.Authorization = authorization;
  }
  try {
    if (url.indexOf("https://")) {
      opt.httpsAgent = new (require("https").Agent)({
        rejectUnauthorized: false
      });
    }
    console.log("start axios", {
      url,
      method: "post",
      headers: headers,
      ...opt
    });
    return zipkinAxios({
      url,
      method: "post",
      timeout: timeout,
      headers: headers,
      ...opt
    })
      .then(res => {
        return res.data;
      })
      .catch(error => {
        if (error.response) {
          return {
            error: "api_error",
            error_message: error.response.data
          };
        }
      });
  } catch (error) {
    console.log("fix error upload ", error);
    if (error.response) {
      return {
        error: "api_error",
        error_message: error.response.data
      };
    } else if (error.request) {
      return {
        error: "api_error",
        error_message: error.request
      };
    } else {
      return {
        error: "api_error",
        error_message: error.message
      };
    }
  }
};

module.exports.apiProxy = (server, endpoint, group, realendpoint) => {
  server.get(endpoint, async (req, res) => {
    try {
      let getParams = req.query;
      const stringified = queryString.stringify(getParams);
      let url = process.env.API_DOMAIN_URL_10004 + req.path;
      if (getParams) {
        url = url + "?" + stringified;
      }
      let resp = await b2papi.call(url, {}, req, res, true);
      res.json({
        draw: resp.page,
        recordsTotal: resp.totalRecords,
        recordsFiltered: resp.totalRecords,
        data: resp.rows || []
      });
    } catch (error) {
      CustomException.ApiException(error, req, res);
    }
  });
};
module.exports.datatableProxy = (server, endpoint, group, realendpoint) => {
  server.get(endpoint, async (req, res) => {
    console.log("use datatableProxy for", endpoint);
    const excludeParams = [
      "draw",
      "columns",
      "order",
      "start",
      "length",
      "search",
      "_",
      "bypass"
    ];
    if (realendpoint) {
      endpoint = realendpoint;
    }
    try {
      let configPath = path.resolve(process.cwd(), "configs/api.config.json");
      if (!fs.existsSync(configPath)) {
        console.log(configPath, "is not exists");
        return {};
      }
      console.log("Read API spec from ", configPath);
      let encoding /*: string */ = "utf8";
      const apispec = JSON.parse(
        fs.readFileSync(configPath, {
          encoding
        })
      );
      const cfg = apispec[group];

      if (!cfg) {
        res.status(500).send({
          error: "apispec_notfound",
          error_message:
            "Couldn't proxy data without API spec. Please config api spec in configs/api.config.json"
        });
        res.end();
        return;
      }
      let modelUrl =
        process.env.API_DOMAIN_URL_12000 + cfg["model"]["get"]["endpoint"];

      let dataUrl = process.env.API_DOMAIN_URL_10004 + cfg["list"]["endpoint"];
      if (cfg["list"]["endpoint"].indexOf("/standard/api") === 0) {
        dataUrl = process.env.API_DOMAIN_URL_8999 + cfg["list"]["endpoint"];
      }
      const oriParams = req.query;
      const draw = parseInt(req.query.draw) || 1;
      const bypass = req.query.bypass || false;
      let getParams = req.query;
      let stringField = "";
      let edp = queryString.parseUrl(dataUrl);
      //console.log(modelUrl);
      //console.log("getParams", getParams);
      if (req.query.bypass == "true") {
        excludeParams.map(e => {
          delete getParams[e];
        });
        Object.keys(getParams).map(function(k) {
          console.log(k, "typeof", typeof getParams[k], getParams[k]);
          if (getParams[k].toString().indexOf("||")) {
            if (typeof getParams[k] == "string") {
              getParams[k] = getParams[k].toString().split("||");
            }
          }
        });
        stringField = queryString.stringify(getParams);
        stringField = stringField.replace(/\[\]/g, "");
        console.log("stringField", stringField);
        if (dataUrl.indexOf("?") !== -1) {
          dataUrl = dataUrl + "&" + stringField;
        } else {
          dataUrl = dataUrl + "?" + stringField;
        }
      } else {
        if (getParams) {
          if (getParams.orderBy) {
            getParams.sortField = getParams.orderBy;
            let sortOrder = getParams.orderDir == "asc" ? 1 : -1;
            getParams.sortOrder = sortOrder;
          }
          if (req.query["length"]) {
            getParams.pageSize = req.query["length"];
          } else {
            getParams.pageSize = process.env.limit;
          }
          if (req.query["start"] && req.query["length"]) {
            getParams.page =
              parseInt(req.query["start"]) / parseInt(req.query["length"]) + 1;
          } else {
            getParams.page = 1;
          }
          excludeParams.map(e => {
            delete getParams[e];
          });
          if (!getParams["role"]) {
            try {
              let me = await this.get(
                req,
                res,
                process.env.API_DOMAIN_URL_10004 + "/api/info/me",
                "get",
                true
              );
              getParams["role"] = me.organisationUnit;
            } catch (err) {
              console.log("Auto Role Failed", err.message);
            }
          }
          if (edp.query) {
            //console.log(edp.query);
            Object.keys(edp.query).map(function(k) {
              if (!getParams[k]) {
                getParams[k] = edp.query[k];
              }
            });

            // edp.query.array.map((k, v) => {
            //   //   if (!getParams[k]) {
            //   //     getParams.push({ k: v });
            //   //   }
            // });
          }
          Object.keys(getParams).map(function(k) {
            if (typeof getParams[k] == "string") {
              if (getParams[k].toString().indexOf("||")) {
                console.log(k, typeof getParams[k], getParams[k]);
                getParams[k] = getParams[k].toString().split("||");
              }
            }
          });
          stringField = queryString.stringify(getParams);
        }
        console.log("stringField", stringField);
        dataUrl = edp.url + "?" + stringField;
        console.log(dataUrl);
        // res.send(dataUrl);
        // res.end();
        //return;
      }
      // console.log("modelUrl :", modelUrl);
      const model = await this.get(
        req,
        res,
        modelUrl,
        cfg["model"]["get"]["method"],
        cfg["model"]["get"]["authorization"]
      );
      // console.log("dataUrl :", dataUrl);

      const datas = await this.get(
        req,
        res,
        dataUrl,
        cfg["list"]["method"],
        cfg["list"]["authorization"]
      );
      //console.log(data)
      let data = [];
      if (datas.statusCode && datas.data) {
        data = datas.data;
      } else {
        data = datas;
      }

      const resData = data.rows.map(r => {
        let resp = {};
        model.table.columns.map(c => {
          if (r[c.field] === undefined) {
            //console.log("[", group, "] Column", c.field, "is", r[c.field]);
          }
          resp[c.field] = r[c.field] === undefined ? "" : r[c.field];
        });
        if (cfg["list"]["extraField"]) {
          cfg["list"]["extraField"].map(c => {
            //console.log("extraField", cfg["list"]["extraField"]);
            if (r[c] !== undefined) {
              resp[c] = r[c];
            } else {
              resp[c] = "";
            }
          });
        }
        return resp;
      });
      if (bypass == "true") {
        res.json({
          draw: draw || 1,
          recordsTotal: data.totalRecords,
          recordsFiltered: data.totalRecords,
          data: data.rows || []
        });
      } else {
        res.json({
          draw: draw || 1,
          recordsTotal: data.totalRecords,
          recordsFiltered: data.totalRecords,
          data: resData || [],
          columns: model.table.columns
        });
      }
    } catch (error) {
      console.log("*** Error get api");
      // console.log(error);
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else if (error.request) {
        res.status(500).send(error.request);
      } else {
        res.status(500).send(error.message);
      }
    }
  });
};
module.exports.excelExportProxy = (server, endpoint, group, cb) => {
  server.get(endpoint, async (req, res) => {
    try {
      const excludeParams = [
        "draw",
        "columns",
        "order",
        "start",
        "length",
        "search",
        "_",
        "bypass"
      ];
      let jsonCsv = [];
      let getParams = {};
      let stringField = "";

      for (var obj in req.query) {
        getParams[obj] = req.query[obj];
      }
      if (req.method == "POST") {
        console.log(req.body);
        for (var obj in req.body) {
          getParams[obj] = req.body[obj];
        }
      }

      let configPath = path.resolve(process.cwd(), "configs/api.config.json");
      if (!fs.existsSync(configPath)) {
        console.log(configPath, "is not exists");
        res.status(500).send({
          error: "configpath_notfound",
          error_message: configPath + "is not exists"
        });
        return {};
      }
      console.log("Read API spec from ", configPath);
      let encoding /*: string */ = "utf8";
      const apispec = JSON.parse(
        fs.readFileSync(configPath, {
          encoding
        })
      );
      const cfg = apispec[group];
      if (!cfg) {
        res.status(500).send({
          error: "apispec_notfound",
          error_message:
            "Couldn't proxy data without API spec. Please config api spec in configs/api.config.json"
        });
        res.end();
        return;
      }
      let modelUrl =
        process.env.API_DOMAIN_URL_12000 + cfg["model"]["get"]["endpoint"];
      let dataUrl =
        process.env.API_DOMAIN_URL_10004 + cfg["export"]["endpoint"];
      if (cfg["export"]["endpoint"].indexOf("/standard/api") === 0) {
        dataUrl = process.env.API_DOMAIN_URL_8999 + cfg["export"]["endpoint"];
      }
      let edp = queryString.parseUrl(dataUrl);

      console.log("modelUrl :", modelUrl);
      const model = await this.get(
        req,
        res,
        modelUrl,
        cfg["model"]["get"]["method"],
        cfg["model"]["get"]["authorization"]
      );
      let columns = model.table.columns || [];
      columns = columns.filter(col => {
        if (
          col.hidden != undefined &&
          col.hidden == false &&
          col.export == true
        ) {
          return true;
        } else {
          return false;
        }
      });
      let columns2 = columns.map(r => {
        return r.field;
      });
      let columnsTitle = columns.map(r => {
        return r.header;
      });

      if (getParams) {
        if (getParams.orderBy) {
          getParams.sortField = getParams.orderBy;
          let sortOrder = getParams.orderDir == "asc" ? 1 : -1;
          getParams.sortOrder = sortOrder;
        }
        if (getParams["length"]) {
          getParams.pageSize = getParams["length"];
        } else {
          getParams.pageSize = process.env.limit;
        }
        if (getParams["start"] && getParams["length"]) {
          getParams.page =
            parseInt(getParams["start"]) / parseInt(getParams["length"]) + 1;
        } else {
          getParams.page = 1;
        }
        if (group == "invoice") {
          getParams["selectFields"] = columns.map(r => {
            if (r.field === "invoiceTotal") return "total";
            if (r.field === "status") return "lifecycle";
            if (r.field === "sendToCMS") return "customisedFields";
            if (r.field === "sendToBank") return "paymentItemLinearId";
            return r.field;
          });
        } else if (group == "po") {
          getParams["selectFields"] = columns.map(r => {
            if (r.field === "status") return "lifecycle";
            if (r.field === "poAmount") return "initialTotal";
            if (r.field === "poRemainingAmount") return "remainingTotal";
            return r.field;
          });
        }
        delete getParams.orderBy;
        delete getParams.orderDir;
        excludeParams.map(e => {
          delete getParams[e];
        });
        if (!getParams["role"]) {
          try {
            let me = await this.get(
              req,
              res,
              process.env.API_DOMAIN_URL_10004 + "/api/info/me",
              "get",
              true
            );
            getParams["role"] = me.organisationUnit;
          } catch (err) {
            console.log("Auto Role Failed", err.message);
          }
        }
        if (edp.query) {
          //console.log(edp.query);
          Object.keys(edp.query).map(function(k) {
            if (!getParams[k]) {
              getParams[k] = edp.query[k];
            }
          });

          // edp.query.array.map((k, v) => {
          //   //   if (!getParams[k]) {
          //   //     getParams.push({ k: v });
          //   //   }
          // });
        }
        Object.keys(getParams).map(function(k) {
          if (typeof getParams[k] == "string") {
            if (getParams[k].toString().indexOf("||")) {
              //console.log(k, typeof getParams[k], getParams[k]);
              getParams[k] = getParams[k].toString().split("||");
            }
          }
        });
        stringField = queryString.stringify(getParams);
        dataUrl = edp.url + "?" + stringField;
      }

      console.log("dataUrl :", dataUrl);
      const data = await this.get(
        req,
        res,
        dataUrl,
        cfg["export"]["method"],
        cfg["export"]["authorization"]
      );

      let rows = data.rows || [];

      let csvs = [];
      rows.map((row, i, arr) => {
        let tmp = {};
        columns2.map((key, x, arr2) => {
          let col = columns.filter(col => col.field == key)[0];
          if (typeof cb == "function") {
            let newdata = cb(key, this.getValue(row, key), row);
            row[key] = newdata !== undefined ? newdata : row[key];
            //return;
          }
          if (col.type == "number") {
            //console.log('number', key)
            let fm = col.pattern || "#,###.00";
            tmp[key.replace(/\./g, "_")] = numeral(
              this.getValue(row, key)
            ).format(fm);
            return;
          } else if (col.type == "date" || col.templateName == "dueDate") {
            //console.log('date,dueDate', key)
            // col.pattern = col.pattern.toUpperCase().replace("HH:", "hh:");
            let old = this.getValue(row, key);
            if (old == "" || old == "-") {
              tmp[key.replace(/\./g, "_")] = old;
              //return;
            } else {
              tmp[key.replace(/\./g, "_")] = moment(this.getValue(row, key))
                // .tz("Asia/Bangkok")
                .format(col.pattern);
              //return;
            }
          } else {
            //console.log('other', key)
            tmp[key.replace(/\./g, "_")] = this.getValue(row, key);
          }
        });
        csvs.push(tmp);
      });
      if (req.query["json"]) {
        res.status(200).send({
          csvs: csvs,
          rows: rows
        });
        res.end();
        return;
      }
      if (csvs.length == 0) {
        res.status(404).send("No record found");
        res.end();
      }
      res.xlsx(req.params.filename, csvs, {
        fieldNames: columnsTitle
      });
    } catch (err) {
      //console.log(err);
      res.status(500).send(err.message);
      res.end();
    }
  });
};
