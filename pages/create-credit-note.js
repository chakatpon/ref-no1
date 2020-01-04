import React, { Component } from "react";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import ReactDOM from "react-dom";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import "../libs/mycools";
import GA from "~/libs/ga";

import CreateCreditNoteOne from "../components/create-credit-note/create-credit-note-one";
import CreateCreditNoteTwo from "../components/create-credit-note/create-credit-note-two";
import CreateCreditNoteThree from "../components/create-credit-note/create-credit-note-three";
import CreateCreditNoteFour from "../components/create-credit-note/create-credit-note-four";

const Api = new ApiService();

class createCreditNote extends Component {
  constructor(props) {
    super(props);
    this.toggleBlocking = this.toggleBlocking.bind(this);
    this.state = {
      //Step Control
      currentStep: 1,
      //Step Props
      stepOneProp: undefined,
      stepTwoProp: undefined,
      stepThreeProp: undefined,
      stepFourProp: undefined
    };
    this.layout = React.createRef();
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  componentDidMount() {}

  async nextStep() {
    this.setState({
      currentStep: this.state.currentStep + 1
    });
    await this.broadcastCurrentPageState();
  }

  async previousStep() {
    this.setState({
      currentStep: this.state.currentStep - 1
    });
    await this.broadcastCurrentPageState();
  }

  updateStepOneState = state => {
    this.setState({
      stepOneProp: state
    });

    this.broadcastCurrentPageState();
  };

  updateStepTwoState = state => {
    this.setState({
      stepTwoProp: state
    });

    this.broadcastCurrentPageState();
  };

  updateStepThreeState = state => {
    this.setState({
      stepThreeProp: state
    });

    this.broadcastCurrentPageState();
  };

  updateStepFourState = state => {
    this.setState({
      stepFourProp: state
    });

    this.broadcastCurrentPageState();
  };

  //// PRIVATE FUNCTION ////
  broadcastCurrentPageState() {
    console.log(
      "////////////////////// THIS IS CREATE CREDIT NOTE PAGE CURRENT STATE //////////////////"
    );
    console.log(this.state);
    console.log(
      "////////////////////// --------------------------------------- //////////////////"
    );
  }

  render() {
    return (
      <div>
        <Layout hideNavBar={true} ref={this.layout} {...this.props}>
          <div className="w-100 d-flex flex-wrap">
            <div id="control-panel" className="ml-auto d-flex">
              {/* Desktop Version - Start */}
              <div class="d-none d-lg-flex">
                {/* <a
                  href="javascript:void(0);"
                  id="btnNoti"
                  data-toggle="tooltip"
                  data-placement="bottom"
                  title="Notifications"
              >
                  <i class="icon icon-icon_noti" />
              </a> */}
                {this.props.user.legalName.split(",")[1] === " O=SCG1" ||
                this.props.user.legalName.split(",")[1] === " O=SCGPA" ||
                this.props.user.legalName.split(",")[1] === " O=SUPPLIER1" ? (
                  <a
                    href={this.props.appenv.SUPPORT_SCG_URL}
                    id="btnCallcenter"
                    target="_blank"
                    data-toggle="popover"
                    data-placement="bottom"
                    data-content="myRequests"
                    onClick={() => {
                      GA.event({
                        category: "myRequests",
                        action: "Link to myRequests"
                      });
                    }}
                  >
                    <i className="icon icon-icon_callcenter" />
                  </a>
                ) : (
                  ""
                )}
                <a
                  href={this.props.appenv.SUPPORT_URL}
                  id="btnHelp"
                  target="_blank"
                  data-toggle="popover"
                  data-placement="bottom"
                  data-content="Help"
                  onClick={() => {
                    GA.event({
                      category: "Help",
                      action: "Link to Help"
                    });
                  }}
                >
                  <i className="icon icon-icon_help" />
                </a>
                <a href="javascript:void(0);" id="btnUser">
                  <i className="icon icon-icon-user-profile" />{" "}
                  {this.props.authority.userAuthentication.name}
                </a>
              </div>
              {/* Desktop Version - End */}

              {/* Mobile Version - Start */}
              <div class="d-flex d-lg-none">
                <a href="javascript:void(0);" id="btnSearch">
                  <i class="icon icon-search" />
                </a>
                <a
                  href="#mobile-control-panel"
                  id="btnControlPanel"
                  data-toggle="collapse"
                  role="button"
                  aria-expanded="false"
                  aria-controls="mobile-control-panel"
                >
                  <i class="fa fa-ellipsis-h" />
                </a>

                {/* Mobile Control Panel - Start */}
                <div
                  id="mobile-control-panel"
                  className="collapse multi-collapse"
                >
                  <ul>
                    {this.props.user.legalName.split(",")[1] === " O=SCG1" ||
                    this.props.user.legalName.split(",")[1] === " O=SCGPA" ||
                    this.props.user.legalName.split(",")[1] ===
                      " O=SUPPLIER1" ? (
                      <li>
                        <a href={this.props.appenv.SUPPORT_URL}>Help</a>
                      </li>
                    ) : (
                      ""
                    )}
                    <li>
                      <a href={this.props.appenv.SUPPORT_SCG_URL}>MyRequest</a>
                    </li>
                    <li>
                      <a href="javascript:void(0);">My Account</a>
                    </li>
                    <li>
                      <a href="javascript:void(0);">Setting</a>
                    </li>
                    <li>
                      <a href="javascript:void(0);">Logout</a>
                    </li>
                  </ul>
                </div>
                {/* Mobile Control Panel - End */}
              </div>
              {/* Mobile Version - End */}
            </div>
          </div>

          {this.state.currentStep === 1 ? (
            <CreateCreditNoteOne
              mainState={this.state}
              updateState={this.updateStepOneState}
              nextStep={() => this.nextStep()}
              previousStep={() => this.previousStep()}
            />
          ) : (
            ""
          )}
          {this.state.currentStep === 2 ? (
            <CreateCreditNoteTwo
              mainState={this.state}
              updateState={this.updateStepTwoState}
              nextStep={() => this.nextStep()}
              previousStep={() => this.previousStep()}
            />
          ) : (
            ""
          )}
          {this.state.currentStep === 3 ? (
            <CreateCreditNoteThree
              mainState={this.state}
              updateState={this.updateStepThreeState}
              nextStep={() => this.nextStep()}
              previousStep={() => this.previousStep()}
            />
          ) : (
            ""
          )}
          {this.state.currentStep === 4 ? (
            <CreateCreditNoteFour
              mainState={this.state}
              updateState={this.updateStepFourState}
              previousStep={() => this.previousStep()}
            />
          ) : (
            ""
          )}
        </Layout>
      </div>
    );
  }
}
export default withAuth(createCreditNote);
