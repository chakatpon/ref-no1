const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const unmatchedCode = require("../configs/unmatchedCode.config.json");
module.exports = function(server, queryString) {
  apis.datatableProxy(server, "/api/2wmlist", "twoWayMatching");
  apis.excelExportProxy(server, "/api/2wm/export/:filename", "twoWayMatching");
  server.get("/api/mapping/2wm/detail/:linearId", async (req, res) => {
    try {
      const resp = await apis.get(
        req,
        res,
        `${process.env.API_DOMAIN_URL_10004}/api/creditnotes/${req.params.linearId}`,
        {
          data: req.body
        },
        true
      );

      if (!resp) {
        return res.status(404).send({
          status: 404,
          error: "Not Found",
          message: "Data Not Found"
        });
      }
      if (resp.totalRecords != 1) {
        return res.status(404).send({
          status: 404,
          error: "Not Found",
          message: "Data Not Found"
        });
      }
      let json = {
        page: resp.page,
        pageSize: resp.pageSize,
        totalRecords: resp.totalRecords,
        data: {}
      };
      let rs = resp.rows[0];

      const resActionHisory = await apis.get(
        req,
        res,
        `${process.env.API_DOMAIN_URL_8999}/standard/api/actionhistory?documentType=creditnote&documentLinearId=${req.params.linearId}`,
        {
          data: req.body
        },
        true
      );

      const actionHistory = resActionHisory.map(itmActionHistory => {
        let actionName = "";
        switch (itmActionHistory.actionName) {
          case "BilateralMatch":
            actionName = "2 Way Matching Result";
            break;
          case "BuyerApproveQuantity":
            actionName = "Manual Approval";
            break;
          case "BuyerRejectQuantity":
            actionName = "Request to Resubmit";
            break;
          default:
            actionName = itmActionHistory.actionName;
            break;
        }

        let actionBy = "";
        switch (itmActionHistory.actionBy) {
          case "SYSTEM":
            actionBy = "2 Way Matching";
            break;
          default:
            actionBy = itmActionHistory.commonName || itmActionHistory.actionBy;
            break;
        }

        let attachmentFile = [];
        let file = itmActionHistory.attachments.map(f => {
          let obj = {
            name: f.attachmentName,
            href: `/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
          };
          attachmentFile.push(obj);
        });

        return {
          ...itmActionHistory,
          actionName,
          actionBy,
          attachmentFile
        };
      });

      // let actionHistoryFilter = [];

      // actionHistory.forEach(ahItem => {
      //   const allName = actionHistoryFilter.map(ahF => ahF.actionName);
      //   if (ahItem.actionName !== "2 Way Matching Result") {
      //     actionHistoryFilter = [...actionHistoryFilter, ahItem];
      //   } else if (!allName.includes(ahItem.actionName)) {
      //     actionHistoryFilter = [...actionHistoryFilter, ahItem];
      //   } else if (ahItem.attachments.length) {
      //     actionHistoryFilter = actionHistoryFilter.map(ah => {
      //       if (ah.actionName === "2 Way Matching Result") {
      //         return ahItem;
      //       }
      //       return ah;
      //     });
      //   }
      // });

      let data = {
        externalId: rs.externalId,
        entryDate: rs.documentEntryDate,
        currency: rs.currency,
        status: rs.status,
        lifecycle: rs.lifecycle,
        matchingStatus: rs.matchingStatus,
        invoiceTotal: rs.invoiceTotal,
        totalPayable: rs.totalPayable,
        currency: rs.currency,
        amountMatching: {},
        vendor: [],
        company: [],
        creditNoteInfo: [],
        attachments: [],
        matchingItems: [],
        matchingDetail: [],
        isETaxInvoice: rs.isETaxInvoice,
        restrictedMap: rs.restrictedMap,
        disclosedMap: rs.disclosedMap,
        unmatchedCode: rs.unmatchedCode || [],
        adjustmentType: rs.adjustmentType,
        actionHistory: actionHistory,
        actionHistoryOriginal: resActionHisory
      };

      let taxInvoiceAmount = 0;
      let subInvoiceAmount = 0;
      rs.creditNoteItems.map(itm => {
        taxInvoiceAmount =
          taxInvoiceAmount + (itm.subTotal * itm.taxRate) / 100;
      });
      rs.creditNoteItems.map(itm => {
        subInvoiceAmount = subInvoiceAmount + itm.subTotal;
      });

      const setTwoDemicalFloat = number => {
        return parseFloat(
          parseFloat(Math.round(number * 100) / 100).toFixed(2)
        );
      };
      data = {
        ...data,
        amountMatching: {
          taxTotal: {
            systemAmount: setTwoDemicalFloat(taxInvoiceAmount),
            invoiceAmount: setTwoDemicalFloat(rs.vatTotal),
            diffAmount:
              setTwoDemicalFloat(rs.vatTotal) -
              setTwoDemicalFloat(taxInvoiceAmount)
          },
          subTotal: {
            systemAmount: setTwoDemicalFloat(subInvoiceAmount),
            invoiceAmount: setTwoDemicalFloat(rs.subTotal),
            diffAmount:
              setTwoDemicalFloat(rs.subTotal) -
              setTwoDemicalFloat(subInvoiceAmount)
          }
        }
      };

      data = {
        ...data,
        vendor: {
          vendorNumber: rs.vendorNumber,
          vendorBranchCode: rs.vendorBranchCode,
          vendorName: rs.vendorName,
          vendorTaxNumber: rs.vendorTaxNumber,
          vendorAddress: rs.vendorAddress,
          vendorTel: rs.vendorTelephone
        }
      };

      data = {
        ...data,
        company: {
          companyCode: rs.companyCode,
          companyName: rs.companyName,
          companyTaxNumber: rs.companyTaxNumber,
          companyBranch:
            rs.companyBranchName != ""
              ? `${rs.companyBranchCode} (${rs.companyBranchName})`
              : rs.companyBranchCode,
          companyBranchCode: rs.companyBranchCode,
          companyBranchName: rs.companyBranchName,
          companyAddress: rs.companyAddress,
          companyTel: rs.companyTelephone
        }
      };

      data = {
        ...data,
        creditNoteInfo: {
          creditNoteNo: rs.externalId,
          InvoiceRef: rs.invoiceExternalId,
          InvoiceLinearId: rs.invoiceLinearId,
          AttactCreditNote: rs.fileAttachments
            .filter(f => f.attachmentType == "CreditNote")
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            }),
          creditNoteDate: rs.creditNoteDate,
          Reason: rs.reason
        }
      };

      data = {
        ...data,
        attachments: {
          receiptNumber: rs.receiptNumber,
          fileAttachmentsCreditNote: rs.fileAttachments
            .filter(f => f.attachmentType == "CreditNote")
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            }),
          fileAttachmentsOther: rs.fileAttachments
            .filter(f => ["Others"].includes(f.attachmentType))
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            })
        }
      };

      data = {
        ...data,
        matchingItems: rs.creditNoteItems.map((itm, i) => {
          return {
            itemId: ("0000" + itm.externalId).slice(-3),
            matchedStatus:
              (itm.unmatchedCode && itm.unmatchedCode.length === 0) ||
              !itm.unmatchedCode
                ? "matched"
                : "unmatched"
          };
        })
      };

      const mappingMatchingItem = (itm, i) => {
        let _grNo = [];

        itm.goodsReceivedItems.map((curr, i, arr) => {
          if (!_grNo.includes(curr.externalId)) {
            _grNo = [..._grNo, curr.externalId];
          }
        });
        if (_grNo && _grNo.length > 1) {
          _grNo == "Multiple Value";
        } else if (_grNo && _grNo.length == 1) {
          _grNo = _grNo[0];
        } else {
          _grNo = "";
        }
        let _grQuantity = 0;
        itm.goodsReceivedItems.map((curr, i, arr) => {
          _grQuantity += curr.quantity.initial;
        });

        let _grUnitDescription = [];
        itm.goodsReceivedItems.map((curr, i, arr) => {
          if (!_grUnitDescription.includes(curr.quantity.unit)) {
            _grUnitDescription = [..._grUnitDescription, curr.quantity.unit];
          }
        });
        if (_grUnitDescription && _grUnitDescription.length > 1) {
          _grUnitDescription = "Multiple Value";
        } else if (_grUnitDescription && _grUnitDescription.length == 1) {
          _grUnitDescription = _grUnitDescription[0];
        } else {
          _grUnitDescription = "";
        }
        let _grDate = [];
        itm.goodsReceivedItems.map((curr, i, arr) => {
          if (!_grDate.includes(curr.postingDate)) {
            _grDate = [..._grDate, curr.postingDate];
          }
        });
        if (_grDate && _grDate.length > 1) {
          _grDate == "Multiple Value";
        } else if (_grDate && _grDate.length == 1) {
          _grDate = _grDate[0];
        } else {
          _grDate = "";
        }
        return {
          companyTaxNumber: rs.companyTaxNumber,
          linearId: itm.linearId,
          itemId: ("0000" + itm.externalId).slice(-3),
          purchaseOrderExternalId: itm.purchaseOrderExternalId,
          purchaseItemLinearId: itm.purchaseItemLinearId,
          purchaseItemExternalId: itm.purchaseItemExternalId,
          materialDescription: itm.materialDescription,
          materialNumber: itm.materialNumber,
          matchedStatus:
            (itm.unmatchedCode && itm.unmatchedCode.length === 0) ||
            !itm.unmatchedCode
              ? "matched"
              : "unmatched",

          unmatchedCode: itm.unmatchedCode || [],
          matchedCode: {},
          unmatchedReason: itm.unmatchedReason,
          status: itm.status,
          lifecycle: itm.lifecycle,
          unitPrice: itm.unitPrice,
          quantity: itm.quantity,
          unitDescription: itm.unitDescription,
          date: itm.issuedDate,
          amount: itm.quantity * itm.unitPrice,
          currency: itm.currency,
          externalId: rs.externalId,

          goodsReceivedItems: {
            grNo: _grNo,
            grUnitPrice: "",
            grQuantity: _grQuantity,
            grUnitDescription: _grUnitDescription,
            grDate: _grDate,
            grAmount: "",
            grCurrency: "",
            items: itm.goodsReceivedItems.map(gr => {
              return {
                grNumber: gr.goodsReceivedExternalId,
                grItemNo: gr.externalId,
                originalGr: gr,
                grItemUnitPrice: "",
                grItemQuantity: gr.quantity.initial,
                grItemUnitDescription: gr.quantity.unit,
                grItemDate: gr.postingDate,
                grItemAmount: "",
                grItemCurrency: "",
                grItemLinearId: gr.linearId,
                grItemLifecycle: gr.lifecycle
              };
            })
          },
          creditnoteItems: {
            externalId: rs.externalId,
            itemId: ("0000" + itm.externalId).slice(-3),
            unitPrice: itm.unitPrice,
            quantity: itm.quantity,
            unitDescription: itm.unitDescription,
            date: itm.issuedDate,
            amount: itm.quantity * itm.unitPrice,
            currency: itm.currency
          }
        };
      };

      const matchingDetail = rs.creditNoteItems.map(mappingMatchingItem);

      data = {
        ...data,
        matchingDetail
      };
      json = { ...json, data, original: rs };
      return res.json(json);
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

  server.post("/api/mapping/grtag2wm/:linearId", async (req, res) => {
    try {
      let json = {};

      const respChecked = await apis.get(
        req,
        res,
        `${process.env.API_DOMAIN_URL_10004}/api/goodsreceived?movementClass=RETURN&siblingLinearId=IS_NULL&purchaseItemLinearId=${req.params.linearId}&lifecycle=ISSUED`,
        {
          data: req.body
        },
        true
      );
      let taggedGr = req.body.goodsReceivedItems.map(r => ({
        tagged: true,
        ...r
      }));
      json = respChecked.rows.map(r => {
        return {
          tagged: false,
          ...r
        };
      });

      if (!respChecked) {
        return res.status(404).send({
          status: 404,
          error: "Not Found",
          message: "Data Not Found"
        });
      }
      return res.json({
        page: respChecked.page,
        pageSize: respChecked.pageSize,
        totalRecords: respChecked.totalRecords,
        data: [...taggedGr, ...json]
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
