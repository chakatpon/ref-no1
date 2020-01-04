import React, { Component } from "react";
import moment from "moment";
import Router from "next/router";

import Dropzone from "react-dropzone";
import withAuth from "../libs/withAuth";
import Layout from "../components/Layout";
import ModalDropFile from "../components/modalDropFile";
import BlockUi from "react-block-ui";
import api from "../libs/api";
import ApiService from "../libs/ApiService";
import "../libs/mycools";
import MatchDetailSearch from "../components/matchDetailPopover/matchDetailSearch";
import io from "socket.io-client";
import ThreeWayMatchingItem from "../components/threeWayMatchingItem";
import ModalMessage from "~/components/common/SweetAlert";
import { i18n, withTranslation } from "~/i18n";
import {
  PageHeader,
  DVButton,
  Collapse,
  CollapseItemText,
  CollapseItemExternalLink,
  CollapseItemLink,
  CollapseItemDatatable,
  DateText,
  CollapseItemRevised,
  MatchingItem,
  CollapseHistoryExternalLink
} from "../components/page";
import ModalAlert from "../components/modalAlert";
import GA from "~/libs/ga";

const Api = new ApiService();

const lifecycleTag = ["PENDING_AUTHORITY", "PARTIALLY_APPROVED"];
const lifecycleForNotRunMatching = ["ISSUED", "PENDING_SELLER", "CANCELLED"];

class testDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      UserAuthority: [],
      linearId: "",
      invoiceNumber: "",
      invoiceDetailData: {},
      innerPurchaseItem: {},
      innerAccounting: {},
      configuration: {},
      creditNoteRefer: [],
      createNoteSettled: [],
      noteReferItemNumber: 0,
      noteSettledItemNumber: 0,
      // attachmentTaxInvoice: [],
      // attachmentReceipt: [],
      // attachmentDeliveryNote: [],
      // attachmentOther: [],
      purchaseItems: [],
      taxThreePercentItems: [],
      taxSevenPercentItems: [],
      taxThreePanelDisplay: true,
      taxSevenPanelDisplay: true,
      isAllowButtion: false,
      isNotRunMatching: true,
      invoiceFinancingChecked: "",
      revisedDueDateReason: "",
      breadcrumbs: [],
      isMainSectionBlock: true,
      columnList: [],
      errCaseMsg: "",
      showSection1: false,
      showSection2: false,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: true,
      buttonAlert: [],
      files: [],
      vendor: {},
      amountMatching: {
        taxTotal: {},
        subTotal: {},
        totalAmount: {}
      },
      isApproveModalVisible: false,
      isRejectModalVisible: false,
      matchingDetail: [],
      approveReasonText: "",
      approveFile: [],
      rejectReasonText: "",
      rejectFile: [],
      isResultVisible: false,
      buttonResultAlert: [],
      resultTitle: "",
      resultMsg: "",
      data: {
        vendor: {},
        company: {},
        actionHistory: [],
        amountMatching: {
          subTotal: {},
          taxTotal: {},
          totalAmount: {}
        },
        paymentinfo: {},
        attachments: {
          fileAttachmentsTaxInvoice: [],
          fileAttachmentsDeliveryNote: [],
          fileAttachmentsReceipt: [],
          fileAttachmentsOther: []
        },
        matchingDetail: [],
        restrictedMap: {},
        disclosedMap: {},
        matchedCode: {},
        unmatchedCode: []
      },
      configFileApprove: {},
      configFileReject: {},
      itemFilter: "All",
      resultLoading: false,
      original: {}
    };
    this.apis = new api(this.props.domain).group("doa");
    this.style = {
      matchedWithinThreshold: {
        color: "#ff981c"
      },
      matchedColor: {
        color: "#28a745"
      }
    };
  }
  async componentWillMount() {
    try {
      const res = await this.apis.call("detail", {
        linearId: this.props.url.query.linearId
      });

      Api.checkUserAuthority().then(res => {
        this.setState({
          UserAuthority: res
        });
      });

      const { permisions } = this.props;

      const config = await this.apis.call("fileConfigDoa", {
        legalName: res.original.buyer.legalName,
        companyTaxId: res.original.companyTaxNumber,
        vendorTaxId: res.original.vendorTaxNumber
      });

      const configFileApprove = config.attachmentConfiguration.filter(
        configFile => configFile.attachmentType === "DOAApprove"
      )[0];
      const configFileReject = config.attachmentConfiguration.filter(
        configFile => configFile.attachmentType === "DOAReject"
      )[0];

      if (!permisions.includes("DOA-Detail")) {
        Router.push("/waiting-doa-approval");
      }

      this.setState({
        UserAuthority: permisions
      });

      if (!res.data) {
        this.setState({
          isAlertModalVisible: true,
          alertModalAlertTitle: "Error!",
          alertModalMsg: [
            "Sorry, you cannot get detail of this invoice. ",
            <br />,
            "Please contact your administrator."
          ]
        });
        return Promise.reject();
      } else {
        await this.setState({
          data: res.data,
          original: res.original,
          matchingDetail: res.data.matchingDetail.map(item => ({
            ...item,
            checked: true
          })),
          invoiceDetailData: res.original,
          innerAccounting: res.data.accounting,
          purchaseItems: res.data.items,
          invoiceNumber: res.data.externalId,
          vendor: res.data.vendor,
          invoiceFinancingChecked: res.data.invoiceFinancing,
          amountMatching: res.data.amountMatching,
          isMainSectionBlock: false,
          configFileApprove,
          configFileReject,
          buttonResultAlert: [
            {
              label: "Close",
              attribute: {
                className: "btn btn-wide",
                onClick: this.toggleResultModal
              }
            }
          ]
        });

        this.resolvePermission();

        this.setState({
          isMainSectionBlock: false
        });
      }
    } catch (err) {
      console.log(err);
      ModalMessage({
        title: "Error!",
        type: "warning",
        closeOnClickOutside: false,
        message: (
          <div>
            Sorry, you cannot get detail of this invoice.
            <br />
            Please contact your administrator.
          </div>
        ),
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: e => Router.push("/waiting-doa-approval")
            }
          }
        ]
      });
    }
  }

  setSuccessModal = msg => {
    const _this = this;
    msg.data.forEach(invoice => {
      if (invoice.linearId === _this.props.url.query.linearId) {
        _this.setState({
          resultTitle: "DOA approve",
          resultMsg: `Approve for invoice no. ${_this.state.data.externalId} completed.`,
          resultSucess: true,
          isResultVisible: true,
          resultLoading: false,
          data: {
            ..._this.state.data,
            status: invoice.status,
            lifecycle: invoice.lifecycle
          }
        });
      }
    });

    GA.event({
      category: "DOA",
      action: " Delegate of Authorise Approve (Success)",
      label: `DOA | ${_this.state.data.externalId} | ${moment().format()}`
    });
  };

  setFailModal = (err, item) => {
    console.log("err", err);
    console.log("item", item);
    if (item.linearId === this.props.url.query.linearId) {
      this.setState({
        resultTitle: "DOA approve",
        resultMsg: `Approve for invoice no. ${this.state.data.externalId} failed.`,
        errorMessage: err.error_message.message,
        isResultVisible: true,
        resultSucess: false,
        resultLoading: false
      });
    }

    GA.event({
      category: "DOA",
      action: " Delegate of Authorise Approve (Failed)",
      label: `DOA | ${this.state.data.externalId} | ${moment().format()}`
    });
  };

  socketFunction = () => {
    this.socket.on("success", this.setSuccessModal);
    this.socket.on("error", this.setFailModal);
  };

  componentDidMount() {
    this.socket = io.connect("/doa");

    GA.event({
      category: "DOA",
      action: " Delegate of Authorise Approve (Request)",
      label: `DOA | ${this.state.data.externalId} | ${moment().format()}`
    });

    this.socket.on("connect", this.socketFunction);
  }

  uploadFile = async files => {
    const uploadPromise = files.map(file => {
      const data = new FormData();
      data.append("file", file);
      return Api.postUploadFile(data);
    });
    const result = await Promise.all(uploadPromise);
    return result.map(uploadedFile => uploadedFile[0]);
  };

  sendApprove = async ({ files, reason, type }) => {
    const { original } = this.state;
    try {
      this.setState({
        resultLoading: true,
        resultTitle: "DOA approve"
      });
      this.toggleResultModal();
      const uploadedFileList = await this.uploadFile(files);
      const { token: accessToken } = this.props;
      this.socket.emit("approve", accessToken, [
        {
          linearId: this.props.url.query.linearId,
          buyerApprovedRemark: reason,
          fileAttachments: uploadedFileList.map(uploadedFile => ({
            ...uploadedFile,
            attachmentType: type
          })),
          items: original.items,
          documentType: "INVOICE"
        }
      ]);
    } catch (error) {
      console.log("err", error);
      try {
        const body = await error.json();
        this.setState({
          resultTitle: "DOA approve",
          resultMsg: `Approve for invoice no. ${this.state.data.externalId} failed.`,
          errorMessage: `${body.message}`,
          isResultVisible: true,
          resultSucess: false,
          resultLoading: false
        });
      } catch (e) {
        this.setState({
          resultTitle: "DOA approve",
          resultMsg: `Approve for invoice no. ${this.state.data.externalId} failed.`,
          errorMessage: [
            `${e.response.data.message}`,
            <br />,
            "Please contact your administrator."
          ],
          isResultVisible: true,
          resultSucess: false,
          resultLoading: false
        });
      }
    }
  };

  sendReject = async ({
    apiName,
    files,
    reason,
    headOfMessage,
    title,
    type
  }) => {
    const linearId = this.props.url.query.linearId;

    GA.event({
      category: "DOA",
      action: " Delegate of Authorise Reject (Request)",
      label: `DOA | ${this.state.data.externalId} | ${moment().format()}`
    });

    try {
      this.setState({
        resultLoading: true,
        resultTitle: title
      });
      this.toggleResultModal();
      const uploadedFileList = await this.uploadFile(files);
      const msg = await this.apis.call(
        apiName,
        {},
        {
          method: "put",
          data: {
            linearId: linearId,
            buyerRejectedRemark: reason,
            fileAttachments: uploadedFileList.map(uploadedFile => ({
              ...uploadedFile,
              attachmentType: type
            }))
          }
        }
      );

      const _this = this;
      msg.forEach(invoice => {
        if (invoice.linearId === linearId) {
          _this.setState({
            resultTitle: title,
            resultMsg: `${headOfMessage} for invoice no. ${this.state.data.externalId} completed.`,
            errorMessage: [],
            resultSucess: true,
            resultLoading: false,
            data: {
              ..._this.state.data,
              status: invoice.status,
              lifecycle: invoice.lifecycle
            }
          });

          GA.event({
            category: "DOA",
            action: " Delegate of Authorise Reject (Success)",
            label: `DOA | ${this.state.data.externalId} | ${moment().format()}`,
            value: reason
          });
        }
      });
    } catch (error) {
      this.setState({
        resultTitle: title,
        resultMsg: `${headOfMessage} for invoice no. ${this.state.data.externalId} failed.`,
        errorMessage: `${
          _.has(error, "response.data.message")
            ? error.response.data.message
            : ""
        }`,
        isResultVisible: true,
        resultSucess: false,
        resultLoading: false
      });

      GA.event({
        category: "DOA",
        action: " Delegate of Authorise Reject (Failed)",
        label: `DOA | ${this.state.data.externalId} | ${moment().format()}`,
        value: reason
      });
    }
  };

  onApprove = async () => {
    const prepareData = {
      files: this.state.approveFile,
      reason: this.state.approveReasonText,
      type: "DOAApprove"
    };
    await this.sendApprove(prepareData);
  };

  onReject = async () => {
    const prepareData = {
      apiName: "reject",
      files: this.state.rejectFile,
      reason: this.state.rejectReasonText,
      headOfMessage: "Reject",
      title: "DOA Reject",
      type: "DOAReject"
    };
    await this.sendReject(prepareData);
  };

  onApproveReasonChange = e => {
    this.setState({
      approveReasonText: e.target.value
    });
  };

  onApproveFileChange = files => {
    this.setState({
      approveFile: files
    });
  };
  toggleApproveModal = () => {
    this.setState({
      isApproveModalVisible: !this.state.isApproveModalVisible
    });
  };
  onRejectReasonChange = e => {
    this.setState({
      rejectReasonText: e.target.value
    });
  };

  onRejectFileChange = files => {
    this.setState({
      rejectFile: files
    });
  };
  toggleRejectModal = () => {
    this.setState({
      isRejectModalVisible: !this.state.isRejectModalVisible
    });
  };
  toggleResultModal = () => {
    if (this.state.isResultVisible && this.state.resultSucess) {
      Router.push("/waiting-doa-approval");
    }
    this.setState({
      isResultVisible: !this.state.isResultVisible
    });
  };
  requestResubmit = () => {};
  formatCurrency(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  }

  resolvePermission() {
    let isAllowButtion = false;
    let isNotRunMatching = false;
    const { data } = this.state;
    if (
      lifecycleTag.includes(data.lifecycle) &&
      this.props.permisions.includes("DOA-Approval") &&
      this.props.user.organisationUnit === "BUYER"
    ) {
      isAllowButtion = true;
    }

    if (lifecycleForNotRunMatching.includes(this.state.data.lifecycle)) {
      isNotRunMatching = true;
    }

    this.setState({
      isAllowButtion,
      isNotRunMatching
    });
  }

  renderMatchingDetail = () => {
    const matchingDetailList = this.state.matchingDetail;
    const { data, itemFilter } = this.state;
    return matchingDetailList
      .filter(item => {
        return (
          itemFilter === "All" ||
          itemFilter === item.matchedStatus ||
          (itemFilter === "matched" &&
            item.matchedStatus === "matchedWithThreshold")
        );
      })
      .filter(item => {
        return item.checked;
      })
      .map((matchingDetail, index) => (
        <ThreeWayMatchingItem
          id="matchingItem"
          index={index}
          data={matchingDetail}
          canSelectGr
          matchingType="doa"
          lifecycleForNotRunMatching={lifecycleForNotRunMatching}
          lifecycleTag={lifecycleTag}
          lifeCycle={data.lifecycle}
          permission="Invoice-Tag-Goods-Received"
          invoiceLinearId={this.props.url.query.linearId}
          linearId={matchingDetail.purchaseItemLinearId}
          auth={this.state.UserAuthority}
          userType={this.props.user.organisationUnit}
          reloadPageAfterTaggedGR={this.fetchData}
          getTagGR={this.getTagGR}
          submitTagGr={this.submitTagGr}
          notRunMatching={this.state.isNotRunMatching}
          externalId={data.externalId}
        />
      ));
  };

  componentWillUnmount() {
    this.socket.disconnect();
  }

  onFilter = matchingDetail => {
    this.setState({
      matchingDetail
    });
  };

  renderSubHead = (unmatchedType, value) => {
    const { data } = this.state;
    if (data.unmatchedCode.includes(unmatchedType)) {
      return <strong className="text-danger">{`${value} Unmatched`}</strong>;
    }
    if (data.matchedCode[unmatchedType] === "IN_TOLERANCE") {
      return (
        <strong
          style={this.style.matchedWithinThreshold}
        >{`${value}  Matched`}</strong>
      );
    }
    return (
      <strong style={this.style.matchedColor}>{`${value} Matched`}</strong>
    );
  };

  renderSubText = (unmatchedType, value) => {
    const { data } = this.state;
    if (data.unmatchedCode.includes(unmatchedType)) {
      return <p className="text-danger">{value}</p>;
    }
    if (data.matchedCode[unmatchedType] === "IN_TOLERANCE") {
      return <p style={this.style.matchedWithinThreshold}>{value}</p>;
    }
    return <p style={this.style.matchedColor}>{value}</p>;
  };

  render() {
    const { t } = this.props;
    const {
      invoiceNumber,
      invoiceDetailData,
      isAllowCancel,
      isAllowEdit,
      isAllowHold,
      isNotRunMatching,
      invoiceFinancingChecked,
      configuration,
      isAllowReviseDueDate,
      errCaseMsg,
      isAllowInvoiceFinancing,
      isAlertModalVisible,
      alertModalAlertTitle,
      alertModalMsg,
      isTextOnly,
      buttonAlert,
      isMainSectionBlock,
      isApproveModalVisible,
      isRejectModalVisible,
      resultTitle,
      buttonResultAlert,
      isResultVisible,
      isAlertVisible,
      files,
      resultMsg,
      resultSucess,
      errorMessage,
      isAllowButtion,
      configFileApprove,
      configFileReject,
      itemFilter,
      matchingDetail,
      data,
      resultLoading,
      original
    } = this.state;
    const {
      customisedFields,
      paymentItemLinearId
    } = this.state.invoiceDetailData;

    let breadcrumbs = [
      { title: "Waiting DOA Approval", url: "/waiting-doa-approval" },
      {
        title: `Invoice No. ${!!data.externalId ? data.externalId : "-"}`,
        active: true
      }
    ];

    return (
      <Layout {...this.props}>
        <PageHeader
          title={`Invoice No. ${!!data.externalId ? data.externalId : "-"}`}
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <BlockUi tag="div" blocking={isMainSectionBlock}>
          <div
            id="mobilePageNav"
            className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
          >
            <a href="/waiting-doa-approval">
              <strong className="purple">
                <i className="fa fa-chevron-left" /> {t("Waiting DOA Approval")}
              </strong>
            </a>
          </div>
          <section id="invoice_detail_page" className="box box--width-header">
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                <div className="col-4 px-0 px-lg-3">
                  {""}
                  Entry Date : {""}
                  {data.entryDate
                    ? moment(data.entryDate).format("DD/MM/YYYY")
                    : "-"}
                </div>
                <div className="col-8 px-0 px-lg-3 text-right">
                  {" "}
                  3 Way Matching Status : <br className="d-block d-lg-none" />
                  <strong className="purple mr-2">{data.matchingStatus}</strong>
                  <div className="d-none d-lg-flex justify-content-end pt-3">
                    {isAllowButtion && (
                      <DVButton
                        name="btnCancel"
                        label="Reject"
                        transparent="true"
                        onClick={this.toggleRejectModal}
                      />
                    )}
                    {isAllowButtion && (
                      <DVButton
                        name="btnHold"
                        label="Approve"
                        transparent="false"
                        onClick={this.toggleApproveModal}
                      />
                    )}
                  </div>
                </div>
                <div className="col-12 px-0 text-left d-flex d-lg-none mt-3">
                  {isAllowButtion && (
                    <DVButton
                      name="btnCancel"
                      label="Reject"
                      transparent="true"
                      onClick={this.toggleRejectModal}
                    />
                  )}
                  {isAllowButtion && (
                    <DVButton
                      name="btnHold"
                      label="Approve"
                      transparent="false"
                      onClick={this.toggleApproveModal}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="box__inner">
              {/* Desktop Version - Start */}
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={["Vendor", "Company"]}
                className="d-none d-lg-flex flex-wrap"
              >
                <div className="row">
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label="Code"
                      value={data.vendor.vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label="Name"
                      value={data.vendor.vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tax ID"
                      value={data.vendor.vendorTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label="Branch"
                      value={data.vendor.vendorBranchCode}
                    />
                    <CollapseItemText
                      t={t}
                      label="Address"
                      value={data.vendor.vendorAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tel"
                      value={data.vendor.vendorTelephone}
                    />
                  </div>
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label="Code"
                      value={data.company.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label="Name"
                      value={data.company.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tax ID"
                      value={data.company.companyTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label="Branch"
                      value={`${data.company.companyBranchCode} - ${data.company.companyBranchName}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Address"
                      value={data.company.companyAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tel"
                      value={data.company.companyTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Desktop Version - End */}

              {/* Mobile Version - Start */}
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={["Vendor"]}
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="row">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label="Code"
                      value={data.vendor.vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label="Name"
                      value={data.vendor.vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tax ID"
                      value={data.vendor.vendorTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label="Branch"
                      value={data.vendor.vendorBranchCode}
                    />
                    <CollapseItemText
                      t={t}
                      label="Address"
                      value={data.vendor.vendorAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tel"
                      value={data.vendor.vendorTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              <Collapse
                id="CompanyInfo"
                expanded="true"
                collapseHeader={["Company"]}
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="row">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label="Code"
                      value={data.company.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label="Name"
                      value={data.company.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tax ID"
                      value={data.company.companyTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label="Branch"
                      value={`${data.company.companyBranchCode} - ${data.company.companyBranchName}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Address"
                      value={data.company.companyAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tel"
                      value={data.company.companyTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Mobile Version - End */}

              <Collapse
                id="paymentInfo"
                expanded="true"
                collapseHeader={["Payment Information"]}
              >
                {/* Desktop Version - Start */}
                <div className="row d-none d-lg-flex">
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label="Invoice Date"
                      value={
                        data.paymentinfo.invoiceDate
                          ? moment(data.paymentinfo.invoiceDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Payment Term Description"
                      value={data.paymentinfo.paymentTermDesc}
                    />
                    <CollapseItemText
                      t={t}
                      label="Payment Date"
                      value={
                        data.paymentinfo.paymentDate
                          ? moment(data.paymentinfo.paymentDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />

                    <CollapseItemText
                      t={t}
                      label="Invoice Financing"
                      value={
                        data.paymentinfo.invoiceFinancing === "Y" ? "Yes" : "No"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Send to CMS"
                      value={
                        data.paymentinfo.customisedFields &&
                        data.paymentinfo.customisedFields.CMS
                          ? "Yes"
                          : "No"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Send to Bank"
                      value={
                        data.paymentinfo.paymentItemLinearId ? "Yes" : "No"
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label="Sub Total"
                      value={`${this.formatCurrency(
                        data.paymentinfo.subTotal
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tax Total"
                      value={`${this.formatCurrency(
                        data.paymentinfo.vatTotal
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Invoice Amount (Inc. TAX)"
                      value={`${this.formatCurrency(
                        data.paymentinfo.invoiceTotal
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="WHT Pre-calculated Amount"
                      value={`${this.formatCurrency(
                        original.withholdingTaxTotal,
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Retention Amount"
                      value={`${this.formatCurrency(
                        data.paymentinfo.retentionAmount,
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Estimated Invoice Payable"
                      value={`${this.formatCurrency(
                        data.paymentinfo.estimatedPayable,
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Due Date"
                      value={
                        data.paymentinfo.dueDate
                          ? moment(data.paymentinfo.dueDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Revised Payment Due Date"
                      value={
                        data.paymentinfo.revisedDueDate
                          ? moment(data.paymentinfo.revisedDueDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Last Edited By"
                      value={data.paymentinfo.dueDateLastEditedBy}
                    />
                    <CollapseItemText
                      t={t}
                      label="Last Edited Date"
                      value={
                        data.paymentinfo.lastMatchUpdatedDate
                          ? moment(
                              data.paymentinfo.lastMatchUpdatedDate
                            ).format("DD/MM/YYYY")
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Last Edited Reason"
                      value={data.paymentinfo.dueDateLastEditedReason}
                    />
                  </div>
                </div>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <div className="row d-flex d-lg-none flex-wrap">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label="Invoice Date"
                      colLabel="6"
                      value={
                        data.paymentinfo.invoiceDate
                          ? moment(data.paymentinfo.invoiceDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Payment Term Description"
                      colLabel="6"
                      value={data.paymentinfo.paymentTermDesc}
                    />
                    <CollapseItemText
                      t={t}
                      label="Payment Date"
                      colLabel="6"
                      value={
                        data.paymentinfo.paymentDate
                          ? moment(data.paymentinfo.paymentDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />

                    <CollapseItemText
                      t={t}
                      label="Invoice Financing"
                      colLabel="6"
                      value={
                        data.paymentinfo.invoiceFinancing === "Y" ? "Yes" : "No"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Send to CMS"
                      colLabel="6"
                      value={
                        data.paymentinfo.customisedFields &&
                        data.paymentinfo.customisedFields.CMS
                          ? "Yes"
                          : "No"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Send to Bank"
                      colLabel="6"
                      value={
                        data.paymentinfo.paymentItemLinearId ? "Yes" : "No"
                      }
                    />
                  </div>
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label="Revised Payment Due Date"
                      colLabel="6"
                      value={
                        data.paymentinfo.revisedDueDate
                          ? moment(data.paymentinfo.revisedDueDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Sub Total"
                      colLabel="6"
                      value={`${this.formatCurrency(
                        data.paymentinfo.subTotal
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Tax Total"
                      colLabel="6"
                      value={`${this.formatCurrency(
                        data.paymentinfo.vatTotal
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Invoice Amount (Inc. TAX)"
                      colLabel="6"
                      value={`${this.formatCurrency(
                        data.paymentinfo.invoiceTotal
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="WHT Pre-calculated Amount"
                      colLabel="6"
                      value={`${this.formatCurrency(
                        original.withholdingTaxTotal,
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Retention Amount"
                      colLabel="6"
                      value={`${this.formatCurrency(
                        data.paymentinfo.retentionAmount,
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Estimated Invoice Payable"
                      colLabel="6"
                      value={`${this.formatCurrency(
                        data.paymentinfo.estimatedPayable,
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label="Due Date"
                      colLabel="6"
                      value={
                        data.paymentinfo.dueDate
                          ? moment(data.paymentinfo.dueDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Revised Payment Due Date"
                      value={
                        data.paymentinfo.revisedDueDate
                          ? moment(data.paymentinfo.revisedDueDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />

                    <CollapseItemText
                      t={t}
                      label="Last Edited By"
                      colLabel="6"
                      value={data.paymentinfo.dueDateLastEditedBy}
                    />
                    <CollapseItemText
                      t={t}
                      label="Last Edited Date"
                      colLabel="6"
                      value={
                        data.paymentinfo.lastMatchUpdatedDate
                          ? moment(
                              data.paymentinfo.lastMatchUpdatedDate
                            ).format("DD/MM/YYYY")
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Last Edited Reason"
                      colLabel="6"
                      value={data.paymentinfo.dueDateLastEditedReason}
                    />
                  </div>
                </div>
                {/* Mobile Version - End */}
              </Collapse>
              <Collapse
                id="attachmentLists"
                expanded="false"
                collapseHeader={["Attachments"]}
              >
                <div className="row">
                  <div className="col-12 col-lg-6">
                    <CollapseItemExternalLink
                      label="Attach Tax Invoice"
                      value={
                        data.attachments.fileAttachmentsTaxInvoice.length > 0
                          ? data.attachments.fileAttachmentsTaxInvoice
                          : "-"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label="Receipt No."
                      value={data.attachments.receiptNumber}
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <CollapseItemExternalLink
                      label="Attach Delivery Note"
                      value={
                        data.attachments.fileAttachmentsDeliveryNote.length > 0
                          ? data.attachments.fileAttachmentsDeliveryNote
                          : "-"
                      }
                    />
                    <CollapseItemExternalLink
                      label="Attach Receipt"
                      value={
                        data.attachments.fileAttachmentsReceipt.length > 0
                          ? data.attachments.fileAttachmentsReceipt
                          : "-"
                      }
                    />
                    <CollapseItemExternalLink
                      label="Attach Other Documents"
                      value={
                        data.attachments.fileAttachmentsOther.length > 0
                          ? data.attachments.fileAttachmentsOther
                          : "-"
                      }
                    />
                  </div>
                </div>
              </Collapse>
              <div
                hidden={isNotRunMatching}
                id="amountMatching"
                className={`row box ${
                  data.unmatchedCode.filter(item => {
                    return (
                      item === "TOTAL_AMOUNT" ||
                      item === "VAT_TOTAL" ||
                      item === "SUB_TOTAL"
                    );
                  }).length
                    ? "danger-panel"
                    : ""
                }`}
              >
                <div className="col-12 btnToggle">
                  <h3 className="border-bottom gray-1">Amount Matching</h3>
                </div>

                {/* Desktop Version - Start */}
                <div id="matchingStatus" className="col-12 d-none d-lg-flex">
                  <div className="col-3">
                    <p className="indicator mt-3">
                      <p>Status</p>
                    </p>
                    <p className="indicator d-flex">
                      {this.renderSubHead("VAT_TOTAL", "TAX Total Unmatched")}
                    </p>
                    <p className="indicator">
                      {this.renderSubHead("SUB_TOTAL", "Sub Total Unmatched")}
                    </p>
                    <p className="indicator">
                      {this.renderSubHead(
                        "TOTAL_AMOUNT",
                        "Total Amount Unmatched"
                      )}
                    </p>
                  </div>
                  <div className="col-3 text-right">
                    <p className="indicator mt-3">
                      Calculated by System Amount
                    </p>
                    {this.renderSubText(
                      "VAT_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.taxTotal.systemAmount,
                        2
                      )} ${data.currency}`
                    )}
                    {this.renderSubText(
                      "SUB_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.subTotal.systemAmount,
                        2
                      )} ${data.currency}`
                    )}
                    {this.renderSubText(
                      "TOTAL_AMOUNT",
                      `${this.formatCurrency(
                        data.amountMatching.totalAmount.systemAmount,
                        2
                      )} ${data.currency}`
                    )}
                  </div>
                  <div className="col-3 text-right">
                    <p className="indicator mt-3">Amount in Invoice</p>
                    {this.renderSubText(
                      "VAT_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.taxTotal.invoiceAmount,
                        2
                      )} ${data.currency}`
                    )}
                    {this.renderSubText(
                      "SUB_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.subTotal.invoiceAmount,
                        2
                      )} ${data.currency}`
                    )}
                    {this.renderSubText(
                      "TOTAL_AMOUNT",
                      `${this.formatCurrency(
                        data.amountMatching.totalAmount.invoiceAmount,
                        2
                      )} ${data.currency}`
                    )}
                  </div>
                  <div className="col-3 text-right">
                    <p className="indicator mt-3">Diff Amount</p>
                    {this.renderSubText(
                      "VAT_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.taxTotal.diffAmount,
                        2
                      )} ${data.currency}`
                    )}
                    {this.renderSubText(
                      "SUB_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.subTotal.diffAmount,
                        2
                      )} ${data.currency}`
                    )}
                    {this.renderSubText(
                      "TOTAL_AMOUNT",
                      `${this.formatCurrency(
                        data.amountMatching.totalAmount.diffAmount,
                        2
                      )} ${data.currency}`
                    )}
                  </div>
                </div>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <div
                  id="matchingStatus"
                  className="col-12 d-flex flex-wrap d-lg-none"
                >
                  {/* Header - Start */}
                  <div className="col-6">
                    <p className="indicator mt-3">Status</p>
                  </div>
                  <div className="col-4 text-center">
                    <p className="indicator mt-3">Diff Amount</p>
                  </div>
                  <div className="col-2 text-center">
                    <p className="indicator mt-3">More</p>
                  </div>
                  {/* Header - End */}

                  {/* Row 1 - Start */}
                  <div className="col-6">
                    <p className="indicator d-flex">
                      {this.renderSubHead("VAT_TOTAL", "TAX Total Unmatched")}
                    </p>
                  </div>
                  <div className="col-4 text-right align-self-center">
                    {this.renderSubText(
                      "VAT_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.taxTotal.diffAmount,
                        2
                      )} ${data.currency}`
                    )}
                  </div>
                  <div className="col-2 text-center align-self-center">
                    <p>
                      <a
                        href={`#amountMatching-vatTotal`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#amountMatching-vatTotal`}
                        className="d-flex w-100 purple btnDetailToggle"
                      >
                        <strong className="textOnHide">
                          <i className="fa fa-ellipsis-h purple mx-auto" />
                        </strong>
                        <strong className="textOnShow">
                          <i className="fa fa-times purple mx-auto" />
                        </strong>
                      </a>
                    </p>
                  </div>
                  <div
                    id="amountMatching-vatTotal"
                    className="col-12 collapse multi-collapse px-0 pb-3"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-6 pr-0">
                        Calculated by System Amount
                      </div>
                      <div className="col-6">
                        {this.renderSubText(
                          "VAT_TOTAL",
                          `${this.formatCurrency(
                            data.amountMatching.taxTotal.systemAmount,
                            2
                          )} ${data.currency}`
                        )}
                      </div>
                      <div className="col-6 pr-0">Amount in Invoice</div>
                      <div className="col-6">
                        {this.renderSubText(
                          "VAT_TOTAL",
                          `${this.formatCurrency(
                            data.amountMatching.taxTotal.invoiceAmount,
                            2
                          )} ${data.currency}`
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Row 1 - End */}

                  {/* Row 2 - Start */}
                  <div className="col-6">
                    <p className="indicator">
                      {this.renderSubHead("SUB_TOTAL", "Sub Total Unmatched")}
                    </p>
                  </div>
                  <div className="col-4 text-right align-self-center">
                    {this.renderSubText(
                      "SUB_TOTAL",
                      `${this.formatCurrency(
                        data.amountMatching.subTotal.diffAmount,
                        2
                      )} ${data.currency}`
                    )}
                  </div>
                  <div className="col-2 text-center align-self-center">
                    <p>
                      <a
                        href={`#amountMatching-subTotal`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#amountMatching-subTotal`}
                        className="d-flex w-100 purple btnDetailToggle"
                      >
                        <strong className="textOnHide">
                          <i className="fa fa-ellipsis-h purple mx-auto" />
                        </strong>
                        <strong className="textOnShow">
                          <i className="fa fa-times purple mx-auto" />
                        </strong>
                      </a>
                    </p>
                  </div>
                  <div
                    id="amountMatching-subTotal"
                    className="col-12 collapse multi-collapse px-0 pb-3"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-6 pr-0">
                        Calculated by System Amount
                      </div>
                      <div className="col-6">
                        {this.renderSubText(
                          "SUB_TOTAL",
                          `${this.formatCurrency(
                            data.amountMatching.subTotal.systemAmount,
                            2
                          )} ${data.currency}`
                        )}
                      </div>
                      <div className="col-6 pr-0">Amount in Invoice</div>
                      <div className="col-6">
                        {this.renderSubText(
                          "SUB_TOTAL",
                          `${this.formatCurrency(
                            data.amountMatching.subTotal.invoiceAmount,
                            2
                          )} ${data.currency}`
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Row 2 - End */}

                  {/* Row 3 - Start */}
                  <div className="col-6">
                    <p className="indicator">
                      {this.renderSubHead(
                        "TOTAL_AMOUNT",
                        "Total Amount Unmatched"
                      )}
                    </p>
                  </div>
                  <div className="col-4 text-right align-self-center">
                    {this.renderSubText(
                      "TOTAL_AMOUNT",
                      `${this.formatCurrency(
                        data.amountMatching.totalAmount.diffAmount,
                        2
                      )} ${data.currency}`
                    )}
                  </div>
                  <div className="col-2 text-center align-self-center">
                    <p>
                      <a
                        href={`#amountMatching-totalAmount`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#amountMatching-totalAmount`}
                        className="d-flex w-100 purple btnDetailToggle"
                      >
                        <strong className="textOnHide">
                          <i className="fa fa-ellipsis-h purple mx-auto" />
                        </strong>
                        <strong className="textOnShow">
                          <i className="fa fa-times purple mx-auto" />
                        </strong>
                      </a>
                    </p>
                  </div>
                  <div
                    id="amountMatching-totalAmount"
                    className="col-12 collapse multi-collapse px-0 pb-3"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-6 pr-0">
                        Calculated by System Amount
                      </div>
                      <div className="col-6">
                        {this.renderSubText(
                          "TOTAL_AMOUNT",
                          `${this.formatCurrency(
                            data.amountMatching.totalAmount.systemAmount,
                            2
                          )} ${data.currency}`
                        )}
                      </div>
                      <div className="col-6 pr-0">Amount in Invoice</div>
                      <div className="col-6">
                        {this.renderSubText(
                          "TOTAL_AMOUNT",
                          `${this.formatCurrency(
                            data.amountMatching.totalAmount.invoiceAmount,
                            2
                          )} ${data.currency}`
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Row 3 - End */}
                </div>
                {/* Mobile Version - End */}
              </div>
            </div>
          </section>
          <section
            id="invoice_detail_page"
            className="box box--width-header px-0 px-lg-3 pb-0"
          >
            <div className="box__header px-3">
              <Collapse
                id="actionHistory"
                expanded="true"
                collapseHeader={["Action History"]}
                className="mb-0"
              >
                {/* Desktop Version - Start */}
                <div className="table_wrapper d-none d-lg-inline-block">
                  <div className="table-responsive">
                    <table className="table table-3 dataTable">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Date/Time</th>
                          <th>Modified By</th>
                          <th>Reason</th>
                          <th>Attach File</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.actionHistory.length > 0 ? (
                          data.actionHistory
                            .sort(
                              (a, b) =>
                                moment(b.actionDate).unix() -
                                moment(a.actionDate).unix()
                            )
                            .map(i => {
                              return (
                                <tr>
                                  <td>{i.actionName}</td>
                                  <td>
                                    {moment(i.actionDate).format(
                                      "DD/MM/YYYY HH:mm:ss"
                                    )}
                                  </td>
                                  <td>{i.actionBy}</td>
                                  <td>{i.remark}</td>
                                  <td>
                                    <CollapseHistoryExternalLink
                                      value={
                                        i.attachmentFile
                                          ? i.attachmentFile
                                          : "-"
                                      }
                                    />
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">
                              No Item Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <div className="table-wrapper d-inline-block d-lg-none">
                  <div className="table-responsive">
                    <table className="table table-3 dataTable">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Date/Time</th>
                          <th>More</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.actionHistory.length > 0 ? (
                          data.actionHistory
                            .sort(
                              (a, b) =>
                                moment(b.actionDate).unix() -
                                moment(a.actionDate).unix()
                            )
                            .map((i, index) => {
                              return (
                                <React.Fragment>
                                  <tr>
                                    <td>{i.actionName}</td>
                                    <td>
                                      {moment(i.actionDate).format(
                                        "DD/MM/YYYY HH:mm:ss"
                                      )}
                                    </td>
                                    <td>
                                      <a
                                        href={`#actionHistory-detail-${index}`}
                                        data-toggle="collapse"
                                        role="button"
                                        aria-expanded="false"
                                        area-controls={`#actionHistory-detail-${index}`}
                                        className="d-flex w-100 purple btnTableToggle"
                                      >
                                        <strong className="textOnHide">
                                          <i className="fa fa-ellipsis-h purple mx-auto" />
                                        </strong>
                                        <strong className="textOnShow">
                                          <i className="fa fa-times purple mx-auto" />
                                        </strong>
                                      </a>
                                    </td>
                                  </tr>
                                  <tr
                                    id={`actionHistory-detail-${index}`}
                                    className="collapse multi-collapse"
                                  >
                                    <td colspan="3">
                                      <div className="d-flex flex-wrap w-100">
                                        <div className="col-6 px-0 py-3 text-right">
                                          <strong>By (Position Name):</strong>
                                        </div>
                                        <div className="col-6 py-3">
                                          {i.actionBy}
                                        </div>
                                        <div className="col-6 px-0 text-right">
                                          <strong>Reason:</strong>
                                        </div>
                                        <div className="col-6 py-3">
                                          {i.remark}
                                        </div>
                                        <div className="col-6 px-0 text-right">
                                          <strong>Attach File:</strong>
                                        </div>
                                        <div className="col-6">
                                          <CollapseHistoryExternalLink
                                            value={
                                              i.attachmentFile
                                                ? i.attachmentFile
                                                : "-"
                                            }
                                          />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">
                              No Item Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Mobile Version - End */}
              </Collapse>
            </div>
          </section>
          <section
            id="invoice_detail_page"
            className="three_wm_detail box box--width-header"
          >
            <div className="box__header pb-0 pb-lg-3">
              <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                <div className="col-12 col-lg-6">
                  <h3 className="mb-0 mb-lg-1">Matching Details</h3>
                </div>
                <div className="col-6 d-none d-lg-flex flex-wrap justify-content-end align-items-center">
                  <div className="filter col-8 d-flex justify-content-end">
                    <strong className="mr-3">Filter:</strong>
                    <a
                      href="javascript:void(0);"
                      className={itemFilter === "All" ? "active" : ""}
                      onClick={() => {
                        this.setState({ itemFilter: "All" });
                      }}
                    >
                      All
                    </a>
                    <a
                      href="javascript:void(0);"
                      className={itemFilter === "unmatched" ? "active" : ""}
                      onClick={() => {
                        this.setState({ itemFilter: "unmatched" });
                      }}
                    >
                      Unmatched
                    </a>
                    <a
                      href="javascript:void(0);"
                      className={itemFilter === "matched" ? "active" : ""}
                      onClick={() => {
                        this.setState({ itemFilter: "matched" });
                      }}
                    >
                      Matched
                    </a>
                  </div>
                  <div className="searchBox input-append-icon col-4">
                    <MatchDetailSearch
                      matchingDetail={matchingDetail.filter(item => {
                        return (
                          itemFilter === "All" ||
                          itemFilter === item.matchedStatus
                        );
                      })}
                      onFilter={this.onFilter}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="box__inner">{this.renderMatchingDetail()}</div>
          </section>
        </BlockUi>
        <ModalDropFile
          title={"DOA Approve"}
          isVisible={isApproveModalVisible}
          onFileChange={this.onApproveFileChange}
          onReasonChange={this.onApproveReasonChange}
          onCancelButton={this.toggleApproveModal}
          onSubmitButton={this.onApprove}
          configFile={configFileApprove}
        />
        <ModalDropFile
          title={"DOA Reject"}
          isVisible={isRejectModalVisible}
          onFileChange={this.onRejectFileChange}
          onReasonChange={this.onRejectReasonChange}
          isReasonRequire={true}
          onCancelButton={this.toggleRejectModal}
          onSubmitButton={this.onReject}
          configFile={configFileReject}
        />
        <ModalAlert
          title={resultTitle}
          isTextOnly={true}
          visible={isResultVisible}
          button={resultLoading ? [] : buttonResultAlert}
        >
          <div className="text-center">
            {resultLoading ? (
              <div>
                Processing <i className="fa fa-spinner fa-spin" />
              </div>
            ) : (
              <React.Fragment>
                <i
                  className={`fa ${
                    resultSucess ? "fa-check-circle" : "fa-exclamation-triangle"
                  }`}
                  style={{ color: "rgb(175, 54, 148)", fontSize: "100px" }}
                />
                <div>{resultMsg}</div>
                <div>{errorMessage}</div>
              </React.Fragment>
            )}
          </div>
        </ModalAlert>
      </Layout>
    );
  }
}

export default withAuth(withTranslation(["menu"])(testDetail));
