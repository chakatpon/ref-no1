const axios = require("axios");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const numeral = require("numeral");
const format = require("date-format");
// const moment = require("moment-timezone");

module.exports = function(server, queryString) {
  function findHostForUrl(url) {
    let urlWithHost = url;
    if (url.indexOf("http") === -1) {
      if (url.indexOf("/standard/api") !== -1) {
        urlWithHost = process.env.API_DOMAIN_URL_8999 + url;
      } else {
        urlWithHost = process.env.API_DOMAIN_URL_10004 + url;
      }
    }
    return urlWithHost;
  }

  function formatUrl(url, query) {
    let returnUrl = url;

    const excludeParams = [
      "draw",
      "columns",
      "container",
      "endpoint",
      "order",
      "start",
      "length",
      "search",
      "_",
      "bypass"
    ];

    let getParams = query;
    let stringField = "";
    let realendpoint = findHostForUrl(url);
    let edp = queryString.parseUrl(realendpoint);

    try {
      if (query.bypass == "true") {
        excludeParams.map(e => {
          delete getParams[e];
        });
        Object.keys(getParams).map(function(k) {
          if (getParams[k].toString().indexOf("||")) {
            getParams[k] = getParams[k].toString().split("||");
          }
        });
        stringField = queryString.stringify(getParams);
      } else {
        if (getParams) {
          if (query["order"]) {
            let sortField =
              query["columns"][query["order"][0]["column"]]["name"];
            getParams.sortField = sortField;
            let sortOrder = query["order"][0]["dir"] == "asc" ? 1 : -1;
            getParams.sortOrder = sortOrder;
          }
          if (query["length"]) {
            getParams.pageSize = query["length"];
          } else {
            getParams.pageSize = 2000;
          }
          if (query["start"] && query["length"]) {
            getParams.page =
              parseInt(query["start"]) / parseInt(query["length"]) + 1;
          } else {
            getParams.page = 1;
          }
          excludeParams.map(e => {
            delete getParams[e];
          });

          if (edp.query) {
            Object.keys(edp.query).map(function(k) {
              if (!getParams[k]) {
                getParams[k] = edp.query[k];
              }
            });
          }
          // console.log("param: " + queryString.stringify(getParams));
          Object.keys(getParams).map(function(k) {
            if (getParams[k].toString().indexOf("||")) {
              getParams[k] = getParams[k].toString().split("||");
            }
          });
          stringField = queryString.stringify(getParams);
        }
        returnUrl = edp.url + "?" + stringField;
      }
    } catch (error) {
      console.error("Error:", error);
    }
    console.log(`URL : ${returnUrl}`);
    return returnUrl;
  }

  // apis.datatableProxy(server, "/customs/api/documents", "tracking-scg");
  // module.exports.datatableProxy = (server, endpoint, group, realendpoint) => {
  server.get("/custom-tracking", (req, res) => {
    res.status(200).send(process.env.CUSTOM_TRACKING);
  });

  server.put("/api-proxy", async (req, res) => {
    const { endpoint } = req.query;

    let authorization = req.headers["authorization"];
    if (req.cookies["aToken"]) {
      authorization = "Bearer " + req.cookies["aToken"];
    }
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authorization
    };
    let realendpoint = findHostForUrl(endpoint);
    console.log("Endpoint: ", realendpoint, JSON.stringify(req.body));

    try {
      const resp = await axios({
        url: realendpoint,
        method: "put",
        strictSSL: false,
        agent: new (require("https")).Agent({
          rejectUnauthorized: false
        }),
        headers: headers,
        query: req.query,
        data: JSON.stringify(req.body)
      });
      return res.json(resp.data);
    } catch (error) {
      console.log("Error: ", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        res.status(error.response.status).send(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        res.status(500).send(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        res.status(500).send(error.message);
      }
    }
  });

  server.get("/datatable-proxy", async (req, res) => {
    const { endpoint, columns, container } = req.query;
    console.log("endpoint: " + endpoint, columns);
    console.log("container: " + container);

    const draw = req.query.draw || 1;
    const realendpoint = formatUrl(endpoint, req.query);

    try {
      const tempData = await apis.get(req, res, realendpoint, "GET", true);
      // console.log("tempData :", tempData);
      let data = tempData;
      let totalRecords = data.totalRecords;
      if (container) {
        data = data[container];
        // console.log("container :", container, data);
      }
      if (!totalRecords) {
        totalRecords = data.length;
      }
      // const resData = data.map(r => {
      //   console.log("row: ", r);
      //   return columns.map(c => {
      //     r[c.name] === undefined ? "" : r[c.name];
      //   });
      // });
      res.json({
        draw: draw || 1,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        columns: columns,
        data: data || []
      });
    } catch (error) {
      console.error("Error: ", error);
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else if (error.request) {
        res.status(500).send(error.request);
      } else {
        res.status(500).send(error.message);
      }
    }
  });

  function isTrue(value) {
    return value == "true" || value == true;
  }

  // module.exports.excelExportProxy = (server, endpoint, group, cb) => {
  server.get("/excel-export/:filename", async (req, res) => {
    let { endpoint, columns, container } = req.query;
    console.log("endpoint: ", endpoint);
    console.log("container: ", container);
    console.log("columns: ", columns);
    const realendpoint = formatUrl(endpoint, req.query);

    try {
      const tempData = await apis.get(req, res, realendpoint, "GET", true);
      console.log("tempData :", tempData);
      let data = tempData;
      if (container) {
        data = data[container];
        console.log("container :", container, data);
      }

      let filteredColumns = columns.filter(col => {
        if (col.hidden != null && !isTrue(col.hidden) && isTrue(col.export)) {
          return true;
        } else {
          return false;
        }
      });
      let columnsField = filteredColumns.map(r => {
        return r.field;
      });
      let columnsTitle = filteredColumns.map(r => {
        return r.header;
      });
      let rows = data || [];
      let csvs = rows.map(row => {
        resdata = {};
        columnsField.map(key => {
          let col = filteredColumns.filter(col => col.field == key)[0];
          if (!col.type) {
            col.type = "";
          }
          if (col.type == "number") {
            let fm = col.pattern || "#,###.00";
            row[key] = numeral(row[key]).format(fm);
          } else if (col.type == "date" || col.templateName == "dueDate") {
            // col.pattern = col.pattern.replace("HH:", "hh:");
            row[key] = format.asString(col.pattern, new Date(row[key]));
          } else {
          }
          resdata = { ...resdata, [key]: row[key] };
        });

        return resdata;
      });
      res.xlsx(req.params.filename, csvs, {
        fieldNames: columnsTitle
      });
    } catch (error) {
      console.log(error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.warn(error.response.data);
        console.warn(error.response.status);
        console.warn(error.response.headers);
        res.status(error.response.status).send(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.warn(error.request);
        res.status(500).send(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        res.status(500).send(error.message);
      }
    }
  });
  // };

  // apis.datatableProxy(server, "/customs/api/documents", "tracking-scg");
  // apis.datatableProxy(server, "/standard/api/documents*", "tracking");
  // apis.excelExportProxy(server, "/api/tracking/export/:filename", "tracking");
};
