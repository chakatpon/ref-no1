import React, { Component } from "react";
import Router from "next/router";
import api from "./api";
import AuthService from "./AuthService";
import { getCookie, setCookie } from "./Cookies";
import cookie from "js-cookie";
import localStorage from "local-storage";
export default function withOutAuth(NoAuthComponent) {
  const apis = new api(process.env.APP_DOMAIN).group("user");
  const Auth = new AuthService(process.env.API_DOMAIN_URL_12000);
  return class Authenticated extends Component {
    static async getInitialProps(ctx) {
      try {
        const ctxx = { query: ctx.query, pathName: ctx.pathName };
        const isServer = !!ctx.req;

        // Ensures material-ui renders the correct css prefixes server-side
        let userAgent;
        let domain;
        if (!isServer) {
          userAgent = navigator.userAgent;
          domain = ".";
        } else {
          userAgent = ctx.req.headers["user-agent"];
          domain = process.env.APP_DOMAIN;
        }

        // Check if Page has a `getInitialProps`; if so, call it.
        const pageProps =
          NoAuthComponent.getInitialProps &&
          (await NoAuthComponent.getInitialProps(ctx));
        const url = { query: ctx.query, pathName: ctx.pathName };
        // Return props.
        return {
          ...pageProps,
          userAgent,
          url,
          domain
        };
      } catch (err) {
        const isServer = !!ctx.req;
        if (isServer) {
          ctx.res.send(err.message);
          ctx.res.end();
        } else {
          throw new Error(err);
        }
      }
    }

    constructor(props) {
      super(props);
    }

    async componentDidMount() {
      try {
      } catch (err) {
        console.log(err);
        //Router.push('/logout')
      }
    }

    render() {
      return (
        <div>
          <NoAuthComponent {...this.props} />
        </div>
      );
    }
  };
}
