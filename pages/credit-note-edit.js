import React, { Component } from "react";
import Router from "next/router";
import Head from "next/head";
import _ from "lodash";
import moment from "moment";
import { findDOMNode } from "react-dom";
import UserPanel from "../components/userPanel";
import ReactDOM from "react-dom";
import Layout from "../components/Layout";
import BranchSelect from "../components/BranchSelect";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import "../libs/mycools";
import { DirectoryService } from "aws-sdk";
import Autosuggest from "react-autosuggest";
import BlockUi from "react-block-ui";
import handleError from "./handleError";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_OK
} from "../components/modalAlert";
import {
  formatNumber,
  numberOnly,
  GrThead
} from "../components/invoices/edit/models/item";
import { asyncContainer, Typeahead } from "../libs/react-bootstrap-typeahead";
import autoDelay from "../configs/delay.typeahead.json";
import GA from "~/libs/ga";
import { withTranslation } from "~/i18n";

const AsyncTypeahead = asyncContainer(Typeahead);
const invoiceStatusQueryString =
  "&statuses=ISSUED&statuses=PARTIAL&statuses=MISSING" +
  "&statuses=MATCHED&statuses=UNMATCHED&statuses=BASELINED" +
  "&statuses=PENDING_AUTHORITY&statuses=PENDING_BUYER&statuses=PARTIALLY_APPROVED" +
  "&statuses=APPROVED&statuses=RESERVED&statuses=FINANCED&statuses=PAID&statuses=DECLINED&statuses=DECLINED_WITH_FINANCED&statuses=PAID_WITHOUT_FINANCED";
const invoiceSearchApiUrl =
  "/api/invoices?bypass=true&returnInvoiceItems=true" +
  invoiceStatusQueryString +
  "&invoiceNumber=";
const lang = "cedit-edit";

const Api = new ApiService();

const QTY_COLUMN_PATTERN = [
  { data: "selected" },
  { data: "invoiceItemNo" },
  { data: "materialDescription" },
  { data: "poNo" },
  { data: "poItemNo" },
  { data: "invoiceQty" },
  { data: "cnQty" },
  { data: "unit" },
  { data: "unitPrice" },
  { data: "currency" },
  { data: "cnAmount" }
];

const PRICE_COLUMN_PATTERN = [
  { data: "selected" },
  { data: "invoiceItemNo" },
  { data: "materialDescription" },
  { data: "poNo" },
  { data: "poItemNo" },
  { data: "unit" },
  { data: "qty" },
  { data: "unitPrice" },
  { data: "amount" },
  { data: "adjustedAmount" },
  { data: "currency" }
];

const CREATE_TYPE_ENUMS = {
  QTY: "QTY",
  PRICE: "PRICE"
};

const getSuggestionValue = suggestion => suggestion.externalId;

const renderSuggestion = suggestion => suggestion.externalId;

class creditNoteEdit extends Component {
  constructor(props) {
    super(props);
    this.BTN_OK = [
      {
        label: "OK",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: () => {
            this.setState({
              ModalAlert: {
                ...this.state.ModalAlert,
                visible: false
              }
            });
          }
        }
      }
    ];
    this.apis = new api().group("creditNoteEdit");
    this.state = {
      blocking: false,
      configuration: {},
      //Invoice Data
      invoiceList: [],
      invoiceListSuggestion: [],
      invoiceInput: "",
      invoiceItemDataTable: undefined,
      //CN
      CNDetailData: {},
      CNInnerItem: {},
      adjustmentType: "",
      initialCNNumber: "",
      CNItems: [],
      CNInvoiceItem: [],
      allItems: [],
      vatRate: "",
      sumCNAmount: 0,
      subTotal: {},
      vatTotal: {},
      total: 0,
      //Editable Fields
      CNNumber: "",
      rowSelected: [],
      CNDate: "",
      //Validation
      isCreditNoteDup: false,
      editErrMessage: "",
      //Upload
      fileAttachments: [],
      creditNoteFiles: [],
      creditNoteFilesNew: [],
      otherFiles: [],
      otherFilesNew: [],
      creditNoteRequiredString: "",
      otherRequiredString: "",
      isCreditNoteRequired: false,
      isOtherRequired: false,
      creditNoteFilesFormat: "",
      otherFilesFormat: "",
      isEdit: false,
      isAllowResubmit: true,
      isQtyExceeded: false,
      isPriceExceeded: false,
      isCNAmountExceeded: false,
      vendorBranchList: [],
      isNotGetVendorBranchList: false,
      isChangeSubTotalTaxTotal: false,
      delayTime: autoDelay["delay_time"],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: true,
      buttonAlert: []
    };
    this.layout = React.createRef();
  }

  async componentDidMount() {
    this.toggleBlocking();
    await this.getCreditNoteDetail(this.props.url.query.creditNoteID);
    this.isToEdit();
    // await this.setDefaultVendorBranchList();
    // await this.getVendorBranchList();
    await this.setVendorBranchList();
    await this.resolveCNType(this.state.CNDetailData);
    await this.getConfiguration(this.state.CNDetailData);
    await this.populateAttachmentsToState(
      this.state.CNDetailData.fileAttachments
    );
    await this.getInvoiceItem(this.state.CNDetailData.invoiceLinearId, false);
  }

  setVendorBranchList = async () => {
    try {
      const { CNDetailData } = this.state;
      const { seller, vendorTaxNumber } = CNDetailData;
      let vendorBranchList = [];
      let payload = {
        legalName: seller.legalName,
        taxId: vendorTaxNumber
      };

      let CNBranch = {
        address: CNDetailData.vendorAddress || "-",
        branchCode: CNDetailData.vendorBranchCode || "-",
        name: CNDetailData.vendorBranchName || "-",
        taxId: CNDetailData.vendorTaxNumber || "-",
        id: 0,
        flag: "CN"
      };
      vendorBranchList.push(CNBranch);

      let poBranch = {
        address: `${CNDetailData.creditNoteItems[0].purchaseItem
          .vendorStreet1 || ""} ${CNDetailData.creditNoteItems[0].purchaseItem
          .vendorStreet2 || ""}`,
        branchCode:
          CNDetailData.creditNoteItems[0].purchaseItem.vendorBranchCode || "-",
        name:
          CNDetailData.creditNoteItems[0].purchaseItem.vendorBranchName || "-",
        taxId:
          CNDetailData.creditNoteItems[0].purchaseItem.vendorTaxNumber || "-",
        id: 1,
        flag: "PO"
      };
      vendorBranchList.push(poBranch);

      let masterBranch = await this.getMasterVendorBranchList(
        seller,
        vendorTaxNumber,
        payload
      );

      let newMasterBranch = [];
      await masterBranch.map(item => {
        newMasterBranch.push({
          address: `${item.street || ""} ${item.district || ""} ${item.city ||
            ""} ${item.postalCode || ""}`,
          branchCode: item.branchCode || "",
          name: item.name || "",
          taxId: item.taxId || "",
          id: item.id
        });
      });

      vendorBranchList = vendorBranchList.concat(newMasterBranch);

      this.setState({
        vendorBranchList
      });
    } catch (err) {
      console.log(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response,
        isNotGetVendorBranchList: true
      });
    }
  };

  getMasterVendorBranchList = async (seller, vendorTaxNumber, payload) => {
    return await this.apis.call("getVendorBranchList", payload);
  };

  // getVendorBranchList = async () => {
  //   const { seller, vendorTaxNumber } = this.state.CNDetailData;
  //   let obj = {
  //     legalName: seller.legalName,
  //     taxId: vendorTaxNumber
  //   };
  //   try {
  //     const res = await this.apis.call("getVendorBranchList", obj);
  //     await this.setVendorBranchList(res);
  //   } catch (err) {
  //     this.setState({
  //       isNotGetVendorBranchList: true
  //     });
  //   }
  // };
  // setVendorBranchList = async res => {
  //   let vendorBranchList = this.state.vendorBranchList;
  //   let mapped = res.map(item => {
  //     let obj = {
  //       address: `${item.street || ""} ${item.district || ""} ${item.city ||
  //         ""} ${item.postalCode || ""}`,
  //       // vendorName: item.vendorName,
  //       branchCode: item.branchCode,
  //       name: item.name,
  //       companyCode: item.companyCode,
  //       taxId: item.taxId,
  //       id: item.id
  //     };
  //     return obj;
  //   });

  //   vendorBranchList = vendorBranchList.concat(mapped);
  //   await this.setState({
  //     vendorBranchList
  //   });
  // };

  // setDefaultVendorBranchList = async () => {
  //   const { CNDetailData } = this.state;
  //   let data = {
  //     address: CNDetailData.vendorAddress,
  //     vendorName: CNDetailData.vendorName,
  //     branchCode: CNDetailData.vendorBranchCode,
  //     name: CNDetailData.vendorBranchName,
  //     companyCode: CNDetailData.companyCode,
  //     taxId: CNDetailData.vendorTaxNumber,
  //     def: true,
  //     id: 0
  //   };
  //   await this.setState({
  //     vendorBranchList: [...this.state.vendorBranchList, data]
  //   });
  // };

  onChangeVendorBranch = async e => {
    const value = e.target.value;
    const { vendorBranchList } = this.state;
    const vedorBranch = await vendorBranchList.find(item => {
      return item.id == value;
    });
    this.setState({
      CNDetailData: {
        ...this.state.CNDetailData,
        vendorAddress: vedorBranch.address,
        vendorBranchCode: vedorBranch.branchCode,
        vendorBranchName: vedorBranch.name,
        // companyCode: vedorBranch.companyCode,
        vendorTaxNumber: vedorBranch.taxId
      }
    });
    $("#vendorAddress").css("color", "#d40e78");
  };

  isToEdit() {
    if (this.state.CNDetailData.lifecycle.toUpperCase() === "ISSUED") {
      this.setState({
        isEdit: true
      });
    } else {
      this.setState({
        isEdit: false
      });
    }
  }

  resolveAllowToResubmitEdit() {
    if (this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY) {
      if (
        !this.state.isQtyExceeded &&
        !this.state.isCNAmountExceeded &&
        this.state.rowSelected.length > 0 &&
        this.resolveFilesRequiredUploaded()
      ) {
        this.setState({
          isAllowResubmit: true
        });
      } else {
        this.setState({
          isAllowResubmit: false
        });
      }
    } else {
      if (
        !this.state.isPriceExceeded &&
        this.state.rowSelected.length > 0 &&
        this.resolveFilesRequiredUploaded()
      ) {
        this.setState({
          isAllowResubmit: true
        });
      } else {
        this.setState({
          isAllowResubmit: false
        });
      }
    }
  }

  resolveFilesRequiredUploaded() {
    let creditNoteUploaded = true;
    let otherUploaded = true;
    if (this.state.isCreditNoteRequired) {
      if (
        this.state.creditNoteFiles.length === 0 &&
        this.state.creditNoteFilesNew.length === 0
      ) {
        creditNoteUploaded = false;
      }
    }

    if (this.state.isOtherRequired) {
      if (
        this.state.otherFiles.length === 0 &&
        this.state.otherFilesNew.length === 0
      ) {
        otherUploaded = false;
      }
    }

    return creditNoteUploaded && otherUploaded;
  }

  resolveCNType(cn) {
    let qtyMapValue = cn.adjustmentMap.QUANTITY;
    let priceMapValue = cn.adjustmentMap.PRICE;
    let adjustmentTypeValue = cn.adjustmentType;

    if (adjustmentTypeValue === qtyMapValue) {
      this.setState({
        adjustmentType: CREATE_TYPE_ENUMS.QTY
      });
    } else if (adjustmentTypeValue === priceMapValue) {
      this.setState({
        adjustmentType: CREATE_TYPE_ENUMS.PRICE
      });
    }
  }

  initCalendar() {
    var d = new Date();
    var todayDate =
      "" + d.getDate() + "/" + (d.getMonth() + 1) + "/" + (d.getFullYear() + 3);
    window
      .jQuery(".datepicker")
      .daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        minDate: moment(
          this.state.configuration.minimumDocumentEffectiveDate
        ).format("DD/MM/YYYY"),
        maxDate: moment(
          this.state.configuration.maximumDocumentEffectiveDate
        ).format("DD/MM/YYYY"),
        locale: {
          format: "DD/MM/YYYY"
        },
        startDate: moment(this.state.CNDate).format("DD/MM/YYYY")
      })
      .on("change", event => {
        this.handleInputChange(event);
      });
  }

  initRowSelected() {
    let rowSelected = this.state.rowSelected;
    let CNInvoiceItems = this.state.CNInvoiceItem;
    let CNItems = this.state.CNItems;

    CNItems.forEach(cnItem => {
      let selectedIndex = CNInvoiceItems.findIndex(invoiceItem => {
        return invoiceItem.linearId === cnItem.invoiceItemLinearId;
      });
      if (selectedIndex !== -1) {
        rowSelected.push(selectedIndex + 1);
      }
    });
  }

  handleKeyInToCheckDuplicateCreditNote(keyInCN) {
    let json = {
      externalId: keyInCN,
      vendorTaxNumber: this.state.CNDetailData.vendorTaxNumber
    };
    Api.postValidateCreditNote(json).then(res => {
      if (res.data || keyInCN === this.state.initialCNNumber) {
        this.setState({
          isCreditNoteDup: false
        });
      } else {
        this.setState({
          isCreditNoteDup: true
        });
      }
    });
  }

  async handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });

    if (event.target.name === "CNNumber") {
      this.handleKeyInToCheckDuplicateCreditNote(event.target.value);
    }

    await this.resolveAllowToResubmitEdit();
  }

  handleDeselectedFile(type, fileIndex) {
    let files = this.state[type];
    files.splice(fileIndex, 1);

    this.setState(
      {
        type: files
      },
      () => {
        this.resolveAllowToResubmitEdit();
      }
    );
  }

  handleSelectedFile = event => {
    let filetype = event.target.name;
    let files = event.target.files;
    let data = new FormData();
    data.append("file", files[0]);
    if (this.isValidToUpload(files[0], filetype)) {
      files[0].data = data;
      if (filetype === "attach_cn_file") {
        let creditNoteFiles = this.state.creditNoteFilesNew;
        creditNoteFiles.push(files[0]);
        this.setState({
          creditNoteFilesNew: creditNoteFiles
        });
      } else if (filetype === "attach_other_file") {
        let otherFiles = this.state.otherFilesNew;
        otherFiles.push(files[0]);
        this.setState({
          otherFilesNew: otherFiles
        });
      }
      this.resolveAllowToResubmitEdit();
    }
    event.target.value = null;
  };

  isValidToUpload(file, fileType) {
    let isNotExceeded = false;
    let isValidType = false;
    let filesConfig = this.state.configuration.attachmentConfiguration;
    if (fileType === "attach_cn_file") {
      let formats = this.state.creditNoteFilesFormat.split(",");
      formats.forEach(format => format.trim().toUpperCase());
      let ext = file.name.substring(
        file.name.lastIndexOf(".") + 1,
        file.name.length
      );

      if (
        this.state.creditNoteFiles.length +
          this.state.creditNoteFilesNew.length <
        filesConfig[0].maximumNumberOfFiles
      ) {
        isNotExceeded = true;
      }

      if (formats.includes(ext.toUpperCase())) {
        isValidType = true;
      }

      if (isNotExceeded && isValidType) {
        window.jQuery("#cn-label-format").css("color", "black");
        window.jQuery("#cn-label-count").css("color", "black");
        return true;
      } else {
        window.jQuery("#cn-label-format").css("color", "red");
        window.jQuery("#cn-label-count").css("color", "red");
        return false;
      }
    } else if (fileType === "attach_other_file") {
      let formats = this.state.otherFilesFormat.split(",");
      formats.forEach(format => format.trim().toUpperCase());
      let ext = file.name.substring(
        file.name.lastIndexOf(".") + 1,
        file.name.length
      );

      if (
        this.state.otherFiles.length + this.state.otherFilesNew.length <
        filesConfig[1].maximumNumberOfFiles
      ) {
        isNotExceeded = true;
      }

      if (formats.includes(ext.toUpperCase())) {
        isValidType = true;
      }

      if (isNotExceeded && isValidType) {
        window.jQuery("#other-label-format").css("color", "black");
        window.jQuery("#other-label-count").css("color", "black");
        return true;
      } else {
        window.jQuery("#other-label-format").css("color", "red");
        window.jQuery("#other-label-count").css("color", "red");
        return false;
      }
    }
  }

  resolveFileRequired() {
    function checkRequired(minimum) {
      if (minimum > 0) {
        return true;
      } else return false;
    }
    let fileConfig = this.state.configuration.attachmentConfiguration;
    fileConfig.forEach(config => {
      if (config.attachmentType === "CreditNote") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isCreditNoteRequired: required,
          creditNoteFilesFormat: config.fileType
        });
      } else if (config.attachmentType === "Others") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isOtherRequired: required,
          otherFilesFormat: config.fileType
        });
      }
    });
  }

  async updateInvoiceItemTable(invoiceItem) {
    let data = [];
    invoiceItem.forEach((item, index) => {
      data.push(this.populateRowForInvoiceItemTable(item, index));
    });

    this.state.invoiceItemDataTable.clear();
    this.state.invoiceItemDataTable.rows.add(data);
    this.state.invoiceItemDataTable.draw();

    if (this.state.rowSelected.length > 0) {
      let rowSelected = this.state.rowSelected;
      rowSelected.forEach(row => {
        window
          .jQuery("[id^='select-" + row + "']")
          .parents("tr")
          .prop("className", "selected");

        window.jQuery("[id^='select-" + row + "']").prop("checked", "checked");
        if (this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY) {
          window.jQuery("#qty-select-" + row).prop("disabled", false);
          window.jQuery("#amount-select-" + row).prop("disabled", false);
        } else {
          window.jQuery("#price-select-" + row).prop("disabled", false);
        }
      });
    }

    await window.jQuery("[id^='select-']").change(event => {
      this.handleItemSelect(event);
    });

    await window.jQuery("#selectAll").change(event => {
      this.handleItemSelect(event);
    });

    await window.jQuery("[id^='qty-select-']").on("input", event => {
      this.handleItemQtyChange(event);
    });

    await window.jQuery("[id^='qty-select-']").on("keypress", event => {
      let input = event.target.value;
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
      console.log("digit.length - decimal.length", typablePosition);
      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 14) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 14) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 14 && event.which != "46") {
            return false;
          }
        }
      }
    });

    await $("[id^='qty-select-']").on("blur", event => {
      event.target.value = formatNumber(
        isNaN(Number(event.target.value.replace(/,/g, "")))
          ? 0
          : Number(event.target.value.replace(/,/g, "")),
        3
      );
    });

    await window.jQuery("[id^='price-select-']").on("input", event => {
      this.handleItemUnitPriceChange(event);
    });

    await window.jQuery("[id^='price-select-']").on("keypress", event => {
      let input = event.target.value;
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
      console.log("digit.length - decimal.length", typablePosition);
      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 13) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 13) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 13 && event.which != "46") {
            return false;
          }
        }
      }
    });

    await window.jQuery("[id^='price-select-']").on("blur", event => {
      event.target.value = formatNumber(
        isNaN(Number(event.target.value.replace(/,/g, "")))
          ? 0
          : Number(event.target.value.replace(/,/g, "")),
        2
      );
    });
  }

  async renderInvoiceItemTable(invoiceItem) {
    let data = [];
    invoiceItem.forEach((item, index) => {
      data.push(this.populateRowForInvoiceItemTable(item, index));
    });
    let dts = window
      .jQuery(this.el)
      .DataTable({
        //dom: '<<"row justify-content-between align-items-center mb-3"<"col d-flex align-items-center"lp><"col d-flex justify-content-end"<"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><t>>',
        language: {
          lengthMenu: "Display _MENU_ Per Page"
        },
        data: data,
        columns:
          this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY
            ? QTY_COLUMN_PATTERN
            : PRICE_COLUMN_PATTERN,
        columnDefs: [
          {
            targets: [0],
            orderable: false,
            sortable: false,
            width: "60px"
          },
          {
            targets: [1],
            width: "80px",
            orderable: true
          },
          {
            targets: [2],
            width: "300px"
          },
          {
            targets: [3],
            width: "100px"
          },
          {
            targets: [4],
            width: "80px"
          },
          {
            targets: [5],
            width: "80px"
          },
          {
            targets: [6],
            width: "80px"
          },
          {
            targets: [7, 8, 9, 10],
            width: "100px"
          }
        ],
        order: [[1, "asc"]],
        fixedHeader: true,
        stateSave: false,
        paging: false,
        bLengthChange: true,
        searching: false,
        info: false,
        ordering: true
      })
      .on("error", function(e, settings, techNote, message) {
        console.log("An error has been reported by DataTables: ", message);
      });

    if (this.state.rowSelected.length > 0) {
      let rowSelected = this.state.rowSelected;
      rowSelected.forEach(row => {
        window
          .jQuery("[id^='select-" + row + "']")
          .parents("tr")
          .prop("className", "selected");

        window.jQuery("[id^='select-" + row + "']").prop("checked", "checked");
        if (this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY) {
          window.jQuery("#qty-select-" + row).prop("disabled", false);
          window.jQuery("#amount-select-" + row).prop("disabled", false);
        } else {
          window.jQuery("#price-select-" + row).prop("disabled", false);
        }
      });
    }

    await window.jQuery("[id^='select-']").change(event => {
      this.handleItemSelect(event);
      this.calculateHeaderValue();
    });

    await window.jQuery("#selectAll").change(event => {
      this.handleItemSelect(event);
      this.calculateHeaderValue();
    });

    await window.jQuery("[id^='qty-select-']").on("focus", event => {
      this.handleItemFocus(event);
    });

    await window.jQuery("[id^='qty-select-']").on("input", event => {
      this.handleItemQtyChange(event);
    });

    await window.jQuery("[id^='qty-select-']").on("keypress", event => {
      let input = event.target.value;
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
      console.log("digit.length - decimal.length", typablePosition);
      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 13) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 13) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 13 && event.which != "46") {
            return false;
          }
        }
      }
    });

    await $("[id^='qty-select-']").on("blur", event => {
      event.target.value = formatNumber(
        isNaN(Number(event.target.value.replace(/,/g, "")))
          ? 0
          : Number(event.target.value.replace(/,/g, "")),
        3
      );
    });

    await window.jQuery("[id^='amount-select-']").on("focus", event => {
      this.handleItemFocus(event);
    });

    await window.jQuery("[id^='amount-select-']").on("input", event => {
      this.handleItemCNAmountChange(event);
    });

    await window.jQuery("[id^='amount-select-']").on("keypress", event => {
      let input = event.target.value;
      let valueReplace = input.replace(/[^0-9.]/gm, "");
      let valueSplit = valueReplace.split(".");
      let digit = valueReplace.replace(".", "");
      let integer = valueSplit[0];
      let decimal = valueSplit[1];

      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 14) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 14) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 14 && event.which != "46") {
            return false;
          }
        }
      }
    });

    await $("[id^='amount-select-']").on("blur", event => {
      event.target.value = formatNumber(
        isNaN(Number(event.target.value.replace(/,/g, "")))
          ? 0
          : Number(event.target.value.replace(/,/g, "")),
        2
      );
    });

    await window.jQuery("[id^='price-select-']").on("focus", event => {
      this.handleItemFocus(event);
    });

    await window.jQuery("[id^='price-select-']").on("input", event => {
      this.handleItemUnitPriceChange(event);
    });

    await window.jQuery("[id^='price-select-']").on("keypress", event => {
      let input = event.target.value;
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
      console.log("digit.length - decimal.length", typablePosition);
      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 14) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 14) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 14 && event.which != "46") {
            return false;
          }
        }
      }
    });

    await window.jQuery("[id^='price-select-']").on("blur", event => {
      event.target.value = formatNumber(
        isNaN(Number(event.target.value.replace(/,/g, "")))
          ? 0
          : Number(event.target.value.replace(/,/g, "")),
        2
      );
    });

    // await this.toggleBlocking();
    this.setState({
      invoiceItemDataTable: dts
    });
  }

  handleItemFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
  };

  async handleItemSelect(event) {
    let element = event.target;
    if (element.id === "selectAll") {
      if (!element.checked) {
        window.jQuery("[id^='select']").prop("checked", false);
        window
          .jQuery("[id^='select-']")
          .parents("tr")
          .prop("className", "odd");
        window.jQuery("[id^='qty-select-']").prop("disabled", true);
        window.jQuery("[id^='amount-select-']").prop("disabled", true);
        window.jQuery("[id^='price-select-']").prop("disabled", true);
      } else {
        window.jQuery("[id^='select']").prop("checked", true);
        window
          .jQuery("[id^='select-']")
          .parents("tr")
          .prop("className", "odd selected");
        window.jQuery("[id^='qty-select-']").prop("disabled", false);
        window.jQuery("[id^='amount-select-']").prop("disabled", false);
        window.jQuery("[id^='price-select-']").prop("disabled", false);
      }
    } else {
      this.shouldItemsSelectAll();
      if (element.checked) {
        event.originalEvent.path[3].className = "selected";
        window.jQuery("#qty-" + element.id).prop("disabled", false);
        window.jQuery("#amount-" + element.id).prop("disabled", false);
        window.jQuery("#price-" + element.id).prop("disabled", false);
      } else {
        event.originalEvent.path[3].className = "odd";
        window.jQuery("#qty-" + element.id).prop("disabled", true);
        window.jQuery("#amount-" + element.id).prop("disabled", true);
        window.jQuery("#price-" + element.id).prop("disabled", true);
      }
    }

    let items = this.state.CNInvoiceItem;
    let rowSelected = [];
    items.forEach((item, index) => {
      if (window.jQuery("#select-" + (index + 1))[0].checked) {
        rowSelected.push(index + 1);
      }
    });

    this.setState(
      {
        rowSelected: rowSelected
      },
      () => {
        if (this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY) {
          this.validateQtyInput();
          this.validateCNAmountInput();
        } else if (this.state.adjustmentType === CREATE_TYPE_ENUMS.PRICE) {
          this.validatePriceInput();
        }
      }
    );
  }

  shouldItemsSelectAll() {
    let isSelectAll = true;
    let items = this.state.CNInvoiceItem;
    items.forEach((item, index) => {
      if (!window.jQuery("#select-" + (index + 1))[0].checked) {
        window.jQuery("#selectAll").prop("checked", false);
        isSelectAll = false;
      }
      if (isSelectAll) {
        window.jQuery("#selectAll").prop("checked", true);
      }
    });
  }

  async handleItemQtyChange(event) {
    event.target.value = this.formatNumberInput(event.target.value, 3);
    let CNItems = this.state.CNInvoiceItem;
    let changeQty = event.target.value;
    let arr = event.target.id.split("-");
    let index = arr[2] - 1;
    let targetItem = CNItems[index];
    targetItem.creditNoteQuantity.initial = isNaN(Number(changeQty))
      ? 0
      : Number(changeQty);
    targetItem.creditNoteAdjustedSubtotal = isNaN(Number(changeQty))
      ? 0
      : Number(changeQty) * targetItem.unitPrice;
    window
      .jQuery("#amount-select-" + (index + 1))
      .val(
        this.formatPriceNumber(
          isNaN(Number(changeQty))
            ? 0
            : Number(changeQty) * targetItem.unitPrice
        )
      );

    await this.setState(
      {
        CNInvoiceItem: CNItems
      },
      () => {
        this.validateQtyInput();
        this.validateCNAmountInput();
      }
    );
  }

  async handleItemUnitPriceChange(event) {
    event.target.value = this.formatNumberInput(event.target.value, 2);
    let CNItems = this.state.CNInvoiceItem;
    let changeUnit = event.target.value;
    let arr = event.target.id.split("-");
    let index = arr[2] - 1;
    let targetItem = CNItems[index];
    targetItem.creditNoteAdjustedSubtotal = isNaN(Number(changeUnit))
      ? 0
      : Number(changeUnit);

    await this.setState(
      {
        CNInvoiceItem: CNItems
      },
      () => {
        this.validatePriceInput();
      }
    );
  }

  async handleItemCNAmountChange(event) {
    event.target.value = this.formatNumberInput(event.target.value, 2);
    let CNItems = this.state.CNInvoiceItem;
    let changeAmount = event.target.value;
    let arr = event.target.id.split("-");
    let index = arr[2] - 1;
    let targetItem = CNItems[index];
    targetItem.creditNoteAdjustedSubtotal = isNaN(Number(changeAmount))
      ? 0
      : Number(changeAmount);

    await this.setState(
      {
        CNInvoiceItem: CNItems
      },
      () => {
        this.validateCNAmountInput();
      }
    );
  }

  calculateHeaderValue = async () => {
    const { rowSelected } = this.state;
    let subTotal = 0;
    let vatTotal = 0;
    let total = 0;
    if (this.state.isChangeSubTotalTaxTotal) {
      this.setState({
        subTotal: this.state.subTotal,
        vatTotal: this.state.vatTotal,
        total: this.state.total,
        isChangeSubTotalTaxTotal: true
      });
    } else {
      await rowSelected.map(index => {
        const item = this.state.CNInvoiceItem[index - 1];
        const creditNoteAdjustedSubtotal = item.creditNoteAdjustedSubtotal;
        const cal = this.calTax(creditNoteAdjustedSubtotal, item.vatRate);
        vatTotal = vatTotal + parseFloat(cal);
        subTotal = subTotal + creditNoteAdjustedSubtotal;
      });

      total = vatTotal + subTotal;
      if (findDOMNode(this.refs["subTotal"])) {
        findDOMNode(this.refs["subTotal"]).value = formatNumber(subTotal, 2);
      }

      if (findDOMNode(this.refs["vatTotal"])) {
        findDOMNode(this.refs["vatTotal"]).value = formatNumber(vatTotal, 2);
      }

      this.setState({
        subTotal,
        vatTotal,
        total
      });
    }
  };

  calTax = (creditNoteAdjustedSubtotal, vatRate) => {
    return (
      creditNoteAdjustedSubtotal.toFixed(2) * (vatRate / 100).toFixed(2)
    ).toFixed(2);
  };

  validateCNAmountInput = () => {
    let isCNAmountExceededFound = false;
    let CNItems = this.state.CNInvoiceItem;
    CNItems.forEach((item, index) => {
      let rowFound = this.state.rowSelected.find(row => {
        return index + 1 === row;
      });
      if (rowFound !== undefined) {
        if (
          item.creditNoteAdjustedSubtotal > item.itemSubTotal ||
          item.creditNoteAdjustedSubtotal === 0
        ) {
          window.jQuery("#amount-select-" + (index + 1)).css("color", "red");
          isCNAmountExceededFound = true;
          this.calculateHeaderValue();
        } else {
          window.jQuery("#amount-select-" + (index + 1)).css("color", "");
          this.calculateHeaderValue();
        }
      }
    });

    if (isCNAmountExceededFound) {
      this.setState(
        {
          isCNAmountExceeded: true
        },
        () => this.resolveAllowToResubmitEdit()
      );
    } else {
      this.setState(
        {
          isCNAmountExceeded: false
        },
        () => this.resolveAllowToResubmitEdit()
      );
    }
  };

  validateQtyInput() {
    let isQtyExceededFound = false;
    let CNItems = this.state.CNInvoiceItem;
    CNItems.forEach((item, index) => {
      let rowFound = this.state.rowSelected.find(row => {
        return index + 1 === row;
      });
      if (rowFound !== undefined) {
        if (
          item.creditNoteQuantity.initial > item.quantity.remaining ||
          item.creditNoteQuantity.initial === 0
        ) {
          window.jQuery("#qty-select-" + (index + 1)).css("color", "red");
          isQtyExceededFound = true;
          this.calculateHeaderValue();
        } else {
          window.jQuery("#qty-select-" + (index + 1)).css("color", "");
          this.calculateHeaderValue();
        }
      }
    });

    if (isQtyExceededFound) {
      this.setState(
        {
          isQtyExceeded: true
        },
        () => this.resolveAllowToResubmitEdit()
      );
    } else {
      this.setState(
        {
          isQtyExceeded: false
        },
        () => this.resolveAllowToResubmitEdit()
      );
    }
  }

  validatePriceInput() {
    let isPriceExceededFound = false;
    let CNItems = this.state.CNInvoiceItem;
    CNItems.forEach((item, index) => {
      let rowFound = this.state.rowSelected.find(row => {
        return index + 1 === row;
      });
      if (rowFound !== undefined) {
        if (
          item.creditNoteAdjustedSubtotal > item.itemSubTotal ||
          item.creditNoteAdjustedSubtotal === 0
        ) {
          window.jQuery("#price-select-" + (index + 1)).css("color", "red");
          isPriceExceededFound = true;
          this.calculateHeaderValue();
        } else {
          window.jQuery("#price-select-" + (index + 1)).css("color", "");
          this.calculateHeaderValue();
        }
      }
    });

    if (isPriceExceededFound) {
      this.setState(
        {
          isPriceExceeded: true
        },
        () => this.resolveAllowToResubmitEdit()
      );
    } else {
      this.setState(
        {
          isPriceExceeded: false
        },
        () => this.resolveAllowToResubmitEdit()
      );
    }
  }

  populateRowForInvoiceItemTable(item, index) {
    let cnItem = this.state.CNItems.find(cnItem => {
      return cnItem.invoiceItemLinearId === item.linearId;
    });

    if (this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY) {
      return {
        selected:
          '<div className="custom-control custom-checkbox">' +
          '<input type="checkbox" className="custom-control-input" id="select-' +
          (index + 1) +
          '"></input>' +
          '<label className="custom-control-label pl-1 font-small text-shadow" for="selectall"></label>' +
          "</div>",
        invoiceItemNo: index + 1,
        materialDescription: item.materialDescription,
        poNo: item.purchaseOrderExternalId,
        poItemNo: item.purchaseItem.poItemNo,
        invoiceQty: this.formatQtyNumber(item.quantity.initial),
        cnQty:
          '<input disabled type="text"' +
          ' id="qty-select-' +
          (index + 1) +
          '" value="' +
          this.formatQtyNumber(cnItem === undefined ? 0 : cnItem.quantity) +
          '" class="form-control"></input>',
        unit: item.quantity.unit,
        unitPrice: item.unitPrice.toFixed(2),
        cnAmount:
          '<input disabled type="text" id="amount-select-' +
          (index + 1) +
          '" value="' +
          this.formatPriceNumber(
            cnItem === undefined ? 0 : cnItem.quantity * item.unitPrice
          ) +
          '" class="form-control"></input>',
        currency: item.currency
        // '<div id="cnAmount-' +
        // (index + 1) +
        // '">' +
        // this.formatPriceNumber(
        //   cnItem === undefined ? 0 : cnItem.quantity * item.unitPrice
        // ) +
        // "</div>"
      };
    } else if (this.state.adjustmentType === CREATE_TYPE_ENUMS.PRICE) {
      return {
        selected:
          '<div className="custom-control custom-checkbox">' +
          '<input type="checkbox" className="custom-control-input" id="select-' +
          (index + 1) +
          '"></input>' +
          '<label className="custom-control-label pl-1 font-small text-shadow" for="selectall"></label>' +
          "</div>",
        invoiceItemNo: index + 1,
        materialDescription: item.materialDescription,
        poNo: item.purchaseOrderExternalId,
        poItemNo: item.purchaseItem.poItemNo,
        unit: item.quantity.unit,
        qty: this.formatQtyNumber(item.quantity.initial),
        unitPrice: item.unitPrice,
        amount: this.formatPriceNumber(item.itemSubTotal),
        adjustedAmount:
          '<input disabled type="text" id="price-select-' +
          (index + 1) +
          '" value="' +
          this.formatPriceNumber(item.creditNoteAdjustedSubtotal) +
          '" class="form-control"></input>',
        currency: item.currency
      };
    }
  }

  populateNumberRequiredFileString() {
    let config = this.state.configuration;
    let config1 = config.attachmentConfiguration[0];
    if (config1.maximumNumberOfFiles === config1.minimumNumberOfFiles) {
      this.setState({
        creditNoteRequiredString: config1.minimumNumberOfFiles
      });
    } else {
      this.setState({
        creditNoteRequiredString:
          config1.minimumNumberOfFiles + " - " + config1.maximumNumberOfFiles
      });
    }
    let config2 = config.attachmentConfiguration[1];
    if (config2.maximumNumberOfFiles === config2.minimumNumberOfFiles) {
      this.setState({
        otherRequiredString: config2.minimumNumberOfFiles
      });
    } else {
      this.setState({
        otherRequiredString:
          config2.minimumNumberOfFiles + " - " + config2.maximumNumberOfFiles
      });
    }
  }

  populateAttachmentsToState(attachments) {
    let creditNoteFiles = [];
    let otherFiles = [];
    attachments.forEach(item => {
      if (item.attachmentType === "CreditNote") {
        let file = {
          name: item.attachmentName,
          hash: item.attachmentHash,
          uploadDate: item.uploadDate,
          owner: item.owner
        };
        creditNoteFiles.push(file);
      } else if (item.attachmentType === "Others") {
        let file = {
          name: item.attachmentName,
          hash: item.attachmentHash,
          uploadDate: item.uploadDate,
          owner: item.owner
        };
        otherFiles.push(file);
      }
    });
    this.setState({
      creditNoteFiles: creditNoteFiles,
      otherFiles: otherFiles
    });
  }

  getCreditNoteDetail = async linearID => {
    let res = await this.apis.call("detail", {
      linearId: this.props.url.query.creditNoteID,
      role: this.props.user.organisationUnit
    });
    res = res.rows[0];
    this.setState({
      CNDetailData: res,
      CNInnerItem: res.creditNoteItems[0].purchaseItem,
      CNItems: res.creditNoteItems,
      CNNumber: res.externalId,
      CNReason: res.reason,
      initialCNNumber: res.externalId,
      CNDate: res.creditNoteDate,
      sumCNAmount: res.subTotal,
      subTotal: res.subTotal,
      vatTotal: res.vatTotal,
      total: res.total
    });
  };

  getInvoiceItem(id, isChange) {
    Api.getInvoiceDetail(id)
      .then(res => {
        if (isChange) {
          this.setNewInvoiceDetail(res.rows[0]);
        }
        let CNInvoiceItem = res.rows[0].items;
        CNInvoiceItem.forEach(invoiceItem => {
          let cnItem = this.state.CNItems.find(item => {
            return item.invoiceItemLinearId === invoiceItem.linearId;
          });
          invoiceItem.creditNoteQuantity.initial =
            cnItem === undefined ? 0 : cnItem.quantity;
          invoiceItem.creditNoteAdjustedSubtotal =
            cnItem === undefined ? 0 : cnItem.subTotal;
        });
        this.setState({
          CNInvoiceItem: CNInvoiceItem
        });
      })
      .then(() => {
        this.initRowSelected();
      })
      .then(() => {
        if (this.state.invoiceItemDataTable === undefined) {
          this.renderInvoiceItemTable(this.state.CNInvoiceItem);
        } else {
          this.updateInvoiceItemTable(this.state.CNInvoiceItem);
        }
        this.resolveAllowToResubmitEdit();
      });
  }

  setNewInvoiceDetail(newInvoiceData) {
    let CNDetailData = this.state.CNDetailData;
    CNDetailData.invoiceExternalId = newInvoiceData.externalId;
    CNDetailData.invoiceLinearId = newInvoiceData.linearId;
    CNDetailData.companyAddress = newInvoiceData.companyAddress;
    CNDetailData.companyBranchCode = newInvoiceData.companyBranchCode;
    CNDetailData.companyBranchName = newInvoiceData.companyBranchName;
    CNDetailData.companyCode = newInvoiceData.companyCode;
    CNDetailData.companyName = newInvoiceData.companyName;
    CNDetailData.companyTaxNumber = newInvoiceData.companyTaxNumber;
    CNDetailData.businessPlace = newInvoiceData.businessPlace;
    CNDetailData.vendorAddress = newInvoiceData.vendorAddress;
    CNDetailData.vendorBranchCode = newInvoiceData.vendorBranchCode;
    CNDetailData.vendorName = newInvoiceData.vendorName;
    CNDetailData.vendorNumber = newInvoiceData.vendorNumber;
    CNDetailData.vendorTaxNumber = newInvoiceData.vendorTaxNumber;

    this.setState({
      CNDetailData: CNDetailData
    });
  }

  async getConfiguration(cn) {
    Api.getPOByPONumber(cn.purchaseOrderHeaderNumber)
      .then(res => {
        return res.data.find(po => {
          return po.purchaseOrderNumber === cn.purchaseOrderHeaderNumber;
        });
      })
      .then(po => {
        Api.getCreditNoteConfiguration(
          po.buyer.legalName,
          po.businessPlaceTaxNumber
        )
          .then(config => {
            if (
              Object.keys(config).length === 0 ||
              !"attachmentConfiguration" in config
            ) {
              //Error Case - success but empty data in response
              const message = [
                "The necessary configuration is not found.",
                <br />,
                "CONFIG_OPTION:  CREDITNOTE_ATTACHMENT"
              ];
              const response = handleError(
                message,
                this.handleDismissBtnModal,
                "BTN_BACK"
              );
              this.setState({
                ...response
              });
            } else {
              this.setState({
                configuration: config
              });
            }
          })
          .then(() => {
            this.initCalendar();
            this.resolveFileRequired();
            this.populateNumberRequiredFileString();
          })
          .then(() => {
            this.toggleBlocking();
          })
          .catch(err => {
            console.log("ERROR");
            //Error Case - failed to get data from api
            const message = [
              "The necessary configuration is not found.",
              <br />,
              "CONFIG_OPTION:  CREDITNOTE_ATTACHMENT"
            ];
            const response = handleError(
              message,
              this.handleDismissBtnModal,
              "BTN_BACK"
            );
            this.setState({
              ...response
            });
          });
      });
  }

  triggerNewInvoice() {
    window.jQuery("#newInvoiceRef").modal("toggle");
  }

  ///// -- Auto Complete -- /////
  onSuggestionsFetchRequested = ({ value }) => {
    let suggestionArray = [];
    let inputValue = value.trim().toLowerCase();
    let inputLength = inputValue.length;

    suggestionArray =
      inputLength < 3
        ? []
        : this.state.invoiceList.filter(
            invoice =>
              invoice.externalId.toLowerCase().slice(0, inputLength) ===
              inputValue
          );

    this.setState({
      invoiceListSuggestion: suggestionArray
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      invoiceListSuggestion: []
    });
  };

  handleInvoiceAutoCompleteChange(selectedInvoice) {
    if (selectedInvoice !== undefined) {
      this.setState({
        invoiceInput: selectedInvoice.linearId
      });
    }
  }

  async handleConfirmChangeInvoice() {
    this.setState(
      {
        rowSelected: []
      },
      () => this.getInvoiceItem(this.state.invoiceInput, true)
    );
  }

  /// Edit - Resubmit ///

  async handleEditCreditNote() {
    await this.extractAllInvoiceItems(
      this.state.CNInvoiceItem,
      this.state.rowSelected
    );
    await this.sumAllCNAmount(this.state.allItems);
    await this.editCreateCreditNote();
  }

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

  async editCreateCreditNote() {
    this.toggleBlocking();

    let uploadPromises = await this.populateFileAttachmentForEdit();
    Promise.all(uploadPromises).then(data => {
      let existingFile = this.populateExistingFileAttachment();
      let fileAttachments = data.concat(existingFile);

      let cnObject = {};
      if (this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY) {
        cnObject = {
          linearId: this.state.CNDetailData.linearId,
          buyer: this.state.CNDetailData.buyer,
          seller: this.state.CNDetailData.seller,
          accounting: this.state.CNDetailData.accounting,
          externalId: this.state.CNNumber.trim(),
          invoiceExternalId: this.state.CNDetailData.invoiceExternalId,
          invoiceLinearId: this.state.CNDetailData.invoiceLinearId,
          vendorTaxNumber: this.state.CNDetailData.vendorTaxNumber,
          vendorAddress: this.state.CNDetailData.vendorAddress,
          vendorNumber: this.state.CNDetailData.vendorNumber,
          vendorBranchCode: this.state.CNDetailData.vendorBranchCode,
          vendorName: this.state.CNDetailData.vendorName,
          companyTaxNumber: this.state.CNDetailData.companyTaxNumber,
          companyAddress: this.state.CNDetailData.companyAddress,
          companyBranchCode: this.state.CNDetailData.companyBranchCode,
          companyCode: this.state.CNDetailData.companyCode,
          companyBranchName: this.state.CNDetailData.companyBranchName,
          companyName: this.state.CNDetailData.companyName,
          creditNoteDate: this.state.CNDate,
          subTotal: this.state.subTotal,
          vatTotal: this.state.vatTotal,
          total: this.state.total,
          totalReceivable: this.state.total,
          currency: this.state.CNDetailData.currency,
          reason: this.state.CNReason,
          businessPlace: this.state.CNDetailData.companyCode,
          documentEntryDate: this.state.CNDetailData.documentEntryDate,
          issuedDate: this.state.CNDetailData.issuedDate,
          fileAttachments: fileAttachments,
          lifecycle: this.state.CNDetailData.lifecycle,
          status: this.state.CNDetailData.status,
          customisedFields: this.state.CNDetailData.customisedFields,
          customisedFieldsUpdatedDate: this.state.CNDetailData
            .customisedFieldsUpdatedDate,
          adjustmentType: this.state.CNDetailData.adjustmentType,
          purchaseOrder: this.state.CNDetailData.purchaseOrder,
          purchaseOrderHeaderNumber: this.state.CNDetailData
            .purchaseOrderHeaderNumber,
          creditNoteItems: this.populatedCreditNoteItem(),
          goodsReceived: this.state.CNDetailData.goodsReceived,
          resubmitCount: this.state.CNDetailData.resubmitCount,
          adjustmentMap: this.state.CNDetailData.adjustmentMap,
          disclosedMap: this.state.CNDetailData.disclosedMap,
          restrictedMap: this.state.CNDetailData.restrictedMap,
          attachCreditNote: this.populateFileAttachment(),
          itemSubTotal: this.state.CNDetailData.subTotal,
          creditNoteAdjustedSubtotal: this.state.sumCNAmount,
          isETaxCreditNote: this.state.CNDetailData.isETaxCreditNote
        };
      } else if (this.state.adjustmentType === CREATE_TYPE_ENUMS.PRICE) {
        cnObject = {
          linearId: this.state.CNDetailData.linearId,
          buyer: this.state.CNDetailData.buyer,
          seller: this.state.CNDetailData.seller,
          accounting: this.state.CNDetailData.accounting,
          externalId: this.state.CNNumber.trim(),
          invoiceExternalId: this.state.CNDetailData.invoiceExternalId,
          invoiceLinearId: this.state.CNDetailData.invoiceLinearId,
          vendorTaxNumber: this.state.CNDetailData.vendorTaxNumber,
          vendorAddress: this.state.CNDetailData.vendorAddress,
          vendorNumber: this.state.CNDetailData.vendorNumber,
          vendorBranchCode: this.state.CNDetailData.vendorBranchCode,
          vendorName: this.state.CNDetailData.vendorName,
          companyTaxNumber: this.state.CNDetailData.companyTaxNumber,
          companyAddress: this.state.CNDetailData.companyAddress,
          companyBranchCode: this.state.CNDetailData.companyBranchCode,
          companyCode: this.state.CNDetailData.companyCode,
          companyBranchName: this.state.CNDetailData.companyBranchName,
          companyName: this.state.CNDetailData.companyName,
          creditNoteDate: this.state.CNDate,
          subTotal: this.state.subTotal,
          vatTotal: this.state.vatTotal,
          total: this.state.total,
          totalReceivable: this.state.total,
          currency: this.state.CNDetailData.currency,
          reason: this.state.CNReason,
          businessPlace: this.state.CNDetailData.companyCode,
          documentEntryDate: this.state.CNDetailData.documentEntryDate,
          issuedDate: this.state.CNDetailData.issuedDate,
          fileAttachments: fileAttachments,
          lifecycle: this.state.CNDetailData.lifecycle,
          status: this.state.CNDetailData.status,
          customisedFields: this.state.CNDetailData.customisedFields,
          customisedFieldsUpdatedDate: this.state.CNDetailData
            .customisedFieldsUpdatedDate,
          adjustmentType: this.state.CNDetailData.adjustmentType,
          purchaseOrder: this.state.CNDetailData.purchaseOrder,
          purchaseOrderHeaderNumber: this.state.CNDetailData
            .purchaseOrderHeaderNumber,
          creditNoteItems: this.populatedCreditNoteItem(),
          goodsReceived: this.state.CNDetailData.goodsReceived,
          resubmitCount: this.state.CNDetailData.resubmitCount,
          adjustmentMap: this.state.CNDetailData.adjustmentMap,
          disclosedMap: this.state.CNDetailData.disclosedMap,
          restrictedMap: this.state.CNDetailData.restrictedMap,
          attachCreditNote: this.populateFileAttachment(),
          itemSubTotal: this.state.CNDetailData.subTotal,
          creditNoteAdjustedSubtotal: this.state.sumCNAmount,
          isETaxCreditNote: this.state.CNDetailData.isETaxCreditNote
        };
      } else {
        console.log("UNSUPPORTED TYPE");
      }
      if (!_.isEmpty(cnObject)) {
        if (this.state.isEdit) {
          GA.event({
            category: "Credit Note",
            action: "Edit CN (Request)",
            label: `Credit Note | ${cnObject.externalId} | ${moment().format()}`
            // value: cnObject.total
          });

          Api.putEditCreditNote(cnObject)
            .then(res => {
              this.toggleBlocking();

              GA.event({
                category: "Credit Note",
                action: "Edit CN (Success)",
                label: `Credit Note | ${
                  cnObject.externalId
                } | ${moment().format()}`,
                value: cnObject.total
              });

              Router.push(
                "/credit-note-detail?linearId=" +
                  this.props.url.query.creditNoteID
              );
            })
            .catch(err => {
              console.err(err);

              GA.event({
                category: "Credit Note",
                action: "Edit CN (Failed)",
                label: `Credit Note | ${
                  cnObject.externalId
                } | ${moment().format()}`
              });

              this.toggleBlocking();
              const response = handleError(err, this.handleDismissBtnModal);
              this.setState({
                ...response
              });
            });
        } else {
          GA.event({
            category: "Credit Note",
            action: "Resubmit CN (Request)",
            label: `Credit Note | ${
              cnObject.externalId
            } | ${moment().format()}`,
            value: cnObject.total
          });

          Api.putResubmitCreditNote(cnObject)
            .then(res => {
              this.toggleBlocking();

              GA.event({
                category: "Credit Note",
                action: "Resubmit CN (Success)",
                label: `Credit Note | ${
                  cnObject.externalId
                } | ${moment().format()}`,
                value: cnObject.total
              });

              Router.push("/credit-note");
            })
            .catch(err => {
              console.err(err);
              this.toggleBlocking();

              GA.event({
                category: "Credit Note",
                action: "Resubmit CN (Failed)",
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
      }
    });
  }

  async populateFileAttachmentForEdit() {
    /// populate & upload new file
    let fileTypeMapping = [];
    this.state.creditNoteFilesNew.forEach(file => {
      fileTypeMapping.push("CreditNote");
    });
    this.state.otherFilesNew.forEach(file => {
      fileTypeMapping.push("Others");
    });

    let uploadPackage = this.state.creditNoteFilesNew.concat(
      this.state.otherFilesNew
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

  populateExistingFileAttachment() {
    let fileAttachments = [];
    //// populate existing file
    this.state.creditNoteFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "CreditNote"
      };
      fileAttachments.push(attachment);
    });
    this.state.otherFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "Others"
      };
      fileAttachments.push(attachment);
    });

    return fileAttachments;
  }

  populateFileAttachment() {
    let fileAttachments = [];

    this.state.creditNoteFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "CreditNote",
        uploadDate:
          file.uploadDate === undefined
            ? moment().format("DD/MM/YYYY")
            : file.uploadDate
      };
      fileAttachments.push(attachment);
    });

    this.state.otherFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "Others",
        uploadDate:
          file.uploadDate === undefined
            ? moment().format("DD/MM/YYYY")
            : file.uploadDate
      };
      fileAttachments.push(attachment);
    });

    return fileAttachments;
  }

  populatedCreditNoteItem() {
    let allItems = this.state.allItems;
    let CNItems = [];
    allItems.forEach((item, index) => {
      let cnItemObject = {
        linearId: item.linearId,
        buyer: item.buyer,
        seller: item.seller,
        accounting: item.accounting,
        bank: item.bank,
        externalId: "" + (index + 1),
        purchaseItemLinearId: item.purchaseItemLinearId,
        invoiceItemLinearId: item.linearId,
        invoiceItemExternalId: item.externalId,
        creditNoteLinearId: this.state.CNDetailData.linearId,
        materialNumber: item.purchaseItem.materialNumber,
        materialDescription: item.materialDescription,
        quantity: item.creditNoteQuantity.initial,
        unit: item.quantity.unit,
        unitDescription: item.purchaseItem.unitDescription,
        unitPrice: item.unitPrice,
        subTotal: item.creditNoteAdjustedSubtotal,
        taxRate: item.vatRate,
        vatTotal: +this.calTax(item.creditNoteAdjustedSubtotal, item.vatRate),
        currency: item.currency,
        issuedDate: item.issuedDate,
        lifecycle: item.lifecycle,
        invoiceItems: [],
        goodsReceivedItems: item.goodsReceivedItems,
        customisedFields: item.customisedFields,
        customisedFieldsUpdatedDate: item.customisedFieldsUpdatedDate,
        status: item.status,
        disclosedMap: this.state.CNDetailData.disclosedMap,
        restrictedMap: this.state.CNDetailData.restrictedMap,
        invQuantity: item.quantity,
        adjustAmount: item.itemSubTotal - item.creditNoteAdjustedSubtotal
      };
      CNItems.push(cnItemObject);
    });
    return CNItems;
  }

  routeCancel() {
    Router.push("/credit-note");
  }

  calTax(amount, percentage) {
    return parseFloat(
      (
        parseFloat(amount.toFixed(2)) *
        parseFloat((percentage / 100).toFixed(2))
      ).toFixed(2)
    );
  }

  calItemsTaxTotal(items) {
    let taxTotal = 0;
    let taxSumMapping = {};

    items.forEach(item => {
      let amount =
        this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY
          ? (item.creditNoteQuantity.initial * item.unitPrice).toFixed(2)
          : item.creditNoteAdjustedSubtotal;
      if (_.has(taxSumMapping, `tax${item.vatRate}`)) {
        taxSumMapping[`tax${item.vatRate}`] += +amount;
      } else {
        taxSumMapping[`tax${item.vatRate}`] = +amount;
      }
    });

    _.forOwn(taxSumMapping, (value, key) => {
      taxTotal = taxTotal + +this.calTax(value, key.replace("tax", ""));
    });

    return taxTotal;
  }

  sumAllCNAmount(cnItems) {
    let cnAmountSum = 0;
    let vatTotalSum = 0;
    cnItems.forEach(item => {
      let amount =
        this.state.adjustmentType === CREATE_TYPE_ENUMS.QTY
          ? (item.creditNoteQuantity.initial * item.unitPrice).toFixed(2)
          : item.creditNoteAdjustedSubtotal;
      cnAmountSum = cnAmountSum + +amount;
      vatTotalSum = this.calItemsTaxTotal(cnItems);
    });

    this.setState({
      sumCNAmount: cnAmountSum
      // subTotal: cnAmountSum,
      // vatTotal: vatTotalSum,
      // total: cnAmountSum + vatTotalSum
    });
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

  uploadFiles(data) {
    return Api.postUploadFile(data).then(res => {
      return res[0].attachmentHash;
    });
  }

  onChangeSubTotalInput = async val => {
    let subTotal = parseFloat(val).toFixed(2);
    if (!this.state.isChangeSubTotalTaxTotal) {
      this.setState({
        isChangeSubTotalTaxTotal: true
      });
    }

    this.setState({
      subTotal: subTotal,
      total: Number(subTotal) + Number(this.state.vatTotal)
    });
  };

  onChangeTaxInput = async val => {
    let vatTotal = parseFloat(val).toFixed(2);
    if (!this.state.isChangeSubTotalTaxTotal) {
      this.setState({
        isChangeSubTotalTaxTotal: true
      });
    }

    this.setState({
      vatTotal: vatTotal,
      total: Number(vatTotal) + Number(this.state.subTotal)
    });
  };

  handleUnitChange = e => {
    let input = e.target.value;
    let value = input.replace(".", "");
    if (value == "") {
      e.target.value = formatPriceNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);

      e.target.value = this.formatPriceNumber(
        e.target.value.replace(/,/g, ""),
        2
      );
    }
  };

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }
  //SubTotal - Start
  handleSubTotalValidation = async e => {
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
  handleSubTotalChange = async e => {
    let input = e.target.value;
    let value = input.replace(".", "");
    if (value == "") {
      e.target.value = formatNumber(0, 2);
      this.state.subTotal = formatNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      this.state.subTotal = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }

    // this.changeFlagIsChangeSubTotalTaxTotal();
    // this.calInvoiceTotal();
    // this.calculateHeaderValue()
    this.onChangeSubTotalInput(this.state.subTotal);
  };
  handleSubTotalFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
    let arr = e.target.id.split("subTotal");
    let itemRef = arr[1];
    // let row = JSON.parse(e.target.getAttribute("data-row"));
  };
  //VatTotal - Start
  handleVatTotalValidation = async e => {
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
  handleVatTotalChange = async e => {
    let input = e.target.value;
    let value = input.replace(".", "");
    if (value == "") {
      e.target.value = formatNumber(0, 2);
      this.state.vatTotal = formatNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      this.state.vatTotal = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }

    // this.changeFlagIsChangeSubTotalTaxTotal();
    // this.calInvoiceTotal();
    // this.calculateHeaderValue()
    this.onChangeTaxInput(this.state.vatTotal);
  };
  handleVatTotalFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
    let arr = e.target.id.split("vatTotal");
    let itemRef = arr[1];
    // let row = JSON.parse(e.target.getAttribute("data-row"));
  };
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
  alert = (title, message, button = BTN_ACTION_BACK) => {
    this.setState({
      ModalAlert: {
        title,
        message,
        visible: true,
        button,
        isTextOnly: true
      },
      blockPage: false
    });
  };
  render() {
    const { t } = this.props;
    const cnFoundStyle = { width: "auto", color: "#AF3694" };
    const cnNotFoundStyle = { width: "auto" };

    return (
      <div>
        <Layout hideNavBar={true} ref={this.layout} {...this.props}>
          <Head>
            <title>{`Edit Credit Note No. ${this.state.CNNumber}`}</title>
          </Head>
          <BlockUi tag="div" blocking={this.state.blocking}>
            <div className="page__header d-flex flex-wrap px-3">
              <h2 className="col-6 offset-3 text-center">{t("Edit Mode")}</h2>
              <UserPanel {...this.props} />
            </div>
            <div id="invoice_detail_edit_page" className="row cn_edit">
              <div id="editForm" name="editForm" className="form col-12">
                <div className="form-group form-inline col-12 mb-3">
                  <label className="control-label h3 font-bold">
                    {t("CN No")}:
                  </label>
                  <input
                    type="text"
                    name="CNNumber"
                    style={
                      this.state.isCreditNoteDup === true
                        ? cnNotFoundStyle
                        : cnFoundStyle
                    }
                    value={this.state.CNNumber}
                    maxlength="30"
                    onChange={event => this.handleInputChange(event)}
                    className="form-control"
                  />
                  <label
                    style={{ color: "red", "margin-left": "10px" }}
                    hidden={!this.state.isCreditNoteDup}
                  >
                    Credit note number is duplicated, please enter another
                    number.
                  </label>
                </div>
                <section className="box box--width-header col-12">
                  <div className="box__header">
                    <div className="row justify-content-between align-items-center mb-2">
                      <div className="col">
                        {" "}
                        {t("Entry Date")} :
                        <strong>
                          {moment(
                            this.state.CNDetailData.documentEntryDate
                          ).format("DD/MM/YYYY")}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="box__inner">
                    <div className="row box" style={{ "min-height": "0px" }}>
                      <a
                        href="#vendorInfo"
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="true"
                        area-controls="vendorInfo"
                        className="d-flex w-100 btnToggle"
                      >
                        <div className="col-6">
                          <h3 className="border-bottom gray-1">
                            {t("Vendor")}
                          </h3>
                        </div>
                        <div className="col-6">
                          <h3 className="border-bottom gray-1">
                            {t("Company")}
                          </h3>
                          <i
                            className="fa fa-chevron-up gray-1"
                            aria-hidden="true"
                          />
                          <i
                            className="fa fa-chevron-down gray-1"
                            aria-hidden="true"
                          />
                        </div>
                      </a>
                      <div
                        id="vendorInfo"
                        className="collapse multi-collapse w-100 show"
                      >
                        <div className="card card-body noborder">
                          <div className="row">
                            <div className="col-6">
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Code")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.vendorNumber}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Name")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.vendorName}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Tax ID")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.vendorTaxNumber}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Branch")} :
                                </p>
                                <p className="col-6">
                                  <select
                                    name="branch"
                                    id="branch"
                                    className="form-control"
                                    onChange={e => this.onChangeVendorBranch(e)}
                                  >
                                    {this.state.vendorBranchList.map(
                                      (item, i) => {
                                        return (
                                          <option value={item.id} key={i}>
                                            {`${item.branchCode || ""} ${
                                              item.name ? `(${item.name})` : ""
                                            } ${
                                              item.flag ? `(${item.flag})` : ""
                                            }`}
                                          </option>
                                        );
                                      }
                                    )}
                                  </select>
                                  {/* {this.state.CNDetailData.vendorBranchCode} */}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Address")} :
                                </p>
                                <p className="col-6" id="vendorAddress">
                                  {this.state.CNDetailData.vendorAddress}
                                </p>
                                <p
                                  className="mt-2 mb-0 ml-0 mr-0 p-0 remark small text-grey"
                                  hidden={!this.state.isNotGetVendorBranchList}
                                >
                                  Cannot retrieve Vendor Branch information for
                                  selection.
                                  <br />
                                  System will use Vendor Branch from PO by
                                  default.
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Tel")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.vendorTelephone ||
                                    "-"}
                                </p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Code")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.companyCode}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Name")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.companyName}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Tax ID")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.companyTaxNumber}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Branch")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.companyBranchName}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Address")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.companyAddress}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Tel")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.companyTelephone ||
                                    "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row box" style={{ "min-height": "0px" }}>
                      <a
                        href="#creditNoteInfo"
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="true"
                        area-controls="creditNoteInfo"
                        className="d-flex w-100 btnToggle"
                      >
                        <div className="col-12">
                          <h3 className="border-bottom gray-1">
                            {t("Credit Note Information")}
                          </h3>
                          <i
                            className="fa fa-chevron-up gray-1"
                            aria-hidden="true"
                          />
                          <i
                            className="fa fa-chevron-down gray-1"
                            aria-hidden="true"
                          />
                        </div>
                      </a>
                      <div
                        id="creditNoteInfo"
                        className="collapse multi-collapse w-100 show"
                      >
                        <div className="card card-body noborder">
                          <div className="row">
                            <div className="col-6">
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Credit Note Date")} :
                                </p>
                                <p className="col-6 form-group">
                                  <i className="fa fa-calendar purple" />
                                  <input
                                    type="text"
                                    name="CNDate"
                                    onChange={event =>
                                      this.handleInputChange(event)
                                    }
                                    className="datepicker form-control"
                                  />
                                </p>
                              </div>

                              <div className="row mt-3">
                                <p className="col-4 text-right pl-0">
                                  {t("Invoice Ref No")} :
                                </p>
                                <p className="col-6">
                                  {this.state.CNDetailData.invoiceExternalId}
                                </p>
                              </div>
                              <div className="row mt-2">
                                <p className="col-4 text-right pl-0">
                                  {t("Type of CN")} :
                                </p>
                                <p className="col-6">
                                  {this.state.adjustmentType ===
                                  CREATE_TYPE_ENUMS.QTY
                                    ? "Quantity Adjustment"
                                    : "Price Adjustment"}
                                </p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  {t("CN Amount")} :
                                </p>
                                <p className="col-6 d-flex flex-wrap">
                                  <div className="col-8 text-right pl-0">
                                    {this.state.subTotal >= 0 ? (
                                      <input
                                        className="form-control"
                                        data-tip="custom show"
                                        data-event="focus"
                                        data-event-off="blur"
                                        data-for="priceSelect"
                                        key="subTotal"
                                        id="subTotal"
                                        ref="subTotal"
                                        type="text"
                                        name="subTotal[]"
                                        pattern="[0-9]*"
                                        defaultValue={formatNumber(
                                          this.state.subTotal || 0,
                                          2
                                        )}
                                        // value={formatNumber(row.subTotal || 0, 2)}
                                        placeholder={formatNumber(
                                          this.state.subTotal || 0,
                                          2
                                        )}
                                        // disabled={!row.checked}
                                        onKeyPress={e => this.numberOnly(e, 14)}
                                        // onInput={e => {
                                        //   this.autoResizeInput(e);
                                        // }}
                                        onFocus={this.handleSubTotalFocus}
                                        onChange={e => {
                                          this.handleSubTotalValidation(e);
                                        }}
                                        onBlur={e => {
                                          this.handleSubTotalChange(e);
                                        }}
                                      />
                                    ) : (
                                      ""
                                    )}

                                    {/* <input
                                      type="text"
                                      name="subTotal"
                                      className="form-control"
                                      data-event-off="blur"
                                      value={this.state.subTotal}
                                      onChange={e =>
                                        this.onChangeSubTotalInput(e)
                                      }
                                      onBlur={e => {
                                        this.handleUnitChange(e);
                                      }}
                                    /> */}
                                  </div>
                                  <div className="col-4">
                                    <span className="unit">
                                      {this.state.CNDetailData.currency || ""}
                                    </span>
                                  </div>
                                </p>
                              </div>

                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  {t("Tax Total")} :
                                </p>
                                <p className="col-6 d-flex flex-wrap">
                                  <div className="col-8 text-right pl-0">
                                    {this.state.vatTotal >= 0 ? (
                                      <input
                                        className="form-control"
                                        data-tip="custom show"
                                        data-event="focus"
                                        data-event-off="blur"
                                        data-for="priceSelect"
                                        key="vatTotal"
                                        id="vatTotal"
                                        ref="vatTotal"
                                        type="text"
                                        name="vatTotal[]"
                                        pattern="[0-9]*"
                                        defaultValue={formatNumber(
                                          this.state.vatTotal || 0,
                                          2
                                        )}
                                        // value={formatNumber(row.vatTotal || 0, 2)}
                                        placeholder={formatNumber(
                                          this.state.vatTotal || 0,
                                          2
                                        )}
                                        // disabled={!row.checked}
                                        onKeyPress={e => this.numberOnly(e, 14)}
                                        // onInput={e => {
                                        //   this.autoResizeInput(e);
                                        // }}
                                        onFocus={this.handleVatTotalFocus}
                                        onChange={e => {
                                          this.handleVatTotalValidation(e);
                                        }}
                                        onBlur={e => {
                                          this.handleVatTotalChange(e);
                                        }}
                                      />
                                    ) : (
                                      ""
                                    )}
                                    {/* <input
                                      type="text"
                                      name="vatTotal"
                                      className="form-control"
                                      data-event-off="blur"
                                      value={this.state.vatTotal}
                                      onChange={e => this.onChangeTaxInput(e)}
                                      onBlur={e => {
                                        this.handleUnitChange(e);
                                      }}
                                    /> */}
                                  </div>
                                  <div className="col-4 text-left">
                                    <span className="unit">
                                      {this.state.CNDetailData.currency || ""}
                                    </span>
                                  </div>
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  {t("CN Amount (Inc Tax)")} :
                                </p>
                                <p className="col-6 d-flex flex-wrap text-right">
                                  <div className="col-8 text-right">
                                    {this.formatPriceNumber(this.state.total)}
                                  </div>
                                  <div className="col-4 text-left">
                                    <span className="unit">
                                      {this.state.CNDetailData.currency || ""}
                                    </span>
                                  </div>
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  {t("Reason")} :
                                </p>
                                <p className="col-6">
                                  <textarea
                                    rows="5"
                                    className="border border-1px border-lightgray w-100"
                                    name="CNReason"
                                    onChange={event =>
                                      this.handleInputChange(event)
                                    }
                                    value={this.state.CNReason}
                                  />
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* attachment */}
                    <div className="row box" style={{ "min-height": "0px" }}>
                      <a
                        href="#attachmentInfo"
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="true"
                        area-controls="attachmentInfo"
                        className="d-flex w-100 btnToggle"
                      >
                        <div className="col-12">
                          <h3 className="border-bottom gray-1">
                            {t("Attachments")}
                          </h3>
                          <i
                            className="fa fa-chevron-up gray-1"
                            aria-hidden="true"
                          />
                          <i
                            className="fa fa-chevron-down gray-1"
                            aria-hidden="true"
                          />
                        </div>
                      </a>
                      <div
                        id="attachmentInfo"
                        className="collapse multi-collapse w-100 show"
                      >
                        <div className="card card-body noborder">
                          <div className="row">
                            <div className="col-6">
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Other Documents")} :
                                </p>
                                <div className="col-8 nopadding form-group d-inline-flex custom-fileUpload">
                                  <input
                                    type="text"
                                    name="attach_other_file"
                                    disabled="disabled"
                                    className="form-control"
                                  />
                                  <div className="upload-btn-wrapper">
                                    <button
                                      type="button"
                                      className="btn btn--transparent btnUpload"
                                    >
                                      {t("Browse")}
                                    </button>
                                    <input
                                      type="file"
                                      name="attach_other_file"
                                      onChange={this.handleSelectedFile}
                                    />
                                  </div>
                                </div>
                                <div className="col-6 offset-4 nopadding">
                                  <small>
                                    {t("File type")}:{" "}
                                    {this.state.otherFilesFormat},
                                    {t("Required")}:{" "}
                                    {this.state.otherRequiredString}{" "}
                                    {t(
                                      parseInt(this.state.otherRequiredString) >
                                        1
                                        ? "files"
                                        : "file"
                                    )}
                                  </small>
                                </div>
                                <ul className="uploadedList col-6 offset-4 px-0">
                                  {_.map(
                                    this.state.otherFiles,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li key={index}>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {this.sliceFileName(name)}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "otherFiles",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                  {_.map(
                                    this.state.otherFilesNew,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li key={index}>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {this.sliceFileName(name)}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "otherFilesNew",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  {t("Credit Note")} :
                                </p>
                                <div className="col-8 nopadding form-group d-inline-flex custom-fileUpload">
                                  <input
                                    type="text"
                                    name="attach_cn_file"
                                    disabled="disabled"
                                    className="form-control"
                                  />
                                  <div className="upload-btn-wrapper">
                                    <button
                                      type="button"
                                      className="btn btn--transparent btnUpload"
                                    >
                                      {t("Browse")}
                                    </button>
                                    <input
                                      type="file"
                                      name="attach_cn_file"
                                      onChange={this.handleSelectedFile}
                                    />
                                  </div>
                                </div>
                                <div className="col-6 offset-4 nopadding">
                                  <small>
                                    {t("File type")}:{" "}
                                    {this.state.creditNoteFilesFormat},
                                    {t("Required")}:{" "}
                                    {this.state.creditNoteRequiredString}{" "}
                                    {t(
                                      parseInt(
                                        this.state.creditNoteRequiredString
                                      ) > 1
                                        ? "files"
                                        : "file"
                                    )}
                                  </small>
                                </div>
                                <ul className="uploadedList col-6 offset-4 px-0">
                                  {_.map(
                                    this.state.creditNoteFiles,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li key={index}>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {this.sliceFileName(name)}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "creditNoteFiles",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                  {_.map(
                                    this.state.creditNoteFilesNew,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li key={index}>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {this.sliceFileName(name)}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "creditNoteFilesNew",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* end-attachment */}
                    <div className="row box pt-0 pb-0">
                      <a
                        href="javascript:void(0);"
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="true"
                        area-controls="creditNoteInfo"
                        className="d-flex w-100 btnToggle"
                      >
                        <div className="col-8 d-flex align-items-center">
                          <h3 className="gray-1 py-0">
                            {t("Select Item Invoice Ref No")}:{" "}
                            {this.state.CNDetailData.invoiceExternalId} (
                            {this.state.CNInvoiceItem.length}{" "}
                            {this.state.CNInvoiceItem.length > 1
                              ? t("Items")
                              : t("Item")}
                            )
                          </h3>
                        </div>
                        <div className="col-4 text-right pb-2">
                          <button
                            type="button"
                            name="btnChangeInvRefNo"
                            id="btnChangeInvRefNo"
                            className="btn btn--transparent btn-wide mt-2"
                            data-toggle="modal"
                            data-target="#changeInvoiceRefNo"
                          >
                            {t("Change Invoice Ref No")}
                          </button>
                        </div>
                      </a>
                      <div
                        id="CreditNoteItems"
                        className="collapse multi-collapse w-100 show"
                      >
                        <div className="card card-body noborder pt-2">
                          <div className="table-responsive table-wrapper">
                            <table
                              className="table datatable"
                              ref={el => (this.el = el)}
                            >
                              <thead className="bg-lightgrey">
                                {this.state.adjustmentType ===
                                CREATE_TYPE_ENUMS.QTY ? (
                                  <tr>
                                    <th>
                                      <input type="checkbox" id="selectAll" />
                                    </th>
                                    <th>
                                      {t("Invoice Item No1")}
                                      <br />
                                      {t("Invoice Item No2")}
                                    </th>
                                    <th>{t("Material Description")}</th>
                                    <th>{t("PO No")}</th>
                                    <th>
                                      {t("PO Item No1")}
                                      <br />
                                      {t("PO Item No2")}
                                    </th>
                                    <th>{t("Invoice QTY")}</th>
                                    <th>{t("CN QTY")}</th>
                                    <th>{t("Unit")}</th>
                                    <th>
                                      {t("Unit Price1")}
                                      <br />
                                      {t("Unit Price2")}
                                    </th>
                                    <th>{t("Currency")}</th>
                                    <th>
                                      {t("CN Amount1")}
                                      <br />
                                      {t("CN Amount2")}
                                    </th>
                                  </tr>
                                ) : (
                                  <tr>
                                    <th>
                                      <input type="checkbox" id="selectAll" />
                                    </th>
                                    <th>
                                      {t("Invoice Item No1")}
                                      <br />
                                      {t("Invoice Item No2")}
                                    </th>
                                    <th>{t("Material Description")}</th>
                                    <th>{t("PO No")}</th>
                                    <th>
                                      {t("PO Item No1")}
                                      <br />
                                      {t("PO Item No2")}
                                    </th>
                                    <th>{t("Unit")}</th>
                                    <th>{t("Invoice Qty")}</th>
                                    <th>
                                      {t("Invoice Unit Price1")}
                                      <br />
                                      {t("Invoice Unit Price2")}
                                    </th>
                                    <th>
                                      {t("Invoice Amount1")}
                                      <br />
                                      {t("Invoice Amount2")}
                                    </th>
                                    <th>
                                      {t("Adjusted Amount1")}
                                      <br />
                                      {t("Adjusted Amount2")}
                                    </th>
                                    <th>{t("Currency")}</th>
                                  </tr>
                                )}
                              </thead>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-12 text-center">
                        <button
                          type="button"
                          name="btnCancel"
                          id="btnCancel"
                          className="btn btn--transparent btn-wide"
                          data-toggle="modal"
                          data-target="#cancelWarning"
                        >
                          {t("Cancel")}
                        </button>
                        <button
                          disabled={!this.state.isAllowResubmit}
                          type="submit"
                          name="btnSubmit"
                          id="btnSubmit"
                          onClick={() => this.handleEditCreditNote()}
                          className="btn btn-wide"
                        >
                          {this.state.isEdit === true
                            ? t("Resubmit")
                            : t("Resubmit")}
                        </button>
                      </div>
                    </div>
                    <div className="row">&nbsp;</div>
                  </div>
                </section>
              </div>
            </div>
            <div
              id="alertBox"
              className="modal hide fade"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="alertBox"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-sm" role="document">
                <div className="modal-content">
                  <div className="modal-header justify-content-center">
                    <h3 id="myModalLabel">Error</h3>
                  </div>
                  <div className="modal-body d-flex justify-content-center">
                    <p>
                      Unable to edit/resubmit credit note because{" "}
                      {this.state.editErrMessage}
                    </p>
                  </div>
                  <div className="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="changeInvoiceRefNo"
              className="modal hide fade"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="alertBox"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-sm" role="document">
                <div className="modal-content">
                  <div className="modal-header justify-content-center">
                    <h3 id="myModalLabel">Change Invoice Ref. No.</h3>
                  </div>
                  <div className="modal-body d-flex justify-content-center">
                    <p className="text-center">
                      To change invoice Ref. No., the system has to remove all
                      existing items from{" "}
                      {this.state.CNDetailData.invoiceExternalId}
                      <br />
                      Do you want to continue changing invoice Ref. No.?
                    </p>
                  </div>
                  <div className="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn--transparent btn-wide"
                      data-dismiss="modal"
                      onClick={() => this.triggerNewInvoice()}
                      aria-hidden="true"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="newInvoiceRef"
              className="modal hide fade"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="alertBox"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-sm" role="document">
                <div className="modal-content">
                  <div className="modal-header justify-content-center">
                    <h3 id="myModalLabel">Please Select New Invoice Ref.</h3>
                  </div>
                  <div className="modal-body d-flex justify-content-center">
                    <div className="form-label-group col-7">
                      <AsyncTypeahead
                        inputProps={{
                          id: `invoiceNumber`,
                          name: `invoiceNumber`,
                          className: `input-search`,
                          title: `Invoice Reference`
                        }}
                        ref={Typeahead => (this.Typeahead = Typeahead)}
                        placeholder="Invoice Reference"
                        defaultInputValue=""
                        isLoading={this.state.isLoading}
                        labelKey="externalId"
                        minLength={3}
                        delay={this.state.delayTime}
                        useCache={false}
                        onChange={selected =>
                          this.handleInvoiceAutoCompleteChange(selected[0])
                        }
                        onSearch={query => {
                          if (query.trim() != "") {
                            this.setState({ isLoading: true });
                            let fetchURL = `${invoiceSearchApiUrl}${query}`;
                            fetch(fetchURL)
                              .then(resp => resp.json())
                              .then(json => {
                                this.setState({
                                  isLoading: false,
                                  options: json.data
                                });
                              });
                          }
                        }}
                        options={this.state.options}
                      />
                    </div>
                  </div>
                  <div className="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn--transparent btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn-wide"
                      onClick={() => this.handleConfirmChangeInvoice()}
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="cancelWarning"
              className="modal hide fade"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="cancel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-sm" role="document">
                <div className="modal-content">
                  <div className="modal-header d-flex justify-content-center">
                    <h3 id="myModalLabel">Cancel</h3>
                  </div>
                  <div className="modal-body text-center">
                    <div className="text">
                      Do you want to cancel editing this credit note?
                    </div>
                  </div>
                  <div className="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn--transparent btn-wide"
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
            <ModalAlert
              title={this.state.alertModalAlertTitle}
              visible={this.state.isAlertModalVisible}
              button={this.state.buttonAlert}
              isTextOnly={this.state.isTextOnly}
            >
              {this.state.alertModalMsg}
            </ModalAlert>
          </BlockUi>
        </Layout>
      </div>
    );
  }
}
export default withAuth(withTranslation(["credit-edit"])(creditNoteEdit));
