import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import "datatables.net-fixedheader";
import "datatables.net-buttons";
import List from "../components/List";
import "datatables.net-buttons/js/buttons.html5.min";
import "datatables.net-colreorder";
import "../libs/mycools";
import ColumnList from "../libs/column";
import api from "../libs/api";
import statusColor from "../configs/color.cn.json";
import exportLimit from "../configs/export.limit.json";
import { saveAs } from "file-saver";
import ModalAlert from "../components/modalAlert";
import { isMobile } from "react-device-detect";
import { i18n, withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const axios = require("axios");
const queryString = require("query-string");
const lang = "cn-list";
class CNList extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("cn");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "Credit Note",
      GATitle: "Credit Note",
      menukey: "cn",
      dataTableUrl: this.apis.url("list", {
        role: this.props.user.organisationUnit
      }),
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
  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  async componentDidMount() {
    try {
      var _this = this;
      const { permisions } = this.props;
      if (!permisions.includes("CN-List")) {
        Router.push("/dashboard");
      }

      this._columnRender();
    } catch (err) {
      console.error(err);
      Router.push("/dashboard");
    }
  }

  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };

  _columnRender = async () => {
    this.setState({ showPage: false });
    const { permisions, t } = this.props;
    if (isMobile) {
      this.model = await this.apis.call("model.mget");
    } else {
      this.model = await this.apis.call("model.get");
    }

    this.columnList.setCustomFormat("externalId", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (!permisions.includes("CN-Detail")) {
          return data;
        }

        const link = `/credit-note-detail?linearId=${row.linearId}`;

        if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, data.lenght);

          return `<a href="${link}" data-href="${link}"  className="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
        } else if (isMobile || data.lenght > 20) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, 20);
          let thirdLine = data.substring(20, data.lenght);
          return `<a href="${link}" data-href="${link}"  className="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
        } else {
          return `<a href="${link}" data-href="${link}"  className="link list-link">${data}</a>`;
        }
      }
    });
    this.columnList.setCustomFormat("adjustmentType", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (row.adjustmentType === "Goods Return") {
          return "Quantity Adjustment";
        } else {
          return row.adjustmentType;
        }
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
    this.columnList.setCustomFormat("isETaxCreditNote", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (row.isETaxCreditNote) {
          return "Yes";
        } else {
          return "No";
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
  };

  buttonPermisions() {
    const { GATitle } = this.state;
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;
    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></a>'
    );
    if (permisions.includes("CN-Create")) {
      $(".btn-wrap.create").html(
        '<a class="btn ml-10 linkto" href="/create-credit-note">Create CN</a>'
      );
    }
    if (permisions.includes("CN-Export")) {
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="ml-3 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      $(".ExportReporttoExcel").on("click", function() {
        GA.event({
          category: GATitle,
          action: "Export CN list (Request)",
          label: moment().format()
        });

        if (_this.state.recordsTotal > _this.state.limitExportRecords) {
          _this.setState({
            isAlertModalVisible: true,
            AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
          });

          GA.event({
            category: GATitle,
            action: "Export CN list (Failed)",
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
            action: "Export CN list (Failed)",
            label: moment().format()
          });

          return;
        }

        if ($(this).attr("disabled") == true) {
          return;
        }
        if (_this.state.currentDataTableData) {
          let srcQuery = _this.state.currentDataTableData;

          let exportUrl =
            "/api/cn/export/" +
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
                action: "Export CN list (Success)",
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
                action: "Export CN list (Failed)",
                label: moment().format()
              });
            });
          return;
        }
        let searchInput = window.localStorage.getItem(
          `searchInput-${_this.state.menukey}`
        );
        if (searchInput) {
          searchInput = JSON.parse(searchInput);
          window.open(
            "/api/cn/export/" +
              exportFilename +
              ".xlsx?" +
              queryString.stringify(searchInput)
          );
        } else {
          window.open("/api/cn/export/" + exportFilename + ".xlsx");
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
    function handleClickExternalId(data) {}
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
export default withAuth(withTranslation(["cn-list"])(CNList));
