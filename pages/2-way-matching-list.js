import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import moment from "moment";
import Layout from "../components/Layout";
import List from "../components/List";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
import statusColor from "../configs/color.2wm.json";
import exportLimit from "../configs/export.limit.json";
const queryString = require("query-string");
import { saveAs } from "file-saver";
import { i18n, withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const axios = require("axios");
import ModalAlert from "../components/modalAlert";
import { isMobile } from "react-device-detect";

const lang = "2way-list";
class TwoWayMatchingLists extends Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("twoWayMatching");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "2 Way Matching",
      GATitle: "2WM",
      menukey: "2wm",
      dataTableUrl: this.apis.url("uilist"),
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

  updateResults = res => {
    this.setState({ recordsTotal: res.recordsTotal });
  };

  async componentDidMount() {
    try {
      var _this = this;
      const { permisions } = this.props;
      if (!permisions.includes("2WM-List")) {
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
    try {
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
          if (data == "" || data == undefined) {
            return data;
          }
          if (!permisions.includes("2WM-Detail")) {
            return data;
          }

          if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
            let firstLine = data.substring(0, 10);
            let secondLine = data.substring(10, data.lenght);

            return `<a href="/2-way-matching-detail?linearId=${
              row.linearId
            }" data-href="/2-way-matching-detail?linearId=${
              row.linearId
            }"  className="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
          } else if (isMobile || data.lenght > 20) {
            let firstLine = data.substring(0, 10);
            let secondLine = data.substring(10, 20);
            let thirdLine = data.substring(20, data.lenght);
            return `<a href="/2-way-matching-detail?linearId=${
              row.linearId
            }" data-href="/2-way-matching-detail?linearId=${
              row.linearId
            }"  className="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
          } else {
            return `<a href="/2-way-matching-detail?linearId=${row.linearId}" data-href="/2-way-matching-detail?linearId=${row.linearId}"  className="link list-link">${data}</a>`;
          }
        }
      });

      this.columnList.setCustomFormat("matchingStatus", {
        className: "dtClickAction",
        render: function(data, type, row) {
          if (type === "sort" || type === "type") {
            return data;
          }
          if (data == "" || data == undefined) {
            return data;
          }
          return `<strong style="color: ${
            statusColor[row.matchingStatus]
          };,margin-right: 15px;">${row.matchingStatus}</strong>`;
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
      '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></a>'
    );
    if (permisions.includes("2WM-Export")) {
      $(".btn-wrap.export").html(
        '<a class="ml-10 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      $(".ExportReporttoExcel").on("click", function() {
        GA.event({
          category: GATitle,
          action: "2WM Export list (Request)",
          label: moment().format()
        });

        if (_this.state.recordsTotal > _this.state.limitExportRecords) {
          _this.setState({
            isAlertModalVisible: true,
            AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
          });

          GA.event({
            category: GATitle,
            action: "2WM Export list (Failed)",
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
            action: "2WM Export list (Failed)",
            label: moment().format()
          });

          return;
        }

        if (_this.state.currentDataTableData) {
          let srcQuery = _this.state.currentDataTableData;
          let exportUrl =
            "/api/2wm/export/" +
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
                action: "2WM Export list (Success)",
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
                action: "2WM Export list (Failed)",
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

export default withAuth(withTranslation(["2way-list"])(TwoWayMatchingLists));
