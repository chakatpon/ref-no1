import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import Layout from "../components/Layout";
import List from "../components/ListFile";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
import { withTranslation } from "~/i18n";

import Popover, { ArrowContainer } from "react-tiny-popover";
// import ModalAlert from "../components/modalAlert";
const queryString = require("query-string");
const lang = "invoice-upload";
class uploadInvoiceFile extends Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("uploadinvoicefile");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    const {
      ref,
      purchaseOrderNumber,
      fileName,
      vendorTaxNumber,
      createDate
    } = this.props.url.query;
    this.state = {
      title: "Upload Invoice File",
      GATitle: "Upload Invoice File",
      menukey: "invfile",
      dataTableUrl: this.apis.url("list", {
        fileName,
        vendorTaxNumber,
        createdDate: createDate
      }),
      breadcrumbs: [],
      columnList: [],
      model: [],
      searchItems: [],
      showSearchbox: false,
      modalvisible: false,
      resultTitle: "",
      isPopoverOpen: false,
      saveColumnUrl: this.apis.url("model.save"),
      data: [],
      autocompleteText: ""
    };

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

  async componentWillMount() {
    const {
      ref,
      purchaseOrderNumber,
      fileName,
      vendorTaxNumber,
      createDate
    } = this.props.url.query;
    const res = await this.apis.call("list", {
      fileName,
      vendorTaxNumber,
      createdDate: createDate,
      page: 1,
      pageSize: 10
    });

    this.setState({
      data: res.data
    });
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

    this.setState({ showPage: false });
    this.model = await this.apis.call("model.get");
    this.model = await this.apis.call("model.get");
    this.columnList.setCustomFormat("invoiceNumber", {
      className: "dt-body-center"
    });
    this.columnList.setCustomFormat("invoiceItemNumber", {
      className: "dt-body-center"
    });
    this.columnList.setCustomFormat("invoiceCurrency", {
      className: "dt-body-center"
    });
    this.columnList.setCustomFormat("invoiceTotal", {
      className: "dt-body-center"
    });
    this.columnList.setCustomFormat("status", { className: "dt-body-center" });
    this.columnList.setCustomFormat("invoiceDate", {
      className: "dt-body-center",
      render: function(row) {
        return moment(row.uploadedDate).format("DD/MM/YYYY");
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
    const { permisions, t } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;
    if (permisions.includes("Invoice-Export")) {
      $(".btn-wrap.filter").html(
        `

<div class="form-label-group append-icon" 
id="div-search"
>
<i class="fa fa-search search-icon-file lightgray" />
<i id="cancel-search" class="icon icon-x icon-prepend purple icon-search-cancel" ></i>
<input
  type="text"
  id="invoice_no"
  placeholder="Invoice No."
  class="form-control"
  required
/>
<label for="invoice_no">${t("Invoice No")}</label>
</div>
`
      );
      const _this = this;

      $(window).click(function() {
        //Hide the menus if visible
        _this.setState({
          isPopoverOpen: false
        });
      });

      $("#invoice_no").click(e => {
        e.stopPropagation();
        _this.togglePopover();
      });
      $("#invoice_no").keyup(() => {
        _this.setState({
          autocompleteText: $("#invoice_no").val()
        });
      });

      $("#menucontainer").click(function(event) {});
      $("#cancel-search").click(() => {
        _this.cancelSearch();
      });
      $(".btn-wrap.export")
        .addClass("d-inline-flex")
        .addClass("align-items-center");
      $(".btn-wrap.export").html(
        `
        <a class="ml-10 ExportReporttoExcel" href="javascript:;"><i class="icon-additional icon-export"></i></a>
        `
      );
      $(".btn-toggle-export").css("display", "inline-block");
      const { ref, purchaseOrderNumber } = this.props.url.query;

      if (ref && ref.split(",")[0] == "po") {
        $(".ExportReporttoExcel").on("click", function() {
          let searchInput = { purchaseOrderNumber };
          window.open(
            "/api/invoicefiles/export/" +
              exportFilename +
              ".xlsx?" +
              queryString.stringify(searchInput)
          );
        });
      } else {
        $(".ExportReporttoExcel").on("click", function() {
          let searchInput = window.localStorage.getItem(
            `searchInput-${_this.state.menukey}`
          );
          const {
            ref,
            purchaseOrderNumber,
            fileName,
            vendorTaxNumber,
            createDate: createdDate
          } = _this.props.url.query;
          if (searchInput) {
            searchInput = JSON.parse(searchInput);
            searchInput = [
              ...searchInput,
              {
                purchaseOrderNumber,
                fileName,
                vendorTaxNumber,
                createdDate
              }
            ];
            window.open(
              "/api/invoicefiles/export/" +
                exportFilename +
                ".xlsx?" +
                queryString.stringify(searchInput)
            );
          } else {
            searchInput = {
              purchaseOrderNumber,
              fileName,
              vendorTaxNumber,
              createdDate
            };
            window.open(
              "/api/invoicefiles/export/" +
                exportFilename +
                ".xlsx?" +
                queryString.stringify(searchInput)
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

  togglePopover = () => {
    this.setState({ isPopoverOpen: !this.state.isPopoverOpen });
  };

  cancelSearch = () => {
    const {
      ref,
      purchaseOrderNumber,
      fileName,
      vendorTaxNumber,
      createDate
    } = this.props.url.query;
    this.setState({
      dataTableUrl: this.apis.url("list", {
        fileName,
        vendorTaxNumber,
        createdDate: createDate
      })
    });
    this.togglePopover();
  };

  filterList = invoiceNumber => {
    const {
      ref,
      purchaseOrderNumber,
      fileName,
      vendorTaxNumber,
      createDate
    } = this.props.url.query;

    this.setState({
      dataTableUrl: this.apis.url("list", {
        fileName,
        vendorTaxNumber,
        createdDate: createDate,
        invoiceNumber
      })
    });
  };

  render() {
    const { t } = this.props;
    let breadcrumbs = [];

    breadcrumbs.push({
      title: t("Upload Invoice Monitoring"),
      url: "/upload-invoice-monitoring"
    });
    breadcrumbs.push({
      title: this.props.url.query.fileName,
      active: true
    });

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
            breadcrumbs={breadcrumbs}
            _this={this}
            showPage="false"
            lang={lang}
            title={t(this.state.title)}
          />
        ) : (
          <div>Loading...</div>
        )}

        <Popover
          isOpen={this.state.isPopoverOpen}
          position={"bottom"} // preferred position
          contentLocation={({
            targetRect,
            popoverRect,
            position,
            align,
            nudgedLeft,
            nudgedTop
          }) => {
            const offset = $("#invoice_no").offset();
            return {
              left: offset.left,
              top: offset.top + 46
            };
          }}
          disableReposition
          // onClickOutside={this.togglePopover}
          align={"end"}
          content={({ position, targetRect, popoverRect }) => (
            <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
              position={position}
              targetRect={targetRect}
              popoverRect={popoverRect}
              arrowColor={"white"}
              arrowSize={10}
              arrowStyle={{ left: "20.578px", top: "0px" }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  boxShadow: "0px 0px 20px gray",
                  paddingTop: "10px",
                  paddingBottom: "10px"
                }}
              >
                {this.state.data
                  .filter(item => {
                    return item.invoiceNumber
                      .toLowerCase()
                      .startsWith(this.state.autocompleteText.toLowerCase());
                  })
                  .map((item, i) => {
                    return (
                      <div
                        className="search-invoice-file-item"
                        onClick={() => this.filterList(item.invoiceNumber)}
                        key={i}
                      >
                        {item.invoiceNumber}
                      </div>
                    );
                  })}
              </div>
            </ArrowContainer>
          )}
        >
          <div />
        </Popover>
      </Layout>
    );
  }
}

export default withAuth(withTranslation(["invoice-upload"])(uploadInvoiceFile));
