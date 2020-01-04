import React, { Component } from "react";
import _ from "lodash";
import ApiService from "../../libs/ApiService";
import Autosuggest from "react-autosuggest";
import { throws } from "assert";
import BlockUi from "react-block-ui";
import Router from "next/router";
import autoDelay from "../../configs/delay.typeahead.json";
import handleError from "../../pages/handleError";
import ModalAlert, { BTN_ACTION_BACK, BTN_ACTION_OK } from "../modalAlert";
import { i18n, withTranslation } from "~/i18n";
import {
  asyncContainer,
  Typeahead
} from "../../libs/react-bootstrap-typeahead";
const AsyncTypeahead = asyncContainer(Typeahead);
const invoiceStatusQueryString =
  "&statuses=Verifying&statuses=Submitted&statuses=Partial GR&statuses=Missing GR&statuses=Missing DoA List&statuses=Pending Manual Approval&statuses=Missing DoA List&statuses=Pending DoA Approval&statuses=Pending Clarification&statuses=Pending DoA Approval&statuses=Waiting Payment Due Date&statuses=Paid&statuses=Payment Failed";
const invoiceSearchApiUrl =
  "/api/invoices?bypass=true&returnInvoiceItems=true" +
  invoiceStatusQueryString +
  "&invoiceNumber=";

const Api = new ApiService();

class createCreditNoteStepOne extends Component {
  constructor(props) {
    super(props);
    this.BTN_OK = [
      {
        label: "OK",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: () => {
            this.setState({
              ModalAlert: {
                ...this.state.ModalAlert,
                visible: false
              }
            });
          }
        }
      }
    ];
    this.state = {
      blocking: false,
      //Invoice Data
      invoiceInput: "",
      selectedInvoice: {},
      selectedInnerItem: {},
      //Options
      isQuantityAdjusted: false,
      isPriceAdjusted: false,
      //
      isReadyToNext: false,
      isInvoiceChange: false,
      delayTime: autoDelay["delay_time"],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: true,
      buttonAlert: []
    };
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  componentDidMount() {
    if (this.props.mainState.stepOneProp === undefined) {
      //DO NOTHING
    } else {
      this.toggleBlocking();
      this.setState(
        {
          //Invoice Data
          invoiceInput: this.props.mainState.stepOneProp.invoiceInput,
          selectedInvoice: this.props.mainState.stepOneProp.selectedInvoice,
          selectedInnerItem: this.props.mainState.stepOneProp.selectedInnerItem,
          //Options
          isQuantityAdjusted: this.props.mainState.stepOneProp
            .isQuantityAdjusted,
          isPriceAdjusted: this.props.mainState.stepOneProp.isPriceAdjusted,
          //
          isReadyToNext: this.props.mainState.stepOneProp.isReadyToNext
        },
        () => this.toggleBlocking()
      );
    }
  }

  checkIsInvoiceChange() {
    let isInvoiceChange = false;
    if (this.props.mainState.stepOneProp !== undefined) {
      if (
        this.props.mainState.stepOneProp.invoiceInput !==
        this.state.invoiceInput
      ) {
        isInvoiceChange = true;
      }
    }
    this.setState({
      isInvoiceChange: isInvoiceChange
    });
  }

  resolveAllowToNext() {
    if (
      (this.state.isPriceAdjusted === false &&
        this.state.isQuantityAdjusted === false) ||
      _.isEmpty(this.state.selectedInvoice)
    ) {
      this.setState({
        isReadyToNext: false
      });
    } else {
      this.setState({
        isReadyToNext: true
      });
    }
  }

  ///// --- Event ----//////

  handleSelectQuantity() {
    this.setState(
      {
        isQuantityAdjusted: true,
        isPriceAdjusted: false
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  }

  handleSelectPrice() {
    this.setState(
      {
        isPriceAdjusted: true,
        isQuantityAdjusted: false
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  }

  async handleSelectInvoice(selectedInvoice) {
    // this.toggleBlocking();
    const res = await this.checkConfiguration(selectedInvoice);
    if (res === "success") {
      this.setState(
        {
          selectedInvoice: selectedInvoice,
          selectedInnerItem:
            selectedInvoice.items.length > 0
              ? selectedInvoice.items[0].purchaseItem
              : []
        },
        () => {
          // this.toggleBlocking();
          this.resolveAllowToNext();
        }
      );
    } else if (res === "fail") {
      //Error Case - success but empty data in response
      const message = [
        "The necessary configuration is not found.",
        <br />,
        "CONFIG_OPTION:  CREDITNOTE_ATTACHMENT"
      ];
      const response = handleError(message, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    } else {
      //Error Case - failed to get data from api
      const response = handleError(res, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }

  async checkConfiguration(invoice) {
    let flag = "";
    let selectedInvoice = invoice;
    let purchaseOrderHeaderNumberMain = selectedInvoice.purchaseOrderHeaderNumber.split(
      "|"
    )[0];
    await Api.getCreditNoteConfiguration(
      selectedInvoice.buyer.legalName,
      selectedInvoice.companyTaxNumber,
      selectedInvoice.vendorTaxNumber
    )
      .then(config => {
        if (
          Object.keys(config).length === 0 ||
          !"attachmentConfiguration" in config
        ) {
          flag = "fail";
        } else {
          flag = "success";
        }
      })
      .catch(err => {
        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({
          ...response
        });
        flag = err.response.data.message;
      });
    return flag;
  }

  ///// -- Auto Complete -- /////
  onSuggestionsFetchRequested = ({ value }) => {
    let suggestionArray = [];
    let inputValue = value.trim().toLowerCase();
    let inputLength = inputValue.length;

    suggestionArray =
      inputLength < 3
        ? []
        : this.state.invoiceList.filter(
            invoice =>
              invoice.externalId.toLowerCase().slice(0, inputLength) ===
              inputValue
          );

    this.setState({
      invoiceListSuggestion: suggestionArray
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      invoiceListSuggestion: []
    });
  };

  handleInvoiceAutoCompleteChange(selectedInvoice) {
    if (selectedInvoice !== undefined) {
      this.setState(
        {
          invoiceInput: selectedInvoice.externalId
        },
        () => this.handleSelectInvoice(selectedInvoice)
      );
    }
  }

  ///// NEXT & BACK //////

  async handleNext() {
    await this.checkIsInvoiceChange();
    await this.props.updateState(this.state);
    this.props.nextStep();
  }

  async handleBack() {
    await this.props.updateState(this.state);
    this.props.previousStep();
  }

  routeCancel() {
    Router.push("/credit-note");
  }

  render() {
    const { t } = this.props;
    return (
      <BlockUi tag="div" blocking={this.state.blocking}>
        <div>
          <div id="cn_create">
            <div id="step-indicator" className="col-12">
              <ul className="d-flex justify-content-center">
                <li className="flex-fill active">
                  <div className="indicator step-1 rounded-circle text-center">
                    <span className="number">1</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">{t("Select Invoice")}</p>
                </li>
                <li className="flex-fill">
                  <div className="indicator step-2 rounded-circle text-center">
                    <span className="number">2</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">{t("Credit Note Items")}</p>
                </li>
                <li className="flex-fill">
                  <div className="indicator step-3 rounded-circle text-center">
                    <span className="number">3</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">
                    {t("Insert Credit Note Details")}
                  </p>
                </li>
                <li className="flex-fill">
                  <div className="indicator step-4 rounded-circle text-center">
                    <span className="number">4</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">{t("Summary")}</p>
                </li>
              </ul>
            </div>
            <div className="page__header col-12">
              <div className="col-7">
                <h2>{t("Please Select Invoice Reference No")}</h2>
              </div>
            </div>
            {/* <form
              id="cnCreateForm"
              name="cnCreateForm"
              method="post"
              enctype="multipart/form-data"
              action=""
              className="form col-12 px-0"
            > */}
            <div className="box col-12">
              <div className="col-8 offset-2">
                <div className="form-group d-flex flex-wrap align-items-center">
                  <label className="form-label col-6 text-right mb-0">
                    {t("Reference to")}:
                  </label>
                  <div className="form-label-group">
                    <AsyncTypeahead
                      inputProps={{
                        id: `invoiceNumber`,
                        name: `invoiceNumber`,
                        className: `input-search`,
                        title: t("Invoice No")
                      }}
                      ref={Typeahead => (this.Typeahead = Typeahead)}
                      placeholder={t("Invoice No")}
                      defaultInputValue={
                        this.props.mainState.stepOneProp === undefined
                          ? ""
                          : this.props.mainState.stepOneProp.invoiceInput
                      }
                      isLoading={this.state.isLoading}
                      labelKey="externalId"
                      minLength={3}
                      delay={this.state.delayTime}
                      useCache={false}
                      onChange={selected =>
                        this.handleInvoiceAutoCompleteChange(selected[0])
                      }
                      onSearch={query => {
                        if (query.trim() != "") {
                          this.setState({ isLoading: true });
                          let fetchURL = `${invoiceSearchApiUrl}${query}`;
                          fetch(fetchURL)
                            .then(resp => resp.json())
                            .then(json => {
                              this.setState({
                                isLoading: false,
                                options: json.data
                              });
                            });
                        }
                      }}
                      options={this.state.options}
                    />
                  </div>
                </div>
                <div className="form-group d-flex flex-wrap">
                  <label className="form-label col-6 text-right">
                    {t("Select type of credit note")}:
                  </label>
                  <div className="col-4 nopadding">
                    <div className="custom-control custom-radio">
                      <input
                        onClick={() => this.handleSelectQuantity()}
                        type="radio"
                        className="custom-control-input"
                        checked={this.state.isQuantityAdjusted}
                        name="adjustment_type"
                        id="adjustment_type_qty"
                        value="qty"
                      />
                      <label
                        className="custom-control-label"
                        for="adjustment_type_qty"
                      >
                        {" "}
                        {t("Quantity Adjustment")}
                      </label>
                    </div>
                    <div className="custom-control custom-radio">
                      <input
                        onClick={() => this.handleSelectPrice()}
                        type="radio"
                        className="custom-control-input"
                        checked={this.state.isPriceAdjusted}
                        name="adjustment_type"
                        id="adjustment_type_price"
                        value="price"
                      />
                      <label
                        className="custom-control-label"
                        for="adjustment_type_price"
                      >
                        {" "}
                        {t("Price Adjustment")}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex flex-wrap box">
              <a
                href="#vendorInfo"
                data-toggle="collapse"
                role="button"
                aria-expanded="true"
                area-controls="vendorInfo"
                className="d-flex col-12 btnToggle"
              >
                <div className="col-6">
                  <h3 className="border-bottom gray-1">{t("Vendor")}</h3>
                </div>
                <div className="col-6">
                  <h3 className="border-bottom gray-1">{t("Company")}</h3>
                  <i className="fa fa-chevron-up gray-1" aria-hidden="true" />
                  <i className="fa fa-chevron-down gray-1" aria-hidden="true" />
                </div>
              </a>

              <div
                id="vendorInfo"
                className="collapse multi-collapse col-12 show"
              >
                <div className="card card-body noborder">
                  <div className="row">
                    <div className="col-6">
                      <div className="row">
                        <p className="col-4 text-right">{t("Code")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.vendorNumber}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Name")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.vendorName}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Tax ID")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.vendorTaxNumber}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Branch")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.vendorBranchCode}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Address")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.vendorAddress}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Tel")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInnerItem.vendorTelephone}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="row">
                        <p className="col-4 text-right">{t("Code")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.companyCode}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Name")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.companyName}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Tax ID")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.companyTaxNumber}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Branch")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.companyBranchCode}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Address")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.companyAddress}
                        </p>
                      </div>
                      <div className="row">
                        <p className="col-4 text-right">{t("Tel")} :</p>
                        <p className="col-6">
                          {_.isEmpty(this.state.selectedInvoice)
                            ? "-"
                            : this.state.selectedInvoice.companyTelephone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-12 text-center">
                <button
                  type="button"
                  name="btnCancel"
                  id="btnCancel"
                  className="btn btn--transparent btn-wide"
                  data-toggle="modal"
                  data-target="#cancelWarning"
                >
                  {t("Cancel")}
                </button>
                {this.state.isReadyToNext === true ? (
                  <button
                    type="button"
                    name="btnNext"
                    id="btnNext"
                    onClick={() => this.handleNext()}
                    className="btn btn-wide"
                  >
                    {t("Next")} <i className="fa fa-chevron-right" />
                  </button>
                ) : (
                  <button
                    disabled
                    type="button"
                    name="btnNext"
                    id="btnNext"
                    className="btn btn-wide"
                  >
                    {t("Next")} <i className="fa fa-chevron-right" />
                  </button>
                )}
              </div>
            </div>
            <div className="row">&nbsp;</div>
            {/* </form> */}
            <div
              id="addPO"
              className="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labelledby="addPO"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 id="myModalLabel">Company Information</h3>
                  </div>
                  <div className="modal-body d-flex">
                    <div className="col-6">
                      <div className="form-group border border-1px border-lightgrey rounded disabled">
                        <label className="form-label" for="po_code">
                          Code
                        </label>
                        <input
                          type="text"
                          name="po_code"
                          value="56"
                          className="form-control noborder"
                          disabled
                        />
                      </div>
                      <div className="form-group border border-1px border-lightgrey rounded disabled">
                        <label className="form-label" for="po_name">
                          Name
                        </label>
                        <input
                          type="text"
                          name="po_name"
                          value="SCG Chemical"
                          className="form-control noborder"
                          disabled
                        />
                      </div>
                      <div className="form-group border border-1px border-lightgrey rounded">
                        <label className="form-label" for="po_taxId">
                          Tax ID
                        </label>
                        <input
                          type="text"
                          name="po_taxId"
                          value="2637070190598"
                          className="form-control noborder"
                        />
                      </div>
                      <div className="form-group border border-1px border-lightgrey rounded">
                        <label className="form-label" for="po_tel">
                          Tel.
                        </label>
                        <input
                          type="text"
                          name="po_code"
                          value="02-123-4567"
                          className="form-control noborder"
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="form-group border border-1px border-lightgrey rounded">
                        <label className="form-label" for="po_branch">
                          Branch
                        </label>
                        <input
                          type="text"
                          name="po_code"
                          value="BU1 (SCG)"
                          className="form-control noborder"
                        />
                      </div>
                      <div className="form-group border border-1px border-lightgrey rounded">
                        <label className="form-label" for="po_address">
                          Address
                        </label>
                        <textarea
                          name="po_address"
                          className="form-control noborder"
                        >
                          1 ถ.ปูนซีเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ
                          10800 02-123-4567
                        </textarea>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn--transparent btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      name="btnAddPO"
                      id="btnAddPO"
                      className="btn btn--transparent btn-purple btn-wide"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="cancelWarning"
              className="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labelledby="cancel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-sm" role="document">
                <div className="modal-content">
                  <div className="modal-header justify-content-center">
                    <h3 className="text-center" id="myModalLabel ">
                      Cancel
                    </h3>
                  </div>
                  <div className="modal-body text-center">
                    <div className="text">Do you want to cancel this CN?</div>
                  </div>
                  <div className="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn--transparent btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                      onClick={() => this.routeCancel()}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div id="smallScreenCover">
              <p className="text-center">
                <img src="/static/img/icon_expanded.png" alt="" />
              </p>
            </div>
          </div>
          {/* <p><a href="javascript:void(0);" data-toggle="modal" data-target="#alertBox">Click ME!</a></p> */}
          <div
            id="configWarning"
            className="modal hide fade"
            tabindex="-1"
            role="dialog"
            aria-labelledby="alertBox"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header justify-content-center">
                  <h3 id="myModalLabel">Error</h3>
                </div>
                <div className="modal-body d-flex justify-content-center">
                  <p>
                    The system cannot get attachment configuration because error
                    message
                  </p>
                </div>
                <div className="modal-footer justify-content-center">
                  <button
                    type="button"
                    name="btnCloseModal"
                    id="btnCloseModal"
                    className="btn btn-wide"
                    data-dismiss="modal"
                    aria-hidden="true"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ModalAlert
          title={this.state.alertModalAlertTitle}
          visible={this.state.isAlertModalVisible}
          button={this.state.buttonAlert}
          isTextOnly={this.state.isTextOnly}
        >
          {this.state.alertModalMsg}
        </ModalAlert>
      </BlockUi>
    );
  }
}
export default withTranslation(["credit-create", "detail"])(
  createCreditNoteStepOne
);
