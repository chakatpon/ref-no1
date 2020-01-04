const axios = require("axios");
const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
const URLSearchParams = require("url-search-params");
var base64 = require("base-64");
const queryString = require("query-string");
const fs = require("fs");
var moment = require("moment");
var jwt_decode = require("jwt-decode");
var httpTimeout = 20;
module.exports = function(server, queryString) {
  server.get("/", (req, res) => {
    res.clearCookie("aToken");
    return res.redirect(
      process.env.API_ENDPOINT_AUTHORIZE +
        "?client_id=" +
        process.env.API_CLIENT_ID +
        "&redirect_uri=" +
        process.env.API_REDIRECT_URI +
        "&response_type=code"
    );
  });
  server.get("/logout", (req, res) => {
    res.clearCookie("aToken");
    res.writeHead(302, {
      Location:
        process.env.API_ENDPOINT_LOGOUT ||
        "https://p2p-newui-scg-auth.digitalventures.co.th/logout"
    });
    res.end();
  });
  // Callback for OAuth2 API
  server.get("/user", (req, res) => {
    let authorization = req.headers["authorization"];
    // if (req.cookies["aToken"]) {
    //   authorization = "Bearer " + req.cookies["aToken"];
    // }
    const headers = {
      Authorization: authorization
    };
    //console.log(req.headers);
    return fetch(process.env.API_DOMAIN_URL_12000 + "/user", {
      method: "get",
      strictSSL: false,
      headers
    })
      .then(r => r.json())
      .then(r => {
        return res.send(r);
      })
      .catch(r => {
        console.log(
          "Auth service prolem with :",
          process.env.API_DOMAIN_URL_12000 + "/user"
        );
        return res.send(r.err);
      });
  });
  server.get("/auth/callback", async (req, res) => {
    const headers = {
      //   Accept: "application/json",
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",

      Authorization:
        "Basic " +
        base64.encode(
          process.env.API_CLIENT_ID + ":" + process.env.API_CLIENT_SECRET
        )
    };
    const callback = {
      grant_type: "authorization_code",
      //   client_id: process.env.API_CLIENT_ID,
      redirect_uri: process.env.API_REDIRECT_URI,
      code: req.query.code
    };
    let formData = new URLSearchParams();
    await formData.set("grant_type", "authorization_code");
    // formData.set("client_id", process.env.API_CLIENT_ID);
    await formData.set("redirect_uri", process.env.API_REDIRECT_URI);
    await formData.set("code", req.query.code);
    let resp = await axios
      .post(process.env.API_ENDPOINT_TOKEN, queryString.stringify(callback), {
        timeout: httpTimeout * 1000,
        headers: headers
      })
      .catch(err => {
        console.log(
          "*** Auth service problem while get token :",
          process.env.API_ENDPOINT_TOKEN
        );
        if (err.response) {
          if (err.response.data.message) {
            res
              .status(err.response.data.status)
              .json(err.response.data.message);
          } else if (err.response.data.error_description) {
            if (err.response.data.error.indexOf("invalid_grant") !== -1) {
              res.redirect(301, "/");
            } else {
              res.status(500).json(err.response.data.error_description);
            }
          } else {
            res.status(500).json(err.message);
          }
        } else {
          res.status(500).json(err.message);
        }
        res.end();
        return;
      });
    if (!resp.data) {
      // console.log("No data in respone");

      return res.end();
    }

    if (resp.data.access_token) {
      // console.log(resp.data);
      if (resp.data.expires_on && resp.data.expires_in) {
        diff = resp.data.expires_in * 1000;
        let m = moment.unix(resp.data.expires_on);
        res.cookie("expireToken", m.format("x"), {
          maxAge: diff
        });
        console.warn(
          "Access token is expire after ",
          resp.data.expires_in,
          "second."
        );
      } else if (resp.data.expires_in) {
        diff = resp.data.expires_in * 1000;
        let exp = moment().add(resp.data.expires_in, "seconds");
        var expduration = moment.duration(exp.diff(moment()));
        res.cookie("expireToken", exp.format("x"), {
          maxAge: diff
        });
        console.warn(
          "Access token is expire on ",
          exp.format(),
          expduration.humanize()
        );
      } else {
        let jwt = jwt_decode(resp.data.access_token);
        let rjwt = jwt_decode(resp.data.refresh_token);
        let exp = moment.unix(jwt.exp);
        let rexp = moment.unix(rjwt.exp);
        var diff = rexp.diff(moment());
        var expduration = moment.duration(exp.diff(moment()));
        var rexpduration = moment.duration(rexp.diff(moment()));
        console.warn(
          "Access token is expire in ",
          exp.format(),
          expduration.humanize()
        );
        console.warn(
          "Refresh token is expire in ",
          rexp.format(),
          rexpduration.humanize()
        );
      }

      res.cookie("aToken", resp.data.access_token, {
        maxAge: diff
      });
      res.cookie("rToken", resp.data.refresh_token, {
        maxAge: diff
      });
    }
    if (req.cookies["redirectUrl"] != undefined) {
      let redirectUrl = req.cookies["redirectUrl"];
      res.clearCookie("redirectUrl");
      return res.redirect(redirectUrl);
    } else {
      return res.redirect("/dashboard");
    }
    res.json("yes");
    res.end();
    return;
    // Query API for token
    fetch(process.env.API_ENDPOINT_TOKEN, {
      method: "post",
      strictSSL: false,
      agent: new (require("https")).Agent({
        rejectUnauthorized: false
      }),
      headers: headers,
      body: formData
    })
      .then(r => r.json())
      .then(data => {
        //console.log(data);
        // Store JWT from response in cookies
        if (req.cookies["aToken"] != undefined) {
          res.clearCookie("aToken");
        }
        res.cookie("aToken", data.access_token, {
          maxAge: 900000
        });
        //return res.send(data);
        if (req.cookies["redirectUrl"] != undefined) {
          let redirectUrl = req.cookies["redirectUrl"];
          //res.clearCookie("redirectUrl");
          //return res.redirect(redirectUrl);
        } else {
          //return res.redirect("/dashboard");
        }
        console.log(req.cookies);
        res.send("yes");
        res.end();
      })
      .catch(r => {
        return res.status(500).send(r);
      });

    //Redirect to dashboard after login
    // return app.render(req, res, '/dashboard')
  });
};
