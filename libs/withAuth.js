import React, { Component } from "react";
import Router from "next/router";
import api from "./api";
import AuthService from "./AuthService";
import { getCookie, setCookie } from "./Cookies";
import cookie from "js-cookie";
import localStorage from "local-storage";
import NoUser from "~/pages/nouser";
import Unauthorized from "~/pages/unauthorized";
import moment from "moment";
import GA from "~/libs/ga";
const configfile = process.env.CONFIG_FILE || "b2p.config.json";
export default function withAuth(AuthComponent) {
  const apis = new api(process.env.APP_DOMAIN).group("user");
  const Auth = new AuthService(process.env.API_DOMAIN_URL_12000);
  return class Authenticated extends Component {
    static async getInitialProps(ctx) {
      try {
        const ctxx = { query: ctx.query, pathName: ctx.pathName };
        const isServer = !!ctx.req;

        let userAgent;
        let aToken;
        let rToken;
        let domain;
        let procenv = {};
        let appenv = [];
        let ErrorType = "";
        let Infome = [];

        if (!isServer) {
          userAgent = navigator.userAgent;
          aToken = cookie.get("aToken");
          rToken = cookie.get("rToken");
          domain = ".";
        } else {
          userAgent = ctx.req.headers["user-agent"];
          aToken = ctx.req.cookies["aToken"];
          rToken = ctx.req.cookies["rToken"];
          domain = process.env.APP_DOMAIN;
          procenv = process.env;
        }

        try {
          appenv = await apis.call("config");
        } catch (err) {}

        let isLoading = true;
        if (!aToken || !rToken) {
          if (isServer) {
            /* Add auto redirect after login - Start */
            //console.log("aToken is :", ctx.req.cookies["aToken"]);
            console.log("current url is :", ctx.req.originalUrl);
            ctx.res.cookie("redirectUrl", ctx.req.originalUrl);
            ctx.res.writeHead(301, { Location: "/" });
            //ctx.res.redirect(301, "/unauthorized");
            /* Add auto redirect after login - End */
            //ctx.res.write("unauthorized");
            ctx.res.end();
            return;
          } else {
            setCookie(
              "redirectUrl",
              window.location.pathname +
                window.location.hash +
                window.location.search
            );

            // alert(
            //   window.location.pathname +
            //     window.location.hash +
            //     window.location.search
            // );
            Router.push("/");
            return;
          }
        } else {
          apis.setToken(aToken);
          setCookie("aToken", aToken);
          isLoading = false;
        }
        let me = [];
        let authority = [];
        let permisions = [];
        // api info/me
        me = cookie.get("Infome");
        if (me) {
          me = JSON.parse(me);
        } else {
          try {
            me = await apis.call("me");
            setCookie("Infome", JSON.stringify(me), {
              expires: 0.021 //day
            });
            GA.event({
              category: "Authorization",
              action: "Call Auth. [/me] API (Success)",
              label: `${moment().format()} | api/info/me | ${
                me.organisationUnit
              } | ${aToken}`
            });
          } catch (err) {
            if (isServer) {
              if (
                err.code == "ECONNABORTED" ||
                err.response.data.statusCode == 503 ||
                err.response.data.statusCode == 504
              ) {
                GA.event({
                  category: "Authorization",
                  action: "Call Auth. API (No Response)",
                  label: `${moment().format()} | api/info/me | ${aToken}`
                });
                ctx.res.redirect(301, "/timeout");
                ctx.res.send("timeout");
                ctx.res.end();
                return;
              } else if (
                err.response &&
                err.response.data &&
                (err.response.data.statusCode == 401 ||
                  err.response.data.statusCode == 403)
              ) {
                console.log("current url is :", ctx.req.originalUrl);
                ctx.res.cookie("redirectUrl", ctx.req.originalUrl);
                ctx.res.redirect(301, "/");
                ctx.res.send("unauthorized");
                ctx.res.end();
                return;
              }

              ctx.res.send(
                "<h2>Cannot get user information from API.</h2>" + err.message
              );

              ctx.res.end();
            } else {
              Router.push("/");
              return;
            }
          }
        }
        //api /user
        try {
          authority = await apis.call("authority");
          GA.event({
            category: "Authorization",
            action: "Call Auth. [/user] API (Success)",
            label: `${moment().format()} | api/user | ${
              me.organisationUnit
            } | ${authority.name}`
          });
        } catch (err) {
          if (isServer) {
            if (
              err.code == "ECONNABORTED" ||
              err.response.data.statusCode == 503 ||
              err.response.data.statusCode == 504
            ) {
              GA.event({
                category: "Authorization",
                action: "Call Auth. [/user] API (No Response)",
                label: `${moment().format()} | api/user | ${
                  me.organisationUnit
                } | ${authority.name}`
              });
              ctx.res.redirect(301, "/timeout");
              ctx.res.send("timeout");
              ctx.res.end();
              return;
            } else if (
              err.response &&
              err.response.data &&
              (err.response.data.statusCode == 401 ||
                err.response.data.statusCode == 403)
            ) {
              console.log("current url is :", ctx.req.originalUrl);
              ctx.res.cookie("redirectUrl", ctx.req.originalUrl);
              ctx.res.redirect(301, "/");
              ctx.res.send("unauthorized");
              ctx.res.end();
              return;
            }

            ctx.res.send(
              "<h2>Cannot get user information from API.</h2>" + err.message
            );

            ctx.res.end();
          } else {
            Router.push("/");
            return;
          }
        }

        try {
          if (authority) {
            authority.authorities.map(r => {
              if (r.authority !== null) {
                //ErrorType = "nouser";
                //r.authority = null;
                return r.authority.split(",").map(rr => {
                  if (rr != "USER" && rr != "server" && rr != "") {
                    permisions.push(rr);
                  }
                });
              } else {
                ErrorType = "nouser";
                console.log("nouser");
              }
            });
          } else {
            console.warn("authority not response", authority);
          }
        } catch (err) {
          if (isServer) {
            ctx.res.render("exception.html", {
              detail: err.message,
              statusCode: 500,
              title: "Exception Occured (authorities)"
            });
            ctx.res.end();
          } else {
            Router.push("/exception");
          }
        }

        const pageProps =
          AuthComponent.getInitialProps &&
          (await AuthComponent.getInitialProps(ctx));
        const url = { query: ctx.query, pathName: ctx.pathName };

        return {
          ...pageProps,
          userAgent,
          isLoading,
          token: aToken,
          url,
          user: me,
          authority,
          permisions,
          permissions: permisions,
          domain,
          appenv,
          ErrorType,
          configfile
        };
      } catch (err) {
        const isServer = !!ctx.req;
        if (isServer) {
          ctx.res.render("exception.html", {
            detail: err.message,
            statusCode: 500,
            title: "Exception Occured"
          });
          ctx.res.end();
        } else {
          Router.push("/exception");
          return;
          //throw new Error(err);
        }
      }
    }

    constructor(props) {
      super(props);
    }

    async componentDidMount() {
      if (!this.props.token) {
        Router.push("/");
      }
    }

    render() {
      return this.props.permissions.length == 0 ? (
        this.props.ErrorType == "nouser" ? (
          <NoUser {...this.props} />
        ) : (
          <Unauthorized {...this.props} />
        )
      ) : (
        <AuthComponent {...this.props} />
      );
    }
  };
}
