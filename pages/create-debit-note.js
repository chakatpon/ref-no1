import React, { Component } from "react";
import _ from "lodash";

import withAuth from "../libs/withAuth";
import "../libs/mycools";
import Layout from "../components/Layout";
import UserPanel from "../components/shared/userpanel";
import CreateDebitNoteStepOne from "../components/debit-note/create/create-debit-note-one";
import CreateDebitNoteStepTwo from "../components/debit-note/create/create-debit-note-two";
import CreateDebitNoteStepThree from "../components/debit-note/create/create-debit-note-three";
import CreateDebitNoteStepFour from "../components/debit-note/create/create-debit-note-four";

const CONTENT_STEP = [
  "Select Invoice",
  "Debit Note Items",
  "Insert Debit Note Details",
  "Summary"
];
const lang = "debit-create";

class createDebitNote extends Component {
  constructor(props) {
    super(props);
    this.layout = React.createRef();
    this.state = {
      currentStep: 1,
      stepOneProp: undefined,
      stepTwoProp: undefined,
      stepThreeProp: undefined,
      stepFourProp: undefined,
      isInvoiceChange: true,
      subVatItemChange: true
    };
  }

  nextStep = () => {
    this.setState({
      currentStep: this.state.currentStep + 1
    });
  };

  previousStep = () => {
    this.setState({
      currentStep: this.state.currentStep - 1
    });
  };

  updateStepOneState = state => {
    this.setState({
      stepOneProp: state,
      isInvoiceChange: state.isInvoiceChange
    });
  };

  updateStepTwoState = state => {
    this.setState({
      stepTwoProp: state,
      isInvoiceChange: state.isInvoiceChange,
      subVatItemChange: state.subVatItemChange
    });
  };

  updateStepThreeState = state => {
    this.setState({
      stepThreeProp: state,
      isInvoiceChange: state.isInvoiceChange
    });
  };

  updateStepFourState = state => {
    this.setState({
      stepFourProp: state,
      subVatItemChange: state.subVatItemChange
    });
  };

  render() {
    return (
      <Layout hideNavBar={true} ref={this.layout} {...this.props}>
        <UserPanel {...this.props} />
        {this.state.currentStep === 1 ? (
          <CreateDebitNoteStepOne
            mainState={this.state}
            updateState={this.updateStepOneState}
            nextStep={() => this.nextStep()}
            previousStep={() => this.previousStep()}
            contentStep={CONTENT_STEP}
            lang={lang}
          />
        ) : (
          ""
        )}
        {this.state.currentStep === 2 ? (
          <CreateDebitNoteStepTwo
            mainState={this.state}
            updateState={this.updateStepTwoState}
            nextStep={() => this.nextStep()}
            previousStep={() => this.previousStep()}
            contentStep={CONTENT_STEP}
            lang={lang}
          />
        ) : (
          ""
        )}
        {this.state.currentStep === 3 ? (
          <CreateDebitNoteStepThree
            mainState={this.state}
            updateState={this.updateStepThreeState}
            nextStep={() => this.nextStep()}
            previousStep={() => this.previousStep()}
            contentStep={CONTENT_STEP}
            lang={lang}
          />
        ) : (
          ""
        )}
        {this.state.currentStep === 4 ? (
          <CreateDebitNoteStepFour
            mainState={this.state}
            updateState={this.updateStepFourState}
            previousStep={() => this.previousStep()}
            contentStep={CONTENT_STEP}
            lang={lang}
          />
        ) : (
          ""
        )}
      </Layout>
    );
  }
}
export default withAuth(createDebitNote);
