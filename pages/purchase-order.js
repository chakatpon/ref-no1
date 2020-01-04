import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import Layout from "../components/Layout";
import List from "../components/List";
import withAuth from "../libs/withAuth";
import moment from "moment";
import api from "../libs/api";
import ColumnList from "../libs/column";
import "../static/jquery.numberformatter";
import statusColor from "../configs/color.po.json";
import exportLimit from "../configs/export.limit.json";
import { saveAs } from "file-saver";
import ModalAlert from "../components/modalAlert";
import { isMobile } from "react-device-detect";
import { i18n, withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const queryString = require("query-string");
const axios = require("axios");
const lang = "po-list";
class POList extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("po");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "Purchase Order",
      GATitle: "Purchase Order",
      menukey: "po",
      dataTableUrl: this.apis.url("list"),
      breadcrumb: [],
      columnList: [],
      model: [],
      searchItems: [],
      saveColumnUrl: this.apis.url("model.save"),
      recordsTotal: 0,
      limitExportRecords: exportLimit["limit"],
      isAlertModalVisible: false
    };
  }

  async componentDidMount() {
    try {
      var _this = this;
      const { permisions, t } = this.props;
      if (!permisions.includes("PO-List")) {
        Router.push("/dashboard");
      }

      this._columnRender();
    } catch (err) {
      console.error(err);
    }
  }
  handleClickExternalId = (href, a) => {
    Router.push(a.data("href") || href);
  };
  _columnRender = async () => {
    const { t } = this.props;
    if (isMobile) {
      this.model = await this.apis.call("model.mget");
    } else {
      this.model = await this.apis.call("model.get");
    }

    this.setState({ showPage: false });
    const { permisions } = this.props;
    this.columnList.setCustomFormat("purchaseOrderNumber", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (!permisions.includes("PO-Detail")) {
          return data;
        }

        const link = `/purchase-order-detail?linearId=${row.linearId}`;

        if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, data.lenght);

          return `<a href="${link}"  className="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
        } else if (isMobile || data.lenght > 20) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, 20);
          let thirdLine = data.substring(20, data.lenght);
          return `<a href="${link}"  className="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
        } else {
          return `<a href="${link}"  className="link list-link">${data}</a>`;
        }
      }
    });
    this.columnList.setCustomFormat("companyName", {
      className: "dt-body-left",
      render: function(data, type, row) {
        return data;
      }
    });
    this.columnList.setCustomFormat("vendorName", {
      className: "dt-body-left",
      render: function(data, type, row) {
        return data;
      }
    });
    this.columnList.setCustomFormat("poAmount", {
      className: "dt-body-right",
      render: function(data, type, row) {
        data =
          parseFloat(row.initialTotal.quantity) *
          parseFloat(row.initialTotal.displayTokenSize);
        return $.formatNumber(data, { format: "#,##0.00" });
      }
    });
    this.columnList.setCustomFormat("poRemainingAmount", {
      className: "dt-body-right",
      render: function(data, type, row) {
        data =
          parseFloat(row.remainingTotal.quantity) *
          parseFloat(row.remainingTotal.displayTokenSize);
        return $.formatNumber(data, { format: "#,##0.00" });
      }
    });
    this.columnList.setCustomFormat("paymentTermDays", {
      render: function(data, type, row) {
        return data.toString();
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

  buttonPermisions() {
    const { GATitle } = this.state;
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;

    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></button>'
    );
    if (permisions.includes("PO-Export")) {
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="ml-3 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      $(".ExportReporttoExcel").on("click", function() {
        GA.event({
          category: GATitle,
          action: "Export PO list (Request)",
          label: moment().format()
        });

        if (_this.state.recordsTotal > _this.state.limitExportRecords) {
          _this.setState({
            isAlertModalVisible: true,
            AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
          });

          GA.event({
            category: GATitle,
            action: "Export PO list (Failed)",
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
            action: "Export PO list (Failed)",
            label: moment().format()
          });

          return;
        }

        if (_this.state.currentDataTableData) {
          let srcQuery = _this.state.currentDataTableData;
          let exportUrl =
            "/api/po/export/" +
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
              $(".ExportReporttoExcel").html(
                '<i class="icon-additional icon-export" />'
              );
              $(".ExportReporttoExcel").removeClass("disabled");
              $(".ExportReporttoExcel").css("cursor", "pointer");
              saveAs(new Blob([response.data]), exportFilename + ".xlsx");

              GA.event({
                category: GATitle,
                action: "Export PO list (Success)",
                label: moment().format()
              });
            })
            .catch(function(error) {
              $(".ExportReporttoExcel").html(
                '<i class="icon-additional icon-export" />'
              );
              $(".ExportReporttoExcel").removeClass("disabled");
              $(".ExportReporttoExcel").css("cursor", "pointer");
              alert("Couldn't export data at this time. Please try again");
              console.error("Export Error :", error.message);

              GA.event({
                category: GATitle,
                action: "Export PO list (Failed)",
                label: moment().format()
              });
            });
          return;
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

  updateResults = res => {
    this.setState({ recordsTotal: res.recordsTotal });
  };
  render() {
    const { t } = this.props;
    var _this = this;
    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{t(this.state.title)}</title>
        </Head>
        {this.state.showPage ? (
          <List
            {...this.props}
            {...this.state}
            title={t(this.state.title)}
            dtClickAction={this.handleClickExternalId}
            dtButton={this.buttonPermisions}
            columnRender={this._columnRender}
            updateResults={this.updateResults}
            _this={this}
            showPage="false"
            showSearchbox="true"
            lang={lang}
          />
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

export default withAuth(
  withTranslation(["po-list", "po-detail", "detail"])(POList)
);
