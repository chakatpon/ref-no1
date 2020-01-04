import React, { Component } from "react";
import jQuery from "jquery";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import "../libs/mycools";
import ListDetail from "../components/ListDetail";
import ColumnList from "../libs/column";
import ColumnModal from "../components/column-modal";
import api from "../libs/api";
import Link from "next/link";
import BlockUi from "react-block-ui";
import TableDetail from "../components/TableDetail";
import numeral from "numeral/numeral";
import { i18n, withTranslation } from "~/i18n";
import mobileModel from "../columns/mobiles/po-item-list.json";
import { formatNumber } from "../components/invoices/edit/models/item";
import handleError from "./handleError";
import {
  PageHeader,
  Collapse,
  CollapseItemText,
  CollapseItemLink,
  CollapseItemInvDrillDown,
  CollapseNoExpand,
  CollapseNoExpandWithButton,
  CollapseItemExternalLink
} from "../components/page";
import ModalAlert, { BTN_ACTION_BACK } from "../components/modalAlert";
import statusColor from "../configs/color.po.json";
import GA from "~/libs/ga";

const lifecycleConfirm = ["APPROVED", "REJECTED"];
const lifecycleReject = ["APPROVED"];
const lang = "po-detail";

class PurchaseOrderDetail extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("po");
    this.apisitm = new api().group("poiteminfo");
    this.api = new ApiService();
    this.columnList = new ColumnList();
    this.columnListItm = new ColumnList();

    this.routeToPOList = this.routeToPOList.bind(this);
    this.handleRejectSelectOnChange = this.handleRejectSelectOnChange.bind(
      this
    );
    this.handleRejectRemarkOnChange = this.handleRejectRemarkOnChange.bind(
      this
    );
    this.handleDismissBtnRejectModal = this.handleDismissBtnRejectModal.bind(
      this
    );
    this.handleRejectModal = this.handleRejectModal.bind(this);
    this.handleConfirmModal = this.handleConfirmModal.bind(this);
    this.handleSubmitReject = this.handleSubmitReject.bind(this);
    this.handleClearRejectInput = this.handleClearRejectInput.bind(this);
    this.handleDismissBtnModal = this.handleDismissBtnModal.bind(this);
    this.handleSubmitConfirm = this.handleSubmitConfirm.bind(this);

    this.state = {
      detailItems: {},
      purchaseItems: [],
      columnList: [],
      reasonDropdown: [],
      blocking: true,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: [],
      isAlertRejectModalVisible: false,
      alertRejectModalAlertTitle: "",
      buttonAlertReject: [],
      lastRejectedReason: "",
      lastRejectedRemark: "",
      isTextOnly: true,
      rejectTextareaIsRequired: false,
      rejectDropdownIsRequired: false,
      saveColumnUrl: this.apis.url("model.detail"),
      conditionPOAttach: [],
      conditionOtherAttach: [],
      actionHistory: [],
      vendorAddress: "",
      companyAddress: "",
      retentionPercent: "",
      retentionTermDays: "",
      advanceItems: [],
      normalItems: [],
      isAllowReject: false,
      isAllowConfirm: false,
      tableDetailBtn: [],
      mobileModel: mobileModel
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
  createdRow = (row, data, dataIndex) => {
    if (data.deleteFlag === "DELETED") {
      $(row).addClass("deletedRow");
    }
    if (data.deleteFlag === "BLOCKED") {
      $(row).addClass("blockedRow");
    }
  };

  async componentWillMount() {
    await this.permissionPage();
    await this.fetchData();
    await this.setConditionFileAttachment();
    await this.resolvePermission();
    if (this.props.user.organisationUnit == "BUYER") {
      await this.getActionHistory();
    }

    this.setState({ blocking: false });
  }

  async componentDidMount() {
    const { t } = this.props;
    const columnDisplayText = t("Column Display");
    const exportText = t("Export");
    $(document).ready(() => {
      makePopover(columnDisplayText, exportText);
    });
  }

  permissionPage = () => {
    const { permisions } = this.props;
    if (!permisions.includes("PO-Detail")) {
      Router.push("/dashboard");
    }
  };

  fetchData = async () => {
    if (
      this.props.url.query.linearId == undefined ||
      this.props.url.query.linearId == ""
    ) {
      Router.push("/purchase-order");
      return;
    }
    try {
      const reasonDropdown = await this.apis.call("reasonReject");
      const { permisions } = this.props;
      this.setState({
        UserAuthority: permisions
      });
      const res = await this.apis.call("detail", {
        linearId: this.props.url.query.linearId
      });

      this._columnRender(this.model);

      if (
        res.rows.length > 0 &&
        reasonDropdown.form.sections[0].fields.length > 0
      ) {
        reasonDropdown.form.sections[0].fields.map(r => {
          if (r.key === "poConfirmReason") {
            this.setState({ reasonDropdown: r.options });
          }
        });

        this.setState({
          detailItems: res.rows[0]
        });

        this.setState({
          purchaseItems: res.rows[0].purchaseItems
        });
        let taxData = null;
        let whtData = null;
        let taxDescription = "-";
        let whtDescription = "-";

        if (this.props.user.organisationUnit == "BUYER") {
          taxData = await this.getTaxDescription(this.state.purchaseItems[0]);
          whtData = await this.getWHTDescription(this.state.purchaseItems[0]);
        }

        if (taxData) {
          if (taxData.rows[0]) {
            taxDescription = taxData.rows[0].taxDescription;
          }
        }
        if (whtData) {
          if (whtData.rows[0]) {
            whtDescription = whtData.rows[0].taxDescription;
          }
        }

        this.state.purchaseItems.map(item => {
          item.taxDescription = taxDescription;
          item.withholdingTaxDescription = whtDescription;
        });

        const normalItems = this.state.purchaseItems.filter(
          i =>
            i.itemCategory === undefined ||
            i.itemCategory === "" ||
            i.itemCategory === "NORMAL"
        );

        let advanceItems = this.state.purchaseItems.filter(
          i => i.itemCategory === "ADVANCE"
        );

        this.setState({
          normalItems: normalItems,
          advanceItems: advanceItems
        });
        this.showMoreShowLess();
        this.setAddress();
      } else {
        const message = [
          "Sorry, you cannot get detail of this purchase order.",
          <br />,
          " Please contact your administrator."
        ];

        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
        // this.setState({
        //   isAlertModalVisible: true,
        //   alertModalAlertTitle: "Error!",
        //   alertModalMsg: [
        //     "Sorry, you cannot get detail of this purchase order.",
        //     <br />,
        //     " Please contact your administrator."
        //   ],
        //   isTextOnly: true,
        //   buttonAlert: [
        //     {
        //       label: "Back",
        //       attribute: {
        //         className: "btn btn--transparent btn-wide",
        //         onClick: this.routeToPOList
        //       }
        //     }
        //   ]
        // });
      }
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
      // this.setState({
      //   isAlertModalVisible: true,
      //   alertModalAlertTitle: "Error!",
      //   alertModalMsg: [
      //     "Sorry, you cannot get detail of this purchase order.",
      //     <br />,
      //     " Please contact your administrator."
      //   ],
      //   isTextOnly: true,
      //   buttonAlert: [
      //     {
      //       label: "Back",
      //       attribute: {
      //         className: "btn btn--transparent btn-wide",
      //         onClick: this.routeToPOList
      //       }
      //     }
      //   ]
      // });
    }
  };

  getTaxDescription = async data => {
    try {
      const tax_res = await this.apis.call("taxdesc", {
        companyTaxId: data.businessPlaceTaxNumber,
        taxCode: data.taxCode
      });
      return tax_res;
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  getWHTDescription = async data => {
    try {
      const res = await this.apis.call("whtdesc", {
        companyTaxId: data.businessPlaceTaxNumber,
        taxCode: data.withholdingTaxCode || ""
      });
      return res;
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  setAddress = () => {
    let vendorAddress = `${this.state.detailItems.vendorAddress1 || ""} ${this
      .state.detailItems.vendorAddress2 || ""} ${this.state.detailItems
      .vendorDistrict || ""} ${this.state.detailItems.vendorCity || ""} ${this
      .state.detailItems.vendorPostalCode || ""}`;

    let companyAddress = `${this.state.detailItems.businessPlaceAddress1 ||
      ""} ${this.state.detailItems.businessPlaceAddress2 || ""} ${this.state
      .detailItems.businessPlaceDistrict || ""} ${this.state.detailItems
      .businessPlaceCity || ""} ${this.state.detailItems
      .businessPlacePostalCode || ""}`;

    this.setState({
      vendorAddress,
      companyAddress
    });
  };

  getActionHistory = async () => {
    try {
      const res = await this.apis.call("actionHistory", {
        documentType: "purchaseOrder",
        documentLinearId: this.state.detailItems.linearId
      });
      this.setState({
        actionHistory: res
      });
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      // this.setState({
      //   isAlertModalVisible: true,
      //   alertModalAlertTitle: "Error!",
      //   alertModalMsg: [
      //     "Sorry, you cannot get action history detail.",
      //     <br />,
      //     " Please contact your administrator."
      //   ],
      //   isTextOnly: true,
      //   buttonAlert: [
      //     {
      //       label: "Close",
      //       attribute: {
      //         className: "btn btn--transparent btn-wide",
      //         onClick: this.handleDismissBtnModal
      //       }
      //     }
      //   ]
      // });
    }
  };

  setConditionFileAttachment = () => {
    let conditionPOAttach = [];
    let conditionOtherAttach = [];
    if (this.state.detailItems && this.state.detailItems.fileAttachments) {
      this.state.detailItems.fileAttachments.map(item => {
        const dt = {
          name: item.attachmentName,
          href: `/download/${item.attachmentHash}/${item.attachmentName}?filename=${item.attachmentName}&owner=${item.owner}`
        };
        if (item.attachmentType === "POForm") {
          return conditionPOAttach.push(dt);
        } else if (
          item.attachmentType === "Others" ||
          item.attachmentType === "Other"
        ) {
          return conditionOtherAttach.push(dt);
        }
      });
    }
    this.setState({
      conditionPOAttach,
      conditionOtherAttach
    });
  };

  _columnRender = async () => {
    try {
      const { t } = this.props;
      const { mobileModel } = this.state;

      let model = await this.apis.call("model.detail");

      this.columnList.setCustomFormat("quantity.initial", {
        className: "dtClickAction",
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (row.quantity.remaining === "") {
            return "-";
          }
          return formatNumber(row.quantity.initial, 3);
        }
      });
      this.columnList.setCustomFormat("deleteFlag", {
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (row.deleteFlag === "DELETE") {
            return "-";
          }
          return data;
        }
      });
      this.columnList.setCustomFormat("quantity.remaining", {
        className: "dtClickAction",
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (row.quantity.remaining === "") {
            return "-";
          }

          return formatNumber(row.quantity.remaining, 3);
        }
      });
      for (let i in model.table.columns) {
        model.table.columns[i].searchKey = model.table.columns[i].header;
        model.table.columns[i].header = await t(
          model.table.columns[i].header.replace(/[|&;$%@"<>()+,.-]/g, "")
        );
      }
      const columns = this.columnList.initColumns(model);
      this.setState({ columnList: columns, model: model });

      // set mobile model

      mobileModel.table.columns.map(async (column, index) => {
        mobileModel.table.columns[index].title = await t(column.header);
      });

      this.setState({
        mobileModel
      });
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  routeToPOList() {
    Router.push("/purchase-order");
  }

  resolvePermission() {
    const { t } = this.props;
    let isAllowReject = false;
    let isAllowConfirm = false;
    let tableDetailBtn = [];
    if (lifecycleConfirm.includes(this.state.detailItems.lifecycle)) {
      if (this.state.UserAuthority.includes("PO-Confirm-Approval")) {
        if (this.props.user.organisationUnit == "SELLER") {
          isAllowConfirm = true;
        }
      }
    }
    if (lifecycleReject.includes(this.state.detailItems.lifecycle)) {
      if (this.state.UserAuthority.includes("PO-Confirm-Approval")) {
        if (this.props.user.organisationUnit == "SELLER") {
          isAllowReject = true;
        }
      }
    }
    if (this.state.UserAuthority.includes("PO-Delivery-List")) {
      tableDetailBtn = [
        {
          role: "externalLink",
          label: t("Delivery Schedule"),
          attr: {
            className: "btn btn-wide mb-15",
            onClick: this.gotoPODeliverySchedule
          }
        }
      ];
    }

    this.setState({
      isAllowReject,
      isAllowConfirm,
      tableDetailBtn
    });
  }

  showMoreShowLess() {
    $("body").on("click", "#btnShow", function() {
      var status = $(this).attr("data-status");
      if (status == "more") {
        $("#vendorInfo-withShowBtn").addClass("showMore");
        $(this).attr("data-status", "less");
      } else {
        $("#vendorInfo-withShowBtn").removeClass("showMore");
        $(this).attr("data-status", "more");
      }
    });
  }

  calTax(amount, percentage) {
    return (amount * (percentage / 100)).toFixed(2);
  }

  formatCurrency(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  }

  handleRejectModal() {
    const { t } = this.props;
    this.setState({
      isAlertRejectModalVisible: true,
      alertRejectModalAlertTitle: t("Reject Reason"),
      isTextOnly: false,
      buttonAlertReject: [
        {
          label: t("Cancel"),
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissBtnRejectModal
          }
        },
        {
          label: t("Submit"),
          attribute: {
            className: "btn btn-wide",
            onClick: this.handleSubmitReject
          }
        }
      ]
    });
  }

  handleConfirmModal() {
    const { t } = this.props;
    this.setState({
      isAlertModalVisible: true,
      alertModalAlertTitle: t("Confirm Purchase Order"),
      isTextOnly: true,
      alertModalMsg: t("Do you want to confirm this purchase order?"),
      buttonAlert: [
        {
          label: t("No"),
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissBtnModal
          }
        },
        {
          label: t("Yes"),
          attribute: {
            className: "btn btn-wide",
            onClick: this.handleSubmitConfirm
          }
        }
      ]
    });
  }

  handleRejectSelectOnChange(event) {
    if (event.target.value === "" && this.state.lastRejectedReason === "") {
      this.setState({
        rejectDropdownIsRequired: true
      });
    } else {
      this.setState({
        lastRejectedReason: event.target.value,
        rejectDropdownIsRequired: false
      });
    }
  }

  handleRejectRemarkOnChange(event) {
    if (event.target.value === "" && this.state.lastRejectedRemark === "") {
      this.setState({
        rejectTextareaIsRequired: true
      });
    } else {
      this.setState({
        lastRejectedRemark: event.target.value,
        rejectTextareaIsRequired: false
      });
    }
  }

  async handleSubmitReject() {
    if (
      (this.state.lastRejectedRemark === "" &&
        this.state.lastRejectedReason === "Other") ||
      this.state.lastRejectedReason === ""
    ) {
      if (this.state.lastRejectedReason === "") {
        this.setState({
          rejectDropdownIsRequired: true
        });
      }
      if (
        this.state.lastRejectedRemark === "" &&
        this.state.lastRejectedReason === "Other"
      ) {
        this.setState({
          rejectTextareaIsRequired: true
        });
      }
    } else {
      let rejectObj = [
        {
          linearId: this.state.detailItems.linearId,
          lastRejectedReason: this.state.lastRejectedReason,
          lastRejectedRemark: this.state.lastRejectedRemark
        }
      ];

      try {
        GA.event({
          category: "Purchase Order",
          action: "PO Rejected (Request)",
          label: `Purchase Order | ${
            this.state.detailItems.purchaseOrderNumber
          } | ${moment().format()}`
        });

        this.setState({
          isAlertRejectModalVisible: false,
          blocking: true
        });
        await this.apis.call(
          "rejectPO",
          {},
          { method: "put", data: rejectObj }
        );

        GA.event({
          category: "Purchase Order",
          action: "PO Rejected (Success)",
          label: `Purchase Order | ${
            this.state.detailItems.purchaseOrderNumber
          } | ${moment().format()}`
        });

        Router.push("/purchase-order");
      } catch (err) {
        console.error(err);

        GA.event({
          category: "Purchase Order",
          action: "PO Rejected (Failed)",
          label: `Purchase Order | ${
            this.state.detailItems.purchaseOrderNumber
          } | ${moment().format()}`
        });

        this.setState({
          lastRejectedReason: "",
          lastRejectedRemark: "",
          blocking: false,
          isAlertRejectModalVisible: false
        });
        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({
          ...response
        });
        // this.setState({
        //   lastRejectedReason: "",
        //   lastRejectedRemark: "",
        //   blocking: false,
        //   isAlertRejectModalVisible: false,
        //   isAlertModalVisible: true,
        //   alertModalAlertTitle: "Error!",
        //   isTextOnly: true,
        //   alertModalMsg: [
        //     "Sorry, you cannot reject this purchase order.",
        //     <br />,
        //     "Please contact your administrator."
        //   ],
        //   buttonAlert: [
        //     {
        //       label: "Close",
        //       attribute: {
        //         className: "btn btn--transparent btn-wide",
        //         onClick: this.handleDismissBtnModal
        //       }
        //     }
        //   ]
        // });
      }
    }
  }

  async handleSubmitConfirm() {
    let confirmObj = [
      {
        linearId: this.state.detailItems.linearId
      }
    ];

    try {
      GA.event({
        category: "Purchase Order",
        action: "PO Confirm (Request)",
        label: `Purchase Order | ${
          this.state.detailItems.purchaseOrderNumber
        } | ${moment().format()}`
      });

      this.setState({
        blocking: true,
        isAlertModalVisible: false
      });
      await this.apis.call(
        "confirmPO",
        {},
        { method: "put", data: confirmObj }
      );

      GA.event({
        category: "Purchase Order",
        action: "PO Confirm (Success)",
        label: `Purchase Order | ${
          this.state.detailItems.purchaseOrderNumber
        } | ${moment().format()}`
      });

      Router.push("/purchase-order");
    } catch (err) {
      console.error(err);

      GA.event({
        category: "Purchase Order",
        action: "PPO Confirm (Failed)",
        label: `Purchase Order | ${
          this.state.detailItems.purchaseOrderNumber
        } | ${moment().format()}`
      });

      this.setState({
        blocking: false
      });

      const response = handleError(err, this.handleDismissBtnModal);

      this.setState({
        ...response
      });
    }
  }

  handleClearRejectInput() {
    this.setState({
      lastRejectedReason: "",
      lastRejectedRemark: ""
    });
  }

  handleDismissBtnModal() {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  }

  handleDismissBtnRejectModal() {
    this.setState({
      isAlertRejectModalVisible: false,
      alertModalAlertRejectTitle: "",
      buttonAlertReject: [],
      lastRejectedReason: "",
      lastRejectedRemark: "",
      rejectDropdownIsRequired: false,
      rejectTextareaIsRequired: false
    });
  }

  formatCurrencyDigit = (amount, digit) => {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  };

  gotoPODeliverySchedule = () => {
    let obj = {
      poNumber: this.state.detailItems.purchaseOrderNumber
    };
    window.localStorage.setItem("searchInput-po-delivery", JSON.stringify(obj));
    Router.push(
      `/po-delivery-schedule?ref=podetail&ponumber=${this.state.detailItems.purchaseOrderNumber}&linearId=${this.state.detailItems.linearId}`
    );
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
    let { ref: urlRef } = this.props.url.query;
    if (typeof urlRef == "object") {
    } else if (typeof urlRef == "string") {
      urlRef = [urlRef];
    }
    let breadcrumbs = [];
    let breadcrumbsGroup = [];

    if (urlRef !== "undefined") {
      if (urlRef && urlRef.length > 0) {
        urlRef.map(b => {
          let r = b.split(",");
          console.log(r);
          switch (r[0]) {
            case "3wm":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: "3 Way Matching",
                  url: "/3-way-matching-list"
                });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `3 Way Matching No. ${r[2] || ""}`,
                url: `/3-way-matching-detail?linearId=${r[1]}`
              });
              break;
          }
        });
        breadcrumbs.push({
          title: `${t("Purchase Order No")} ${
            this.state.detailItems.purchaseOrderNumber
          }`,
          active: true
        });
      } else {
        breadcrumbs = [
          { title: t("Purchase Order"), url: "/purchase-order" },
          {
            title: `${t("Purchase Order No")} ${this.state.detailItems
              .purchaseOrderNumber || "-"}`,
            active: true
          }
        ];
      }
    }
    const {
      documentEntryDate,
      purchaseOrderNumber,
      businessPlaceTaxNumber,
      status,
      vendorNumber,
      vendorName,
      vendorTaxNumber,
      vendorBranchCode,
      vendorBranchName,
      vendorTelephone,
      vendorOfficerName,
      vendorOfficerTelephone,
      vendorOfficerEmail,
      vendorEmail,
      vendorAddress1,
      companyCode,
      companyName,
      companyTaxNumber,
      companyBranchCode,
      companyBranchName,
      businessPlaceAddress1,
      businessPlaceAddress2,
      businessPlaceOrganization,
      businessPlaceOfficerName,
      businessPlaceOfficerEmail,
      businessPlaceTelephone,
      paymentTermDays,
      paymentTermDescription,
      invoiceList,
      customisedFields,
      retentionPercent,
      retentionTermDays,
      retentionAmount,
      contractNumber
    } = this.state.detailItems;
    const { linearId } = this.props.url.query;
    const {
      isAllowReject,
      isAllowConfirm,
      reasonDropdown,
      isAlertModalVisible,
      alertModalAlertTitle,
      alertModalMsg,
      buttonAlert,
      isAlertRejectModalVisible,
      alertRejectModalAlertTitle,
      buttonAlertReject,
      isTextOnly,
      lastRejectedReason,
      lastRejectedRemark,
      rejectTextareaIsRequired,
      rejectDropdownIsRequired,
      conditionPOAttach,
      conditionOtherAttach,
      actionHistory,
      vendorAddress,
      companyAddress,
      advanceItems,
      detailItems
    } = this.state;

    let myActionHistory = [];
    if (this.state.detailItems.lastUpdatedDate) {
      myActionHistory.push({
        actionDate: this.state.detailItems.lastUpdatedDate,
        actionUser: this.state.detailItems.lastUpdatedBy,
        actionText: "Uploaded",
        actionReason: "-"
      });
    }
    if (this.state.detailItems.lastRejectedDate) {
      myActionHistory.push({
        actionDate: this.state.detailItems.lastRejectedDate,
        actionUser: this.state.detailItems.lastRejectedBy,
        actionText: "Rejected",
        actionReason: `${this.state.detailItems.lastRejectedReason}:${this.state.detailItems.lastRejectedRemark}`
      });
    }
    if (this.state.detailItems.lastConfirmedDate) {
      myActionHistory.push({
        actionDate: this.state.detailItems.lastConfirmedDate,
        actionUser: this.state.detailItems.lastConfirmedBy,
        actionText: "Acknowledged",
        actionReason: "-"
      });
    }
    let invoiceListArr = [];
    if (this.state.detailItems && this.state.detailItems.invoiceList) {
      invoiceListArr = this.state.detailItems.invoiceList.split(",").map(f => {
        return {
          name: f,
          href: `/invoice-detail?linearId=$linearId&ref=podetail,${linearId}&purchaseOrderNumber=${purchaseOrderNumber}`
          //href: `/invoice-detail?linearId=${f}&ref=podetail,$linearId&purchaseOrderNumber=${purchaseOrderNumber}`
        };
      });
    }

    return (
      <Layout {...this.props}>
        <PageHeader
          title={[t("Purchase Order No"), ` ${purchaseOrderNumber || "-"}`]}
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <BlockUi tag="div" blocking={this.state.blocking}>
          <div
            id="mobilePageNav"
            className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
          >
            <a href="/purchase-order">
              <strong className="purple">
                <i className="fa fa-chevron-left" /> {t("Purchase Order")}
              </strong>
            </a>
          </div>
          <section id="invoice_detail_page" className="box box--width-header">
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-2">
                <div className="col-4 pl-0 pl-lg-3">
                  {""}
                  {t("Entry Date")} : {""}
                  {documentEntryDate
                    ? moment(documentEntryDate).format("DD/MM/YYYY")
                    : "-"}
                </div>
                <div className="col-8 text-right">
                  {t("Status")} :{" "}
                  <strong
                    className="mr-0 mr-lg-3"
                    style={{
                      color: statusColor[status]
                    }}
                  >
                    {" "}
                    {status}
                  </strong>
                  <div className="d-none d-lg-inline-block">
                    <button
                      name="btnReject"
                      className="btn btn--transparent btn-wide mr-2"
                      onClick={() => this.handleRejectModal()}
                      hidden={!isAllowReject}
                    >
                      {t("Reject")}
                    </button>
                    <button
                      name="btnConfirm"
                      className="btn btn-wide mr-2"
                      onClick={() => this.handleConfirmModal()}
                      hidden={!isAllowConfirm}
                    >
                      {t("Confirm")}
                    </button>
                  </div>
                </div>
                <div
                  className={`col-12 px-0 mt-3 ${
                    !isAllowReject && !isAllowConfirm
                      ? "d-none"
                      : "d-inline-block d-lg-none"
                  }`}
                >
                  <button
                    name="btnReject"
                    className="btn btn--transparent btn-wide mr-2"
                    onClick={() => this.handleRejectModal()}
                    hidden={!isAllowReject}
                  >
                    {t("Reject")}
                  </button>
                  <button
                    name="btnConfirm"
                    className="btn btn-wide mr-2"
                    onClick={() => this.handleConfirmModal()}
                    hidden={!isAllowConfirm}
                  >
                    {t("Confirm")}
                  </button>
                </div>
              </div>
            </div>
            <div className="box__inner pt-0 pt-lg-3">
              {/* Desktop Version - Start */}
              <Collapse
                id="vendorInfo-withShowBtn"
                key="vendorInfo-withShowBtn"
                expanded="true"
                collapseHeader={[t("Vendor"), t("Company")]}
                className="d-none d-lg-inline-block"
              >
                <div className="row">
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={vendorTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${vendorBranchCode || "-"} ${
                        vendorBranchName ? `(${vendorBranchName})` : ""
                      }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={vendorAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={vendorTelephone}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Email")}
                      value={vendorEmail}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Sales Name")}
                      value={vendorOfficerName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Sales Tel")}
                      value={vendorOfficerTelephone}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Sales Email")}
                      value={vendorOfficerEmail}
                    />
                  </div>
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={businessPlaceTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${companyBranchCode || "-"} ${
                        companyBranchName ? `(${companyBranchName})` : ""
                      }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={companyAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={businessPlaceTelephone}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Email")}
                      value={businessPlaceOfficerEmail}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Business Place")}
                      value={
                        customisedFields ? customisedFields.businessPlace : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Organization")}
                      value={businessPlaceOrganization}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Group Name")}
                      value={businessPlaceOfficerName}
                    />
                  </div>
                </div>
                <div className="row justify-content-center border-top pt-3">
                  <a href="javascript:void(0);" id="btnShow" data-status="more">
                    <strong id="showLess" className="gray-1">
                      {t("Show Less")}&nbsp;
                      <svg
                        width="14px"
                        height="9px"
                        aria-hidden="true"
                        viewBox="0 0 14 9"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                      >
                        <g
                          id="PO-Detail"
                          stroke="none"
                          strokeWidth={1}
                          fill="none"
                          fillRule="evenodd"
                        >
                          <g
                            id="PO_detail_full"
                            transform="translate(-777.000000, -597.000000)"
                            fillRule="nonzero"
                            stroke="#4A4A4A"
                            strokeWidth={2}
                          >
                            <g
                              id="01_address_detail"
                              transform="translate(166.000000, 170.000000)"
                            >
                              <g
                                id="more_detail"
                                transform="translate(516.000000, 421.000000)"
                              >
                                <polyline
                                  id="Path-2"
                                  transform="translate(102.127660, 12.000000) scale(1, -1) translate(-102.127660, -12.000000) "
                                  points="96 9 102.12766 15 108.255319 9"
                                />
                              </g>
                            </g>
                          </g>
                        </g>
                      </svg>
                    </strong>
                    <strong id="showMore" className="gray-1">
                      {t("Show More")} &nbsp;
                      <svg
                        width="14px"
                        height="9px"
                        aria-hidden="true"
                        viewBox="0 0 14 9"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                      >
                        <g
                          id="Symbols"
                          stroke="none"
                          strokeWidth={1}
                          fill="none"
                          fillRule="evenodd"
                        >
                          <g
                            id="address_detail_po"
                            transform="translate(-609.000000, -312.000000)"
                            fillRule="nonzero"
                            stroke="#4A4A4A"
                            strokeWidth={2}
                          >
                            <g id="address_detail">
                              <g
                                id="more_detail"
                                transform="translate(509.000000, 303.000000)"
                              >
                                <polyline
                                  id="Path-2"
                                  points="101 10 107.12766 16 113.255319 10"
                                />
                              </g>
                            </g>
                          </g>
                        </g>
                      </svg>
                    </strong>
                  </a>
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
                <div className="d-flex flex-wrap">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={vendorTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${vendorBranchCode || "-"} ${
                        vendorBranchName ? `(${vendorBranchName})` : ""
                      }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={vendorAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={vendorTelephone}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Email")}
                      value={vendorEmail}
                    />
                  </div>
                </div>
              </Collapse>
              <Collapse
                id="companyInfo"
                expanded="true"
                collapseHeader={[t("Company")]}
                className="d-inline-block d-lg-none"
              >
                <div className="d-flex flex-wrap">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={businessPlaceTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${companyBranchCode || "-"} ${
                        companyBranchName ? `(${companyBranchName})` : ""
                      }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={companyAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={businessPlaceTelephone}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Email")}
                      value={businessPlaceOfficerEmail}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Business Place")}
                      value={
                        customisedFields ? customisedFields.businessPlace : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Organization")}
                      value={businessPlaceOrganization}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Group Name")}
                      value={businessPlaceOfficerName}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Mobile Version - End */}

              <Collapse
                key="poInfo"
                id="poInfo"
                expanded="true"
                collapseHeader={[t("Payment Information")]}
              >
                <div className="d-flex flex-wrap">
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("Payment Term Day")}
                      colLabel="6"
                      value={`${
                        paymentTermDays ? paymentTermDays.toString() : "0"
                      } ${paymentTermDays > 1 ? "Days" : "Day"}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Payment Term Description")}
                      colLabel="6"
                      value={paymentTermDescription}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("PO Amount").replace(/[.]/g, "")}
                      colLabel="6"
                      value={
                        detailItems.initialTotal
                          ? `${this.formatCurrencyDigit(
                              detailItems.initialTotal.quantity *
                                detailItems.initialTotal.displayTokenSize,
                              2
                            )} ${detailItems.initialTotal.token}`
                          : "-"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("PO Remaining Amount")}
                      colLabel="6"
                      value={
                        detailItems.remainingTotal
                          ? `${this.formatCurrencyDigit(
                              detailItems.remainingTotal.quantity *
                                detailItems.remainingTotal.displayTokenSize,
                              2
                            )} ${detailItems.remainingTotal.token}`
                          : "-"
                      }
                    />
                    <br />
                    <CollapseItemText
                      t={t}
                      label={t("Retention Rate")}
                      colLabel="6"
                      value={retentionPercent ? `${retentionPercent} %` : "-"}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Retention Amount")}
                      colLabel="6"
                      value={
                        retentionAmount
                          ? `${this.formatCurrencyDigit(
                              retentionAmount.quantity *
                                retentionAmount.displayTokenSize,
                              2
                            )} ${retentionAmount.token}`
                          : "-"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Retention Term Day")}
                      colLabel="6"
                      value={
                        retentionTermDays ? `${retentionTermDays} days` : "-"
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("PO No")}
                      colLabel="6"
                      value={purchaseOrderNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Contract No")}
                      colLabel="6"
                      value={contractNumber}
                    />
                    {/* <CollapseItemLink
                      label="Invoice Lists"
                      value={invoiceListArr.length > 0 ? invoiceListArr : "-"}
                      moreHref={`/invoice?ref=po,${linearId}&purchaseOrderNumber=${purchaseOrderNumber}`}
                    /> */}
                    <CollapseItemInvDrillDown
                      key="invoicesListDrilldown"
                      colLabel="6"
                      {...this.props}
                      label={t("Invoice Lists")}
                      value={invoiceListArr.length > 0 ? invoiceListArr : "-"}
                      moreHref={`/invoice?ref=po,${linearId}&purchaseOrderNumber=${purchaseOrderNumber}`}
                    />
                  </div>
                </div>
              </Collapse>
              <div
                hidden={
                  customisedFields
                    ? customisedFields.condition ||
                      customisedFields.remark ||
                      conditionPOAttach.length > 0 ||
                      conditionOtherAttach.length > 0
                      ? false
                      : true
                    : true
                }
              >
                <Collapse
                  id="condition"
                  key="condition"
                  expanded="true"
                  collapseHeader={[t("Purchase Order Information")]}
                >
                  <div className="row">
                    <div className="col-12 pb-3">
                      {customisedFields && customisedFields.condition ? (
                        <div className="col-12">
                          <p>
                            <u>{t("Condition")}</u>
                          </p>
                          <pre>{customisedFields.condition}</pre>
                        </div>
                      ) : (
                        ""
                      )}
                      {customisedFields && customisedFields.remark ? (
                        <div className="col-12">
                          <p>
                            <u>{t("Remark")}</u>
                          </p>
                          <pre>{customisedFields.remark}</pre>
                        </div>
                      ) : (
                        ""
                      )}
                      {(conditionPOAttach && conditionPOAttach.length !== 0) ||
                      conditionOtherAttach !== 0 ? (
                        <div className="col-12">
                          <p>
                            <u>{t("Attachments")}</u>
                          </p>
                          <div className="row">
                            <div className="col-md-5 offset-md-1 col-sm-12">
                              {conditionPOAttach.length !== 0 ? (
                                <CollapseItemExternalLink
                                  key="conditionPOAttach"
                                  label="PO Form"
                                  value={
                                    conditionPOAttach.length > 0
                                      ? conditionPOAttach
                                      : "-"
                                  }
                                />
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="col-md-5 offset-md-1 col-sm-12">
                              {conditionOtherAttach &&
                              conditionOtherAttach.length !== 0 ? (
                                <div className="row">
                                  <div className="col-12">
                                    <CollapseItemExternalLink
                                      key="conditionOtherAttach"
                                      label="Other Documents"
                                      value={
                                        conditionOtherAttach.length > 0
                                          ? conditionOtherAttach
                                          : "-"
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </Collapse>
              </div>
              {advanceItems.length != 0 ? (
                <Collapse
                  id="poAdvance"
                  key="poAdvance"
                  expanded="true"
                  collapseHeader={[t("Advance Payment Items")]}
                >
                  <div className="row">
                    <div className="col-12">
                      <div className="table_wrapper">
                        <div className="table-responsive">
                          <table className="table table-3 dataTable">
                            <thead>
                              <tr>
                                <th>{t("Item No")}</th>
                                <th>{t("Description")}</th>
                                <th>{t("Amount")}</th>
                                <th>{t("Remaining Amount")}</th>
                                <th>{t("Effective Date")}</th>
                                <th>{t("Tax Code")}</th>
                                <th>{t("Tax Rate (%)")}</th>
                                <th>{t("Tax Description")}</th>
                                <th>{t("WHT Code")}</th>
                                <th>{t("WHT Rate (%)")}</th>
                                <th>{t("WHT Description")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {advanceItems.map(item => (
                                <tr>
                                  <td>{item.poItemNo}</td>
                                  <td>{item.materialDescription}</td>
                                  <td>{item.advanceInitialAmount}</td>
                                  <td>{item.advanceRemainingAmount}</td>
                                  <td>{item.effectiveDate}</td>
                                  <td>{item.taxCode}</td>
                                  <td>{item.taxRate}</td>
                                  <td>{item.taxDescription}</td>
                                  <td>{item.withholdingTaxCode}</td>
                                  <td>{item.withholdingTaxPercent}</td>
                                  <td>{item.withholdingTaxDescription}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </Collapse>
              ) : (
                ""
              )}

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
                  createdRow={this.createdRow}
                  results={this.state.normalItems}
                  btnOpt={this.state.tableDetailBtn}
                  lang={lang}
                />
              ) : (
                ""
              )}
              {actionHistory.length > 0 ? (
                <Collapse
                  id="poHistory"
                  key="poHistory"
                  expanded="true"
                  collapseHeader={[t("PO Action History")]}
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
                          </tr>
                        </thead>
                        <tbody>
                          {actionHistory
                            .sort(
                              (a, b) =>
                                moment(b.actionDate).unix() -
                                moment(a.actionDate).unix()
                            )
                            .map((item, i) => (
                              <tr>
                                <td>{item.actionName}</td>
                                <td>
                                  {moment(item.actionDate).format(
                                    "DD/MM/YYYY HH:mm:ss"
                                  )}
                                </td>
                                <td>{item.actionBy}</td>
                                <td>{item.remark}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Desktop Version - End */}

                  {/* Mobile Version - Start */}
                  <div className="table-wrapper d-inline-block d-lg-none w-100">
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
                          {actionHistory
                            .sort(
                              (a, b) =>
                                moment(b.actionDate).unix() -
                                moment(a.actionDate).unix()
                            )
                            .map((item, index) => (
                              <React.Fragment>
                                <tr>
                                  <td>{item.actionName}</td>
                                  <td>
                                    {moment(item.actionDate).format(
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
                                      <div className="col-6 px-0 pb-3 text-right">
                                        {t("Modified by")}:
                                      </div>
                                      <div className="col-6 pb-3">
                                        {item.actionBy}
                                      </div>
                                      <div className="col-6 px-0 pb-3 text-right">
                                        {t("Reason")}:
                                      </div>
                                      <div className="col-6 pb-3">
                                        {item.remark}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Mobile Version - End */}
                </Collapse>
              ) : (
                ""
              )}
            </div>
          </section>
        </BlockUi>
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
        <ModalAlert
          title={alertRejectModalAlertTitle}
          visible={isAlertRejectModalVisible}
          button={buttonAlertReject}
        >
          <div className="row">
            <div className="col-md-12">
              <div className="form-group">
                <select
                  name="rejectDropdown"
                  id="rejectDropdown"
                  className={`form-control ${
                    !rejectDropdownIsRequired ? "" : "required"
                  }`}
                  onChange={this.handleRejectSelectOnChange}
                  value={lastRejectedReason}
                >
                  <option value="" selected disabled>
                    {t("Reason")}
                  </option>
                  {reasonDropdown.map((r, i) => {
                    return (
                      <option value={r.key} key={i + 1}>
                        {t(r.val)}
                      </option>
                    );
                  })}
                </select>
                <span
                  className="text-danger"
                  hidden={!rejectDropdownIsRequired}
                >
                  This field is required.
                </span>
              </div>
            </div>

            <div className="col-md-12">
              <div className="form-group">
                <textarea
                  name="rejectTextarea"
                  id="rejectTextarea"
                  cols="30"
                  rows="5"
                  className={`form-control ${
                    !rejectTextareaIsRequired ? "" : "required"
                  }`}
                  placeholder={t("Comment")}
                  onChange={this.handleRejectRemarkOnChange}
                  value={lastRejectedRemark}
                />
                <span
                  className="text-danger"
                  hidden={!rejectTextareaIsRequired}
                >
                  This field is required.
                </span>
              </div>
            </div>
          </div>
        </ModalAlert>
      </Layout>
    );
  }
}

export default withAuth(
  withTranslation(["po-detail", "detail", "common", "menu"])(
    PurchaseOrderDetail
  )
);
