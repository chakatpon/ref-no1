const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const moment = require("moment");
const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
const ttl = 300;
module.exports = function(server, queryString) {
  apis.datatableProxy(server, "/api/invoices", "invoice");
  //apis.apiProxy(server, "/api/invoices/:linearId", "invoice");
  apis.excelExportProxy(
    server,
    "/api/invoices/export/:filename",
    "invoice",
    (col, data, row) => {
      if (col == "sendToCMS") {
        if (
          row.customisedFields.CMS === undefined ||
          row.customisedFields.CMS === ""
        ) {
          return "No";
        } else {
          return "Yes";
        }
      }
      if (col == "sendToBank") {
        if (
          row.paymentItemLinearId === "" ||
          row.paymentItemLinearId === undefined
        ) {
          return "No";
        } else {
          return "Yes";
        }
      }
      if (col == "invoiceFinancing") {
        if (row.invoiceFinancing == "N") {
          return "No";
        } else {
          return "Yes";
        }
      }
      if (col == "isETaxInvoice") {
        if (row.isETaxInvoice) {
          return "Yes";
        } else {
          return "No";
        }
      }
      // if (col == "invoiceDate") {
      //   return moment(row.invoiceDate).format("DD/MM/YYYY");
      // }
      // if (col == "initialDueDate") {
      //   return moment(row.initialDueDate).format("DD/MM/YYYY");
      // }
      if (col == "dueDate") {
        if (row.dueDate === row.initialDueDate) {
          return "-";
        } else {
          return row.dueDate;
          // return moment(row.dueDate).format("DD/MM/YYYY");
        }
      }
    }
  );

  server.post("/api/invoices/validate/uniqueness", async (req, res) => {
    try {
      const resp = await apis.post(
        req,
        res,
        `${process.env.API_DOMAIN_URL_10004}${req.path}`,
        {
          data: req.body
        },
        true
      );
      return res.json(resp);
    } catch (error) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else if (error.request) {
        res.status(500).send(error.request);
      } else {
        res.status(500).send(error.message);
      }
    }
  });

  server.post("/api/invoices", async (req, res) => {
    try {
      const resp = await apis.post(
        req,
        res,
        `${process.env.API_DOMAIN_URL_10004}${req.path}`,
        {
          data: req.body
        },
        true
      );
      if (!resp[0]) {
        return res.status(500).json(resp);
      }
      if (resp[0].statusCodeValue > 200) {
        return res.status(resp[0].statusCodeValue).json(resp[0].body);
      }
      return res.json(resp);
    } catch (error) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else if (error.request) {
        res.status(500).send(error.request);
      } else {
        res.status(500).send(error.message);
      }
    }
  });

  server.get("/api/invoices/:linearId/edit", async (req, res) => {
    try {
      let getParams = {};
      for (var obj in req.query) {
        getParams[obj] = req.query[obj];
      }
      let linearId = req.params.linearId;
      let url = `/api/invoices/${linearId}`;
      //if (getParams.length > 0) {
      let stringField = queryString.stringify(getParams);
      url += `?${stringField}`;
      //}
      let apie = process.env.API_DOMAIN_URL_10004;
      let resp = await b2papi.call(apie + url, { ttl }, req, res, true);

      if (resp.rows.length != 1) {
        return CustomException.ApiException(
          {
            error: 404,
            message: "Data not found"
          },
          req,
          res
        );
      }
      let editItems = [];

      let data = resp.rows[0];
      data.items.map(r => {
        let itm = editItems.filter(
          rr => rr.linearId == r.purchaseItem.purchaseOrderLinearId
        );
        if (itm.length == 0) {
          let it = {
            linearId: r.purchaseItem.purchaseOrderLinearId,
            purchaseOrderNumber: r.purchaseItem.poNumber,
            invoiceGoodReceivesItems: [],
            goodReceivesItems: []
          };
          r.goodsReceivedItems.forEach(g => {
            if (
              it.invoiceGoodReceivesItems.filter(
                iv => iv.linearId == g.linearId
              ).length == 0
            ) {
              if (g.purchaseItemLinearId == r.purchaseItem.linearId) {
                g.purchaseItems = r.purchaseItem;
              } else {
                g.purchaseItems = {};
              }
              it.invoiceGoodReceivesItems.push(g);
            }
          });
          editItems.push(it);
        } else {
          editItems.map(rr => {
            if (rr.linearId == r.purchaseItem.purchaseOrderLinearId) {
              r.goodsReceivedItems.forEach(g => {
                if (
                  rr.invoiceGoodReceivesItems.filter(
                    iv => iv.linearId == g.linearId
                  ).length == 0
                ) {
                  if (g.purchaseItemLinearId == r.purchaseItem.linearId) {
                    g.purchaseItems = r.purchaseItem;
                  } else {
                    g.purchaseItems = {};
                  }
                  rr.invoiceGoodReceivesItems.push(g);
                }
              });
            }
          });
        }
      });
      editItems.map(r => {
        r.items = [];
        r.invoiceGoodReceivesItems.forEach(g => {
          if (
            r.items.filter(rr => rr.linearId == g.invoiceItemLinearId).length ==
            0
          ) {
            r.items.push({
              linearId: g.invoiceItemLinearId,
              grItems: [g]
            });
          } else {
            r.items.map(rr => {
              if (rr.linearId == g.invoiceItemLinearId) {
                rr.grItems.push(g);
              }
            });
          }
        });
      });

      // await Promise.all(
      //   await editItems.map(async r => {
      //     let purchaseItems = [];
      //     let goodReceivesItems = [];
      //     let po = await b2papi.call(
      //       `${apie}/api/purchaseorders?${queryString.stringify({
      //         purchaseOrderLinearId: r.linearId
      //       })}`,
      //       { ttl },
      //       req,
      //       res,
      //       true
      //     );
      //     let poitems = await b2papi.call(
      //       `${apie}/api/purchaseitems?${queryString.stringify({
      //         purchaseOrderLinearId: r.linearId
      //       })}`,
      //       { ttl },
      //       req,
      //       res,
      //       true
      //     );
      //     let gritems = await b2papi.call(
      //       `${apie}/api/goodsreceived?${queryString.stringify({
      //         purchaseOrderExternalId: r.purchaseOrderNumber,
      //         movementClass: "NORMAL",
      //         filterReverse: "true"
      //       })}`,
      //       { ttl },
      //       req,
      //       res,
      //       true
      //     );
      //     purchaseItems = poitems.rows;
      //     goodReceivesItems = gritems.rows;
      //     //r.purchaseItems = purchaseItems;
      //     //r.goodReceivesItems = goodReceivesItems;
      //     // editItems.push({
      //     //   //...po.rows[0],
      //     //   purchaseItems,
      //     //   goodReceivesItems
      //     // });

      //     return true;
      //   })
      // );
      return res.status(200).json({
        //...resp,
        editItems
      });
    } catch (error) {
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
