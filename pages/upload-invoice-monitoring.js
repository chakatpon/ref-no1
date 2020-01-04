import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import Layout from "../components/Layout";
import List from "../components/List";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
// import ModalAlert from "../components/modalAlert";
import ApiService from "../libs/ApiService";
const ApiServices = new ApiService();
const queryString = require("query-string");
import { withTranslation } from "~/i18n";

class uploadInvoiceList extends Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("monitoring");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "Upload Invoice Monitoring",
      GATitle: "Upload Invoice Monitoring",
      menukey: "invmon",
      dataTableUrl: this.apis.url("dt"),
      breadcrumbs: [],
      columnList: [],
      model: [],
      searchItems: [],
      showSearchbox: true,
      modalvisible: false,

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
      var _this = this;
      const { permisions } = this.props;
      if (!permisions.includes("Invoice-List")) {
        Router.push("/dashboard");
      }

      this._columnRender();
    } catch (err) {
      console.error(err);
      //Router.push("/dashboard");
    }
    setTimeout(() => {
      this.setState({ modalvisible: true });
    }, 2000);
  }
  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };
  _columnRender = async () => {
    const { t } = this.props;
    var _this = this;

    this.setState({ showPage: false });

    this.model = await this.apis.call("model.get");
    this.columnList.setCustomFormat("source", { className: "dt-body-center" });
    this.columnList.setCustomFormat("totalRecords", {
      className: "dt-body-center"
    });
    this.columnList.setCustomFormat("status", { className: "dt-body-center" });
    this.columnList.setCustomFormat("uploadedDate", {
      className: "dt-body-center",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        return moment(row.uploadedDate).format("DD/MM/YYYY");
      }
    });
    this.columnList.setCustomFormat("uploadedBy", {
      className: "dt-body-center"
    });
    this.columnList.setCustomFormat("fileName", {
      className: "dtClickAction dt-body-left",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        let q = {
          fileName: row.fileName,
          vendorTaxNumber: row.vendorTaxNumber,
          createDate: row.uploadedDate,
          ..._this.props.url.query
        };
        let qq = queryString.stringify(q);
        return `<a href="/upload-invoice-file?${qq}" data-href="/upload-invoice-file?${qq}"  class="link list-link">${data}</a>`;
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
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;
    // $(".btn-wrap.filter").html(
    //   `Filter : <a href="#" class="link filter-link active">All</a> | <a href="#" class="link filter-link">On Hold</a>`
    // );
    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></a>'
    );

    if (permisions.includes("Invoice-Export")) {
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="ml-3 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      const { ref, purchaseOrderNumber } = this.props.url.query;

      if (ref && ref.split(",")[0] == "po") {
        $(".ExportReporttoExcel").on("click", function() {
          let searchInput = { purchaseOrderNumber };
          window.open(
            "/api/invoicesmonitoring/export/" +
              exportFilename +
              ".xlsx?" +
              queryString.stringify(searchInput)
          );
        });
      } else {
        if (permisions.includes("Invoice-Upload")) {
          if (this.props.user.organisationUnit == "SELLER") {
            $(".btn-wrap.upload").html(
              '<a class="btn ml-10 linkto" href="/invoice-dropfile">Upload Invoice</a>'
            );
          }
        }
        $(".ExportReporttoExcel").on("click", function() {
          let searchInput = window.localStorage.getItem(
            `searchInput-${_this.state.menukey}`
          );
          if (searchInput) {
            searchInput = JSON.parse(searchInput);
            window.open(
              "/api/invoicesmonitoring/export/" +
                exportFilename +
                ".xlsx?" +
                queryString.stringify(searchInput)
            );
          } else {
            window.open(
              "/api/invoicesmonitoring/export/" + exportFilename + ".xlsx"
            );
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

  render() {
    const { t } = this.props;
    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{t(this.state.title)}</title>
        </Head>
        {this.state.showPage ? (
          <List
            {...this.props}
            {...this.state}
            dtClickAction={this.handleClickExternalId}
            dtButton={this.buttonPermisions}
            columnRender={this._columnRender}
            _this={this}
            showPage="false"
            title={t(this.state.title)}
          />
        ) : (
          <div>Loading...</div>
        )}
      </Layout>
    );
  }
}

export default withAuth(
  withTranslation(["upload-invoice-monitoring"])(uploadInvoiceList)
);
