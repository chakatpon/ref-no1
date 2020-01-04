import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import Layout from "~/components/Layout";
import SelectList from "~/components/SelectList";
import LivPostingResult from "~/containers/LivPostingResult";
import withAuth from "~/libs/withAuth";
class livPostingList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "LIV Posting Result"
    };
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
