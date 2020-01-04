const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const moment = require("moment");
const scbPaymentStatusSuccessLifecycle = [
  "PAID"
  // "POSTING_SETTLED",
  // "POSTING_DECLINED",
  // "POSTING_CLEARED"
];
const scbPaymentStatusFailedLifecycle = ["DECLINED"];
const paymentPostingStatusSuccessLifecycle = [
  "POSTING_SETTLED",
  "POSTING_CLEARED"
];
const paymentPostingStatusFailedLifecycle = ["POSTING_DECLINED"];
module.exports = function(server, queryString) {
  apis.datatableProxy(
    server,
    "/api/paymentitems/postings/results",
    "payment-posting"
  );
  apis.excelExportProxy(
    server,
    "/api/paymentposting/export/:filename",
    "payment-posting",
    (col, data, row) => {
      if (col == "lastPostedDate") {
        return row.lastPostedDate;
        // return moment(row.lastPostedDate).format("DD/MM/YYYY");
      }
      if (col == "lastGeneratedDate") {
        return row.lastGeneratedDate;
        // return moment(row.lastGeneratedDate).format("DD/MM/YYYY");
      }
      if (col == "lifecycleSAP") {
        if (paymentPostingStatusSuccessLifecycle.includes(row.lifecycle)) {
          return "Success";
        }
        if (paymentPostingStatusFailedLifecycle.includes(row.lifecycle)) {
          return "Failed";
        }
        return "-";
      }
      if (col == "lifecycleSCB") {
        if (scbPaymentStatusSuccessLifecycle.includes(row.lifecycle)) {
          return "Success";
        }
        if (scbPaymentStatusFailedLifecycle.includes(row.lifecycle)) {
          return "Failed";
        }
        return "-";
      }
      if (col == "postingStatus") {
        if (row.postingStatus === "SUCCESS") {
          return "Success";
        } else if (row.postingStatus === "FAILED") {
          return "Failed";
        } else {
          return "-";
        }
      }
      if (col == "lifecycle") {
        if (row.clearingStatus == "SUCCESS") {
          return "Cleared";
        }
        return "-";
      }
      if (col == "paymentAmount") {
        if (row.paymentAmount && row.withholdingTax) {
          let dt =
            parseFloat(row.paymentAmount) +
            parseFloat(row.withholdingTax.totalWhtAmount);
          return parseFloat(dt);
        }
      }
      if (col == "withholdingTax") {
        if (row.withholdingTax) {
          let dt = row.withholdingTax.totalWhtAmount;
          return parseFloat(dt);
        }
      }
    }
  );
};
