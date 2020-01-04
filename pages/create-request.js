import React, { Component } from "react";
import _ from "lodash";

import withAuth from "../libs/withAuth";
import "../libs/mycools";
import Layout from "../components/Layout";
import UserPanel from "../components/shared/userpanel";
import CreateRequestStepOne from "../components/request/create/create-request-one";
import CreateRequestStepTwo from "../components/request/create/create-request-two";
import CreateRequestStepThree from "../components/request/create/create-request-three";
import CreateRequestStepFour from "../components/request/create/create-request-four";
import { withTranslation } from "~/i18n";

const CONTENT_STEP = [
  "Select Request Type",
  "Add Items",
  "Request Details",
  "Summary"
];
const lang = "request-create";

class CreateRequest extends Component {
  constructor(props) {
    super(props);
    this.layout = React.createRef();
    this.state = {
      currentStep: 1,
      stepOneProp: undefined,
      stepTwoProp: undefined,
      stepThreeProp: undefined,
      stepFourProp: undefined,
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
      stepOneProp: state
    });
  };

  updateStepTwoState = state => {
    this.setState({
      stepTwoProp: state,
      subVatItemChange: state.subVatItemChange
    });
  };

  updateStepThreeState = state => {
    this.setState({
      stepThreeProp: state
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
          <CreateRequestStepOne
            mainState={this.state}
            mainProps={this.props}
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
          <CreateRequestStepTwo
            mainState={this.state}
            mainProps={this.props}
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
          <CreateRequestStepThree
            mainState={this.state}
            mainProps={this.props}
            updateState={this.updateStepThreeState}
            nextStep={() => this.nextStep()}
            previousStep={() => this.previousStep()}
            contentStep={CONTENT_STEP}
          />
        ) : (
          ""
        )}
        {this.state.currentStep === 4 ? (
          <CreateRequestStepFour
            mainState={this.state}
            updateState={this.updateStepFourState}
            previousStep={() => this.previousStep()}
            contentStep={CONTENT_STEP}
          />
        ) : (
          ""
        )}
      </Layout>
    );
  }
}
export default withAuth(withTranslation(["request-create"])(CreateRequest));
