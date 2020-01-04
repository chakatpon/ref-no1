import React, { Component, Fragment } from "react";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import CordaService from "../services/CordaService";
import StandardService from "../services/StandardService";
import "../libs/mycools";
import statusColor from "~/configs/color.rq.json";
import { PageHeader, Collapse } from "../components/page";
import BlockUi from "react-block-ui";
import SectionInfo from "../components/SectionInfo";
import SectionTwoHeaderInfo from "../components/SectionTwoHeaderInfo";
import { REQUEST_AUTH } from "../configs/authorise.config";
import { REQUEST_ROUTES } from "../configs/routes.config";
import {
  MODEL_VENDOR_INFO,
  MODEL_COMPANY_INFO
} from "../components/request/models/vendor-company-info-detail";
import { SYSTEM_FAILED, WANT_ACTION } from "../configs/errorMessage.config";
import { REQUEST_HEADER_INFO } from "../components/request/models/request-info";
import { COLUMN_REQUEST_ITEMS } from "~/components/request/models/request-items-column";
import ModalMessage from "../components/common/SweetAlert";
import ModalAlert from "../components/modalAlert";
import Fields from "../components/Fields";
import SectionItemsInfo from "~/components/SectionItemsInfo";
import {
  getKeyElementField,
  setConfigPermissionToArray,
  checkValue
} from "~/helpers/app";
import { REFERENCE_TYPE } from "../components/request/config";
import { withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const FORMAT = "DD/MM/YYYY";
const lifecycleAllowSendRequest = ["ISSUED", "PENDING_BUYER", "PENDING_SELLER"];
const lifecycleAllowConfirmRequest = ["PENDING_BUYER", "PENDING_SELLER"];
const lifecycleBuyerAllowEditRequest = ["ISSUED", "PENDING_BUYER"];
const lifecycleSellerAllowEditRequest = ["PENDING_SELLER"];
const lifecycleAllowCancelRequest = ["ISSUED", "PENDING_BUYER"];
const REQUEST_TYPE = {
  CREDIT: "CN",
  DEBIT: "DN"
};

class RequestDetail extends Component {
  constructor(props) {
    super(props);

    this.cordaService = new CordaService();
    this.standardService = new StandardService();

    this.state = {
      isLoading: true,
      blocking: false,
      linearId: this.props.url.query.linearId,
      detailItems: {},
      requestConfigByTaxId: [],
      actionHistory: [],

      isAllowCancel: false,
      isAllowEdit: false,
      isAllowSendRequest: false,
      isAllowConfirmRequest: false,

      isActionHistorySectionBlock: true,
      isAllowActionHistory: false,
      isToggleCancelRequestModal: false,
      requestPermissions: []
    };
  }
  init = () => {
    this.handleToggleBlocking();
    this.customModelVendorInfoAndCompanyInfo();
    this.customModelRequestInfoAndReference();
    this.customModelDocumentInfoLeftAndDocumentInfoRight();
    this.setState({ isLoading: false });
    this.handleToggleBlocking();
  };

  async componentDidMount() {
    this.handleToggleBlocking();

    await this.permissionPage();
    await this.fetchData();
    await this.getRequestConfigurationByTaxId();

    if (this.state.isAllowActionHistory) {
      await this.getActionHistory();
    }

    await this.getRequestPermission();

    this.handleToggleBlocking();
    this.init();
  }

  customModelVendorInfoAndCompanyInfo = () => {
    const headerLevel = "HEADER";

    MODEL_COMPANY_INFO.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });

    MODEL_VENDOR_INFO.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });
  };

  customModelRequestInfoAndReference = () => {
    const headerLevel = "HEADER";

    REQUEST_HEADER_INFO.MODEL_REQUEST_INFO.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });

    REQUEST_HEADER_INFO.MODEL_REFERENCE.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });
  };

  customModelDocumentInfoLeftAndDocumentInfoRight = () => {
    const headerLevel = "HEADER";

    REQUEST_HEADER_INFO.MODEL_DOCUMENT_INFO_LEFT.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });

    REQUEST_HEADER_INFO.MODEL_DOCUMENT_INFO_RIGHT.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });
  };

  customModelDocumentInfoLeftAndDocumentInfoRight = () => {
    const headerLevel = "ITEM";

    COLUMN_REQUEST_ITEMS.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });
  };

  setDisplayField = (field, level) => {
    const { requestPermissions } = this.state;
    const permissions = _.has(requestPermissions, level)
      ? requestPermissions[level]
      : [];

    const keyElement = getKeyElementField(field);
    if (_.has(permissions, keyElement)) {
      const { displayName } = permissions[keyElement];

      field.required = false;
      field.placeholder = displayName;
      field.title = displayName;
      field.header = displayName;
    }
  };

  getRequestPermission = async () => {
    this.handleToggleBlocking();
    let permissions = [];
    const { detailItems } = this.state;
    const { type, subType, companyTaxNumber, lifecycle, buyer } = detailItems;

    let checkLifeCycle = lifecycle === "CLOSED" ? "ISSUED" : lifecycle;
    let action = checkLifeCycle;

    if (
      checkLifeCycle === "PENDING_BUYER" ||
      checkLifeCycle === "PENDING_SELLER"
    ) {
      action += detailItems.agreementFlag ? "_ACCEPT" : "_DECLINE";
    }

    const requestParams = {
      type: type,
      subtype: subType,
      companyTaxId: companyTaxNumber,
      action: action,
      party: buyer.legalName
    };

    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getRequestPermission",
      requestParams: requestParams
    });

    this.handleToggleBlocking();

    if (status) {
      permissions = setConfigPermissionToArray(data);
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get request permission"
      );

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });
    }

    this.setState({ requestPermissions: permissions });
  };

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  getRequestConfigurationByTaxId = async () => {
    const { detailItems } = this.state;
    const requestParams = {
      companyTaxId: detailItems.companyTaxNumber,
      party: detailItems.buyer.legalName
    };

    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getRequestConfigurationByTaxId",
      requestParams: requestParams
    });

    let result = data;

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get request configuration by tax id"
      );

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });

      result = [];
    }

    this.setState({
      requestConfigByTaxId: result
    });
  };

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

  getActionHistory = async () => {
    const requestParams = {
      documentType: "request",
      documentLinearId: this.state.detailItems.linearId
    };

    const { status, data } = await this.standardService.callApi({
      group: "actionHistory",
      action: "getActionHistory",
      requestParams: requestParams
    });

    if (status) {
      this.setState({
        actionHistory: data,
        isActionHistorySectionBlock: false
      });
    }
  };

  permissionPage = () => {
    const { permissions } = this.props;

    if (!permissions.includes(REQUEST_AUTH.VIEW)) {
      Router.push("/dashboard");
    }
  };

  fetchData = async () => {
    const { user, url, permisions } = this.props;

    const pathParams = {
      linearId: url.query.linearId
    };

    const requestResponse = await this.cordaService.callApi({
      group: "request",
      action: "getRequestDetail",
      pathParams: pathParams
    });

    const { status, message } = requestResponse;

    if (status) {
      const data = requestResponse.data.rows
        ? requestResponse.data.rows[0]
        : requestResponse.data;

      this.setState({
        UserAuthority: permisions,
        detailItems: data,
        items: data.requestItems
      });

      if (
        this.state.UserAuthority.includes(REQUEST_AUTH.SEND) &&
        lifecycleAllowSendRequest.includes(this.state.detailItems.lifecycle)
      ) {
        switch (this.state.detailItems.lifecycle) {
          case "ISSUED":
            this.setState({
              isAllowSendRequest: user.organisationUnit === "BUYER"
            });
            break;
          default:
            if (
              data.agreementFlag !== undefined &&
              data.agreementFlag !== null &&
              data.agreementFlag === false
            ) {
              // agreementFlag = true not required agreedRemark, false required agreedRemark
              let allow =
                data.agreedRemark !== undefined &&
                data.agreedRemark !== null &&
                data.agreedRemark !== "";

              switch (true) {
                case this.state.detailItems.lifecycle === "PENDING_SELLER" &&
                  user.organisationUnit === "BUYER":
                  allow = false;
                  break;
                case this.state.detailItems.lifecycle === "PENDING_BUYER" &&
                  user.organisationUnit === "SELLER":
                  allow = false;
                  break;
              }

              this.setState({ isAllowSendRequest: allow });
            }
        }
      }

      if (
        user.organisationUnit === "BUYER" &&
        this.state.UserAuthority.includes(REQUEST_AUTH.EDIT) &&
        lifecycleBuyerAllowEditRequest.includes(
          this.state.detailItems.lifecycle
        )
      ) {
        this.setState({ isAllowEdit: true });
      }

      if (
        user.organisationUnit === "SELLER" &&
        this.state.UserAuthority.includes(REQUEST_AUTH.EDIT) &&
        lifecycleSellerAllowEditRequest.includes(
          this.state.detailItems.lifecycle
        )
      ) {
        this.setState({ isAllowEdit: true });
      }

      if (
        this.state.UserAuthority.includes(REQUEST_AUTH.APPROVE) &&
        lifecycleAllowConfirmRequest.includes(
          this.state.detailItems.lifecycle
        ) &&
        data.agreementFlag !== undefined &&
        data.agreementFlag !== null &&
        data.agreementFlag === true
      ) {
        let allow = true;

        switch (true) {
          case this.state.detailItems.lifecycle === "PENDING_SELLER" &&
            user.organisationUnit === "BUYER":
            allow = false;
            break;
          case this.state.detailItems.lifecycle === "PENDING_BUYER" &&
            user.organisationUnit === "SELLER":
            allow = false;
            break;
        }

        this.setState({ isAllowConfirmRequest: allow });
      }

      if (
        user.organisationUnit === "BUYER" &&
        this.state.UserAuthority.includes(REQUEST_AUTH.CANCEL) &&
        lifecycleAllowCancelRequest.includes(this.state.detailItems.lifecycle)
      ) {
        this.setState({ isAllowCancel: true });
      }
    } else {
      this.handleErrorModal(message);
    }
  };

  handleEditBtnClick = () => {
    Router.push(`/request-edit?linearId=${this.state.linearId}`);
  };

  handleSendRequest = () => {
    ModalMessage({
      title: "Send Request",
      message: `${WANT_ACTION} send Request?`,
      buttons: [
        {
          label: "No",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: () => {}
          }
        },
        {
          label: "Yes",
          attribute: {
            onClick: () => this.submitSendRequest()
          }
        }
      ]
    });
  };

  submitSendRequest = async () => {
    GA.event({
      category: "Request",
      action: "Send Request (Request)",
      label: `Request | ${
        this.state.detailItems.externalId
      } | ${moment().format()}`
    });

    this.handleToggleBlocking();

    const { detailItems } = this.state;
    const { user } = this.props;
    const party = user.organisationUnit.toLowerCase();
    const pathParams = {
      party: party
    };

    let action;
    switch (detailItems.lifecycle) {
      case "PENDING_BUYER":
        action = "buyerClarifyRequest";
        break;
      default:
        action = "sendRequest";
    }

    const { status, message } = await this.cordaService.callApi({
      group: "request",
      action: action,
      body: detailItems,
      pathParams: pathParams
    });

    this.handleToggleBlocking();

    if (status) {
      GA.event({
        category: "Request",
        action: "Send Request (Success)",
        label: `Request | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      Router.push(`/request-list`);
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "send request");

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });

      GA.event({
        category: "Request",
        action: "Send Request (Failed)",
        label: `Request | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });
    }
  };

  handleConfirmRequest = () => {
    ModalMessage({
      title: "Confirm Request",
      message: `${WANT_ACTION} confirm Request?`,
      buttons: [
        {
          label: "No",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: () => {}
          }
        },
        {
          label: "Yes",
          attribute: {
            onClick: () => this.submitConfirmRequest()
          }
        }
      ]
    });
  };

  submitConfirmRequest = async () => {
    GA.event({
      category: "Request",
      action: "Confirm Request (Request)",
      label: `Request | ${
        this.state.detailItems.externalId
      } | ${moment().format()}`
    });

    this.handleToggleBlocking();

    const { detailItems } = this.state;
    const { user } = this.props;
    const pathParams = { party: user.organisationUnit.toLowerCase() };
    const { status, message } = await this.cordaService.callApi({
      group: "request",
      action: "approveRequest",
      body: detailItems,
      pathParams: pathParams
    });

    this.handleToggleBlocking();

    if (status) {
      GA.event({
        category: "Request",
        action: "Confirm Request (Success)",
        label: `Request | ${this.state.detailItems.externalId} | ${moment().format()}`
      });

      Router.push(`/request-list`);
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "confirm request"
      );

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });

      GA.event({
        category: "Request",
        action: "Confirm Request (Failed)",
        label: `Request | ${this.state.detailItems.externalId} | ${moment().format()}`
      });
    }
  };

  handleCancelRequest = () => {
    this.setState({
      isToggleCancelRequestModal: !this.state.isToggleCancelRequestModal,
      cancelledRemark: null
    });
  };

  handleCancelledRemarkChange = e => {
    this.setState({
      cancelledRemark: e.target.value
    });
  };

  submitCancelRequest = async () => {
    GA.event({
      category: "Request",
      action: "Cancel Request (Request)",
      label: `Request | ${this.state.detailItems.externalId} | ${moment().format()}`
    });

    this.handleToggleBlocking();

    const { detailItems, cancelledRemark } = this.state;
    const body = {
      linearId: detailItems.linearId,
      cancelledRemark: cancelledRemark
    };

    const { status, message } = await this.cordaService.callApi({
      group: "request",
      action: "buyerCancelRequest",
      body: body
    });

    this.handleCancelRequest();
    this.handleToggleBlocking();

    if (status) {
      GA.event({
        category: "Request",
        action: "Cancel Request (Success)",
        label: `Request | ${this.state.detailItems.externalId} | ${moment().format()}`
      });

      Router.push(`/request-list`);
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "cancel request");

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });

      GA.event({
        category: "Request",
        action: "Cancel Request (Failed)",
        label: `Request | ${this.state.detailItems.externalId} | ${moment().format()}`
      });
    }
  };

  generateButton() {
    const {
      isAllowEdit,
      isAllowCancel,
      isAllowSendRequest,
      isAllowConfirmRequest
    } = this.state;
    return (
      <Fragment>
        <button
          name="btnCancel"
          className="btn btn--transparent btn-wide mr-2"
          hidden={!isAllowCancel}
          onClick={() => this.handleCancelRequest()}
        >
          Cancel
        </button>
        <button
          name="btnEditRequest"
          className="btn btn--transparent btn-wide mr-2"
          hidden={!isAllowEdit}
          onClick={() => this.handleEditBtnClick()}
        >
          Edit Request
        </button>
        <button
          name="btnSendRequest"
          className="btn btn-wide mr-2"
          hidden={!isAllowSendRequest}
          onClick={() => this.handleSendRequest()}
        >
          Send Request
        </button>
        <button
          name="btnConfirmRequest"
          className="btn btn-wide mr-2"
          hidden={!isAllowConfirmRequest}
          onClick={() => this.handleConfirmRequest()}
        >
          Confirm Request
        </button>
      </Fragment>
    );
  }

  generateInformationItems(itemInformation) {
    if (itemInformation && itemInformation.length > 0) {
      return _.map(
        itemInformation,
        (
          {
            externalId,
            invoiceItemExternalId,
            materialDescription,
            purchaseItem,
            invoiceItems,
            subTotal,
            currency,
            siteDescription,
            withholdingTaxRate
          },
          index
        ) => (
          <tr key={index}>
            {/* DN Item No. */}
            {externalId ? <td>{externalId}</td> : <td>-</td>}
            {/* Invoice Item No. */}
            {invoiceItemExternalId ? (
              <td>{invoiceItemExternalId}</td>
            ) : (
              <td>-</td>
            )}
            {/* Material Description */}
            {materialDescription ? <td>{materialDescription}</td> : <td>-</td>}
            {/* PO No. */}
            {purchaseItem && purchaseItem.poNumber ? (
              <td>{purchaseItem.poNumber}</td>
            ) : (
              <td>-</td>
            )}
            {/* Invoice Amount */}
            {invoiceItems && invoiceItems[0].itemSubTotal ? (
              <td>{this.formatCurrency(invoiceItems[0].itemSubTotal, 2)}</td>
            ) : (
              <td>- {invoiceItems}</td>
            )}
            {/* DN Amount */}
            {subTotal ? (
              <td>{this.formatCurrency(subTotal, 2)}</td>
            ) : (
              <td>-</td>
            )}
            {/* Currency */}
            {currency ? <td>{currency}</td> : <td>-</td>}
            {/* Site */}
            {siteDescription ? <td>{siteDescription}</td> : <td>-</td>}
            {/* WHT Rate */}
            {withholdingTaxRate ? <td>{withholdingTaxRate} %</td> : <td>-</td>}
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

  setFormatData = () => {
    const { detailItems, requestConfigByTaxId } = this.state;
    const { type, subType, referenceType } = detailItems;
    const typeSelected = requestConfigByTaxId.find(
      config => config.type === type
    );
    const { purchaseOrder, invoice, others } = REFERENCE_TYPE;
    const referenceTypeSelected =
      referenceType === purchaseOrder.value
        ? purchaseOrder
        : referenceType === invoice.value
        ? invoice
        : others;

    let subTypeSelected = [];

    if (typeSelected !== undefined && typeSelected !== null) {
      subTypeSelected = typeSelected.subType.find(
        item => item.value === subType
      );
    }

    return {
      ...detailItems,
      vendorBranchCodeDisplay: `${detailItems.vendorBranchCode} ${
        detailItems.vendorBranchName ? `(${detailItems.vendorBranchName})` : ""
      }`,
      companyBranchCodeDisplay: `${detailItems.companyBranchCode} ${
        detailItems.companyBranchName
          ? `(${detailItems.companyBranchName})`
          : ""
      }`,
      typeDisplay:
        typeSelected && typeSelected.typeDisplayName
          ? typeSelected.typeDisplayName
          : type,
      subTypeDisplay:
        subTypeSelected && subTypeSelected.subtypeDisplayName
          ? subTypeSelected.subtypeDisplayName
          : subType,
      referenceTypeDisplay: referenceTypeSelected.display,
      documentDate: detailItems.documentDate
        ? moment(detailItems.documentDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-",
      paymentDueDate: detailItems.paymentDueDate
        ? moment(detailItems.paymentDueDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-"
    };
  };

  renderActionHistoryTable() {
    const { actionHistory } = this.state;
    return (
      <section id="invoice_detail_page" className="box box--width-header">
        <div className="box__inner">
          <Collapse
            id="actionHistory"
            expanded="true"
            collapseHeader={["Action History"]}
          >
            <div className="table_wrapper">
              <div className="table-responsive">
                <table className="table table-3 dataTable">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Date/Time</th>
                      <th>Modified by</th>
                      <th>Reason</th>
                      <th>Attach File</th>
                    </tr>
                  </thead>

                  <tbody>
                    {actionHistory.length > 0 ? (
                      actionHistory
                        .sort(
                          (a, b) =>
                            moment(b.actionDate).unix() -
                            moment(a.actionDate).unix()
                        )
                        .map((i, k) => {
                          return (
                            <tr key={k}>
                              <td>{i.actionName}</td>
                              <td>
                                {moment(i.actionDate).format(
                                  "DD/MM/YYYY HH:mm:ss"
                                )}
                              </td>
                              <td>{i.commomName || i.actionBy}</td>
                              <td>{i.remark}</td>
                              <td>
                                {i.attachments.map((att, attKey) => (
                                  <div key={attKey}>
                                    {att.attachmentName}&nbsp;
                                    <a
                                      href={`download/${att.attachmentHash}/${att.attachmentName}?filename=${att.attachmentName}&owner=${att.owner}`}
                                      className="purple font-bold underline"
                                    >
                                      Download
                                    </a>
                                  </div>
                                ))}
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          {this.state.isActionHistorySectionBlock
                            ? "Cannot retrieve Action History for this request"
                            : "No Item Found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Collapse>
        </div>
      </section>
    );
  }

  renderRowsTableForRequestItem = items => {
    if (!items || items.length <= 0) {
      return (
        <tr>
          <td colSpan="9" className="text-center">
            No Item Found
          </td>
        </tr>
      );
    }

    return _.map(items, (item, index) => {
      return (
        <tr key={item.externalId + index}>
          <td>{checkValue(item.externalId, "-")}</td>
          <td>{checkValue(item.description, "-")}</td>
          <td>
            {this.formatPriceNumber(checkValue(item.quantity.initial, "0"))}
          </td>
          <td>{checkValue(item.unitDescription, "-")}</td>
          <td>{this.formatPriceNumber(checkValue(item.unitPrice, "0"))}</td>
          <td>{this.formatPriceNumber(checkValue(item.subTotal, "0"))}</td>
          <td>{this.formatPriceNumber(checkValue(item.vatTotal, "0"))}</td>
          <td>{checkValue(item.currency, "-")}</td>
          <td>{checkValue(item.site, "-")}</td>
        </tr>
      );
    });
  };

  formatPriceNumber = amount =>
    Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);

  render() {
    const { t } = this.props;
    const { isLoading, detailItems } = this.state;
    const { requestItems } = detailItems;

    const { page_pre = "" } = this.props.url.query;
    let breadcrumbs = [];

    if (page_pre === "doa") {
      breadcrumbs = [
        { title: t("Waiting DOA Approval"), url: "/waiting-doa-approval" },
        {
          title: `Request ${REQUEST_TYPE[detailItems.type]} No: ${
            !!detailItems.documentNumber ? detailItems.documentNumber : "-"
          }`,
          active: true
        }
      ];
    } else {
      breadcrumbs = [
        { title: t("Request"), url: REQUEST_ROUTES.LIST },
        {
          title: `${t(`Request ${REQUEST_TYPE[detailItems.type]} No`)}: ${
            !!detailItems.documentNumber ? detailItems.documentNumber : "-"
          }`,
          active: true
        }
      ];
    }

    return (
      <Layout {...this.props}>
        <BlockUi tag="div" blocking={this.state.blocking}>
          <PageHeader
            title={`${t("Request No")} ${
              !!detailItems.externalId ? detailItems.externalId : ""
            }`}
            breadcrumbs={breadcrumbs}
            {...this.props}
          />
          <section id="invoice_detail_page" className="box box--width-header">
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-2">
                <div className="col-4">
                  {""}
                  {t("Entry Date")} : {""}
                  {moment(detailItems.documentEntryDate).format("DD/MM/YYYY")}
                </div>
                <div className="col-8 text-right">
                  {t("Status")} :{" "}
                  <strong
                    style={{
                      color: statusColor[detailItems.status],
                      marginRight: "15px"
                    }}
                  >
                    {detailItems.status}
                  </strong>
                  {this.generateButton()}
                </div>
              </div>
            </div>
            <div className="box__inner">
              {isLoading === false && (
                <Fragment>
                  <SectionTwoHeaderInfo
                    id="vendorInfo"
                    classColumnWidth="col-12"
                    datas={this.setFormatData()}
                    modelOne={MODEL_VENDOR_INFO}
                    modelTwo={MODEL_COMPANY_INFO}
                  />

                  <SectionTwoHeaderInfo
                    id="requestInfo"
                    classColumnWidth="col-12"
                    datas={this.setFormatData()}
                    modelOne={REQUEST_HEADER_INFO.MODEL_REQUEST_INFO}
                    modelTwo={REQUEST_HEADER_INFO.MODEL_REFERENCE}
                  />

                  <SectionInfo
                    id="documentInfo"
                    header="Document Information"
                    classColumnWidth="col-12"
                    datas={this.setFormatData()}
                    modelOne={REQUEST_HEADER_INFO.MODEL_DOCUMENT_INFO_LEFT}
                    modelTwo={REQUEST_HEADER_INFO.MODEL_DOCUMENT_INFO_RIGHT}
                  />
                  <div className="box">
                    <SectionItemsInfo
                      id="vat"
                      model={COLUMN_REQUEST_ITEMS}
                      datas={requestItems}
                      renderRowsTable={this.renderRowsTableForRequestItem}
                      header="Items Information"
                      classTable="table-3"
                      lang={REQUEST_HEADER_INFO.MODEL_VENDOR_INFO.lang}
                    />
                  </div>
                  {/* {this.renderItemInformation()} */}
                </Fragment>
              )}
            </div>
          </section>
          <BlockUi hidden={!this.state.isAllowActionHistory}>
            <section id="invoice_detail_page" className="box box--width-header">
              <div className="box__header">
                <div className="row justify-content-between align-items-center mb-2">
                  <div className="col">
                    <h3>Action History</h3>
                  </div>
                </div>
              </div>
              {this.renderActionHistoryTable()}
            </section>
          </BlockUi>
        </BlockUi>
        <ModalAlert
          title="Cancel Request"
          visible={this.state.isToggleCancelRequestModal}
          button={[
            {
              label: "No",
              attribute: {
                className: "btn btn--transparent btn-wide",
                onClick: () => this.handleCancelRequest()
              }
            },
            {
              label: "Yes",
              attribute: {
                className: "btn btn-wide",
                onClick: () => this.submitCancelRequest()
              }
            }
          ]}
        >
          <div className="col-12">
            <div className="form-group custom-width-100">
              <Fields
                inputProps={{
                  type: "textArea",
                  key: "cancelledRemark",
                  onChange: e => this.handleCancelledRemarkChange(e),
                  canEdit: true,
                  classInput: `col-12`,
                  placeholder: "Remark"
                }}
                datas={{
                  cancelledRemark: this.state.cancelledRemark
                }}
                model={{ lang: "request-detail" }}
              />
            </div>
          </div>
        </ModalAlert>
      </Layout>
    );
  }
}
export default withAuth(withTranslation(["request-detail"])(RequestDetail));
