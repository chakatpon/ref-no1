import React from "react";
import Head from "next/head";
import _ from "lodash";
import App, { Container } from "next/app";
import Link from "next/link";
import NProgress from "nprogress";
import Router from "next/router";
import { appWithTranslation } from "~/i18n";

import cookie from "js-cookie";
import moment from "moment";
import GA from "~/libs/ga";
import NotificationBuilder from "../components/NotificationBuilder";
import { i18n, withTranslation } from "~/i18n";

const linkStyle = {
  margin: "0 10px 0 0"
};

Router.events.on("routeChangeStart", url => {
  NProgress.start();
});
Router.events.on("routeChangeComplete", url => {
  console.log("routeChangeComplete", url);

  NProgress.done();
});
Router.events.on("routeChangeError", () => NProgress.done());
Router.events.on("NavigationCancel", () => NProgress.done());
class MyApp extends App {
  static async getInitialProps({ Component, router, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = (await Component.getInitialProps(ctx)) || {};
    }
    router.events.on("routeChangeComplete", url => {
      GA.initialize(pageProps);
      GA.pageview(url);
    });
    return { pageProps };
  }

  render() {
    // Fix ToFixed() BUG method for by prototype.
    (function(prototype) {
      var toFixed = prototype.toFixed;

      prototype.toFixed = function(fractionDigits) {
        var split = this.toString().split(".");
        var number = +(!split[1] ? split[0] : split.join(".") + "1");

        return toFixed.call(number, fractionDigits);
      };
    })(Number.prototype);
    const { Component, pageProps = {} } = this.props;
    let liveChat = false;

    if (typeof pageProps.user !== "undefined") {
      liveChat =
        _.get(this.props, "pageProps.user.legalName", "").includes(
          "O=SUPPLIER"
        ) || false;

      if (this.props.pageProps.appenv.MULTILANG_CONFIG) {
        if (this.props.pageProps.appenv.MULTILANG_CONFIG.length <= 1) {
          if (
            i18n.options.allLanguages.includes(
              this.props.pageProps.appenv.MULTILANG_CONFIG[0]
            )
          ) {
            i18n.changeLanguage(
              this.props.pageProps.appenv.MULTILANG_CONFIG[0]
            );
          } else {
            i18n.changeLanguage("en");
          }
        }
      } else {
        i18n.changeLanguage("en");
      }
    }

    //GA.pageview(this.props.url);
    //console.log("this is app props : ", this.props);
    return (
      <Container>
        <Head>
          {liveChat ? (
            <script
              id="ze-snippet"
              src="https://static.zdassets.com/ekr/snippet.js?key=1342a5ca-070f-4b28-884a-baa7bedfc8d8"
            ></script>
          ) : null}
          <title>B2P Application</title>
        </Head>
        <Component {...pageProps} />
        <NotificationBuilder {...pageProps} />
      </Container>
    );
  }
}
export default appWithTranslation(MyApp);
