import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import moment from "moment";
import Layout from "../components/Layout";
import FilterListForInvoice from "../components/FilterListForInvoice";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
import statusColor from "../configs/color.invoice.json";
import exportLimit from "../configs/export.limit.json";
import List from "../components/List";
import { isMobile } from "react-device-detect";
import { saveAs } from "file-saver";
import ModalAlert from "../components/modalAlert";
import { i18n, withTranslation } from "~/i18n";
import NewFilterList from "~/components/NewFilterList";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import dynamic from "next/dynamic";
import followMeConfig from "../follow-me.json";
import {
  INVOICE_SELLER_STEPS,
  INVOICE_BUYER_STEPS
} from "../configs/followMe/invoiceStep";
import { HELPER_STEP_THAI } from "../configs/followMe/helperStep";
import GA from "~/libs/ga";

const Tour = dynamic(() => import("~/components/custom-reactour"), {
  ssr: false
});
import axios from "axios";

const queryString = require("query-string");
const accentColor = "#af3694";
const lang = "inv-list";

class invoiceList extends Component {
  constructor(props) {
    super(props);
    GA.initialize(props);
    this.apis = new api(this.props.domain).group("invoice");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);

    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "Invoice",
      GATitle: "Invoice",
      menukey: "inv",
      viewing: "all",
      dataTableUrl: this.apis.url("list", {
        role: this.props.user.organisationUnit
      }),
      breadcrumbs: [],
      columnList: [],
      model: [],
      searchItems: [],
      showSearchbox: true,
      modalvisible: false,

      saveColumnUrl: this.apis.url("model.save"),
      recordsTotal: 0,
      limitExportRecords: exportLimit["limit"],
      isAlertModalVisible: false,
      isTourOpen: false,
      isHelperOper: false,
      dontshowHelper: false
    };
    const { ref, purchaseOrderNumber } = this.props.url.query;

    if (ref && ref.split(",")[0] == "po") {
      let breadcrumb = [];
      breadcrumb.push({ title: "Purchase Order", url: "/purchase-order" });
      breadcrumb.push({
        title: `PO No. ${purchaseOrderNumber}`,
        url: `/purchase-order-detail?linearId=${ref.split(",")[1]}`
      });
      breadcrumb.push({
        title: `Invoice Lists`,
        active: true
      });
      this.state.title = `Invoice Lists of Purchase Order No. ${purchaseOrderNumber}`;
      this.state.showSearchbox = false;
      this.state.breadcrumbs = breadcrumb;
      this.state.dataTableUrl = this.apis.url("list", {
        purchaseOrderNumber
      });
    }
  }

  async componentDidMount() {
    try {
      GA.pageview();
      var _this = this;
      const { permisions } = this.props;
      if (!permisions.includes("Invoice-List")) {
        Router.push("/dashboard");
      }

      this._columnRender();
    } catch (err) {
      console.error(err);
      Router.push("/dashboard");
    }
    this.prepareHelper();
    setTimeout(() => {
      this.setState({ modalvisible: true });
      if (
        followMeConfig.invoice.enable &&
        this.props.user.organisationUnit == "SELLER" &&
        !isMobile
      ) {
        this.openTour();
      }
    }, 1000);
  }

  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };
  _columnRender = async () => {
    this.setState({ showPage: false });
    const { permisions, t } = this.props;
    var _this = this;
    if (isMobile) {
      this.model = await this.apis.call("model.mget");
    } else {
      this.model = await this.apis.call("model.get");
    }
    this.columnList.setCustomFormat("externalId", {
      className: "dtClickAction dt-body-left",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (!permisions.includes("Invoice-Detail")) {
          return data;
        }
        if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, data.lenght);

          let q = { linearId: row.linearId, ..._this.props.url.query };
          let qq = queryString.stringify(q);
          return `<a href="/invoice-detail?${qq}" data-href="/invoice-detail?${qq}"  className="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
        } else if (isMobile || data.lenght > 20) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, 20);
          let thirdLine = data.substring(20, data.lenght);
          let q = { linearId: row.linearId, ..._this.props.url.query };
          let qq = queryString.stringify(q);
          return `<a href="/invoice-detail?${qq}" data-href="/invoice-detail?${qq}"  className="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
        } else {
          let q = { linearId: row.linearId, ..._this.props.url.query };
          let qq = queryString.stringify(q);
          return `<a href="/invoice-detail?${qq}" data-href="/invoice-detail?${qq}"  className="link list-link">${data}</a>`;
        }
      }
    });
    this.columnList.setCustomFormat("sendToCMS", function(data, type, row) {
      if (type === "sort" || type === "type") {
        return data;
      }
      if (
        row.customisedFields.CMS === undefined ||
        row.customisedFields.CMS === ""
      ) {
        return "No";
      } else {
        return "Yes";
      }
    });
    this.columnList.setCustomFormat("sendToBank", function(data, type, row) {
      if (type === "sort" || type === "type") {
        return data;
      }
      if (
        row.paymentItemLinearId === "" ||
        row.paymentItemLinearId === undefined
      ) {
        return "No";
      } else {
        return "Yes";
      }
    });
    this.columnList.setCustomFormat("invoiceFinancing", function(
      data,
      type,
      row
    ) {
      if (type === "sort" || type === "type") {
        return data;
      }
      if (row.invoiceFinancing == "N") {
        return "No";
      } else {
        return "Yes";
      }
    });
    this.columnList.setCustomFormat("isETaxInvoice", function(data, type, row) {
      if (type === "sort" || type === "type") {
        return data;
      }
      if (row.isETaxInvoice === true) {
        return "Yes";
      } else {
        return "No";
      }
    });
    this.columnList.setCustomFormat("status", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (data == "" || data == undefined) {
          return data;
        }
        return `<strong style="color: ${
          statusColor[row.status]
        };,margin-right: 15px;">${row.status}</strong>`;
      }
    });
    this.columnList.setCustomFormat("dueDate", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (row.dueDate === row.initialDueDate) {
          return "-";
        } else {
          return moment(row.dueDate).format("DD/MM/YYYY");
        }
      }
    });
    for (let i in this.model.table.columns) {
      this.model.table.columns[i].searchKey = this.model.table.columns[
        i
      ].header;
      this.model.table.columns[i].header = await t(
        this.model.table.columns[i].header.replace(/[.]/g, "")
      );
    }

    const columns = this.columnList.initColumns(this.model);
    this.setState({ columnList: columns, model: this.model });
    this.setState({ searchItems: this.model.form.sections[0].fields });
    this.setState({ showPage: true });
  };

  openTour = () => {
    this.setState({ isTourOpen: true });
  };

  closeTour = () => {
    this.setState({ isTourOpen: false });
    this.enableBody($(".reactour__helper--is-open")[0]);
  };

  disableBody = target => disableBodyScroll(target);
  enableBody = target => enableBodyScroll(target);

  onAfterOpen = target => {
    this.disableBody(target);
    setTimeout(() => {
      $(".helperCheckbox").change(function() {
        if ($(this).is(":checked")) {
          window.localStorage.setItem("dontShowHelper", true);
        } else {
          window.localStorage.setItem("dontShowHelper", false);
        }
      });
    }, 200);
  };

  renderTour() {
    return (
      <Tour
        steps={this.state.steps}
        closeWithMask={false}
        disableKeyboardNavigation={!followMeConfig.devVersion}
        disableInteraction={false}
        shadowClass="tour-shadow"
        showMaskNumber={true}
        showNumber={false}
        showCustomCloseButton={false}
        showButtons={false}
        showNavigation={false}
        showDVPanel={true}
        enableArrow={true}
        isOpen={this.state.isTourOpen}
        rounded={5}
        accentColor={accentColor}
        onRequestClose={this.closeTour}
        onAfterOpen={this.disableBody}
        onBeforeClose={this.enableBody}
        scrollDuration={100}
      />
    );
  }

  openHelper = () => {
    this.setState({ isHelperOper: true });
  };

  closeHelper = () => {
    this.setState({ isHelperOper: false });
    this.enableBody($(".reactour__helper--is-open")[0]);
  };

  renderHelper() {
    return (
      <Tour
        steps={this.state.helper}
        closeWithMask={false}
        disableKeyboardNavigation={!followMeConfig.devVersion}
        disableInteraction={false}
        showNavigation={false}
        isOpen={this.state.isHelperOper}
        rounded={5}
        accentColor={accentColor}
        onRequestClose={this.closeHelper}
        onAfterOpen={this.onAfterOpen}
        onBeforeClose={this.enableBody}
        prevButton={<div hidden={true} />}
        nextButton={<div hidden={true} />}
        lastStepNextButton={<div hidden={true} />}
        showNumber={false}
        isCircleMask={true}
      />
    );
  }
  prepareHelper() {
    const _this = this;
    setTimeout(() => {
      if (followMeConfig.helper.enable) {
        const dontShowHelper = window.localStorage.getItem("dontShowHelper");
        const helperVersion = window.localStorage.getItem("helperVersion");
        window.localStorage.setItem(
          "helperVersion",
          followMeConfig.helper.version
        );

        if (dontShowHelper != "true") {
          _this.openHelper();
        } else if (
          followMeConfig.helper.version.localeCompare(helperVersion) != 0
        ) {
          window.localStorage.setItem("dontShowHelper", false);
          _this.openHelper();
        }
      }
    }, 1000);
  }

  buttonPermisions() {
    const { GATitle } = this.state;
    const { permisions, t } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;

    $(".btn-wrap")
      .parent()
      .addClass("px-0");
    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></a>'
    );

    if (permisions.includes("Invoice-Export")) {
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="mx-3 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
    }
    const { ref, purchaseOrderNumber } = this.props.url.query;

    if (ref && ref.split(",")[0] == "po") {
      $(".ExportReporttoExcel,#btn-toggle-export").on("click", function() {
        GA.event({
          category: GATitle,
          action: "Export invoice list (Request)",
          label: moment().format()
        });

        let filterInput = window.localStorage.getItem(
          `searchInput-${_this.state.menukey}-filter`
        );
        if (_this.state.currentDataTableData) {
          let srcQuery = _this.state.currentDataTableData;
          if (purchaseOrderNumber) {
            srcQuery["purchaseOrderNumber"] = purchaseOrderNumber;
          }
          if (filterInput) {
            if (filterInput === "onHold") {
              srcQuery["isOnHold"] = "true";
            }
          }

          // srcQuery["isOnHold"] = "true";
          let exportUrl =
            "/api/invoices/export/" +
            exportFilename +
            ".xlsx?" +
            queryString.stringify(srcQuery);
          $(".ExportReporttoExcel").html('<i class="fa fa-spinner fa-spin" />');
          $(".ExportReporttoExcel").addClass("disabled");
          $(".ExportReporttoExcel").css("cursor", "not-allowed");
          axios({
            url: exportUrl,
            method: "GET",
            responseType: "blob" // important
          })
            .then(response => {
              console.log("DATA Tracking:", response);
              $(".ExportReporttoExcel").html(
                '<i class="icon-additional icon-export" />'
              );
              $(".ExportReporttoExcel").removeClass("disabled");
              $(".ExportReporttoExcel").css("cursor", "pointer");
              saveAs(new Blob([response.data]), exportFilename + ".xlsx");

              GA.event({
                category: GATitle,
                action: "Export invoice list (Success)",
                label: moment().format()
              });
            })
            .catch(function(error) {
              console.log(error);
              $(".ExportReporttoExcel").html(
                '<i class="icon-additional icon-export" />'
              );
              $(".ExportReporttoExcel").removeClass("disabled");
              $(".ExportReporttoExcel").css("cursor", "pointer");
              alert("Couldn't export data at this time. Please try again");
              console.error("Export Error :", error.message);

              GA.event({
                category: GATitle,
                action: "Export invoice list (Failed)",
                label: moment().format()
              });
            });
          return;
        }
      });
    } else {
      if (permisions.includes("Invoice-Upload")) {
        if (this.props.user.organisationUnit == "SELLER") {
          $(".btn-wrap.upload").html(
            `<a class="btn" href="/invoice-dropfile">${t("Upload Invoice")}</a>`
          );
        }
      }
      if (permisions.includes("Invoice-Create")) {
        if (this.props.user.organisationUnit == "SELLER") {
          $(".btn-wrap.create").html(
            `<a class="btn ml-10 linkto createInvoice" href="/create-invoice">${t(
              "Create Invoice"
            )}</a>`
          );
        }
      }
      $(".ExportReporttoExcel").on("click", function() {
        GA.event({
          category: GATitle,
          action: "Export invoice list (Request)",
          label: moment().format()
        });

        if (_this.state.recordsTotal > _this.state.limitExportRecords) {
          _this.setState({
            isAlertModalVisible: true,
            AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
          });

          GA.event({
            category: GATitle,
            action: "Export invoice list (Failed)",
            label: moment().format()
          });
          return;
        }
        if (_this.state.recordsTotal < 1) {
          _this.setState({
            isAlertModalVisible: true,
            AlertModalMessage: `No records for export, please refine your filter.`
          });

          GA.event({
            category: GATitle,
            action: "Export invoice list (Failed)",
            label: moment().format()
          });

          return;
        }

        if (_this.state.currentDataTableData) {
          let srcQuery = _this.state.currentDataTableData;
          if (filterInput) {
            if (filterInput === "onHold") {
              srcQuery["isOnHold"] = "true";
            }
          }
          let exportUrl =
            "/api/invoices/export/" +
            exportFilename +
            ".xlsx?" +
            queryString.stringify(srcQuery);
          $(".ExportReporttoExcel").html('<i class="fa fa-spinner fa-spin" />');
          $(".ExportReporttoExcel").addClass("disabled");
          $(".ExportReporttoExcel").css("cursor", "not-allowed");
          axios({
            url: exportUrl,
            method: "GET",
            responseType: "blob" // important
          })
            .then(response => {
              console.log("DATA Tracking:", response);
              $(".ExportReporttoExcel").html(
                '<i class="icon-additional icon-export" />'
              );
              $(".ExportReporttoExcel").removeClass("disabled");
              $(".ExportReporttoExcel").css("cursor", "pointer");
              saveAs(new Blob([response.data]), exportFilename + ".xlsx");

              GA.event({
                category: GATitle,
                action: "Export invoice list (Success)",
                label: moment().format()
              });
            })
            .catch(function(error) {
              console.log(error);
              $(".ExportReporttoExcel").html(
                '<i class="icon-additional icon-export" />'
              );
              $(".ExportReporttoExcel").removeClass("disabled");
              $(".ExportReporttoExcel").css("cursor", "pointer");
              alert("Couldn't export data at this time. Please try again");
              console.error("Export Error :", error.message);

              GA.event({
                category: GATitle,
                action: "Export invoice list (Failed)",
                label: moment().format()
              });
            });
          return;
        }

        let searchInput = window.localStorage.getItem(
          `searchInput-${_this.state.menukey}`
        );
        let filterInput = window.localStorage.getItem(
          `searchInput-${_this.state.menukey}-filter`
        );
        let filterurl = "";
        if (filterInput) {
          if (filterInput === "onHold") {
            filterurl = "isOnHold=true";
          }
        }
        if (searchInput) {
          searchInput = JSON.parse(searchInput);
          window.open(
            "/api/invoices/export/" +
              exportFilename +
              ".xlsx?" +
              queryString.stringify(searchInput) +
              "&" +
              filterurl
          );
        } else {
          window.open(
            "/api/invoices/export/" + exportFilename + ".xlsx?" + filterurl
          );
        }
      });
    }

    $("a.linkto").on("click", function(e) {
      const anchor = $(this);
      const href = anchor.attr("href");
      e.preventDefault();
      _this.clickLink(href);
    });
  }
  clickLink = href => {
    Router.push(href);
  };
  updateViewing = itemFilter => {
    this.setState({ viewing: itemFilter });
  };

  updateResults = res => {
    this.setState({ recordsTotal: res.recordsTotal });
  };

  componentWillMount() {
    this.setState({
      helper: HELPER_STEP_THAI
    });
    if (this.props.user.organisationUnit == "SELLER") {
      this.setState({
        steps: INVOICE_SELLER_STEPS
      });
    } else {
      this.setState({
        steps: INVOICE_BUYER_STEPS
      });
    }
  }

  buttonTest() {}

  render() {
    const { t } = this.props;
    var _this = this;
    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{t(this.state.title)}</title>
        </Head>

        {this.renderTour()}
        {this.state.showPage ? (
          this.props.user.organisationUnit == "SELLER" ? (
            <List
              {...this.props}
              {...this.state}
              dtClickAction={this.handleClickExternalId}
              dtButton={this.buttonPermisions}
              columnRender={this._columnRender}
              updateResults={this.updateResults}
              _this={this}
              showPage="false"
              showSearchbox="true"
              title={t(this.state.title)}
              lang={lang}
            />
          ) : (
            <NewFilterList
              {...this.props}
              {...this.state}
              dtClickAction={this.handleClickExternalId}
              dtButton={this.buttonPermisions}
              columnRender={this._columnRender}
              updateResults={this.updateResults}
              _this={this}
              showPage="false"
              updateViewing={this.updateViewing}
              title={t(this.state.title)}
              lang={lang}
            />
          )
        ) : (
          <div>Loading...</div>
        )}
        <ModalAlert
          title="Alert"
          visible={this.state.isAlertModalVisible}
          button={[
            {
              label: "Close",
              attribute: {
                className: "btn btn--transparent btn-wide",
                onClick: () => {
                  this.setState({ isAlertModalVisible: false });
                }
              }
            }
          ]}
          isTextOnly={true}
        >
          {this.state.AlertModalMessage}
        </ModalAlert>
      </Layout>
    );
  }
}

export default withAuth(withTranslation(["inv-list"])(invoiceList));
