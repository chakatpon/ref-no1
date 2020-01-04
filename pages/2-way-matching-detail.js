import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import "../libs/mycools";
import BlockUi from "react-block-ui";
import ModalAlert, { BTN_ACTION_BACK } from "../components/modalAlert";
import ModalDropFile from "../components/modalDropFile";
import MatchDetailSearch2Way from "../components/matchDetailPopover/matchDetailSearch2Way";
import statusColor from "../configs/color.2wm.json";
import { i18n, withTranslation } from "~/i18n";
import handleError from "./handleError";
import {
  PageHeader,
  Collapse,
  CollapseItemText,
  CollapseItemExternalLink,
  CollapseHistoryExternalLink
} from "../components/page";
import MatchingItem from "../components/twowatMatchingItem";
import GA from "~/libs/ga";

const Api = new ApiService();

const lifecycleApprove = ["UNMATCHED"];
const lifecycleClarify = ["PENDING_BUYER"];
const lifecycleResubmit = ["UNMATCHED", "PENDING_BUYER"];
const lifecycleTag = ["PARTIAL", "MISSING", "UNMATCHED"];
const lifecycleForNotRunMatching = ["ISSUED", "REJECTED", "CANCELLED"];
const lifecycleIsInvoiceApproved = [
  "APPROVED",
  "RESERVED",
  "FINANCED",
  "DECLINED_WITH_FINANCED",
  "DECLINED",
  "PAID_WITHOUT_FINANCED",
  "PAID"
];

class TwoWayMatchingDetail extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("twoWayMatching");
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
        vendor: {},
        company: {},
        actionHistory: [],
        externalId: "",
        amountMatching: {
          subTotal: {},
          taxTotal: {}
        },
        creditNoteInfo: {},
        attachments: {
          fileAttachmentsTaxInvoice: [],
          fileAttachmentsDeliveryNote: [],
          fileAttachmentsReceipt: [],
          fileAttachmentsOther: [],
          fileAttachmentsCreditNote: [],
          fileAttachmentsOther: []
        },
        restrictedMap: {},
        disclosedMap: {},
        unmatchedCode: []
      },
      quantityThreshold: {},
      matchingDetail: [],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: false,
      buttonAlert: [],
      isMainSectionBlock: false,
      isMatchingDetailSectionBlock: false,
      isActionHistorySectionBlock: false,
      isAllowApprove: false,
      isEnabledApprove: false,
      isAllowResubmit: false,
      isNotRunMatching: true,
      isApproveModalVisible: false,
      isRejectModalVisible: false,
      // isAlertApproveModalVisible: false,
      // alertApproveModalAlertTitle: "",
      isTextOnly: false,
      buttonAlertApprove: [],
      approveRemark: "",
      isAlertResubmitModalVisible: false,
      alertResubmitModalAlertTitle: "",
      isTextOnly: false,
      buttonAlertResubmit: [],
      resubmitRemark: "",
      resubmitTextareaIsRequired: false,
      isInvoiceApproved: false,
      itemFilter: "All",
      maxValue: 0,
      minValue: 0,
      resultLoading: false,
      approveFile: [],
      approveReasonText: "",
      rejectFile: [],
      rejectReasonText: "",
      configFileApprove: [],
      buttonResultAlert: [],
      resultTitle: "",
      resultMsg: "",
      resultSucess: false,
      isResultVisible: false,
      errorMessage: ""
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

  async componentWillMount() {
    this.toggleMainSectionBlock();
    this.toggleActionHistorySectionBlock();
    this.toggleMatchingDetailSectionBlock();

    await this.permissionPage();
    await this.setPermission();
    await this.fetchData();
    await this.getQuantityThreshold();
    await this.checkIsInvoiceApproved();
    await this.resolvePermission();

    this.toggleMainSectionBlock();
    this.toggleActionHistorySectionBlock();
    this.toggleMatchingDetailSectionBlock();
  }

  permissionPage = () => {
    const { permisions } = this.props;
    if (!permisions.includes("2WM-Detail")) {
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
      this.setState({
        linearId: this.props.url.query.linearId,
        data: res.data,
        configFileApprove,
        configFileReject,
        companyTaxNumber: res.data.company.companyTaxNumber,
        vendorTaxNumber: res.data.vendor.vendorTaxNumber,
        matchingDetail: res.data.matchingDetail.map(item => ({
          ...item,
          checked: true
        })),
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
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
      // this.resolveError(err);
      // this.setState({
      //   isAlertModalVisible: true,
      //   alertModalAlertTitle: "Error!",
      //   isTextOnly: true,
      //   alertModalMsg: [
      //     "Sorry, you cannot get detail of this two way matching.",
      //     <br />,
      //     "Please contact your administrator."
      //   ],
      //   buttonAlert: [
      //     {
      //       label: "Back",
      //       attribute: {
      //         className: "btn btn--transparent btn-wide",
      //         onClick: this.routeTo2WMList
      //       }
      //     }
      //   ]
      // });
    }
  };

  resolvePermission() {
    let isAllowApprove = false;
    let isAllowResubmit = false;
    let isEnabledApprove = false;
    let checkEnabledApprove = [];
    let isNotRunMatching = false;

    if (lifecycleApprove.includes(this.state.data.lifecycle)) {
      if (this.state.UserAuthority.includes("2WM-Approval")) {
        if (this.props.user.organisationUnit == "BUYER") {
          isAllowApprove = true;
        }
      }
    }
    if (lifecycleResubmit.includes(this.state.data.lifecycle)) {
      if (this.state.UserAuthority.includes("2WM-Approval")) {
        if (this.props.user.organisationUnit == "BUYER") {
          isAllowResubmit = true;
        }
      }
    }
    this.state.data.matchingDetail.forEach(item => {
      const { quantity: cnQty } = item.creditnoteItems;
      const { min } = this.state.quantityThreshold;
      const { max } = this.state.quantityThreshold;
      const { grQuantity } = item.goodsReceivedItems;

      let minThreshold = parseFloat(
        (
          parseFloat(cnQty.toFixed(3)) *
          parseFloat((parseFloat(min) / 100).toFixed(3))
        ).toFixed(3)
      );
      let maxThreshold = parseFloat(
        (
          parseFloat(cnQty.toFixed(3)) *
          parseFloat((parseFloat(max) / 100).toFixed(3))
        ).toFixed(3)
      );

      if (minThreshold <= grQuantity && maxThreshold >= grQuantity) {
        isEnabledApprove = true;
      } else {
        isEnabledApprove = false;
      }
      checkEnabledApprove.push(isEnabledApprove);
    });

    if (checkEnabledApprove.includes(false) || !this.state.isInvoiceApproved) {
      isEnabledApprove = false;
      $("button[name='btnApprove']").attr("disabled", "true");
      if (!this.state.isInvoiceApproved) {
        $("#invoiceApproved").removeAttr("hidden");
      }
    } else {
      isEnabledApprove = true;
      $("button[name='btnApprove']").removeAttr("disabled");
    }

    if (lifecycleForNotRunMatching.includes(this.state.data.lifecycle)) {
      isNotRunMatching = true;
    }

    this.setState({
      isAllowApprove: isAllowApprove,
      isAllowResubmit: isAllowResubmit,
      isEnabledApprove: isEnabledApprove,
      isNotRunMatching: isNotRunMatching
    });
  }

  getQuantityThreshold = async () => {
    let min = await this.apis.call("quantityThreshold", {
      companyTaxId: this.state.companyTaxNumber,
      counterPartyTaxId: this.state.vendorTaxNumber,
      configOption: "MIN_GOODS_AGAINST_CREDIT_NOTE_ITEM_THRESHOLD"
    });
    let max = await this.apis.call("quantityThreshold", {
      companyTaxId: this.state.companyTaxNumber,
      counterPartyTaxId: this.state.vendorTaxNumber,
      configOption: "MAX_GOODS_AGAINST_CREDIT_NOTE_ITEM_THRESHOLD"
    });

    if (min.length === 0 || max.length === 0) {
      console.error("cannot get config threshold.");
      // this.setState({
      //   isAlertModalVisible: true,
      //   alertModalAlertTitle: "Error!",
      //   isTextOnly: true,
      //   alertModalMsg: [
      //     "Sorry, you cannot get detail of this two way matching.",
      //     <br />,
      //     "Please contact your administrator."
      //   ],
      //   buttonAlert: [
      //     {
      //       label: "Back",
      //       attribute: {
      //         className: "btn btn--transparent btn-wide",
      //         onClick: this.routeTo2WMList
      //       }
      //     }
      //   ]
      // });
    } else {
      let obj = {
        min: min[0].value,
        max: max[0].value
      };

      this.setState({
        quantityThreshold: obj,
        minValue: min[0].value,
        maxValue: max[0].value
      });
    }
  };

  checkIsInvoiceApproved = async () => {
    try {
      let isInvoiceApproved = false;
      const res = await this.apis.call("invoiceApproved", {
        linearId: this.state.data.creditNoteInfo.InvoiceLinearId
      });

      if (lifecycleIsInvoiceApproved.includes(res.rows[0].lifecycle)) {
        isInvoiceApproved = true;
      }

      this.setState({
        isInvoiceApproved
      });
    } catch (err) {
      console.error("Cannot get data from invoice detail API");
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      // this.resolveError(err);
    }
  };

  toggleDismissModal = () => {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      isTextOnly: false,
      alertModalMsg: [],
      buttonAlert: []
    });
  };

  //////////////////////////////////////////
  //////////////// Approve /////////////////
  //////////////////////////////////////////

  // // onApprove = async () => {
  // //   try {
  // //     let apiGroup = "";
  // //     if (this.state.data.adjustmentType === "Goods Return") {
  // //       apiGroup = "approveTypeQuantity";
  // //     } else if (this.state.data.adjustmentType === "Price Adjustment") {
  // //       apiGroup = "approveTypePrice";
  // //     }

  // //     if (apiGroup !== "") {
  // //       let ReqObj = {
  // //         method: "put",
  // //         data: {
  // //           linearId: this.props.url.query.linearId,
  // //           remark: this.state.approveRemark
  // //         }
  // //       };
  // //       let res = await this.apis.call(apiGroup, {}, ReqObj);
  // //       if (res.message === "SUCCESSFUL" || res.message === "") {
  // //         this.toggleApproveModal();
  // //         Router.push("/2-way-matching-list");
  // //       } else {
  // //         this.toggleApproveModal();
  // //         this.setState({
  // //           approveRemark: "",
  // //           isAlertModalVisible: true,
  // //           alertModalAlertTitle: "Error!",
  // //           isTextOnly: true,
  // //           alertModalMsg: [
  // //             "Sorry, you cannot request to approve this 2 way matching.",
  // //             <br />,
  // //             "Please contact your administrator."
  // //           ],
  // //           buttonAlert: [
  // //             {
  // //               label: "Close",
  // //               attribute: {
  // //                 className: "btn btn--transparent btn-wide",
  // //                 onClick: this.toggleDismissModal
  // //               }
  // //             }
  // //           ]
  // //         });
  // //       }
  // //     } else {
  // //       this.toggleApproveModal();
  // //       this.setState({
  // //         approveRemark: "",
  // //         isAlertModalVisible: true,
  // //         alertModalAlertTitle: "Error!",
  // //         isTextOnly: true,
  // //         alertModalMsg: [
  // //           "Sorry, unknow adjustment type.",
  // //           <br />,
  // //           "Please contact your administrator."
  // //         ],
  // //         buttonAlert: [
  // //           {
  // //             label: "Close",
  // //             attribute: {
  // //               className: "btn btn--transparent btn-wide",
  // //               onClick: this.toggleDismissModal
  // //             }
  // //           }
  // //         ]
  // //       });
  // //     }
  // //   } catch (error) {
  // //     this.toggleApproveModal();
  // //     this.setState({
  // //       approveRemark: "",
  // //       isAlertModalVisible: true,
  // //       alertModalAlertTitle: "Error!",
  // //       isTextOnly: true,
  // //       alertModalMsg: [
  // //         "Sorry, you cannot approve this 2 way matching.",
  // //         <br />,
  // //         "Please contact your administrator."
  // //       ],
  // //       buttonAlert: [
  // //         {
  // //           label: "Close",
  // //           attribute: {
  // //             className: "btn btn--transparent btn-wide",
  // //             onClick: this.toggleDismissModal
  // //           }
  // //         }
  // //       ]
  // //     });
  // //   }
  // // };

  // //////////////////////////////////////////
  // ////////// Request to resubmit ///////////
  // //////////////////////////////////////////

  // onResubmit = async () => {
  //   try {
  //     if (this.state.resubmitRemark === "") {
  //       this.setState({
  //         resubmitTextareaIsRequired: true
  //       });
  //     } else {
  //       let apiGroup = "";
  //       if (this.state.data.adjustmentType === "Goods Return") {
  //         apiGroup = "resubmitTypeQuantity";
  //       } else if (this.state.data.adjustmentType === "Price Adjustment") {
  //         apiGroup = "resubmitTypePrice";
  //       }

  //       if (apiGroup !== "") {
  //         let ReqObj = {
  //           method: "put",
  //           data: {
  //             linearId: this.props.url.query.linearId,
  //             remark: this.state.resubmitRemark
  //           }
  //         };
  //         let res = await this.apis.call(apiGroup, {}, ReqObj);
  //         if (res.message === "SUCCESSFUL" || res.message === "") {
  //           this.toggleRejectModal();
  //           Router.push("/2-way-matching-list");
  //         } else {
  //           this.toggleRejectModal();
  //           this.setState({
  //             resubmitRemark: "",
  //             isAlertModalVisible: true,
  //             alertModalAlertTitle: "Error!",
  //             isTextOnly: true,
  //             alertModalMsg: [
  //               "Sorry, you cannot Request to resubmit this 2 way matching.",
  //               <br />,
  //               "Please contact your administrator."
  //             ],
  //             buttonAlert: [
  //               {
  //                 label: "Close",
  //                 attribute: {
  //                   className: "btn btn--transparent btn-wide",
  //                   onClick: this.toggleDismissModal
  //                 }
  //               }
  //             ]
  //           });
  //         }
  //       } else {
  //         this.toggleRejectModal();
  //         this.setState({
  //           resubmitRemark: "",
  //           isAlertModalVisible: true,
  //           alertModalAlertTitle: "Error!",
  //           isTextOnly: true,
  //           alertModalMsg: [
  //             "Sorry, unknow adjustment type.",
  //             <br />,
  //             "Please contact your administrator."
  //           ],
  //           buttonAlert: [
  //             {
  //               label: "Close",
  //               attribute: {
  //                 className: "btn btn--transparent btn-wide",
  //                 onClick: this.toggleDismissModal
  //               }
  //             }
  //           ]
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     this.toggleRejectModal();
  //     this.setState({
  //       resubmitRemark: "",
  //       isAlertModalVisible: true,
  //       alertModalAlertTitle: "Error!",
  //       isTextOnly: true,
  //       alertModalMsg: [
  //         "Sorry, you cannot Request to resubmit this 2 way matching.",
  //         <br />,
  //         "Please contact your administrator."
  //       ],
  //       buttonAlert: [
  //         {
  //           label: "Close",
  //           attribute: {
  //             className: "btn btn--transparent btn-wide",
  //             onClick: this.toggleDismissModal
  //           }
  //         }
  //       ]
  //     });
  //   }
  // };

  routeTo2WMList() {
    Router.push("/2-way-matching-list");
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

  renderSubHead = (unmatchedType, value) => {
    const { t } = this.props;
    const { data } = this.state;
    if (data.unmatchedCode.includes(unmatchedType)) {
      return (
        <strong className="text-danger">{`${value} ${t("Unmatched")}`}</strong>
      );
    }
    if (
      data.matchedCode &&
      data.matchedCode[unmatchedType] === "IN_TOLERANCE"
    ) {
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
    if (data.unmatchedCode && data.unmatchedCode.includes(unmatchedType)) {
      return <p className="text-danger text-right">{value}</p>;
    }
    if (
      data.matchedCode &&
      data.matchedCode[unmatchedType] === "IN_TOLERANCE"
    ) {
      return (
        <p className="text-right" style={this.style.matchedWithinThreshold}>
          {value}
        </p>
      );
    }
    return (
      <p className="text-right" style={this.style.matchedColor}>
        {value}
      </p>
    );
  };

  uploadFile = async files => {
    console.log("files", files);
    const uploadPromise = files.map(file => {
      console.log("file", file);
      const data = new FormData();
      data.append("file", file);
      console.log("data", data);
      return Api.postUploadFile(data);
    });
    const result = await Promise.all(uploadPromise);
    return result.map(uploadedFile => uploadedFile[0]);
  };

  sendData = async ({ apiName, files, reason, headOfMessage, title, type }) => {
    GA.event({
      category: "2WM",
      action: "2WM Approve (Request)",
      label: `2WM | ${this.state.data.externalId} | ${moment().format()}`
    });

    try {
      this.setState({
        resultLoading: true
      });
      //this.toggleResultModal();
      console.log("Files", files);
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
            remark: reason,
            fileAttachments: [...newFileAttachments]
          }
        };
      } else if (type === "BuyerReject") {
        ReqObj = {
          method: "put",
          data: {
            linearId: this.props.url.query.linearId,
            remark: reason,
            fileAttachments: [...newFileAttachments]
          }
        };
      }

      await this.apis.call(apiName, {}, ReqObj);
      this.setState({
        resultTitle: title,
        resultMsg: `${headOfMessage} for invoice no. ${this.state.data.externalId} completed.`,
        resultLoading: false,
        resultSucess: true
      });

      if (type === "BuyerApprove") {
        GA.event({
          category: "2WM",
          action: "2WM Approve (Success)",
          label: `2WM | ${this.state.data.externalId} | ${moment().format()}`
        });
      } else if (type === "BuyerReject") {
        GA.event({
          category: "2WM",
          action: "2WM Reject (Success)",
          label: `2WM | ${this.state.data.externalId} | ${moment().format()}`
        });
      }
    } catch (err) {
      console.error("Cannot get data from invoice detail API");
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response,
        resultLoading: false
      });
      // this.setState({
      //   resultTitle: title,
      //   resultMsg: `${headOfMessage} for invoice no. ${this.state.data.externalId} failed.`,
      //   errorMessage: [
      //     `${error.response.data.message}`,
      //     <br />,
      //     "Please contact your administrator."
      //   ],
      //   resultSucess: false,
      //   resultLoading: false
      // });

      if (type === "BuyerApprove") {
        GA.event({
          category: "2WM",
          action: "2WM Approve (Failed)",
          label: `2WM | ${this.state.data.externalId} | ${moment().format()}`
        });
      } else if (type === "BuyerReject") {
        GA.event({
          category: "2WM",
          action: "2WM Reject (Failed)",
          label: `2WM | ${this.state.data.externalId} | ${moment().format()}`
        });
      }
    }
  };

  onApprove = async () => {
    const { adjustmentType } = this.state.data;
    let apiGroup = "";
    if (adjustmentType === "Goods Return") {
      apiGroup = "approveTypeQuantity";
    } else if (adjustmentType === "Price Adjustment") {
      apiGroup = "approveTypePrice";
    }
    const prepareData = {
      apiName: apiGroup,
      files: this.state.approveFile,
      reason: this.state.approveReasonText,
      headOfMessage: "Approve",
      title: "Approve Reason",
      type: "BuyerApprove"
    };
    await this.sendData(prepareData);
  };
  onReject = async () => {
    const { adjustmentType } = this.state.data;
    let apiGroup = "";
    if (adjustmentType === "Goods Return") {
      apiGroup = "resubmitTypeQuantity";
    } else if (adjustmentType === "Price Adjustment") {
      apiGroup = "resubmitTypePrice";
    }
    const prepareData = {
      apiName: apiGroup,
      files: this.state.rejectFile,
      reason: this.state.rejectReasonText,
      headOfMessage: "Reject",
      title: "Request to resubmit",
      type: "BuyerReject"
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
  toggleResultModal = async () => {
    this.setState({
      isResultVisible: !this.state.isResultVisible
    });
    if (this.state.resultSucess) {
      this.toggleMainSectionBlock();
      this.toggleActionHistorySectionBlock();
      this.toggleMatchingDetailSectionBlock();
      await this.fetchData();
      await this.getQuantityThreshold();
      await this.checkIsInvoiceApproved();
      await this.resolvePermission();
      this.toggleMainSectionBlock();
      this.toggleActionHistorySectionBlock();
      this.toggleMatchingDetailSectionBlock();
    }
  };
  toggleMainSectionBlock = () => {
    this.setState({
      isMainSectionBlock: !this.state.isMainSectionBlock
    });
  };
  toggleMatchingDetailSectionBlock = () => {
    this.setState({
      isMatchingDetailSectionBlock: !this.state.isMatchingDetailSectionBlock
    });
  };
  toggleActionHistorySectionBlock = () => {
    this.setState({
      isActionHistorySectionBlock: !this.state.isActionHistorySectionBlock
    });
  };
  handleDismissBtnModal = () => {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  };
  // handleTimeoutModal = data => {
  //   this.alert(
  //     "Error !",
  //     [
  //       "Service temporarily unavailable. Please try again later.",
  //       <br />,
  //       "ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้ กรุณาทำรายการใหม่อีกครั้ง",
  //       <hr />,
  //       <p class="text-left px-4">
  //         <strong>Status Code:</strong> {data.statusCode || err.code}
  //       </p>,
  //       <p class="text-left px-4">
  //         <strong>Error Message:</strong> {data.message || "-"}
  //       </p>
  //     ],
  //     this.BTN_CLOSE
  //   );
  // };

  // handleUnexpectedModal(data) {
  //   this.alert(
  //     "Error !",
  //     [
  //       "An unexpected error has occurred. Please try again later.",
  //       <br />,
  //       "เกิดปัญหาบางอย่างที่ระบบ กรุณาทำรายการใหม่อีกครั้ง",
  //       <hr />,
  //       <p class="text-left px-4">
  //         <strong>Status Code:</strong> {data.statusCode || "-"}
  //       </p>,
  //       <p class="text-left px-4">
  //         <strong>Error Message:</strong> {data.message || "-"}
  //       </p>
  //     ],
  //     data.button
  //   );
  // }

  // handleSystemErrorModal(data) {
  //   this.alert("Error !", data.message, data.button || this.BTN_ACTION_BACK);
  // }

  // alert = (title, message, button = BTN_ACTION_BACK) => {
  //   this.setState({
  //     alertModalAlertTitle: title,
  //     isAlertModalVisible: true,
  //     buttonAlert: button,
  //     isTextOnly: true,
  //     alertModalMsg: message
  //   });
  // };

  // resolveError(err) {
  //   console.log(err);
  //   let data = {};
  //   if (err.response) {
  //     data = err.response.data;
  //   } else {
  //     data = {
  //       statusCode: 999,
  //       message: err.message || "-",
  //       button: err.button || this.BTN_ACTION_BACK
  //     };
  //   }
  //   if (
  //     err.code == "ECONNABORTED" ||
  //     data.statusCode == 503 ||
  //     data.statusCode == 504
  //   ) {
  //     // error timeout case
  //     this.handleTimeoutModal(data);
  //   } else if (
  //     data.statusCode == 400 ||
  //     data.statusCode == 500 ||
  //     data.statusCode == 999
  //   ) {
  //     // Unexpected Error case
  //     this.handleUnexpectedModal(data);
  //   } else {
  //     Router.push({ pathname: "/unexpected-error", query: data });
  //   }
  // }

  render() {
    const { t } = this.props;
    const {
      linearId,
      data,
      isMainSectionBlock,
      isMatchingDetailSectionBlock,
      isActionHistorySectionBlock,
      isAlertApproveModalVisible,
      alertApproveModalAlertTitle,
      isTextOnly,
      buttonAlertApprove,
      approveRemark,
      isAlertResubmitModalVisible,
      alertResubmitModalAlertTitle,
      buttonAlertResubmit,
      resubmitRemark,
      resubmitTextareaIsRequired,
      isAllowApprove,
      isAllowResubmit,
      isEnabledApprove,
      isNotRunMatching,
      itemFilter,
      matchingDetail,
      configFileApprove,
      configFileReject,
      alertModalAlertTitle,
      isAlertModalVisible,
      alertModalMsg,
      buttonAlert,
      isApproveModalVisible,
      isRejectModalVisible,
      isInvoiceApproved,
      minValue,
      maxValue,
      approveFile,
      approveReasonText,
      rejectFile,
      rejectReasonText,
      buttonResultAlert,
      resultTitle,
      isResultVisible,
      resultLoading,
      resultSucess,
      resultMsg,
      errorMessage
    } = this.state;
    let breadcrumbs = [
      { title: t("2 Way Matching"), url: "/2-way-matching-list" },
      {
        title: `${t("CN No")} ${data.externalId ? data.externalId : "-"}`,
        active: true
      }
    ];
    return (
      <div>
        <Layout {...this.props}>
          <Head>
            <title>{[t("CN No"), ` ${data.externalId}`]}</title>
          </Head>
          <PageHeader
            title={`${t("CN No")} ${data.externalId ? data.externalId : "-"}`}
            breadcrumbs={breadcrumbs}
            {...this.props}
          />
          <BlockUi tag="div" blocking={isMainSectionBlock}>
            <div
              id="mobilePageNav"
              className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
            >
              <a href="/2-way-matching-list">
                <strong className="purple">
                  <i className="fa fa-chevron-left" /> {t("2 Way Matching")}
                </strong>
              </a>
            </div>
            <section id="invoice_detail_page" className="box box--width-header">
              <div className="box__header">
                <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                  <div className="col-4">
                    {""}
                    {t("Entry Date")} : {""}
                    {data.entryDate
                      ? moment(data.entryDate).format("DD/MM/YYYY")
                      : "-"}
                  </div>
                  <div className="col-8 text-right">
                    {" "}
                    {t("2 Way Matching Status")} :{" "}
                    <strong
                      style={{
                        color: statusColor[data.matchingStatus],
                        "margin-right": "15px"
                      }}
                    >
                      {data.matchingStatus}
                    </strong>
                    <div className="d-none d-lg-inline-block">
                      <button
                        name="btnRequestToResubmit"
                        className="btn btn--transparent btn-wide mr-2"
                        hidden={!isAllowResubmit}
                        onClick={this.toggleRejectModal}
                      >
                        Request to resubmit
                      </button>
                      <button
                        id="btnApprove"
                        name="btnApprove"
                        className={`btn btn-wide ${
                          isEnabledApprove && isInvoiceApproved
                            ? ""
                            : "btn-disabled"
                        }`}
                        hidden={!isAllowApprove}
                        onClick={this.toggleApproveModal}
                      >
                        Approve
                      </button>
                      {/*<button
                        name="btnApprove"
                        className="btn btn-wide"
                        hidden={!isAllowClarify}
                        onClick={this.toggleClarifyModal}
                      >
                        Clarify
                      </button> */}
                    </div>
                  </div>
                  <div
                    className={`col-12 px-0 mt-3 ${
                      !isAllowResubmit &&
                      !isEnabledApprove &&
                      !isInvoiceApproved &&
                      !isAllowApprove
                        ? "d-none"
                        : "d-inline-block d-lg-none"
                    }`}
                  >
                    <button
                      name="btnRequestToResubmit"
                      className="btn btn--transparent btn-wide mr-2"
                      hidden={!isAllowResubmit}
                      onClick={this.toggleRejectModal}
                    >
                      Request to resubmit
                    </button>
                    <button
                      id="btnApprove"
                      name="btnApprove"
                      className={`btn btn-wide ${
                        isEnabledApprove && isInvoiceApproved
                          ? ""
                          : "btn-disabled"
                      }`}
                      hidden={!isAllowApprove}
                      onClick={this.toggleApproveModal}
                    >
                      Approve
                    </button>
                    {/*<button
                        name="btnApprove"
                        className="btn btn-wide"
                        hidden={!isAllowClarify}
                        onClick={this.toggleClarifyModal}
                      >
                        Clarify
                      </button> */}
                  </div>
                </div>
              </div>
              <div className="box__inner">
                {/* Desktop Version - Start */}
                <Collapse
                  id="vendorInfo"
                  expanded="true"
                  collapseHeader={[t("Vendor"), t("Company")]}
                  className="d-none d-lg-flex flex-wrap"
                >
                  <div className="d-flex flex-wrap px-0">
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
                        value={data.vendor.vendorBranchCode}
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
                        value={`${data.company.companyBranchCode} - ${data.company.companyBranchName}`}
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
                  className="d-flex flex-wrap d-lg-none"
                >
                  <div className="d-flex flex-wrap w-100 px-0">
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
                        value={data.vendor.vendorBranchCode}
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
                  id="companyInfo"
                  expanded="true"
                  collapseHeader={[t("Company")]}
                  className="d-flex flex-wrap d-lg-none"
                >
                  <div className="d-flex flex-wrap w-100 px-0">
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
                        value={`${data.company.companyBranchCode} - ${data.company.companyBranchName}`}
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
                {/* Mobile Version - End */}

                <Collapse
                  id="creditNoteInfo"
                  expanded="true"
                  collapseHeader={[t("Credit Note Information")]}
                >
                  <div className="d-flex flex-wrap px-0">
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Credit Note No")}
                        colLabel="6"
                        value={data.creditNoteInfo.creditNoteNo}
                      />
                      <div className="row">
                        <p className="col-6 text-right">
                          {t("Invoice Ref No")} :
                        </p>
                        <p className="col-6">
                          <a
                            href={`/invoice-detail?linearId=${data.creditNoteInfo.InvoiceLinearId}`}
                          >
                            {data.creditNoteInfo.InvoiceRef}
                          </a>
                          <strong
                            id="invoiceApproved"
                            className="text-danger"
                            hidden
                          >
                            &nbsp;Invoice not approved
                          </strong>
                        </p>
                      </div>
                      {/* <CollapseItemExternalLink
                        label="Invoice Ref No."
                        value={data.creditNoteInfo.InvoiceRef}
                      /> */}

                      {/* <CollapseItemText t={t}
                        label="Attach Credit Note"
                        value={
                          data.creditNoteInfo.AttactCreditNote
                            ? data.creditNoteInfo.AttactCreditNote.map(item => {
                                return (
                                  <div>
                                    {item.name}&nbsp;
                                    <a
                                      href={item.href}
                                      className="link list-link"
                                    >
                                      Download
                                    </a>
                                  </div>
                                );
                              })
                            : "-"
                        }
                      /> */}
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Credit Note Date")}
                        colLabel="6"
                        value={moment(
                          data.creditNoteInfo.creditNoteDate
                        ).format("DD/MM/YYYY")}
                      />

                      <CollapseItemText
                        t={t}
                        label={t("Reason")}
                        colLabel="6"
                        value={data.creditNoteInfo.Reason}
                      />
                    </div>
                  </div>
                </Collapse>

                <Collapse
                  id="attachmentLists"
                  expanded="true"
                  collapseHeader={[t("Attachments")]}
                >
                  <div className="d-flex flex-wrap px-0">
                    <div className="col-12 col-lg-6">
                      <CollapseItemExternalLink
                        label={t("Attach Credit Note")}
                        colLabel="6"
                        value={
                          data.attachments.fileAttachmentsCreditNote.length > 0
                            ? data.attachments.fileAttachmentsCreditNote
                            : "-"
                        }
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemExternalLink
                        label={t("Other Document")}
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
                          <p>{t("Calculated by System Amount")}: </p>
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
                          <p>{t("Amount in Invoice")}: </p>
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
                          <p>{t("Diff Amount")}: </p>
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
                          <p>{t("Calculated by System Amount")}: </p>
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
                          <p>{t("Amount in Invoice")}: </p>
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
                          <p>{t("Diff Amount")}: </p>
                        </div>
                        <div className="col-6 text-left px-0">
                          {this.renderSubText(
                            "SUB_TOTAL",
                            `${this.formatCurrency(
                              data.amountMatching.subTotal.diffAmount,
                              2
                            )} ${data.currency}`
                          )}
                        </div>
                      </div>
                      {/* Sub Total - End */}
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
                <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                  <div className="col-12 col-lg-6">
                    <h3 className="mb-0 mb-lg-2">{t("Matching Details")}</h3>
                  </div>
                  <div className="col-6 d-none d-lg-flex flex-wrap justify-content-end align-items-center">
                    <div className="filter col-8 d-flex justify-content-end">
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
                    <div className="searchBox input-append-icon col-4">
                      <MatchDetailSearch2Way
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
              <div className="box__inner">
                {matchingDetail
                  .filter(item => {
                    return (
                      itemFilter === "All" || itemFilter === item.matchedStatus
                    );
                  })
                  .filter(item => {
                    return item.checked;
                  })
                  .map((item, index) => {
                    console.log("data : ", data);
                    return (
                      <MatchingItem
                        id="matchingItem"
                        index={index}
                        data={data}
                        value={item}
                        canSelectGr
                        matchingType="2wm"
                        lifecycleTag={lifecycleTag}
                        lifeCycle={data.lifecycle}
                        permission="CN-Tag-Goods-Received"
                        creditNoteLinearId={this.props.url.query.linearId}
                        linearId={item.purchaseItemLinearId}
                        auth={this.state.UserAuthority}
                        userType={this.props.user.organisationUnit}
                        reloadPageAfterTaggedGR={this.fetchData}
                        getTagGR={this.getTagGR}
                        submitTagGr={this.submitTagGr}
                        notRunMatching={isNotRunMatching}
                        lifecycleForNotRunMatching={lifecycleForNotRunMatching}
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
              className="box box--width-header px-3"
            >
              <div className="box__header px-0 px-lg-3">
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
                            <th>{t("Modified By")}</th>
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
                                      <td colspan="3">
                                        <div className="d-flex flex-wrap w-100">
                                          <div className="col-6 px-0 py-3 text-right">
                                            {t("Modified by")}:{" "}
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
                              <td colSpan="5" className="text-center">
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
          </BlockUi>
        </Layout>
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
        {/* <ModalAlert
          title={alertApproveModalAlertTitle}
          visible={isAlertApproveModalVisible}
          button={buttonAlertApprove}
        >
          <div className="form-label-group">
            <textarea
              id="approveRemark"
              name="approveRemark"
              className="form-control"
              placeholder="Reason"
              rows="5"
              onChange={this.handleOnchangeRemarkApprove}
              value={approveRemark}
              required
            />
          </div>
        </ModalAlert> */}
        <ModalDropFile
          title={"Approve"}
          isVisible={isApproveModalVisible}
          onFileChange={this.onApproveFileChange}
          onReasonChange={this.onApproveReasonChange}
          isReasonRequire={false}
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
      </div>
    );
  }
}
export default withAuth(
  withTranslation(["twoway-detail", "detail", "common", "menu"])(
    TwoWayMatchingDetail
  )
);
