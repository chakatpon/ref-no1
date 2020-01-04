
import React, { Component } from "react";
import { withTranslation } from "~/i18n";
import ModalSelectGr from "./modalSelectGr";
import ModalAlert from "./modalAlert";
import GA from "~/libs/ga";

class MatchingItem extends Component {
  constructor(props) {
    super(props);
    this.toggleGrListModal = this.toggleGrListModal.bind(this);
    this.submitTagedGR = this.submitTagedGR.bind(this);
    this.dismissAlertModal = this.dismissAlertModal.bind(this);
    this.state = {
      rows: [],
      selectedIndexes: [],
      isShowGR: false,
      isGrTableVisible: false,
      buttonGrTable: [],
      data: [],
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
    const _this = this;
    $(`#${this.props.index}-grButton`).click(function (e) {
      _this.toggleGrListModal();
      return false;
    });
    $(`#${this.props.index}-grButton-mobile`).click(function (e) {
      _this.toggleGrListModal();
      return false;
    });

    await this.fetchGr();
    this.resolvePermissionSelectGR();
  }

  fetchGr = async () => {
    const goodsReceivedItems = this.props.value.goodsReceivedItems.items.map(
      item => ({ ...item.originalGr })
    );
    const purchaseItemLinearId = this.props.value.purchaseItemLinearId;

    if (purchaseItemLinearId && this.props.getTagGR) {
      const res = await this.props.getTagGR(
        purchaseItemLinearId,
        goodsReceivedItems
      );
      if (res.data.length > 0) {
        this.setState({
          data: res.data
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

  async toggleGrListModal(e) {
    this.setState({
      isGrTableVisible: !this.state.isGrTableVisible
    });
    await this.fetchGr();
  }

  setObjTaggedGR = async GRObj => {
    let tagedGRObj = {};
      tagedGRObj = {
        linearId: this.props.creditNoteLinearId,
        creditNoteItems: [
          { linearId: this.props.value.linearId, goodsReceivedItems: GRObj }
        ]
      };
    
    return tagedGRObj;
  };

  async submitTagedGR() {
    GA.event({
      category: "2WM",
      action: "2WM Tag GR (Request)",
      label: moment().format()
    });

    this.toggleGrListModal();
    let taggedGR = this.state.data.filter(item => {
      return item.tagged;
    });

    let GRObj = taggedGR.map(item => {
      let obj = {
        linearId: item.linearId
      };
      return obj;
    });

    const tagedGRObj = await this.setObjTaggedGR(GRObj);

    try {
      this.setState({
        isLoading: true
      });
      const res = await this.props.submitTagGr(tagedGRObj);
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
        category: "2WM",
        action: "2WM Tag GR (Success)",
        label: moment().format()
      });

      this.props.reloadPageAfterTaggedGR();
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
          msg = [
            "Sorry, you cannot save tagged GR of this two way matching.",
            <br />,
            "Please contact your administrator."
          ];
        
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
          category: "2WM",
          action: "2WM Tag GR (Failed)",
          label: moment().format()
        });
      }
    }
  }

  dismissAlertAndSelectGRModal = () => {
    this.toggleGrListModal();
    this.setState({ isAlertModalVisible: false });
  };

  dismissAlertModal() {
    this.setState({ isAlertModalVisible: false });
  }

  clickCheckAll = (data, checkAll) => {
    this.setState({
      checkAll,
      data
    });
  };

  clickCheck = data => {
    this.setState({
      data
    });
  };

  renderSumary = () => {
    return this.formatCurrency(
      this.state.data
        .filter(item => item.tagged)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.quantity.initial,
          0
        ),
      3
    );
  };

  renderMatchStatus = () => {
    const { value, lifeCycle } = this.props;

    if (this.isNotStatus()) {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <h3 className="indicator mt-2">
            <strong />
          </h3>
        </div>
      );
    }

    if (value.matchedStatus === "matched" && lifeCycle !== "ISSUED") {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0">&nbsp;</p>
          <h3 className="indicator">
            <strong>Matched</strong>
          </h3>
        </div>
      );
    } else if (value.matchedStatus === "matchedWithThreshold") {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0">&nbsp;</p>
          <h3 className="indicator" style={this.style.matchedWithinThreshold}>
            <strong>Matched Within Threshold</strong>
          </h3>
        </div>
      );
    }
    if (value.matchedStatus === "matched" && lifeCycle === "ISSUED") {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0">&nbsp;</p>
          <h3 className="indicator">
            <strong />
          </h3>
        </div>
      );
    } else if (value.lifecycle === "ISSUED") {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="mb-0">&nbsp;</p>
          <h3 className="indicator">
            <strong />
          </h3>
        </div>
      );
    } else {
      return (
        <div className="col-7 col-lg-4 px-0 px-lg-3">
          <p className="indicator mb-0 d-none d-lg-inline-block">
            Unmatched Reason
          </p>
          <h3 className="indicator pb-0">
            <strong>{value.unmatchedReason}</strong>
          </h3>
        </div>
      );
    }
  };

  blankComponent = () => {
    return <i className="fa fa-check c-white" />;
  };

  isNotStatus = () => {
    return (
      this.props.lifecycleForNotRunMatching &&
      this.props.lifecycleForNotRunMatching.includes(this.props.lifeCycle)
    );
  };

  isUnmatched = unmatchedType => {
    if (this.isNotStatus()) {
      return false;
    }
    return (
      this.props.value.unmatchedCode &&
      this.props.value.unmatchedCode.includes(
        this.getUnmatchCode(unmatchedType)
      )
    );
  };

  getUnmatchCode = unmatchedType => {
    if (unmatchedType === "PURCHASE_QUANTITY") {
      return "QUANTITY";
    }
    return unmatchedType;
  };

  renderCheck = unmatchedType => {
    const { value } = this.props;
    if (this.isNotStatus()) {
      return this.blankComponent();
    }

    if (this.isUnmatched(unmatchedType)) {
      return (
        <React.Fragment>
          <i className="fa fa-times c-red" />{" "}
        </React.Fragment>
      );
    } else {
      if (value.matchedCode[unmatchedType] === "IN_TOLERANCE") {
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

  renderText = (unmatchedType, data) => {
    const { value } = this.props;

    if (this.props.lifecycleForNotRunMatching.includes(this.props.lifeCycle)) {
      return !data || data === "Invalid date" ? "-" : data;
    }

    if (this.isUnmatched(unmatchedType)) {
      return (
        <strong className="c-red">
          {!data || data === "Invalid date" ? "-" : data}
        </strong>
      );
    }
    if (value.matchedCode[unmatchedType] === "IN_TOLERANCE") {
      return (
        <strong style={this.style.matchedWithinThreshold}>
          {!data || data === "Invalid date" ? "-" : data}
        </strong>
      );
    }
    return !data || data === "Invalid date" ? "-" : data;
  };

  resolvePermissionSelectGR() {
    let isAllowSelectGR = false;
    if (this.props.lifecycleTag.includes(this.props.lifeCycle)) {
      if (this.props.auth.includes(this.props.permission)) {
        if (this.props.userType == "BUYER") {
          isAllowSelectGR = true;
        }
      }
    }
    this.setState({
      isAllowSelectGR: isAllowSelectGR
    });
  }

  toggleShowGR = () => {
    if (this.state.isShowGR) {
      this.setState({
        isShowGR: false
      });
    } else {
      this.setState({
        isShowGR: true
      });
    }
  };

  formatCurrency = (amount, digit) => {
    if (!amount) return 0;
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: digit,
      minimumFractionDigits: digit
    }).format(amount);
  };

  render() {
    const {
      value,
      index,
      t
    } = this.props;
    const {
      isShowGR,
      isGrTableVisible,
      isAlertModalVisible,
      alertModalAlertTitle,
      isTextOnly,
      alertModalMsg,
      buttonAlert,
      isAllowSelectGR
    } = this.state;

    return (
      <div
        className={`row box ${
          value.matchedStatus === "" || this.isNotStatus()
            ? "item-matched"
            : value.matchedStatus === "matched" ||
              value.matchedStatus === "matchedWithThreshold"
              ? "item-matched"
              : "item-unmatched"
          }`}
      >
        {" "}
        <a
          href={`#itmdetail2wm-${index}`}
          data-toggle="collapse"
          role="button"
          aria-expanded={
            value.matchedStatus === "matched" ||
              value.matchedStatus === "matchedWithThreshold"
              ? "false"
              : "true"
          }
          area-controls={`#itmdetail2wm${index}`}
          className="d-flex w-100 btnToggle clearfix"
        >
          <div className="col-12 px-0 d-flex">
            {/* Header Desktop Version - Start */}
            <div className="d-none d-lg-flex flex-wrap w-100">
              <div className="col-5 px-0">
                <p className="mb-0 gray-1">{t("Items")} {value.itemId}:</p>
                <h3 className="gray-1">
                  {`${
                    value.materialNumber && value.materialNumber !== ""
                      ? `${value.materialNumber}: `
                      : ""
                    }${value.materialDescription}`}
                </h3>
              </div>

              {this.renderMatchStatus()}
              <div className="col-2 d-none d-lg-inline-block">
                {!this.props.noSelectGR && !this.isNotStatus() && (
                  <div hidden={!isAllowSelectGR}>
                    <button
                      className="btn btn-wide pull-right mt-2"
                      id={`${index}-grButton`}
                    >
                      Select GR
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
            <div className="d-flex d-lg-none px-0 w-100 flex-wrap">
              <div className="col-12 px-0 d-flex flex-wrap align-items-center">
                <div className="col-3 px-0">
                  <p className="mb-0 gray-1">{t("Items")} {value.itemId}:</p>
                </div>
                {this.renderMatchStatus()}
                <div className="col-2 col-lg-1 px-0 px-lg-3">
                  <i className="fa fa-chevron-up gray-1" aria-hidden="true" />
                  <i className="fa fa-chevron-down gray-1" aria-hidden="true" />
                </div>
              </div>
            </div>
            {/* Header Mobile Version - End */}
          </div>
        </a>
        <div
          id={`itmdetail2wm-${index}`}
          className={`collapse multi-collapse mt-0 mt-lg-3 w-100 ${
            value.matchedStatus === "matched" ||
              value.matchedStatus === "matchedWithThreshold"
              ? ""
              : "show"
            }`}
        >
          
              <div className="card card-body noborder">
                <div className="w-100 d-flex flex-wrap items-wrapper">
                  {/* Mobile Information - Start */}
                  <div className="col-12 px-0 d-flex flex-wrap d-lg-none align-items-center">
                    {/* Descriptions List - Start */}
                    <div
                      className={`${!isAllowSelectGR ? "col-12" : "col-8"} pl-0`}
                    >
                      <h3
                        className={`mb-0 pb-0 gray-1 ${
                          !isAllowSelectGR ? "" : "word-wrap"
                          }`}
                      >
                        {`${
                          value.materialNumber && value.materialNumber !== ""
                            ? `${value.materialNumber}: `
                            : ""
                          }${value.materialDescription}`}
                      </h3>
                    </div>
                    {/* Descriptions List - End */}

                    {/* Select GR Button - Start */}
                    <div
                      className={`${
                        !isAllowSelectGR ? "d-none" : "col-4"
                        } px-0 text-right`}
                    >
                      {!this.props.noSelectGR && !this.isNotStatus() && (
                        <div hidden={!isAllowSelectGR}>
                          <button
                            className="btn btn-wide pull-right mt-2"
                            id={`${index}-grButton-mobile`}
                          >
                            Select GR
                        </button>
                        </div>
                      )}
                    </div>
                    {/* Select GR Button - End */}

                    {/* GR / CN No - Start */}
                    <div className="col-7 pr-0 d-flex flex-wrap mt-3">
                      <p className="col-4 text-right px-0">{t("GR No")} :</p>
                      <p className="col-8 pl-1 pr-0">
                        {value.goodsReceivedItems.items.map((item, i) => {
                          return (
                            <React.Fragment>
                              {item.grNumber}
                              <br />
                            </React.Fragment>
                          );
                        })}
                      </p>
                      <p className="col-4 text-right px-0">{t("CN No")} :</p>
                      <p className="col-8 pl-1 pr-0">
                        {value.creditnoteItems.externalId}
                      </p>
                    </div>
                    {/* PO / GR / Invoice No - End */}

                    {/* Items List - Start */}
                    <div className="col-5 px-0 d-flex flex-wrap mt-3">
                      {value.goodsReceivedItems.items.map((item, i) => {
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
                      <p className="col-7 text-right px-0">{t("Item No")}</p>
                      <p className="col-5 pl-1 pr-0">
                        {value.creditnoteItems.itemId || "-"}
                        <br />
                      </p>
                    </div>
                    {/* Items List - End */}

                    {/* 2wm detail items - Start */}

                    <div className={`itmdetail2wm-items col-12 d-flex flex-wrap`}>
                      <div className="col-7">
                        {this.renderCheck("UNIT_PRICE")}
                        <strong>{t("Unit Price")}</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </div>
                      <div
                        className={`col-5 text-right pl-0 ${
                          this.isUnmatched("UNIT_PRICE") ? "text-danger" : ""
                          } `}
                      >
                        {this.isUnmatched("UNIT_PRICE") ? (
                          <React.Fragment>
                            <a
                              href={`#itmdetail2wm-${index}-item-detail-unit-price`}
                              data-toggle="collapse"
                              role="button"
                              aria-expanded="false"
                              area-controls={`#itmdetail2wm-${index}-item-detail-unit-price`}
                              className="d-flex w-100 btnToggle purple justify-content-end"
                            >
                              <strong className="textOnHide">More Details</strong>
                              <strong className="textOnShow">Less Details</strong>
                            </a>
                          </React.Fragment>
                        ) : (
                            this.renderText(
                              "UNIT_PRICE",
                              this.formatCurrency(
                                value.creditnoteItems.unitPrice,
                                2
                              )
                            )
                          )}
                      </div>
                    </div>

                    <div
                      id={`itmdetail2wm-${index}-item-detail-unit-price`}
                      className="col-12 px-0 pt-3 collapse multi-collapse"
                    >
                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">GR</p>
                          <p className="col-6 pr-0 text-right">
                            {value.goodsReceivedItems.items.map((item, i) => {
                              return (
                                <React.Fragment>
                                  {item.grNumber}
                                  {", "}
                                  {item.grItemNo || "-"}
                                  {" :"}
                                  <br />
                                </React.Fragment>
                              );
                            })}
                          </p>
                          <p className="col-4 text-right pr-1">
                            {value.goodsReceivedItems.items.map(item => {
                              return (
                                <React.Fragment>
                                  {this.renderText(
                                    "UNIT_PRICE",
                                    this.formatCurrency(item.grItemUnitPrice, 2)
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">CN</p>
                          <p className="col-6 pr-0 text-right">
                            <React.Fragment>
                              {value.creditnoteItems.externalId}
                              {", "}
                              {value.creditnoteItems.itemId || "-"}
                              {" :"}
                              <br />
                            </React.Fragment>
                          </p>
                          <p className="col-4 text-right pl-0">
                            <React.Fragment>
                              {this.renderText(
                                "UNIT_PRICE",
                                this.formatCurrency(
                                  value.creditnoteItems.unitPrice,
                                  2
                                )
                              )}
                            </React.Fragment>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`itmdetail2wm-items col-12 d-flex flex-wrap`}>
                      <div className="col-7">
                        {this.renderCheck("PURCHASE_QUANTITY")}
                        <strong>Quantity</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </div>
                      <div
                        className={`col-5 text-right pl-0 ${
                          this.isUnmatched("PURCHASE_QUANTITY")
                            ? "text-danger"
                            : ""
                          } `}
                      >
                        {this.isUnmatched("PURCHASE_QUANTITY") ? (
                          <React.Fragment>
                            <a
                              href={`#itmdetail2wm-item-detail-purchase-quantity-${index}`}
                              data-toggle="collapse"
                              role="button"
                              aria-expanded="false"
                              area-controls={`#itmdetail2wm-item-detail-purchase-quantity-${index}`}
                              className="d-flex w-100 btnToggle purple justify-content-end"
                            >
                              <strong className="textOnHide">More Details</strong>
                              <strong className="textOnShow">Less Details</strong>
                            </a>
                          </React.Fragment>
                        ) : (
                            this.renderText(
                              "PURCHASE_QUANTITY",
                              this.formatCurrency(value.creditnoteItems.quantity, 3)
                            )
                          )}
                      </div>
                    </div>

                    <div
                      id={`itmdetail2wm-item-detail-purchase-quantity-${index}`}
                      className="col-12 px-0 pt-3 collapse multi-collapse"
                    >
                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">GR</p>
                          <p className="col-6 pr-0 text-right">
                            {value.goodsReceivedItems.items.map((item, i) => {
                              return (
                                <React.Fragment>
                                  {item.grNumber}
                                  {", "}
                                  {item.grItemNo || "-"}
                                  {" :"}
                                  <br />
                                </React.Fragment>
                              );
                            })}
                          </p>
                          <p className="col-4 text-right pl-0">
                            {value.goodsReceivedItems.items.map(item => {
                              return (
                                <React.Fragment>
                                  {this.renderText(
                                    "PURCHASE_QUANTITY",
                                    this.formatCurrency(item.grItemQuantity, 3)
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">CN</p>
                          <p className="col-6 pr-0 text-right">
                            <React.Fragment>
                              {value.creditnoteItems.externalId}
                              {", "}
                              {value.creditnoteItems.itemId || "-"}
                              {" :"}
                              <br />
                            </React.Fragment>
                          </p>
                          <p className="col-4 text-right pl-0">
                            <React.Fragment>
                              {this.renderText(
                                "PURCHASE_QUANTITY",
                                this.formatCurrency(
                                  value.creditnoteItems.quantity,
                                  3
                                )
                              )}
                            </React.Fragment>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`itmdetail2wm-items col-12 d-flex flex-wrap`}>
                      <div className="col-7">
                        {this.renderCheck("UNIT")}
                        <strong>Unit Description</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </div>
                      <div
                        className={`col-5 text-right pl-0 ${
                          this.isUnmatched("UNIT") ? "text-danger" : ""
                          } `}
                      >
                        {this.isUnmatched("UNIT") ? (
                          <React.Fragment>
                            <a
                              href={`#itmdetail2wm-item-detail-unit-${index}`}
                              data-toggle="collapse"
                              role="button"
                              aria-expanded="false"
                              area-controls={`#itmdetail2wm-item-detail-unit-${index}`}
                              className="d-flex w-100 btnToggle purple justify-content-end"
                            >
                              <strong className="textOnHide">More Details</strong>
                              <strong className="textOnShow">Less Details</strong>
                            </a>
                          </React.Fragment>
                        ) : (
                            this.renderText(
                              "UNIT",
                              value.creditnoteItems.unitDescription
                            )
                          )}
                      </div>
                    </div>

                    <div
                      id={`itmdetail2wm-item-detail-unit-${index}`}
                      className="col-12 px-0 pt-3 collapse multi-collapse"
                    >
                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">GR</p>
                          <p className="col-6 pr-0 text-right">
                            {value.goodsReceivedItems.items.map((item, i) => {
                              return (
                                <React.Fragment>
                                  {item.grNumber}
                                  {", "}
                                  {item.grItemNo || "-"}
                                  {" :"}
                                  <br />
                                </React.Fragment>
                              );
                            })}
                          </p>
                          <p className="col-4 text-right pl-0">
                            {value.goodsReceivedItems.items.map(item => {
                              return (
                                <React.Fragment>
                                  {this.renderText(
                                    "UNIT",

                                    item.grItemUnitDescription
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">CN</p>
                          <p className="col-6 pr-0 text-right">
                            <React.Fragment>
                              {value.creditnoteItems.externalId}
                              {", "}
                              {value.creditnoteItems.itemId || "-"}
                              {" :"}
                              <br />
                            </React.Fragment>
                          </p>
                          <p className="col-4 text-right pl-0">
                            <React.Fragment>
                              {this.renderText(
                                "UNIT",
                                value.creditnoteItems.unitDescription
                              )}
                            </React.Fragment>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`itmdetail2wm-items col-12 d-flex flex-wrap`}>
                      <div className="col-7">
                        {this.renderCheck("DATE")}
                        <strong>Date</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </div>
                      <div
                        className={`col-5 text-right pl-0 ${
                          this.isUnmatched("DATE") ? "text-danger" : ""
                          } `}
                      >
                        {this.isUnmatched("DATE") ? (
                          <React.Fragment>
                            <a
                              href={`#itmdetail2wm-item-detail-date-${index}`}
                              data-toggle="collapse"
                              role="button"
                              aria-expanded="false"
                              area-controls={`#itmdetail2wm-item-detail-date-${index}`}
                              className="d-flex w-100 btnToggle purple justify-content-end"
                            >
                              <strong className="textOnHide">More Details</strong>
                              <strong className="textOnShow">Less Details</strong>
                            </a>
                          </React.Fragment>
                        ) : (
                            this.renderText(
                              "DATE",
                              moment(value.creditnoteItems.date).format(
                                "DD/MM/YYYY"
                              )
                            )
                          )}
                      </div>
                    </div>

                    <div
                      id={`itmdetail2wm-item-detail-date-${index}`}
                      className="col-12 px-0 pt-3 collapse multi-collapse"
                    >
                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">GR</p>
                          <p className="col-6 pr-0 text-right">
                            {value.goodsReceivedItems.items.map((item, i) => {
                              return (
                                <React.Fragment>
                                  {item.grNumber}
                                  {", "}
                                  {item.grItemNo || "-"}
                                  {" :"}
                                  <br />
                                </React.Fragment>
                              );
                            })}
                          </p>
                          <p className="col-4 text-right pl-0">
                            {value.goodsReceivedItems.items.map(item => {
                              return (
                                <React.Fragment>
                                  {this.renderText(
                                    "DATE",
                                    moment(item.grItemDate).format("DD/MM/YYYY")
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">CN</p>
                          <p className="col-6 pr-0 text-right">
                            <React.Fragment>
                              {value.creditnoteItems.externalId}
                              {", "}
                              {value.creditnoteItems.itemId || "-"}
                              {" :"}
                              <br />
                            </React.Fragment>
                          </p>
                          <p className="col-4 text-right pl-0">
                            <React.Fragment>
                              {this.renderText(
                                "DATE",
                                moment(value.creditnoteItems.date).format(
                                  "DD/MM/YYYY"
                                )
                              )}
                            </React.Fragment>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`itmdetail2wm-items col-12 d-flex flex-wrap`}>
                      <div className="col-7">
                        {this.renderCheck("AMOUNT")}
                        <strong>Amount</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </div>
                      <div
                        className={`col-5 text-right pl-0 ${
                          this.isUnmatched("AMOUNT") ? "text-danger" : ""
                          } `}
                      >
                        {this.isUnmatched("AMOUNT") ? (
                          <React.Fragment>
                            <a
                              href={`#itmdetail2wm-item-detail-amount-${index}`}
                              data-toggle="collapse"
                              role="button"
                              aria-expanded="false"
                              area-controls={`#itmdetail2wm-item-detail-amount-${index}`}
                              className="d-flex w-100 btnToggle purple justify-content-end"
                            >
                              <strong className="textOnHide">More Details</strong>
                              <strong className="textOnShow">Less Details</strong>
                            </a>
                          </React.Fragment>
                        ) : (
                            this.renderText(
                              "AMOUNT",
                              this.formatCurrency(value.creditnoteItems.amount, 2)
                            )
                          )}
                      </div>
                    </div>

                    <div
                      id={`itmdetail2wm-item-detail-amount-${index}`}
                      className="col-12 px-0 pt-3 collapse multi-collapse"
                    >
                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">GR</p>
                          <p className="col-6 pr-0 text-right">
                            {value.goodsReceivedItems.items.map((item, i) => {
                              return (
                                <React.Fragment>
                                  {item.grNumber}
                                  {", "}
                                  {item.grItemNo || "-"}
                                  {" :"}
                                  <br />
                                </React.Fragment>
                              );
                            })}
                          </p>
                          <p className="col-4 text-right pl-0">
                            {value.goodsReceivedItems.items.map(item => {
                              return (
                                <React.Fragment>
                                  {this.renderText(
                                    "AMOUNT",
                                    this.formatCurrency(item.grItemAmount, 2)
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">CN</p>
                          <p className="col-6 pr-0 text-right">
                            <React.Fragment>
                              {value.creditnoteItems.externalId}
                              {", "}
                              {value.creditnoteItems.itemId || "-"}
                              {" :"}
                              <br />
                            </React.Fragment>
                          </p>
                          <p className="col-4 text-right pl-0">
                            <React.Fragment>
                              {this.renderText(
                                "AMOUNT",
                                this.formatCurrency(
                                  value.creditnoteItems.amount,
                                  2
                                )
                              )}
                            </React.Fragment>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`itmdetail2wm-items col-12 d-flex flex-wrap`}>
                      <div className="col-7">
                        {this.renderCheck("CURRENCY")}
                        <strong>Currency</strong>
                      </div>
                      <div className={`col-5 text-right pl-0`}>-</div>
                    </div>

                    <div className={`itmdetail2wm-items col-12 d-flex flex-wrap`}>
                      <div className="col-7">
                        {this.renderCheck("CURRENCY")}
                        <strong>Currency</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </div>
                      <div
                        className={`col-5 text-right pl-0 ${
                          this.isUnmatched("CURRENCY") ? "text-danger" : ""
                          } `}
                      >
                        {this.isUnmatched("CURRENCY") ? (
                          <React.Fragment>
                            <a
                              href={`#itmdetail2wm-item-detail-currency-${index}`}
                              data-toggle="collapse"
                              role="button"
                              aria-expanded="false"
                              area-controls={`#itmdetail2wm-item-detail-currency-${index}`}
                              className="d-flex w-100 btnToggle purple justify-content-end"
                            >
                              <strong className="textOnHide">More Details</strong>
                              <strong className="textOnShow">Less Details</strong>
                            </a>
                          </React.Fragment>
                        ) : (
                            this.renderText(
                              "CURRENCY",
                              value.creditnoteItems.currency
                            )
                          )}
                      </div>
                    </div>

                    <div
                      id={`itmdetail2wm-item-detail-currency-${index}`}
                      className="col-12 px-0 pt-3 collapse multi-collapse"
                    >
                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">GR</p>
                          <p className="col-6 pr-0 text-right">
                            {value.goodsReceivedItems.items.map((item, i) => {
                              return (
                                <React.Fragment>
                                  {item.grNumber}
                                  {", "}
                                  {item.grItemNo || "-"}
                                  {" :"}
                                  <br />
                                </React.Fragment>
                              );
                            })}
                          </p>
                          <p className="col-4 text-right pl-0">
                            {value.goodsReceivedItems.items.map(item => {
                              return (
                                <React.Fragment>
                                  {this.renderText(
                                    "CURRENCY",

                                    item.grItemCurrency
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap">
                        <div className="col-12 px-0 d-flex flex-wrap">
                          <p className="col-2 text-right px-0">CN</p>
                          <p className="col-6 pr-0 text-right">
                            <React.Fragment>
                              {value.creditnoteItems.externalId}
                              {", "}
                              {value.creditnoteItems.itemId || "-"}
                              {" :"}
                              <br />
                            </React.Fragment>
                          </p>
                          <p className="col-4 text-right pl-0">
                            <React.Fragment>
                              {this.renderText(
                                "CURRENCY",
                                value.creditnoteItems.currency
                              )}
                            </React.Fragment>
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* 2wm detail items - End */}
                  </div>
                  {/* Mobile Information - End */}

                  {/* Matching Details desktop version - Start */}
                  <div className="col-12 d-none d-lg-flex flex-wrap">
                    <div className="items col-2 px-0">
                      <p className="header bg-lightgray">
                        <strong>{t("Matching")}</strong>
                      </p>
                      <p className="border-bottom border-1px border-gray d-flex align-items-center">
                        <i className="fa fa-check c-white" />{" "}
                        <strong>{t("Item No")}</strong>
                      </p>
                      <p className="border-bottom border-1px border-gray d-flex align-items-center">
                        {this.renderCheck("UNIT_PRICE")}
                        <strong>{t("Unit Price")}</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray d-flex align-items-center">
                        {this.renderCheck("PURCHASE_QUANTITY")}
                        <strong>{t("Quantity")}</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray d-flex align-items-center">
                        {this.renderCheck("UNIT")}
                        <strong>{t("Unit Description")}</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray d-flex align-items-center">
                        {this.renderCheck("DATE")}
                        <strong>{t("Date")}</strong>
                        {value.matchedStatus === "matchedWithThreshold" && (
                          <MatchDetailPopover />
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray d-flex align-items-center">
                        {this.renderCheck("AMOUNT")}
                        <strong>{t("Amount")}</strong>
                      </p>
                      <p className="border-bottom border-1px border-gray d-flex align-items-center">
                        {this.renderCheck("CURRENCY")}
                        <strong>{t("Currency")}</strong>
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
                            {t("GR Summary")}
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
                        {value.goodsReceivedItems.grNo || "-"}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                        {this.renderText("UNIT_PRICE", "")}
                      </p>
                      <p
                        className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                          this.isUnmatched("PURCHASE_QUANTITY")
                            ? "text-danger"
                            : ""
                          } `}
                      >
                        {this.renderText(
                          "PURCHASE_QUANTITY",
                          this.formatCurrency(
                            value.goodsReceivedItems.grQuantity,
                            3
                          )
                        )}
                      </p>
                      <p
                        className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                          this.isUnmatched("UNIT") ? "text-danger" : ""
                          }`}
                      >
                        {this.renderText(
                          "UNIT",
                          value.goodsReceivedItems.grUnitDescription
                        )}
                      </p>
                      <p
                        className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                          this.isUnmatched("DATE") ? "text-danger" : ""
                          }`}
                      >
                        {this.renderText(
                          "DATE",
                          moment(value.goodsReceivedItems.grDate).format(
                            "DD/MM/YYYY"
                          )
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                        -
                    </p>
                      <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                        -
                    </p>
                    </div>
                    {value.goodsReceivedItems.items.map(item => {
                      return (
                        <div
                          className={`col items-wrapper ${
                            isShowGR && value.goodsReceivedItems.items.length > 0
                              ? "gr-show"
                              : "gr-hidden"
                            }`}
                        >
                          <div className="items col px-0">
                            <p className="header text-center bg-gray">
                              {t("GR No")}
                            <br />
                              {item.grNumber || "-"}
                            </p>
                            <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                              {item.grItemNo || "-"}
                            </p>
                            <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                              -
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
                                this.formatCurrency(item.grItemQuantity, 3)
                              )}
                            </p>
                            <p
                              className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                                this.isUnmatched("UNIT") ? "text-danger" : ""
                                }`}
                            >
                              {this.renderText(
                                "UNIT",
                                item.grItemUnitDescription
                              )}
                            </p>
                            <p
                              className={`border-bottom border-1px border-gray text-center bg-lightgray-3 ${
                                this.isUnmatched("DATE") ? "text-danger" : ""
                                }`}
                            >
                              {this.renderText(
                                "DATE",
                                moment(item.grItemDate).format("DD/MM/YYYY")
                              )}
                            </p>
                            <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                              -
                          </p>
                            <p className="border-bottom border-1px border-gray text-center bg-lightgray-3">
                              -
                          </p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="items col px-0">
                      <p className="header text-center bg-lightgray">
                        <strong>
                          {t("CN No")}
                        <br />
                          {value.creditnoteItems.externalId || "-"}
                        </strong>
                      </p>
                      <p className="border-bottom border-1px border-gray text-center">
                        {value.creditnoteItems.itemId || "-"}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center">
                        {this.renderText(
                          "UNIT_PRICE",
                          this.formatCurrency(value.creditnoteItems.unitPrice, 2)
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center">
                        {this.renderText(
                          "PURCHASE_QUANTITY",
                          this.formatCurrency(value.creditnoteItems.quantity, 3)
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center">
                        {this.renderText(
                          "UNIT",
                          value.creditnoteItems.unitDescription
                        )}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center">
                        {moment(value.creditnoteItems.date).format("DD/MM/YYYY")}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center">
                        {this.formatCurrency(value.creditnoteItems.amount, 2) ||
                          "-"}
                      </p>
                      <p className="border-bottom border-1px border-gray text-center">
                        {value.creditnoteItems.currency || "-"}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Matching Details desktop version - End */}
              </div>
            
        </div>
        {!this.props.noSelectGR && (
          <ModalSelectGr
            isGrTableVisible={isGrTableVisible}
            toggleGrListModal={this.toggleGrListModal}
            submitTagedGR={this.submitTagedGR}
            clickCheckAll={this.clickCheckAll}
            clickCheck={this.clickCheck}
            checkAll={this.state.checkAll}
            data={this.state.data}
            companyTaxNumber={value.companyTaxNumber}
            matchingItem={value}
            matchingType={this.props.matchingType}
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
export default withTranslation(["twoway-detail"])(MatchingItem)