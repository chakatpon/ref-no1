import React, { Component } from "react";
import _ from "lodash";
import ApiService from "../../libs/ApiService";
import Autosuggest from "react-autosuggest";
import { throws } from "assert";
import BlockUi from "react-block-ui";
import Router from "next/router";
import {
  asyncContainer,
  Typeahead
} from "../../libs/react-bootstrap-typeahead";
const AsyncTypeahead = asyncContainer(Typeahead);
const poStatusQueryString = "&statuses=Confirmed";
const poSearchApiUrl =
  "/api/purchaseorders?bypass=true&" +
  poStatusQueryString +
  "&purchaseOrderNumber=";

const Api = new ApiService();

class createInvoiceByPoStepOne extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      //Invoice Data
      poInput: "",
      selectedPO: {},
      //Options
      isSelectedPo: false,
      isSelectedGr: false,
      //Vendor detail
      vendorBranchInfo: null,
      vendorBranchList: [],
      vendorBranchSelectedId: null,
      vendorBranchErrorMessageShow: false,
      //
      isReadyToNext: false, // force true for development purpose
      isPoChange: false,
      autoPopulate: ""
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
      setTimeout(() => {
        $("#poNumber").val(
          `${this.props.mainState.stepOneProp.selectedPO.purchaseOrderNumber}`
        );
        $("#addressInput-vendor")
          .val(this.props.mainState.stepOneProp.vendorBranchSelectedId)
          .change();
      }, 500);
      this.setState(
        {
          //PO Data
          poInput: this.props.mainState.stepOneProp.poInput,
          selectedPO: this.props.mainState.stepOneProp.selectedPO,
          vendorBranchInfo: this.props.mainState.stepOneProp.vendorBranchInfo,
          vendorBranchSelectedId: this.props.mainState.stepOneProp
            .vendorBranchSelectedId,
          vendorBranchList: this.props.mainState.stepOneProp.vendorBranchList,
          //Options
          isSelectedPo: this.props.mainState.stepOneProp.isSelectedPo,
          isSelectedGr: this.props.mainState.stepOneProp.isSelectedGr,
          //
          isReadyToNext: this.props.mainState.stepOneProp.isReadyToNext
        },
        () => this.toggleBlocking()
      );
    }
  }

  checkIsPOChange() {
    let isPoChange = false;
    if (this.props.mainState.stepOneProp !== undefined) {
      if (this.props.mainState.stepOneProp.poInput !== this.state.poInput) {
        isPoChange = true;
      }
    }
    this.setState({
      isPoChange: isPoChange
    });
  }

  resolveAllowToNext() {
    if (
      (this.state.isSelectedGr === false &&
        this.state.isSelectedPo === false) ||
      _.isEmpty(this.state.selectedPO)
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

  handleSelectPo() {
    this.setState(
      {
        isSelectedPo: true,
        isSelectedGr: false
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  }

  handleSelectGr() {
    this.setState(
      {
        isSelectedGr: true,
        isSelectedPo: false
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });

    if (
      event.target.name === "vendorBranch" ||
      event.target.name === "companyBranch"
    ) {
      this.triggerBranchChange(event.target.name, event.target.value);
    }
  }

  triggerBranchChange(branch, id) {
    if (branch === "vendorBranch") {
      let vendorBranchInfo = this.state.vendorBranchInfo;
      let vendorBranch = this.state.vendorBranchList.find(b => {
        return b.id === +id;
      });
      if (vendorBranch !== undefined) {
        vendorBranchInfo.vendorStreet1 =
          vendorBranch.street === undefined ? "" : vendorBranch.street;
        vendorBranchInfo.vendorDistrict =
          vendorBranch.district === undefined ? "" : vendorBranch.district;
        vendorBranchInfo.vendorCity =
          vendorBranch.city === undefined ? "" : vendorBranch.city;
        vendorBranchInfo.vendorPostalCode =
          vendorBranch.postalCode === undefined ? "" : vendorBranch.postalCode;
        vendorBranchInfo.vendorBranchCode =
          vendorBranch.branchCode === undefined ? "" : vendorBranch.branchCode;
        vendorBranchInfo.vendorBranchName =
          vendorBranch.name === undefined ? "" : vendorBranch.name;
        window.jQuery("#addressPanel-vendor").css("color", "#d40e78");
        window.jQuery("#addressInput-vendor").css("color", "#d40e78");
      }
      this.setState({
        vendorBranchSelectedId: id,
        vendorBranchInfo: vendorBranchInfo
      });
    } else if (branch === "companyBranch") {
      window.jQuery("#addressPanel-company").css("color", "#d40e78");
      window.jQuery("#addressInput-company").css("color", "#d40e78");
    }
  }

  getTypeOfDocumentToCreate = async vendorTaxNumber => {
    const fetchURL = `/api/offledgers/configuration?configOption=INVOICE_CREATED_BY_DOCUMENT&companyTaxId=${vendorTaxNumber}`;
    try {
      const data = await fetch(fetchURL)
        .then(resp => resp.json())
        .then(json => {
          if (json && json[0] && json[0].value === "GOODS_RECEIVED") {
            this.props.updateStepDocumentType("gr");
            this.setState({
              isSelectedPo: false,
              isSelectedGr: true,
              isReadyToNext: true
            });
          } else if (json && json[0] && json[0].value === "PURCHASE_ORDER") {
            this.props.updateStepDocumentType("po");
            this.setState({
              isSelectedPo: true,
              isSelectedGr: false,
              isReadyToNext: true
            });
          } else {
            this.setState({
              isSelectedPo: false,
              isSelectedGr: false,
              isReadyToNext: false
            });
            Router.push("/invoice");
          }
        });
      return data;
    } catch (error) {
      console.log("error in getTypeOfDocumentToCreate:", error);
    }
  };

  async initVendorBranch(selectedPO) {
    let vendorBranchInfo = {
      vendorStreet1: selectedPO.vendorAddress || selectedPO.vendorAddress1,
      vendorDistrict: selectedPO.vendorDistrict,
      vendorCity: selectedPO.vendorCity,
      vendorPostalCode: selectedPO.vendorPostalCode,
      vendorName: selectedPO.vendorName,
      vendorBranchCode: selectedPO.vendorBranchCode,
      vendorBranchName: selectedPO.vendorBranchName
    };

    this.setState({
      vendorBranchInfo: vendorBranchInfo
    });
  }

  async populateVendorBranch() {
    let legalName = this.state.selectedPO.seller.legalName;
    let vendorTaxNumber = this.state.selectedPO.vendorTaxNumber;
    try {
      Api.getVendorBranchCode(legalName, vendorTaxNumber)
        .then(res => {
          if (res && res.length < 1) {
            $("#addressInput-vendor").prop("disabled", true);
          }
          this.setState({
            vendorBranchList: [...this.state.vendorBranchList, ...res]
          });
        })
        .catch(err => {
          $("#addressInput-vendor").prop("disabled", true);
          this.setState({ vendorBranchErrorMessageShow: true });
        });
    } catch (error) {
      $("#addressInput-vendor").prop("disabled", true);
      this.setState({ vendorBranchErrorMessageShow: true });
    }
  }

  handleSelectPo(selectedPO) {
    this.toggleBlocking();
    let vendorBranchData = {
      street: selectedPO.vendorAddress || selectedPO.vendorAddress1,
      district: selectedPO.vendorDistrict,
      city: selectedPO.vendorCity,
      postalCode: selectedPO.vendorPostalCode,
      vendorName: selectedPO.vendorName,
      branchCode: selectedPO.vendorBranchCode,
      name: selectedPO.vendorBranchName,
      companyCode: selectedPO.companyCode,
      taxId: selectedPO.vendorTaxNumber,
      def: true,
      id: 0
    };
    this.setState(
      {
        selectedPO: selectedPO,
        vendorBranchInfo: [],
        vendorBranchList: [...this.state.vendorBranchList, vendorBranchData]
      },
      async () => {
        this.toggleBlocking();
        this.resolveAllowToNext();
        await this.checkPOConfiguration(selectedPO);
        await this.getTypeOfDocumentToCreate(selectedPO.vendorTaxNumber);
        await this.initVendorBranch(selectedPO);
        await this.populateVendorBranch();
        await this.props.clearAllMainState();
      }
    );
  }

  ///Get config /////
  async checkPOConfiguration(po) {
    this.setState({
      blocking: true
    });
    Api.getInvoiceConfiguration(
      po.buyer.legalName,
      po.businessPlaceTaxNumber,
      po.vendorTaxNumber
    ).then(config => {
      this.setState({
        autoPopulate: config.autoPopulateInvoiceItemQuantity,
        blocking: false
      });
    });
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

  handlePoAutoCompleteChange(selectedPO) {
    if (selectedPO !== undefined) {
      this.setState(
        {
          vendorBranchInfo: null,
          vendorBranchList: [],
          vendorBranchSelectedId: null,
          poInput: selectedPO.externalId
        },
        () => this.handleSelectPo(selectedPO)
      );
    }
  }

  ///// NEXT & BACK //////

  async handleNext() {
    await this.checkIsPOChange();
    await this.props.updateState(this.state);
    this.props.nextStep();
  }

  async handleBack() {
    await this.props.updateState(this.state);
    this.props.previousStep();
  }

  routeCancel() {
    Router.push("/invoice");
  }

  render() {
    return (
      <BlockUi tag="div" blocking={this.state.blocking}>
        <div>
          <div id="cn_create" className="row">
            <div id="step-indicator" className="col-12">
              <ul className="d-flex justify-content-center">
                <li className="flex-fill active">
                  <div className="indicator step-1 rounded-circle text-center">
                    <span className="number">1</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Select Type of Invoice</p>
                </li>
                <li className="flex-fill">
                  <div className="indicator step-2 rounded-circle text-center">
                    <span className="number">2</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Select Items</p>
                </li>
                <li className="flex-fill">
                  <div className="indicator step-3 rounded-circle text-center">
                    <span className="number">3</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Insert Invoice Details</p>
                </li>
                <li className="flex-fill">
                  <div className="indicator step-4 rounded-circle text-center">
                    <span className="number">4</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Summary</p>
                </li>
              </ul>
            </div>
            <div className="page__header col-12">
              <h2>Please Select Invoice Reference No.</h2>
            </div>
            <form
              id="invCreateForm"
              name="invCreateForm"
              method="post"
              enctype="multipart/form-data"
              action=""
              className="form col-12"
            >
              <div className="box col-12">
                <div className="col-8 offset-2">
                  <div className="form-group d-flex flex-wrap align-items-center">
                    <label className="form-label col-6 text-right mb-0">
                      PO:
                    </label>
                    <div className="form-label-group">
                      <AsyncTypeahead
                        inputProps={{
                          id: `poNumber`,
                          name: `poNumber`,
                          className: `input-search`,
                          title: `Purchase Order No.`
                        }}
                        ref={Typeahead => (this.Typeahead = Typeahead)}
                        placeholder="Select PO."
                        defaultInputValue={
                          this.props.mainState.stepOneProp === undefined
                            ? ""
                            : this.props.mainState.stepOneProp.poInput
                        }
                        isLoading={this.state.isLoading}
                        labelKey="purchaseOrderNumber"
                        minLength={3}
                        useCache={false}
                        onChange={selected =>
                          this.handlePoAutoCompleteChange(selected[0])
                        }
                        onSearch={query => {
                          if (query.trim() != "") {
                            this.setState({ isLoading: true });
                            let fetchURL = `${poSearchApiUrl}${query}`;
                            try {
                              fetch(fetchURL)
                                .then(resp => resp.json())
                                .then(json => {
                                  this.setState({
                                    isLoading: false,
                                    options: json.data
                                  });
                                });
                            } catch (error) {
                              console.log(error);
                            }
                          }
                        }}
                        options={this.state.options}
                      />
                    </div>
                  </div>
                  <div className="form-group d-flex flex-wrap">
                    <label className="form-label col-6 text-right">
                      Select type of Invoice:
                    </label>
                    <div className="col-4 nopadding">
                      <div className="custom-control custom-radio">
                        <input
                          onClick={() => this.handleSelectPo()}
                          type="radio"
                          className="custom-control-input"
                          checked={this.state.isSelectedPo}
                          name="select_item"
                          id="select_item_po"
                          value="qty"
                        />
                        <label className="custom-control-label" for="select_po">
                          {" "}
                          Create by Select PO Items
                        </label>
                      </div>
                      <div className="custom-control custom-radio">
                        <input
                          onClick={() => this.handleSelectGr()}
                          type="radio"
                          className="custom-control-input"
                          checked={this.state.isSelectedGr}
                          name="select_item"
                          id="select_item_gr"
                          value="price"
                        />
                        <label className="custom-control-label" for="select_gr">
                          {" "}
                          Create by Select GR Items
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
                    <h3 className="border-bottom gray-1">Vendor</h3>
                  </div>
                  <div className="col-6">
                    <h3 className="border-bottom gray-1">Company</h3>
                    <i className="fa fa-chevron-up gray-1" aria-hidden="true" />
                    <i
                      className="fa fa-chevron-down gray-1"
                      aria-hidden="true"
                    />
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
                          <p className="col-4 text-right">Code :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.vendorNumber}
                          </p>
                        </div>
                        <div className="row">
                          <p className="col-4 text-right">Name :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.vendorName}
                          </p>
                        </div>
                        <div className="row">
                          <p className="col-4 text-right">Tax ID :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.vendorTaxNumber}
                          </p>
                        </div>
                        <div class="row">
                          <p class="col-4 text-right nopadding">Branch :</p>
                          <p class="col-6">
                            <select
                              id="addressInput-vendor"
                              name="vendorBranch"
                              class="custom-select"
                              onChange={event => this.handleInputChange(event)}
                            >
                              {_.map(
                                this.state.vendorBranchList,
                                ({ branchCode, name, id, def }) => (
                                  <option value={id}>
                                    {/* {branchCode} ({name}){" "}
                                    {def ? "[From PO]" : ""} */}
                                    {branchCode || ""}
                                    {name && name !== "" && name !== undefined
                                      ? ` (${name})`
                                      : ""}
                                  </option>
                                )
                              )}
                            </select>
                          </p>
                        </div>

                        {this.state.vendorBranchErrorMessageShow === true ? (
                          <div className="row">
                            <p className="col-4" />
                            <p
                              className="col-6"
                              style={{
                                fontSize: "12px",
                                color: "#C3C3C3",
                                fontWeight: "light"
                              }}
                            >
                              Cannot retrieve Vendor Branch information for
                              selection. System will use Vendor Branch from PO
                              by default.
                            </p>
                          </div>
                        ) : (
                          ""
                        )}
                        <div className="row">
                          <p className="col-4 text-right">Address :</p>
                          <p id="addressPanel-vendor" class="col-6">
                            {_.isEmpty(this.state.vendorBranchInfo)
                              ? "-"
                              : `${this.state.vendorBranchInfo.vendorStreet1 ||
                                  ""} ${
                                  this.state.vendorBranchInfo.vendorDistrict
                                } ${this.state.vendorBranchInfo.vendorCity} ${
                                  this.state.vendorBranchInfo.vendorPostalCode
                                }`}
                          </p>
                        </div>
                        <div className="row">
                          <p className="col-4 text-right">Tel. :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.vendorTelephone}
                          </p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="row">
                          <p className="col-4 text-right">Code :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.companyCode}
                          </p>
                        </div>
                        <div className="row">
                          <p className="col-4 text-right">Name :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.companyName}
                          </p>
                        </div>
                        <div className="row">
                          <p className="col-4 text-right">Tax ID :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.businessPlaceTaxNumber}
                          </p>
                        </div>
                        <div class="row">
                          <p class="col-4 text-right nopadding">Branch :</p>
                          <p class="col-6">
                            <select
                              id="addressInput-company"
                              name="companyBranch"
                              class="custom-select"
                              onChange={event => this.handleInputChange(event)}
                              disabled={true}
                            >
                              <option value="1">
                                {_.isEmpty(this.state.selectedPO)
                                  ? ""
                                  : `${
                                      this.state.selectedPO.companyBranchCode
                                    } (${
                                      this.state.selectedPO.companyBranchName
                                    })`}
                              </option>
                            </select>
                          </p>
                        </div>
                        <div className="row">
                          <p className="col-4 text-right">Address :</p>
                          <p id="addressPanel-company" className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : `${this.state.selectedPO.businessPlaceAddress ||
                                  ""} ${this.state.selectedPO
                                  .businessPlaceAddress1 || ""} ${
                                  this.state.selectedPO.businessPlaceDistrict
                                } ${this.state.selectedPO.businessPlaceCity} ${
                                  this.state.selectedPO.businessPlacePostalCode
                                }`}
                          </p>
                        </div>
                        <div className="row">
                          <p className="col-4 text-right">Tel. :</p>
                          <p className="col-6">
                            {_.isEmpty(this.state.selectedPO)
                              ? "-"
                              : this.state.selectedPO.businessPlaceTelephone}
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
                    Cancel
                  </button>
                  {this.state.isReadyToNext === true ? (
                    <button
                      type="button"
                      name="btnNext"
                      id="btnNext"
                      onClick={() => this.handleNext()}
                      className="btn btn-wide"
                    >
                      Next <i className="fa fa-chevron-right" />
                    </button>
                  ) : (
                    <button
                      disabled
                      type="button"
                      name="btnNext"
                      id="btnNext"
                      className="btn btn-wide"
                    >
                      Next <i className="fa fa-chevron-right" />
                    </button>
                  )}
                </div>
              </div>
              <div className="row">&nbsp;</div>
            </form>
            <div
              id="addPO"
              className="modal hide fade"
              tabIndex="-1"
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
              tabIndex="-1"
              role="dialog"
              aria-labelledby="cancel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-md" role="document">
                <div className="modal-content">
                  <div className="modal-header ">
                    <h3 className="text-center" id="myModalLabel ">
                      Cancel
                    </h3>
                  </div>
                  <div className="modal-body text-center">
                    <div className="text">
                      Do you want to cancel this invoice?
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
                      No
                    </button>
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      className="btn btn-wide"
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
            tabIndex="-1"
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
      </BlockUi>
    );
  }
}
export default createInvoiceByPoStepOne;
