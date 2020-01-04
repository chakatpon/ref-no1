import React, { Component } from "react";
import Router from "next/router";
import Head from "next/head";
import _ from "lodash";
import Layout from "~/components/Layout";
import withAuth from "../libs/withAuth";
import LivPostingResult from "~/containers/LivPostingResult";
import { MONITOR_LIV_AUTH } from "~/configs/authorise.config";

class livPostingList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "LIV Posting Result"
    };
  }

  componentDidMount() {
    const { permissions } = this.props;
    if (!_.has(this.props.url.query, "filter")) {
      window.location.href = "/liv-posting-result?filter=invoice";
    }
    if (!permissions.includes(MONITOR_LIV_AUTH.VIEW)) {
      Router.push("/dashboard");
    }
  }

  render() {
    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{this.state.title}</title>
        </Head>
        <LivPostingResult {...this.props} {...this.state} />
      </Layout>
    );
  }
}

export default withAuth(livPostingList);
