import React, { Component } from "react";
import ReactNotification from "react-notifications-component";
import Head from "next/head";
import Router from "next/router";
import moment from "moment";
import Layout from "../components/Layout";
import List from "../components/List";
import CustomList from "../components/CustomList";
import withAuth from "../libs/withAuth";
import exportLimit from "../configs/export.limit.json";
import ColumnList from "../libs/column";
import ModalAlert from "../components/modalAlert";
import { resolve } from "path";
import { SocketProvider } from "socket.io-react";
import io from "socket.io-client";
import { saveAs } from "file-saver";
import { DOA_AUTH } from "~/configs/authorise.config";
import StandardService from "~/services/StandardService";
import OffchainService from "~/services/OffchainService";
const queryString = require("query-string");
const axios = require("axios");
import { isMobile, MobileView, BrowserView } from "react-device-detect";
import api from "../libs/api";
import { i18n, withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const lang = "doa-list";
class waitingDOAList extends Component {
  constructor(props) {
    super(props);

    this.standardService = new StandardService();
    this.offchainService = new OffchainService();
    this.apis = new api(this.props.domain).group("doa");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.addNotification = this.addNotification.bind(this);
    this.notificationDOMRef = React.createRef();
    this.state = {
      title: isMobile ? "Waiting DOA" : "Waiting DOA Approval",
      GATitle: "DOA",
      menukey: "doa",
      dataTableUrl: this.standardService.getUrl({
        group: "pendingApprovalDocument",
        action: "queryApproval"
      }),
      breadcrumbs: [],
      columnList: [],
      model: [],
      searchItems: [],
      showSearchbox: true,
      modalvisible: false,
      selectedIds: [],
      selectedCheckboxIds: [],
      successIds: [],
      successCheckboxIds: [],
      recordsTotal: 0,
      limitExportRecords: exportLimit["limit"],
      isAlertModalVisible: false,

      saveColumnUrl: this.offchainService.getUrl({
        group: "model",
        action: "doaSaveModel"
      })
    };
  }

  async componentDidMount() {
    var _this = this;
    const { GATitle } = this.state;
    const { token: accessToken } = this.props;

    try {
      const { permisions, t } = this.props;

      if (!permisions.includes(DOA_AUTH.VIEW)) {
        Router.push("/dashboard");
      }
      this.socket = io.connect("/doa");
      this.socket
        .on("connect", function() {
          console.log("connect");
        })
        .on("queue", function(queue) {
          queue.map(q => {
            console.log("q", q);
          });
        });
      this.socket.on("queue", function(queueArray) {
        GA.event({
          category: GATitle,
          action: "Delegate of Authorise Approve list (Request)",
          label: moment().format()
        });

        queueArray.map(queue => {
          $(
            `.dt-checkboxes-cell[id=${queue.linearId}] input[type=checkbox]`
          ).hide();
          $(`.dt-checkboxes-cell[id=${queue.linearId}]`)
            .closest("tr")
            .find("td.dtClickAction")
            .each(function() {
              $(this)
                .find("a")
                .hide();
              $(this)
                .find(".mocklink")
                .remove();
              $(this).append(
                '<span class="mocklink">' + $(this).text() + "</span>"
              );
            });
          $(
            `.dt-checkboxes-cell[id=${queue.linearId}] img.linearLoading`
          ).remove();
          $(
            `.dt-checkboxes-cell[id=${queue.linearId}] .linearSuccess`
          ).remove();
          $(`.dt-checkboxes-cell[id=${queue.linearId}]`).append(
            '<img src="../static/img/ajax-loader.gif" class="linearLoading" style="object-fit:fill;" />'
          );
        });
      });
      this.socket.on("success", function(response, processItem) {
        $(
          `.dt-checkboxes-cell[id=${processItem.linearId}] .linearLoading`
        ).remove();
        $(
          `.dt-checkboxes-cell[id=${processItem.linearId}] .linearSuccess`
        ).remove();
        $(`.dt-checkboxes-cell[id=${processItem.linearId}]`).append(
          "<i class='fa fa-check purple linearSuccess' aria-hidden='true'></i>"
        );
        $(`.dt-checkboxes-cell[id=${processItem.linearId}]`).prop(
          "disabled",
          true
        );
        $(`.dt-checkboxes-cell[id=${processItem.linearId}]`)
          .parent()
          .removeClass("rowSelected");
        $(`.dt-checkboxes-cell[id=${processItem.linearId}]`)
          .closest("tr")
          .find("td.dtClickAction")
          .each(function() {
            // $(this).text($(this).text())
          });
        if (processItem.accessToken === accessToken) {
          _this.addNotification(
            "approvesuccess",
            `DOA Approval for ${response.data[0].externalId} completed.`
          );

          GA.event({
            category: GATitle,
            action: "Delegate of Authorise Approve list (Success)",
            label: `${GATitle} | ${
              response.data[0].externalId
            } | ${moment().format()}`
          });
        }
        $(`#btnApprove`).addClass("disabled");
        let successIds = _this.state.successIds;
        successIds.push(response.data[0].linearId);
        let successCheckboxIds = _this.state.successCheckboxIds;
        successCheckboxIds.push(processItem.checkboxId);
        _this.setState({
          selectedIds: [],
          selectedCheckboxIds: [],
          successIds,
          successCheckboxIds
        });
      });
      this.socket.on("error", function(response, errorItem) {
        console.log("error response", response);
        let errorDetail = "";
        if (
          response.error == "api_error" &&
          typeof response.error_message == "object"
        ) {
          errorDetail = response.error_message.message || "";
        }
        const externalIdText = $(
          `.dt-checkboxes-cell[id=${errorItem.linearId}]`
        )
          .next()
          .text();

        $(`.dt-checkboxes-cell[id=${errorItem.linearId}]`)
          .closest("tr")
          .find("td.dtClickAction")
          .each(function() {
            $(this)
              .find("a")
              .show();
            $(this)
              .find(".mocklink")
              .remove();
          });
        $(`.dt-checkboxes-cell[id=${errorItem.linearId}] img`).remove();
        $(
          `.dt-checkboxes-cell[id=${errorItem.linearId}] input[type=checkbox]`
        ).show();
        if (errorItem.accessToken === accessToken) {
          _this.addNotification(
            "approvefailed",
            `DOA Approval for ${externalIdText} failed. ${errorDetail}`
          );

          GA.event({
            category: GATitle,
            action: "Delegate of Authorise Approve list (Failed)",
            label: `${GATitle} | ${externalIdText} | ${moment().format()}`
          });
        }
      });

      this._columnRender();
    } catch (err) {
      console.error(err);
      //Router.push("/dashboard");
    }
  }
  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };
  _columnRender = async () => {
    const { t } = this.props;
    this.setState({ showPage: false });
    const { permisions } = this.props;
    var _this = this;

    this.columnList.setCustomFormat("documentNumber", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (!permisions.includes("DOA-Detail")) {
          return data;
        }

        let param = queryString.stringify({
          linearId: row.linearId,
          ..._this.props.url.query
        });

        let url = "";
        if (!!row.documentType && row.documentType == "INVOICE") {
          url = `waiting-doa-approval-detail?${param}`;
        } else {
          url = `debit-note-detail?${param}&page_pre=doa`;
        }

        if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, data.lenght);
          return `<a href="/${url}" data-href="/${url}"  class="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
        } else if (isMobile || data.lenght > 20) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, 20);
          let thirdLine = data.substring(20, data.lenght);
          return `<a href="/${url}" data-href="/${url}"  class="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
        } else {
          return `<a href="/${url}" data-href="/${url}"  class="link list-link">${data}</a>`;
        }
      }
    });

    this.columnList.setCustomFormat("documentType", function(data, type, row) {
      let documentType = "";

      switch (data) {
        case "INVOICE":
          documentType = "Invoice";
          break;
        case "DEBIT_NOTE":
          documentType = "Debit Note";
          break;
        default:
          documentType = "";
      }
      return documentType;
    });
    this.columnList.setCustomFormat("financing", function(data, type, row) {
      let financing = "No";

      if (data == "Y") {
        financing = "Yes";
      }

      return financing;
    });
    let model = {};

    if (isMobile) {
      const data = await this.apis.call("model.mget");
      model = {
        data: data,
        message: "",
        status: true
      };
      await console.log("--- IT'S MOBILE MODEL ---", model);
    } else {
      model = await this.offchainService.callApi({
        group: "model",
        action: "doaGetModel"
      });
    }
    const modelA = await this.offchainService.callApi({
      group: "model",
      action: "doaGetModel"
    });

    console.log("--- MODEL A ---", modelA);
    if (model.status) {
      const columns = this.columnList.initColumns(model.data);

      this.setState({ columnList: columns, model: model.data });
      this.setState({ searchItems: model.data.form.sections[0].fields });
      this.setState({ showPage: true });
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

    if (permisions.includes("DOA-Export")) {
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="ml-3 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      const { ref, purchaseOrderNumber } = this.props.url.query;

      if (ref && ref.split(",")[0] == "po") {
        $(".ExportReporttoExcel").on("click", function() {
          GA.event({
            category: GATitle,
            action: "Export Delegate of Authorise list (Request)",
            label: moment().format()
          });

          if (_this.state.recordsTotal > _this.state.limitExportRecords) {
            _this.setState({
              isAlertModalVisible: true,
              AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
            });

            GA.event({
              category: GATitle,
              action: "Export Delegate of Authorise list (Failed)",
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
              action: "Export Delegate of Authorise list (Failed)",
              label: moment().format()
            });

            return;
          }

          if (_this.state.currentDataTableData) {
            let srcQuery = _this.state.currentDataTableData;
            srcQuery = { ...srcQuery, purchaseOrderNumber };
            let exportUrl =
              "/api/doa/export/" +
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

                GA.event({
                  category: GATitle,
                  action: "Export Delegate of Authorise list (Success)",
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
                  action: "Export Delegate of Authorise list (Failed)",
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
              '<a class="btn" href="javascript:;">Upload Invoice</a>'
            );
          }
        }
        if (permisions.includes("Invoice-Create")) {
          if (this.props.user.organisationUnit == "SELLER") {
            $(".btn-wrap.create").html(
              '<a class="btn ml-10 linkto" href="/create-invoice">Create Invoice</a>'
            );
          }
        }
        $(".ExportReporttoExcel").on("click", function() {
          if (_this.state.currentDataTableData) {
            let srcQuery = _this.state.currentDataTableData;
            let exportUrl =
              "/api/doa/export/" +
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

                GA.event({
                  category: GATitle,
                  action: "Export Delegate of Authorise list (Success)",
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
                  action: "Export Delegate of Authorise list (Failed)",
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
            if (filterInput === "matched") {
              filterurl = "&isMatched=true";
            } else if (filterInput === "unmatched") {
              filterurl = "&isMatched=false";
            }
          }

          if (searchInput) {
            searchInput = JSON.parse(searchInput);
            window.open(
              "/api/doa/export/" +
                exportFilename +
                ".xlsx?" +
                queryString.stringify(searchInput) +
                "&currentAuthority=true" +
                filterurl
            );
          } else {
            window.open(
              "/api/doa/export/" +
                exportFilename +
                ".xlsx?currentAuthority=true" +
                filterurl
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
  updateSelectedCheckboxIds = data => {
    console.log("updata checkbox");
    console.log("---DOA STATE ---", this.state);
    this.setState({ selectedCheckboxIds: data });
  };
  showProgressIcon = (checkboxId, progress, dom) => {
    switch (progress) {
      case "success":
        $(`.dt-checkboxes-cell[title=${checkboxId}] img`).remove();
        $(`.dt-checkboxes-cell[title=${checkboxId}]`).append(
          "<i class='fa fa-check purple' aria-hidden='true'></i>"
        );
        $(`.dt-checkboxes-cell[title=${checkboxId}]`).prop("checked", false);
        $(`.dt-checkboxes-cell[title=${checkboxId}]`).prop("disabled", true);
        $(`.dt-checkboxes-cell[title=${checkboxId}]`)
          .parent()
          .removeClass("rowSelected");
        break;
      case "failed":
        $(`.dt-checkboxes-cell[title=${checkboxId}] img`).remove();
        $(
          `.dt-checkboxes-cell[title=${checkboxId}] input[type=checkbox]`
        ).show();
        break;
      default:
        $(
          `.dt-checkboxes-cell[title=${checkboxId}] input[type=checkbox]`
        ).hide();
        $(`.dt-checkboxes-cell[title=${checkboxId}]`).append(
          '<img src="../static/img/ajax-loader.gif" style="object-fit:fill;" />'
        );
        break;
    }
  };
  handleApprove = () => {
    let table = $(".dataTable").DataTable();
    window.localStorage.clear();
    const selectedIds = table.columns().checkboxes.selected()[0];
    console.log("selectedIds : ", selectedIds);
    const filterOutSuccessIds = selectedIds.filter(
      item => this.state.successIds.indexOf(item) === -1
    );
    this.setState({ selectedIds: filterOutSuccessIds });
    this.setState({ modalvisible: true });
  };
  requestApprove = () => {
    const { selectedIds, selectedCheckboxIds, tableData } = this.state;
    const requestForApprovals = [];
    const record = [];

    for (var i = 0; i < selectedIds.length; i++) {
      const record = tableData.find(data => {
        return data.linearId == selectedIds[i];
      });
      console.log("this is record : ", record);
      const approvalObj = {
        linearId: selectedIds[i],
        documentType:
          record && !!record.documentType && record.documentType == "DEBIT_NOTE"
            ? "DEBIT_NOTE"
            : "INVOICE",
        checkboxId: selectedCheckboxIds[i],
        status: "loading"
      };
      requestForApprovals.push(approvalObj);
    }

    this.socket.emit("approve", this.props.token, requestForApprovals);
    window.localStorage.clear();
  };
  addNotification(type, message) {
    this.notificationDOMRef.current.addNotification({
      // title,
      message,
      type,
      insert: "top",
      container: "top-right",
      animationIn: ["animated", "fadeIn"],
      animationOut: ["animated", "fadeOut"],
      dismiss: { duration: 5000 },
      dismissable: { click: true },
      breakpoint: 300
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }
  updateResults = res => {
    this.setState({
      recordsTotal: _.has(res, "recordsTotal") ? res.recordsTotal : 0
    });
  };

  render() {
    const { t } = this.props;
    return (
      <Layout {...this.props} {...this.state}>
        <ReactNotification
          ref={this.notificationDOMRef}
          types={[
            {
              htmlClasses: ["notification-success"],
              name: "approvesuccess"
            },
            {
              htmlClasses: ["notification-failed"],
              name: "approvefailed"
            }
          ]}
        />
        <Head>
          <title>{this.state.title}</title>
        </Head>
        {this.state.showPage ? (
          <React.Fragment>
            <BrowserView>
              <CustomList
                {...this.props}
                {...this.state}
                dtClickAction={this.handleClickExternalId}
                dtButton={this.buttonPermisions}
                columnRender={this._columnRender}
                updateResults={this.updateResults}
                _this={this}
                showPage="false"
                handleApprove={this.handleApprove}
                currentAuth={true}
                updateSelectedCheckboxIds={this.updateSelectedCheckboxIds}
                apiService={this.standardService}
                lang={lang}
              />
            </BrowserView>
            <MobileView>
              {/* <List
                {...this.props}
                {...this.state}
                dtClickAction={this.handleClickExternalId}
                dtButton={this.buttonPermisions}
                columnRender={this._columnRender}
                updateResults={this.updateResults}
                _this={this}
                showPage="false"
                showSearchbox="true"
              /> */}
              <CustomList
                {...this.props}
                {...this.state}
                title={t(this.state.title)}
                dtClickAction={this.handleClickExternalId}
                dtButton={this.buttonPermisions}
                columnRender={this._columnRender}
                updateResults={this.updateResults}
                _this={this}
                showPage="false"
                handleApprove={this.handleApprove}
                currentAuth={true}
                updateSelectedCheckboxIds={this.updateSelectedCheckboxIds}
                apiService={this.standardService}
                lang={lang}
              />
            </MobileView>
          </React.Fragment>
        ) : (
          <div>Loading...</div>
        )}
        <ModalAlert
          title="Approve"
          visible={this.state.modalvisible}
          isTextOnly={true}
          button={[
            {
              label: "No",
              attribute: {
                className: "btn btn--transparent ml-10",
                onClick: () => this.setState({ modalvisible: false })
              }
            },
            {
              label: "Yes",
              attribute: {
                id: "btnConfirmApprove",
                className: "btn ml-10",
                onClick: () => {
                  this.requestApprove();
                  this.setState({ modalvisible: false });
                }
              }
            }
          ]}
        >
          Do you want to proceed for {this.state.selectedIds.length} DOA
          approval?
        </ModalAlert>
      </Layout>
    );
  }
}

export default withAuth(withTranslation("common")(waitingDOAList));
