import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import Layout from "../components/Layout";
import moment from "moment";
import List from "../components/List";
import ActionList from "../components/ActionList";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
import ModalAlert from "../components/modalAlert";
import ModalDelivery from "../components/modalDelivery";
import { PageHeader } from "../components/page";
import "../static/jquery.numberformatter";
import exportLimit from "../configs/export.limit.json";
import { saveAs } from "file-saver";
import { isMobile } from "react-device-detect";
import { withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const queryString = require("query-string");
const axios = require("axios");

const lang = "po-delivery-list";
class PODeliverySchedule extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("po-delivery");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: isMobile ? "PO Delivery" : "PO Delivery Schedule",
      GATitle: "PO Delivery Schedule",
      menukey: "po-delivery",
      dataTableUrl: this.apis.url("list"),
      breadcrumb: [],
      columnList: [],
      model: [],
      searchItems: [],
      json: null,
      selectedPoId: null,
      selectedPoItem: null,
      modalvisible: false,
      modalType: "",
      resultModalVisible: false,
      resultLoading: false,
      resultSuccess: false,
      resultTitle: "",
      resultMessage: [
        <div>
          ,"Processing ",
          <i className="fa fa-spinner fa-spin" />
        </div>
      ],
      errorMessage: "",
      blocking: false,
      showSearchbox: true,
      proposeDate: new Date(),
      proposeTime: "00:00:00.000+07:00",
      proposeReason: "",
      proposeButtonDisabled: true,
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
      if (!permisions.includes("PO-Delivery-List")) {
        Router.push("/dashboard");
      }

      this._columnRender(this.model);
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      const ponumber = urlParams.get("ponumber");
      const linearId = urlParams.get("linearId");
      if (ref && ref === "podetail" && ponumber && linearId) {
        this.setState({ showSearchbox: false, ponumber, linearId });
      }
      // $(".proposeButton").prop("disabled", true);
    } catch (err) {
      console.error(err);
    }
  }
  handleClickExternalId = (href, a) => {
    // Router.push(a.data("href") || href);
    const selectedPoId = a.attr("linearId");
    const selectedPoItem = this.state.json.filter(
      item => item.linearId === selectedPoId
    )[0];
    console.log("DATA", selectedPoItem);
    this.setState({ selectedPoId, selectedPoItem });
    this.setState({ modalType: a.attr("modalType") });
    this.setState({ modalvisible: true });
  };
  _columnRender = async () => {
    const _this = this;
    const { t } = this.props;
    if (isMobile) {
      this.model = await this.apis.call("model.mget");
    } else {
      this.model = await this.apis.call("model.get");
    }
    // this.model = await this.apis.call("model.get");
    this.setState({ showPage: false });
    this.columnList.setCustomFormat("materialDescription", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }
        if (_this.props && _this.props.user.organisationUnit == "BUYER") {
          if (
            row.lifecycle === "CONFIRMED" ||
            row.lifecycle === "PENDING_SELLER"
          ) {
            if (isMobile && data.lenght >= 10 && data.lenght <= 20) {
              console.log("case 1.1");
              let firstLine = data.substring(0, 10);
              let secondLine = data.substring(10, data.lenght);

              return `<a href="javascript:;" className="link list-link" modalType="proposeDetail" linearId="${
                row.linearId
              }">${firstLine}${"<br/>"}${secondLine}</a>`;
            } else if (isMobile || data.lenght > 20) {
              console.log("case 2.1");
              let firstLine = data.substring(0, 10);
              let secondLine = data.substring(10, 20);
              let thirdLine = data.substring(20, data.lenght);
              return `<a href="javascript:;" className="link list-link" modalType="proposeDetail" linearId="${
                row.linearId
              }">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
            } else {
              console.log("case 3.1");
              return `<a href="javascript:;" className="link list-link" modalType="proposeDetail" linearId="${row.linearId}">${data}</a>`;
            }
          } else {
            return `<a href="javascript:;" className="link list-link" modalType="confirmDetail" linearId="${row.linearId}">${data}</a>`;
          }
        } else {
          if (
            row.lifecycle === "CONFIRMED" ||
            row.lifecycle === "PENDING_BUYER" ||
            row.lifecycle === "PENDING_SELLER"
          ) {
            if (isMobile && data.lenght >= 10 && data.lenght <= 20) {
              let firstLine = data.substring(0, 10);
              let secondLine = data.substring(10, data.lenght);

              return `<a href="javascript:;" className="link list-link" modalType="proposeDetail" linearId="${
                row.linearId
              }">${firstLine}${"<br/>"}${secondLine}</a>`;
            } else if (isMobile || data.lenght > 20) {
              let firstLine = data.substring(0, 10);
              let secondLine = data.substring(10, 20);
              let thirdLine = data.substring(20, data.lenght);
              return `<a href="javascript:;" className="link list-link" modalType="proposeDetail" linearId="${
                row.linearId
              }">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
            } else {
              console.log("case 3.2");
              return `<a href="javascript:;" className="link list-link" modalType="proposeDetail" linearId="${row.linearId}">${data}</a>`;
            }
          } else {
            return `<a href="javascript:;" className="link list-link" modalType="confirmDetail" linearId="${row.linearId}">${data}</a>`;
          }
        }
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
    if (permisions.includes("PO-Export")) {
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="ml-3 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".btn-toggle-export").css("display", "inline-block");
      $(".ExportReporttoExcel").on("click", function() {
        GA.event({
          category: GATitle,
          action: "Export PO Delivery Schedule list (Request)",
          label: moment().format()
        });

        if (_this.state.recordsTotal > _this.state.limitExportRecords) {
          _this.setState({
            isAlertModalVisible: true,
            AlertModalMessage: `Your exported file exceeds ${_this.state.limitExportRecords} records, please refine your filter.`
          });

          GA.event({
            category: GATitle,
            action: "Export PO Delivery Schedule list (Failed)",
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
            action: "Export PO Delivery Schedule list (Failed)",
            label: moment().format()
          });

          return;
        }

        if (_this.state.currentDataTableData) {
          let srcQuery = _this.state.currentDataTableData;
          let exportUrl =
            "/api/po-delivery/export/" +
            exportFilename +
            ".xlsx?" +
            queryString.stringify(srcQuery);
          $(".ExportReporttoExcel").html('<i class="fa fa-spinner fa-spin" />');
          $(".ExportReporttoExcel").prop("disabled", true);
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
              $(".ExportReporttoExcel").prop("disabled", false);
              $(".ExportReporttoExcel").css("cursor", "pointer");
              saveAs(new Blob([response.data]), exportFilename + ".xlsx");

              GA.event({
                category: GATitle,
                action: "Export PO Delivery Schedule list (Success)",
                label: moment().format()
              });
            })
            .catch(function(error) {
              $(".ExportReporttoExcel").html(
                '<i class="icon-additional icon-export" />'
              );
              $(".ExportReporttoExcel").prop("disabled", false);
              $(".ExportReporttoExcel").css("cursor", "pointer");
              alert("Couldn't export data at this time. Please try again");
              console.error("Export Error :", error.message);

              GA.event({
                category: GATitle,
                action: "Export PO Delivery Schedule list (Failed)",
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
  setJson = json => {
    this.setState({ json });
  };
  setSelectedPoId = selectedPoId => {
    const selectedPoItem = this.state.json.filter(
      item => item.linearId === selectedPoId
    )[0];
    this.setState({ selectedPoId, selectedPoItem });
  };
  setModalType = modalType => {
    this.setState({ modalType });
  };
  setModalVisible = bool => {
    this.setState({ modalvisible: bool });
  };
  setProposeButtonDisabled = bool => {
    this.setState({ proposeButtonDisabled: bool });
  };
  setProposeDate = proposeDate => {
    this.setState({ proposeDate });
  };
  setProposeTime = (time, type) => {
    let times = this.state.proposeTime.split(":");
    if (type === "hour") {
      times[0] = time;
    } else {
      times[1] = time;
    }
    let newTime = times.join(":");
    this.setState({ proposeTime: newTime });
  };
  setProposeReason = proposeReason => {
    this.setState({ proposeReason });
  };
  proposeDeliveryDate = async () => {
    const { GATitle } = this.state;
    const payload = {
      method: "put",
      data: [
        {
          linearId: this.state.selectedPoItem.linearId,
          proposedRevisedDeliveryDate: `${moment(this.state.proposeDate).format(
            "YYYY-MM-DD"
          )}T${this.state.proposeTime}`,
          revisedReason: this.state.proposeReason
        }
      ]
    };
    this.setState({
      resultTitle: "Propose",
      resultModalVisible: true,
      modalvisible: false,
      resultLoading: true
    });
    try {
      GA.event({
        category: GATitle,
        action: "Propose on PO Delivery Schedule list (Request)",
        label: `${GATitle} | ${
          this.state.selectedPoItem.poNumber
        } | ${moment().format()}`
      });

      const result = await this.apis.call("propose", {}, payload);
      this.setState({ resultLoading: false });
      if (result[0].body.statusCode === 201) {
        this.setState({
          resultSuccess: true,
          resultMessage: `Propose new delivery date ${result[0].body.message}`,
          modalvisible: false
        });

        GA.event({
          category: GATitle,
          action: "Propose on PO Delivery Schedule list (Success)",
          label: `${GATitle} | ${
            this.state.selectedPoItem.poNumber
          } | ${moment().format()}`
        });
      } else {
        this.setState({
          resultSuccess: false,
          resultMessage: `Propose new delivery date ${result[0].body.message}`
        });

        GA.event({
          category: GATitle,
          action: "Propose on PO Delivery Schedule list (Failed)",
          label: `${GATitle} | ${
            this.state.selectedPoItem.poNumber
          } | ${moment().format()}`
        });
      }
    } catch (error) {
      this.setState({
        resultSuccess: false,
        resultMessage: error.errorMessage
      });

      GA.event({
        category: GATitle,
        action: "Propose on PO Delivery Schedule list (Failed)",
        label: `${GATitle} | ${
          this.state.selectedPoItem.poNumber
        } | ${moment().format()}`
      });
    }
  };
  confirmDeliveryDate = async () => {
    const { GATitle } = this.state;
    const payload = {
      method: "put",
      data: [
        {
          linearId: this.state.selectedPoItem.linearId
        }
      ]
    };
    this.setState({
      resultTitle: "Confirm",
      resultModalVisible: true,
      modalvisible: false,
      resultLoading: true
    });
    try {
      GA.event({
        category: GATitle,
        action: "Confirm on PO Delivery Schedule list (Request)",
        label: `${GATitle} | ${
          this.state.selectedPoItem.poNumber
        } | ${moment().format()}`
      });

      const result = await this.apis.call("confirm", {}, payload);
      this.setState({ resultLoading: false });
      if (result[0].body.statusCode === 201) {
        this.setState({
          resultSuccess: true,
          resultMessage: `Confirm new delivery date ${result[0].body.message}`,
          modalvisible: false
        });

        GA.event({
          category: GATitle,
          action: "Confirm on PO Delivery Schedule list (Success)",
          label: `${GATitle} | ${
            this.state.selectedPoItem.poNumber
          } | ${moment().format()}`
        });
      } else {
        this.setState({
          resultSuccess: false,
          resultMessage: `Confirm new delivery date ${result[0].body.message}`
        });

        GA.event({
          category: GATitle,
          action: "Confirm on PO Delivery Schedule list (Failed)",
          label: `${GATitle} | ${
            this.state.selectedPoItem.poNumber
          } | ${moment().format()}`
        });
      }
    } catch (error) {
      this.setState({
        resultSuccess: false,
        resultMessage: error.errorMessage
      });

      GA.event({
        category: GATitle,
        action: "Confirm on PO Delivery Schedule list (Failed)",
        label: `${GATitle} | ${
          this.state.selectedPoItem.poNumber
        } | ${moment().format()}`
      });
    }
  };

  updateResults = res => {
    this.setState({ recordsTotal: res.recordsTotal });
  };

  render() {
    const { t } = this.props;
    var _this = this;
    let modalButtons = [];
    let breadcrumbs = [
      { title: `Purchase Order`, url: `/purchase-order` },
      {
        title: `PO No. ${this.state.ponumber}`,
        url: `/purchase-order-detail?linearId=${this.state.linearId}`
      },
      { title: `Delivery Schedule`, active: true }
    ];

    if (
      this.state.modalType === "proposeDetail" ||
      this.state.modalType === "confirmDetail"
    ) {
      modalButtons = [
        {
          label: t("Close"),
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: () => this.setState({ modalvisible: false })
          }
        }
      ];
    } else if (this.state.modalType === "propose") {
      modalButtons = [
        {
          label: t("Cancel"),
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: () => this.setState({ modalvisible: false })
          }
        },
        {
          label: t("ProposeSubmit"),
          attribute: {
            className: `btn btn-wide proposeButton`,
            disabled: this.state.proposeButtonDisabled,
            onClick: () => this.proposeDeliveryDate()
          }
        }
      ];
    } else if (this.state.modalType === "confirm") {
      modalButtons = [
        {
          label: "No",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: () => this.setState({ modalvisible: false })
          }
        },
        {
          label: "Yes",
          attribute: {
            className: "btn btn-wide",
            onClick: () => this.confirmDeliveryDate()
          }
        }
      ];
    }
    console.log("this.state.showSearchbox", this.state.showSearchbox);
    return (
      <Layout {...this.props} {...this.state}>
        {/* <Head>
          <title>
            {this.state.showSearchbox === false
              ? `Delivery Schedule of Purchase Order No. ${this.state.ponumber}`
              : t(this.state.title)}
          </title>
        </Head> */}
        {this.state.showSearchbox === false ? (
          <PageHeader
            title={`Delivery Schedule of Purchase Order No. ${this.state
              .ponumber || "-"}`}
            breadcrumbs={breadcrumbs}
            {...this.props}
          />
        ) : (
          ""
        )}
        {this.state.showPage ? (
          <ActionList
            {...this.props}
            {...this.state}
            dtClickAction={this.handleClickExternalId}
            dtButton={this.buttonPermisions}
            columnRender={this._columnRender}
            _this={this}
            showPage="false"
            showSearchbox={this.state.showSearchbox}
            setJson={this.setJson}
            setSelectedPoId={this.setSelectedPoId}
            setModalType={this.setModalType}
            setModalVisible={this.setModalVisible}
            updateResults={this.updateResults}
            title={t(this.state.title)}
            lang={lang}
          />
        ) : (
          <div>Loading...</div>
        )}
        <ModalDelivery
          type={this.state.modalType}
          data={this.state.selectedPoItem}
          visible={this.state.modalvisible}
          button={modalButtons}
          setProposeButtonDisabled={this.setProposeButtonDisabled}
          setProposeDate={this.setProposeDate}
          setProposeTime={this.setProposeTime}
          setProposeReason={this.setProposeReason}
        />
        <ModalAlert
          title={`${this.state.resultTitle} Delivery Date`}
          isTextOnly={true}
          visible={this.state.resultModalVisible}
          button={
            this.state.resultLoading
              ? ""
              : //   [
                //       {
                //         label: "Close",
                //         attribute: {
                //           className: `btn btn-wide btn-disabled`
                //         }
                //       }
                //     ]
                [
                  {
                    label: "Close",
                    attribute: {
                      className: `btn btn-wide`,
                      onClick: () => {
                        this.setState({
                          resultModalVisible: false
                        });
                        if (this.state.resultSuccess) {
                          setTimeout(() => {
                            window.location.reload();
                          }, 500);
                        }
                      }
                    }
                  }
                ]
          }
        >
          <div className="text-center">
            {this.state.resultLoading ? (
              <div>
                Processing <i className="fa fa-spinner fa-spin" />
              </div>
            ) : (
              <React.Fragment>
                <i
                  className={`fa ${
                    this.state.resultSuccess
                      ? "fa-check-circle"
                      : "fa-exclamation-triangle"
                  }`}
                  style={{ color: "rgb(175, 54, 148)", fontSize: "100px" }}
                />
                <div>{this.state.resultMessage}</div>
                <div>{this.state.errorMessage}</div>
              </React.Fragment>
            )}
          </div>
        </ModalAlert>
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
  withTranslation("po-delivery-list")(PODeliverySchedule)
);
