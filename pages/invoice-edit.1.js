import _ from "lodash";
import moment from "moment";
import "daterangepicker";
import Router from "next/router";
import React, { Component } from "react";
import BlockUi from "react-block-ui";
import { findDOMNode } from "react-dom";
import ReactTooltip from "react-tooltip";
import Layout from "../components/Layout";
import UserPanel from "../components/userPanel";
import "../libs/mycools";
import { asyncContainer, Typeahead } from "../libs/react-bootstrap-typeahead";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import Head from "next/head";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_OK
} from "../components/modalAlert";
import VendorCompany, {
  ItemInformation
} from "../components/invoices/edit/components/sections";
import GRItemEdit from "~/components/invoices/edit/components/GRItemEdit";
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
const lifecycleResubmit = ["PENDING_SELLER"];
const lifecycleEdit = ["ISSUED", "PENDING_SELLER"];
import {
  columnItemPO,
  columnItemGR
} from "~/components/invoices/edit/models/item";
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
    this.state = {
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

      flag: {
        isNotGetVendorBranchList: false
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
      }
    };
    this.apis = new api().group("invoice");
    this.configApi = new api().group("config");
    this.upload = new api().group("upload");
    this.linearId = this.props.url.query.linearId;
  }
  updateMainState = newState => {
    this.setState(newState);
  };
  componentDidMount = async () => {
    let isReady = await this.checkAccess();
    if (isReady == true) {
      isReady = await this.preparingData();
      this.setState({ blockPage: !isReady });
    }
  };
  componentWillMount = async () => {};
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
  preparingData = async () => {
    try {
      let invoiceDetail = await this.apis.call("detail", {
        linearId: this.linearId,
        bypass: true,
        role: this.props.user.organisationUnit
      });
      if (invoiceDetail.pageSize != 1) {
        this.alert("Error !", [
          "Sorry, you cannot edit this invoice.",
          <br />,
          "API response more than one record.",
          <br />,
          "Please contact your administrator."
        ]);
        return false;
      }
      let data = invoiceDetail.rows[0];
      this.setState({ rawData: data, newData: data });
      await this.setDefaultVendorBranchList();
      await this.getVendorBranchList();
      await this.fileAttchmentInitail(data);
      await this.resolveButtonPermission(data);
      return await this.preparingConfig(data);
    } catch (err) {
      //console.error(err.message);
      this.alert("Error !", [
        "Sorry, you cannot edit this invoice.",
        <br />,
        err.response.message || err.message,
        <br />,
        "Please contact your administrator."
      ]);
      return false;
    }
  };
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
  setDefaultVendorBranchList = async () => {
    const { rawData, config: settings } = this.state;
    let data = {
      address: rawData.vendorAddress,
      branchCode: rawData.vendorBranchCode,
      name: rawData.vendorBranchName,
      taxId: rawData.vendorTaxNumber,
      def: true,
      id: 0
    };
    await this.setState({
      vendorBranchList: [...this.state.vendorBranchList, data]
    });
  };
  getVendorBranchList = async () => {
    const { seller, vendorTaxNumber } = this.state.rawData;
    let obj = {
      legalName: seller.legalName,
      taxId: vendorTaxNumber
    };
    try {
      let res = await this.apis.call("getVendorBranchList", obj);
      this.setVendorBranchList(res);
    } catch (err) {
      this.setState({
        isNotGetVendorBranchList: true
      });
    }
  };
  setVendorBranchList = async res => {
    let vendorBranchList = this.state.vendorBranchList;
    vendorBranchList.map(res => {
      vendorBranchList.push({
        address: `${res.address} ${res.district} ${res.city} ${res.postalCode}`,
        branchCode: res.branchCode,
        name: res.name,
        taxId: res.taxId,
        id: res.id
      });
    });
    await this.setState({
      vendorBranchList
    });
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
        cfg.requiredString = `${config.minimumNumberOfFiles}-${
          config.maximumNumberOfFiles
        }`;
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
          configOption: "INVOICE_CREATED_BY_DOCUMENT"
        }
      );
      if (INVOICE_CREATED_BY_DOCUMENT.length != 1) {
        this.alert(
          "Error !",
          "Cannot get detail of invoice. Api is response configuration less or more than one record."
        );
        return false;
      }

      let INVOICE_CONFIG = await this.apis.call("invoiceConfig", {
        companyTaxId: data.companyTaxNumber,
        legalName: data.buyer.legalName,
        vendorTaxId: data.vendorTaxNumber
      });
      let LIFECYCLE_ALLOW_ATTACHMENT = await this.preparingLifeCycle(
        INVOICE_CONFIG.attachmentConfiguration
      );
      let CONFIG_ATTACHMENT = await this.preparingfileAttachmentConfig(
        INVOICE_CONFIG.attachmentConfiguration
      );
      /* -- Check if lifecycle is in config. allow user edit only atatchment -- */
      let editFileOnly = false;
      if (LIFECYCLE_ALLOW_ATTACHMENT.includes(data.lifecycle)) {
        editFileOnly = true;
      }
      /* -- Set configuration in to state -- */
      this.setState({
        editFileOnly,
        config: {
          INVOICE_CONFIG,
          INVOICE_CREATED_BY_DOCUMENT,
          LIFECYCLE_ALLOW_ATTACHMENT,
          CONFIG_ATTACHMENT
        }
      });
      await this.calendarInitial(INVOICE_CONFIG, this.state.rawData);

      return true;
    } catch (err) {
      this.alert("Error !", [
        "Sorry, you cannot edit this invoice.",
        <br />,
        err.response ? err.response.message : err.message,
        <br />,
        "Please contact your administrator."
      ]);
      return false;
    }
  };
  checkAccess = async () => {
    if (!this.props.permissions.includes("Invoice-Edit")) {
      this.alert(
        "No permission to access.",
        "Cannot edit invoice. No permission to access this page."
      );
      return false;
    }
    if (!this.linearId) {
      this.alert(
        "Invalid LinearId",
        "Cannot edit invoice. no linearId found in url."
      );
      return false;
    }
    return true;
  };
  handleExternalIdChange = async e => {
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
      return r.itemLists.filter(rt => {
        if (rt.checked == true) {
          summary += rt.selectAmount;
        }
        return rt.checked == true;
      });
    });
    return summary;
  };
  validateChange = state => {
    for (let group in state.attachmentList) {
      let cfg = this.state.config.CONFIG_ATTACHMENT[group];
      if (!cfg) {
        console.log("validateChange", false, "cfg not found");
        return false;
      }
      if (state.attachmentList[group].length > cfg.maximum) {
        console.log("validateChange", false, "cfg.maximum");
        return false;
      }
      if (cfg.required && state.attachmentList[group].length == 0) {
        console.log("validateChange", false, "cfg.required");
        return false;
      }
    }
    if (
      this.state.editFileOnly == false &&
      this.state.selectedItems.length > 0
    ) {
      return (
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
        this.state.isMultipleGRExceeded == true
      );
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
      this.alert("Error !", ["Maximum file selected."], this.BTN_OK);
      console.log("Maximum file selected " + group);
      return false;
    }
    if (!formats.includes(ext.toUpperCase())) {
      this.alert("Error !", ["File type is not allow."], this.BTN_OK);
      console.log("File type is not allow " + group);
      return false;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.alert("Error !", ["File size is larger than 3mb."], this.BTN_OK);
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
      this.alert(
        "Error !",
        [
          "Sorry, you cannot edit this invoice.",
          <br />,
          err.response.message || err.message,
          <br />,
          "Please contact your administrator."
        ],
        this.BTN_OK
      );
      this.setState({ blockPage: false });
    }
  };
  uploadAttachment = async attachmentList => {
    let obj = await Object.keys(attachmentList);
    let tmpData = [];
    let fileAttachments = [];
    await obj.map(async grp => {
      let attach = attachmentList[grp];
      return await attach.map(async a => {
        a.attachmentType = grp;
        tmpData.push({
          ...a,
          attachmentType: grp
        });
      });
    });
    let t = await tmpData.map(async a => {
      if (a.isNew) {
        let res = await this.uploadFile(a);
        res.attachmentType = a.attachmentType;
        fileAttachments.push(res);
        return res;
      } else {
        fileAttachments.push(a);
        return a;
      }
    });
    return Promise.all(t);
  };

  uploadFile = async attachFile => {
    try {
      let res = await this.upload.call("uploadFiles", [], {
        headers: {
          "Content-Type": "multipath/form-data"
        },
        data: attachFile.attachmentFile.data
      });
      return res[0];
    } catch (err) {
      console.trace(err);
      return false;
    }
  };
  render() {
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
      attachmentList
    } = this.state;
    return (
      <Layout hideNavBar={true} ref={this.layout} {...this.props}>
        <Head>
          <title>{`Edit Invoice No. ${rawData.externalId}`}</title>
        </Head>
        <BlockUi tag="div" blocking={this.state.blockPage}>
          <div className="page__header d-flex flex-wrap px-3">
            <h2 className="col-6 offset-3 text-center">Edit Mode</h2>
            <UserPanel {...this.props} />
          </div>
          <div id="invoice_detail_edit_page" className="row">
            <div className="form col-12">
              <div className="form-group form-inline col-12 mb-3">
                <label className="control-label h3 font-bold">
                  Invoice No.:{" "}
                  {this.state.editFileOnly && this.state.rawData.externalId}
                </label>
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
                <label
                  style={{ color: "red", marginLeft: "10px" }}
                  hidden={!this.state.isInvoiceDup}
                >
                  Invoice No. is duplicated. Please enter another number.
                </label>
              </div>
              <section className="box box--width-header col-12">
                <div className="box__header">
                  <div className="row justify-content-between align-items-center">
                    <div className="col">
                      {" "}
                      Entry Date :{" "}
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
                    collapseHeader={["Payment Information"]}
                  >
                    <div className="row">
                      <div className="col-6">
                        <CollapseItem colLabel={6} label="Invoice Date">
                          {this.state.editFileOnly ? (
                            <React.Fragment>
                              {moment(rawData.invoiceDate).format("DD/MM/YYYY")}
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

                        <CollapseItemText t={t}
                          colLabel={6}
                          label="Payment Term Description"
                          value={rawData.paymentTermDesc}
                        />

                        <CollapseItemCheckbox
                          colLabel={6}
                          label="Invoice Financing"
                          value={rawData.invoiceFinancing == "Y" ? "Y" : "N"}
                          onChange={e => {
                            this.setState({
                              rawData: {
                                ...this.state.rawData,
                                invoiceFinancing: e.target.value
                              }
                            });
                          }}
                          canEdit={!this.state.editFileOnly}
                          items={[
                            { label: "Yes", value: "Y" },
                            { label: "No", value: "N" }
                          ]}
                        />
                      </div>
                      <div className="col-6">
                        <CollapseItemText t={t}
                          colLabel={6}
                          label="Expected Due Date"
                          value={
                            rawData.dueDate
                              ? moment(rawData.dueDate).format("DD/MM/YYYY")
                              : "-"
                          }
                        />

                        <CollapseItemCurrency
                          colLabel={6}
                          label="Sub Total"
                          currency="THB"
                          value={rawData.subTotal}
                        />
                        <CollapseItemCurrency
                          colLabel={6}
                          label="TAX Total"
                          currency="THB"
                          value={rawData.vatTotal}
                        />
                        <CollapseItemCurrency
                          colLabel={6}
                          label="Invoice Amount (Inc. TAX)"
                          currency="THB"
                          value={rawData.invoiceTotal}
                        />
                      </div>
                    </div>
                  </CollapseNoExpand>
                  <CollapseNoExpand
                    id="attachmentsList"
                    expanded="true"
                    collapseHeader={["Attachments"]}
                  >
                    <div className="row">
                      <div className="col-6 nopadding">
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_TaxInvoice"
                          label="Attach Tax Invoice"
                          attachments={attachmentList.TaxInvoice}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="TaxInvoice"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.TaxInvoice || {}
                          }
                        />
                        <CollapseItemText t={t}
                          colLabel={4}
                          label="Receipt NO."
                          value={rawData.receiptNumber}
                        />
                      </div>
                      <div className="col-6 nopadding">
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_DeliveryNote"
                          label="Attach Delivery Note"
                          attachments={attachmentList.DeliveryNote}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="DeliveryNote"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.DeliveryNote ||
                            {}
                          }
                        />
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_Receipt"
                          label="Attach Receipt"
                          attachments={attachmentList.Receipt}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="Receipt"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.Receipt || {}
                          }
                        />
                        <CollapseItemAttachment
                          colLabel={4}
                          id="attach_Others"
                          label="Attach Other Documents"
                          attachments={attachmentList.Others}
                          previewMode={this.state.previewMode}
                          onChange={this.handleAddFile}
                          onRemove={this.handleRemoveFile}
                          fileGroup="Others"
                          config={
                            this.state.config.CONFIG_ATTACHMENT.Others || {}
                          }
                        />
                      </div>
                    </div>
                  </CollapseNoExpand>
                  {this.state.editFileOnly ? (
                    <ItemInformation
                      columnItem={
                        config.INVOICE_CREATED_BY_DOCUMENT.value == "PO"
                          ? columnItemPO
                          : columnItemGR
                      }
                      items={rawData.items}
                    />
                  ) : config.INVOICE_CREATED_BY_DOCUMENT.value == "PO" ? (
                    "PO"
                  ) : !this.state.blockPage ? (
                    <GRItemEdit
                      columnItem={columnItemGR}
                      data={rawData}
                      settings={this.state.config}
                      updateMainState={this.updateMainState}
                    />
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
                      Cancel
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
                        &#x3C; Back
                      </button>
                    ) : (
                      ""
                    )}
                    {this.state.isReSubmit ? (
                      <button
                        disabled={!this.validateChange(this.state)}
                        className="btn"
                        style={
                          !this.validateChange(this.state)
                            ? submitDisableStyle
                            : submitEnableStyle
                        }
                        onClick={() => {
                          this.editInvoice();
                        }}
                      >
                        {this.state.previewMode ? "Resubmit" : "View Summary"}
                      </button>
                    ) : (
                      <button
                        disabled={!this.state.isEditValidationPass}
                        className="btn"
                        disabled={!this.validateChange(this.state)}
                        style={
                          !this.validateChange(this.state)
                            ? submitDisableStyle
                            : submitEnableStyle
                        }
                        onClick={() => {
                          if (this.state.editFileOnly) {
                            this.editFileInvoice();
                          } else {
                            this.resubmitInvoice();
                          }
                        }}
                      >
                        {this.state.previewMode ? "Edit" : "View Summary"}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </BlockUi>
        <ModalAlert {...this.state.ModalAlert}>
          {this.state.ModalAlert.message}
        </ModalAlert>
      </Layout>
    );
  }
}
export default withAuth(invoiceEdit);
