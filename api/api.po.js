const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
module.exports = function(server, queryString) {
  apis.datatableProxy(server, "/api/purchaseorders", "po");
  apis.datatableProxy(server, "/api/purchaseitems", "poitem");
  apis.datatableProxy(server, "/api/purchaseOrders/native", "po");
  apis.excelExportProxy(
    server,
    "/api/po/export/:filename",
    "po",
    (col, data, row) => {
      if (col == "poAmount") {
        let dt = 0;
        if (row.initialTotal && row.initialTotal.quantity) {
          dt =
            parseFloat(row.initialTotal.quantity) *
            parseFloat(row.initialTotal.displayTokenSize);
        }
        return dt;
      }
      if (col == "poRemainingAmount") {
        let dt = 0;
        if (row.remainingTotal && row.remainingTotal.quantity) {
          dt =
            parseFloat(row.remainingTotal.quantity) *
            parseFloat(row.remainingTotal.displayTokenSize);
          return dt;
        }
      }
    }
  );
};
