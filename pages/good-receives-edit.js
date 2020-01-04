import React, { Component } from "react";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import "../libs/mycools";
import BlockUi from "react-block-ui";
import ColumnList from "../libs/column";
import ModalAlert from "../components/modalAlert";
import TableDetail from "../components/TableDetail";
import TextField from "../components/Fields/TextField";
import { PageHeader, Collapse, CollapseItemText } from "../components/page";
import CordaService from "../services/CordaService";
import { withTranslation } from "~/i18n";
import GA from "~/libs/ga";

class GrEdit extends Component {
  constructor(props) {
    super(props);

    this.cordaService = new CordaService();
    this.api = new ApiService();
    this.apiDetail = new api(this.props.domain).group("grDetail");
    this.apis = new api().group("gr");
    this.apisitm = new api().group("griteminfo");
    this.columnList = new ColumnList();
    this.state = {
      title: "Goods Receives Detail",
      dataTableUrl: this.apiDetail.url("detail"),
      breadcrumb: [],
      columnList: [],
      model: [],
      detailItems: {
        goodsReceivedItems: []
      },
      grItems: [],
      showSearchbox: true,
      _this: this,
      blocking: true,
      saveColumnUrl: this.apiDetail.url("model.save"),
      invoiceLinearId: "",
      isToggleReviseInvoiceNoModal: false,
      reviseInvoiceNoModalTitle: "",
      buttonReviseInvoiceNoModal: [],
      reviseInvoiceRemark: "",
      reviseInvoiceNo: "",
      GRDoc: [],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: [],
      revisedInvoiceNumber: "",
      otherFiles: [],
      otherFilesNew: [],
      OtherAction: ["Add", "Remove"],
      isAllowEdit: false,
      otherFilesFormat: "",
      otherRequiredString: ""
    };
  }

  async componentWillMount() {
    await this.permissionPage();
    await this.setPermission();
    await this.fetchData();
  }

  permissionPage = () => {
    const { permisions } = this.props;
    if (!permisions.includes("GR-Edit")) {
      Router.push("/dashboard");
    }
  };

  setPermission = () => {
    const { permisions } = this.props;
    this.setState({
      UserAuthority: permisions
    });
  };

  fetchData = async () => {
    try {
      this.model = await this.apiDetail.call("model.get");
      const column = this.columnList.initColumns(this.model);
      this.setState({ columnList: column, model: this.model });
      const res = await this.api.getGRDetail(this.props.url.query.linearId);
      if (
        res.rows[0].initialInvoiceExternalId === res.rows[0].invoiceExternalId
      ) {
        res.rows[0].invoiceExternalId = "";
      }
      this.setState({
        detailItems: res.rows[0],
        revisedInvoiceNumber: res.rows[0].invoiceExternalId
          ? res.rows[0].invoiceExternalId
          : res.rows[0].initialInvoiceExternalId,
        otherFiles: res.rows[0].fileAttachments,
        grItems: res.rows[0].goodsReceivedItems
      });

      await this.api
        .getGRConfiguration(
          this.state.detailItems.buyer.legalName,
          this.state.detailItems.companyTaxNumber,
          this.state.detailItems.vendorTaxNumber
        )
        .then(res => {
          this.setState({
            configuration: res
          });
        });

      this.populateAttachmentsToState(this.state.otherFiles);

      if (this.state.detailItems.invoiceExternalId) {
        await this.getinvoiceLinearId();
      }

      await this.setGRDoc();
      await this.resolveFileRequired();
      await this.resolvePermission();

      this._columnRender(this.model);
      this.resolveAllowToResubmitEdit();
    } catch (error) {
      console.error(error);
      this.setState({
        isAlertModalVisible: true,
        alertModalAlertTitle: "Error!",
        isTextOnly: true,
        alertModalMsg: [
          `Sorry, you cannot get detail of this goods receipt.`,
          <br />,
          "Please contact your administrator."
        ],
        buttonAlert: [
          {
            label: "Back",
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.routeToGRList
            }
          }
        ]
      });
    }
  };

  handleDeselectedFile(type, fileIndex) {
    let files = this.state[type];
    files.splice(fileIndex, 1);
    if (type === "otherFiles") {
      this.setState({
        otherFiles: files
      });
    } else if (type === "otherFilesNew") {
      this.setState({
        otherFilesNew: files
      });
    }
    this.resolveAllowToResubmitEdit();
  }

  populateAttachmentsToState(attachments) {
    let otherFiles = [];
    if (attachments) {
      attachments.forEach(item => {
        if (item.attachmentType.toUpperCase() === "OTHERS") {
          let file = {
            attachmentName: item.attachmentName,
            attachmentHash: item.attachmentHash,
            uploadDate: item.uploadDate,
            attachmentType: "Others"
          };
          otherFiles.push(file);
        }
      });
    }
    this.setState({
      otherFiles: otherFiles
    });
  }

  populateFileAttachmentForEdit = async () => {
    const attachments = this.state.otherFilesNew;
    const fileAttachments = [];

    for (let i = 0; i < attachments.length; i++) {
      const handleFileUploadResponse = await this.uploadAttachment(
        attachments[i].data
      );
      const { status, data } = handleFileUploadResponse;

      if (status) {
        const attachment = data;
        const attachmentHash = attachment.attachmentHash;

        fileAttachments.push({
          attachmentHash: attachmentHash,
          attachmentName: attachments[i].name,
          attachmentType: "Others"
        });
      }
    }

    return fileAttachments;
  };

  uploadAttachment = async attachment =>
    await this.cordaService.callApi({
      group: "file",
      action: "handleFileUpload",
      body: attachment
    });

  routeToGRList = () => {
    Router.push("/good-receives");
  };

  async setGRDoc() {
    let GRDocArr = [];
    let GRDocDup = [];
    let val = await this.state.detailItems.goodsReceivedItems.map(
      async item => {
        if (
          item.initialGoodsReceivedExternalId !== "" &&
          item.initialGoodsReceivedExternalId !== undefined
        ) {
          if (GRDocDup.includes(item.initialGoodsReceivedExternalId)) {
            return;
          }
          GRDocDup.push(item.initialGoodsReceivedExternalId);
          let data = {
            externalId: item.initialGoodsReceivedExternalId
          };

          let res = await this.apiDetail.call("searchGROriginalDoc", data);
          if (res.data.length > 0) {
            let GRDocObj = {
              GRDocId: item.initialGoodsReceivedExternalId,
              linearId: res.data[0].linearId
            };

            GRDocArr[GRDocArr.length] = GRDocObj;
            this.setState({
              GRDoc: [...this.state.GRDoc, GRDocObj]
            });
          }
        }
      }
    );
  }

  resolvePermission() {
    let isAllowEdit = false;
    const { grItems } = this.state;
    grItems.forEach(item => {
      if (item.lifecycle.toUpperCase() === "ISSUED") {
        isAllowEdit = true;
      }
    });
    this.setState({
      isAllowEdit,
      blocking: false
    });
  }

  resolveFileRequired() {
    let fileConfig = this.state.configuration.attachmentConfiguration;

    function checkRequired(minimum) {
      if (minimum > 0) {
        return true;
      } else return false;
    }

    fileConfig.forEach(config => {
      if (config.attachmentType === "Others") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isOtherRequired: required,
          otherFilesFormat: config.fileType
        });

        if (config.maximumNumberOfFiles === config.minimumNumberOfFiles) {
          this.setState({
            otherRequiredString: config.minimumNumberOfFiles
          });
        } else {
          this.setState({
            otherRequiredString:
              config.minimumNumberOfFiles + " - " + config.maximumNumberOfFiles
          });
        }
      }
    });
  }

  async getinvoiceLinearId() {
    const res = await this.apiDetail.call("getInvoiceLinearId", {
      invoiceExternalId: this.state.detailItems.invoiceExternalId
    });
    if (res.data.length > 0) {
      let externalId = res.data.map(itm => {
        return itm.externalId;
      });
      if (externalId.includes(this.state.detailItems.invoiceExternalId)) {
        this.setState({
          invoiceLinearId: res.data[0].linearId
        });
      } else {
        this.setState({
          invoiceLinearId: ""
        });
      }

      this.setState({
        blocking: false
      });
    } else {
      this.setState({
        blocking: false
      });
    }
  }

  _columnRender = async res => {
    const { t } = this.props;
    for (let i in res.table.columns) {
      res.table.columns[i].searchKey = res.table.columns[i].header;
      res.table.columns[i].header = await t(
        res.table.columns[i].header.replace(/[.]/g, "")
      );
    }
    const columns = this.columnList.initColumns(res);
    this.setState({ columnList: columns, model: res });
  };

  async uploadAttachment(attachments) {
    let result = [];
    for (let i = 0; i < attachments.length; i++) {
      const { status, message, data } = await this.cordaService.callApi({
        group: "file",
        action: "handleMultipleFileUpload",
        body: attachments[i].data
      });
      if (status) {
        result.push(data[0]);
      }
    }
    return result;
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  handleClickCancel() {
    Router.push(
      "/good-receives-detail?linearId=" + this.props.url.query.linearId
    );
  }

  resolveAllowToResubmitEdit() {
    if (this.resolveFilesRequiredUploaded()) {
      this.setState({
        isAllowResubmit: true
      });
    } else {
      this.setState({
        isAllowResubmit: false
      });
    }
  }

  resolveFilesRequiredUploaded() {
    let otherUploaded = true;

    if (this.state.isOtherRequired) {
      if (
        this.state.otherFiles.length === 0 &&
        this.state.otherFilesNew.length === 0
      ) {
        otherUploaded = false;
      }
    }

    return otherUploaded;
  }

  handleClickResubmit = async () => {
    GA.event({
      category: "Good Receipt",
      action: "Edit Good Receipt (Request)",
      label: `Good Receipt | ${
        this.state.detailItems.externalId
      } | ${moment().format()}`
    });

    this.toggleBlocking();

    const attachments = await this.populateFileAttachmentForEdit();
    const existingFile = this.state.otherFiles;
    const newAttachments = attachments.concat(existingFile);
    const body = {
      linearId: this.state.detailItems.linearId,
      invoiceExternalId: this.state.revisedInvoiceNumber,
      fileAttachments: newAttachments
    };

    const { status, message } = await this.cordaService.callApi({
      group: "goodsReceived",
      action: "editGoodsReceivedWithNewInvoice",
      body: body
    });

    if (status) {
      this.toggleBlocking();

      GA.event({
        category: "Good Receipt",
        action: "Edit Good Receipt (Success)",
        label: `Good Receipt | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      Router.push(
        "/good-receives-detail?linearId=" + this.props.url.query.linearId
      );
    } else {
      this.toggleBlocking();

      GA.event({
        category: "Good Receipt",
        action: "Edit Good Receipt (Failed)",
        label: `Good Receipt | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      this.setState({
        editErrMessage: message
      });
      window.jQuery("#errorWarning").modal("toggle");
    }
  };

  handleSelectedFile = event => {
    let filetype = event.target.name;
    let files = event.target.files;
    let data = new FormData();
    data.append("file", files[0]);
    if (this.isValidToUpload(files[0], filetype)) {
      files[0].data = data;
      if (filetype === "attach_other_file") {
        let otherFilesNew = this.state.otherFilesNew;
        otherFilesNew.push(files[0]);
        this.setState({
          otherFilesNew: otherFilesNew
        });
      }
    }
    this.resolveAllowToResubmitEdit();
    event.target.value = null;
  };

  isValidToUpload(file, fileType) {
    if (file !== undefined) {
      let isNotExceeded = false;
      let isValidType = false;
      let isSizeNotExceeded = false;

      let filesConfig = this.state.configuration.attachmentConfiguration.find(
        function(attachment) {
          return attachment.attachmentType == "Others";
        }
      );

      if (fileType === "attach_other_file") {
        let formats = this.state.otherFilesFormat.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          this.state.otherFiles.length + this.state.otherFilesNew.length <
          filesConfig.maximumNumberOfFiles
        ) {
          isNotExceeded = true;
        }

        if (formats.includes(ext.toUpperCase())) {
          isValidType = true;
        }

        if (file.size <= 3000000) {
          isSizeNotExceeded = true;
        }

        if (!isSizeNotExceeded) {
          this.setState({
            validationErrorMsg: "File size is larger than 3mb."
          });
          window.jQuery("#validationlWarning").modal("toggle");
        }

        if (isNotExceeded && isValidType && isSizeNotExceeded) {
          window.jQuery("#attach_other_file_format").css("color", "black");
          return true;
        } else {
          window.jQuery("#attach_other_file_format").css("color", "red");
          return false;
        }
      }
    }
  }

  handleInputChange = event => {
    var value = event.target.value;
    this.setState({
      revisedInvoiceNumber: value
    });
  };

  handleDismissReviseInvoiceNoModal = () => {
    this.setState({
      isToggleReviseInvoiceNoModal: false
    });
  };
  handleReviseInvoiceNoOnchange = e => {
    let reviseInvoiceNo = e.target.value;
    this.setState({
      reviseInvoiceNo: reviseInvoiceNo
    });
  };

  render() {
    const { t } = this.props;
    let breadcrumbs = [
      { title: t("Goods Receipt"), url: "/good-receives" },
      {
        title: `${t("Goods Receipt No")} ${this.state.detailItems.externalId}`,
        active: true
      }
    ];

    const {
      detailItems,
      blocking,
      GRDoc,
      invoiceLinearId,
      columnList,
      isToggleReviseInvoiceNoModal,
      buttonReviseInvoiceNoModal,
      reviseInvoiceNoModalTitle,
      reviseInvoiceRemark,
      alertModalAlertTitle,
      isAlertModalVisible,
      buttonAlert,
      isTextOnly,
      alertModalMsg,
      grItems,
      isAllowEdit
    } = this.state;

    return (
      <Layout {...this.props}>
        <PageHeader
          title={`${t("Goods Receipt No")} ${detailItems.externalId}`}
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <BlockUi tag="div" blocking={blocking}>
          <section
            id="invoice_detail_page"
            className="goodReceiveDetailPage box box--width-header"
          >
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-2">
                <div className="col-4">
                  {" "}
                  {t("Create Date")} :{" "}
                  <strong>
                    {moment(detailItems.documentEntryDate).format("DD/MM/YYYY")}
                  </strong>
                </div>
              </div>
            </div>
            <div className="box__inner">
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={[t("Vendor"), t("Company")]}
              >
                <div className="row">
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={detailItems.vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={detailItems.vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={detailItems.vendorTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${detailItems.vendorBranchCode || "-"} 
                        ${
                          detailItems.vendorBranchName
                            ? `(${detailItems.vendorBranchName})`
                            : ""
                        }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={`${detailItems.vendorAddress1 ||
                        ""} ${detailItems.vendorAddress2 ||
                        ""} ${detailItems.vendorDistrict ||
                        ""} ${detailItems.vendorCity ||
                        ""} ${detailItems.vendorPostalCode || ""}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.vendorTelephone}
                    />
                  </div>
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={detailItems.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={detailItems.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={detailItems.companyTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${detailItems.companyBranchCode || "-"}
                        ${
                          detailItems.companyBranchName
                            ? `(${detailItems.companyBranchName})`
                            : ""
                        }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={`${detailItems.companyAddress1 ||
                        ""} ${detailItems.companyAddress2 ||
                        ""} ${detailItems.companyDistrict ||
                        ""} ${detailItems.companyCity ||
                        ""} ${detailItems.companyPostalCode || ""}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.companyTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              <Collapse
                id="grInfo"
                expanded="true"
                collapseHeader={[t("GR Information")]}
              >
                <div className="row">
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("PO No")}
                      value={detailItems.goodsReceivedItems
                        .map(item => item.purchaseOrderExternalId)
                        .filter(
                          (value, index, self) => self.indexOf(value) === index
                        )}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("GR Posting Date")}
                      value={moment(detailItems.postingDate).format(
                        "DD/MM/YYYY"
                      )}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("GR Type")}
                      value={detailItems.goodsReceivedItems
                        .map(item => item.movementClass)
                        .filter(
                          (value, index, self) => self.indexOf(value) === index
                        )}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Invoice No")}
                      value={detailItems.initialInvoiceExternalId}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Last Edited Date")}
                      value={
                        detailItems.lastEditedDate
                          ? moment(detailItems.lastEditedDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                  </div>
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Delivery Note No")}
                      value={detailItems.deliveryNoteExternalId}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("GR By")}
                      value={detailItems.createdBy}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Accounting Doc No")}
                      value=""
                    />
                    <div className="row">
                      <p className="col-6 text-right">
                        {t("Original GR Doc No")} :
                      </p>
                      <p className="col-6">
                        {this.state.GRDoc && this.state.GRDoc.length > 0
                          ? this.state.GRDoc.map((item, i) => {
                              return (
                                <span>
                                  <a
                                    href={`/good-receives-detail?linearId=${item.linearId}`}
                                    key={i}
                                  >
                                    {item.GRDocId}
                                  </a>
                                  {this.state.GRDoc.length - 1 !== i ? "," : ""}
                                </span>
                              );
                            })
                          : "-"}
                      </p>
                    </div>
                    <div className="row">
                      <p className="col-6 text-right">
                        {t("Revised Invoice No")} :
                      </p>
                      <p className="col-6">
                        <TextField
                          field={{
                            canEdit: isAllowEdit,
                            key: "revisedInvoiceNumber",
                            placeholder: "",
                            onChange: e => this.handleInputChange(e)
                          }}
                          datas={{
                            revisedInvoiceNumber: this.state
                              .revisedInvoiceNumber
                          }}
                          className="border border-1px border-lightgrey"
                        />
                      </p>
                    </div>
                    <CollapseItemText
                      t={t}
                      label={t("Last Edited By")}
                      value={detailItems.lastEditedBy}
                    />
                    <div id="invoice_detail_edit_page" className="row">
                      <p className="col-6 text-right">
                        {t("Attach Document")} :
                      </p>
                      <div className="col-6 nopadding form-group d-inline-flex custom-fileUpload">
                        <input
                          type="text"
                          name="attach_others_document"
                          className="form-control"
                        />
                        {this.state.OtherAction.includes("Add") && (
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
                        )}
                      </div>
                    </div>
                    <div className="row">
                      <div
                        class="col-6 offset-6 nopadding"
                        id="attach_other_file_format"
                      >
                        <small>
                          {t("File type")}: {this.state.otherFilesFormat},{" "}
                          {t("Required")}: {this.state.otherRequiredString}{" "}
                          {t("files")}
                        </small>
                      </div>
                    </div>
                    {_.map(
                      this.state.otherFiles,
                      ({ attachmentName }, index) => (
                        <div className="row">
                          <p className="col-6 text-right" />
                          <div className="col-6 border-top border-bottom border-1px border-lightgrey">
                            {attachmentName}
                            {this.state.OtherAction.includes("Remove") && (
                              <a href="javascript:void(0);">
                                <i
                                  className="fa fa-times purple float-right"
                                  onClick={() =>
                                    this.handleDeselectedFile(
                                      "otherFiles",
                                      index
                                    )
                                  }
                                />
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    )}

                    {_.map(this.state.otherFilesNew, ({ name }, index) => (
                      <div className="row">
                        <p className="col-6 text-right" />
                        <div className="col-6 border-top border-bottom border-1px border-lightgrey">
                          {name}
                          {this.state.OtherAction.includes("Remove") && (
                            <a href="javascript:void(0);">
                              <i
                                className="fa fa-times purple float-right"
                                onClick={() =>
                                  this.handleDeselectedFile(
                                    "otherFilesNew",
                                    index
                                  )
                                }
                              />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse>
              {this.state.columnList.length > 0 ? (
                <TableDetail
                  {...this.props}
                  {...this.state}
                  _this={this}
                  key="itemInfo"
                  id="itemInfo"
                  expanded="true"
                  collapseHeader={[t("Items Information")]}
                  btnColumnDisplay={true}
                  AcolumnList={this.columnList}
                  apis={this.apisitm}
                  columns={this.state.columnList}
                  results={this.state.grItems}
                  btnOpt={[]}
                />
              ) : (
                ""
              )}

              <div className="row justify-content-center align-items-center mb-2">
                <div className="col-12 text-center">
                  <button
                    name="btnCancel"
                    className="btn btn--transparent btn-wide mr-2"
                    onClick={() => this.handleClickCancel()}
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    name="btnResubmit"
                    disabled={!this.state.isAllowResubmit}
                    className="btn btn-primary btn-wide mr-2"
                    onClick={() => this.handleClickResubmit()}
                  >
                    {t("Resubmit")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </BlockUi>
        <ModalAlert
          title={reviseInvoiceNoModalTitle}
          visible={isToggleReviseInvoiceNoModal}
          button={buttonReviseInvoiceNoModal}
          isHeaderCenter={true}
          modalSize="modal-revise"
        >
          <div className="form-label-group">
            <input
              type="text"
              id="invoice_no"
              className="form-control"
              placeholder={reviseInvoiceNoModalTitle}
              defaultValue={detailItems.invoiceExternalId}
              onChange={this.handleReviseInvoiceNoOnchange}
              required
              autoFocus
            />
            <label htmlFor="invoice_no">{reviseInvoiceNoModalTitle}</label>
          </div>
          {reviseInvoiceRemark != "" ? (
            <p className="message c-red">{reviseInvoiceRemark}</p>
          ) : (
            <span />
          )}
        </ModalAlert>
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
      </Layout>
    );
  }
}
export default withAuth(withTranslation(["gr-edit", "detail"])(GrEdit));
