import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import moment from "moment";
import Layout from "../components/Layout";
import List from "../components/List";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
import "../static/jquery.numberformatter";
import statusColor from "../configs/color.paymentposting.json";
import ModalAlert from "../components/modalAlert";
import exportLimit from "../configs/export.limit.json";
import { saveAs } from "file-saver";
import { isMobile } from "react-device-detect";
import { withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const axios = require("axios");
const queryString = require("query-string");
const scbPaymentStatusSuccessLifecycle = ["PAID"];
const scbPaymentStatusFailedLifecycle = ["DECLINED"];
const paymentPostingStatusSuccessLifecycle = [
  "POSTING_SETTLED",
  "POSTING_CLEARED"
];
const paymentPostingStatusFailedLifecycle = ["POSTING_DECLINED"];
const lang = "payment-list";
class PaymentPosting extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("payment-posting");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "Payment Posting",
      GATitle: "Payment Posting",
      menukey: "ppt",
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
      const { permisions } = this.props;
      if (!permisions.includes("MONITOR-Payment-List")) {
        Router.push("/dashboard");
      }

      this._columnRender(this.model);
    } catch (err) {
      console.error(err);
    }
  }
  handleClickExternalId = (href, a) => {
    Router.push(a.data("href") || href);
  };
  _columnRender = async () => {
    const { t } = this.props;
    try {
      if (isMobile) {
        this.model = await this.apis.call("model.mget");
      } else {
        this.model = await this.apis.call("model.get");
      }
      this.setState({ showPage: false });
      const { permisions } = this.props;
      this.columnList.setCustomFormat("postingStatus", {
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (row.postingStatus === "SUCCESS") {
            return "Success";
          } else if (row.postingStatus === "FAILED") {
            return "Failed";
          }
          return "-";
        }
      });
      this.columnList.setCustomFormat("lifecycleSCB", {
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (scbPaymentStatusSuccessLifecycle.includes(row.lifecycle)) {
            return "Success";
          }
          if (scbPaymentStatusFailedLifecycle.includes(row.lifecycle)) {
            return "Failed";
          }
          return "-";
        }
      });
      this.columnList.setCustomFormat("clearingStatus", {
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (row.clearingStatus == "SUCCESS") {
            return "Cleared";
          }
          return "-";
        }
      });
      this.columnList.setCustomFormat("actualPayment", {
        className: "dtClickAction",
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }

          if (row.paymentAmount && row.paymentFee) {
            let dt = parseFloat(row.paymentAmount) + parseFloat(row.paymentFee);
            return $.formatNumber(parseFloat(dt), { format: "#,###.00" });
          }
        }
      });
      this.columnList.setCustomFormat("customerReference", {
        className: "dtClickAction",
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (data == "" || data == undefined || data == null) {
            data = "N/A";
          }
          if (!permisions.includes("MONITOR-Payment-Detail")) {
            return data;
          }

          if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
            let firstLine = data.substring(0, 10);
            let secondLine = data.substring(8, data.lenght);

            return `<a href="/payment-posting-detail?linearId=${
              row.linearId
            }"  className="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
          } else if (isMobile || data.lenght > 20) {
            let firstLine = data.substring(0, 10);
            let secondLine = data.substring(10, 20);
            let thirdLine = data.substring(20, data.lenght);
            return `<a href="/payment-posting-detail?linearId=${
              row.linearId
            }"  className="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
          } else {
            return `<a href="/payment-posting-detail?linearId=${row.linearId}"  className="link list-link">${data}</a>`;
          }
        }
      });
      for (let i in this.model.table.columns) {
        this.model.table.columns[i].searchKey = this.model.table.columns[
          i
        ].header;
        console.log("searchKey : ", this.model.table.columns[i].searchKey);
        this.model.table.columns[i].header = await t(
          this.model.table.columns[i].header.replace(/[.]/g, "")
        );
      }
      const columns = this.columnList.initColumns(this.model);
      this.setState({ columnList: columns, model: this.model });
      this.setState({ searchItems: this.model.form.sections[0].fields });
      this.setState({ showPage: true });
    } catch (err) {
      alert(err.message);
      Router.push("/dashboard");
    }
  };
  buttonPermisions() {
    const { GATitle } = this.state;
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;

    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></a>'
    );
    if (permisions.includes("MONITOR-Payment-Export")) {
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="ml-10 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      $(".ExportReporttoExcel").on("click", function() {
        GA.event({
          category: GATitle,
          action: "Payment Posting Export list (Request)",
          label: moment().format()
        });

        if (_this.state.recordsTotal > _this.state.limitExportRecords) {
          _this.setState({
            isAlertModalVisible: true,
            AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
          });

          GA.event({
            category: GATitle,
            action: "Payment Posting Export list (Failed)",
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
            action: "Payment Posting Export list (Failed)",
            label: moment().format()
          });

          return;
        }

        if (_this.state.currentDataTableData) {
          let srcQuery = _this.state.currentDataTableData;
          let exportUrl =
            "/api/paymentposting/export/" +
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
                action: "Payment Posting Export list (Success)",
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
                action: "Payment Posting Export list (Failed)",
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
    var _this = this;
    const { t } = this.props;
    console.log("this.state : ", this.state);
    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{this.state.title}</title>
        </Head>
        {this.state.showPage ? (
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

export default withAuth(withTranslation("payment-list")(PaymentPosting));
