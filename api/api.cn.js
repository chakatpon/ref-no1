const apis = require("../libs/apiproxy");
module.exports = function (server, queryString) {
  apis.datatableProxy(server, "/api/creditnotes", "cn");
  apis.excelExportProxy(
    server,
    "/api/cn/export/:filename",
    "cn",
    (col, data, row) => {
      if (col == "adjustmentType") {
        if (row.adjustmentType === "Goods Return") {
          return "Quantity Adjustment";
        } else {
          return row.adjustmentType;
        }
      }
      if (col == "isETaxCreditNote") {
        if (row.isETaxCreditNote) {
          return "Yes";
        } else {
          return "No";
        }
      }
    }
  );

};
