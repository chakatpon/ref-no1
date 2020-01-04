const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const moment = require("moment");
module.exports = function(server, queryString) {
  apis.datatableProxy(server, "/api/liv/invoices", "liv-inv");
  apis.datatableProxy(server, "/api/liv/creditnotes", "liv-cn");
  apis.datatableProxy(server, "/api/liv/debitnotes", "liv-dn");

  apis.excelExportProxy(
    server,
    "/api/liv/invoices/export/:filename",
    "liv-inv",
    (col, data, row) => {
      if (col == "invoicePostingIsSuccessful") {
        if (
          row.invoicePostingIsSuccessful &&
          row.invoicePostingIsSuccessful !== ""
        ) {
          return "Success";
        } else {
          return "Fail";
        }
      }
      if (col == "invoiceDate") {
        return row.invoiceDate;
        // return moment(row.invoiceDate).format("DD/MM/YYYY");
      }
    }
  );
  apis.excelExportProxy(
    server,
    "/api/liv/creditnotes/export/:filename",
    "liv-cn",
    (col, data, row) => {
      if (col == "creditPostingIsSuccessful") {
        if (
          row.creditPostingIsSuccessful &&
          row.creditPostingIsSuccessful !== ""
        ) {
          return "Success";
        } else {
          return "Fail";
        }
      }
      if (col == "creditNoteDate") {
        return row.creditNoteDate;
        // return moment(row.creditNoteDate).format("DD/MM/YYYY");
      }
    }
  );
  apis.excelExportProxy(
    server,
    "/api/liv/debitnotes/export/:filename",
    "liv-dn",
    (col, data, row) => {
      if (col == "debitNoteDate") {
        return row.debitNoteDate;
        // return moment(row.creditNoteDate).format("DD/MM/YYYY");
      }
    }
  );
};
