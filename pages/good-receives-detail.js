import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import "../libs/mycools";
import ListDetail from "../components/ListDetail";
import BlockUi from "react-block-ui";
import ColumnList from "../libs/column";
import ModalAlert, { BTN_ACTION_BACK } from "../components/modalAlert";
import TableDetail from "../components/TableDetail";
import { i18n, withTranslation } from "~/i18n";
import mobileModel from "../columns/mobiles/gr-item-list.json";
import handleError from "./handleError";
import { isMobile } from "react-device-detect";
import { PageHeader, Collapse, CollapseItemText } from "../components/page";
import GA from "~/libs/ga";

const lang = "gr-detail";

class GrDetail extends Component {
  constructor(props) {
    super(props);

    this.api = new ApiService();
    this.apiDetail = new api(this.props.domain).group("grDetail");
    this.apis = new api().group("gr");
    this.apisitm = new api().group("griteminfo");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this.changeInvoiceExternalId = this.changeInvoiceExternalId.bind(this);
    this.handleDismissBtnModal = this.handleDismissBtnModal.bind(this);
    this.state = {
      title: "Goods Receives Detail",
      dataTableUrl: this.apiDetail.url("detail"),
      breadcrumb: [],
      columnList: [],
      model: [],
      detailItems: {
        goodsReceivedItems: []
      },
      grItems: [],
      showSearchbox: true,
      _this: this,
      blocking: true,
      dtClickAction: this.handleClickExternalId,
      saveColumnUrl: this.apiDetail.url("model.save"),
      invoiceLinearId: "",
      isToggleReviseInvoiceNoModal: false,
      reviseInvoiceNoModalTitle: "",
      buttonReviseInvoiceNoModal: [],
      reviseInvoiceRemark: "",
      reviseInvoiceNo: "",
      GRDoc: [],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: [],
      isAllowEdit: false,
      mobileModel: mobileModel
    };
    this.BTN_CLOSE = [
      {
        label: "Close",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: this.handleDismissBtnModal
        }
      }
    ];
  }

  async componentWillMount() {
    await this.permissionPage();
    await this.setPermission();
    await this.fetchData();
  }

  permissionPage = () => {
    const { permisions } = this.props;
    if (!permisions.includes("GR-Detail")) {
      Router.push("/dashboard");
    }
  };

  setPermission = () => {
    const { permisions } = this.props;
    this.setState({
      UserAuthority: permisions
    });
  };

  fetchData = async () => {
    var _this = this;

    try {
      const res = await this.api.getGRDetail(this.props.url.query.linearId);
      if (res.rows.length > 0) {
        if (
          res.rows[0].initialInvoiceExternalId === res.rows[0].invoiceExternalId
        ) {
          res.rows[0].invoiceExternalId = "";
        }
        this.setState({
          detailItems: res.rows[0],
          grItems: res.rows[0].goodsReceivedItems,
          otherFiles: res.rows[0].fileAttachments
        });

        this.populateAttachmentsToState(this.state.otherFiles);

        if (this.state.detailItems.invoiceExternalId) {
          await this.getinvoiceLinearId();
        }

        await this.setGRDoc();
        await this.resolvePermission();
        this._columnRender();
      } else {
        const message = [
          "Sorry, you cannot get detail of this goods receipt.",
          <br />,
          "Please contact your administrator."
        ];

        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
      }
    } catch (error) {
      console.error(error);
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
      // this.setState({
      //   isAlertModalVisible: true,
      //   alertModalAlertTitle: "Error!",
      //   isTextOnly: true,
      //   alertModalMsg: [
      //     `Sorry, you cannot get detail of this goods receipt.`,
      //     <br />,
      //     "Please contact your administrator."
      //   ],
      //   buttonAlert: [
      //     {
      //       label: "Back",
      //       attribute: {
      //         className: "btn btn--transparent btn-wide",
      //         onClick: this.routeToGRList
      //       }
      //     }
      //   ]
      // });
    }
  };

  routeToGRList = () => {
    Router.push("/good-receives");
  };

  async setGRDoc() {
    try {
      let GRDocArr = [];
      let GRDocDup = [];
      let val = await this.state.detailItems.goodsReceivedItems.map(
        async item => {
          if (
            item.initialGoodsReceivedExternalId !== "" &&
            item.initialGoodsReceivedExternalId !== undefined
          ) {
            if (GRDocDup.includes(item.initialGoodsReceivedExternalId)) {
              return;
            }
            GRDocDup.push(item.initialGoodsReceivedExternalId);
            let data = {
              externalId: item.initialGoodsReceivedExternalId
            };

            let res = await this.apiDetail.call("searchGROriginalDoc", data);
            if (res.data.length > 0) {
              let GRDocObj = {
                GRDocId: item.initialGoodsReceivedExternalId,
                linearId: res.data[0].linearId
              };

              GRDocArr[GRDocArr.length] = GRDocObj;
              this.setState({
                GRDoc: [...this.state.GRDoc, GRDocObj]
              });
            }
          }
        }
      );
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }

  resolvePermission() {
    let isAllowEdit = false;
    if (this.props.user.organisationUnit == "BUYER") {
      if (this.state.UserAuthority.includes("GR-Edit")) {
        isAllowEdit = true;
      }
    }
    this.setState({
      isAllowEdit,
      blocking: false
    });
  }

  async getinvoiceLinearId() {
    try {
      const res = await this.apiDetail.call("getInvoiceLinearId", {
        invoiceExternalId: this.state.detailItems.invoiceExternalId
      });
      if (res.data.length > 0) {
        let externalId = res.data.map(itm => {
          return itm.externalId;
        });
        if (externalId.includes(this.state.detailItems.invoiceExternalId)) {
          this.setState({
            invoiceLinearId: res.data[0].linearId
          });
        } else {
          this.setState({
            invoiceLinearId: ""
          });
        }

        this.setState({
          blocking: false
        });
      } else {
        this.setState({
          blocking: false
        });
      }
    } catch (err) {
      console.error(err);
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }

  _columnRender = async () => {
    const { t } = this.props;

    let model = await this.apiDetail.call("model.get");

    for (let i in model.table.columns) {
      model.table.columns[i].searchKey = model.table.columns[i].header;
      model.table.columns[i].header = await t(
        model.table.columns[i].header.replace(/[|&;$%@"<>()+,.-]/g, "")
      );
    }
    const columns = this.columnList.initColumns(model);
    this.setState({ columnList: columns, model: model });
  };

  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };

  buttonPermisions() {
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;
    if (permisions.includes("CN-Create")) {
      $(".btn-wrap.create").html(
        '<a className="btn ml-10 linkto" href="/create-cn">Create CN</a>'
      );
    }
    if (permisions.includes("CN-Export")) {
      $(".btn-wrap.export").html(
        '<a className="btn btn--transparent ml-10 ExportReporttoExcel" href="javascript:;"><i className="icon icon-export"></i> Export</a>'
      );
      $(".ExportReporttoExcel").on("click", function() {
        let searchInput = window.localStorage.getItem("searchInput-CNList");
        if (searchInput) {
          searchInput = JSON.parse(searchInput);
          window.open(
            "/api/cn/export/" +
              exportFilename +
              ".xls?" +
              queryString.stringify(searchInput)
          );
        } else {
          window.open("/api/cn/export/" + exportFilename + ".xls");
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

  populateAttachmentsToState(attachments) {
    let otherFiles = [];
    if (attachments) {
      attachments.forEach(item => {
        if (item.attachmentType.toUpperCase() === "OTHERS") {
          let file = {
            attachmentName: item.attachmentName,
            attachmentHash: item.attachmentHash,
            uploadDate: item.uploadDate,
            attachmentType: "Others",
            owner: item.owner
          };
          otherFiles.push(file);
        }
      });
    }
    this.setState({
      otherFiles: otherFiles
    });
  }

  handleClickEditGR = () => {
    Router.push(
      "/good-receives-edit?linearId=" + this.props.url.query.linearId
    );
  };

  toggleModalReviseInvoiceNo = () => {
    this.setState({
      isToggleReviseInvoiceNoModal: true,
      reviseInvoiceNoModalTitle: ["Revised Invoice No."],
      buttonReviseInvoiceNoModal: [
        {
          label: "Cancel",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissReviseInvoiceNoModal
          }
        },

        {
          label: "Change",
          attribute: {
            className: "btn btn-wide",
            onClick: this.changeInvoiceExternalId
          }
        }
      ]
    });
  };

  handleDismissReviseInvoiceNoModal = () => {
    this.setState({
      isToggleReviseInvoiceNoModal: false
    });
  };
  handleReviseInvoiceNoOnchange = e => {
    let reviseInvoiceNo = e.target.value;
    this.setState({
      reviseInvoiceNo: reviseInvoiceNo
    });
  };
  changeInvoiceExternalId = async () => {
    try {
      GA.event({
        category: "Goods Receipt",
        action: "Revised invoice for GR (Success)",
        label: `Good Receipt | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      this.setState({
        blocking: true,
        isToggleReviseInvoiceNoModal: false
      });
      let reviseInvoiceObj = {
        linearId: this.props.url.query.linearId,
        invoiceExternalId: this.state.reviseInvoiceNo
      };
      await this.apis.call(
        "reviseInvoice",
        {},
        { method: "put", data: reviseInvoiceObj }
      );

      if (this.state.initialInvoiceExternalId === this.state.reviseInvoiceNo) {
        this.setState({
          detailItems: {
            ...this.state.detailItems,
            invoiceExternalId: ""
          }
        });
      } else {
        this.setState({
          detailItems: {
            ...this.state.detailItems,
            invoiceExternalId: this.state.reviseInvoiceNo
          }
        });
      }

      await this.setState({
        detailItems: {
          ...this.state.detailItems,
          invoiceExternalId: this.state.reviseInvoiceNo,
          blocking: false
        }
      });

      GA.event({
        category: "Goods Receipt",
        action: "Revised invoice for GR (Success)",
        label: `Good Receipt | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      this.fetchData();
    } catch (err) {
      console.error(err);

      GA.event({
        category: "Goods Receipt",
        action: "Revised invoice for GR (Failed)",
        label: `Good Receipt | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      this.setState({
        blocking: false
      });
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  handleDismissBtnModal() {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  }

  render() {
    const { t } = this.props;
    let { ref: urlRef, externalId } = this.props.url.query;
    if (typeof urlRef == "object") {
    } else if (typeof urlRef == "string") {
      urlRef = [urlRef];
    }
    let breadcrumbs = [];
    let breadcrumbsGroup = [];
    if (urlRef !== "undefined") {
      if (urlRef && urlRef.length > 0) {
        urlRef.map(b => {
          let r = b.split(",");
          console.log(r);
          switch (r[0]) {
            case "3wm":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: "3 Way Matching",
                  url: "/3-way-matching-list"
                });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `3 Way Matching No. ${r[2] || ""}`,
                url: `/3-way-matching-detail?linearId=${r[1]}`
              });
              break;
            case "doa":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: "Waiting DOA Approval",
                  url: "/waiting-doa-approval"
                });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `Waiting DOA Approval No. ${r[2] || ""}`,
                url: `/waiting-doa-approval-detail?linearId=${r[1]}`
              });
              break;
          }
        });
        breadcrumbs.push({
          title: [
            t("Goods Receipt No"),
            ` ${this.state.detailItems.externalId}`
          ],
          active: true
        });
      } else {
        breadcrumbs = [
          { title: t("Goods Receipt"), url: "/good-receives" },
          {
            title: [
              t("Goods Receipt No"),
              ` ${this.state.detailItems.externalId || "-"}`
            ],
            active: true
          }
        ];
      }
    }

    const {
      detailItems,
      blocking,
      GRDoc,
      invoiceLinearId,
      columnList,
      isToggleReviseInvoiceNoModal,
      buttonReviseInvoiceNoModal,
      reviseInvoiceNoModalTitle,
      reviseInvoiceRemark,
      alertModalAlertTitle,
      isAlertModalVisible,
      buttonAlert,
      isTextOnly,
      alertModalMsg,
      grItems,
      isAllowEdit
    } = this.state;

    return (
      <Layout {...this.props}>
        <Head>
          <title>
            {[t("Goods Receipt No"), ` ${detailItems.externalId || "-"}`]}
          </title>
        </Head>
        <PageHeader
          title={[t("Goods Receipt No"), ` ${detailItems.externalId || "-"}`]}
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <BlockUi tag="div" blocking={blocking}>
          <div
            id="mobilePageNav"
            className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
          >
            <a href="/good-receives">
              <strong className="purple">
                <i className="fa fa-chevron-left" /> {t("Goods Receipt")}
              </strong>
            </a>
          </div>
          <section
            id="invoice_detail_page"
            className="goodReceiveDetailPage box box--width-header"
          >
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                <div className="col-4 pl-0 pl-lg-3">
                  {""}
                  {t("Create Date")} : {""}
                  {detailItems.documentEntryDate
                    ? moment(detailItems.documentEntryDate).format("DD/MM/YYYY")
                    : "-"}
                </div>
                {!isMobile ? (
                  <div className="col-8 text-right ">
                    <button
                      name="btnEdit"
                      className="btn btn--transparent btn-wide mr-2"
                      hidden={!isAllowEdit}
                      onClick={() => this.handleClickEditGR()}
                    >
                      {t("Edit GR")}
                    </button>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
            <div className="box__inner pt-0 pt-lg-3">
              {/* Desktop Version - Start */}
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={[t("Vendor"), t("Company")]}
                className="d-none d-lg-flex flex-wrap"
              >
                <div className="row">
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={detailItems.vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={detailItems.vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={detailItems.vendorTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${detailItems.vendorBranchCode || "-"} 
                        ${
                          detailItems.vendorBranchName
                            ? `(${detailItems.vendorBranchName})`
                            : ""
                        }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={`${detailItems.vendorAddress1 ||
                        ""} ${detailItems.vendorAddress2 ||
                        ""} ${detailItems.vendorDistrict ||
                        ""} ${detailItems.vendorCity ||
                        ""} ${detailItems.vendorPostalCode || ""}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.vendorTelephone}
                    />
                  </div>
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={detailItems.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={detailItems.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={detailItems.companyTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${detailItems.companyBranchCode || "-"}
                        ${
                          detailItems.companyBranchName
                            ? `(${detailItems.companyBranchName})`
                            : ""
                        }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={`${detailItems.companyAddress1 ||
                        ""} ${detailItems.companyAddress2 ||
                        ""} ${detailItems.companyDistrict ||
                        ""} ${detailItems.companyCity ||
                        ""} ${detailItems.companyPostalCode || ""}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.companyTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Desktop Version - End */}

              {/* Mobile Version - Start */}
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={[t("Vendor")]}
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="w-100 d-flex flex-wrap">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={detailItems.vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={detailItems.vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={detailItems.vendorTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${detailItems.vendorBranchCode || "-"} 
                        ${
                          detailItems.vendorBranchName
                            ? `(${detailItems.vendorBranchName})`
                            : ""
                        }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={`${detailItems.vendorAddress1 ||
                        ""} ${detailItems.vendorAddress2 ||
                        ""} ${detailItems.vendorDistrict ||
                        ""} ${detailItems.vendorCity ||
                        ""} ${detailItems.vendorPostalCode || ""}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.vendorTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              <Collapse
                id="companyInfo"
                expanded="true"
                collapseHeader={[t("Company")]}
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="w-100 d-flex flex-wrap">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={detailItems.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={detailItems.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={detailItems.companyTaxNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Branch")}
                      value={`${detailItems.companyBranchCode || "-"}
                        ${
                          detailItems.companyBranchName
                            ? `(${detailItems.companyBranchName})`
                            : ""
                        }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Address")}
                      value={`${detailItems.companyAddress1 ||
                        ""} ${detailItems.companyAddress2 ||
                        ""} ${detailItems.companyDistrict ||
                        ""} ${detailItems.companyCity ||
                        ""} ${detailItems.companyPostalCode || ""}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tel")}
                      value={detailItems.companyTelephone}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Mobile Version - End */}

              <Collapse
                id="grInfo"
                expanded="true"
                collapseHeader={[t("GR Information")]}
              >
                <div className="d-flex flex-wrap px-0">
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("PO No")}
                      colLabel="6"
                      value={detailItems.goodsReceivedItems
                        .map(item => item.purchaseOrderExternalId)
                        .filter(
                          (value, index, self) => self.indexOf(value) === index
                        )}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("GR Posting Date")}
                      colLabel="6"
                      value={
                        detailItems.postingDate
                          ? moment(detailItems.postingDate).format("DD/MM/YYYY")
                          : "-"
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("GR Type")}
                      colLabel="6"
                      value={detailItems.goodsReceivedItems
                        .map(item => item.movementClass)
                        .filter(
                          (value, index, self) => self.indexOf(value) === index
                        )}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Invoice No")}
                      colLabel="6"
                      value={detailItems.initialInvoiceExternalId}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Last Edited Date")}
                      colLabel="6"
                      value={
                        detailItems.lastEditedDate
                          ? moment(detailItems.lastEditedDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("Delivery Note No")}
                      colLabel="6"
                      value={detailItems.deliveryNoteExternalId}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("GR By")}
                      colLabel="6"
                      value={detailItems.createdBy}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Accounting Doc No")}
                      colLabel="6"
                      value=""
                    />
                    <div className="d-flex flex-wrap px-0">
                      <p className="col-6 text-right">
                        {t("Original GR Doc No")} :
                      </p>
                      <p className="col-6">
                        {this.state.GRDoc && this.state.GRDoc.length > 0
                          ? this.state.GRDoc.map((item, i) => {
                              return (
                                <span>
                                  <a
                                    href={`/good-receives-detail?linearId=${item.linearId}`}
                                    key={i}
                                  >
                                    {item.GRDocId}
                                  </a>
                                  {this.state.GRDoc.length - 1 !== i ? "," : ""}
                                </span>
                              );
                            })
                          : "-"}
                      </p>
                    </div>
                    <div className="d-flex flex-wrap px-0">
                      <p className="col-6 text-right">
                        {t("Revised Invoice No")} :
                      </p>
                      <p className="col-6">
                        {detailItems.invoiceExternalId &&
                        !detailItems.siblingLinearId ? (
                          <span>
                            {invoiceLinearId !== "" ? (
                              <a
                                href={`invoice-detail?linearId=${invoiceLinearId}&ref=gr,${detailItems.linearId},${detailItems.externalId}`}
                              >
                                {detailItems.invoiceExternalId}
                              </a>
                            ) : (
                              detailItems.invoiceExternalId
                            )}
                            &nbsp;{" "}
                            {isAllowEdit ? (
                              <a
                                href="javascript:;"
                                onClick={this.toggleModalReviseInvoiceNo}
                              >
                                <svg
                                  width="14px"
                                  height="14px"
                                  viewBox="0 0 14 14"
                                  version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g
                                    id="GR"
                                    stroke="none"
                                    strokeWidth={1}
                                    fill="none"
                                    fillRule="evenodd"
                                  >
                                    <g
                                      id="GR_detail"
                                      transform="translate(-1073.000000, -709.000000)"
                                      fill="#AF3694"
                                    >
                                      <g
                                        id="02_gr_information"
                                        transform="translate(167.000000, 480.000000)"
                                      >
                                        <g
                                          id="tb_revised_delivery_date"
                                          transform="translate(778.000000, 221.000000)"
                                        >
                                          <path
                                            d="M136.705228,10.3363467 L139.553335,13.1987652 L132.344588,20.4418251 L129.498721,17.5809467 L136.705228,10.3363467 Z M141.714475,9.64616016 L140.444657,8.36969931 C140.208957,8.1328935 139.888489,8 139.554357,8 C139.220225,8 138.899757,8.1328963 138.664058,8.37024533 L137.44783,9.59256594 L140.295378,12.4544244 L141.714531,11.0280454 L141.714531,11.0285928 C142.095156,10.646307 142.095156,10.0283214 141.714531,9.64603555 L141.714475,9.64616016 Z M128.007889,21.6034949 C127.98328,21.7128745 128.017185,21.8277282 128.09648,21.9064815 C128.176322,21.9852347 128.291161,22.0169545 128.399995,21.9912508 L131.573456,21.2179428 L128.727589,18.3560846 L128.007889,21.6034949 Z"
                                            id="Fill-1-Copy"
                                          />
                                        </g>
                                      </g>
                                    </g>
                                  </g>
                                </svg>
                              </a>
                            ) : (
                              ""
                            )}
                          </span>
                        ) : (
                          <span>
                            - &nbsp;{" "}
                            {isAllowEdit ? (
                              <a
                                href="javascript:;"
                                onClick={this.toggleModalReviseInvoiceNo}
                              >
                                <svg
                                  width="14px"
                                  height="14px"
                                  viewBox="0 0 14 14"
                                  version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g
                                    id="GR"
                                    stroke="none"
                                    strokeWidth={1}
                                    fill="none"
                                    fillRule="evenodd"
                                  >
                                    <g
                                      id="GR_detail"
                                      transform="translate(-1073.000000, -709.000000)"
                                      fill="#AF3694"
                                    >
                                      <g
                                        id="02_gr_information"
                                        transform="translate(167.000000, 480.000000)"
                                      >
                                        <g
                                          id="tb_revised_delivery_date"
                                          transform="translate(778.000000, 221.000000)"
                                        >
                                          <path
                                            d="M136.705228,10.3363467 L139.553335,13.1987652 L132.344588,20.4418251 L129.498721,17.5809467 L136.705228,10.3363467 Z M141.714475,9.64616016 L140.444657,8.36969931 C140.208957,8.1328935 139.888489,8 139.554357,8 C139.220225,8 138.899757,8.1328963 138.664058,8.37024533 L137.44783,9.59256594 L140.295378,12.4544244 L141.714531,11.0280454 L141.714531,11.0285928 C142.095156,10.646307 142.095156,10.0283214 141.714531,9.64603555 L141.714475,9.64616016 Z M128.007889,21.6034949 C127.98328,21.7128745 128.017185,21.8277282 128.09648,21.9064815 C128.176322,21.9852347 128.291161,22.0169545 128.399995,21.9912508 L131.573456,21.2179428 L128.727589,18.3560846 L128.007889,21.6034949 Z"
                                            id="Fill-1-Copy"
                                          />
                                        </g>
                                      </g>
                                    </g>
                                  </g>
                                </svg>
                              </a>
                            ) : (
                              ""
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                    <CollapseItemText
                      t={t}
                      label={t("Last Edited By")}
                      colLabel="6"
                      value={detailItems.lastEditedBy}
                    />
                    <div
                      id="invoice_detail_edit_page"
                      className="d-flex flex-wrap px-0"
                    >
                      <p className="col-6 text-right">
                        {t("Attach Document")} :
                      </p>
                      <ul
                        id="attach_tax_invoice_list"
                        className="uploadedList col-6 px-0"
                      >
                        {this.state.otherFiles &&
                        this.state.otherFiles.length != 0 ? (
                          _.map(
                            this.state.otherFiles,
                            (
                              { attachmentName, attachmentHash, owner = "" },
                              index
                            ) => (
                              <li>
                                <a
                                  href={`/download/${attachmentHash}
                                    /${attachmentName.replace(
                                      /%/g,
                                      ""
                                    )}?filename=${attachmentName.replace(
                                    /%/g,
                                    ""
                                  )}&owner=${owner}`}
                                  className="gray-1"
                                  target="_blank"
                                >
                                  {attachmentName}
                                </a>
                              </li>
                            )
                          )
                        ) : (
                          <p className="col-6"> - </p>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </Collapse>
              {this.state.columnList.length > 0 ? (
                <TableDetail
                  {...this.props}
                  {...this.state}
                  _this={this}
                  key="itemInfo"
                  id="itemInfo"
                  expanded="true"
                  collapseHeader={[t("Items Information")]}
                  btnColumnDisplay={true}
                  AcolumnList={this.columnList}
                  apis={this.apisitm}
                  columns={this.state.columnList}
                  results={this.state.grItems}
                  btnOpt={[]}
                  lang={lang}
                />
              ) : (
                ""
              )}
            </div>
          </section>
        </BlockUi>
        <ModalAlert
          title={reviseInvoiceNoModalTitle}
          visible={isToggleReviseInvoiceNoModal}
          button={buttonReviseInvoiceNoModal}
          isHeaderCenter={true}
          modalSize="modal-revise"
        >
          <div className="form-label-group">
            <input
              type="text"
              id="invoice_no"
              className="form-control"
              placeholder={reviseInvoiceNoModalTitle}
              defaultValue={detailItems.invoiceExternalId}
              onChange={this.handleReviseInvoiceNoOnchange}
              required
              autoFocus
            />
            <label htmlFor="invoice_no">{reviseInvoiceNoModalTitle}</label>
          </div>
          {reviseInvoiceRemark != "" ? (
            <p className="message c-red">{reviseInvoiceRemark}</p>
          ) : (
            <span />
          )}
        </ModalAlert>
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
      </Layout>
    );
  }
}
export default withAuth(
  withTranslation(["gr-detail", "detail", "common", "menu"])(GrDetail)
);
