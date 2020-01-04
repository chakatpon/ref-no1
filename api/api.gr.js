const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
module.exports = function(server, queryString) {
  apis.datatableProxy(server, "/api/goodsreceivedheader/native", "gr");
  apis.datatableProxy(server, "/api/goodsreceivedheader", "gr");
  apis.excelExportProxy(
    server,
    "/api/gr/export/:filename",
    "gr",
    (col, data, row) => {
      if (col == "invoiceExternalId") {
        if (row.invoiceExternalId == row.initialInvoiceExternalId) {
          return "-";
        } else {
          return data;
        }
      }
    }
  );
};
