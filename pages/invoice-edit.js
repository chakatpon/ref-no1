import _ from "lodash";
import moment from "moment";
import io from "socket.io-client";
import "daterangepicker";
import Router from "next/router";
import React, { Component } from "react";
import BlockUi from "react-block-ui";
import { findDOMNode } from "react-dom";
import ReactTooltip from "react-tooltip";
import Layout from "../components/Layout";
import UserPanel from "../components/userPanel";
import handleError from "./handleError";
import { withTranslation } from "~/i18n";
import {
  formatNumber,
  numberOnly,
  GrThead
} from "../components/invoices/edit/models/item";
import "../libs/mycools";
import { asyncContainer, Typeahead } from "../libs/react-bootstrap-typeahead";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import Head from "next/head";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_OK
} from "../components/modalAlert";
import VendorCompany from "../components/invoices/edit/components/sections";
import ItemInformation from "../components/invoices/edit/components/itemInformation";
import GRItemEdit from "~/components/invoices/edit/components/GRItemEdit";
import GRItemEditPreview from "~/components/invoices/edit/components/GRItemEditPreview";
import POItemEditPreview from "~/components/invoices/edit/components/POItemEditPreview";
import POItemEdit from "~/components/invoices/edit/components/POItemEdit";
import {
  PageHeader,
  Collapse,
  CollapseNoExpand,
  CollapseItem,
  CollapseItemText,
  CollapseItemCheckbox,
  CollapseItemCurrency,
  CollapseItemAttachment,
  CollapseItemExternalLink,
  CollapseItemLink2,
  CollapseItemLink,
  ModalDefault
} from "~/components/page";
import {
  columnItemPO,
  columnItemGR
} from "~/components/invoices/edit/models/item";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import dynamic from "next/dynamic";
import followMeConfig from "../follow-me.json";
import GA from "~/libs/ga";

// import Tour from "reactour";
const lifecycleResubmit = ["PENDING_SELLER"];
const lifecycleEdit = ["ISSUED", "MISSING", "PARTIAL", "PENDING_SELLER"];
const Tour = dynamic(() => import("reactour"), {
  ssr: false
});
const accentColor = "#af3694";
const steps = [
  {
    selector: ".invNoEdit",
    content: "Edit Invoice Number",
    action: node => {
      // by using this, focus trap is temporary disabled
      node.focus();
    }
  },
  {
    selector: ".vendorInfo",
    content: "Vendor Company Infomation",
    action: node => {
      // by using this, focus trap is temporary disabled
      node.focus();
    }
  },
  {
    selector: ".paymentInfo",
    content: "Payment Infomation",
    action: node => {
      // by using this, focus trap is temporary disabled
      node.focus();
    }
  },
  {
    selector: "wait to scroll",
    content: "waiting to scroll...\n and click to next step",
    action: node => {
      window.scrollTo({ top: 500, behavior: "smooth" });
      // by using this, focus trap is temporary disabled
    }
  },
  {
    selector: ".attachmentsList",
    content: "Attachments",
    action: node => {
      // by using this, focus trap is temporary disabled
      node.focus();
    }
  },
  {
    selector: "wait to scroll",
    content: "waiting to scroll...\n and click to next step",
    action: node => {
      window.scrollTo({ top: 1000, behavior: "smooth" });
      // by using this, focus trap is temporary disabled
    }
  },
  {
    selector: ".itemsInfo",
    content: "Items Infomation",
    action: node => {
      // by using this, focus trap is temporary disabled
      node.focus();
    }
  },
  {
    selector: "#submitBtn",
    content: "View Summary or Submit",
    action: node => {
      // by using this, focus trap is temporary disabled
      node.focus();
    }
  }
];

const AsyncTypeahead = asyncContainer(Typeahead);
class invoiceEdit extends Component {
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
    this.BTN_CLOSE = [
      {
        label: "Close",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: this.handleDismissBtnModal
        }
      }
    ];
    this.state = {
      UserAuthority: this.props.permisions,
      allowMultipleGR: true,
      isMultipleGRExceeded: false,
      modalMultipleGRExceeded: false,
      isReSubmit: false,
      previewMode: false,
      isEditValidationPass: true,
      isResubmitValidationPass: false,
      isInvoiceDup: false,
      currentStep: 1,
      blockPage: true,
      editFileOnly: false,
      vendorBranchList: [],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: [],

      flag: {
        isNotGetVendorBranchList: false,
        isChangeSubTotalTaxTotal: false
      },
      ModalAlert: {
        title: "",
        visible: false,
        button: [],
        isTextOnly: false,
        message: ""
      },
      rawData: {
        externalId: ""
      },
      selectedItems: [],
      newData: {},
      attachmentList: {
        TaxInvoice: [],
        DeliveryNote: [],
        Receipt: [],
        Others: []
      },
      attachmentsNew: {
        TaxInvoice: [],
        DeliveryNote: [],
        Receipt: [],
        Others: []
      },
      config: {
        INVOICE_CREATED_BY_DOCUMENT: {
          value: ""
        },
        INVOICE_CONFIG: {},
        INVOICE_ATTACHMENT: {},
        CONFIG_ATTACHMENT: {},
        LIFECYCLE_ALLOW_ATTACHMENT: []
      },
      listItems: [],
      alertModalAlertTitle: "",
      isAlertModalVisible: false,
      buttonAlert: "",
      isTextOnly: true,
      alertModalMsg: []
    };
    this.apis = new api().group("invoice");
    this.summaryInvoiceApi = new api().group("createInvoice");
    this.configApi = new api().group("config");
    this.upload = new api().group("upload");
    this.linearId = this.props.url.query.linearId;
  }
  updateMainState = newState => {
    this.setState(newState);
  };

  componentDidMount = () => {
    this.socket = io.connect("/edit-invoice");
  };

  componentWillMount = async () => {
    let isReady = await this.checkAccess();
    if (isReady == true) {
      isReady = await this.preparingData();
      setTimeout(() => {
        if (followMeConfig.editInvoice.enable) {
          this.openTour();
        }
      }, 500);
      this.setState({ blockPage: !isReady });
    }
  };

  componentWillUnmount() {
    this.socket.disconnect();
  }

  getInvoiceSummary = async () => {
    console.log(
      "this.state.config.INVOICE_CREATED_BY_DOCUMENT.value :",
      this.state.config.INVOICE_CREATED_BY_DOCUMENT.value
    );
    try {
      // console.log("DATA ITEM", this.state.listItems);
      // if (this.state.selectedItems.length > 0) {
      //   let newListItems = [];
      //   this.state.selectedItems.forEach(r => {
      //     r.itemLists.forEach(item => {
      //       newListItems.push(item);
      //     });
      //   });
      //   this.setState({
      //     listItems: newListItems
      //   });
      // }
      let fileAttachments = [];
      let items =
        this.state.config.INVOICE_CREATED_BY_DOCUMENT.value == "PURCHASE_ORDER"
          ? this.preparePOItemsForUpdateInvoice()
          : this.prepareGRItemsForUpdateInvoice();
      let data = [
        {
          buyer: this.state.rawData.buyer,
          companyBranchCode: this.state.rawData.companyBranchCode,
          companyBranchName: this.state.rawData.companyBranchName,
          companyCode: this.state.rawData.companyCode,
          companyName: this.state.rawData.companyName,
          currency: this.state.rawData.currency,
          lifecycle: this.state.rawData.lifecycle,
          linearId: this.state.rawData.linearId,
          purchaseOrderNumber: this.state.rawData.items[0]
            .purchaseOrderExternalId,
          paymentTermCode: this.state.rawData.paymentTermCode,
          paymentTermDays: this.state.rawData.paymentTermDays,
          paymentTermDescription: this.state.rawData.paymentTermDesc,
          items: items.length > 0 ? items : this.state.newData.items,
          seller: this.state.rawData.seller,
          status: this.state.rawData.status,
          vendorAddress1: this.state.rawData.vendorAddress,
          vendorBranchCode: this.state.rawData.vendorBranchCode,
          vendorBranchName: this.state.rawData.vendorBranchName,
          vendorName: this.state.rawData.vendorName,
          vendorNumber: this.state.rawData.vendorNumber,
          vendorTaxNumber: this.state.rawData.vendorTaxNumber,
          fileAttachments: fileAttachments,
          ////
          bank: this.state.rawData.bank,
          baselineDate: moment().format("DD/MM/YYYY"),
          companyTaxNumber: this.state.rawData.companyTaxNumber,
          companyAddress: this.state.rawData.companyAddress,
          dueDate: this.state.rawData.dueDate,
          dueDateIsLocked: this.state.rawData.dueDateIsLocked,
          externalId: this.state.rawData.externalId,
          goodsReceived: this.state.rawData.goodsReceived,
          initialDueDate: this.state.rawData.initialDueDate,
          invoiceCreatedDate: this.state.rawData.invoiceCreatedDate,
          invoiceDate: this.state.rawData.invoiceDate,
          invoiceFinancing: this.state.rawData.invoiceFinancing,
          invoiceTotal: this.state.rawData.invoiceTotal,
          isETaxInvoice: this.state.rawData.isETaxInvoice,
          matchingStatus: this.state.rawData.matchingStatus,
          paymentFee: this.state.rawData.paymentFee,
          paymentTermDesc: this.state.rawData.paymentTermDesc,
          purchaseOrder: this.state.rawData.purchaseOrder,
          purchaseOrderHeaderNumber: this.state.rawData
            .purchaseOrderHeaderNumber,
          receiptNumber: this.state.rawData.receiptNumber,
          restrictedMap: this.state.rawData.restrictedMap,
          resubmitCount: this.state.rawData.resubmitCount,
          subTotal: this.state.rawData.subTotal,
          vatTotal: this.state.rawData.vatTotal,
          vendorAddress: this.state.rawData.vendorAddress,
          disclosedMap: this.state.rawData.disclosedMap
        }
      ];
      let res = await this.summaryInvoiceApi.call(
        "getInvoiceSummary",
        {},
        { data: data[0] }
      );
      this.setState({
        retentionAmount: res.retentionAmount,
        estimatedPayable: res.estimatedPayable,
        withholdingTaxTotal: res.withholdingTaxTotal
      });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  preparingData = async () => {
    try {
      let invoiceDetail = await this.apis.call("detail", {
        linearId: this.linearId,
        bypass: true,
        role: this.props.user.organisationUnit
      });
      if (invoiceDetail.pageSize != 1) {
        const message = [
          "Sorry, you cannot get detail of this invoice.",
          <br />,
          "Please contact your administrator."
        ];
        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
        return false;
      }
      this.filterValidate(invoiceDetail);

      let data = invoiceDetail.rows[0];
      this.setState({ rawData: data, newData: data });

      await this.setVendorBranchList();
      await this.fileAttchmentInitail(data);
      await this.resolveButtonPermission(data);
      return await this.preparingConfig(data);
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });

      return false;
    }
  };
  filterValidate = async invoiceDetail => {
    let items = invoiceDetail.rows[0].items;
    if (items.length > 0) {
      let filtered = [];
      filtered = await items.filter(
        item =>
          item.creditNoteAdjustedSubtotal !== 0 ||
          item.creditNoteQuantity.initial !== 0 ||
          item.debitNoteAdjustedSubTotal !== 0
      );
      if (filtered.length > 0) {
        const message = [
          "Not allow editing/resubmitting an invoice.",
          <br />,
          "Since there is an active credit note or debit note refers to this invoice."
        ];
        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_CLOSE"
        );
        this.setState({
          ...response
        });
      }
    }
    return items;
  };

  filterItems(items) {}

  resolveButtonPermission(rawData) {
    if (rawData.lifecycle.toUpperCase() === "PENDING_SELLER") {
      this.setState({
        isReSubmit: true
      });
    } else {
      this.setState({
        isReSubmit: false
      });
    }
  }
  fileAttchmentInitail = async rawData => {
    let attachmentList = this.state.attachmentList;
    for (let grp in attachmentList) {
      attachmentList[grp] = rawData.fileAttachments.filter(
        r => r.attachmentType == grp
      );
    }
    return await this.setState({
      attachmentList
    });
  };
  calendarInitial = (configuration, rawData) => {
    var _this = this;
    $(function() {
      let datePickerOpts = {
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
          format: "DD/MM/YYYY"
        }
      };
      if (configuration.minimumDocumentEffectiveDate) {
        datePickerOpts = {
          ...datePickerOpts,
          minDate: moment(configuration.minimumDocumentEffectiveDate).format(
            "DD/MM/YYYY"
          )
        };
      }
      if (configuration.maximumDocumentEffectiveDate) {
        datePickerOpts = {
          ...datePickerOpts,
          maxDate: moment(configuration.maximumDocumentEffectiveDate).format(
            "DD/MM/YYYY"
          )
        };
      }
      $("#invoice_date")
        .daterangepicker(datePickerOpts)
        .on("change", e => {
          //2019-05-14T00:00:00.000+07:00
          _this.setState({
            rawData: {
              ..._this.state.rawData,
              invoiceDate: moment(e.target.value, "DD/MM/YYYY").format()
            }
          });
        });
    });
  };
  setVendorBranchList = async () => {
    try {
      const { rawData } = this.state;
      const { seller, vendorTaxNumber } = rawData;
      let vendorBranchList = [];
      let payload = {
        legalName: seller.legalName,
        taxId: vendorTaxNumber
      };

      let invoiceBranch = {
        address: rawData.vendorAddress || "-",
        branchCode: rawData.vendorBranchCode || "-",
        name: rawData.vendorBranchName || "-",
        taxId: rawData.vendorTaxNumber || "-",
        id: 0,
        flag: "Invoice"
      };
      vendorBranchList.push(invoiceBranch);

      let poBranch = {
        address: `${rawData.items[0].purchaseItem.vendorStreet1 || ""} ${rawData
          .items[0].purchaseItem.vendorStreet2 || ""}`,
        branchCode: rawData.items[0].purchaseItem.vendorBranchCode || "-",
        name: rawData.items[0].purchaseItem.vendorBranchName || "-",
        taxId: rawData.items[0].purchaseItem.vendorTaxNumber || "-",
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
      this.setState({
        flag: { ...this.state.flag, isNotGetVendorBranchList: true }
      });
    }
  };
  onChangeVendorBranch = async e => {
    const { vendorBranchList } = this.state;
    const value = e.target.value;
    if (value == "") {
      this.setState({
        rawData: {
          ...this.state.rawData,
          vendorAddress: "",
          vendorBranchCode: "",
          vendorBranchName: ""
        }
      });
      return;
    }
    if (vendorBranchList.length > 0) {
      const vendorBranch = await vendorBranchList.find(item => {
        return item.id == value;
      });

      this.setState({
        rawData: {
          ...this.state.rawData,
          vendorAddress: vendorBranch.address,
          vendorBranchCode: vendorBranch.branchCode,
          vendorBranchName: vendorBranch.name
        }
      });
    }
    $("#vendorAddress").css("color", "#d40e78");
  };
  checkAllowedAction = config => {
    if (
      config.allowedLifecycle.includes(
        this.state.rawData.lifecycle.toUpperCase()
      ) &&
      !lifecycleEdit.includes(this.state.rawData.lifecycle.toUpperCase())
    ) {
      return config.allowedAction;
    } else if (
      lifecycleEdit.includes(this.state.rawData.lifecycle.toUpperCase())
    ) {
      return ["Add", "Remove"];
    } else {
      return [];
    }
  };

  preparingfileAttachmentConfig = async attachmentConfiguration => {
    let fileConfig = attachmentConfiguration;
    let fileAttachmentConfig = [];
    fileConfig.forEach(config => {
      let formats = config.fileType.split(",");
      let formatsList = [];
      formats.forEach(x => {
        formatsList.push(`.${x.toLowerCase()}`);
      });

      let cfg = {
        required: false,
        format: config.fileType,
        formats: formatsList.join(","),
        actions: this.checkAllowedAction(config),
        requiredString: "",
        minimum: config.minimumNumberOfFiles,
        maximum: config.maximumNumberOfFiles
      };
      if (config.minimumNumberOfFiles > 0) {
        cfg.required = true;
      }
      if (config.minimumNumberOfFiles == config.maximumNumberOfFiles) {
        cfg.requiredString = config.minimumNumberOfFiles;
      } else {
        cfg.requiredString = `${config.minimumNumberOfFiles}-${config.maximumNumberOfFiles}`;
      }
      fileAttachmentConfig = {
        ...fileAttachmentConfig,
        [config.attachmentType]: cfg
      };
    });
    return fileAttachmentConfig;
  };
  preparingLifeCycle = async attachmentConfiguration => {
    let fileConfig = attachmentConfiguration;
    let allLifeCycle = attachmentConfiguration.reduce(
      (newArray, fileConfig) => [...newArray, ...fileConfig.allowedLifecycle],
      []
    );
    let unionLifeCycle = new Set(allLifeCycle);
    allLifeCycle = [...unionLifeCycle];

    return allLifeCycle;
  };

  preparingConfig = async data => {
    try {
      let INVOICE_CREATED_BY_DOCUMENT = await this.configApi.call(
        "configuration",
        {
          companyTaxId: data.vendorTaxNumber,
          counterPartyTaxId: data.companyTaxNumber,
          configOption: "INVOICE_CREATED_BY_DOCUMENT"
        }
      );
      if (INVOICE_CREATED_BY_DOCUMENT.length > 1) {
        const message = [
          "There are multiple configurations for INVOICE_CREATED_BY_DOCUMENT.",
          <br />,
          "Please contact your administrator for assistance."
        ];
        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
        return false;
      } else if (INVOICE_CREATED_BY_DOCUMENT.length != 1) {
        const message = [
          "The necessary configuration is not found.",
          <br />,
          "CONFIG_OPTION:  INVOICE_CREATED_BY_DOCUMENT",
          <br />,
          "Please contact your administrator for assistance."
        ];
        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
        return false;
      }

      let INVOICE_CONFIG = await this.apis.call("invoiceConfig", {
        companyTaxId: data.companyTaxNumber,
        legalName: data.buyer.legalName,
        vendorTaxId: data.vendorTaxNumber
      });

      if (!INVOICE_CONFIG && !INVOICE_CONFIG.attachmentConfiguration) {
        const message = [
          "The necessary configuration is not found.",
          <br />,
          "CONFIG_OPTION:  INVOICE_ATTACHMENT",
          <br />,
          "Please contact your administrator for assistance."
        ];
        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
        return false;
      }

      let INVOICE_ITEM_DEFAULT_GROUPING = false;

      if (INVOICE_CREATED_BY_DOCUMENT[0].value == "GOODS_RECEIVED") {
        INVOICE_ITEM_DEFAULT_GROUPING = await this.apis.call("configuration", {
          companyTaxId: data.vendorTaxNumber,
          counterPartyTaxId: data.companyTaxNumber,
          configOption: "INVOICE_ITEM_DEFAULT_GROUPING"
        });
        if (INVOICE_ITEM_DEFAULT_GROUPING.length > 1) {
          INVOICE_ITEM_DEFAULT_GROUPING = [];
          const message = [
            "There are multiple configurations for INVOICE_ITEM_DEFAULT_GROUPING.",
            <br />,
            "Please contact your administrator for assistance."
          ];
          const response = handleError(
            message,
            this.handleDismissBtnModal,
            "BTN_BACK"
          );
          this.setState({
            ...response
          });
          return false;
        } else if (INVOICE_ITEM_DEFAULT_GROUPING.length != 1) {
          INVOICE_ITEM_DEFAULT_GROUPING = false;
        } else {
          INVOICE_ITEM_DEFAULT_GROUPING = INVOICE_ITEM_DEFAULT_GROUPING[0];
        }
      }
      let LIFECYCLE_ALLOW_ATTACHMENT = await this.preparingLifeCycle(
        INVOICE_CONFIG.attachmentConfiguration
      );
      let CONFIG_ATTACHMENT = await this.preparingfileAttachmentConfig(
        INVOICE_CONFIG.attachmentConfiguration
      );
      /* -- Check if lifecycle is in config. allow user edit only atatchment -- */
      let editFileOnly = false;
      // if (LIFECYCLE_ALLOW_ATTACHMENT.includes(data.lifecycle)) {
      //   editFileOnly = true;
      // }

      if (
        !lifecycleEdit.includes(data.lifecycle) &&
        LIFECYCLE_ALLOW_ATTACHMENT.includes(data.lifecycle)
      ) {
        editFileOnly = true;
      }
      /* -- Set configuration in to state -- */
      //Force GR
      // INVOICE_CREATED_BY_DOCUMENT[0].value = "GOODS_RECEIVED";
      this.setState({
        editFileOnly,
        config: {
          INVOICE_CONFIG,
          INVOICE_CREATED_BY_DOCUMENT: INVOICE_CREATED_BY_DOCUMENT[0],
          LIFECYCLE_ALLOW_ATTACHMENT,
          CONFIG_ATTACHMENT,
          INVOICE_ITEM_DEFAULT_GROUPING
        }
      });
      await this.calendarInitial(INVOICE_CONFIG, this.state.rawData);
      await this.resolveInvoiceFinancingAllow(INVOICE_CONFIG);

      return true;
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      return false;
    }
  };

  resolveInvoiceFinancingAllow = config => {
    let isAllowInvoiceFinancing = false;

    if (config && config.allowedLifeCycleToEditInvoiceFinancing) {
      if (
        config.allowedLifeCycleToEditInvoiceFinancing.includes(
          this.state.rawData.lifecycle
        )
      ) {
        if (
          this.state.UserAuthority.includes("Invoice-Edit-InvoiceFinancing")
        ) {
          if (this.props.user.organisationUnit == "SELLER") {
            isAllowInvoiceFinancing = true;
          }
        }
      }
    }
    this.setState({
      isAllowInvoiceFinancing
    });
  };
  checkAccess = async () => {
    if (!this.props.permissions.includes("Invoice-Edit")) {
      const message = [
        "No permission to access.",
        "Cannot edit invoice. No permission to access this page."
      ];
      const response = handleError(
        message,
        this.handleDismissBtnModal,
        "BTN_BACK"
      );
      this.setState({
        ...response
      });
      return false;
    }
    if (!this.linearId) {
      const message = [
        "Invalid LinearId",
        "Cannot edit invoice. no linearId found in url."
      ];
      const response = handleError(
        message,
        this.handleDismissBtnModal,
        "BTN_BACK"
      );
      this.setState({
        ...response
      });
      return false;
    }
    return true;
  };
  handleExternalIdChange = async e => {
    try {
      let externalId = e.target.value;
      if (this.state.rawData.externalId == externalId) {
        this.setState({ isInvoiceDup: false });
        return;
      }
      let checkDuplicateInvoice = await this.apis.call(
        "checkDuplicateInvoiceNo",
        {},
        {
          data: {
            externalId,
            vendorTaxNumber: this.state.rawData.vendorTaxNumber
          }
        }
      );
      this.setState({ isInvoiceDup: !checkDuplicateInvoice });
      if (!this.state.isInvoiceDup) {
        this.setState({
          rawData: {
            ...this.state.rawData,
            externalId: externalId
          }
        });
      }
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };
  handleRemoveFile = (e, index, row, props) => {
    let tmp = props.attachments.splice(index, 1);
    this.setState({ ...this.state.attachmentList, [props.fileGroup]: tmp });
  };
  handleAddFile = e => {
    let group = e.target.id.replace("attach_", "").replace("_file", "");
    let files = e.target.files;
    if (this.isValidToUpload(files[0], group)) {
      let data = new FormData();
      data.append("file", files[0]);
      files[0].data = data;
      let newFile = {
        attachmentHash: "",
        attachmentName: files[0].name,
        attachmentType: group,
        attachmentFile: files[0],
        isNew: true
      };
      let newList = this.state.attachmentList[group];
      newList.push(newFile);
      this.setState({
        ...this.state.attachmentList,
        [group]: newList
      });
    }
  };
  summaryAmount = () => {
    let summary = 0;
    this.state.selectedItems.filter(r => {
      if (r.itemLists) {
        return r.itemLists.filter(rt => {
          if (rt.checked == true) {
            summary += rt.selectAmount;
          }
          return rt.checked == true;
        });
      } else {
        return 0;
      }
    });
    return summary;
  };
  validateChange = state => {
    for (let group in state.attachmentList) {
      let cfg = this.state.config.CONFIG_ATTACHMENT[group];
      if (!cfg) {
        return false;
      }
      if (state.attachmentList[group].length > cfg.maximum) {
        return false;
      }
      if (state.attachmentList[group].length < cfg.minimum) {
        return false;
      }
      if (cfg.required && state.attachmentList[group].length == 0) {
        return false;
      }
    }
    if (
      this.state.editFileOnly == false &&
      this.state.selectedItems.length > 0
    ) {
      let itemTest =
        this.state.selectedItems.filter(r => {
          if (r.itemLists) {
            return r.itemLists.filter(rt => {
              return rt.checked == true;
            }).length;
          }
        }).length == 0 ||
        this.state.selectedItems.filter(r => {
          if (r.itemLists) {
            return r.itemLists.filter(rt => {
              return (
                rt.checked == true &&
                (!rt.validateQtyPass || !rt.validateUnitPricePass)
              );
            }).length;
          }
        }).length > 0 ||
        this.summaryAmount() == 0 ||
        this.state.isMultipleGRExceeded == true;
      return !itemTest;
    }
    return true;
  };
  isValidToUpload = (file, group) => {
    if (file === undefined) {
      return false;
    }
    let cfg = this.state.config.CONFIG_ATTACHMENT[group];
    if (!cfg) {
      return false;
    }
    let formats = cfg.format.split(",");
    formats.forEach(format => format.trim().toUpperCase());
    let ext = file.name.substring(
      file.name.lastIndexOf(".") + 1,
      file.name.length
    );
    if (this.state.attachmentList[group].length >= cfg.maximum) {
      const message = ["Maximum file selected."];
      const response = handleError(
        message,
        this.handleDismissBtnModal,
        "BTN_CLOSE"
      );
      this.setState({
        ...response
      });
      console.log("Maximum file selected " + group);
      return false;
    }
    if (!formats.includes(ext.toUpperCase())) {
      const message = ["File type is not allow."];
      const response = handleError(
        message,
        this.handleDismissBtnModal,
        "BTN_CLOSE"
      );
      this.setState({
        ...response
      });
      console.log("File type is not allow " + group);
      return false;
    }
    if (file.size > 3 * 1024 * 1024) {
      const message = ["File size is larger than 3mb."];
      const response = handleError(
        message,
        this.handleDismissBtnModal,
        "BTN_CLOSE"
      );
      this.setState({
        ...response
      });
      console.log("File size is larger than 3mb. " + group);
      return false;
    }
    return true;
  };
  gotoDetail = () => {
    Router.push("/invoice-detail?linearId=" + this.state.rawData.linearId);
  };
  cancelEdit = () => {
    this.gotoDetail();
  };
  cancelPreview = () => {
    if (this.state.previewMode == true) {
      return this.setState({ previewMode: false });
    }
  };
  editFileInvoice = async () => {
    try {
      if (this.state.previewMode == false) {
        return this.setState({ previewMode: true });
      }
      this.setState({ blockPage: true });
      let fileAttachments = await this.uploadAttachment(
        this.state.attachmentList
      );
      let resubmitInvoiceObject = {
        linearId: this.state.rawData.linearId,
        lifecycle: this.state.rawData.lifecycle,
        buyer: this.state.rawData.buyer,
        seller: this.state.rawData.seller,
        companyTaxNumber: this.state.rawData.companyTaxNumber,
        fileAttachments: fileAttachments
      };
      let saveEdit = await this.apis.call("edit.attachments", [], {
        data: resubmitInvoiceObject
      });
      this.gotoDetail();
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({ ...response, blockPage: false });
    }
  };
  uploadAttachment = async attachmentList => {
    try {
      let obj = await Object.keys(attachmentList);
      let tmpData = [];
      let fileAttachments = [];
      // await obj.map(async grp => {
      //   let attach = attachmentList[grp];
      //   return await attach.map(async a => {
      //     a.attachmentType = grp;
      //     tmpData.push({
      //       ...a,
      //       attachmentType: grp
      //     });
      //   });
      // });
      for (let i = 0; i < obj.length; i++) {
        let attach = attachmentList[obj[i]];
        let cont = true;
        for (let j = 0; j < attach.length; j++) {
          let a = attach[j];
          if (a.isNew) {
            let resp = await this.doUploadFile(a.attachmentFile.data);
            if (!resp) {
              cont = false;
              this.setState({
                uploadFailed: true
              });
              break;
            }

            tmpData.push({
              ...attach[j],
              ...resp,
              attachmentType: obj[i]
            });
          } else {
            tmpData.push({
              ...attach[j],
              attachmentType: obj[i]
            });
          }
        }
        if (!cont) {
          break;
        }
      }
      return tmpData;
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({ ...response, blockPage: false });
    }
  };

  doUploadFile = async file => {
    try {
      const res = await this.upload.call("uploadFiles", [], {
        headers: {
          "Content-Type": "multipath/form-data"
        },
        data: file
      });
      return res;
    } catch (err) {
      const message = [
        "Unable to create an invoice because it failed to upload attachment(s).",
        <br />,
        "Please try again."
      ];
      const response = handleError(message, this.handleDismissBtnModal);
      this.setState({ ...response, blockPage: false });
      return false;
      //throw new Error(err.message);
    }
  };
  prepareGRItemsForUpdateInvoice = () => {
    console.log("prepareGRItemsForUpdateInvoice");
    let items = [];
    console.log("GR ITEM", this.state.listItems);
    this.state.listItems.map((item, index) => {
      if (item.checked == false) {
        return;
      } else if (item.checked == true) {
        let editItem = {
          invoiceLinearId: item.linearId,
          purchaseOrderExternalId: item.purchaseItem.purchaseOrderExternalId,
          purchaseItemExternalId: item.purchaseItem.purchaseItemExternalId,
          externalId: index + 1,
          materialDescription: item.materialDescription,
          quantity: {
            initial: item.selectQty,
            unit: item.quantity.unit
          },
          unitDescription: item.quantity.unit,
          currency: item.currency,
          unitPrice: item.unitPrice,
          itemSubTotal: item.selectAmount,
          vatCode: item.purchaseItem.taxCode,
          vatRate: item.purchaseItem.taxRate,
          purchaseItem: item.purchaseItem,
          goodsReceivedItems: item.goodReceivedItemslinearId,
          site: item.purchaseItem.site,
          siteDescription: item.purchaseItem.siteDescription,
          withholdingTaxRate: item.purchaseItem.withholdingTaxRate,
          withholdingTaxCode: item.purchaseItem.withholdingTaxCode
        };
        items.push(editItem);
      }
    });
    console.log("GR ITEM", items);
    return items;
  };

  preparePOItemsForUpdateInvoice = () => {
    let items = [];
    this.state.listItems.map((item, index) => {
      if (item.checked == false) {
        return;
      } else if (item.checked == true) {
        items.push({
          invoiceLinearId: item.invoiceLinearId,
          purchaseOrderExternalId: item.poNumber,
          purchaseOrderLinearId: item.purchaseOrderLinearId,
          purchaseItemExternalId: item.poItemNo,
          externalId: index + 1,
          materialDescription: item.materialDescription,
          quantity: {
            initial: item.selectQty,
            unit: item.quantity.unit
          },
          unitDescription: item.quantity.unit,
          currency: item.poItemUnitPriceCurrency,
          unitPrice: item.selectUnitPrice,
          itemSubTotal: item.selectAmount,
          vatCode: item.taxCode,
          vatRate: item.taxRate,
          purchaseItem: item.purchaseItem,
          site: item.site,
          siteDescription: item.siteDescription,
          withholdingTaxRate:
            item.withholdingTaxPercent || item.withholdingTaxRate,
          withholdingTaxCode: item.withholdingTaxCode
        });
      }
    });
    return items;
  };

  editInvoice = async () => {
    this.setState({
      uploadFailed: false
    });
    if (
      this.state.config.INVOICE_CREATED_BY_DOCUMENT.value == "PURCHASE_ORDER"
    ) {
      GA.event({
        category: "Invoice",
        action: "Edit inv Ref.PO (Request)",
        label: `Invoice | ${
          this.state.rawData.externalId
        } | ${moment().format()}`
        // value: resubmitInvoiceObject.invoiceTotal
      });

      try {
        if (this.state.previewMode == false) {
          return this.setState({ previewMode: true });
        }
        this.setState({ blockPage: true });
        let fileAttachments = await this.uploadAttachment(
          this.state.attachmentList
        );
        // return false;
        if (this.state.uploadFailed) {
          this.setState({
            uploadFailed: false
          });
          return false;
        }
        let resubmitInvoiceObject = {
          accounting: this.state.rawData.accounting,
          buyer: this.state.rawData.buyer,
          companyBranchCode: this.state.rawData.companyBranchCode,
          companyBranchName: this.state.rawData.companyBranchName,
          companyCode: this.state.rawData.companyCode,
          companyName: this.state.rawData.companyName,
          currency: this.state.rawData.currency,
          customisedFields: this.state.rawData.customisedFields,
          customisedFieldsUpdatedDate: this.state.rawData
            .customisedFieldsUpdatedDate,
          documentEntryDate: moment().format("DD/MM/YYYY"),
          lifecycle: this.state.rawData.lifecycle,
          linearId: this.state.rawData.linearId,
          purchaseOrderNumber: this.state.rawData.items[0]
            .purchaseOrderExternalId,
          paymentTermCode: this.state.rawData.paymentTermCode,
          paymentTermDays: this.state.rawData.paymentTermDays,
          paymentTermDescription: this.state.rawData.paymentTermDesc,
          items: this.preparePOItemsForUpdateInvoice(),
          seller: this.state.rawData.seller,
          status: this.state.rawData.status,
          vendorAddress1: this.state.rawData.vendorAddress,
          vendorBranchCode: this.state.rawData.vendorBranchCode,
          vendorBranchName: this.state.rawData.vendorBranchName,
          // vendorCity: this.state.innerPurchaseItem.vendorCity,
          // vendorDistrict: this.state.innerPurchaseItem.vendorDistrict,
          // vendorEmail: this.state.innerPurchaseItem.vendorEmail,
          vendorName: this.state.rawData.vendorName,
          vendorNumber: this.state.rawData.vendorNumber,
          //vendorPostalCode: this.state.innerPurchaseItem.vendorPostalCode,
          vendorTaxNumber: this.state.rawData.vendorTaxNumber,
          // vendorTelephone: this.state.innerPurchaseItem.vendorTelephone,
          fileAttachments: fileAttachments,
          ////
          bank: this.state.rawData.bank,
          baselineDate: moment().format("DD/MM/YYYY"),
          companyTaxNumber: this.state.rawData.companyTaxNumber,
          companyAddress: this.state.rawData.companyAddress,
          dueDate: this.state.rawData.dueDate,
          dueDateIsLocked: this.state.rawData.dueDateIsLocked,
          externalId: this.state.rawData.externalId,
          goodsReceived: this.state.rawData.goodsReceived,
          initialDueDate: this.state.rawData.initialDueDate,
          invoiceCreatedDate: this.state.rawData.invoiceCreatedDate,
          invoiceDate: this.state.rawData.invoiceDate,
          invoiceFinancing: this.state.rawData.invoiceFinancing,
          invoiceTotal: this.state.rawData.invoiceTotal,
          isETaxInvoice: this.state.rawData.isETaxInvoice,
          matchingStatus: this.state.rawData.matchingStatus,
          paymentFee: this.state.rawData.paymentFee,
          paymentTermDesc: this.state.rawData.paymentTermDesc,
          purchaseOrder: this.state.rawData.purchaseOrder,
          purchaseOrderHeaderNumber: this.state.rawData
            .purchaseOrderHeaderNumber,
          receiptNumber: this.state.rawData.receiptNumber,
          restrictedMap: this.state.rawData.restrictedMap,
          resubmitCount: this.state.rawData.resubmitCount,
          subTotal: this.state.rawData.subTotal,
          totalPayable: this.state.rawData.totalPayable,
          vatTotal: this.state.rawData.vatTotal,
          vendorAddress: this.state.rawData.vendorAddress,
          disclosedMap: this.state.rawData.disclosedMap
        };

        if (this.props.appenv.INV_EDIT_SUBMIT_SYNC === undefined) {
          let saveEdit = await this.apis.call("edit.saveedit", [], {
            data: resubmitInvoiceObject
          });

          GA.event({
            category: "Invoice",
            action: "Edit inv Ref.PO (Success)",
            label: `Invoice | ${
              resubmitInvoiceObject.externalId
            } | ${moment().format()}`,
            value: resubmitInvoiceObject.invoiceTotal
          });

          this.gotoDetail();
        } else {
          if (this.props.appenv.INV_EDIT_SUBMIT_SYNC == false) {
            const aToken = this.props.token;
            this.socket.emit("edit-invoice-po", resubmitInvoiceObject, aToken);

            this.gotoDetail();
          } else {
            let saveEdit = await this.apis.call("edit.saveedit", [], {
              data: resubmitInvoiceObject
            });

            GA.event({
              category: "Invoice",
              action: "Edit inv Ref.PO (Success)",
              label: `Invoice | ${
                resubmitInvoiceObject.externalId
              } | ${moment().format()}`,
              value: resubmitInvoiceObject.invoiceTotal
            });

            this.gotoDetail();
          }
        }
      } catch (err) {
        GA.event({
          category: "Invoice",
          action: "Edit inv Ref.PO (Failed)",
          label: `Invoice | ${
            this.state.rawData.externalId
          } | ${moment().format()}`
        });

        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({ ...response, blockPage: false });
      }
    } else {
      GA.event({
        category: "Invoice",
        action: "Edit inv Ref.GR (Request)",
        label: `Invoice | ${
          this.state.rawData.externalId
        } | ${moment().format()}`
        // value: resubmitInvoiceObject.invoiceTotal
      });

      try {
        if (this.state.previewMode == false) {
          return this.setState({ previewMode: true });
        }
        this.setState({ blockPage: true });
        let fileAttachments = await this.uploadAttachment(
          this.state.attachmentList
        );
        if (this.state.uploadFailed) {
          this.setState({
            uploadFailed: false
          });
          return false;
        }
        //return false;
        let resubmitInvoiceObject = {
          accounting: this.state.rawData.accounting,
          buyer: this.state.rawData.buyer,
          companyBranchCode: this.state.rawData.companyBranchCode,
          companyBranchName: this.state.rawData.companyBranchName,
          companyCode: this.state.rawData.companyCode,
          companyName: this.state.rawData.companyName,
          currency: this.state.rawData.currency,
          customisedFields: this.state.rawData.customisedFields,
          customisedFieldsUpdatedDate: this.state.rawData
            .customisedFieldsUpdatedDate,
          documentEntryDate: moment().format("DD/MM/YYYY"),
          lifecycle: this.state.rawData.lifecycle,
          linearId: this.state.rawData.linearId,
          purchaseOrderNumber: this.state.rawData.items[0]
            .purchaseOrderExternalId,
          paymentTermCode: this.state.rawData.paymentTermCode,
          paymentTermDays: this.state.rawData.paymentTermDays,
          paymentTermDescription: this.state.rawData.paymentTermDesc,
          items: this.prepareGRItemsForUpdateInvoice(),
          seller: this.state.rawData.seller,
          status: this.state.rawData.status,
          vendorAddress1: this.state.rawData.vendorAddress,
          vendorBranchCode: this.state.rawData.vendorBranchCode,
          vendorBranchName: this.state.rawData.vendorBranchName,
          vendorName: this.state.rawData.vendorName,
          vendorNumber: this.state.rawData.vendorNumber,
          vendorTaxNumber: this.state.rawData.vendorTaxNumber,
          fileAttachments: fileAttachments,
          ////
          bank: this.state.rawData.bank,
          baselineDate: moment().format("DD/MM/YYYY"),
          companyTaxNumber: this.state.rawData.companyTaxNumber,
          companyAddress: this.state.rawData.companyAddress,
          dueDate: this.state.rawData.dueDate,
          dueDateIsLocked: this.state.rawData.dueDateIsLocked,
          externalId: this.state.rawData.externalId,
          goodsReceived: this.state.rawData.goodsReceived,
          initialDueDate: this.state.rawData.initialDueDate,
          invoiceCreatedDate: this.state.rawData.invoiceCreatedDate,
          invoiceDate: this.state.rawData.invoiceDate,
          invoiceFinancing: this.state.rawData.invoiceFinancing,
          invoiceTotal: this.state.rawData.invoiceTotal,
          isETaxInvoice: this.state.rawData.isETaxInvoice,
          matchingStatus: this.state.rawData.matchingStatus,
          paymentFee: this.state.rawData.paymentFee,
          paymentTermDesc: this.state.rawData.paymentTermDesc,
          purchaseOrder: this.state.rawData.purchaseOrder,
          purchaseOrderHeaderNumber: this.state.rawData
            .purchaseOrderHeaderNumber,
          receiptNumber: this.state.rawData.receiptNumber,
          restrictedMap: this.state.rawData.restrictedMap,
          resubmitCount: this.state.rawData.resubmitCount,
          subTotal: this.state.rawData.subTotal,
          totalPayable: this.state.rawData.totalPayable,
          vatTotal: this.state.rawData.vatTotal,
          vendorAddress: this.state.rawData.vendorAddress,
          disclosedMap: this.state.rawData.disclosedMap
        };

        if (this.props.appenv.INV_EDIT_SUBMIT_SYNC === undefined) {
          let saveEdit = await this.apis.call("edit.saveedit", [], {
            data: resubmitInvoiceObject
          });

          GA.event({
            category: "Invoice",
            action: "Edit inv Ref.GR (Success)",
            label: `Invoice | ${
              this.state.rawData.externalId
            } | ${moment().format()}`,
            value: resubmitInvoiceObject.invoiceTotal
          });

          this.gotoDetail();
        } else {
          if (this.props.appenv.INV_EDIT_SUBMIT_SYNC == false) {
            const aToken = this.props.token;
            this.socket.emit("edit-invoice-gr", resubmitInvoiceObject, aToken);

            this.gotoDetail();
          } else {
            let saveEdit = await this.apis.call("edit.saveedit", [], {
              data: resubmitInvoiceObject
            });

            GA.event({
              category: "Invoice",
              action: "Edit inv Ref.GR (Success)",
              label: `Invoice | ${
                this.state.rawData.externalId
              } | ${moment().format()}`,
              value: resubmitInvoiceObject.invoiceTotal
            });

            this.gotoDetail();
          }
        }
      } catch (err) {
        GA.event({
          category: "Invoice",
          action: "Edit inv Ref.GR (Failed)",
          label: `Invoice | ${
            this.state.rawData.externalId
          } | ${moment().format()}`
        });

        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({ ...response, blockPage: false });
      }
    }
  };
  resubmitInvoice = async () => {
    this.setState({
      uploadFailed: false
    });
    if (
      this.state.config.INVOICE_CREATED_BY_DOCUMENT.value == "PURCHASE_ORDER"
    ) {
      GA.event({
        category: "Invoice",
        action: "Resubmit inv Ref.PO (Request)",
        label: `Invoice | ${
          this.state.rawData.externalId
        } | ${moment().format()}`
        // value: resubmitInvoiceObject.invoiceTotal
      });

      try {
        if (this.state.previewMode == false) {
          return this.setState({ previewMode: true });
        }
        this.setState({ blockPage: true });
        let fileAttachments = await this.uploadAttachment(
          this.state.attachmentList
        );
        if (this.state.uploadFailed) {
          this.setState({
            uploadFailed: false
          });
          return false;
        }
        let resubmitInvoiceObject = {
          accounting: this.state.rawData.accounting,
          buyer: this.state.rawData.buyer,
          companyBranchCode: this.state.rawData.companyBranchCode,
          companyBranchName: this.state.rawData.companyBranchName,
          companyCode: this.state.rawData.companyCode,
          companyName: this.state.rawData.companyName,
          currency: this.state.rawData.currency,
          customisedFields: this.state.rawData.customisedFields,
          customisedFieldsUpdatedDate: this.state.rawData
            .customisedFieldsUpdatedDate,
          documentEntryDate: moment().format("DD/MM/YYYY"),
          lifecycle: this.state.rawData.lifecycle,
          linearId: this.state.rawData.linearId,
          purchaseOrderNumber: this.state.rawData.items[0]
            .purchaseOrderExternalId,
          paymentTermCode: this.state.rawData.paymentTermCode,
          paymentTermDays: this.state.rawData.paymentTermDays,
          paymentTermDescription: this.state.rawData.paymentTermDesc,
          items: this.preparePOItemsForUpdateInvoice(),
          seller: this.state.rawData.seller,
          status: this.state.rawData.status,
          vendorAddress1: this.state.rawData.vendorAddress,
          vendorBranchCode: this.state.rawData.vendorBranchCode,
          vendorBranchName: this.state.rawData.vendorBranchName,
          // vendorCity: this.state.innerPurchaseItem.vendorCity,
          // vendorDistrict: this.state.innerPurchaseItem.vendorDistrict,
          // vendorEmail: this.state.innerPurchaseItem.vendorEmail,
          vendorName: this.state.rawData.vendorName,
          vendorNumber: this.state.rawData.vendorNumber,
          //vendorPostalCode: this.state.innerPurchaseItem.vendorPostalCode,
          vendorTaxNumber: this.state.rawData.vendorTaxNumber,
          // vendorTelephone: this.state.innerPurchaseItem.vendorTelephone,
          fileAttachments: fileAttachments,
          ////
          bank: this.state.rawData.bank,
          baselineDate: moment().format("DD/MM/YYYY"),
          companyTaxNumber: this.state.rawData.companyTaxNumber,
          companyAddress: this.state.rawData.companyAddress,
          dueDate: this.state.rawData.dueDate,
          dueDateIsLocked: this.state.rawData.dueDateIsLocked,
          externalId: this.state.rawData.externalId,
          goodsReceived: this.state.rawData.goodsReceived,
          initialDueDate: this.state.rawData.initialDueDate,
          invoiceCreatedDate: this.state.rawData.invoiceCreatedDate,
          invoiceDate: this.state.rawData.invoiceDate,
          invoiceFinancing: this.state.rawData.invoiceFinancing,
          invoiceTotal: this.state.rawData.invoiceTotal,
          isETaxInvoice: this.state.rawData.isETaxInvoice,
          matchingStatus: this.state.rawData.matchingStatus,
          paymentFee: this.state.rawData.paymentFee,
          paymentTermDesc: this.state.rawData.paymentTermDesc,
          purchaseOrder: this.state.rawData.purchaseOrder,
          purchaseOrderHeaderNumber: this.state.rawData
            .purchaseOrderHeaderNumber,
          receiptNumber: this.state.rawData.receiptNumber,
          restrictedMap: this.state.rawData.restrictedMap,
          resubmitCount: this.state.rawData.resubmitCount,
          subTotal: this.state.rawData.subTotal,
          totalPayable: this.state.rawData.totalPayable,
          vatTotal: this.state.rawData.vatTotal,
          vendorAddress: this.state.rawData.vendorAddress,
          disclosedMap: this.state.rawData.disclosedMap
        };

        if (this.props.appenv.INV_EDIT_SUBMIT_SYNC === undefined) {
          let saveEdit = await this.apis.call("edit.saveresubmit", [], {
            data: resubmitInvoiceObject
          });

          GA.event({
            category: "Invoice",
            action: "Resubmit inv Ref.PO (Success)",
            label: `Invoice | ${
              this.state.rawData.externalId
            } | ${moment().format()}`,
            value: resubmitInvoiceObject.invoiceTotal
          });

          this.gotoDetail();
        } else {
          if (this.props.appenv.INV_EDIT_SUBMIT_SYNC == false) {
            const aToken = this.props.token;
            this.socket.emit(
              "resubmit-invoice-po",
              resubmitInvoiceObject,
              aToken
            );

            this.gotoDetail();
          } else {
            let saveEdit = await this.apis.call("edit.saveresubmit", [], {
              data: resubmitInvoiceObject
            });

            GA.event({
              category: "Invoice",
              action: "Resubmit inv Ref.PO (Success)",
              label: `Invoice | ${
                this.state.rawData.externalId
              } | ${moment().format()}`,
              value: resubmitInvoiceObject.invoiceTotal
            });

            this.gotoDetail();
          }
        }
      } catch (err) {
        GA.event({
          category: "Invoice",
          action: "Resubmit inv Ref.PO (Failed)",
          label: `Invoice | ${
            this.state.rawData.externalId
          } | ${moment().format()}`
        });

        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({ ...response, blockPage: false });
      }
    } else {
      GA.event({
        category: "Invoice",
        action: "Resubmit inv Ref.GR (Request)",
        label: `Invoice | ${
          this.state.rawData.externalId
        } | ${moment().format()}`
        // value: resubmitInvoiceObject.invoiceTotal
      });
      try {
        if (this.state.previewMode == false) {
          return this.setState({ previewMode: true });
        }
        this.setState({ blockPage: true });
        let fileAttachments = await this.uploadAttachment(
          this.state.attachmentList
        );
        if (this.state.uploadFailed) {
          this.setState({
            uploadFailed: false
          });
          return false;
        }
        let resubmitInvoiceObject = {
          accounting: this.state.rawData.accounting,
          buyer: this.state.rawData.buyer,
          companyBranchCode: this.state.rawData.companyBranchCode,
          companyBranchName: this.state.rawData.companyBranchName,
          companyCode: this.state.rawData.companyCode,
          companyName: this.state.rawData.companyName,
          currency: this.state.rawData.currency,
          customisedFields: this.state.rawData.customisedFields,
          customisedFieldsUpdatedDate: this.state.rawData
            .customisedFieldsUpdatedDate,
          documentEntryDate: moment().format("DD/MM/YYYY"),
          lifecycle: this.state.rawData.lifecycle,
          linearId: this.state.rawData.linearId,
          purchaseOrderNumber: this.state.rawData.items[0]
            .purchaseOrderExternalId,
          paymentTermCode: this.state.rawData.paymentTermCode,
          paymentTermDays: this.state.rawData.paymentTermDays,
          paymentTermDescription: this.state.rawData.paymentTermDesc,
          items: this.prepareGRItemsForUpdateInvoice(),
          seller: this.state.rawData.seller,
          status: this.state.rawData.status,
          vendorAddress1: this.state.rawData.vendorAddress,
          vendorBranchCode: this.state.rawData.vendorBranchCode,
          vendorBranchName: this.state.rawData.vendorBranchName,
          // vendorCity: this.state.innerPurchaseItem.vendorCity,
          // vendorDistrict: this.state.innerPurchaseItem.vendorDistrict,
          // vendorEmail: this.state.innerPurchaseItem.vendorEmail,
          vendorName: this.state.rawData.vendorName,
          vendorNumber: this.state.rawData.vendorNumber,
          //vendorPostalCode: this.state.innerPurchaseItem.vendorPostalCode,
          vendorTaxNumber: this.state.rawData.vendorTaxNumber,
          // vendorTelephone: this.state.innerPurchaseItem.vendorTelephone,
          fileAttachments: fileAttachments,
          ////
          bank: this.state.rawData.bank,
          baselineDate: moment().format("DD/MM/YYYY"),
          companyTaxNumber: this.state.rawData.companyTaxNumber,
          companyAddress: this.state.rawData.companyAddress,
          dueDate: this.state.rawData.dueDate,
          dueDateIsLocked: this.state.rawData.dueDateIsLocked,
          externalId: this.state.rawData.externalId,
          goodsReceived: this.state.rawData.goodsReceived,
          initialDueDate: this.state.rawData.initialDueDate,
          invoiceCreatedDate: this.state.rawData.invoiceCreatedDate,
          invoiceDate: this.state.rawData.invoiceDate,
          invoiceFinancing: this.state.rawData.invoiceFinancing,
          invoiceTotal: this.state.rawData.invoiceTotal,
          isETaxInvoice: this.state.rawData.isETaxInvoice,
          matchingStatus: this.state.rawData.matchingStatus,
          paymentFee: this.state.rawData.paymentFee,
          paymentTermDesc: this.state.rawData.paymentTermDesc,
          purchaseOrder: this.state.rawData.purchaseOrder,
          purchaseOrderHeaderNumber: this.state.rawData
            .purchaseOrderHeaderNumber,
          receiptNumber: this.state.rawData.receiptNumber,
          restrictedMap: this.state.rawData.restrictedMap,
          resubmitCount: this.state.rawData.resubmitCount,
          subTotal: this.state.rawData.subTotal,
          totalPayable: this.state.rawData.totalPayable,
          vatTotal: this.state.rawData.vatTotal,
          vendorAddress: this.state.rawData.vendorAddress,
          disclosedMap: this.state.rawData.disclosedMap
        };
        if (this.props.appenv.INV_EDIT_SUBMIT_SYNC === undefined) {
          let saveEdit = await this.apis.call("edit.saveresubmit", [], {
            data: resubmitInvoiceObject
          });

          GA.event({
            category: "Invoice",
            action: "Resubmit inv Ref.GR (Success)",
            label: `Invoice | ${
              this.state.rawData.externalId
            } | ${moment().format()}`,
            value: resubmitInvoiceObject.invoiceTotal
          });

          this.gotoDetail();
        } else {
          if (this.props.appenv.INV_EDIT_SUBMIT_SYNC == false) {
            const aToken = this.props.token;
            this.socket.emit(
              "resubmit-invoice-gr",
              resubmitInvoiceObject,
              aToken
            );

            this.gotoDetail();
          } else {
            let saveEdit = await this.apis.call("edit.saveresubmit", [], {
              data: resubmitInvoiceObject
            });

            GA.event({
              category: "Invoice",
              action: "Resubmit inv Ref.GR (Success)",
              label: `Invoice | ${
                this.state.rawData.externalId
              } | ${moment().format()}`,
              value: resubmitInvoiceObject.invoiceTotal
            });

            this.gotoDetail();
          }
        }
      } catch (err) {
        GA.event({
          category: "Invoice",
          action: "Resubmit inv Ref.GR (Failed)",
          label: `Invoice | ${
            this.state.rawData.externalId
          } | ${moment().format()}`
        });

        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({ ...response, blockPage: false });
      }
    }
  };
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
    if (e.target.value == "" || Number.isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      this.state.rawData.subTotal = formatNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      this.state.rawData.subTotal = parseFloat(
        e.target.value.replace(/,/g, "")
      );
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }
    this.changeFlagIsChangeSubTotalTaxTotal();
    this.calInvoiceTotal();
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
    if (e.target.value == "" || Number.isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      this.state.rawData.vatTotal = formatNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      this.state.rawData.vatTotal = parseFloat(
        e.target.value.replace(/,/g, "")
      );
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }

    this.changeFlagIsChangeSubTotalTaxTotal();
    this.calInvoiceTotal();
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
  calInvoiceTotal = () => {
    let invoiceTotal =
      Number(this.state.rawData.vatTotal) + Number(this.state.rawData.subTotal);
    this.setState({
      rawData: { ...this.state.rawData, invoiceTotal }
    });
  };
  changeFlagIsChangeSubTotalTaxTotal = () => {
    this.setState({
      flag: { ...this.state.flag, isChangeSubTotalTaxTotal: true }
    });
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
  getMasterVendorBranchList = async (seller, vendorTaxNumber, payload) => {
    return await this.apis.call("getVendorBranchList", payload);
  };
  componentDidUpdate() {
    const { t } = this.props;
    const columnDisplayText = t("Column Display");
    const exportText = t("Export");
    $(document).ready(() => {
      makePopover(columnDisplayText, exportText);
    });
    if (findDOMNode(this.refs["subTotal"])) {
      findDOMNode(this.refs["subTotal"]).value = formatNumber(
        this.state.rawData.subTotal,
        2
      );
    }

    if (findDOMNode(this.refs["vatTotal"])) {
      findDOMNode(this.refs["vatTotal"]).value = formatNumber(
        this.state.rawData.vatTotal,
        2
      );
    }
  }

  openTour = () => {
    this.setState({ isTourOpen: true });
  };

  closeTour = () => {
    this.setState({ isTourOpen: false });
    this.enableBody($(".reactour__helper--is-open")[0]);
  };

  disableBody = target => disableBodyScroll(target);
  enableBody = target => enableBodyScroll(target);

  renderTour() {
    return (
      <Tour
        steps={steps}
        closeWithMask={false}
        disableKeyboardNavigation={!followMeConfig.devVersion}
        disableInteraction={false}
        showNavigation={false}
        isOpen={this.state.isTourOpen}
        rounded={5}
        accentColor={accentColor}
        onRequestClose={this.closeTour}
        onAfterOpen={this.disableBody}
        onBeforeClose={this.enableBody}
        prevButton={<div hidden={true} />}
        nextButton={<button className="btn btn-wide">Next</button>}
        lastStepNextButton={<button className="btn btn-wide">Done</button>}
      />
    );
  }

  handleDismissBtnModal = () => {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  };

  render() {
    const { t } = this.props;
    const submitDisableStyle = {
      "background-color": "#6c757d"
      //border: "1px solid #343a40"
    };
    const submitEnableStyle = {
      "background-color": "#AF3694"
      //border: "1px solid #AF3694"
    };
    const invoiceFoundStyle = { width: "auto", color: "#AF3694" };
    const invoiceNotFoundStyle = { width: "auto" };
    const {
      rawData,
      config,
      vendorBranchList,
      flag,
      attachmentList,
      retentionAmount,
      estimatedPayable,
      withholdingTaxTotal,
      alertModalAlertTitle,
      isAlertModalVisible,
      buttonAlert,
      isTextOnly,
      alertModalMsg
    } = this.state;
    return (
      <Layout hideNavBar={true} ref={this.layout} {...this.props}>
        {this.renderTour()}
        <Head>
          <title>{`Edit Invoice No. ${rawData.externalId}`}</title>
        </Head>
        <BlockUi tag="div" blocking={this.state.blockPage}>
          <div className="page__header d-flex flex-wrap px-3">
            <h2 className="col-6 offset-3 text-center">{t("Edit Mode")}</h2>
            <UserPanel {...this.props} />
          </div>
          <div id="invoice_detail_edit_page" className="row">
            <div className="form col-12">
              <div className="col-12 mb-3">
                <div className="form-group form-inline ">
                  <div className="invNoEdit">
                    <label className="control-label h3 font-bold d-inline-block">
                      {t("Invoice No")}:{" "}
                      {this.state.editFileOnly && this.state.rawData.externalId}
                    </label>
                    {this.state.previewMode ? (
                      <label className="control-label h3 font-bold d-inline-block">
                        {rawData.externalId}
                      </label>
                    ) : (
                      <input
                        hidden={this.state.editFileOnly}
                        type="text"
                        maxLength="30"
                        style={
                          this.state.isInvoiceDup === true
                            ? invoiceNotFoundStyle
                            : invoiceFoundStyle
                        }
                        name="externalId"
                        onChange={event => this.handleExternalIdChange(event)}
                        defaultValue={rawData.externalId}
                        className="form-control"
                      />
                    )}
                    <label
                      style={{ color: "red", marginLeft: "10px" }}
                      hidden={!this.state.isInvoiceDup}
                    >
                      Invoice No. is duplicated. Please enter another number.
                    </label>
                  </div>
                </div>
              </div>
              <section className="box box--width-header col-12">
                <div className="box__header">
                  <div className="row justify-content-between align-items-center">
                    <div className="col">
                      {t("Entry Date")} :
                      <strong>
                        {moment(rawData.invoiceCreatedDate).format(
                          "DD/MM/YYYY"
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="box__inner">
                  <VendorCompany
                    settings={config}
                    data={rawData}
                    t={t}
                    vendorBranchList={vendorBranchList}
                    isNotGetVendorBranchList={flag.isNotGetVendorBranchList}
                    onChangeVendorBranch={this.onChangeVendorBranch}
                    previewMode={
                      this.state.previewMode || this.state.editFileOnly
                    }
                  />

                  <CollapseNoExpand
                    id="paymentInfo"
                    expanded="true"
                    collapseHeader={[t("Payment Information")]}
                    className="paymentInfo"
                  >
                    <div className="row">
                      <div className="col-6">
                        {this.state.previewMode ? (
                          <div className="row">
                            <p className="col-5 text-right px-0">
                              {t("Invoice Date")} :
                            </p>
                            <p className="col-7 text-left">
                              {rawData.invoiceDate
                                ? moment(rawData.invoiceDate).format(
                                    "DD/MM/YYYY"
                                  )
                                : ""}
                            </p>
                          </div>
                        ) : (
                          <CollapseItem colLabel={5} label={t("Invoice Date")}>
                            {this.state.editFileOnly ? (
                              <React.Fragment>
                                {moment(rawData.invoiceDate).format(
                                  "DD/MM/YYYY"
                                )}
                              </React.Fragment>
                            ) : (
                              <p className="form-group">
                                <i className="fa fa-calendar-o purple" />
                                <input
                                  type="text"
                                  value={
                                    rawData.invoiceDate
                                      ? moment(rawData.invoiceDate).format(
                                          "DD/MM/YYYY"
                                        )
                                      : ""
                                  }
                                  name="invoiceDate"
                                  id="invoice_date"
                                  className="datepicker form-control"
                                />
                              </p>
                            )}
                          </CollapseItem>
                        )}

                        <CollapseItemText
                          t={t}
                          colLabel={5}
                          label={t("Payment Term Description")}
                          value={rawData.paymentTermDesc}
                        />

                        {this.state.previewMode ? (
                          <div className="row">
                            <p className="col-5 text-right px-0">
                              {t("Invoice Financing")} :
                            </p>
                            <p className="col-7 text-left">
                              {rawData.invoiceFinancing == "Y"
                                ? t("YES")
                                : t("No")}
                            </p>
                          </div>
                        ) : (
                          <CollapseItemCheckbox
                            colLabel={5}
                            label={t("Invoice Financing")}
                            value={rawData.invoiceFinancing == "Y" ? "Y" : "N"}
                            onChange={e => {
                              this.setState({
                                rawData: {
                                  ...this.state.rawData,
                                  invoiceFinancing: e.target.value
                                }
                              });
                            }}
                            canEdit={
                              !this.state.editFileOnly &&
                              this.state.config.INVOICE_CONFIG
                                .invoiceFinancingIsAllowed &&
                              this.state.isAllowInvoiceFinancing
                            }
                            items={[
                              { label: t("Yes"), value: "Y" },
                              { label: t("No"), value: "N" }
                            ]}
                          />
                        )}
                      </div>
                      <div className="col-6">
                        <div className="row">
                          <p className="col-6 text-right px-0">
                            {t("Sub Total")} :
                          </p>
                          <p className="col-4 text-right">
                            {this.state.previewMode ||
                            this.state.editFileOnly ? (
                              <span>{formatNumber(rawData.subTotal, 2)}</span>
                            ) : rawData.subTotal ? (
                              <input
                                className="form-control"
                                data-tip="custom show"
                                data-event="focus"
                                data-event-off="blur"
                                data-for="priceSelect"
                                key={`subTotal`}
                                id={`subTotal`}
                                ref={`subTotal`}
                                // data-row={JSON.stringify(row)}
                                type="text"
                                name="subTotal[]"
                                pattern="[0-9]*"
                                defaultValue={formatNumber(rawData.subTotal, 2)}
                                // value={formatNumber(row.subTotal || 0, 2)}
                                placeholder={formatNumber(rawData.subTotal, 2)}
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
                              <input
                                className="form-control"
                                data-tip="custom show"
                                data-event="focus"
                                data-event-off="blur"
                                data-for="priceSelect"
                                key={`subTotal`}
                                id={`subTotal`}
                                ref={`subTotal`}
                                // data-row={JSON.stringify(row)}
                                type="text"
                                name="subTotal[]"
                                pattern="[0-9]*"
                                defaultValue={formatNumber(0, 2)}
                                // value={formatNumber(row.subTotal || 0, 2)}
                                placeholder={formatNumber(0, 2)}
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
                            )}

                            {/* <span>{rawData.currency}</span> */}
                          </p>
                          <p className="col-2">{rawData.currency}</p>
                        </div>
                        <div className="row">
                          <p className="col-6 text-right px-0">
                            {t("Tax Total")} :
                          </p>
                          <p className="col-4 text-right">
                            {this.state.previewMode ||
                            this.state.editFileOnly ? (
                              <span>{formatNumber(rawData.vatTotal, 2)}</span>
                            ) : rawData.vatTotal ? (
                              <input
                                className="form-control"
                                data-tip="custom show"
                                data-event="focus"
                                data-event-off="blur"
                                data-for="priceSelect"
                                key={`vatTotal`}
                                id={`vatTotal`}
                                ref={`vatTotal`}
                                // data-row={JSON.stringify(row)}
                                type="text"
                                name="vatTotal[]"
                                pattern="[0-9]*"
                                defaultValue={formatNumber(rawData.vatTotal, 2)}
                                // value={formatNumber(row.vatTotal || 0, 2)}
                                placeholder={formatNumber(rawData.vatTotal, 2)}
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
                              <input
                                className="form-control"
                                data-tip="custom show"
                                data-event="focus"
                                data-event-off="blur"
                                data-for="priceSelect"
                                key={`vatTotal`}
                                id={`vatTotal`}
                                ref={`vatTotal`}
                                // data-row={JSON.stringify(row)}
                                type="text"
                                name="vatTotal[]"
                                pattern="[0-9]*"
                                defaultValue={formatNumber(0, 2)}
                                // value={formatNumber(row.vatTotal || 0, 2)}
                                placeholder={formatNumber(0, 2)}
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
                            )}
                          </p>
                          <p className="col-2">{rawData.currency}</p>
                        </div>
                        <div className="row">
                          <p className="col-6 text-right px-0">
                            {t("Invoice Amount")} :
                          </p>
                          <p className="col-4 text-right">
                            {formatNumber(rawData.invoiceTotal, 2)}
                          </p>
                          <p className="col-2">{rawData.currency}</p>
                        </div>
                        {this.state.previewMode ? (
                          <div>
                            <div className="row">
                              <p className="col-6 text-right px-0">
                                {t("WHT Pre-calculated Amount")} :
                              </p>
                              <p className="col-4 text-right">
                                {formatNumber(withholdingTaxTotal, 2)}
                              </p>
                              <p className="col-2">{rawData.currency}</p>
                            </div>
                            <div className="row">
                              <p className="col-6 text-right px-0">
                                {t("Retention Amount")} :
                              </p>
                              <p className="col-4 text-right">
                                {formatNumber(retentionAmount, 2)}
                              </p>
                              <p className="col-2">
                                {rawData.currency}
                                <a
                                  href="javascript:void(0);"
                                  class="ml-10"
                                  data-placement="bottom"
                                  data-content={t(
                                    "This is an estimated amount and may be subjected to change as per agreement upon buyer and seller"
                                  )}
                                  data-toggle="popover"
                                >
                                  <i
                                    className="fa fa-info-circle"
                                    style={{
                                      WebkitTextStroke: "0px",
                                      fontSize: "20px"
                                    }}
                                  />
                                </a>
                              </p>
                            </div>
                            <div className="row">
                              <p className="col-6 text-right px-0">
                                {t("Estimated Invoice Payable Amount")} :
                              </p>
                              <p className="col-4 text-right">
                                {formatNumber(estimatedPayable, 2)}
                              </p>
                              <p className="col-2">{rawData.currency}</p>
                            </div>
                            <CollapseItemText
                              t={t}
                              colLabel={6}
                              label={t("Expected Due Date")}
                              value={
                                rawData.dueDate
                                  ? moment(rawData.dueDate).format("DD/MM/YYYY")
                                  : "-"
                              }
                            />
                          </div>
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  </CollapseNoExpand>
                  <CollapseNoExpand
                    id="attachmentsList"
                    expanded="true"
                    collapseHeader={[t("Attachments")]}
                    className="attachmentsList"
                  >
                    <div className="row">
                      <div className="col-6 nopadding">
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_TaxInvoice"
                          label={t("Attach Tax Invoice")}
                          attachments={attachmentList.TaxInvoice}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="TaxInvoice"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.TaxInvoice || {}
                          }
                          t={t}
                        />
                        <CollapseItemText
                          t={t}
                          colLabel={4}
                          label={t("Receipt No")}
                          value={rawData.receiptNumber}
                        />
                      </div>
                      <div className="col-6 nopadding">
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_DeliveryNote"
                          label={t("Attach Delivery Note")}
                          attachments={attachmentList.DeliveryNote}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="DeliveryNote"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.DeliveryNote ||
                            {}
                          }
                          t={t}
                        />
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_Receipt"
                          label={t("Attach Receipt")}
                          attachments={attachmentList.Receipt}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="Receipt"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.Receipt || {}
                          }
                          t={t}
                        />
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_Others"
                          label={t("Attach Other Documents")}
                          attachments={attachmentList.Others}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="Others"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.Others || {}
                          }
                          t={t}
                        />
                      </div>
                    </div>
                  </CollapseNoExpand>
                  {this.state.editFileOnly ? (
                    <ItemInformation
                      columnItem={
                        config.INVOICE_CREATED_BY_DOCUMENT.value ==
                        "PURCHASE_ORDER"
                          ? columnItemPO
                          : columnItemGR
                      }
                      items={rawData.items}
                      className="itemsInfo"
                    />
                  ) : config.INVOICE_CREATED_BY_DOCUMENT.value ==
                    "PURCHASE_ORDER" ? (
                    this.state.previewMode == false ? (
                      <POItemEdit
                        columnItem={columnItemPO}
                        data={rawData}
                        settings={this.state.config}
                        updateMainState={this.updateMainState}
                        selectedItems={this.state.selectedItems}
                        flag={flag.isChangeSubTotalTaxTotal}
                      />
                    ) : (
                      <POItemEditPreview
                        columnItem={columnItemPO}
                        selectedItems={this.state.selectedItems}
                        settings={this.state.config}
                        updateMainState={this.updateMainState}
                        flag={flag.isChangeSubTotalTaxTotal}
                      />
                    )
                  ) : !this.state.blockPage ? (
                    this.state.previewMode == false ? (
                      <GRItemEdit
                        columnItem={columnItemGR}
                        data={rawData}
                        settings={this.state.config}
                        selectedItems={this.state.selectedItems}
                        updateMainState={this.updateMainState}
                        flag={flag.isChangeSubTotalTaxTotal}
                      />
                    ) : (
                      <GRItemEditPreview
                        columnItem={columnItemGR}
                        selectedItems={this.state.selectedItems}
                        settings={this.state.config}
                        updateMainState={this.updateMainState}
                        flag={flag.isChangeSubTotalTaxTotal}
                      />
                    )
                  ) : (
                    ""
                  )}
                </div>
                <div className="row">
                  <div className="col-12 text-center">
                    <button
                      type="button"
                      name="btnCancel"
                      id="btnCancel"
                      className="btn btn--transparent"
                      onClick={() => {
                        this.cancelEdit();
                      }}
                    >
                      {t("Cancel")}
                    </button>
                    {this.state.previewMode ? (
                      <button
                        type="button"
                        name="btnCancel"
                        id="btnCancel"
                        disabled={!this.validateChange(this.state)}
                        className="btn btn--transparent"
                        onClick={() => {
                          this.cancelPreview();
                        }}
                      >
                        &#x3C; {t("Back")}
                      </button>
                    ) : (
                      ""
                    )}
                    {
                      <button
                        className="btn"
                        id="submitBtn"
                        disabled={!this.validateChange(this.state)}
                        style={
                          !this.validateChange(this.state)
                            ? submitDisableStyle
                            : submitEnableStyle
                        }
                        onClick={() => {
                          if (this.state.isReSubmit == true) {
                            if (this.state.previewMode) {
                              this.resubmitInvoice();
                            } else {
                              this.getInvoiceSummary();
                              this.setState({ previewMode: true });
                            }
                          } else {
                            this.getInvoiceSummary();
                            if (this.state.editFileOnly) {
                              this.editFileInvoice();
                            } else {
                              this.editInvoice();
                            }
                          }
                        }}
                      >
                        {this.state.previewMode
                          ? t("Submit")
                          : t("View Summary")}
                      </button>
                    }
                  </div>
                </div>
              </section>
            </div>
          </div>
        </BlockUi>
        <ModalAlert
          title={this.state.alertModalAlertTitle}
          visible={this.state.isAlertModalVisible}
          button={this.state.buttonAlert}
          isTextOnly={this.state.isTextOnly}
        >
          {this.state.alertModalMsg}
        </ModalAlert>
      </Layout>
    );
  }
}
export default withAuth(withTranslation(["invoice-edit"])(invoiceEdit));
