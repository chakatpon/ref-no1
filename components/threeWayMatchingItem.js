import React, { Component } from "react";
import MatchDetailPopover from "./matchDetailPopover/matchDetailPopover";
import ModalSelectGr from "./modalSelectGr";
import ModalAlert from "./modalAlert";
import moment from "moment";
import { i18n, withTranslation } from "~/i18n";
import GA from "~/libs/ga";

class ThreeWayMatchingItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      selectedIndexes: [],
      isShowGR: false,
      isShowINV: false,
      isGrTableVisible: false,
      buttonGrTable: [],
      grList: [],
      checkAll: false,
      taggedGR: [],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      isTextOnly: false,
      alertModalMsg: [],
      buttonAlert: [],
      isAllowSelectGR: false,
      isLoading: false
    };
    this.style = {
      matchedWithinThreshold: {
        color: "#ff981c"
      }
    };
  }

  async componentDidMount() {
    let { index } = this.props;
    const _this = this;
    $(`#${index}-grButton`).click(function(e) {
      _this.toggleGrListModal();
      return false;
    });

    $(`#${index}-grButton-mobile`).click(function(e) {
      _this.toggleGrListModal();
      return false;
    });

    await this.fetchGr();
    this.resolvePermissionSelectGR();
  }

  fetchGr = async () => {
    let { data, getTagGR } = this.props;
    const goodsReceivedItems = data.goodsReceivedItems.items.map(item => ({
      ...item.originalGr
    }));
    const purchaseItemLinearId = data.purchaseItemLinearId;

    if (purchaseItemLinearId && getTagGR) {
      const res = await getTagGR(purchaseItemLinearId, goodsReceivedItems);
      if (res.data.length > 0) {
        this.setState({
          grList: res.data
        });
      }
      this.setState({
        buttonGrTable: [
          {
            label: "Back",
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.toggleGrListModal
            }
          },
          {
            label: "Submit",
            attribute: {
              className: "btn btn-wide",
              onClick: this.submitTagedGR
            }
          }
        ]
      });
    }
  };

  setObjTaggedGR = async GRObj => {
    let {
      matchingType,
      invoiceLinearId,
      data,
      creditNoteLinearId
    } = this.props;
    let tagedGRObj = {};
    if (matchingType === "3wm" || matchingType === "doa") {
      tagedGRObj = {
        linearId: invoiceLinearId,
        items: [{ linearId: data.linearId, goodsReceivedItems: GRObj }]
      };
    } else {
      tagedGRObj = {
        linearId: creditNoteLinearId,
        creditNoteItems: [
          { linearId: data.linearId, goodsReceivedItems: GRObj }
        ]
      };
    }
    return tagedGRObj;
  };

  submitTagedGR = async () => {
    GA.event({
      category: "3WM",
      action: "3WM Tag GR (Request)",
      label: moment().format()
    });

    try {
      let { data, invoiceLinearId } = this.props;
      this.toggleGrListModal();
      let taggedGR = this.state.grList.filter(item => {
        return item.tagged;
      });
      if (taggedGR.length > 0) {
        let finalPayload = await Promise.all(
          data.goodsReceivedItems.invoiceItemLinearIdArr.map(async it => {
            let a = [];
            for (let index = 0; index < taggedGR.length; index++) {
              if (taggedGR[index].invoiceItemLinearId == it) {
                await a.push({ linearId: taggedGR[index].linearId });
              }
            }
            return {
              linearId: it,
              goodsReceivedItems: a
            };
          })
        );

        let taggedGRNew = taggedGR.filter(item => {
          return item.invoiceItemLinearId === undefined;
        });
        taggedGRNew = taggedGRNew.filter(it => it.linearId);
        if (taggedGRNew.length > 0) {
          await taggedGRNew.map(item => {
            finalPayload[0].goodsReceivedItems.push({
              linearId: item.linearId
            });
          });
        }
        finalPayload = {
          linearId: invoiceLinearId,
          items: finalPayload
        };
        this.setState({
          isLoading: true
        });
        const res = await this.props.submitTagGr(finalPayload);
        this.setState({
          isLoading: false,
          isGrTableVisible: false,
          isAlertModalVisible: true,
          alertModalAlertTitle: "Success",
          isTextOnly: true,
          alertModalMsg: ["Tag GR Successfully"],
          buttonAlert: [
            {
              label: "Close",
              attribute: {
                className: "btn btn--transparent btn-wide",
                onClick: this.dismissAlertModal
              }
            }
          ]
        });

        GA.event({
          category: "3WM",
          action: "3WM Tag GR (Success)",
          label: moment().format()
        });

        this.props.reloadPageAfterTaggedGR();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        this.setState({
          isLoading: false,
          isAlertModalVisible: true,
          alertModalAlertTitle: "Error!",
          isTextOnly: true,
          alertModalMsg: [`${error.response.data.message}`],
          buttonAlert: [
            {
              label: "Back",
              attribute: {
                className: "btn btn--transparent btn-wide",
                onClick: this.dismissAlertAndSelectGRModal
              }
            }
          ]
        });
      } else {
        let msg = [];
        if (this.props.matchingType === "3wm") {
          msg = [
            "Sorry, you cannot save tagged GR of this three way matching.",
            <br />,
            "Please contact your administrator."
          ];
        } else if (this.props.matchingType === "doa") {
          msg = [
            "Sorry, you cannot save tagged GR of this waiting doa approval.",
            <br />,
            "Please contact your administrator."
          ];
        } else {
          msg = [
            "Sorry, you cannot save tagged GR of this two way matching.",
            <br />,
            "Please contact your administrator."
          ];
        }

        this.setState({
          isLoading: false,
          isAlertModalVisible: true,
          alertModalAlertTitle: "Error!",
          isTextOnly: true,
          alertModalMsg: msg,
          buttonAlert: [
            {
              label: "Back",
              attribute: {
                className: "btn btn--transparent btn-wide",
                onClick: this.dismissAlertAndSelectGRModal
              }
            }
          ]
        });

        GA.event({
          category: "3WM",
          action: "3WM Tag GR (Failed)",
          label: moment().format()
        });
      }
    }
  };

  toggleGrListModal = async e => {
    this.setState({
      isGrTableVisible: !this.state.isGrTableVisible
    });
    await this.fetchGr();
  };

  dismissAlertAndSelectGRModal = () => {
    this.toggleGrListModal();
    this.setState({ isAlertModalVisible: false });
  };

  dismissAlertModal = () => {
    this.setState({ isAlertModalVisible: false });
  };

  clickCheckAll = (data, checkAll) => {
    this.setState({
      checkAll,
      grList: data
    });
  };

  clickCheck = data => {
    this.setState({
      grList: data
    });
  };

  renderSumary = () => {
    return this.formatCurrency(
      this.state.grList
        .filter(item => item.tagged)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.quantity.initial,
          0
        ),
      3
    );
  };

  isNotStatus = () => {
    let { lifecycleForNotRunMatching, lifeCycle } = this.props;
    return (
      lifecycleForNotRunMatching &&
      lifecycleForNotRunMatching.includes(lifeCycle)
    );
  };

  renderMatchStatus = () => {
    const { data, lifeCycle, t } = this.props;

    if (this.isNotStatus()) {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <h3 className="indicator mt-2">
            <strong />
          </h3>
        </div>
      );
    }

    if (
      data.itemProperties.matchedStatus === "matched" &&
      lifeCycle !== "ISSUED"
    ) {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0 d-none d-lg-inline-block">&nbsp;</p>
          <h3 className="indicator">
            <strong>{t("Matched")}</strong>
          </h3>
        </div>
      );
    } else if (data.itemProperties.matchedStatus === "matchedWithThreshold") {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0 d-none d-lg-inline-block">&nbsp;</p>
          <h3 className="indicator" style={this.style.matchedWithinThreshold}>
            <strong>{t("Matched Within Threshold")}</strong>
          </h3>
        </div>
      );
    }
    if (
      data.itemProperties.matchedStatus === "matched" &&
      lifeCycle === "ISSUED"
    ) {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0 d-none d-lg-inline-block">&nbsp;</p>
          <h3 className="indicator">
            <strong />
          </h3>
        </div>
      );
    } else if (data.itemProperties.lifecycle === "ISSUED") {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0 d-none d-lg-inline-block">&nbsp;</p>
          <h3 className="indicator">
            <strong />
          </h3>
        </div>
      );
    } else {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="indicator mb-0">{t("Unmatched Reason")}</p>
          <h3 className="indicator">
            <strong>
              {data.itemProperties.unmatchedReason.map((item, i) => {
                return (
                  <span>
                    {item}{" "}
                    {i < data.itemProperties.unmatchedReason.length - 1
                      ? ", "
                      : " "}
                  </span>
                );
              })}
            </strong>
          </h3>
        </div>
      );
    }
  };

  renderCheck = unmatchedType => {
    const { data } = this.props;
    if (
      this.isNotStatus() ||
      data.itemProperties.matchedCode[unmatchedType] === "BYPASS"
    ) {
      return this.blankComponent();
    }

    if (
      this.isUnmatched(unmatchedType) &&
      data.itemProperties.matchedCode[unmatchedType] !== "BYPASS"
    ) {
      return (
        <React.Fragment>
          <i className="fa fa-times c-red" />{" "}
        </React.Fragment>
      );
    } else {
      if (data.itemProperties.matchedCode[unmatchedType] === "IN_TOLERANCE") {
        return (
          <React.Fragment>
            <i
              className="fa fa-check"
              style={this.style.matchedWithinThreshold}
            />{" "}
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment>
            <i className="fa fa-check c-green" />{" "}
          </React.Fragment>
        );
      }
    }
  };

  renderMoreDetail = unmatchedType => {
    const { data } = this.props;
    if (
      this.isNotStatus() ||
      data.itemProperties.matchedCode[unmatchedType] === "BYPASS"
    ) {
      return false;
    }

    if (
      this.isUnmatched(unmatchedType) &&
      data.itemProperties.matchedCode[unmatchedType] !== "BYPASS"
    ) {
      return true;
    } else {
      if (data.itemProperties.matchedCode[unmatchedType] === "IN_TOLERANCE") {
        return true;
      } else {
        return false;
      }
    }
  };

  isUnmatched = unmatchedType => {
    let { data } = this.props;
    if (this.isNotStatus()) {
      return false;
    }
    return (
      data.itemProperties.unmatchedCode &&
      data.itemProperties.unmatchedCode.includes(unmatchedType)
    );
  };

  blankComponent = () => {
    return <i className="fa fa-check c-white" />;
  };

  renderText = (unmatchedType, dt) => {
    const { data, lifecycleForNotRunMatching, lifeCycle } = this.props;

    if (dt == "" || dt == "-") {
      return "-";
    }

    if (lifecycleForNotRunMatching.includes(lifeCycle)) {
      return !dt || dt === "Invalid date" ? "-" : dt;
    }

    if (
      this.isUnmatched(unmatchedType) &&
      data.itemProperties.matchedCode[unmatchedType] !== "BYPASS"
    ) {
      return (
        <strong className="c-red">
          {!dt || dt === "Invalid date" ? "-" : dt}
        </strong>
      );
    }
    if (
      data.itemProperties.matchedCode[unmatchedType] === "IN_TOLERANCE" &&
      dt !== "" &&
      dt !== "Invalid date"
    ) {
      return (
        <strong style={this.style.matchedWithinThreshold}>
          {!dt || dt === "Invalid date" ? "-" : dt}
        </strong>
      );
    }
    return !dt || dt === "Invalid date" ? "-" : dt;
  };

  formatCurrency = (amount, digit) => {
    if (!amount) return 0;
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: digit,
      minimumFractionDigits: digit
    }).format(amount);
  };

  resolvePermissionSelectGR = () => {
    let { lifecycleTag, lifeCycle, permission, auth, userType } = this.props;
    let isAllowSelectGR = false;
    if (lifecycleTag.includes(lifeCycle)) {
      if (auth.includes(permission)) {
        if (userType == "BUYER") {
          isAllowSelectGR = true;
        }
      }
    }
    this.setState({
      isAllowSelectGR: isAllowSelectGR
    });
  };

  toggleShowGR = () => {
    this.setState({
      isShowGR: !this.state.isShowGR
    });
  };
  toggleShowINV = () => {
    this.setState({
      isShowINV: !this.state.isShowINV
    });
  };

  render() {
    const { t } = this.props;
    const {
      isShowGR,
      isShowINV,
      isGrTableVisible,
      isAlertModalVisible,
      alertModalAlertTitle,
      isTextOnly,
      alertModalMsg,
      buttonAlert,
      isAllowSelectGR,
      checkAll,
      grList
    } = this.state;
    const {
      data,
      index,
      noSelectGR,
      matchingType,
      externalId,
      invoiceLinearId
    } = this.props;
    return (
      <div
        className={`row box ${
          data.itemProperties.matchedStatus === "" || this.isNotStatus()
            ? "item-matched"
            : data.itemProperties.matchedStatus === "matched" ||
              data.itemProperties.matchedStatus === "matchedWithThreshold"
            ? "item-matched"
            : "item-unmatched"
        }`}
      >
        <a
          href={`#itmdetail3wm-${index}`}
          data-toggle="collapse"
          role="button"
          aria-expanded={
            data.itemProperties.matchedStatus === "matched" ||
            data.itemProperties.matchedStatus === "matchedWithThreshold"
              ? "false"
              : "true"
          }
          area-controls={`#itmdetail3wm-${index}`}
          className="d-flex w-100 btnToggle clearfix"
        >
          <div className="col-12 px-0 d-flex">
            {/* Header Desktop Version - Start */}
            <div className="d-none d-lg-flex flex-wrap w-100">
              <div className="col-5 px-0">
                <p className="mb-0 gray-1">
                  {t("Items")}
                  {data.itemProperties.invoiceItemId.map((item, i) => {
                    return (
                      <span>
                        {item}{" "}
                        {i < data.itemProperties.invoiceItemId.length - 1
                          ? ", "
                          : " "}
                      </span>
                    );
                  })}
                </p>
                <h3 className="gray-1">
                  {`${
                    data.itemProperties.materialNumber &&
                    data.itemProperties.materialNumber !== ""
                      ? `${data.itemProperties.materialNumber}: `
                      : ""
                  }${data.itemProperties.materialDescription}`}
                </h3>
              </div>
              {this.renderMatchStatus()}
              <div className="col-2 d-none d-lg-inline-block">
                {!noSelectGR && !this.isNotStatus() && (
                  <div hidden={!isAllowSelectGR}>
                    <button
                      className="btn btn-wide pull-right mt-2"
                      id={`${index}-grButton`}
                    >
                      {t("Select GR")}
                    </button>
                  </div>
                )}
              </div>
              <div className="col-1">
                <i className="fa fa-chevron-up gray-1" aria-hidden="true" />
                <i className="fa fa-chevron-down gray-1" aria-hidden="true" />
              </div>
            </div>
            {/* Header Desktop Version - End */}

            {/* Header Mobile Version - Start */}
            <div className="d-flex d-lg-none px-0 w-100">
              <div className="col-10 px-0 d-flex flex-wrap align-items-center">
                <div className="col-5 px-0">
                  <h3 className="mb-0 gray-1">
                    <strong>
                      {t("Items")}{" "}
                      {data.itemProperties.invoiceItemId.map((item, i) => {
                        return (
                          <span>
                            {item}{" "}
                            {i < data.itemProperties.invoiceItemId.length - 1
                              ? ", "
                              : " "}
                          </span>
                        );
                      })}{" "}
                      :
                    </strong>
                  </h3>
                </div>
                {this.renderMatchStatus()}
              </div>

              <div className="col-2 col-lg-1 px-0 px-lg-3">
                <i className="fa fa-chevron-up gray-1" aria-hidden="true" />
                <i className="fa fa-chevron-down gray-1" aria-hidden="true" />
              </div>
            </div>
            {/* Header Mobile Version - End */}
          </div>
        </a>
        <div
          id={`itmdetail3wm-${index}`}
          className={`collapse multi-collapse w-100 ${
            data.itemProperties.matchedStatus === "matched" ||
            data.itemProperties.matchedStatus === "matchedWithThreshold"
              ? ""
              : "show"
          }`}
        >
          <div className="card card-body noborder pt-0">
            <div className="w-100 d-flex items-main-wrapper">
              {/* Mobile Information - Start */}
              <div className="col-12 d-flex d-lg-none flex-wrap px-0 border-top">
                {/* Descriptions List - Start */}
                <div className="col-8 py-3 pl-0">
                  <h3 className="gray-1">
                    {`${
                      data.itemProperties.materialNumber &&
                      data.itemProperties.materialNumber !== ""
                        ? `${data.itemProperties.materialNumber}: `
                        : ""
                    }${data.itemProperties.materialDescription}`}
                  </h3>
                </div>
                {/* Descriptions List - End */}

                {/* Select GR Button - Start */}
                <div className="col-4 py-3">
                  {!noSelectGR && !this.isNotStatus() && (
                    <div hidden={!isAllowSelectGR}>
                      <button
                        className="btn btn-wide pull-right mt-2"
                        id={`${index}-grButton-mobile`}
                      >
                        {t("Select GR")}
                      </button>
                    </div>
                  )}
                </div>
                {/* Select GR Button - End */}

                {/* PO / GR / Invoice No - Start */}
                <div className="col-7 pr-0 d-flex flex-wrap">
                  <p className="col-6 text-right px-0">{t("PO No")} :</p>
                  <p className="col-6 pl-1 pr-0">
                    {data.purchaseItem.poNumber}
                  </p>
                  <p className="col-6 text-right px-0">{t("GR No")} :</p>
                  <p className="col-6 pl-1 pr-0">
                    {data.goodsReceivedItems.items.map((item, i) => {
                      return (
                        <React.Fragment>
                          {item.grNumber}
                          <br />
                        </React.Fragment>
                      );
                    })}
                  </p>
                  <p className="col-6 text-right px-0">{t("Invoice No")} :</p>
                  <p className="col-6 pl-1 pr-0">
                    {data.invoiceItems.items.map((item, i) => {
                      return (
                        <React.Fragment>
                          {item.invNumber}
                          <br />
                        </React.Fragment>
                      );
                    })}
                  </p>
                </div>
                {/* PO / GR / Invoice No - End */}

                {/* Items List - Start */}
                <div className="col-5 px-0 d-flex flex-wrap">
                  <p className="col-7 text-right px-0">{t("Item No")}</p>
                  <p className="col-5 pl-1 pr-0">
                    {data.purchaseItem.poItemNo}
                    <br />
                  </p>
                  {data.goodsReceivedItems.items.map((item, i) => {
                    return (
                      <React.Fragment>
                        <p className="col-7 text-right px-0">{t("Item No")}</p>
                        <p className="col-5 pl-1 pr-0">
                          {item.grItemNo}
                          <br />
                        </p>
                      </React.Fragment>
                    );
                  })}

                  {data.invoiceItems.items.map((item, i) => {
                    return (
                      <React.Fragment>
                        <p className="col-7 text-right px-0">{t("Item No")}</p>
                        <p className="col-5 pl-1 pr-0">
                          {item.invItemNo}
                          <br />
                        </p>
                      </React.Fragment>
                    );
                  })}
                </div>
                {/* Items List - End */}

                {/* 3wm detail items - Start */}
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8 pl-0">
                    {this.renderCheck("UNIT_PRICE")}
                    <strong>{t("Unit Price")}</strong>
                    {data.itemProperties.matchedCode.UNIT_PRICE ===
                      "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"UNIT_PRICE"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )}
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.renderMoreDetail("UNIT_PRICE") ? (
                      <a
                        href={`#itmdetail3wm-${index}-item-detail-UNIT-PRICE`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#itmdetail3wm-${index}-item-detail-UNIT-PRICE`}
                        className="d-flex w-100 btnToggle purple justify-content-end"
                      >
                        <strong className="textOnHide">
                          {t("More Details")}
                        </strong>
                        <strong className="textOnShow">
                          {t("Less Details")}
                        </strong>
                      </a>
                    ) : (
                      this.renderText(
                        "UNIT_PRICE",
                        data.purchaseItem.poUnitPrice === "Multiple Value"
                          ? data.purchaseItem.poUnitPrice
                          : this.formatCurrency(
                              data.purchaseItem.poUnitPrice,
                              2
                            )
                      )
                    )}
                  </div>
                  <div
                    id={`itmdetail3wm-${index}-item-detail-UNIT-PRICE`}
                    className="col-12 px-0 mt-3 collapse multi-collapse"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("PO")}</p>
                        <p className="col-6 pr-0 text-right">
                          {data.purchaseItem.poNumber}
                          {", "}
                          {data.purchaseItem.poItemNo}
                          {" :"}
                        </p>
                        <p className="col-4 text-right pl-0">
                          {this.renderText(
                            "UNIT_PRICE",
                            data.purchaseItem.poUnitPrice === "Multiple Value"
                              ? data.purchaseItem.poUnitPrice
                              : this.formatCurrency(
                                  data.purchaseItem.poUnitPrice,
                                  2
                                )
                          )}
                        </p>
                      </div>
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("Invoice")}</p>
                        {data.invoiceItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.invNumber}
                                {", "}
                                {item.invItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "UNIT_PRICE",
                                  this.formatCurrency(item.invUnitPrice, 2)
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {/* <div className="col-4 text-right pl-0">
                    {this.renderText(
                      "UNIT_PRICE",
                      this.formatCurrency(data.purchaseItem.poUnitPrice, 2)
                    )}
                  </div> */}
                </div>
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8">
                    {this.renderCheck("PURCHASE_QUANTITY")}
                    <strong>{t("Quantity PO Vs INV")}</strong>
                    {data.itemProperties.matchedCode.PURCHASE_QUANTITY ===
                      "IN_TOLERANCE" && !this.isNotStatus()}
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.renderMoreDetail("PURCHASE_QUANTITY") ? (
                      <a
                        href={`#itmdetail3wm-${index}-item-detail-PURCHASE-QUANTITY`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#itmdetail3wm-${index}-item-detail-PURCHASE-QUANTITY`}
                        className="d-flex w-100 btnToggle purple justify-content-end"
                      >
                        <strong className="textOnHide">
                          {t("More Details")}
                        </strong>
                        <strong className="textOnShow">
                          {t("Less Details")}
                        </strong>
                      </a>
                    ) : (
                      this.renderText(
                        "PURCHASE_QUANTITY",
                        data.purchaseItem.poQuantity === "Multiple Value"
                          ? data.purchaseItem.poQuantity
                          : this.formatCurrency(data.purchaseItem.poQuantity, 3)
                      )
                    )}
                  </div>
                  <div
                    id={`itmdetail3wm-${index}-item-detail-PURCHASE-QUANTITY`}
                    className="col-12 px-0 mt-3 collapse multi-collapse"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("PO")}</p>
                        <p className="col-6 pr-0 text-right">
                          {data.purchaseItem.poNumber}
                          {", "}
                          {data.purchaseItem.poItemNo}
                          {" :"}
                        </p>
                        <p className="col-4 text-right pl-0">
                          -
                          {/* {this.renderText(
                            "QUANTITY",
                            data.goodsReceivedItems.grQuantity ===
                              "Multiple Value"
                              ? data.goodsReceivedItems.grQuantity
                              : this.formatCurrency(
                                  data.goodsReceivedItems.grQuantity,
                                  3
                                )
                          )} */}
                        </p>
                      </div>

                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("GR")}</p>

                        {data.goodsReceivedItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.grNumber}
                                {", "}
                                {item.grItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "PURCHASE_QUANTITY",
                                  this.formatCurrency(item.grItemQuantity, 3)
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("Invoice")}</p>
                        {data.invoiceItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.invNumber}
                                {", "}
                                {item.invItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "PURCHASE_QUANTITY",
                                  this.formatCurrency(item.invQuantity, 3)
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8">
                    {this.renderCheck("QUANTITY")}
                    <strong>{t("Quantity GR Vs INV")}</strong>
                    {data.itemProperties.matchedCode.QUANTITY ===
                      "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"QUANTITY"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )}
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.renderMoreDetail("QUANTITY") ? (
                      <a
                        href={`#itmdetail3wm-${index}-item-detail-QUANTITY`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#itmdetail3wm-${index}-item-detail-QUANTITY`}
                        className="d-flex w-100 btnToggle purple justify-content-end"
                      >
                        <strong className="textOnHide">
                          {t("More Details")}
                        </strong>
                        <strong className="textOnShow">
                          {t("Less Details")}
                        </strong>
                      </a>
                    ) : (
                      this.renderText(
                        "PURCHASE_QUANTITY",
                        data.goodsReceivedItems.grQuantity === "Multiple Value"
                          ? data.goodsReceivedItems.grQuantity
                          : this.formatCurrency(
                              data.goodsReceivedItems.grQuantity,
                              3
                            )
                      )
                    )}
                  </div>
                  <div
                    id={`itmdetail3wm-${index}-item-detail-QUANTITY`}
                    className="col-12 px-0 mt-3 collapse multi-collapse"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("GR")}</p>

                        {data.goodsReceivedItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.grNumber}
                                {", "}
                                {item.grItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "QUANTITY",
                                  this.formatCurrency(item.grItemQuantity, 3)
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("Invoice")}</p>
                        {data.invoiceItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.invNumber}
                                {", "}
                                {item.invItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "QUANTITY",
                                  this.formatCurrency(item.invQuantity, 3)
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8">
                    {this.renderCheck("UNIT")}
                    <strong>{t("Unit Description")}</strong>
                    {data.itemProperties.matchedCode.UNIT === "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"UNIT"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )}
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.renderMoreDetail("UNIT") ? (
                      <a
                        href={`#itmdetail3wm-${index}-item-detail-UNIT`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#itmdetail3wm-${index}-item-detail-UNIT`}
                        className="d-flex w-100 btnToggle purple justify-content-end"
                      >
                        <strong className="textOnHide">
                          {t("More Details")}
                        </strong>
                        <strong className="textOnShow">
                          {t("Less Details")}
                        </strong>
                      </a>
                    ) : (
                      this.renderText(
                        "UNIT",
                        data.purchaseItem.poUnitDescription
                      )
                    )}
                  </div>
                  <div
                    id={`itmdetail3wm-${index}-item-detail-UNIT`}
                    className="col-12 px-0 mt-3 collapse multi-collapse"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("PO")}</p>
                        <p className="col-6 pr-0 text-right">
                          {data.purchaseItem.poNumber}
                          {", "}
                          {data.purchaseItem.poItemNo}
                          {" :"}
                        </p>
                        <p className="col-4 text-right pl-0">
                          {this.renderText(
                            "UNIT",
                            data.purchaseItem.poUnitDescription
                          )}
                        </p>
                      </div>

                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("GR")}</p>

                        {data.goodsReceivedItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.grNumber}
                                {", "}
                                {item.grItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "UNIT",
                                  item.grItemUnitDescription
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("Invoice")}</p>
                        {data.invoiceItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.invNumber}
                                {", "}
                                {item.invItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "UNIT",
                                  item.invUnitDescription
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {/* <div className="col-4 text-right pl-0">
                    {this.renderText(
                      "UNIT",
                      data.purchaseItem.poUnitDescription
                    )}
                  </div> */}
                </div>
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8">
                    {this.renderCheck("PO_GR_DATE")}
                    <strong>{t("Date PO Vs GR")}</strong>
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.renderMoreDetail("PO_GR_DATE") ? (
                      <a
                        href={`#itmdetail3wm-${index}-item-detail-PO-GR-DATE`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#itmdetail3wm-${index}-item-detail-PO-GR-DATE`}
                        className="d-flex w-100 btnToggle purple justify-content-end"
                      >
                        <strong className="textOnHide">
                          {t("More Details")}
                        </strong>
                        <strong className="textOnShow">
                          {t("Less Details")}
                        </strong>
                      </a>
                    ) : (
                      this.renderText(
                        "PO_GR_DATE",
                        data.purchaseItem.poDate === "Multiple Value"
                          ? data.purchaseItem.poDate
                          : moment(data.purchaseItem.poDate).format(
                              "DD/MM/YYYY"
                            )
                      )
                    )}
                  </div>
                  <div
                    id={`itmdetail3wm-${index}-item-detail-PO-GR-DATE`}
                    className="col-12 px-0 mt-3 collapse multi-collapse"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("PO")}</p>
                        <p className="col-6 pr-0 text-right">
                          {data.purchaseItem.poNumber}
                          {", "}
                          {data.purchaseItem.poItemNo}
                          {" :"}
                        </p>
                        <p className="col-4 text-right pl-0">
                          {this.renderText(
                            "PO_GR_DATE",
                            moment(data.purchaseItem.poDate).format(
                              "DD/MM/YYYY"
                            )
                          )}
                        </p>
                      </div>

                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("GR")}</p>

                        {data.goodsReceivedItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.grNumber}
                                {", "}
                                {item.grItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "PO_GR_DATE",
                                  moment(item.grItemDate).format("DD/MM/YYYY")
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8">
                    {this.renderCheck("INVOICE_GR_DATE")}
                    <strong>{t("Date GR Vs Invoice")}</strong>
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.renderMoreDetail("INVOICE_GR_DATE") ? (
                      <a
                        href={`#itmdetail3wm-${index}-item-detail-INV-GR-DATE`}
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        area-controls={`#itmdetail3wm-${index}-item-detail-INV-GR-DATE`}
                        className="d-flex w-100 btnToggle purple justify-content-end"
                      >
                        <strong className="textOnHide">
                          {t("More Details")}
                        </strong>
                        <strong className="textOnShow">
                          {t("Less Details")}
                        </strong>
                      </a>
                    ) : (
                      this.renderText(
                        "INVOICE_GR_DATE",
                        data.goodsReceivedItems.grDate === "Multiple Value"
                          ? data.goodsReceivedItems.grDate
                          : moment(data.goodsReceivedItems.grDate).format(
                              "DD/MM/YYYY"
                            )
                      )
                    )}
                  </div>
                  <div
                    id={`itmdetail3wm-${index}-item-detail-INV-GR-DATE`}
                    className="col-12 px-0 mt-3 collapse multi-collapse"
                  >
                    <div className="d-flex flex-wrap">
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("GR")}</p>

                        {data.goodsReceivedItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.grNumber}
                                {", "}
                                {item.grItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "INVOICE_GR_DATE",
                                  moment(item.grItemDate).format("DD/MM/YYYY")
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="col-12 px-0 d-flex flex-wrap">
                        <p className="col-2 text-right px-0">{t("Invoice")}</p>
                        {data.invoiceItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              <p className="col-6 pr-0 text-right">
                                {item.invNumber}
                                {", "}
                                {item.invItemNo}
                                {" :"}
                              </p>
                              <p className="col-4 text-right pl-0">
                                {this.renderText(
                                  "INVOICE_GR_DATE",
                                  moment(item.invDate).format("DD/MM/YYYY")
                                )}
                              </p>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8">
                    {this.isNotStatus() ? (
                      this.blankComponent()
                    ) : (
                      <i className="fa fa-check c-green" />
                    )}
                    <strong>{t("Amount")}</strong>
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.formatCurrency(data.purchaseItem.poAmount, 2) || "-"}
                  </div>
                </div>
                <div className={`itmdetail3wm-items col-12 d-flex flex-wrap`}>
                  <div className="col-8">
                    {this.isNotStatus() ? (
                      this.blankComponent()
                    ) : (
                      <i className="fa fa-check c-green" />
                    )}
                    <strong>{t("Currency")}</strong>
                  </div>
                  <div className="col-4 text-right pl-0">
                    {this.renderText(
                      "CURRENCY",
                      data.goodsReceivedItems.grCurrency
                    )}
                  </div>
                </div>
                {/* 3wm detail items - End */}
              </div>
              {/* Mobile Information - End */}

              {/* Matching Details desktop version - Start */}
              <div className="col-12 d-none d-lg-flex flex-wrap">
                <div className="items col-2 px-0">
                  <p className="header bg-lightgray justify-content-center">
                    <strong>{t("Matching")}</strong>
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    <i className="fa fa-check c-white" />{" "}
                    <strong>{t("Item No")}</strong>
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.renderCheck("UNIT_PRICE")}
                    <strong>{t("Unit Price")}</strong>
                    {data.itemProperties.matchedCode.UNIT_PRICE ===
                      "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"UNIT_PRICE"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )}
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.renderCheck("PURCHASE_QUANTITY")}
                    <strong>{t("Quantity PO Vs INV")}</strong>
                    {data.itemProperties.matchedCode.PURCHASE_QUANTITY ===
                      "IN_TOLERANCE" && !this.isNotStatus()}
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.renderCheck("QUANTITY")}
                    <strong>{t("Quantity GR Vs INV")}</strong>
                    {data.itemProperties.matchedCode.QUANTITY ===
                      "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"QUANTITY"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )}
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.renderCheck("UNIT")}
                    <strong>{t("Unit Description")}</strong>
                    {data.itemProperties.matchedCode.UNIT === "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"UNIT"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )}
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.renderCheck("PO_GR_DATE")}
                    <strong>{t("Date PO Vs GR")}</strong>
                    {/* {data.itemProperties.matchedCode.PO_GR_DATE ===
                      "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"PO_GR_DATE"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )} */}
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.renderCheck("INVOICE_GR_DATE")}
                    <strong>{t("Date GR Vs Invoice")}</strong>
                    {/* {data.itemProperties.matchedCode.INVOICE_GR_DATE ===
                      "IN_TOLERANCE" &&
                      !this.isNotStatus() && (
                        <MatchDetailPopover
                          linearId={data.linearId}
                          type={"INVOICE_GR_DATE"}
                          companyTaxNumber={data.companyTaxNumber}
                        />
                      )} */}
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.isNotStatus() ? (
                      this.blankComponent()
                    ) : (
                      <i className="fa fa-check c-green" />
                    )}
                    <strong>{t("Amount")}</strong>
                  </p>
                  <p className="border-bottom border-1px border-gray d-flex align-items-center justify-content-start">
                    {this.isNotStatus() ? (
                      this.blankComponent()
                    ) : (
                      <i className="fa fa-check c-green" />
                    )}
                    <strong>{t("Currency")}</strong>
                  </p>
                </div>
                <div className="items col px-0">
                  <p className="header text-center bg-lightgray">
                    <strong>
                      {t("PO No")}
                      <br />
                      <a
                        className="link"
                        href={`/purchase-order-detail?linearId=${data.purchaseItem.poLinearId}&ref=3wm,${invoiceLinearId},${externalId}`}
                        target="_blank"
                      >
                        {data.purchaseItem.poNumber}
                      </a>
                      {/* {data.purchaseItem.poNumber || "-"} */}
                    </strong>
                  </p>
                  <p className="border-bottom border-1px border-gray text-center">
                    {data.purchaseItem.poItemNo || "-"}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center">
                    {this.renderText(
                      "UNIT_PRICE",
                      this.formatCurrency(data.purchaseItem.poUnitPrice, 2)
                    )}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center`}
                  >
                    {this.renderText(
                      "PURCHASE_QUANTITY",
                      this.formatCurrency(data.purchaseItem.poQuantity, 3)
                    )}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center">
                    -
                  </p>
                  <p className="border-bottom border-1px border-gray text-center">
                    {this.renderText(
                      "UNIT",
                      data.purchaseItem.poUnitDescription
                    )}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center`}
                  >
                    {this.renderText(
                      "PO_GR_DATE",
                      moment(data.purchaseItem.poDate).format("DD/MM/YYYY")
                    )}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center">
                    -
                  </p>
                  <p className="border-bottom border-1px border-gray text-center">
                    {this.formatCurrency(data.purchaseItem.poAmount, 2) || "-"}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center">
                    {data.purchaseItem.poCurrency || "-"}
                  </p>
                </div>
                <div className="items col px-0">
                  <p className="header text-center bg-gray">
                    <a
                      href="javascript:void(0);"
                      className="show-hidden"
                      data-before={isShowGR ? "gr-show" : "gr-hidden"}
                      data-after={isShowGR ? "gr-hidden" : "gr-show"}
                      data-status={isShowGR ? "show" : "hide"}
                      onClick={this.toggleShowGR}
                    >
                      <strong className="gray-1">
                        {t("GR Summary")}{" "}
                        <i
                          className={
                            isShowGR
                              ? "fa fa-chevron-left"
                              : "fa fa-chevron-right"
                          }
                          aria-hidden="true"
                        />{" "}
                      </strong>
                    </a>
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    {data.goodsReceivedItems.grNo || "-"}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {this.renderText(
                      "UNIT_PRICE",
                      data.goodsReceivedItems.grUnitPrice === "Multiple Value"
                        ? data.goodsReceivedItems.grUnitPrice
                        : this.formatCurrency(
                            data.goodsReceivedItems.grUnitPrice,
                            2
                          )
                    )}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    -
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {this.renderText(
                      "QUANTITY",
                      this.formatCurrency(data.goodsReceivedItems.grQuantity, 3)
                    )}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    {this.renderText(
                      "UNIT",
                      data.goodsReceivedItems.grUnitDescription
                    )}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {this.renderText(
                      "PO_GR_DATE",
                      data.goodsReceivedItems.grDate === "Multiple Value"
                        ? data.goodsReceivedItems.grDate
                        : moment(data.goodsReceivedItems.grDate).format(
                            "DD/MM/YYYY"
                          )
                    )}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {this.renderText(
                      "INVOICE_GR_DATE",
                      data.goodsReceivedItems.grDate === "Multiple Value"
                        ? data.goodsReceivedItems.grDate
                        : moment(data.goodsReceivedItems.grDate).format(
                            "DD/MM/YYYY"
                          )
                    )}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    -
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    {this.renderText(
                      "CURRENCY",
                      data.goodsReceivedItems.grCurrency
                    )}
                  </p>
                </div>
                <div
                  className={`col items-wrapper ${
                    isShowGR && data.goodsReceivedItems.items.length > 0
                      ? "gr-show"
                      : "gr-hidden"
                  }`}
                >
                  {data.goodsReceivedItems.items.map(item => {
                    return (
                      // <div
                      //   className={`items col-2 ${
                      //     isShowGR ? "gr-show" : "gr-hidden"
                      //     }`}
                      // >
                      <div className="items col px-0">
                        <p className="header text-center bg-gray">
                          <span>
                            {t("GR No")} <br />
                            {matchingType === "3wm" ? (
                              <a
                                className="link"
                                href={`/good-receives-detail?linearId=${item.grItemLinearId}&ref=3wm,${invoiceLinearId},${externalId}`}
                                target="_blank"
                              >
                                {item.grNumber}
                              </a>
                            ) : (
                              <a
                                className="link"
                                href={`/good-receives-detail?linearId=${item.grItemLinearId}&ref=doa,${invoiceLinearId},${externalId}`}
                                target="_blank"
                              >
                                {item.grNumber}
                              </a>
                            )}
                          </span>
                        </p>
                        <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                          {item.grItemNo || "-"}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("UNIT_PRICE") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText(
                            "UNIT_PRICE",
                            this.formatCurrency(item.grItemUnitPrice, 2)
                          )}
                        </p>
                        <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                          -
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("QUANTITY") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText(
                            "QUANTITY",
                            this.formatCurrency(item.grItemQuantity, 3)
                          )}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("UNIT") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText("UNIT", item.grItemUnitDescription)}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("PO_GR_DATE") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText(
                            "PO_GR_DATE",
                            moment(item.grItemDate).format("DD/MM/YYYY")
                          )}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("INVOICE_GR_DATE")
                              ? "text-danger"
                              : ""
                          }`}
                        >
                          {this.renderText(
                            "INVOICE_GR_DATE",
                            moment(item.grItemDate).format("DD/MM/YYYY")
                          )}
                        </p>
                        <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                          -
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("CURRENCY") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText("CURRENCY", item.grItemCurrency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="items col px-0">
                  <p className="header text-center bg-gray">
                    <a
                      href="javascript:void(0);"
                      className="show-hidden"
                      data-before={isShowINV ? "gr-show" : "gr-hidden"}
                      data-after={isShowINV ? "gr-hidden" : "gr-show"}
                      data-status={isShowINV ? "show" : "hide"}
                      onClick={this.toggleShowINV}
                    >
                      <strong className="gray-1">
                        {t("Invoice Summary")}{" "}
                        <i
                          className={
                            isShowINV
                              ? "fa fa-chevron-left"
                              : "fa fa-chevron-right"
                          }
                          aria-hidden="true"
                        />{" "}
                      </strong>
                    </a>
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    {data.invoiceItems.invNo || "-"}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {this.renderText(
                      "UNIT_PRICE",
                      data.invoiceItems.invUnitPrice === "Multiple Value"
                        ? data.invoiceItems.invUnitPrice
                        : this.formatCurrency(data.invoiceItems.invUnitPrice, 2)
                    )}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {this.renderText(
                      "PURCHASE_QUANTITY",
                      this.formatCurrency(data.invoiceItems.invQuantity, 3)
                    )}
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {this.renderText(
                      "QUANTITY",
                      this.formatCurrency(data.invoiceItems.invQuantity, 3)
                    )}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    {this.renderText(
                      "UNIT",
                      data.invoiceItems.invUnitDescription
                    )}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    -
                  </p>
                  <p
                    className={`border-bottom border-1px border-gray text-center bg-lightgray-3`}
                  >
                    {data.invoiceItems.invDate
                      ? this.renderText(
                          "INVOICE_GR_DATE",
                          data.invoiceItems.invDate === "Multiple Value"
                            ? data.invoiceItems.invDate
                            : moment(data.invoiceItems.invDate).format(
                                "DD/MM/YYYY"
                              )
                        )
                      : "-"}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    {data.invoiceItems.invAmount === "Multiple Value"
                      ? data.invoiceItems.invAmount
                      : this.formatCurrency(data.invoiceItems.invAmount, 2) ||
                        "-"}
                  </p>
                  <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                    {data.invoiceItems.invCurrency || "-"}
                  </p>
                </div>
                <div
                  className={`col items-wrapper ${
                    isShowINV && data.invoiceItems.items.length > 0
                      ? "gr-show"
                      : "gr-hidden"
                  }`}
                >
                  {data.invoiceItems.items.map(item => {
                    return (
                      <div className="items col px-0">
                        <p className="header text-center bg-gray">
                          {t("Invoice No")}
                          <br />
                          {item.invNumber || "-"}
                        </p>
                        <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                          {item.invItemNo || "-"}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("UNIT_PRICE") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText(
                            "UNIT_PRICE",
                            this.formatCurrency(item.invUnitPrice, 2)
                          )}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("PURCHASE_QUANTITY")
                              ? "text-danger"
                              : ""
                          }`}
                        >
                          {this.renderText(
                            "PURCHASE_QUANTITY",
                            this.formatCurrency(item.invQuantity, 3)
                          )}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("QUANTITY") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText(
                            "QUANTITY",
                            this.formatCurrency(item.invQuantity, 3)
                          )}
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("UNIT") ? "text-danger" : ""
                          }`}
                        >
                          {this.renderText("UNIT", item.invUnitDescription)}
                        </p>
                        <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                          -
                        </p>
                        <p
                          className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                            this.isUnmatched("INVOICE_GR_DATE")
                              ? "text-danger"
                              : ""
                          }`}
                        >
                          {this.renderText(
                            "INVOICE_GR_DATE",
                            moment(item.invDate).format("DD/MM/YYYY")
                          )}
                        </p>
                        <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                          {this.formatCurrency(item.invAmount, 2) || "-"}
                        </p>
                        <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                          {item.invCurrency || "-"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Matching Details desktop version - End */}

            {/* Matching Details mobile version - Start */}

            {/* Matching Details mobile version - End */}
          </div>
        </div>
        {!noSelectGR && (
          <ModalSelectGr
            isGrTableVisible={isGrTableVisible}
            toggleGrListModal={this.toggleGrListModal}
            submitTagedGR={this.submitTagedGR}
            clickCheckAll={this.clickCheckAll}
            clickCheck={this.clickCheck}
            checkAll={checkAll}
            data={grList}
            companyTaxNumber={data.companyTaxNumber}
            matchingItem={data}
            matchingType={matchingType}
            maxValue={this.props.maxValue}
            minValue={this.props.minValue}
          />
        )}
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
        <ModalAlert visible={this.state.isLoading} isTextOnly={true}>
          <strong>
            Processing <i className="fa fa-spinner fa-spin" />
          </strong>
        </ModalAlert>
      </div>
    );
  }
}

export default withTranslation(["threeway-detail"])(ThreeWayMatchingItem);
