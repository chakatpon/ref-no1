import React, { Component } from "react";
import Router from "next/router";
import withAuth from "../libs/withAuth";
import Layout from "../components/Layout";
import api from "../libs/api";
class invoiceGo extends Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("invoice");
  }
  async componentDidMount() {
    try {
      const { linearId, ref, purchaseOrderNumber } = this.props.url.query;
      let invoice = await this.apis.call("list", {
        invoiceNumber: linearId,
        role: this.props.user.organisationUnit
      });
      if (invoice && invoice.data.length == 1) {
        const { linearId } = invoice.data[0];
        Router.push(
          `/invoice-detail?linearId=${linearId}&ref=${ref}&purchaseOrderNumber=${purchaseOrderNumber}`
        );
      } else {
        alert("Invoice Number is not correct");
        // Router.back();
      }
    } catch (err) {
      alert("Invoice Number is not match");
      Router.back();
    }
  }
  render() {
    return (
      <Layout {...this.props} {...this.state}>
        <div>Loading...</div>
      </Layout>
    );
  }
}

export default withAuth(invoiceGo);
