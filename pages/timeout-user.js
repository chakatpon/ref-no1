import React from "react";
import Layout from "../components/Layout";
import Link from "next/link";
import withOutAuth from "../libs/withOutAuth";
import moment from "moment";
class Timeout extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    console.log("componentsDidMount");
    console.log();
  }
  render() {
    const { domain: assetPrefix } = this.props;
    return (
      <div>
        <link rel="stylesheet" href={`${assetPrefix}/static/cs/login.css`} />
        <div
          className="loginpage reset-password-page bg-lightgray-3"
          id="particles-js"
        >
          <div className="loginpage__wrap loginpage__wrap--bg-2">
            <div className="reset-password-page__header pt-3">
              <div className="row w-100 m-0 p-3 justify-content-between align-items-center">
                <div className="col-auto">
                  <div className="logo mb-2 mb-md-2">
                    <img
                      src={`${assetPrefix}/static/img/logo/logo-horizontal.png`}
                    />
                  </div>
                </div>
                <div className="col-auto">
                  <Link href={`/`}>
                    <a href={`/`} className="purple text-bold">
                      {" "}
                      <i className="icon icon-arrow_small_left" /> Back to Home
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="container d-flex flex-wrap h-100">
              <div className="row w-100 m-0 justify-content-center align-items-center align-content-center">
                <div id="message-box" className="col-12 col-lg-7">
                  <div className="row justify-content-center text-center text-md-center text-lg-left">
                    <div className="col-12 col-md-12 col-lg-12 mb-0 mb-md-5 mb-lg-0">
                      <h1 className="gray-1 mb-3 mb-lg-4">
                        Service Temporarily Unavailable.
                      </h1>
                      <p className="mb-0 font-light">
                        We are currently experiencing technical difficulties.{" "}
                        <br />
                        Please try again later.
                        <br />
                        ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้
                        กรุณาทำรายการใหม่อีกครั้ง
                        <br />
                        {moment().format()}
                        <br />
                        API: api/user
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withOutAuth(Timeout);
