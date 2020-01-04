import React, { Component } from "react";
import _ from "lodash";
import moment from "moment";
import ApiService from "../../libs/ApiService";
import BlockUi from "react-block-ui";
import Router from "next/router";
import { Collapse } from "../page";
import ModalAlert, { BTN_ACTION_BACK, BTN_ACTION_OK } from "../modalAlert";
import { i18n, withTranslation } from "~/i18n";
import {
  formatNumber,
  numberOnly,
  GrThead
} from "../invoices/edit/models/item";
import { async } from "q";
import GA from "~/libs/ga";

const Api = new ApiService();

const QTY_COLUMN_PATTERN = [
  { data: "cnItemNo" },
  { data: "invoiceItemNo" },
  { data: "materialDescription" },
  { data: "poNo" },
  { data: "invoiceQty" },
  { data: "invoiceAmount" },
  { data: "cnQty" },
  { data: "unit" },
  { data: "unitPrice" },
  { data: "cnAmount" },
  { data: "currency" }
];

const PRICE_COLUMN_PATTERN = [
  { data: "cnItemNo" },
  { data: "invoiceItemNo" },
  { data: "materialDescription" },
  { data: "poNo" },
  { data: "invoiceQty" },
  { data: "invoiceAmount" },
  { data: "unit" },
  { data: "unitPrice" },
  { data: "cnAmount" },
  { data: "currency" }
];

const CREATE_TYPE_ENUMS = {
  QTY: "QTY",
  PRICE: "PRICE"
};

class createCreditNoteStepFour extends Component {
  constructor(props) {
    super(props);
    this.toggleBlocking = this.toggleBlocking.bind(this);
    this.state = {
      blocking: false,
      allItems: [],
      vatRate: "",
      invoiceDetail: {},
      entryDate: moment(),
      cnAmount: {},
      cnRmnAmount: 0,
      taxTotal: {},
      createErrMessage: "",
      fileAttachments: [],
      taxRateList: [],
      taxRateListItem: [],
      isChangeSubTotalTaxTotal: false,
      stepFourProp: {},
      totalAmount: 0,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: true,
      buttonAlert: []
    };
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  async componentDidMount() {
    this.toggleBlocking();
    await this.extractAllInvoiceItems(
      this.props.mainState.stepTwoProp.invoiceItems,
      this.props.mainState.stepTwoProp.rowSelected
    );
    await this.calAll();
    this.extractPurchaseItemByTaxRate();
    //this.renderInvoiceItemTable(this.state.allItems);

    this.toggleBlocking();
  }

  isChangeSubTotalTaxTotal = () => {
    if (!this.state.isChangeSubTotalTaxTotal) {
      this.setState({
        isChangeSubTotalTaxTotal: true
      });
    }
  };

  handleAmountChange = e => {
    let input = event.target.value;
    let value = input.replace(".", "");

    if (value == "" || isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      this.state.cnAmount = formatNumber(0, 2);
    } else {
      this.state.cnAmount = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(
        parseFloat(e.target.value.replace(/,/g, "")).toFixed(2),
        2
      );
    }

    this.isChangeSubTotalTaxTotal();
    this.calTotalAmount();
  };
  handleTaxTotalChange = e => {
    let input = event.target.value;
    let value = input.replace(".", "");

    if (value == "" || isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      this.state.taxTotal = formatNumber(0, 2);
    } else {
      this.state.taxTotal = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(
        parseFloat(e.target.value.replace(/,/g, "")).toFixed(2),
        2
      );
    }

    this.isChangeSubTotalTaxTotal();
    this.calTotalAmount();
  };
  calTotalAmount = () => {
    const { cnAmount, taxTotal } = this.state;
    this.setState({
      totalAmount: cnAmount + taxTotal
    });
  };
  extractAllInvoiceItems(invoiceItems, rowSelected) {
    let allItems = [];
    rowSelected.forEach(rowIndex => {
      allItems.push(invoiceItems[rowIndex - 1]);
    });

    this.setState(
      {
        allItems: allItems
      },
      () => {
        // this.renderInvoiceItemTable(this.state.allItems)
      }
    );
  }

  extractPurchaseItemByTaxRate() {
    let purchaseItem = this.state.allItems;
    let taxRateList = [];
    let taxRateListItem = {};

    purchaseItem.forEach(item => {
      if (taxRateList.includes(item.vatRate) == false) {
        taxRateList.push(item.vatRate);
        taxRateListItem[`tax${item.vatRate}`] = [];
      }
      taxRateListItem[`tax${item.vatRate}`] = [
        ...taxRateListItem[`tax${item.vatRate}`],
        item
      ];
    });
    this.setState({
      taxRateList,
      taxRateListItem
    });
  }

  generateRowTableForTax(taxItems) {
    if (this.props.mainState.stepTwoProp.createType === CREATE_TYPE_ENUMS.QTY) {
      if (taxItems.length > 0) {
        return _.map(
          taxItems,
          (
            {
              materialDescription,
              purchaseOrderExternalId,
              quantity,
              creditNoteQuantity,
              itemSubTotal,
              unitPrice,
              creditNoteAdjustedSubtotal,
              currency
            },
            index
          ) => (
            <tr>
              <td>{index + 1}</td>
              <td>{this.props.mainState.stepTwoProp.rowSelected[index]}</td>
              <td>{materialDescription}</td>
              <td>{purchaseOrderExternalId}</td>
              <td>{this.formatQtyNumber(quantity.initial)}</td>
              <td>{this.formatPriceNumber(itemSubTotal)}</td>
              <td>{this.formatQtyNumber(creditNoteQuantity.initial)}</td>
              <td>{quantity.unit}</td>
              <td>{this.formatPriceNumber(unitPrice)}</td>
              <td>{this.formatPriceNumber(creditNoteAdjustedSubtotal)}</td>
              <td>{currency}</td>
            </tr>
          )
        );
      } else {
        return (
          <div>
            <center>No Item Found</center>
          </div>
        );
      }
    } else if (
      this.props.mainState.stepTwoProp.createType === CREATE_TYPE_ENUMS.PRICE
    ) {
      if (taxItems.length > 0) {
        return _.map(
          taxItems,
          (
            {
              materialDescription,
              purchaseOrderExternalId,
              quantity,
              itemSubTotal,
              unitPrice,
              creditNoteAdjustedSubtotal,
              currency
            },
            index
          ) => (
            <tr>
              <td>{index + 1}</td>
              <td>{this.props.mainState.stepTwoProp.rowSelected[index]}</td>
              <td>{materialDescription}</td>
              <td>{purchaseOrderExternalId}</td>
              <td>{this.formatQtyNumber(quantity.initial)}</td>
              <td>{this.formatPriceNumber(itemSubTotal)}</td>
              <td>{quantity.unit}</td>
              <td>{this.formatPriceNumber(unitPrice)}</td>
              <td>{this.formatPriceNumber(creditNoteAdjustedSubtotal)}</td>
              <td>{currency}</td>
            </tr>
          )
        );
      } else {
        return (
          <div>
            <center>No Item Found</center>
          </div>
        );
      }
    }
  }

  ///////This function is to be remove
  // async renderInvoiceItemTable(cnItem) {
  //   console.log(cnItem);
  //   let data = [];
  //   cnItem.forEach((item, index) => {
  //     data.push(
  //       this.populateRowForInvoiceItemTable(
  //         item,
  //         index,
  //         this.props.mainState.stepTwoProp.rowSelected[index]
  //       )
  //     );
  //   });
  //   console.log(data);
  //   let dts = window
  //     .jQuery(this.el)
  //     .DataTable({
  //       //dom: '<<"row justify-content-between align-items-center mb-3"<"col d-flex align-items-center"lp><"col d-flex justify-content-end"<"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><t>>',
  //       language: {
  //         lengthMenu: "Display _MENU_ Per Page"
  //       },
  //       data: data,
  //       columns:
  //         this.props.mainState.stepTwoProp.createType === CREATE_TYPE_ENUMS.QTY
  //           ? QTY_COLUMN_PATTERN
  //           : PRICE_COLUMN_PATTERN,
  //       columnDefs: [
  //         {
  //           targets: [0],
  //           width: "60px"
  //         },
  //         {
  //           targets: [1],
  //           width: "80px"
  //         },
  //         {
  //           targets: [2],
  //           width: "300px"
  //         },
  //         {
  //           targets: [3],
  //           width: "100px"
  //         },
  //         {
  //           targets: [4],
  //           width: "80px"
  //         },
  //         {
  //           targets: [5],
  //           width: "80px"
  //         },
  //         {
  //           targets: [6],
  //           width: "80px"
  //         },
  //         {
  //           targets:
  //             this.props.mainState.stepTwoProp.createType ===
  //               CREATE_TYPE_ENUMS.QTY
  //               ? [7, 8, 9, 10]
  //               : [7, 8, 9],
  //           width: "80px"
  //         },
  //         {
  //           targets: "_all",
  //           orderable: false,
  //           sortable: false
  //         }
  //       ],
  //       order: [[1, "asc"]],
  //       fixedHeader: true,
  //       stateSave: false,
  //       paging: false,
  //       bLengthChange: true,
  //       searching: false,
  //       info: false,
  //       ordering: true
  //     })
  //     .on("error", function (e, settings, techNote, message) {
  //       console.log("An error has been reported by DataTables: ", message);
  //     });

  //   await this.toggleBlocking();
  // }

  ///////This function is to be remove
  // populateRowForInvoiceItemTable(item, index, row) {
  //   if (this.props.mainState.stepTwoProp.createType === CREATE_TYPE_ENUMS.QTY) {
  //     return {
  //       cnItemNo: index + 1,
  //       invoiceItemNo: row,
  //       materialDescription: item.materialDescription,
  //       poNo: item.purchaseOrderExternalId,
  //       invoiceQty: this.formatQtyNumber(item.quantity.initial),
  //       invoiceAmount: this.formatPriceNumber(item.itemSubTotal),
  //       cnQty: this.formatQtyNumber(item.creditNoteQuantity.initial),
  //       unit: item.quantity.unit,
  //       unitPrice: this.formatPriceNumber(item.unitPrice),
  //       cnAmount: this.formatPriceNumber(item.creditNoteAdjustedSubtotal),
  //       currency: item.currency
  //     };
  //   } else if (
  //     this.props.mainState.stepTwoProp.createType === CREATE_TYPE_ENUMS.PRICE
  //   ) {
  //     return {
  //       cnItemNo: index + 1,
  //       invoiceItemNo: row,
  //       materialDescription: item.materialDescription,
  //       poNo: item.purchaseOrderExternalId,
  //       invoiceQty: this.formatQtyNumber(item.quantity.initial),
  //       invoiceAmount: this.formatPriceNumber(item.itemSubTotal),
  //       unit: item.quantity.unit,
  //       unitPrice: this.formatPriceNumber(item.unitPrice),
  //       cnAmount: this.formatPriceNumber(item.creditNoteAdjustedSubtotal),
  //       currency: item.currency
  //     };
  //   }
  // }

  calAll() {
    let total = 0;
    let taxTotal = 0;
    let allItems = this.state.allItems;
    allItems.forEach(item => {
      total = total + item.creditNoteAdjustedSubtotal;
      taxTotal = this.calItemsTaxTotal(allItems);
    });
    if (this.props.mainState.stepFourProp) {
      if (this.props.mainState.stepFourProp.isChangeSubTotalTaxTotal) {
        this.setState({
          cnAmount: this.props.mainState.stepFourProp.cnAmount,
          cnRmnAmount: this.props.mainState.stepFourProp.cnRmnAmount,
          taxTotal: this.props.mainState.stepFourProp.taxTotal,
          totalAmount:
            this.props.mainState.stepFourProp.cnAmount +
            this.props.mainState.stepFourProp.taxTotal,
          isChangeSubTotalTaxTotal: true
        });
      } else {
        this.setState({
          cnAmount: total,
          cnRmnAmount: total,
          taxTotal: taxTotal,
          totalAmount: total + taxTotal
        });
      }
    } else {
      this.setState({
        cnAmount: total,
        cnRmnAmount: total,
        taxTotal: taxTotal,
        totalAmount: total + taxTotal
      });
    }
  }

  calItemsTaxTotal(items) {
    let taxTotal = 0;
    let taxSumMapping = {};

    items.forEach(item => {
      if (_.has(taxSumMapping, `tax${item.vatRate}`)) {
        taxSumMapping[`tax${item.vatRate}`] += +item.creditNoteAdjustedSubtotal;
      } else {
        taxSumMapping[`tax${item.vatRate}`] = +item.creditNoteAdjustedSubtotal;
      }
    });

    _.forOwn(taxSumMapping, (value, key) => {
      taxTotal = taxTotal + +this.calTax(value, key.replace("tax", ""));
    });

    return taxTotal;
  }

  calTax(amount, percentage) {
    return parseFloat(
      (
        parseFloat(amount.toFixed(2)) *
        parseFloat((percentage / 100).toFixed(2))
      ).toFixed(2)
    );
  }

  async submitCreateCreditNote() {
    this.toggleBlocking();
    let uploadPromises = await this.populateFileAttachmentForCreate();
    Promise.all(uploadPromises).then(data => {
      let fileAttachments = data;

      let cnObject = {};
      if (
        this.props.mainState.stepTwoProp.createType === CREATE_TYPE_ENUMS.QTY
      ) {
        cnObject = {
          vendorTaxNumber: this.props.mainState.stepOneProp.selectedInvoice
            .vendorTaxNumber,
          vendorAddress: this.props.mainState.stepOneProp.selectedInvoice
            .vendorAddress,
          vendorNumber: this.props.mainState.stepOneProp.selectedInvoice
            .vendorNumber,
          vendorBranchCode: this.props.mainState.stepOneProp.selectedInvoice
            .vendorBranchCode,
          vendorName: this.props.mainState.stepOneProp.selectedInvoice
            .vendorName,

          companyTaxNumber: this.props.mainState.stepOneProp.selectedInnerItem
            .businessPlaceTaxNumber,
          companyAddress: this.props.mainState.stepOneProp.selectedInvoice
            .companyAddress,
          companyBranchCode: this.props.mainState.stepOneProp.selectedInvoice
            .companyBranchCode,
          companyCode: this.props.mainState.stepOneProp.selectedInvoice
            .companyCode,
          companyBranchName: this.props.mainState.stepOneProp.selectedInvoice
            .companyBranchName,
          companyName: this.props.mainState.stepOneProp.selectedInvoice
            .companyName,
          companyTelephone: this.props.mainState.stepOneProp.selectedInnerItem
            .businessPlacePostalTelephone,
          invoiceExternalId: this.props.mainState.stepOneProp.selectedInvoice
            .externalId,
          invoiceLinearId: this.props.mainState.stepOneProp.selectedInvoice
            .linearId,
          externalId: this.props.mainState.stepThreeProp.creditNote.trim(),
          adjustmentType: "QUANTITY",
          reason: this.props.mainState.stepThreeProp.creditNoteReason,

          creditNoteDate: this.props.mainState.stepThreeProp.creditNoteDate,
          documentEntryDate: moment(this.state.entryDate).format("DD/MM/YYYY"),
          creditNoteAdjustedSubtotal: +this.state.cnAmount,
          subTotal: +this.state.cnAmount,
          vatTotal: +this.state.taxTotal,
          // "total": +this.state.cnAmount,
          total: Number(this.state.cnAmount) + Number(this.state.taxTotal),
          currency: this.props.mainState.stepOneProp.selectedInvoice.currency,

          creditNoteItems: this.populateCNItem(),

          fileAttachments: fileAttachments
        };
      } else if (
        this.props.mainState.stepTwoProp.createType === CREATE_TYPE_ENUMS.PRICE
      ) {
        cnObject = {
          vendorTaxNumber: this.props.mainState.stepOneProp.selectedInvoice
            .vendorTaxNumber,
          vendorAddress: this.props.mainState.stepOneProp.selectedInvoice
            .vendorAddress,
          vendorNumber: this.props.mainState.stepOneProp.selectedInvoice
            .vendorNumber,
          vendorBranchCode: this.props.mainState.stepOneProp.selectedInvoice
            .vendorBranchCode,
          vendorName: this.props.mainState.stepOneProp.selectedInvoice
            .vendorName,

          companyTaxNumber: this.props.mainState.stepOneProp.selectedInnerItem
            .businessPlaceTaxNumber,
          companyAddress: this.props.mainState.stepOneProp.selectedInvoice
            .companyAddress,
          companyBranchCode: this.props.mainState.stepOneProp.selectedInvoice
            .companyBranchCode,
          companyCode: this.props.mainState.stepOneProp.selectedInvoice
            .companyCode,
          companyBranchName: this.props.mainState.stepOneProp.selectedInvoice
            .companyBranchName,
          companyName: this.props.mainState.stepOneProp.selectedInvoice
            .companyName,
          invoiceExternalId: this.props.mainState.stepOneProp.selectedInvoice
            .externalId,
          invoiceLinearId: this.props.mainState.stepOneProp.selectedInvoice
            .linearId,
          externalId: this.props.mainState.stepThreeProp.creditNote.trim(),
          adjustmentType: "PRICE",
          reason: this.props.mainState.stepThreeProp.creditNoteReason,

          creditNoteDate: this.props.mainState.stepThreeProp.creditNoteDate,
          creditNoteAdjustedSubtotal: +this.state.cnAmount,
          subTotal: +this.state.cnAmount,
          vatTotal: +this.state.taxTotal,
          // "total": +this.state.cnAmount,
          total: Number(this.state.cnAmount) + Number(this.state.taxTotal),
          currency: this.props.mainState.stepOneProp.selectedInvoice.currency,

          creditNoteItems: this.populateCNItem(),

          fileAttachments: fileAttachments
        };
      } else {
        console.log("UNSUPPORTED TYPE");
      }
      if (!_.isEmpty(cnObject)) {
        GA.event({
          category: "Credit Note",
          action: "CN Submit (Request)",
          label: `Credit Note | ${
            cnObject.externalId
          } | ${moment().format()}`
          // value: cnObject.total
        });

        Api.postCreateCreditNote(cnObject)
          .then(res => {
            this.toggleBlocking();

            GA.event({
              category: "Credit Note",
              action: "CN Submit (Success)",
              label: `Credit Note | ${
                cnObject.externalId
              } | ${moment().format()}`,
              value: cnObject.total
            });

            Router.push("/credit-note");
          })
          .catch(err => {
            this.toggleBlocking();

            GA.event({
              category: "Credit Note",
              action: "CN Submit (Failed)",
              label: `Credit Note | ${
                cnObject.externalId
              } | ${moment().format()}`
            });

            const response = handleError(err, this.handleDismissBtnModal);
            this.setState({
              ...response
            });
          });
      }
    });
  }

  async populateFileAttachmentForCreate() {
    let fileAttachments = [];
    /// populate & upload file
    let fileTypeMapping = [];
    this.props.mainState.stepThreeProp.creditNoteFiles.forEach(file => {
      fileTypeMapping.push("CreditNote");
    });

    this.props.mainState.stepThreeProp.otherFiles.forEach(file => {
      fileTypeMapping.push("Others");
    });

    let uploadPackage = this.props.mainState.stepThreeProp.creditNoteFiles.concat(
      this.props.mainState.stepThreeProp.otherFiles
    );

    let delay = -1000;
    const delayIncrement = 1000;
    let uploadPromise = uploadPackage.map((file, index) => {
      delay += delayIncrement;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(
            this.uploadFiles(file.data).then(hash => {
              let attachment = {
                attachmentHash: hash,
                attachmentName: file.name,
                attachmentType: fileTypeMapping[index]
              };
              return attachment;
            })
          );
        }, delay);
      });
    });

    return uploadPromise;
  }

  populateCNItem() {
    let cnItemArray = [];
    let items = this.state.allItems;
    items.forEach((item, index) => {
      let cnItemObject = {
        externalId: "" + (index + 1),
        invoiceItemLinearId: item.linearId,
        invoiceItemExternalId: item.externalId,
        quantity: item.creditNoteQuantity.initial,
        unit: item.quantity.unit,
        unitDescription: item.purchaseItem.unitDescription,
        unitPrice: item.unitPrice,
        currency: item.currency,

        subTotal:
          this.props.mainState.stepTwoProp.createType ===
          CREATE_TYPE_ENUMS.PRICE
            ? item.creditNoteAdjustedSubtotal
            : item.creditNoteQuantity.initial * item.unitPrice,
        vatTotal:
          this.props.mainState.stepTwoProp.createType ===
          CREATE_TYPE_ENUMS.PRICE
            ? +this.calTax(item.creditNoteAdjustedSubtotal, item.vatRate)
            : +this.calTax(
                item.creditNoteQuantity.initial * item.unitPrice,
                item.vatRate
              )
      };
      cnItemArray.push(cnItemObject);
    });
    return cnItemArray;
  }

  ///// Util /////

  sliceFileName(fileName) {
    let ext = fileName.lastIndexOf(".");
    let fileNameWithoutExt = fileName.substr(0, ext);
    if (fileNameWithoutExt.length > 15) {
      let charArray = [...fileNameWithoutExt];
      let newFileName =
        charArray[0] +
        charArray[1] +
        charArray[2] +
        charArray[3] +
        "...." +
        charArray[charArray.length - 4] +
        charArray[charArray.length - 3] +
        charArray[charArray.length - 2] +
        charArray[charArray.length - 1];

      return newFileName + fileName.substr(ext);
    } else return fileName;
  }

  numberOnly(event, digitAmount) {
    let input = event.target.value.replace(/[^0-9.]/gm, "");
    let valueReplace = input.replace(/[^0-9.]/gm, "");
    let valueSplit = valueReplace.split(".");
    let digit = valueReplace.replace(".", "");
    let cursorPosition = event.currentTarget.selectionStart;
    let integer = valueSplit[0];
    let decimal = valueSplit[1];
    let typablePosition = digit.length - (decimal ? decimal.length : 0);
    console.log(event);
    console.log("selectionStart", event.currentTarget.selectionStart);
    console.log("selectionEnd", event.currentTarget.selectionEnd);
    console.log("target", event.target);
    console.log("event.which", event.which);
    console.log("digit.length - decimal.length", typablePosition);
    if (
      window.getSelection().toString().length == 0 &&
      ((event.which >= "48" && event.which <= "57") || event.which == "46")
    ) {
      if (event.target.value.indexOf(".") !== -1) {
        if (
          (digit.length >= 16 || decimal.length >= 16 - digitAmount) &&
          event.which != "46"
        ) {
          if (
            (cursorPosition > typablePosition ||
              integer.length >= digitAmount) &&
            event.which != "46"
          ) {
            event.preventDefault();
          }
        } else if (event.which == "46") {
          event.preventDefault();
        }
      } else {
        if (integer.length >= digitAmount && event.which != "46") {
          event.preventDefault();
        }
      }
    } else if (
      (event.which < "48" || event.which > "57") &&
      event.which != "46"
    ) {
      event.preventDefault();
    }
  }

  formatQtyNumber(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    }).format(amount);
  }

  formatPriceNumber(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatNumberInput(input, decimal) {
    let valueReplace = input.replace(/[^0-9.]/gm, "");
    let valueSplit = valueReplace.split(".");
    let interger = valueSplit[0];
    let fraction = "";

    if (input.endsWith(".")) {
      fraction =
        valueSplit[1] === "" ? "." : "." + valueSplit[1].substring(0, decimal);
    } else {
      fraction =
        valueSplit[1] === undefined
          ? ""
          : "." + valueSplit[1].substring(0, decimal);
    }

    return fraction === ""
      ? interger.replace("-", "")
      : (interger + fraction).replace("-", "");
  }

  uploadFiles(data) {
    return Api.postUploadFile(data).then(res => {
      return res[0].attachmentHash;
    });
  }

  ///// NEXT & BACK //////

  async handleBack() {
    await this.props.updateState(this.state);
    //this.props.setMainState({ stepFourProp: this.state });
    this.props.previousStep();
  }

  routeCancel() {
    Router.push("/credit-note");
  }
  // numberOnly = e => {
  //   const keyCode = e.keyCode || e.which;
  //   if ((keyCode >= 48 && keyCode <= 57) || keyCode == 46) {
  //     if (keyCode == 46) {
  //       if (e.target.value.indexOf(".") !== -1) {
  //         e.preventDefault();
  //       }
  //     }
  //     e.target.value = e.target.value.replace(/,/g, "");
  //   } else {
  //     e.preventDefault();
  //   }
  // };
  handleCNAmountFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
  };
  handleCNAmountValidation = async e => {
    let val = parseFloat(e.target.value.replace(/,/g, ""));
    let colorDefault = "#626262";
    let res = false;
    if (val >= 0) {
      res = true;
    }
    if (!res) {
      $(e.target).css("color", "red");
    } else {
      $(e.target).css("color", colorDefault);
    }
    return res;
  };
  handleTaxTotalFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
  };
  handleTaxTotalValidation = async e => {
    let val = parseFloat(e.target.value.replace(/,/g, ""));
    let colorDefault = "#626262";
    let res = false;
    if (val >= 0) {
      res = true;
    }
    if (!res) {
      $(e.target).css("color", "red");
    } else {
      $(e.target).css("color", colorDefault);
    }
    return res;
  };

  render() {
    const { t } = this.props;
    const {
      cnAmount,
      cnRmnAmount,
      isChangeSubTotalTaxTotal,
      taxTotal,
      totalAmount
    } = this.state;
    return (
      <BlockUi tag="div" blocking={this.state.blocking}>
        <div>
          <div id="cn_create" class="step-4">
            <div id="step-indicator" class="col-12">
              <ul class="d-flex justify-content-center">
                <li class="flex-fill finished no-gradient">
                  <div class="indicator step-1 rounded-circle text-center finished">
                    <span class="number">1</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Select Invoice")}</p>
                </li>
                <li class="flex-fill finished no-gradient">
                  <div class="indicator step-2 rounded-circle text-center">
                    <span class="number">2</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Credit Note Items")}</p>
                </li>
                <li class="flex-fill finished">
                  <div class="indicator step-3 rounded-circle text-center">
                    <span class="number">3</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Insert Credit Note Details")}</p>
                </li>
                <li class="flex-fill active">
                  <div class="indicator step-4 rounded-circle text-center">
                    <span class="number">4</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Summary")}</p>
                </li>
              </ul>
            </div>
            <div class="page__header col-12">
              <h2>
                {t("Credit Note No")} :{" "}
                {this.props.mainState.stepThreeProp.creditNote}
              </h2>
            </div>
            <form
              id="cnCreateForm"
              name="cnCreateForm"
              method="post"
              enctype="multipart/form-data"
              action=""
              class="form col-12 px-0"
            >
              <section id="invoice_detail_page" class="box box--width-header">
                <div class="box__header">
                  <div class="justify-content-between align-items-center">
                    <div class="col-4">
                      {" "}
                      {t("Entry Date")} :{" "}
                      <strong>
                        {moment(this.state.entryDate).format("DD/MM/YYYY")}
                      </strong>
                    </div>
                  </div>
                </div>
                <div class="box__inner">
                  <div class="row box">
                    <a
                      href="#vendorInfo"
                      data-toggle="collapse"
                      role="button"
                      aria-expanded="true"
                      area-controls="vendorInfo"
                      class="d-flex w-100 btnToggle"
                    >
                      <div class="col-6">
                        <h3 class="border-bottom gray-1">{t("Vendor")}</h3>
                      </div>
                      <div class="col-6">
                        <h3 class="border-bottom gray-1">{t("Company")}</h3>
                        <i class="fa fa-chevron-up gray-1" aria-hidden="true" />
                        <i
                          class="fa fa-chevron-down gray-1"
                          aria-hidden="true"
                        />
                      </div>
                    </a>

                    <div
                      id="vendorInfo"
                      class="collapse multi-collapse w-100 show"
                    >
                      <div class="card card-body noborder">
                        <div class="row">
                          <div class="col-6">
                            <div class="row">
                              <p class="col-4 text-right">{t("Code")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.vendorNumber
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Name")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.vendorName
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Tax ID")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.vendorTaxNumber
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Branch")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.vendorBranchCode
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Address")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInvoice.vendorAddress
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Tel")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.vendorTelephone
                                }
                              </p>
                            </div>
                          </div>
                          <div class="col-6">
                            <div class="row">
                              <p class="col-4 text-right">{t("Code")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.companyCode
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Name")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.companyName
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Tax ID")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.businessPlaceTaxNumber
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Branch")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem.companyBranchCode
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Address")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInvoice.companyAddress
                                }
                              </p>
                            </div>
                            <div class="row">
                              <p class="col-4 text-right">{t("Tel")} :</p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInnerItem
                                    .businessPlacePostalTelephone
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end box1 */}
                  <div class="row box">
                    <a
                      href="#paymentInfo"
                      data-toggle="collapse"
                      role="button"
                      aria-expanded="true"
                      area-controls="paymentInfo"
                      class="d-flex w-100 btnToggle"
                    >
                      <div class="col-12">
                        <h3 class="border-bottom gray-1">
                          {t("Credit Note Information")}
                        </h3>
                        <i class="fa fa-chevron-up gray-1" aria-hidden="true" />
                        <i
                          class="fa fa-chevron-down gray-1"
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                    <div
                      id="paymentInfo"
                      class="collapse multi-collapse w-100 show"
                    >
                      <div class="card card-body noborder">
                        <div class="row">
                          <div class="col-6">
                            <div class="d-flex flex-wrap">
                              <p class="col-4 text-right">
                                {t("Credit Note Date")} :{" "}
                              </p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepThreeProp
                                    .creditNoteDate
                                }
                              </p>
                            </div>
                            <div class="d-flex flex-wrap">
                              <p class="col-4 text-right">
                                {t("Invoice Ref No")} :
                              </p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepOneProp
                                    .selectedInvoice.externalId
                                }
                              </p>
                            </div>
                            <div class="d-flex flex-wrap">
                              <p class="col-4 text-right">
                                {t("Type of CN")} :{" "}
                              </p>
                              <p class="col-6">
                                {this.props.mainState.stepTwoProp.createType ===
                                CREATE_TYPE_ENUMS.QTY
                                  ? "Quantity Adjustment"
                                  : "Price Adjustment"}
                              </p>
                            </div>
                          </div>
                          <div class="col-6">
                            <div class="d-flex flex-wrap">
                              <p class="col-6 text-right">
                                {t("CN Amount")} :{" "}
                              </p>
                              <p class="col-6 d-flex flex-wrap">
                                <div className="col-8 text-right">
                                  {cnAmount >= 0 ? (
                                    <input
                                      className="form-control"
                                      data-tip="custom show"
                                      data-event="focus"
                                      data-event-off="blur"
                                      data-for="priceSelect"
                                      key="cnAmount"
                                      id="cnAmount"
                                      ref="cnAmount"
                                      type="text"
                                      name="cnAmount"
                                      pattern="[0-9]*"
                                      defaultValue={formatNumber(cnAmount, 2)}
                                      placeholder={formatNumber(cnAmount, 2)}
                                      onKeyPress={e => this.numberOnly(e, 14)}
                                      onFocus={this.handleCNAmountFocus}
                                      onChange={e => {
                                        this.handleCNAmountValidation(e);
                                      }}
                                      onBlur={e => {
                                        this.handleAmountChange(e);
                                      }}
                                    />
                                  ) : (
                                    formatNumber(0, 2)
                                  )}
                                </div>
                                <div className="col-4 text-left">THB</div>
                              </p>
                            </div>
                            <div class="d-flex flex-wrap">
                              <p class="col-6 text-right">
                                {t("TAX Total")} :{" "}
                              </p>
                              <p class="col-6 d-flex flex-wrap">
                                <div className="col-8 text-right">
                                  {taxTotal >= 0 ? (
                                    <input
                                      className="form-control"
                                      data-tip="custom show"
                                      data-event="focus"
                                      data-event-off="blur"
                                      data-for="priceSelect"
                                      key="taxTotal"
                                      id="taxTotal"
                                      ref="taxTotal"
                                      type="text"
                                      name="taxTotal"
                                      pattern="[0-9]*"
                                      defaultValue={formatNumber(taxTotal, 2)}
                                      placeholder={formatNumber(taxTotal, 2)}
                                      onKeyPress={e => this.numberOnly(e, 14)}
                                      onFocus={this.handleTaxTotalFocus}
                                      onChange={e => {
                                        this.handleTaxTotalValidation(e);
                                      }}
                                      onBlur={e => {
                                        this.handleTaxTotalChange(e);
                                      }}
                                    />
                                  ) : (
                                    formatNumber(0, 2)
                                  )}
                                </div>
                                <div className="col-4 text-left">THB</div>
                              </p>
                            </div>
                            <div class="d-flex flex-wrap">
                              <p class="col-6 text-right">
                                {t("Credit Note Amount (inc TAX)")} :{" "}
                              </p>
                              <p class="col-6 d-flex flex-wrap">
                                <div
                                  className="col-8 text-right"
                                  id="cnAmountIncTax"
                                >
                                  {this.formatPriceNumber(totalAmount)}
                                </div>{" "}
                                <div className="col-4 text-left">THB</div>
                              </p>
                            </div>
                            <div class="d-flex flex-wrap">
                              <p class="col-6 text-right">{t("Reason")} : </p>
                              <p class="col-6">
                                {
                                  this.props.mainState.stepThreeProp
                                    .creditNoteReason
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end box2 */}
                  <div class="row box">
                    <a
                      href="#AttachInfo"
                      data-toggle="collapse"
                      role="button"
                      aria-expanded="true"
                      area-controls="AttachInfo"
                      class="d-flex w-100 btnToggle"
                    >
                      <div class="col-12">
                        <h3 class="border-bottom gray-1">{t("Attachments")}</h3>
                        <i class="fa fa-chevron-up gray-1" aria-hidden="true" />
                        <i
                          class="fa fa-chevron-down gray-1"
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                    <div
                      id="AttachInfo"
                      class="collapse multi-collapse w-100 show"
                    >
                      <div class="card card-body noborder">
                        <div class="row">
                          <div class="col-6">
                            <div class="d-flex flex-wrap">
                              <p class="col-4 text-right">
                                {t("Attached Credit")} :{" "}
                              </p>
                              <ul class="col-6 list-style-none">
                                {this.props.mainState.stepThreeProp
                                  .creditNoteFiles.length > 0
                                  ? this.props.mainState.stepThreeProp.creditNoteFiles.map(
                                      file => (
                                        <li>{this.sliceFileName(file.name)}</li>
                                      )
                                    )
                                  : "-"}
                              </ul>
                            </div>
                          </div>
                          <div class="col-6">
                            <div class="d-flex flex-wrap">
                              <p class="col-6 text-right">
                                {t("Other Documents")} :{" "}
                              </p>
                              <ul class="col-6 list-style-none">
                                {this.props.mainState.stepThreeProp.otherFiles
                                  .length > 0
                                  ? this.props.mainState.stepThreeProp.otherFiles.map(
                                      file => (
                                        <li>{this.sliceFileName(file.name)}</li>
                                      )
                                    )
                                  : "-"}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end box3 */}
                </div>
              </section>

              <section id="invoice_detail_page_2" class="box box--width-header">
                <div class="box__header">
                  <div class="row justify-content-between align-items-center">
                    <div class="col">
                      <h4 class="mb-0">{t("Items Information")}</h4>
                    </div>
                  </div>
                </div>
                {this.state.taxRateList &&
                  this.state.taxRateList.map(vatRate => {
                    return (
                      <div className="box__inner">
                        <Collapse
                          id={`tax${vatRate}`}
                          expanded="true"
                          collapseHeader={[`${t("TAX")} ${vatRate}%`]}
                        >
                          <div className="table_wrapper">
                            <table className="table table-3 dataTable">
                              <thead>
                                {this.props.mainState.stepTwoProp.createType ===
                                CREATE_TYPE_ENUMS.QTY ? (
                                  <tr>
                                    <th>
                                      {t("CN Item No1")}
                                      <br />
                                      {t("CN Item No2")}
                                    </th>
                                    <th>
                                      {t("Invoice Item No1")}
                                      <br />
                                      {t("Invoice Item No2")}
                                    </th>
                                    <th>{t("Material Description")}</th>
                                    <th>{t("PO No")}</th>
                                    <th>{t("Invoice QTY")}</th>
                                    <th>
                                      {t("Invoice Amount1")}
                                      <br />
                                      {t("Invoice Amount2")}
                                    </th>
                                    <th>
                                      {t("CN QTY1")}
                                      <br />
                                      {t("CN QTY2")}
                                    </th>
                                    <th>{t("Unit")}</th>
                                    <th>
                                      {t("Unit Price1")}
                                      <br />
                                      {t("Unit Price2")}
                                    </th>
                                    <th>
                                      {t("CN Amount1")}
                                      <br />
                                      {t("CN Amount2")}
                                    </th>
                                    <th>{t("Currency")}</th>
                                  </tr>
                                ) : (
                                  <tr>
                                    <th>
                                      {t("CN Item No1")}
                                      <br />
                                      {t("CN Item No2")}
                                    </th>
                                    <th>
                                      {t("Invoice Item No1")}
                                      <br />
                                      {t("Invoice Item No2")}
                                    </th>
                                    <th>{t("Material Description")}</th>
                                    <th>{t("PO No")}</th>
                                    <th>{t("Invoice QTY")}</th>
                                    <th>
                                      {t("Invoice Amount1")}
                                      <br />
                                      {t("Invoice Amount2")}
                                    </th>
                                    <th>{t("Unit")}</th>
                                    <th>
                                      {t("Unit Price1")}
                                      <br />
                                      {t("Unit Price2")}
                                    </th>
                                    <th>
                                      {t("CN Amount1")}
                                      <br />
                                      {t("CN Amount2")}
                                    </th>
                                    <th>{t("Currency")}</th>
                                  </tr>
                                )}
                              </thead>
                              <tbody>
                                {this.generateRowTableForTax(
                                  this.state.taxRateListItem[`tax${vatRate}`]
                                )}
                              </tbody>
                            </table>
                          </div>
                        </Collapse>
                      </div>
                    );
                  })}
              </section>

              <div class="row">
                <div class="col-12 text-center">
                  <button
                    type="button"
                    name="btnCancel"
                    id="btnCancel"
                    class="btn btn--transparent btn-wide"
                    data-toggle="modal"
                    data-target="#cancelWarning"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="button"
                    name="btnBack"
                    id="btnBack"
                    onClick={() => this.handleBack()}
                    class="btn btn--transparent btn-wide"
                  >
                    <i class="fa fa-chevron-left" /> {t("Back")}
                  </button>
                  <button
                    type="button"
                    name="btnNext"
                    id="btnNext"
                    class="btn btn-wide"
                    onClick={() => this.submitCreateCreditNote()}
                  >
                    {t("Submit")}
                  </button>
                </div>
              </div>
              <div class="row">&nbsp;</div>
            </form>

            <div
              id="cancelWarning"
              class="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labelledby="cancel"
              aria-hidden="true"
            >
              <div class="modal-dialog modal-sm" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="myModalLabel" style={{ margin: "auto" }}>
                      Cancel
                    </h3>
                  </div>
                  <div class="modal-body text-center">
                    <div className="text">Do you want to cancel this CN?</div>
                  </div>
                  <div class="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      class="btn btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      class="btn btn--transparent btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                      onClick={() => this.routeCancel()}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div id="smallScreenCover">
              <p class="text-center">
                <img src="img/icon_expanded.png" alt="" />
              </p>
            </div>
          </div>
          {/* <p><a href="javascript:void(0);" data-toggle="modal" data-target="#alertBox">Click ME!</a></p> */}

          <div
            id="alertBox"
            class="modal hide fade"
            tabindex="-1"
            role="dialog"
            aria-labelledby="alertBox"
            aria-hidden="true"
          >
            <div class="modal-dialog modal-lg" role="document">
              <div class="modal-content">
                <div class="modal-header justify-content-center">
                  <h3 id="myModalLabel">Error</h3>
                </div>
                <div class="modal-body d-flex justify-content-center">
                  <p>
                    Unable to create credit note because{" "}
                    {this.state.createErrMessage}
                  </p>
                </div>
                <div class="modal-footer justify-content-center">
                  <button
                    type="button"
                    name="btnCloseModal"
                    id="btnCloseModal"
                    class="btn btn-wide"
                    data-dismiss="modal"
                    aria-hidden="true"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ModalAlert
          title={this.state.alertModalAlertTitle}
          visible={this.state.isAlertModalVisible}
          button={this.state.buttonAlert}
          isTextOnly={this.state.isTextOnly}
        >
          {this.state.alertModalMsg}
        </ModalAlert>
      </BlockUi>
    );
  }
}
export default withTranslation(["credit-create", "detail"])(
  createCreditNoteStepFour
);
