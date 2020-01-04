import React, { Component } from "react";
import Router from "next/router";
import BlockUi from "react-block-ui";
import _ from "lodash";

import CordaService from "../../../services/CordaService";
import StepIndicator from "../../StepIndicator";
import ModalCancelWarning from "../../ModalCancelWarning";
import ModalMessage from "../../common/SweetAlert";
import SectionSelectedInvoice from "./components/step-one/SectionSelectedInvoice";
import SectionCancelAndNext from "../../SectionCancelAndNext";
import AutoCompleteField from "../../Fields/AutoCompleteField";
import SectionTwoHeaderInfo from "../../SectionTwoHeaderInfo";
import { DEBIT_ROUTES } from "../../../configs/routes.config";
import autoDelay from "../../../configs/delay.typeahead.json";
import { withTranslation } from "~/i18n";
import {
  SYSTEM_FAILED,
  WANT_ACTION
} from "../../../configs/errorMessage.config";
import {
  MODEL_VENDOR_INFO,
  MODEL_COMPANY_INFO
} from "../models/vendor-company-info";

const CANCEL_CREATE_MESSAGE_PATTERN = `${WANT_ACTION} cancel this DN?`;
const SEARCH_INVOICE_LIFECYCLE = [
  "Verifying",
  "Submitted",
  "Partial GR",
  "Missing GR",
  "Missing DoA List",
  "Pending Manual Approval",
  "Pending Clarification",
  "Pending DoA Approval",
  "Waiting Payment Due Date",
  "Paid",
  "Payment Failed"
];
const lang = "debit-create";

class createDebitNoteStepOne extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.state = {
      blocking: false,
      isLoading: false,
      invoiceInput: null,
      selectedInvoice: {},
      selectedInnerItem: {},
      isQuantityAdjusted: false,
      isPriceAdjusted: false,
      isReadyToNext: false,
      isInvoiceChange: false,
      configuration: {
        status: false,
        response: null
      },
      delayTime: autoDelay["delay_time"]
    };
  }

  componentDidMount() {
    this.prepareVendorCompanyModel();

    if (this.props.mainState.stepOneProp !== undefined) {
      this.handleToggleBlocking();
      this.setState(
        {
          ...this.props.mainState.stepOneProp,
          blocking: !this.props.mainState.stepOneProp.blocking,
          isInvoiceChange: this.props.mainState.isInvoiceChange
        },
        () => this.handleToggleBlocking()
      );
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedInvoice !== this.state.selectedInvoice) {
      this.prepareVendorCompanyModel();
    }
  }

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  prepareVendorCompanyModel = () => {
    MODEL_VENDOR_INFO.fields.forEach(field => {
      field.condition = _.isEmpty(this.state.selectedInvoice);
    });

    MODEL_COMPANY_INFO.fields.forEach(field => {
      field.condition = _.isEmpty(this.state.selectedInvoice);
    });
  };

  getInvoice = async params => {
    return await this.cordaService.callApi({
      group: "invoice",
      action: "getInvoices",
      requestParams: params
    });
  };

  handleSearchInvoice = async query => {
    if (query.trim() !== "") {
      const params = {
        returnInvoiceItems: true,
        statuses: SEARCH_INVOICE_LIFECYCLE,
        invoiceNumber: query
      };

      this.setState({ isLoading: true });

      const invoiceResponse = await this.getInvoice(params);
      const { status, message } = invoiceResponse;

      if (status) {
        const data = invoiceResponse.data.rows
          ? invoiceResponse.data.rows
          : invoiceResponse.data;

        this.setState({
          isLoading: false,
          options: data
        });
      } else {
        const errorMessagePattern = SYSTEM_FAILED.replace("%m", "get invoice");

        this.setState({
          isLoading: false,
          options: [],
          isReadyToNext: false
        });

        ModalMessage({
          title: "Error",
          message: `${errorMessagePattern} ${message}`,
          buttons: [
            {
              label: "OK",
              attribute: {
                onClick: () => {}
              }
            }
          ]
        });
      }
    }
  };

  handleInvoiceAutoCompleteChange = selectedInvoice => {
    if (selectedInvoice !== undefined) {
      this.setState(
        {
          invoiceInput: selectedInvoice.externalId
        },
        () => this.handleSelectInvoice(selectedInvoice)
      );
    } else {
      this.setState({
        isReadyToNext: false
      });
    }
  };

  handleSelectInvoice = async selectedInvoice => {
    this.handleToggleBlocking();

    const getConfiguration = await this.getConfiguration(selectedInvoice);
    const { status, response } = getConfiguration;

    if (status) {
      this.setState(
        {
          selectedInvoice: selectedInvoice,
          selectedInnerItem:
            selectedInvoice.items.length > 0
              ? selectedInvoice.items[0].purchaseItem
              : [],
          configuration: getConfiguration
        },
        () => {
          this.handleToggleBlocking();
          this.checkIsInvoiceChange();
          this.resolveAllowToNext();
        }
      );
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get attachment configuration"
      );

      this.setState({
        isReadyToNext: false
      });

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${response}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });
    }
  };

  getConfiguration = async invoice => {
    const selectedInvoice = invoice;
    const params = {
      legalName: selectedInvoice.buyer.legalName,
      companyTaxId: selectedInvoice.companyTaxNumber,
      counterPartyTaxId: selectedInvoice.vendorTaxNumber
    };
    const result = {
      status: false,
      response: ""
    };

    const debitNoteConfigurationResponse = await this.cordaService.callApi({
      group: "offledgers",
      action: "getConfigurationForDebitNote",
      requestParams: params
    });

    const { status, data, message } = debitNoteConfigurationResponse;

    if (
      status &&
      "attachmentConfiguration" in data &&
      data.attachmentConfiguration.length > 0
    ) {
      result.status = true;
      result.response = data;
    } else {
      result.response = message
        ? message
        : "attachment configuration not found.";
    }

    return result;
  };

  resolveAllowToNext = () => {
    if (_.isEmpty(this.state.selectedInvoice)) {
      this.setState({
        isReadyToNext: false
      });
    } else {
      this.setState({
        isReadyToNext: true
      });
    }
  };

  handleClickNextButton = () => {
    this.props.updateState(this.state);
    this.props.nextStep();
  };

  checkIsInvoiceChange = () => {
    let isInvoiceChange = false;

    if (
      this.props.mainState.stepOneProp &&
      this.props.mainState.stepOneProp.invoiceInput !== this.state.invoiceInput
    ) {
      isInvoiceChange = true;
    }

    this.setState({
      isInvoiceChange: isInvoiceChange
    });
  };

  routeCancel = () => {
    Router.push(DEBIT_ROUTES.LIST);
  };

  render() {
    const { t } = this.props;
    const {
      blocking,
      isReadyToNext,
      selectedInvoice,
      isLoading,
      options,
      delayTime
    } = this.state;
    const { mainState, contentStep, lang } = this.props;

    return (
      <div id="cn_create">
        <StepIndicator
          activeStep={mainState.currentStep}
          contentStep={contentStep}
          lang={lang}
        />
        <div className="page__header col-12">
          <h2>{t("Please Select Invoice Reference No")}</h2>
        </div>
        <SectionSelectedInvoice title="Reference to">
          <AutoCompleteField
            inputProps={{
              id: `invoiceNumber`,
              name: `invoiceNumber`,
              className: `input-search`,
              title: t(`Invoice No`)
            }}
            placeholder={t("Invoice No")}
            labelKey="externalId"
            minLength={3}
            isLoading={isLoading}
            inputValue={
              mainState.stepOneProp ? mainState.stepOneProp.invoiceInput : ""
            }
            options={options}
            handleAutoCompleteChange={this.handleInvoiceAutoCompleteChange}
            handleSearch={this.handleSearchInvoice}
            delay={delayTime}
          />
        </SectionSelectedInvoice>
        <BlockUi tag="div" blocking={blocking}>
          <SectionTwoHeaderInfo
            id="vendorInfo"
            classColumnWidth="col-12"
            datas={selectedInvoice}
            modelOne={MODEL_VENDOR_INFO}
            modelTwo={MODEL_COMPANY_INFO}
          />
          <SectionCancelAndNext
            handleClickNextButton={this.handleClickNextButton}
            disabled={isReadyToNext}
            nextButton={true}
            lang={lang}
          />
        </BlockUi>
        <ModalCancelWarning
          onClick={this.routeCancel}
          message={CANCEL_CREATE_MESSAGE_PATTERN}
        />
        <div id="smallScreenCover">
          <p className="text-center">
            <img src="/static/img/icon_expanded.png" alt="" />
          </p>
        </div>
      </div>
    );
  }
}
export default withTranslation(["debit-create"])(createDebitNoteStepOne);
