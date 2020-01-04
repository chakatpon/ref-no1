import React, { Component } from "react";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import ReactDOM from "react-dom";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import GA from "~/libs/ga";
import "../libs/mycools";
import UserPanel from "../components/shared/userpanel";
import ExpandedLock from "../components/shared/expandedlock";
import Stepheader from "../components/invoices/create/createstepheader";
import CreateStep1 from "../components/invoices/create/createstep1";
import CreateStep2ByPO from "../components/invoices/create/createstep2bypo";
import CreateStep2ByGR from "../components/invoices/create/createstep2bygr";
import CreateStep3 from "../components/invoices/create/createstep3";
import CreateStep4 from "../components/invoices/create/createstep4";
import CreateStep4ByGR from "../components/invoices/create/createstep4bygr";

class createInvoice extends Component {
  constructor(props) {
    super(props);
    this.toggleBlocking = this.toggleBlocking.bind(this);
    this.setMainState = this.setMainState.bind(this);
    this.state = {
      currentStep: 0,
      stepOneProp: {},
      stepTwoProp: {},
      stepThreeProp: {},
      stepFourProp: {},
      isTour: true,
      openTour: false
    };
    this.layout = React.createRef();
    this.stepHeader = React.createRef();
  }
  setMainState = data => {
    this.setState(data);
  };
  componentWillUpdate(nextProps, nextState) {
    //localStorage.setItem('createInvoiceR7', JSON.stringify(nextState));
  }

  toggleTour = openTour => {
    GA.event({
      category: "Tutorial",
      action: `${openTour ? "Enable Tutorial" : "Disable Tutorial"}`
    });
    this.setState({ openTour });
  };

  closeTour = () => {
    this.setState({ openTour: false });
  };

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }
  componentWillUnmount() {
    this.state = {};
  }
  async componentDidMount() {
    const { permisions } = this.props;
    if (!permisions.includes("Invoice-Create")) {
      Router.push("/invoice");
    }
    // if (localStorage) {
    //   let localcreateInvoiceR7 = localStorage.getItem('createInvoiceR7');
    //   if (localcreateInvoiceR7) {
    //     await this.setState(JSON.parse(localcreateInvoiceR7));
    //     console.log(this.state)
    //   }
    // }

    // //For Dev Only -  Start
    // if (window.location.hash) {
    //   if (window.location.hash.indexOf('#step') !== -1) {
    //     let step = parseInt(window.location.hash.replace('#step', ''))
    //     if (step > 0 && step <= 4) {
    //       this.setState({ currentStep: step })
    //     }

    //   }
    // } else {
    //   window.location.hash = `step1`
    //   this.setState({ currentStep: 1 })
    // }
    //For Dev Only -  End
    this.setState({ currentStep: 1 });
  }

  async nextStep() {
    let step = this.state.currentStep + 1;
    window.location.hash = `step${step}`;
    this.setState({
      currentStep: step
    });
    await this.broadcastCurrentPageState();
  }

  async previousStep() {
    let step = this.state.currentStep - 1;
    window.location.hash = `step${step}`;
    this.setState({
      currentStep: step
    });
    await this.broadcastCurrentPageState();
  }
  async Cancel() {
    this.setState({
      currentStep: 0,
      stepOneProp: {},
      stepTwoProp: {},
      stepThreeProp: {},
      stepFourProp: {}
    });
    Router.push("/invoice");
  }
  broadcastCurrentPageState() {}
  render() {
    return (
      <div>
        <Layout hideNavBar={true} ref={this.layout} {...this.props}>
          <UserPanel
            {...this.props}
            ref={this.stepHeader}
            openTour={this.state.openTour}
            toggleTour={this.toggleTour}
            isTour={this.state.isTour}
          />
          <div>
            <Stepheader {...this.props} mainstate={this.state} />
          </div>
          <div>
            {this.state.currentStep === 1 ? (
              <CreateStep1
                setMainState={this.setMainState}
                Cancel={() => this.Cancel()}
                previousStep={() => this.previousStep()}
                nextStep={() => this.nextStep()}
                {...this.props}
                mainstate={this.state}
                openTour={this.state.openTour}
                closeTour={this.closeTour}
              />
            ) : (
              ""
            )}
            {this.state.currentStep === 2 &&
            this.state.stepOneProp.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
              "PURCHASE_ORDER" ? (
              <CreateStep2ByPO
                setMainState={this.setMainState}
                Cancel={() => this.Cancel()}
                previousStep={() => this.previousStep()}
                nextStep={() => this.nextStep()}
                {...this.props}
                mainstate={this.state}
                openTour={this.state.openTour}
                closeTour={this.closeTour}
              />
            ) : (
              ""
            )}
            {this.state.currentStep === 2 &&
            this.state.stepOneProp.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
              "GOODS_RECEIVED" ? (
              <CreateStep2ByGR
                setMainState={this.setMainState}
                Cancel={() => this.Cancel()}
                previousStep={() => this.previousStep()}
                nextStep={() => this.nextStep()}
                {...this.props}
                mainstate={this.state}
                openTour={this.state.openTour}
                closeTour={this.closeTour}
              />
            ) : (
              ""
            )}
            {this.state.currentStep === 3 ? (
              <CreateStep3
                setMainState={this.setMainState}
                Cancel={() => this.Cancel()}
                previousStep={() => this.previousStep()}
                nextStep={() => this.nextStep()}
                {...this.props}
                mainstate={this.state}
                openTour={this.state.openTour}
                closeTour={this.closeTour}
              />
            ) : (
              ""
            )}
            {this.state.currentStep === 4 &&
            this.state.stepOneProp.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
              "PURCHASE_ORDER" ? (
              <CreateStep4
                setMainState={this.setMainState}
                Cancel={() => this.Cancel()}
                previousStep={() => this.previousStep()}
                nextStep={() => this.nextStep()}
                {...this.props}
                mainstate={this.state}
                openTour={this.state.openTour}
                closeTour={this.closeTour}
              />
            ) : (
              ""
            )}
            {this.state.currentStep === 4 &&
            this.state.stepOneProp.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
              "GOODS_RECEIVED" ? (
              <CreateStep4ByGR
                setMainState={this.setMainState}
                Cancel={() => this.Cancel()}
                previousStep={() => this.previousStep()}
                nextStep={() => this.nextStep()}
                {...this.props}
                mainstate={this.state}
                openTour={this.state.openTour}
                closeTour={this.closeTour}
              />
            ) : (
              ""
            )}
          </div>
          <ExpandedLock />
        </Layout>
      </div>
    );
  }
}
export default withAuth(createInvoice);
