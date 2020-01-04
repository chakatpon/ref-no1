const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const unmatchedCode = require("../configs/unmatchedCode.config.json");
module.exports = function(server, queryString) {
  apis.datatableProxy(server, "/api/doa", "doa");
  apis.excelExportProxy(
    server,
    "/api/doa/export/:filename",
    "doa",
    (col, data, row) => {
      if (col == "documentType") {
        if (data === "INVOICE") {
          return "Invoice";
        } else {
          return "Debit Note";
        }
      }
      if (col == "financing") {
        if (data === "Y") {
          return "Yes";
        } else {
          return "No";
        }
      }
    }
  );
  server.get("/api/mapping/doa/detail/:linearId", async (req, res) => {
    try {
      const url = `${process.env.API_DOMAIN_URL_10004}/api/invoices/${
        req.params.linearId
      }`;
      const resp = await apis.get(
        req,
        res,
        url,
        {
          data: req.body
        },
        true
      );

      const response = resp.data ? resp.data : resp;
      if (!response) {
        return res.status(404).send({
          status: 404,
          error: "Not Found",
          message: "Data Not Found"
        });
      }
      if (response.totalRecords != 1) {
        return res.status(404).send({
          status: 404,
          error: "Not Found",
          message: "Data Not Found"
        });
      }
      let json = {
        page: response.page,
        pageSize: response.pageSize,
        totalRecords: response.totalRecords,
        data: {}
      };
      let rs = response.rows[0];

      const resActionHisory = await apis.get(
        req,
        res,
        `${
          process.env.API_DOMAIN_URL_8999
        }/standard/api/actionhistory?documentType=invoice&documentLinearId=${
          req.params.linearId
        }`,
        {
          data: req.body
        },
        true
      );

      const actionHistory = resActionHisory.map(itmActionHistory => {
        let actionName = "";
        switch (itmActionHistory.actionName) {
          case "TrilateralMatch":
            actionName = "3 Way Matching Result";
            break;
          case "BuyerApprove":
            actionName = "Manual Approval";
            break;
          case "BuyerReject":
            actionName = "Request to Resubmit";
            break;
          case "BuyerClarify":
            actionName = "Clarify";
            break;
          case "AuthorityPartialApprove":
            actionName = "Partial DOA Approval";
            break;
          case "AuthorityFinalApprove":
            actionName = "Final DOA Approval";
            break;
          case "AuthorityReject":
            actionName = "Request Clarification";
            break;
          default:
            actionName = itmActionHistory.actionName;
            break;
        }
        let actionBy = "";
        if (
          itmActionHistory.actionBy === "SYSTEM" &&
          actionName === "3 Way Matching Result"
        ) {
          actionBy = "3 Way Matching";
        } else {
          actionBy = itmActionHistory.actionBy;
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
      //   if (ahItem.actionName !== "3 Way Matching Result") {
      //     actionHistoryFilter = [...actionHistoryFilter, ahItem];
      //   } else if (!allName.includes(ahItem.actionName)) {
      //     actionHistoryFilter = [...actionHistoryFilter, ahItem];
      //   } else if (ahItem.attachments.length) {
      //     actionHistoryFilter = actionHistoryFilter.map(ah => {
      //       if (ah.actionName === "3 Way Matching Result") {
      //         return ahItem;
      //       }
      //       return ah;
      //     });
      //   }
      // });

      let data = {
        externalId: rs.externalId,
        currency: rs.currency,
        status: rs.status,
        matchingStatus: rs.matchingStatus,
        invoiceTotal: rs.invoiceTotal,
        totalPayable: rs.totalPayable,
        currency: "THB",
        amountMatching: {},
        vendor: [],
        company: [],
        paymentinfo: [],
        attachments: [],
        matchingDetail: [],
        lifecycle: rs.lifecycle,
        isETaxInvoice: rs.isETaxInvoice,
        restrictedMap: rs.restrictedMap,
        disclosedMap: rs.disclosedMap,
        matchedCode: rs.matchedCode,
        unmatchedCode: unmatchedCode,
        actionHistory: actionHistory
      };

      let taxInvoiceAmount = 0;
      let subInvoiceAmount = 0;
      rs.items.map(itm => {
        taxInvoiceAmount =
          taxInvoiceAmount + (itm.itemSubTotal * itm.vatRate) / 100;
      });
      rs.items.map(itm => {
        subInvoiceAmount = subInvoiceAmount + itm.itemSubTotal;
      });

      const setTwoDemicalFloat = number => {
        return parseFloat(
          parseFloat(Math.round(number * 100) / 100).toFixed(2)
        );
      };

      let taxTotalSystemAmount = setTwoDemicalFloat(taxInvoiceAmount);
      let taxTotalInvoiceAmount = setTwoDemicalFloat(rs.vatTotal);
      let taxTotalDiffAmount = setTwoDemicalFloat(
        taxTotalInvoiceAmount - taxTotalInvoiceAmount
      );

      let subTotalSystemAmount = setTwoDemicalFloat(subInvoiceAmount);
      let subTotalInvoiceAmount = setTwoDemicalFloat(rs.subTotal);
      let subTotalDiffAmount = setTwoDemicalFloat(
        subTotalInvoiceAmount - subInvoiceAmount
      );

      let totalAmountSystemAmount = setTwoDemicalFloat(
        taxInvoiceAmount + subInvoiceAmount
      );
      let totalAmountInvoiceAmount = setTwoDemicalFloat(
        taxTotalInvoiceAmount + subTotalInvoiceAmount
      );

      let totalAmountDiffAmount = setTwoDemicalFloat(
        taxTotalInvoiceAmount -
          taxTotalSystemAmount +
          subTotalInvoiceAmount -
          subTotalSystemAmount
      );

      data = {
        ...data,
        amountMatching: {
          taxTotal: {
            systemAmount: taxTotalSystemAmount,
            invoiceAmount: taxTotalInvoiceAmount,
            diffAmount: taxTotalDiffAmount
          },
          subTotal: {
            systemAmount: subTotalSystemAmount,
            invoiceAmount: subTotalInvoiceAmount,
            diffAmount: subTotalDiffAmount
          },
          totalAmount: {
            systemAmount: totalAmountSystemAmount,
            invoiceAmount: totalAmountInvoiceAmount,
            diffAmount: totalAmountDiffAmount
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
          vendorTel: ""
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
          companyTel: ""
        }
      };

      let sendToCMS = "";
      let sendToBank = "";
      if (rs.customisedFields.CMS === undefined) {
        sendToCMS = "No";
      } else {
        sendToCMS = "Yes";
      }
      if (
        rs.paymentItemLinearId === "" ||
        rs.paymentItemLinearId === undefined
      ) {
        sendToBank = "No";
      } else {
        sendToBank = "Yes";
      }
      rs.paymentDate = rs.paymentDate === undefined ? "" : rs.paymentDate;
      rs.dueDateLastEditedBy =
        rs.dueDateLastEditedBy === undefined ? "" : rs.dueDateLastEditedBy;
      rs.dueDateLastEditedDate =
        rs.dueDateLastEditedDate === undefined ? "" : rs.dueDateLastEditedDate;
      rs.dueDateLastEditedReason =
        rs.dueDateLastEditedReason === undefined
          ? ""
          : rs.dueDateLastEditedReason;

      let revisedDueDate = rs.dueDate == rs.initialDueDate ? "" : rs.dueDate;
      data = {
        ...data,
        paymentinfo: {
          invoiceDate: rs.invoiceDate,
          paymentDate: rs.paymentDate,
          paymentTermCode: rs.paymentTermCode,
          paymentTermDays: rs.paymentTermDays,
          paymentTermDesc: rs.paymentTermDesc,
          invoiceFinancing: rs.invoiceFinancing,
          sendToCMS,
          sendToBank,
          dueDateLastEditedBy: rs.dueDateLastEditedBy,
          dueDateLastEditedDate: rs.dueDateLastEditedDate,
          dueDate: rs.initialDueDate,
          revisedDueDate: revisedDueDate,
          subTotal: rs.subTotal,
          vatTotal: rs.vatTotal,
          invoiceTotal: rs.invoiceTotal,
          totalPayable: rs.totalPayable,
          dueDateLastEditedReason: rs.dueDateLastEditedReason
        }
      };

      data = {
        ...data,
        attachments: {
          receiptNumber: rs.receiptNumber,
          fileAttachmentsTaxInvoice: rs.fileAttachments
            .filter(f => f.attachmentType == "TaxInvoice")
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            }),
          fileAttachmentsDeliveryNote: rs.fileAttachments
            .filter(f => f.attachmentType == "DeliveryNote")
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            }),
          fileAttachmentsReceipt: rs.fileAttachments
            .filter(f => f.attachmentType == "Receipt")
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
        matchingItems: rs.items.map((itm, i) => {
          return {
            itemId: ("0000" + itm.externalId).slice(-3),
            matchedStatus: itm.unmatchedCode
              ? itm.unmatchedCode.length == 0
                ? "matched"
                : "unmatched"
              : ""
          };
        })
      };

      data = {
        ...data,
        matchingDetail: rs.items.map((itm, i) => {
          let _grNo = [];
          itm.goodsReceivedItems.map((curr, i, arr) => {
            if (!_grNo.includes(curr.externalId)) {
              _grNo = [..._grNo, curr.externalId];
            }
          });
          if (_grNo && _grNo.length > 1) {
            _grNo = "Multiple Value";
          } else if (_grNo && _grNo.length == 1) {
            _grNo = _grNo[0];
          } else {
            _grNo = "";
          }
          let _grQuantity = [];
          itm.goodsReceivedItems.map((curr, i, arr) => {
            _grQuantity = [..._grQuantity, curr.quantity.initial];
          });
          if (_grQuantity && _grQuantity.length > 1) {
            _grQuantity = _grQuantity.reduce(
              (sum, current) => sum + current,
              0
            );
          } else if (_grQuantity && _grQuantity.length == 1) {
            _grQuantity = _grQuantity[0];
          } else {
            _grQuantity = "";
          }
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
            _grDate = "Multiple Value";
          } else if (_grDate && _grDate.length == 1) {
            _grDate = _grDate[0];
          } else {
            _grDate = "";
          }

          let matchedStatus = "unmatched";
          if (
            (itm.unmatchedCode && itm.unmatchedCode.length === 0) ||
            !itm.unmatchedCode
          ) {
            matchedStatus = "matched";
            for (var key in itm.matchedCode) {
              if (itm.matchedCode[key] === "IN_TOLERANCE") {
                matchedStatus = "matchedWithThreshold";
              }
            }
          }

          return {
            linearId: itm.linearId,
            externalId: itm.externalId,
            itemId: ("0000" + itm.externalId).slice(-3),
            purchaseOrderExternalId: itm.purchaseOrderExternalId,
            purchaseItemLinearId: itm.purchaseItemLinearId,
            purchaseItemExternalId: itm.purchaseItemExternalId,
            materialDescription: itm.materialDescription,
            matchedStatus: matchedStatus,
            unmatchedCode: itm.unmatchedCode,
            unmatchedReason: itm.unmatchedReason,
            matchedCode: itm.matchedCode,
            status: itm.status,
            lifecycle: itm.lifecycle,
            companyTaxNumber: rs.companyTaxNumber,

            invoiceItems: {
              invNumber: rs.externalId,
              invItemNo: "",
              invUnitPrice: itm.unitPrice,
              invQuantity: itm.quantity.initial,
              invUnitDescription: itm.quantity.unit,
              invDate: "",
              invAmount: itm.quantity.initial * itm.unitPrice,
              invCurrency: itm.currency
            },

            purchaseItem: {
              poNumber: itm.purchaseItem.poNumber,
              poItemNo: itm.purchaseItem.poItemNo,
              poUnitPrice: itm.purchaseItem.poItemUnitPrice,
              poQuantity: "",
              poUnitDescription: itm.purchaseItem.quantity.unit,
              poDate: itm.purchaseItem.expectedDeliveryDate,
              poAmount:
                itm.purchaseItem.poItemUnitPrice *
                itm.purchaseItem.quantity.initial,
              poCurrency: itm.purchaseItem.poItemUnitPriceCurrency
            },
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
                  grLinearId: gr.goodsReceivedLinearId,
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
            }
          };
        })
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
};
