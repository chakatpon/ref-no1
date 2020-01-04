const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const moment = require("moment");
module.exports = function(server, queryString) {
  apis.datatableProxy(
    server,
    "/api/invoices/upload/fileMonitoring",
    "monitoring"
  );
  apis.datatableProxy(
    server,
    "/standard/api/invoices/upload/fileMonitoring",
    "monitoring"
  );
  apis.excelExportProxy(
    server,
    "/api/fileMonitoring/export/:filename",
    "monitoring"
  );
  apis.excelExportProxy(
    server,
    "/api/invoicesmonitoring/export/:filename",
    "monitoring",
    (col, data, row) => {
      if (col == "uploadedDate") {
        //return row.uploadedDate;
        return moment(row.uploadedDate).format("DD/MM/YYYY");
      }
    }
  );
  apis.datatableProxy(
    server,
    "/standard/api/invoices/upload",
    "uploadinvoicefile"
  );
  apis.excelExportProxy(
    server,
    "/api/invoicefiles/export/:filename",
    "uploadinvoicefile"
  );
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
