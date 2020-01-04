import React, { Component } from "react";
import Router from "next/router";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";

import RemoteComponent from "./remote";
import DocumentTracking from "./document-tracking-common";

const Api = new ApiService();

class DocumentTrackingRouter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
  }

  componentDidMount() {
    try {
      var _this = this;
      const { permisions } = this.props;
      if (!permisions.includes("Document-Tracking-List")) {
        Router.push("/dashboard");
      }
      Api.getCustomTracking().then(result => {
        let customUrl = result;
        let custom = customUrl != "";
        this.setState({
          custom: custom,
          customUrl: customUrl,
          show: true
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    return (
      <div>
        {this.state.show ? (
          this.state.custom ? (
            <RemoteComponent {...this.props} {...this.state} />
          ) : (
              <DocumentTracking {...this.props} {...this.state} />
            )
        ) : (
            <div />
          )}
      </div>
    );
  }
}

export default withAuth(DocumentTrackingRouter);
