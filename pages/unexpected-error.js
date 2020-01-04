import React from "react";
import Layout from "../components/Layout";
import Link from "next/link";
import withOutAuth from "../libs/withOutAuth";
class UnexpectedError extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <link rel="stylesheet" href={`/static/cs/login.css`} />
        <style jsx>{`
          #particles-js {
            width: 100%;
            height: 100%;
            background-color: #fff;
            background-image: url("");
            background-size: cover;
            background-position: 50% 50%;
            background-repeat: no-repeat;
          }
          #particles-js.bg-gray {
            background-color: #f1f3f6;
          }
        `}</style>
        <div
          className="loginpage reset-password-page bg-gray"
          id="particles-js"
        >
          <div className="loginpage__wrap loginpage__wrap--bg-2">
            <div className="reset-password-page__header pt-3">
              <div className="row w-100 m-0 p-3 justify-content-between align-items-center">
                <div className="col-auto">
                  <div className="logo mb-2 mb-md-2">
                    <img src={`/static/img/logo/logo_2.png`} />
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
            <div className="container d-flex h-100">
              <div className="row w-100 m-0 justify-content-center align-items-center align-content-center">
                <div className="col-12 col-lg-6 col-lg-5 pb-4 pb-md-0 pt-4 pt-md-0">
                  <div className="row justify-content-center text-center text-md-center text-lg-left">
                    <div className="col-12 col-md-12 col-lg-12 mb-0 mb-md-5 mb-lg-0">
                      <h1 className="gray-1 mb-3 mb-lg-4">Unexpected Error</h1>
                      <p className="mb-0 font-light">
                        An unexpected error has occurred. Please try again
                        later.
                      </p>
                      <p className="mb-0 font-light">
                        เกิดปัญหาบางอย่างที่ระบบ กรุณาทำรายการใหม่อีกครั้ง
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-6 col-lg-5">
                  <div className="row justify-content-center text-lg-left">
                    <div className="col-12 col-md-8 col-lg-12">
                      <div className="box text-center">
                        <div className="icon-alert mb-3 mt-2">
                          <i
                            className="fa fa-exclamation-triangle"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="gray-2 font-light pt-2 pb-2">
                          <strong> Remark / ข้อมูลเพิ่มเติม: </strong>
                          <br></br>
                          {this.props.url.query.statusCode ||
                            "Unknown Status Code"}{" "}
                          : {this.props.url.query.error || "Unknown Error"}
                        </p>
                        <p>{this.props.url.query.message || "-"}</p>
                        <div className="row mt-4 justify-content-center">
                          <div className="col-12 col-md-6">
                            <Link href="/">
                              <a href="/" id="btnSubmit" className="btn w-100">
                                Home
                              </a>
                            </Link>
                          </div>
                        </div>
                      </div>
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

export default withOutAuth(UnexpectedError);
