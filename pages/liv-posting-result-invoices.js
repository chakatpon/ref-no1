import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import Layout from "../components/Layout";
import List from "../components/List";
import SelectList from "../components/SelectList";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
import ModalAlert from "../components/modalAlert";
import exportLimit from "../configs/export.limit.json";
const queryString = require("query-string");
import { isMobile } from "react-device-detect";
import { saveAs } from "file-saver";
const axios = require("axios");
class livPostingList extends Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("liv-inv");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "LIV Posting Result",
      GATitle: "LIV",
      menukey: "liv",
      viewing: "invoices",
      itemFilter: "invoices",
      dataTableUrl: this.apis.url("list"),
      breadcrumbs: [],
      columnList: [],
      model: [],
      searchItems: [],
      showSearchbox: true,
      modalvisible: false,
      recordsTotal: 0,
      limitExportRecords: exportLimit["limit"],
      isAlertModalVisible: false,

      saveColumnUrl: this.apis.url("model.save")
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
        title: `LIV Lists`,
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
      var _this = this;
      const { permisions } = this.props;
      if (!permisions.includes("MONITOR-LIV-List")) {
        Router.push("/dashboard");
      }

      this._columnRender();
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => {
      this.setState({ modalvisible: true });
    }, 2000);
  }
  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };
  _columnRender = async () => {
    this.setState({ showPage: false });
    const { permisions } = this.props;
    var _this = this;
    if (this.state.viewing === "creditnotes") {
      if (isMobile) {
        this.model = await this.apis.group("liv-cn").call("model.mget");
      } else {
        this.model = await this.apis.group("liv-cn").call("model.get");
      }
    } else {
      if (isMobile) {
        this.model = await this.apis.group("liv-inv").call("model.mget");
      } else {
        this.model = await this.apis.group("liv-inv").call("model.get");
      }
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
        let q = { linearId: row.linearId, ..._this.props.url.query };
        let qq = queryString.stringify(q);
        return `<a href="/invoice-detail?${qq}&ref=liv,${row.linearId}" data-href="/invoice-detail?${qq}&ref=liv,${row.linearId}"  className="link list-link">${data}</a>`;
      }
    });
    this.columnList.setCustomFormat("sendToCMS", function(data, type, row) {
      if (type === "sort" || type === "type") {
        return data;
      }
      if (row.customisedFields.CMS === undefined) {
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
    const columns = this.columnList.initColumns(this.model);
    this.setState({ columnList: columns, model: this.model });
    this.setState({ searchItems: this.model.form.sections[0].fields });
    this.setState({ showPage: true });
  };
  buttonPermisions() {
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;
    // $(".btn-wrap.filter").html(
    //   `Filter : <a href="#" class="link filter-link active">All</a> | <a href="#" class="link filter-link">On Hold</a>`
    // );
    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></a>'
    );

    if (permisions.includes("MONITOR-LIV-Export")) {
      $(".btn-wrap.export").html(
        '<a class="ml-10 ExportReporttoExcel" href="javascript:;"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      const { ref, purchaseOrderNumber } = this.props.url.query;

      if (ref && ref.split(",")[0] == "po") {
        $(".ExportReporttoExcel").on("click", function() {
          if (_this.state.recordsTotal > _this.state.limitExportRecords) {
            _this.setState({
              isAlertModalVisible: true,
              AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
            });
            return;
          }
          if (_this.state.recordsTotal < 1) {
            _this.setState({
              isAlertModalVisible: true,
              AlertModalMessage: `No records for export, please refine your filter.`
            });
            return;
          }

          if (_this.state.currentDataTableData) {
            let srcQuery = _this.state.currentDataTableData;
            srcQuery["purchaseOrderNumber"] = purchaseOrderNumber;
            let exportUrl =
              "/api/liv/invoices/export/" +
              exportFilename +
              ".xlsx?" +
              queryString.stringify(srcQuery);
            $(".ExportReporttoExcel").html(
              '<i class="fa fa-spinner fa-spin" />'
            );
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
              })
              .catch(function(error) {
                $(".ExportReporttoExcel").html(
                  '<i class="icon-additional icon-export" />'
                );
                $(".ExportReporttoExcel").removeClass("disabled");
                $(".ExportReporttoExcel").css("cursor", "pointer");
                alert("Couldn't export data at this time. Please try again");
                console.error("Export Error :", error.message);
              });
            return;
          }
        });
      } else {
        $(".ExportReporttoExcel").on("click", function() {
          if (_this.state.recordsTotal > _this.state.limitExportRecords) {
            _this.setState({
              isAlertModalVisible: true,
              AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
            });
            return;
          }
          if (_this.state.recordsTotal < 1) {
            _this.setState({
              isAlertModalVisible: true,
              AlertModalMessage: `No records for export, please refine your filter.`
            });
            return;
          }
          if (_this.state.currentDataTableData) {
            let srcQuery = _this.state.currentDataTableData;
            let exportUrl =
              "/api/liv/invoices/export/" +
              exportFilename +
              ".xlsx?" +
              queryString.stringify(srcQuery);
            $(".ExportReporttoExcel").html(
              '<i class="fa fa-spinner fa-spin" /> Exporting'
            );
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
              })
              .catch(function(error) {
                $(".ExportReporttoExcel").html(
                  '<i class="icon-additional icon-export" />'
                );
                $(".ExportReporttoExcel").removeClass("disabled");
                $(".ExportReporttoExcel").css("cursor", "pointer");
                alert("Couldn't export data at this time. Please try again");
                console.error("Export Error :", error.message);
              });
            return;
          }
        });
      }
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
  updateViewing = async itemFilter => {
    Router.push("/liv-posting-result-" + itemFilter);
  };
  componentWillUnmount() {
    this.state = [];
  }
  updateResults = res => {
    this.setState({ recordsTotal: res.recordsTotal });
  };

  render() {
    var _this = this;
    function handleClickExternalId(data) {}
    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{this.state.title}</title>
        </Head>
        {this.state.showPage ? (
          <SelectList
            {...this.props}
            {...this.state}
            dtClickAction={this.handleClickExternalId}
            dtButton={this.buttonPermisions}
            columnRender={this._columnRender}
            updateResults={this.updateResults}
            _this={this}
            showPage="false"
            updateViewing={this.updateViewing}
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

export default withAuth(livPostingList);
