import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import io from "socket.io-client";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import "../libs/mycools";
import BlockUi from "react-block-ui";
import ModalAlert, { BTN_ACTION_BACK } from "../components/modalAlert";
import ModalDropFile from "../components/modalDropFile";
import MatchDetailSearch from "../components/matchDetailPopover/matchDetailSearch";
import MatchDetailPopover from "../components/matchDetailPopover/matchDetailPopover";
import statusColor from "../configs/color.3wm.json";
import ThreeWayMatchingItem from "../components/threeWayMatchingItem";
import { i18n, withTranslation } from "~/i18n";
import handleError from "./handleError";
import {
  PageHeader,
  Collapse,
  CollapseItemText,
  CollapseItemExternalLink,
  MatchingItem,
  CollapseHistoryExternalLink
} from "../components/page";
import GA from "~/libs/ga";

const Api = new ApiService();
const lifecycleApprove = ["UNMATCHED"];
const lifecycleClarify = ["PENDING_BUYER"];
const lifecycleReject = ["UNMATCHED", "PENDING_BUYER", "PARTIAL", "MISSING"];
const lifecycleTag = ["PARTIAL", "MISSING", "UNMATCHED"];
const lifecycleForNotRunMatching = ["ISSUED", "PENDING_SELLER", "CANCELLED"];

class ThreeWayMatchingDetail extends Component {
  constructor(props) {
    super(props);
    this.reloadPageAfterTaggedGR = this.reloadPageAfterTaggedGR.bind(this);
    this.apiThreshold = new api().group("thresholdPopup");
    this.apis = new api().group("threeWayMatching");
    this.socket = io.connect("/twmdetail");
    this.style = {
      matchedWithinThreshold: {
        color: "#ff981c"
      },
      matchedColor: {
        color: "#7cec00"
      }
    };
    this.state = {
      linearId: "",
      UserAuthority: [],
      data: {
        matchedCode: {},
        unmatchedCode: [],
        vendor: {},
        company: {},
        actionHistory: [],
        externalId: "",
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
        unmatchedCode: []
      },
      original: {},
      matchingDetail: [],
      configuration: {},
      isAllowApprove: false,
      isAllowReject: false,
      isAllowClarify: false,
      isInProgress: false,
      isNotRunMatching: true,
      isRemark: false,
      isBlock: true,
      itemFilter: "All",
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      buttonAlertApprove: [],
      alertModalMsg: "",
      buttonAlert: [],
      isTextOnly: true,
      isMainSectionBlock: true,
      isMatchingDetailSectionBlock: true,
      isActionHistorySectionBlock: true,
      isApproveModalVisible: false,
      isRejectModalVisible: false,
      isClarifyModalVisible: false,
      isEnabledApprove: false,
      approveReasonText: "",
      approveFile: [],
      rejectReasonText: "",
      rejectFile: [],
      clarifyReasonText: "",
      clarifyFile: [],
      isResultVisible: false,
      buttonResultAlert: [],
      resultTitle: "",
      resultMsg: "",
      resultSucess: false,
      errorMessage: "",
      waitingProcessTitle: "",
      waitingProcessMsg: "",
      isWaitingProcessModalVisible: false,
      buttonWaitingProcess: "",
      isGrTableVisible: false,
      buttonGrTable: [],
      configFileApprove: {},
      configFileReject: {},
      configFileClarify: {},
      oldFileAttachments: [],
      resultLoading: false,
      maxValue: 0,
      minValue: 0
    };
    this.BTN_CLOSE = [
      {
        label: "Close",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: this.handleDismissBtnModal
        }
      }
    ];
  }

  componentDidMount() {
    try {
      this.loadPage();

      if (this.props.appenv.THREEWM_DETAIL_APPROVE_SYNC === false) {
        const linearId = this.props.url.query.linearId;
        this.socket
          .on("connect", function() {
            console.log("connect");
          })
          .on("queue", function(queue) {
            queue.map(q => {
              console.log("q", q);
            });
          });
        const _this = this;
        this.socket.on("queue", function(queueArray) {
          if (queueArray.find(q => q.linearId === linearId)) {
            _this.hideApprovalButton();
          }
        });
        this.socket.on("success", function(response, processItem) {
          if (processItem && processItem.linearId === linearId) {
            _this.fetchData();
            _this.setState({ isInProgress: false });
          }
        });
        this.socket.on("error", function(response, errorItem) {
          if (errorItem && errorItem.linearId === linearId) {
            _this.enableApprovalButton();
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  hideApprovalButton() {
    this.setState({
      isInProgress: true,
      isAllowApprove: false,
      isAllowReject: false
    });
  }

  enableApprovalButton() {
    this.setState({
      isInProgress: false,
      isAllowApprove: true,
      isAllowReject: true
    });
  }

  loadPage = async () => {
    await this.permissionPage();
    await this.setPermission();
    await this.fetchData();
  };

  componentWillUnmount() {
    this.socket.disconnect();
  }

  permissionPage = () => {
    const { permisions } = this.props;
    if (!permisions.includes("3WM-Detail")) {
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
      const res = await this.apis.call("detail", {
        linearId: this.props.url.query.linearId
      });

      const config = await this.apis.call("fileConfig", {
        legalName: res.original.buyer.legalName,
        companyTaxId: res.original.companyTaxNumber,
        vendorTaxId: res.original.vendorTaxNumber
      });

      const configFileApprove = config.attachmentConfiguration.filter(
        configFile => configFile.attachmentType === "BuyerApprove"
      )[0];
      const configFileReject = config.attachmentConfiguration.filter(
        configFile => configFile.attachmentType === "BuyerReject"
      )[0];
      const configFileClarify = config.attachmentConfiguration.filter(
        configFile => configFile.attachmentType === "BuyerClarify"
      )[0];

      const oldFileAttachments = res.original.fileAttachments.map(file => ({
        attachmentHash: file.attachmentHash,
        attachmentName: file.attachmentName,
        attachmentType: file.attachmentType
      }));
      this.setState({
        linearId: this.props.url.query.linearId,
        data: res.data,
        original: res.original,
        matchingDetail: res.data.matchingDetail.map(item => ({
          ...item,
          checked: true
        })),
        configFileApprove,
        configFileReject,
        configFileClarify,
        oldFileAttachments,
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

      let configOption =
        "MIN_GOODS_RECEIVED_QUANTITY_AGAINST_INVOICE_ITEM_THRESHOLD";
      let configDetail = await this.getConfig(configOption);
      let minValue = configDetail[0] ? configDetail[0].value : 0;
      configOption =
        "MAX_GOODS_RECEIVED_QUANTITY_AGAINST_INVOICE_ITEM_THRESHOLD";
      configDetail = await this.getConfig(configOption);
      let maxValue = configDetail[0] ? configDetail[0].value : 0;

      this.setState({
        maxValue,
        minValue
      });

      this.resolvePermission();
      this.isOutOfTolerance();

      this.setState({
        isMainSectionBlock: false,
        isMatchingDetailSectionBlock: false,
        isActionHistorySectionBlock: false
      });
    } catch (err) {
      console.error(err);
      const message = [
        "Sorry, you cannot get detail of this three way matching.",
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
    }
  };

  async reloadPageAfterTaggedGR() {
    const res = await this.apis.call("detail", {
      linearId: this.props.url.query.linearId
    });

    this.setState({
      linearId: this.props.url.query.linearId,
      data: res.data
    });
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

  sendData = async ({ apiName, files, reason, headOfMessage, title, type }) => {
    const aToken = this.props.token;

    GA.event({
      category: "3WM",
      action: "3WM Approve (Request)",
      label: `3WM | ${this.state.original.externalId} | ${moment().format()}`
    });

    try {
      this.setState({
        isMainSectionBlock: true,
        isMatchingDetailSectionBlock: true,
        isActionHistorySectionBlock: true,
        resultLoading: true
      });

      this.toggleResultModal();

      const { original } = this.state;
      const uploadedFileList = await this.uploadFile(files);
      const newFileAttachments = uploadedFileList.map(uploadedFile => ({
        ...uploadedFile,
        attachmentType: type
      }));
      let ReqObj;
      if (type === "BuyerApprove") {
        ReqObj = {
          method: "put",
          data: {
            linearId: this.props.url.query.linearId,
            buyerApprovedRemark: reason,
            fileAttachments: [...newFileAttachments]
            //items: original.items
          }
        };
      } else if (type === "BuyerClarify") {
        ReqObj = {
          method: "put",
          data: {
            linearId: this.props.url.query.linearId,
            buyerApprovedRemark: reason,
            fileAttachments: [...newFileAttachments]
          }
        };
      } else {
        ReqObj = {
          method: "put",
          data: {
            linearId: this.props.url.query.linearId,
            buyerRejectedRemark: reason,
            fileAttachments: [...newFileAttachments]
          }
        };
      }

      if (this.props.appenv.THREEWM_DETAIL_APPROVE_SYNC === false) {
        let approveObj = {};
        let fields = {
          type: type,
          externalId: this.state.data.externalId
        };
        approveObj = { ...ReqObj["data"], ...fields };

        this.socket.emit("approve", aToken, approveObj);

        await this.setState({
          isResultVisible: false,
          waitingProcessTitle: "",
          waitingProcessMsg:
            "Your request is being processed. You will be notified when the process is complete.",
          isWaitingProcessModalVisible: true,
          buttonWaitingProcess: [
            {
              label: "Close",
              attribute: {
                className: "btn btn-wide",
                onClick: this.toggleApproveRejectModal
              }
            }
          ]
        });
      } else {
        await this.apis.call(apiName, {}, ReqObj);

        this.setState({
          resultTitle: title,
          resultMsg: `${headOfMessage} for Invoice No. ${this.state.data.externalId} completed.`,
          resultLoading: false,
          resultSucess: true
        });

        this.fetchData();

        if (type === "BuyerApprove") {
          GA.event({
            category: "3WM",
            action: "3WM Approve (Success)",
            label: `3WM | ${
              this.state.original.externalId
            } | ${moment().format()}`
          });
        } else if (type === "BuyerClarify") {
          GA.event({
            category: "3WM",
            action: "3WM Clarify (Success)",
            label: `3WM | ${
              this.state.original.externalId
            } | ${moment().format()}`
          });
        } else if (type === "BuyerReject") {
          GA.event({
            category: "3WM",
            action: "3WM Reject (Success)",
            label: `3WM | ${
              this.state.original.externalId
            } | ${moment().format()}`
          });
        }
      }
    } catch (error) {
      this.setState({
        resultTitle: title,
        resultMsg: `${headOfMessage} for Invoice No. ${this.state.data.externalId} failed.`,
        errorMessage: [
          `${error.response.data.message}`,
          <br />,
          "Please contact your administrator."
        ],
        resultSucess: false,
        resultLoading: false,
        isMainSectionBlock: false,
        isMatchingDetailSectionBlock: false,
        isActionHistorySectionBlock: false
      });

      if (type === "BuyerApprove") {
        GA.event({
          category: "3WM",
          action: "3WM Approve (Failed)",
          label: `3WM | ${
            this.state.original.externalId
          } | ${moment().format()}`
        });
      } else if (type === "BuyerClarify") {
        GA.event({
          category: "3WM",
          action: "3WM Clarify (Failed)",
          label: `3WM | ${
            this.state.original.externalId
          } | ${moment().format()}`
        });
      } else if (type === "BuyerReject") {
        GA.event({
          category: "3WM",
          action: "3WM Reject (Failed)",
          label: `3WM | ${
            this.state.original.externalId
          } | ${moment().format()}`
        });
      }
    }
  };

  onApprove = async () => {
    const prepareData = {
      apiName: "requestInvoiceApprove",
      files: this.state.approveFile,
      reason: this.state.approveReasonText,
      headOfMessage: "Approve",
      title: "Approve Reason",
      type: "BuyerApprove"
    };
    await this.sendData(prepareData);
  };

  onReject = async () => {
    const prepareData = {
      apiName: "requestInvoiceReject",
      files: this.state.rejectFile,
      reason: this.state.rejectReasonText,
      headOfMessage: "Reject",
      title: "Request to resubmit",
      type: "BuyerReject"
    };
    await this.sendData(prepareData);
  };

  onClarify = async () => {
    const prepareData = {
      apiName: "requestInvoiceClarify",
      files: this.state.clarifyFile,
      reason: this.state.clarifyReasonText,
      headOfMessage: "Clarification",
      title: "Request to Clarify",
      type: "BuyerClarify"
    };
    await this.sendData(prepareData);
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
  onClarifyReasonChange = e => {
    this.setState({
      clarifyReasonText: e.target.value
    });
  };

  onClarifyFileChange = files => {
    this.setState({
      clarifyFile: files
    });
  };
  toggleClarifyModal = () => {
    this.setState({
      isClarifyModalVisible: !this.state.isClarifyModalVisible
    });
  };
  toggleResultModal = async () => {
    this.setState({
      isResultVisible: !this.state.isResultVisible
    });
    if (this.state.resultSucess) {
      await this.fetchData();
    }
  };
  toggleApproveRejectModal = async () => {
    const {
      isWaitingProcessModalVisible,
      isMainSectionBlock,
      isMatchingDetailSectionBlock,
      isActionHistorySectionBlock
    } = this.state;

    this.setState({
      isWaitingProcessModalVisible: !isWaitingProcessModalVisible,
      isMainSectionBlock: !isMainSectionBlock,
      isMatchingDetailSectionBlock: !isMatchingDetailSectionBlock,
      isActionHistorySectionBlock: !isActionHistorySectionBlock
    });
  };

  routeTo3WMList() {
    Router.push("/3-way-matching-list");
  }

  resolvePermission() {
    let isAllowApprove = false;
    let isAllowReject = false;
    let isAllowClarify = false;
    let isRemark = false;
    let isNotRunMatching = false;

    if (lifecycleApprove.includes(this.state.data.lifecycle)) {
      if (this.state.UserAuthority.includes("3WM-Approval")) {
        if (this.props.user.organisationUnit == "BUYER") {
          isAllowApprove = true;
        }
      }
    }
    if (lifecycleClarify.includes(this.state.data.lifecycle)) {
      if (this.state.UserAuthority.includes("3WM-Approval")) {
        if (this.props.user.organisationUnit == "BUYER") {
          isAllowClarify = true;
        }
      }
    }
    if (lifecycleReject.includes(this.state.data.lifecycle)) {
      if (this.state.UserAuthority.includes("3WM-Approval")) {
        if (this.props.user.organisationUnit == "BUYER") {
          isAllowReject = true;
        }
      }
    }

    if (this.state.original.previousAuthority) {
      if (
        this.state.data.lifecycle === "PENDING_BUYER" &&
        this.state.original.previousAuthority.remark
      ) {
        isRemark = true;
      }
    }

    if (lifecycleForNotRunMatching.includes(this.state.data.lifecycle)) {
      isNotRunMatching = true;
    }

    this.setState({
      isAllowApprove: isAllowApprove,
      isAllowReject: isAllowReject,
      isAllowClarify: isAllowClarify,
      isRemark: isRemark,
      isNotRunMatching: isNotRunMatching
    });
  }

  formatCurrency(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: digit,
      minimumFractionDigits: digit
    }).format(amount);
  }

  onFilter = matchingDetail => {
    this.setState({
      matchingDetail
    });
  };

  getTagGR = (purchaseItemLinearId, goodsReceivedItems) => {
    return this.apis.call(
      "getGrList",
      {
        linearId: purchaseItemLinearId
      },
      { method: "post", data: { goodsReceivedItems } }
    );
  };

  submitTagGr = tagedGRObj => {
    return this.apis.call("taggedGR", {}, { method: "put", data: tagedGRObj });
  };

  getConfig = configOption => {
    try {
      let response = this.apiThreshold.call("getConfig", {
        companyTaxId: this.state.data.company.companyTaxNumber,
        counterPartyTaxId: this.state.data.vendor.vendorTaxNumber,
        configOption
      });
      return response;
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
    }
  };

  isOutOfTolerance = () => {
    let checkEnabledApprove = [];
    let isEnabledApprove = false;
    this.state.data.matchingDetail.forEach(item => {
      let invQty = parseFloat(item.invoiceItems.invQuantity.toFixed(3));
      const min = parseFloat(
        (
          parseFloat(invQty.toFixed(3)) *
          parseFloat((this.state.minValue / 100).toFixed(3))
        ).toFixed(3)
      );
      const max = parseFloat(
        (
          parseFloat(invQty.toFixed(3)) *
          parseFloat((this.state.maxValue / 100).toFixed(3))
        ).toFixed(3)
      );

      let grQuantity = item.goodsReceivedItems.grQuantity
        ? parseFloat(item.goodsReceivedItems.grQuantity.toFixed(3))
        : 0;

      if (min <= grQuantity && max >= grQuantity) {
        isEnabledApprove = true;
      } else {
        isEnabledApprove = false;
      }
      checkEnabledApprove.push(isEnabledApprove);
    });

    if (checkEnabledApprove.includes(false)) {
      isEnabledApprove = false;
      $("button[name='btnApprove']").attr("disabled", "true");
    } else {
      isEnabledApprove = true;
      $("button[name='btnApprove']").removeAttr("disabled", "false");
    }

    this.setState({
      isEnabledApprove: isEnabledApprove
    });
  };

  renderSubHead = (unmatchedType, value) => {
    const { t } = this.props;
    const { data } = this.state;
    if (data.unmatchedCode.includes(unmatchedType)) {
      return (
        <strong className="text-danger">{`${value} ${t("Unmatched")}`}</strong>
      );
    }
    if (data.matchedCode[unmatchedType] === "IN_TOLERANCE") {
      return (
        <strong style={this.style.matchedWithinThreshold}>{`${value}  ${t(
          "Matched"
        )}`}</strong>
      );
    }
    return (
      <strong style={this.style.matchedColor}>{`${value} ${t(
        "Matched"
      )}`}</strong>
    );
  };

  renderSubText = (unmatchedType, value) => {
    const { data } = this.state;
    if (data.unmatchedCode.includes(unmatchedType)) {
      return <p className="text-danger text-right">{value}</p>;
    }
    if (data.matchedCode[unmatchedType] === "IN_TOLERANCE") {
      return (
        <p style={this.style.matchedWithinThreshold} className="text-right">
          {value}
        </p>
      );
    }

    return (
      <p style={this.style.matchedColor} className="text-right">
        {value}
      </p>
    );
  };
  handleDismissBtnModal() {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  }
  handleBlockPanel = () => {
    this.setState({
      isMainSectionBlock: !this.state.isMainSectionBlock,
      isMatchingDetailSectionBlock: !this.state.isMatchingDetailSectionBlock,
      isActionHistorySectionBlock: !this.state.isActionHistorySectionBlock
    });
  };

  render() {
    const { t } = this.props;
    const {
      UserAuthority,
      linearId,
      data,
      isMainSectionBlock,
      isMatchingDetailSectionBlock,
      isActionHistorySectionBlock,
      configuration,
      isAllowApprove,
      isAllowReject,
      isAllowClarify,
      isNotRunMatching,
      isRemark,
      itemFilter,
      isEnabledApprove,
      isAlertModalVisible,
      alertModalAlertTitle,
      buttonAlertApprove,
      alertModalMsg,
      buttonAlert,
      isTextOnly,
      isApproveModalVisible,
      isRejectModalVisible,
      isClarifyModalVisible,
      approveReasonText,
      approveFile,
      rejectReasonText,
      rejectFile,
      clarifyReasonText,
      clarifyFile,
      resultTitle,
      resultMsg,
      isResultVisible,
      buttonResultAlert,
      resultSucess,
      errorMessage,
      waitingProcessTitle,
      isWaitingProcessModalVisible,
      buttonWaitingProcess,
      waitingProcessMsg,
      isInProgress,
      matchingDetail,
      configFileApprove,
      configFileReject,
      configFileClarify,
      resultLoading,
      original,
      minValue,
      maxValue
    } = this.state;

    let breadcrumbs = [
      { title: t("3 Way Matching"), url: "/3-way-matching-list" },
      {
        title: `${t("Invoice No")} ${data.externalId ? data.externalId : "-"}`,
        active: true
      }
    ];

    return (
      <div>
        <Layout {...this.props}>
          <Head>
            <title>{[t("Invoice No"), ` ${data.externalId}`]}</title>
          </Head>
          <PageHeader
            title={`${t("Invoice No")} ${
              data.externalId ? data.externalId : "-"
            }`}
            breadcrumbs={breadcrumbs}
            {...this.props}
          />
          <BlockUi tag="div" blocking={isMainSectionBlock}>
            <div
              id="mobilePageNav"
              className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
            >
              <a href="/3-way-matching-list">
                <strong className="purple">
                  <i className="fa fa-chevron-left" /> {t("3 Way Matching")}
                </strong>
              </a>
            </div>
            <section id="invoice_detail_page" className="box box--width-header">
              <div className="box__header">
                <div className="row justify-content-between align-items-center mb-2">
                  <div className="col-4 pl-0 pl-lg-3">
                    {""}
                    {t("Entry Date")} : {""}
                    {data.entryDate
                      ? moment(data.entryDate).format("DD/MM/YYYY")
                      : "-"}
                  </div>
                  <div className="col-8 text-left text-lg-right">
                    {" "}
                    {t("3 Way Matching Status")} :{" "}
                    <strong
                      className="mr-0 mr-lg-3"
                      style={{
                        color: statusColor[data.matchingStatus]
                      }}
                    >
                      {data.matchingStatus}
                    </strong>
                    <div className="d-none d-lg-inline-block">
                      <button
                        name="btnRequestToResubmit"
                        className="btn btn--transparent btn-wide mr-2"
                        hidden={!isAllowReject}
                        onClick={this.toggleRejectModal}
                      >
                        {t("Request to resubmit")}
                      </button>
                      <button
                        id="btnApprove"
                        name="btnApprove"
                        hidden={!isAllowApprove}
                        className={`btn btn-wide ${
                          isEnabledApprove ? "" : "btn-disabled"
                        }`}
                        onClick={this.toggleApproveModal}
                      >
                        Approve
                      </button>
                      <button
                        name="btnClarify"
                        className="btn btn-wide"
                        hidden={!isAllowClarify}
                        onClick={this.toggleClarifyModal}
                      >
                        Clarify
                      </button>
                      <div
                        id="approvalInProgress"
                        name="approvalInProgress"
                        hidden={!isInProgress}
                        style={{
                          color: statusColor[data.matchingStatus]
                        }}
                      >
                        <strong>( In progress )</strong>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`col-12 px-0 mt-3 ${
                      !isAllowReject && !isAllowApprove && !isAllowClarify
                        ? "d-none"
                        : "d-inline-block d-lg-none"
                    }`}
                  >
                    <button
                      name="btnRequestToResubmit"
                      className="btn btn--transparent btn-wide mr-2"
                      hidden={!isAllowReject}
                      onClick={this.toggleRejectModal}
                    >
                      Request to resubmit
                    </button>
                    <button
                      id="btnApprove"
                      name="btnApprove"
                      hidden={!isAllowApprove}
                      className={`btn btn-wide ${
                        isEnabledApprove ? "" : "btn-disabled"
                      }`}
                      onClick={this.toggleApproveModal}
                    >
                      Approve
                    </button>
                    <button
                      name="btnClarify"
                      className="btn btn-wide"
                      hidden={!isAllowClarify}
                      onClick={this.toggleClarifyModal}
                    >
                      Clarify
                    </button>
                  </div>
                </div>
              </div>
              {isRemark && (
                <div className="box__inner pt-0 pt-lg-3">
                  <div
                    className="row box"
                    style={{ backgroundColor: "#ffe5e5" }}
                  >
                    Request Clarification: {original.previousAuthority.remark}
                  </div>
                </div>
              )}
              <div className="box__inner pt-0 pt-lg-3">
                {/* Desktop Version - Start */}
                <Collapse
                  id="vendorInfo"
                  expanded="true"
                  collapseHeader={[t("Vendor"), t("Company")]}
                  className="d-none d-lg-inline-block"
                >
                  <div className="d-flex flex-wrap">
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Code")}
                        value={data.vendor.vendorNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Name")}
                        value={data.vendor.vendorName}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax ID")}
                        value={data.vendor.vendorTaxNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Branch")}
                        value={`${data.vendor.vendorBranchCode || "-"} (${data
                          .vendor.vendorBranchName | "-"})`}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Address")}
                        value={data.vendor.vendorAddress}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tel")}
                        value={data.vendor.vendorTelephone}
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Code")}
                        value={data.company.companyCode}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Name")}
                        value={data.company.companyName}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax ID")}
                        value={data.company.companyTaxNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Branch")}
                        value={`${data.company.companyBranchCode || "-"} (${data
                          .company.companyBranchName || "-"})`}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Address")}
                        value={data.company.companyAddress}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tel")}
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
                  collapseHeader={[t("Vendor")]}
                  className="d-inline-block d-lg-none"
                >
                  <div className="row">
                    <div className="col-12">
                      <CollapseItemText
                        t={t}
                        label={t("Code")}
                        value={data.vendor.vendorNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Name")}
                        value={data.vendor.vendorName}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax ID")}
                        value={data.vendor.vendorTaxNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Branch")}
                        value={`${data.vendor.vendorBranchCode || "-"} (${data
                          .vendor.vendorBranchName | "-"})`}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Address")}
                        value={data.vendor.vendorAddress}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tel")}
                        value={data.vendor.vendorTelephone}
                      />
                    </div>
                  </div>
                </Collapse>
                <Collapse
                  id="comapnyInfo"
                  expanded="true"
                  collapseHeader={[t("Company")]}
                  className="d-inline-block d-lg-none"
                >
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={data.company.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={data.company.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={data.company.companyTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${data.company.companyBranchCode || "-"} (${data
                        .company.companyBranchName || "-"})`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={data.company.companyAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={data.company.companyTelephone}
                    />
                  </div>
                </Collapse>
                {/* Mobile Version - End */}

                <Collapse
                  id="paymentInfo"
                  expanded="true"
                  collapseHeader={[t("Payment Information")]}
                >
                  <div className="d-flex flex-wrap">
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Invoice Date")}
                        colLabel="6"
                        value={moment(data.paymentinfo.invoiceDate).format(
                          "DD/MM/YYYY"
                        )}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Payment Term Description")}
                        colLabel="6"
                        value={data.paymentinfo.paymentTermDesc}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Payment Date")}
                        colLabel="6"
                        value={
                          data.paymentinfo.paymentDate !== ""
                            ? moment(data.paymentinfo.paymentDate).format(
                                "DD/MM/YYYY"
                              )
                            : ""
                        }
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Invoice Financing")}
                        colLabel="6"
                        value={
                          data.paymentinfo.invoiceFinancing
                            ? data.paymentinfo.invoiceFinancing === "Y"
                              ? "Yes"
                              : "No"
                            : "No"
                        }
                      />

                      <CollapseItemText
                        t={t}
                        label={t("Send to CMS")}
                        colLabel="6"
                        value={data.paymentinfo.sendToCMS}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Send to Bank")}
                        colLabel="6"
                        value={data.paymentinfo.sendToBank}
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Sub Total")}
                        colLabel="6"
                        value={`${this.formatCurrency(
                          data.paymentinfo.subTotal,
                          2
                        )} ${data.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax Total")}
                        colLabel="6"
                        value={`${this.formatCurrency(
                          data.paymentinfo.vatTotal,
                          2
                        )} ${data.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Invoice Amount")}
                        colLabel="6"
                        value={`${this.formatCurrency(
                          data.paymentinfo.invoiceTotal,
                          2
                        )} ${data.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("WHT Pre-calculated amount")}
                        colLabel="6"
                        value={`${this.formatCurrency(
                          original.withholdingTaxTotal,
                          2
                        )} ${data.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Retention Amount")}
                        colLabel="6"
                        value={`${this.formatCurrency(
                          data.paymentinfo.retentionAmount,
                          2
                        )} ${data.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Estimated Invoice Payable Amount")}
                        colLabel="6"
                        value={`${this.formatCurrency(
                          data.paymentinfo.estimatedPayable,
                          2
                        )} ${data.currency}`}
                        viewtype="currency"
                      />

                      <br />
                      <CollapseItemText
                        t={t}
                        label={t("Due Date")}
                        colLabel="6"
                        value={moment(data.paymentinfo.dueDate).format(
                          "DD/MM/YYYY"
                        )}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Revised Payment Due Date")}
                        colLabel="6"
                        value={
                          data.paymentinfo.revisedDueDate == ""
                            ? "-"
                            : moment(data.paymentinfo.revisedDueDate).format(
                                "DD/MM/YYYY"
                              )
                        }
                      />

                      <CollapseItemText
                        t={t}
                        label={t("Last Edited By")}
                        colLabel="6"
                        value={data.paymentinfo.dueDateLastEditedBy}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Last Edited Date")}
                        colLabel="6"
                        value={moment(
                          data.paymentinfo.lastMatchUpdatedDate
                        ).format("DD/MM/YYYY")}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Last Edited Reason")}
                        colLabel="6"
                        value={data.paymentinfo.dueDateLastEditedReason}
                      />
                    </div>
                  </div>
                </Collapse>

                <Collapse
                  id="attachmentLists"
                  expanded="true"
                  collapseHeader={[t("Attachments")]}
                >
                  <div className="d-flex flex-wrap">
                    <div className="col-12 col-lg-6">
                      <CollapseItemExternalLink
                        label={t("Attach Tax Invoice")}
                        colLabel="6"
                        value={
                          data.attachments.fileAttachmentsTaxInvoice.length > 0
                            ? data.attachments.fileAttachmentsTaxInvoice
                            : "-"
                        }
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Receipt No")}
                        colLabel="6"
                        value={data.attachments.receiptNumber}
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemExternalLink
                        label={t("Attach Delivery Note")}
                        colLabel="6"
                        value={
                          data.attachments.fileAttachmentsDeliveryNote.length >
                          0
                            ? data.attachments.fileAttachmentsDeliveryNote
                            : "-"
                        }
                      />
                      <CollapseItemExternalLink
                        label={t("Attach Receipt")}
                        colLabel="6"
                        value={
                          data.attachments.fileAttachmentsReceipt.length > 0
                            ? data.attachments.fileAttachmentsReceipt
                            : "-"
                        }
                      />
                      <CollapseItemExternalLink
                        label={t("Attach Other Documents")}
                        colLabel="6"
                        value={
                          data.attachments.fileAttachmentsOther.length > 0
                            ? data.attachments.fileAttachmentsOther
                            : "-"
                        }
                      />
                    </div>
                  </div>
                </Collapse>
                <div hidden={isNotRunMatching}>
                  <div
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
                      <h3 className="border-bottom gray-1">
                        {t("Amount Matching")}
                      </h3>
                    </div>
                    {/* Desktop Version - Start */}
                    <div
                      id="matchingStatus"
                      className="col-12 d-none d-lg-flex flex-wrap"
                    >
                      <div className="col-3">
                        <p className="indicator mt-3">
                          <p>{t("Status")}</p>
                        </p>
                        <p className="indicator d-flex">
                          {this.renderSubHead("VAT_TOTAL", t("TAX Total"))}
                        </p>
                        <p className="indicator">
                          {this.renderSubHead("SUB_TOTAL", t("Sub Total"))}
                        </p>
                        <p className="indicator">
                          {this.renderSubHead(
                            "TOTAL_AMOUNT",
                            t("Total Amount")
                          )}
                        </p>
                      </div>
                      <div className="col-3">
                        <p className="indicator mt-3 text-right">
                          {t("Calculated by System Amount")}
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
                      <div className="col-3">
                        <p className="indicator mt-3 text-right">
                          {t("Amount in Invoice")}
                        </p>
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
                      <div className="col-3">
                        <p className="indicator mt-3 text-right">
                          {t("Diff Amount")}
                        </p>
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
                      className="col-12 d-flex d-lg-none flex-wrap pt-3"
                    >
                      {/* Tax Total - Start */}
                      <div className="col-12 d-flex flex-wrap px-0">
                        <div className="col-6 indicator text-right">
                          <p>{t("Status")}: </p>
                        </div>
                        <div className="col-6 text-right px-0">
                          {this.renderSubHead("VAT_TOTAL", t("TAX Total"))}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Calculated by System Amount")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "VAT_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.systemAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Amount in Invoice")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "VAT_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.invoiceAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Diff Amount")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "VAT_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.diffAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                      </div>
                      {/* Tax Total - End */}

                      {/* Sub Total - Start */}
                      <div className="col-12 d-flex flex-wrap px-0">
                        <div className="col-6 indicator text-right">
                          <p>{t("Status")}: </p>
                        </div>
                        <div className="col-6 text-right px-0">
                          {this.renderSubHead("SUB_TOTAL", t("Sub Total"))}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Calculated by System Amount")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "SUB_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.systemAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Amount in Invoice")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "SUB_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.invoiceAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Diff Amount")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "SUB_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.diffAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                      </div>
                      {/* Sub Total - End */}

                      {/* Total - Start */}
                      <div className="col-12 d-flex flex-wrap px-0">
                        <div className="col-6 indicator text-right">
                          <p>{t("Status")}: </p>
                        </div>
                        <div className="col-6 text-right px-0">
                          {this.renderSubHead("VAT_TOTAL", t("Total Amount"))}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Calculated by System Amount")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "VAT_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.systemAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Amount in Invoice")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "VAT_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.invoiceAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                        <div className="col-6 indicator text-right">
                          <p>{t("Diff Amount")}</p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "VAT_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.taxTotal.diffAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                      </div>
                      {/* Total - End */}
                    </div>
                    {/* Mobile Version - End */}
                  </div>
                </div>
              </div>
            </section>
          </BlockUi>
          <BlockUi blocking={isMatchingDetailSectionBlock}>
            <section
              id="invoice_detail_page"
              className="three_wm_detail box box--width-header"
            >
              <div className="box__header pb-0 pb-lg-3">
                <div className="row justify-content-between align-items-center mb-lg-2">
                  <div className="col-12 col-lg-6">
                    <h3>{t("Matching Details")}</h3>
                  </div>
                  <div className="col-6 d-none d-lg-flex flex-wrap justify-content-end align-items-center">
                    <div className="filter col-7 d-flex justify-content-end">
                      <strong className="mr-3">{t("Filter")}:</strong>
                      <a
                        href="javascript:void(0);"
                        className={itemFilter === "All" ? "active" : ""}
                        onClick={() => {
                          this.setState({ itemFilter: "All" });
                        }}
                      >
                        {t("All")}
                      </a>
                      <a
                        href="javascript:void(0);"
                        className={itemFilter === "unmatched" ? "active" : ""}
                        onClick={() => {
                          this.setState({ itemFilter: "unmatched" });
                        }}
                      >
                        {t("Unmatched")}
                      </a>
                      <a
                        href="javascript:void(0);"
                        className={itemFilter === "matched" ? "active" : ""}
                        onClick={() => {
                          this.setState({ itemFilter: "matched" });
                        }}
                      >
                        {t("Matched")}
                      </a>
                    </div>
                    <div className="searchBox input-append-icon col-5">
                      <MatchDetailSearch
                        matchingDetail={matchingDetail.filter(item => {
                          return (
                            itemFilter === "All" ||
                            itemFilter === item.itemProperties.matchedStatus ||
                            (itemFilter === "matched" &&
                              item.itemProperties.matchedStatus ===
                                "matchedWithThreshold")
                          );
                        })}
                        onFilter={this.onFilter}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="box__inner">
                {matchingDetail
                  .filter(item => {
                    return (
                      itemFilter === "All" ||
                      itemFilter === item.itemProperties.matchedStatus ||
                      (itemFilter === "matched" &&
                        item.itemProperties.matchedStatus ===
                          "matchedWithThreshold")
                    );
                  })
                  .filter(item => {
                    return item.checked;
                  })
                  .map((item, index) => {
                    return (
                      // <MatchingItem
                      //   id="matchingItem"
                      //   index={index}
                      //   value={item}
                      //   canSelectGr
                      //   matchingType="3wm"
                      //   lifecycleForNotRunMatching={lifecycleForNotRunMatching}
                      //   lifecycleTag={lifecycleTag}
                      //   lifeCycle={data.lifecycle}
                      //   permission="Invoice-Tag-Goods-Received"
                      //   invoiceLinearId={this.props.url.query.linearId}
                      //   linearId={item.purchaseItemLinearId}
                      //   auth={this.state.UserAuthority}
                      //   userType={this.props.user.organisationUnit}
                      //   reloadPageAfterTaggedGR={this.fetchData}
                      //   getTagGR={this.getTagGR}
                      //   submitTagGr={this.submitTagGr}
                      //   notRunMatching={isNotRunMatching}
                      // />
                      <ThreeWayMatchingItem
                        id="matchingItem"
                        index={index}
                        data={item}
                        canSelectGr
                        matchingType="3wm"
                        lifecycleForNotRunMatching={lifecycleForNotRunMatching}
                        lifecycleTag={lifecycleTag}
                        lifeCycle={data.lifecycle}
                        permission="Invoice-Tag-Goods-Received"
                        invoiceLinearId={this.props.url.query.linearId}
                        linearId={item.purchaseItemLinearId}
                        auth={this.state.UserAuthority}
                        userType={this.props.user.organisationUnit}
                        reloadPageAfterTaggedGR={this.fetchData}
                        getTagGR={this.getTagGR}
                        submitTagGr={this.submitTagGr}
                        notRunMatching={isNotRunMatching}
                        externalId={data.externalId}
                        minValue={minValue}
                        maxValue={maxValue}
                      />
                    );
                  })}
              </div>
            </section>
          </BlockUi>
          <BlockUi blocking={isActionHistorySectionBlock}>
            <section
              id="invoice_detail_page"
              className="box box--width-header px-0 px-lg-3 pb-0"
            >
              <div className="box__header px-3">
                <Collapse
                  id="actionHistory"
                  expanded="true"
                  collapseHeader={[t("Action History")]}
                >
                  {/* Desktop Version - Start */}
                  <div className="table_wrapper d-none d-lg-inline-block">
                    <div className="table-responsive">
                      <table className="table table-3 dataTable">
                        <thead>
                          <tr>
                            <th>{t("Action")}</th>
                            <th>{t("Date/Time")}</th>
                            <th>{t("Modified by")}</th>
                            <th>{t("Reason")}</th>
                            <th>{t("Attach File")}</th>
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
                                    <td>{i.commomName || i.actionBy}</td>
                                    <td>{i.remark}</td>
                                    <td>
                                      <div className="text-left">
                                        <CollapseHistoryExternalLink
                                          value={
                                            i.attachmentFile
                                              ? i.attachmentFile
                                              : "-"
                                          }
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center">
                                {t("No Item Found")}
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
                            <th>{t("Action")}</th>
                            <th>{t("Date/Time")}</th>
                            <th>{t("More")}</th>
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
                                      <td colSpan="3">
                                        <div className="d-flex flex-wrap w-100">
                                          <div className="col-6 px-0 py-3 text-right">
                                            {t("Modified by")}:
                                          </div>
                                          <div className="col-6 py-3">
                                            {i.commomName || i.actionBy}
                                          </div>
                                          <div className="col-6 px-0 py-3 text-right">
                                            {t("Reason")}:{" "}
                                          </div>
                                          <div className="col-6 py-3">
                                            {i.remark}
                                          </div>
                                          <div className="col-6 px-0 py-3 text-right">
                                            {t("Attach File")}:{" "}
                                          </div>
                                          <div className="col-6 py-3">
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
                                {t("No Item Found")}
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
          </BlockUi>
        </Layout>
        <ModalDropFile
          title={"Approve Reason"}
          isVisible={isApproveModalVisible}
          onFileChange={this.onApproveFileChange}
          onReasonChange={this.onApproveReasonChange}
          isReasonRequire={true}
          onCancelButton={this.toggleApproveModal}
          onSubmitButton={this.onApprove}
          configFile={configFileApprove}
        />
        <ModalDropFile
          title={"Request to resubmit"}
          isVisible={isRejectModalVisible}
          onFileChange={this.onRejectFileChange}
          onReasonChange={this.onRejectReasonChange}
          isReasonRequire={true}
          onCancelButton={this.toggleRejectModal}
          onSubmitButton={this.onReject}
          configFile={configFileReject}
        />
        <ModalDropFile
          title={"Request Clarification"}
          isVisible={isClarifyModalVisible}
          onFileChange={this.onClarifyFileChange}
          onReasonChange={this.onClarifyReasonChange}
          isReasonRequire={true}
          onCancelButton={this.toggleClarifyModal}
          onSubmitButton={this.onClarify}
          configFile={configFileClarify}
        />
        <ModalAlert
          title={resultTitle}
          visible={isResultVisible}
          isTextOnly={true}
          button={resultLoading ? [] : buttonResultAlert}
        >
          <div className="text-center">
            {resultLoading ? (
              <div>
                {" "}
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
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
        <ModalAlert
          title={waitingProcessTitle}
          visible={isWaitingProcessModalVisible}
          button={buttonWaitingProcess}
          isTextOnly={true}
        >
          {waitingProcessMsg}
        </ModalAlert>
      </div>
    );
  }
}
export default withAuth(
  withTranslation(["threeway-detail", "detail"])(ThreeWayMatchingDetail)
);
