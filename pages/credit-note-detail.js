import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import "moment-timezone";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import "../libs/mycools";
import statusColor from "../configs/color.cn.json";
import ExternalLink from "../components/ExternalLink";
import { i18n, withTranslation } from "~/i18n";
import handleError from "./handleError";
import BlockUi from "react-block-ui";
import ModalAlert, { BTN_ACTION_BACK } from "../components/modalAlert";
import ColumnModalInvoice from "../components/column-modal-invoice";
import mobileModel from "../columns/mobiles/cn-item-list.json";
import GA from "~/libs/ga";
import {
  PageHeader,
  Collapse,
  CollapseItemText,
  CollapseItemExternalLink,
  CollapseItemLink2,
  CollapseItemLink,
  ModalDefault
} from "../components/page";

var numeral = require("numeral");

const lifecycleCancel = ["ISSUED", "REJECTED"];
const lifecycleApproveAndReject = ["ISSUED"];
const lifecycleResubmit = ["REJECTED"];
const lifecycleEdit = ["ISSUED", "REJECTED"];

class CreditNoteDetail extends Component {
  constructor(props) {
    super(props);
    this.api = new ApiService();
    this.apis = new api().group("cn");
    this.rejectCN = this.rejectCN.bind(this);
    this.handleOnchangeRemarkRejectCN = this.handleOnchangeRemarkRejectCN.bind(
      this
    );
    this.approveCN = this.approveCN.bind(this);
    this.handleApproveModal = this.handleApproveModal.bind(this);
    this.handleOnchangeRemarkApproveCN = this.handleOnchangeRemarkApproveCN.bind(
      this
    );
    this.handleDismissBtnApproveModal = this.handleDismissBtnApproveModal.bind(
      this
    );
    this.cancelCN = this.cancelCN.bind(this);
    this.handleCancelModal = this.handleCancelModal.bind(this);
    this.handleRejectModal = this.handleRejectModal.bind(this);
    this.handleDismissBtnModal = this.handleDismissBtnModal.bind(this);
    this.handleDismissBtnRejectModal = this.handleDismissBtnRejectModal.bind(
      this
    );
    this.state = {
      detailItems: {},
      fileAttachments: [],
      detailInvoiceItems: {},
      taxThreePercentItems: [],
      taxSevenPercentItems: [],
      taxThreePanelDisplay: true,
      taxSevenPanelDisplay: true,
      itemInfoPanelDisplay: true,
      itemsSubTotal: 0,
      items: [],
      cnLinearId: "",
      externalId: "",
      UserAuthority: [],
      taggedInvoices: [],
      taggedDebitNotes: [],
      rejectRemark: "",
      rejectCNObj: {},
      approveRemark: "",
      approveCNObj: {},
      blocking: true,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      isAlertRejectModalVisible: false,
      alertRejectModalAlertTitle: "",
      buttonAlertReject: [
        {
          label: "Cancel",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissBtnRejectModal
          }
        },

        {
          label: "Submit",
          attribute: {
            id: "submitReject",
            className: "btn btn-wide",
            onClick: this.rejectCN
          }
        }
      ],
      isAlertApproveModalVisible: false,
      alertApproveModalAlertTitle: "",
      buttonAlertApprove: [],
      alertModalMsg: "",
      buttonAlert: [],
      rejectTextareaIsRequired: false,
      isTextOnly: true,
      taxRateList: [],
      attachmentCreditNote: [],
      attachmentOthers: [],
      columnListItem: [],
      moblieColumnListItem: mobileModel.table.columns
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
    await this.permissionPage();
    await this.getModel();
  }

  async componentDidMount() {
    await this.fetchData();
    await this.resolvePermission();
    await this.setObjFileAttachmentsForComponent();
    await this.setObjTaggedInvoiceListsForComponent();
    await this.setObjtaggedDebitNoteListsForComponent();
    this.extractPurchaseItemByTaxRate();
    this.taxItemPanelDisplayHandler();
    this.setState({ blocking: false });
  }

  permissionPage = () => {
    const { permisions } = this.props;
    if (!permisions.includes("CN-Detail")) {
      Router.push("/dashboard");
    }
  };

  getModel = async () => {
    const { t } = this.props;
    const creditNoteModel = await this.apis.call("creditNoteModel");
    for (let i in creditNoteModel.table.columns) {
      creditNoteModel.table.columns[i].searchKey =
        creditNoteModel.table.columns[i].header;
      creditNoteModel.table.columns[i].header = await t(
        creditNoteModel.table.columns[i].header.replace(
          /[|&;$%@"<>()+,.-]/g,
          ""
        )
      );
    }
    const columnListItem = creditNoteModel.table.columns;
    this.setState({
      columnListItem
    });
  };

  fetchData = async () => {
    var _this = this;

    try {
      const { permisions } = this.props;
      const res = await this.apis.call("detail", {
        linearId: this.props.url.query.linearId,
        role: this.props.user.organisationUnit
      });

      if (res.rows.length > 0) {
        const data = res.rows[0];

        this.setState({
          UserAuthority: permisions,
          detailItems: data,
          externalId: data.externalId,
          invoiceLinearId: data.invoiceLinearId,
          cnLinearId: data.linearId,
          items: data.creditNoteItems,
          fileAttachments: data.fileAttachments,
          taggedInvoices: data.taggedInvoices,
          taggedDebitNotes: data.taggedDebitNotes
        });
      } else {
        const message = [
          "Sorry, you cannot get detail of this credit note.",
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
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
    }
  };

  routeToCNList() {
    Router.push("/credit-note");
  }

  setObjFileAttachmentsForComponent() {
    let attachmentCreditNote = [];
    let attachmentOthers = [];
    if (this.state.fileAttachments.length > 0) {
      let files = this.state.fileAttachments.map(f => {
        if (f.attachmentType === "CreditNote") {
          let obj = {
            name: f.attachmentName,
            href: `/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
          };
          attachmentCreditNote.push(obj);
        } else if (f.attachmentType === "Others") {
          let obj = {
            name: f.attachmentName,
            href: `/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
          };
          attachmentOthers.push(obj);
        }
      });

      this.setState({ attachmentCreditNote, attachmentOthers });
    }
  }

  setObjTaggedInvoiceListsForComponent() {
    const { cnLinearId, externalId } = this.state;
    if (this.state.taggedInvoices && this.state.taggedInvoices.length > 0) {
      let taggedInvoiceLists = this.state.taggedInvoices
        .filter(
          (thing, index, self) =>
            index === self.findIndex(t => t.externalId === thing.externalId)
        )
        .map(i => {
          return {
            name: i.externalId,
            linearId: i.linearId,
            href: `/invoice-detail?linearId=${i.linearId}&ref=cn,${cnLinearId},${externalId}`
          };
        });
      this.setState({ taggedInvoices: taggedInvoiceLists });
    }
  }

  setObjtaggedDebitNoteListsForComponent() {
    const { cnLinearId, externalId } = this.state;
    if (this.state.taggedDebitNotes && this.state.taggedDebitNotes.length > 0) {
      let taggedDebitNotes = this.state.taggedDebitNotes
        .filter(
          (thing, index, self) =>
            index === self.findIndex(t => t.externalId === thing.externalId)
        )
        .map(i => {
          return {
            name: i.externalId,
            linearId: i.linearId,
            href: `/debit-note-detail?linearId=${i.linearId}&ref=cn,${cnLinearId},${externalId}`
          };
        });
      this.setState({ taggedDebitNotes });
    }
  }

  resolvePermission() {
    let isAllowCancel = false;
    let isAllowEdit = false;
    let isAllowReject = false;
    let isAllowApprove = false;
    let isAllowResubmit = false;

    if (lifecycleCancel.includes(this.state.detailItems.lifecycle)) {
      if (this.state.UserAuthority.includes("CN-Cancel")) {
        if (this.props.user.organisationUnit == "SELLER") {
          isAllowCancel = true;
        }
      }
    }
    if (lifecycleEdit.includes(this.state.detailItems.lifecycle)) {
      if (this.state.UserAuthority.includes("CN-Edit")) {
        if (this.props.user.organisationUnit == "SELLER") {
          isAllowEdit = true;
        }
      }
    }

    if (lifecycleApproveAndReject.includes(this.state.detailItems.lifecycle)) {
      if (this.state.detailItems.adjustmentType == "Price Adjustment") {
        if (this.state.UserAuthority.includes("CN-Subsequent-Approval")) {
          if (this.props.user.organisationUnit == "BUYER") {
            isAllowReject = true;
            isAllowApprove = true;
          }
        }
      }
    }

    if (lifecycleResubmit.includes(this.state.detailItems.lifecycle)) {
      if (this.props.user.organisationUnit == "SELLER") {
        isAllowResubmit = true;
      }
    }

    this.setState({
      isAllowCancel: isAllowCancel,
      isAllowEdit: isAllowEdit,
      isAllowReject: isAllowReject,
      isAllowApprove: isAllowApprove,
      isAllowResubmit: isAllowResubmit
    });
  }

  extractPurchaseItemByTaxRate() {
    let purchaseItem = this.state.items;
    let taxRateList = [];
    let taxRateListItem = {};

    purchaseItem.forEach(item => {
      if (taxRateList.includes(item.taxRate) == false) {
        taxRateList.push(item.taxRate);

        taxRateListItem[`tax${item.taxRate}`] = [];
      }
      taxRateListItem[`tax${item.taxRate}`] = [
        ...taxRateListItem[`tax${item.taxRate}`],
        item
      ];
    });

    this.setState({
      taxRateList,
      taxRateListItem
    });
  }

  taxItemPanelDisplayHandler() {
    if (this.state.taxThreePercentItems.length > 0) {
      this.setState({
        taxThreePanelDisplay: false
      });
    }

    if (this.state.taxSevenPercentItems.length > 0) {
      this.setState({
        taxSevenPanelDisplay: false
      });
    }

    if (
      this.state.taxSevenPercentItems.length > 0 ||
      this.state.taxThreePercentItems.length > 0
    ) {
      this.setState({ itemInfoPanelDisplay: false });
    }
  }

  // generateRowTableForTax(taxItems) {
  //   if (taxItems.length > 0) {
  //     return _.map(
  //       taxItems,
  //       ({
  //         externalId,
  //         invoiceItemExternalId,
  //         purchaseItem,
  //         materialDescription,
  //         quantity,
  //         unitPrice,
  //         itemSubTotal,
  //         currency,
  //         unit,
  //         subTotal,
  //         invoiceItems,
  //         withholdingTaxRate
  //       }) => (
  //         <tr>
  //           {externalId ? <td>{externalId}</td> : <td>-</td>}
  //           {invoiceItemExternalId ? (
  //             <td>{invoiceItemExternalId}</td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {materialDescription ? <td>{materialDescription}</td> : <td>-</td>}
  //           {purchaseItem && purchaseItem.poNumber ? (
  //             <td>{purchaseItem.poNumber}</td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {invoiceItems && invoiceItems[0].quantity ? (
  //             <td>
  //               {this.formatCurrency(invoiceItems[0].quantity.initial, 3)}
  //             </td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {invoiceItems && invoiceItems[0].itemSubTotal ? (
  //             <td>{this.formatCurrency(invoiceItems[0].itemSubTotal, 2)}</td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {quantity != undefined ? (
  //             <td>{this.formatQty(quantity, 3)}</td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {withholdingTaxRate != undefined ? (
  //             <td>{this.formatCurrency(withholdingTaxRate, 2)}</td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {unit ? <td>{unit}</td> : <td>-</td>}
  //           {unitPrice ? (
  //             <td>{this.formatCurrency(unitPrice, 2)}</td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {subTotal ? (
  //             <td>{this.formatCurrency(subTotal, 2)}</td>
  //           ) : (
  //             <td>-</td>
  //           )}
  //           {currency ? <td>{currency}</td> : <td>-</td>}
  //         </tr>
  //       )
  //     );
  //   } else {
  //     return (
  //       <div>
  //         <center>No Item Found</center>
  //       </div>
  //     );
  //   }
  // }
  generateSumForTax(taxItems) {
    let sum = 0;
    if (taxItems.length > 0) {
      _.map(
        taxItems,
        ({ unitPrice, itemSubTotal, currency, unit, subTotal }) => {
          sum = sum + subTotal;
        }
      );
      return sum;
    } else {
      return sum;
    }
  }
  generateWithoutTax(taxItems, tax) {
    let sum = 0;
    if (taxItems.length > 0) {
      _.map(
        taxItems,
        ({ unitPrice, itemSubTotal, currency, unit, subTotal }) => {
          sum = sum + subTotal;
        }
      );
      return (sum * 100) / (100 + tax);
    } else {
      return sum;
    }
  }
  generateSumTax(taxItems, tax) {
    let sum = 0;
    if (taxItems.length > 0) {
      _.map(
        taxItems,
        ({ unitPrice, itemSubTotal, currency, unit, subTotal }) => {
          sum = sum + subTotal;
        }
      );
      return sum - (sum * 100) / (100 + tax);
    } else {
      return sum;
    }
  }

  getCalItemsSubTotal(items) {
    let subTotal = 0;
    items.forEach(item => {
      subTotal = subTotal + +item.subTotal;
    });
    return subTotal;
  }

  calTax(amount, percentage) {
    return parseFloat(
      (
        parseFloat(amount.toFixed(2)) *
        parseFloat((percentage / 100).toFixed(2))
      ).toFixed(2)
    );
  }

  formatCurrency(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  }
  formatQty(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  }
  handleRejectModal() {
    this.setState({
      isAlertRejectModalVisible: true,
      alertRejectModalAlertTitle: "Reject Reason",
      isTextOnly: false
    });
    $("#submitReject").attr("disabled", true);
  }

  handleDismissBtnRejectModal() {
    this.setState({
      isAlertRejectModalVisible: false,
      rejectRemark: "",
      rejectTextareaIsRequired: false
    });
  }

  async rejectCN() {
    if (this.state.rejectRemark === "") {
      this.setState({
        rejectTextareaIsRequired: true
      });
    } else {
      const rejectObj = {
        linearId: this.state.cnLinearId,
        remark: this.state.rejectRemark
      };

      if (this.state.detailItems.adjustmentType === "Price Adjustment") {
        GA.event({
          category: "Credit Note",
          action: "Reject CN (Request)",
          label: `Credit Note | ${this.state.externalId} | ${moment().format()}`
        });

        try {
          this.setState({
            blocking: true,
            isAlertRejectModalVisible: false
          });
          await this.apis.call(
            "rejectCNPriceAdj",
            {},
            {
              method: "put",
              data: rejectObj
            }
          );

          GA.event({
            category: "Credit Note",
            action: "Reject CN (Success)",
            label: `Credit Note | ${
              this.state.externalId
            } | ${moment().format()}`
          });

          Router.push("/credit-note");
        } catch (err) {
          GA.event({
            category: "Credit Note",
            action: "Reject CN (Failed)",
            label: `Credit Note | ${
              this.state.externalId
            } | ${moment().format()}`
          });

          const response = handleError(err, this.handleDismissBtnModal);
          this.setState({
            ...response
          });
        }
      } else {
        const message = [
          "Sorry, you cannot reject this credit note.",
          <br />,
          "Allow price adjustment type only for reject."
        ];

        const response = handleError(message, this.handleDismissBtnModal);
        this.setState({
          ...response
        });
      }

      this.setState({ rejectRemark: "" });
    }
  }

  handleDismissBtnModal() {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  }

  handleOnchangeRemarkRejectCN(event) {
    if (event.target.value !== "") {
      $("#submitReject").attr("disabled", false);
      this.setState({
        rejectRemark: event.target.value,
        rejectTextareaIsRequired: false
      });
    } else {
      $("#submitReject").attr("disabled", true);
      this.setState({
        rejectRemark: "",
        rejectTextareaIsRequired: true
      });
    }
  }

  handleApproveModal() {
    this.setState({
      isAlertApproveModalVisible: true,
      alertApproveModalAlertTitle: "Approve Reason",
      isTextOnly: false,
      buttonAlertApprove: [
        {
          label: "Cancel",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissBtnApproveModal
          }
        },
        {
          label: "Submit",
          attribute: {
            className: "btn btn-wide",
            onClick: this.approveCN
          }
        }
      ]
    });
  }

  handleDismissBtnApproveModal() {
    this.setState({
      isAlertApproveModalVisible: false,
      alertApproveModalAlertTitle: "",
      isTextOnly: false,
      buttonAlertApprove: [],
      approveRemark: ""
    });
  }

  async approveCN() {
    const approveObj = {
      linearId: this.state.cnLinearId,
      remark: this.state.approveRemark
    };

    if (this.state.detailItems.adjustmentType === "Price Adjustment") {
      GA.event({
        category: "Credit Note",
        action: "Approve CN (Request)",
        label: `Credit Note | ${this.state.externalId} | ${moment().format()}`
      });

      try {
        this.setState({
          isAlertApproveModalVisible: false,
          blocking: true
        });
        await this.apis.call(
          "approveCNPriceAdj",
          {},
          { method: "put", data: approveObj }
        );

        GA.event({
          category: "Credit Note",
          action: "Approve CN (Success)",
          label: `Credit Note | ${this.state.externalId} | ${moment().format()}`
        });

        Router.push("/credit-note");
      } catch (err) {
        console.error(err);

        GA.event({
          category: "Credit Note",
          action: "Approve CN (Failed)",
          label: `Credit Note | ${this.state.externalId} | ${moment().format()}`
        });

        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({
          ...response
        });
        // this.setState({
        //   blocking: false,
        //   isAlertApproveModalVisible: false,
        //   approveRemark: "",
        //   isAlertModalVisible: true,
        //   isTextOnly: true,
        //   alertModalAlertTitle: "Error!",
        //   alertModalMsg: [
        //     "Sorry, you cannot approve this credit note.",
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
    } else {
      const message = [
        "Sorry, you cannot reject this credit note.",
        <br />,
        "Allow price adjustment type only for reject."
      ];

      const response = handleError(message, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }

    this.setState({ approveRemark: "" });
  }

  handleOnchangeRemarkApproveCN(event) {
    this.setState({
      approveRemark: event.target.value
    });
  }

  handleCancelModal() {
    this.setState({
      isAlertModalVisible: true,
      alertModalAlertTitle: "Cancel Credit Note",
      alertModalMsg: [
        "Do you want to cancel this credit note?",
        <br />,
        <span class="red">
          Warning: Credit Note Number cannot reuse when you cancel this credit
          note.
        </span>
      ],
      buttonAlert: [
        {
          label: "No",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissBtnModal
          }
        },
        {
          label: "Yes",
          attribute: {
            className: "btn btn-wide",
            onClick: this.cancelCN
          }
        }
      ]
    });
  }

  async cancelCN() {
    const cancelObj = {
      linearId: this.state.cnLinearId,
      remark: "Cancel"
    };

    GA.event({
      category: "Credit Note",
      action: "Cancel CN (Request)",
      label: `Credit Note | ${this.state.externalId} | ${moment().format()}`
    });

    try {
      this.setState({
        blocking: true,
        isAlertModalVisible: false
      });
      await this.apis.call(
        "cancelCNPriceAdj",
        {},
        { method: "put", data: cancelObj }
      );

      GA.event({
        category: "Credit Note",
        action: "Cancel CN (Success)",
        label: `Credit Note | ${this.state.externalId} | ${moment().format()}`
      });

      Router.push("/credit-note");
    } catch (err) {
      GA.event({
        category: "Credit Note",
        action: "Cancel CN (Failed)",
        label: `Credit Note | ${this.state.externalId} | ${moment().format()}`
      });

      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      // this.setState({
      //   blocking: false,
      //   isAlertModalVisible: true,
      //   alertModalAlertTitle: "Error!",
      //   isTextOnly: true,
      //   alertModalMsg: [
      //     "Sorry, you cannot cancel this credit note.",
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

    this.setState({ cancelRemark: "" });
  }

  handleOnchangeRemarkCancelCN(event) {
    this.setState({
      cancelRemark: event.target.value
    });
  }

  filterSubTotalCurrency = columnListItem => {
    return columnListItem.filter(
      column => !(column.field === "subTotal" || column.field === "currency")
    );
  };

  generateRowTableForTax(taxItems) {
    const { t } = this.props;
    let { columnListItem } = this.state;
    columnListItem = this.filterSubTotalCurrency(columnListItem);
    columnListItem = columnListItem.filter(column => !column.hidden);
    if (taxItems.length > 0) {
      const tableBody = taxItems.map(taxItem => {
        const row = columnListItem.map(column => {
          const fieldItem = column.field.split(".");
          let getItemFromField = fieldItem.reduce((acc, cur) => {
            if (acc && Array.isArray(acc[cur])) {
              return acc[cur].length ? acc[cur][0] : {};
            }
            if (acc && !acc[cur] && acc[0] && acc[0][cur]) {
              return acc[0][cur];
            }
            return acc ? acc[cur] : acc;
          }, taxItem);

          if (column.field === "withholdingTaxRate") {
            if (!taxItem.withholdingTaxCode) {
              getItemFromField = "";
            }
          } else {
            if (column.type === "number") {
              let fm = column.pattern || "#,###.00";
              getItemFromField = numeral(getItemFromField).format(fm);
            } else if (
              column.type == "date" ||
              column.templateName == "dueDate"
            ) {
              column.pattern = column.pattern
                .toUpperCase()
                .replace("HH:", "hh:");
              let old = getItemFromField;
              if (old == "" || old == "-") {
                getItemFromField = old;
                //return;
              } else {
                getItemFromField = moment(getItemFromField)
                  .tz("Asia/Bangkok")
                  .format(column.pattern);
                //return;
              }
            }
          }

          return (
            <td className="td-invoice">
              {getItemFromField || getItemFromField !== undefined
                ? getItemFromField
                : ""}
            </td>
          );
        });
        return <tr className="tr-invoice">{row}</tr>;
      });

      return tableBody;
    } else {
      return (
        <div>
          <center>{t("No Item Found")}</center>
        </div>
      );
    }
  }

  generateMobileMoreInfomationForTax(taxItems) {
    const { t } = this.props;
    let missingFiled = [];
    let { moblieColumnListItem } = this.state;

    moblieColumnListItem = moblieColumnListItem.filter(
      column => !column.hidden
    );
    if (taxItems.length > 0) {
      const tableBody = taxItems.map((taxItem, taxItemId) => {
        const row = moblieColumnListItem.slice(0, 2).map((column, i) => {
          const fieldItem = column.field.split(".");
          console.log("fieldItem : ", fieldItem);

          let getItemFromField = fieldItem.reduce((acc, cur) => {
            // console.log("acc : ", acc);
            // console.log("cur : ", cur);
            if (Array.isArray(acc[cur])) {
              return acc[cur].length ? acc[cur][0] : {};
            }
            if (!acc[cur] && acc[0] && acc[0][cur]) {
              return acc[0][cur];
            }
            return acc[cur];
          }, taxItem);
          if (!getItemFromField) {
            missingFiled.push(column.field);
          }
          if (column.type === "number") {
            let fm = column.pattern || "#,###.00";
            getItemFromField = numeral(getItemFromField).format(fm);
          } else if (
            column.type == "date" ||
            column.templateName == "dueDate"
          ) {
            // column.pattern = column.pattern.toUpperCase().replace("HH:", "hh:");
            let old = getItemFromField;
            if (old == "" || old == "-") {
              getItemFromField = old;
              //return;
            } else {
              if (getItemFromField) {
                getItemFromField = moment(getItemFromField)
                  .tz("Asia/Bangkok")
                  .format(col.pattern);
              }

              //return;
            }
          }
          if (i == 1) {
            return (
              <React.Fragment>
                <td className="text-center td-invoice-mobile">
                  {getItemFromField || getItemFromField !== undefined
                    ? getItemFromField
                    : ""}
                </td>
                <td>
                  <a
                    href={`#tax-detail-${taxItemId}`}
                    data-toggle="collapse"
                    role="button"
                    aria-expanded="false"
                    area-controls={`#tax-detail-${taxItemId}`}
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
              </React.Fragment>
            );
          } else {
            return (
              <td className="text-center td-invoice-mobile">
                {getItemFromField || getItemFromField !== undefined
                  ? getItemFromField
                  : ""}
              </td>
            );
          }
        });

        const moreInfo = moblieColumnListItem
          .slice(2, moblieColumnListItem.length)
          .map((column, i) => {
            const fieldItem = column.field.split(".");
            console.log("fieldItem : ", fieldItem);

            let getItemFromField = fieldItem.reduce((acc, cur) => {
              // console.log("acc : ", acc);
              // console.log("cur : ", cur);
              if (Array.isArray(acc[cur])) {
                return acc[cur].length ? acc[cur][0] : {};
              }
              if (!acc[cur] && acc[0] && acc[0][cur]) {
                return acc[0][cur];
              }
              return acc[cur];
            }, taxItem);
            if (!getItemFromField) {
              missingFiled.push(column.field);
            }
            if (column.type === "number") {
              let fm = column.pattern || "#,###.00";
              getItemFromField = numeral(getItemFromField).format(fm);
            } else if (
              column.type == "date" ||
              column.templateName == "dueDate"
            ) {
              let old = getItemFromField;
              if (old == "" || old == "-") {
                getItemFromField = old;
              } else {
                if (getItemFromField) {
                  getItemFromField = moment(getItemFromField)
                    .tz("Asia/Bangkok")
                    .format(col.pattern);
                }
              }
            }
            return (
              <React.Fragment>
                <div className="col-6 px-0 pb-3 text-right  more-info-header-mobile">
                  <span className="bold">
                    {column.header}
                    {":"}
                  </span>
                </div>
                <div className="col-6 pb-3 text-left word-wrap more-info-value-mobile">
                  {getItemFromField || getItemFromField !== undefined
                    ? getItemFromField
                    : ""}
                </div>
              </React.Fragment>
            );
          });

        const moreRow = (
          <td colSpan="3">
            <div className="d-flex flex-wrap w-100">{moreInfo}</div>
          </td>
        );

        // return <div className="d-flex flex-wrap w-100">{row}</div>;
        return (
          <React.Fragment>
            <tr className="tr-invoice">{row}</tr>
            <tr
              id={`tax-detail-${taxItemId}`}
              className="collapse multi-collapse"
            >
              {moreRow}
            </tr>
          </React.Fragment>
        );
      });

      return tableBody;
    } else {
      return (
        <div className="d-flex flex-wrap w-100">
          <center>{t("No Item Found")}</center>
        </div>
      );
    }
  }

  renderCloneTable = taxItems => {
    const { t } = this.props;
    const getRealHeight = () => {
      setTimeout(() => {
        const realTr = $(".tr-invoice");
        const cloneTr = $(".tr-invoice-clone");
        for (let index = 0; index < realTr.length; index++) {
          const height = $(realTr[index]).height();
          $(cloneTr[index]).height(height);
        }
      }, 1000);
    };
    getRealHeight();

    if (taxItems.length > 0) {
      return _.map(taxItems, ({ unitPrice, subTotal, currency }) => (
        <tr className="tr-invoice-clone">
          {
            <td className="td-invoice text-right">
              {subTotal ? this.formatCurrency(subTotal, 2) : "-"}
            </td>
          }
          {<td className="td-invoice-clone">{currency ? currency : "-"}</td>}
        </tr>
      ));
    } else {
      return (
        <div>
          <center>{t("No Item Found")}</center>
        </div>
      );
    }
  };

  onSave = async columnListItem => {
    let colSeq = columnListItem
      .filter(column => !column.hidden)
      .map(column => column.searchKey)
      .join(",");
    colSeq = colSeq + ",CN Amount,Currency";
    colSeq = colSeq.replace(/\%/g, "%25");
    const saveItemInformationModel = await this.apis.call(
      "saveCreditNoteModel",
      { colSeq },
      { method: "POST" }
    );
    await this.getModel();
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
    let {
      ref: urlRef,
      ref,
      purchaseOrderNumber,
      invoiceNumber
    } = this.props.url.query;
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
          switch (r[0]) {
            case "liv":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: "LIV Posting Result",
                  url: "/liv-posting-result?filter=creditNote"
                });
                breadcrumbsGroup.push(r[0]);
              }
              break;
            case "inv":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: t("Invoice"),
                  url: "/invoice"
                });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `${t("Invoice No.")}  ${invoiceNumber || ""}`,
                url: `/invoice-detail?linearId=${r[1]}`
              });
              break;
          }
        });
        breadcrumbs.push({
          title: `${t("Credit Note No")} ${this.state.detailItems.externalId}`,
          active: true
        });
      } else {
        breadcrumbs = [
          { title: t("Credit Note"), url: "/credit-note" },
          {
            title: `${t("Credit Note No")} ${this.state.detailItems
              .externalId || "-"}`,
            active: true
          }
        ];
      }
    }

    const {
      detailItems,
      isAllowReject,
      isAllowApprove,
      isAllowCancel,
      isAllowEdit,
      isAllowResubmit,
      taggedInvoices,
      taggedDebitNotes,
      fileAttachments,
      itemInfoPanelDisplay,
      taxThreePanelDisplay,
      taxThreePercentItems,
      itemsSubTotal,
      taxSevenPanelDisplay,
      taxSevenPercentItems,
      rejectRemark,
      approveRemark,
      isShowErrorModal,
      errCaseMsg,
      isAlertModalVisible,
      alertModalAlertTitle,
      isAlertRejectModalVisible,
      alertRejectModalAlertTitle,
      buttonAlertReject,
      isAlertApproveModalVisible,
      alertApproveModalAlertTitle,
      buttonAlertApprove,
      alertModalMsg,
      buttonAlert,
      isTextOnly,
      rejectTextareaIsRequired,
      attachmentCreditNote,
      attachmentOthers
    } = this.state;
    return (
      <Layout {...this.props}>
        <Head>
          <title>{[t("Credit Note No"), ` ${detailItems.externalId}`]}</title>
        </Head>
        <PageHeader
          title={`${t("Credit Note No")} ${
            detailItems.externalId ? detailItems.externalId : "-"
          }`}
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <BlockUi tag="div" blocking={this.state.blocking}>
          <div
            id="mobilePageNav"
            className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
          >
            <a href="/credit-note">
              <strong className="purple">
                <i className="fa fa-chevron-left" /> {t("Credit Note")}
              </strong>
            </a>
          </div>
          <section id="invoice_detail_page" className="box box--width-header">
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                <div className="col-4 pl-0 pl-lg-3">
                  {""}
                  {t("Entry Date")} : {""}
                  {detailItems.documentEntryDate
                    ? moment(detailItems.documentEntryDate).format("DD/MM/YYYY")
                    : "-"}
                </div>
                <div className="col-8 text-right pr-0 pr-lg-3">
                  {t("Status")} :{" "}
                  <strong
                    style={{
                      color: statusColor[detailItems.status],
                      "margin-right": "15px"
                    }}
                  >
                    {detailItems.status}
                  </strong>
                  <div className="d-none d-lg-inline-block">
                    <button
                      name="btnReject"
                      className="btn btn--transparent btn-wide mr-2"
                      hidden={!isAllowReject}
                      onClick={this.handleRejectModal}
                    >
                      Reject
                    </button>
                    <button
                      name="btnApprove"
                      className="btn btn-wide mr-2"
                      hidden={!isAllowApprove}
                      onClick={this.handleApproveModal}
                    >
                      Approve
                    </button>
                    <button
                      name="btnCancel"
                      className="btn btn--transparent btn-wide mr-2"
                      hidden={!isAllowCancel}
                      onClick={this.handleCancelModal}
                    >
                      {t("Cancel CN")}
                    </button>
                    {isAllowEdit ? (
                      <button
                        name="btnEdit"
                        className="btn btn-wide mr-2 d-none d-md-inline-block d-lg-inline-block d-xl-inline-block"
                        onClick={() => {
                          Router.push(
                            `/credit-note-edit?creditNoteID=${detailItems.linearId}`
                          );
                        }}
                      >
                        {t("Edit CN")}
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div
                  className={`col-12 px-0 ${
                    !isAllowReject &&
                    !isAllowApprove &&
                    !isAllowCancel &&
                    !isAllowEdit
                      ? "d-none"
                      : "d-inline-block d-lg-none"
                  } text-left`}
                >
                  <button
                    name="btnReject"
                    className="btn btn--transparent btn-wide mr-2"
                    hidden={!isAllowReject}
                    onClick={this.handleRejectModal}
                  >
                    Reject
                  </button>
                  <button
                    name="btnApprove"
                    className="btn btn-wide mr-2"
                    hidden={!isAllowApprove}
                    onClick={this.handleApproveModal}
                  >
                    Approve
                  </button>
                  <button
                    name="btnCancel"
                    className="btn btn--transparent btn-wide mr-2"
                    hidden={!isAllowCancel}
                    onClick={this.handleCancelModal}
                  >
                    {t("Cancel CN")}
                  </button>
                  <button
                    name="btnEdit"
                    className="btn btn-wide mr-2 d-none d-md-inline-block d-lg-inline-block d-xl-inline-block"
                    onClick={() => {
                      Router.push(
                        `/credit-note-edit?creditNoteID=${detailItems.linearId}`
                      );
                    }}
                    hidden={!isAllowEdit}
                  >
                    {t("Edit CN")}
                  </button>
                </div>
              </div>
            </div>
            <div className="box__inner pt-0 pt-lg-3">
              {/* Desktop version - Start */}
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={[t("Vendor"), t("Company")]}
                className="d-none d-lg-flex flex-wrap"
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
                      value={detailItems.vendorAddress}
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
                      value={detailItems.companyAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.companyTelephone}
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
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="d-flex flex-wrap w-100">
                  <div className="col-12">
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
                      value={detailItems.vendorAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.vendorTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              <Collapse
                id="companyInfo"
                expanded="true"
                collapseHeader={[t("Company")]}
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="d-flex flex-wrap w-100">
                  <div className="col-12">
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
                      value={detailItems.companyAddress}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.companyTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Mobile Version - End */}

              <Collapse
                id="cnInfo"
                expanded="true"
                collapseHeader={[t("Credit Note Information")]}
              >
                <div className="d-flex flex-wrap px-0">
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("Credit Note Date")}
                      colLabel="6"
                      value={moment(detailItems.creditNoteDate)
                        .format("DD/MM/YYYY")
                        .toString()}
                    />
                    {detailItems.requestExternalId ? (
                      <CollapseItemText
                        t={t}
                        label={t("Invoice Ref No")}
                        colLabel="6"
                        value="-"
                      />
                    ) : (
                      <CollapseItemLink2
                        label={t("Invoice Ref No")}
                        colLabel="6"
                        value={detailItems.invoiceExternalId}
                        href={`invoice-detail?linearId=${detailItems.invoiceLinearId}&ref=cn,${detailItems.linearId},${this.state.detailItems.externalId}`}
                      />
                    )}
                    <ExternalLink
                      label={t("Settle to Invoice No")}
                      colLabel="6"
                      lengthToShow="3"
                      textAtTheEnd="See All"
                      type="link"
                      value={this.state.taggedInvoices}
                      queryStringKey="linearIds"
                      menuKey="inv"
                      moreExternalLink={`/invoice?ref=cn,${detailItems.linearId},${detailItems.externalId}&linearIds=`}
                    />
                    <ExternalLink
                      label={t("Settle to Debit No")}
                      colLabel="6"
                      lengthToShow="3"
                      textAtTheEnd="See All"
                      type="link"
                      value={this.state.taggedDebitNotes}
                      queryStringKey="linearIds"
                      menuKey="dn"
                      moreExternalLink={`/debit-note?ref=cn,${detailItems.linearId},${detailItems.externalId}&linearIds=`}
                    />
                    <CollapseItemLink2
                      label={t("Request No")}
                      colLabel="6"
                      value={detailItems.requestExternalId}
                      href={`request-detail?linearId=${detailItems.requestLinearId}&ref=cn,${detailItems.linearId},${this.state.detailItems.externalId}`}
                    />
                    {/* <CollapseItemText t={t}
                      label="Request No."
                      value={detailItems.requestExternalId}
                    /> */}
                    <CollapseItemText
                      t={t}
                      label={t("Type of CN")}
                      colLabel="6"
                      value={
                        detailItems.adjustmentType === "Goods Return"
                          ? "Quantity Adjustment"
                          : detailItems.adjustmentType
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Payment Date")}
                      colLabel="6"
                      value={
                        detailItems.paymentDate
                          ? moment(detailItems.paymentDate)
                              .format("DD/MM/YYYY")
                              .toString()
                          : "-"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("E-Tax")}
                      colLabel="6"
                      value={detailItems.isETaxCreditNote ? "Yes" : "No"}
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("CN Amount")}
                      colLabel="6"
                      value={`${this.formatCurrency(detailItems.subTotal, 2)} ${
                        detailItems.currency
                      }`}
                      viewtype="currency"
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax Total")}
                      colLabel="6"
                      value={`${this.formatCurrency(detailItems.vatTotal, 2)} ${
                        detailItems.currency
                      }`}
                      viewtype="currency"
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Credit Note Amount (inc TAX)")}
                      colLabel="6"
                      value={`${this.formatCurrency(detailItems.total, 2)} ${
                        detailItems.currency
                      }`}
                      viewtype="currency"
                    />
                    <CollapseItemText
                      t={t}
                      label={t("WHT Pre-calculated Amount")}
                      colLabel="6"
                      value={`${this.formatCurrency(
                        detailItems.withholdingTaxTotal,
                        2
                      )} ${detailItems.currency}`}
                      viewtype="currency"
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Reason")}
                      colLabel="6"
                      value={detailItems.reason}
                    />
                  </div>
                </div>
              </Collapse>
              {/* attachment */}
              <Collapse
                id="cdInfo"
                expanded="true"
                collapseHeader={[t("Attachments")]}
              >
                <div className="d-flex flex-wrap px-0">
                  <div className="col-12 col-lg-6">
                    <CollapseItemExternalLink
                      label={t("Attached Credit")}
                      colLabel="6"
                      value={
                        attachmentCreditNote && attachmentCreditNote.length > 0
                          ? attachmentCreditNote
                          : "-"
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <CollapseItemExternalLink
                      label={t("Other Document")}
                      colLabel="6"
                      value={
                        attachmentOthers && attachmentOthers.length > 0
                          ? attachmentOthers
                          : "-"
                      }
                    />
                  </div>
                </div>
              </Collapse>
            </div>
          </section>
          <section id="invoice_detail_page" className="box box--width-header">
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                <div className="col">
                  <h3>{t("Items Information")}</h3>
                </div>
                <button
                  className="btn btn--transparent mr-3 d-none d-lg-inline-block"
                  data-toggle="modal"
                  data-target="#itemInvoice"
                >
                  {t("Column Display")}
                </button>
              </div>
            </div>
            {this.state.taxRateList &&
              this.state.taxRateList.map((vatRate, taxListIndex) => {
                return (
                  <div className="box__inner pt-0 pt-lg-3" key={taxListIndex}>
                    <Collapse
                      id={`tax${vatRate}`}
                      expanded="true"
                      collapseHeader={[`${t("TAX")} ${vatRate}%`]}
                    >
                      <div className="d-none d-lg-inline-block">
                        {/* Desktop Version - Start */}
                        <div className="table-group-item-invoice">
                          <div className="table-invoice-left">
                            <div className="table-responsive overflow-y-hidden">
                              <table className="table table-3 dataTable">
                                <thead>
                                  <tr>
                                    {this.filterSubTotalCurrency(
                                      this.state.columnListItem
                                    )

                                      .filter(column => !column.hidden)
                                      .map((column, j) => {
                                        return (
                                          <th className="th-invoice" key={j}>
                                            {t(column.header)}
                                          </th>
                                        );
                                      })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {this.generateRowTableForTax(
                                    this.state.taxRateListItem[`tax${vatRate}`]
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="table-invoice-right border-left-table-invoice">
                            <div className="table-responsive">
                              <table className="table table-3 dataTable">
                                <thead>
                                  <tr>
                                    <th className="th-invoice">
                                      {t("CN Amount")}
                                    </th>
                                    <th className="th-invoice">
                                      {t("Currency")}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {this.renderCloneTable(
                                    this.state.taxRateListItem[`tax${vatRate}`]
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        <div className="table-group-item-invoice">
                          <div className="table-invoice-left">
                            <div className="table-responsive">
                              <table className="table table-invoice-summary">
                                <tbody>
                                  <tr className="non-br-table-invoice-summary">
                                    <td className="text-right">
                                      {t("Sub Total")} {t("Exclude VAT")}
                                    </td>
                                  </tr>
                                  <tr className="non-br-table-invoice-summary">
                                    <td className="text-right">
                                      {t("Tax Total")} ({vatRate}%)
                                    </td>
                                  </tr>
                                  <tr className="non-br-table-invoice-summary">
                                    <td className="text-right">
                                      {t("Invoice Amount")}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="table-invoice-right">
                            <div className="table-responsive">
                              <table className="table table-invoice-summary">
                                <tbody>
                                  <tr className="non-br-table-invoice-summary">
                                    <td className="text-right">
                                      <span className="font-bold pr-2">
                                        {this.formatCurrency(
                                          this.getCalItemsSubTotal(
                                            this.state.taxRateListItem[
                                              `tax${vatRate}`
                                            ],
                                            2
                                          ),
                                          2
                                        )}
                                      </span>
                                    </td>
                                    <td className="pr-4">
                                      {detailItems.currency}
                                    </td>
                                  </tr>
                                  <tr className="non-br-table-invoice-summary">
                                    <td className="text-right">
                                      <span className="font-bold pr-2">
                                        {this.formatCurrency(
                                          this.calTax(
                                            this.getCalItemsSubTotal(
                                              this.state.taxRateListItem[
                                                `tax${vatRate}`
                                              ],
                                              2
                                            ),
                                            vatRate
                                          ),
                                          2
                                        )}
                                      </span>
                                    </td>
                                    <td className="pr-4">
                                      {detailItems.currency}
                                    </td>
                                  </tr>
                                  <tr className="non-br-table-invoice-summary">
                                    <td className="text-right">
                                      <span className="font-bold pr-2">
                                        {this.formatCurrency(
                                          this.getCalItemsSubTotal(
                                            this.state.taxRateListItem[
                                              `tax${vatRate}`
                                            ]
                                          ) +
                                            +this.calTax(
                                              this.getCalItemsSubTotal(
                                                this.state.taxRateListItem[
                                                  `tax${vatRate}`
                                                ]
                                              ),
                                              vatRate
                                            ),
                                          2,
                                          2
                                        )}
                                      </span>
                                    </td>
                                    <td className="pr-4">
                                      {detailItems.currency}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Desktop Version - End */}

                      {/* Mobile Version - Start */}
                      <div className="d-inline-block d-lg-none">
                        <table className="table dataTable mobile_dataTable">
                          <thead>
                            <tr>
                              <th className="text-center th-invoice-mobile">
                                {
                                  this.filterSubTotalCurrency(
                                    this.state.moblieColumnListItem
                                  ).filter(column => !column.hidden)[0].header
                                }
                              </th>
                              <th className="text-center th-invoice-mobile">
                                {
                                  this.filterSubTotalCurrency(
                                    this.state.moblieColumnListItem
                                  ).filter(column => !column.hidden)[1].header
                                }
                              </th>
                              <th className="text-center">{t("More")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Loop here - Start */}
                            {this.generateMobileMoreInfomationForTax(
                              this.state.taxRateListItem[`tax${vatRate}`]
                            )}
                            {/* Loop here - End */}
                          </tbody>
                        </table>

                        {/* Summary Section - Start */}
                        <div className="d-flex flex-wrap w-100 border-top">
                          <div className="col-12 px-0 pt-3 d-flex flex-wrap">
                            <div className="col-6 text-right px-0">
                              {t("Sub Total (Exclude VAT)")}
                            </div>
                            <div className="col-4 text-right pl-0 pr-1">
                              <span className="bold">
                                {this.formatCurrency(
                                  this.getCalItemsSubTotal(
                                    this.state.taxRateListItem[`tax${vatRate}`],
                                    2
                                  ),
                                  2
                                )}
                              </span>
                            </div>
                            <div className="col-2 text-right pl-1">
                              {detailItems.currency}
                            </div>
                          </div>
                          <div className="col-12 px-0 pt-3 d-flex flex-wrap">
                            <div className="col-6 text-right px-0">
                              {t("Tax Total")} ({vatRate}%)
                            </div>
                            <div className="col-4 text-right pl-0 pr-1">
                              <span className="bold">
                                {this.formatCurrency(
                                  this.calTax(
                                    this.getCalItemsSubTotal(
                                      this.state.taxRateListItem[
                                        `tax${vatRate}`
                                      ],
                                      2
                                    ),
                                    vatRate
                                  ),
                                  2
                                )}
                              </span>
                            </div>
                            <div className="col-2 text-right pl-1">
                              {detailItems.currency}
                            </div>
                          </div>
                          <div className="col-12 px-0 py-3 d-flex flex-wrap">
                            <div className="col-6 text-right px-0">
                              {t("Invoice Amount (Inc TAX)")}
                            </div>
                            <div className="col-4 text-right pl-0 pr-1">
                              <span className="bold">
                                {this.formatCurrency(
                                  this.getCalItemsSubTotal(
                                    this.state.taxRateListItem[`tax${vatRate}`]
                                  ) +
                                    +this.calTax(
                                      this.getCalItemsSubTotal(
                                        this.state.taxRateListItem[
                                          `tax${vatRate}`
                                        ]
                                      ),
                                      vatRate
                                    ),
                                  2,
                                  2
                                )}
                              </span>
                            </div>
                            <div className="col-2 text-right pl-1">
                              {detailItems.currency}
                            </div>
                          </div>
                        </div>
                        {/* Summary Section - End */}
                      </div>
                      {/* Mobile Version - End */}
                    </Collapse>
                  </div>
                );
              })}
          </section>
        </BlockUi>
        <ColumnModalInvoice
          title="Column List"
          modalId="itemInvoice"
          columnList={this.filterSubTotalCurrency(this.state.columnListItem)}
          cancelAction={this.cancelAction}
          onSave={this.onSave}
        />
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
          <div className="form-label-group">
            <textarea
              id="rejectRemark"
              name="rejectRemark"
              className={`form-control ${
                !rejectTextareaIsRequired ? "" : "required"
              }`}
              placeholder="Reason *"
              rows="5"
              onChange={this.handleOnchangeRemarkRejectCN}
              value={rejectRemark}
              required
            />
            <span className="text-danger" hidden={!rejectTextareaIsRequired}>
              This field is required
            </span>
          </div>
        </ModalAlert>
        <ModalAlert
          title={alertApproveModalAlertTitle}
          visible={isAlertApproveModalVisible}
          button={buttonAlertApprove}
        >
          <div className="form-label-group">
            <textarea
              id="approveRemark"
              name="approveRemark"
              className={`form-control ${
                !rejectTextareaIsRequired ? "" : "required"
              }`}
              placeholder="Comment"
              rows="5"
              onChange={this.handleOnchangeRemarkApproveCN}
              value={approveRemark}
              required
            />
          </div>
        </ModalAlert>
      </Layout>
    );
  }
}
export default withAuth(
  withTranslation(["credit-detail", "detail", "common", "menu"])(
    CreditNoteDetail
  )
);
