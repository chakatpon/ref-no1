const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
module.exports = function(server, queryString) {
  apis.datatableProxy(server, "/api/purchaseitems/native", "po-delivery");
  apis.excelExportProxy(
    server,
    "/api/po-delivery/export/:filename",
    "po-delivery"
  );
};
