import React, { Component, Fragment } from "react";
import Layout from "../../components/Layout";
import withAuth from "../../libs/withAuth";
import { PageHeader } from "../../components/page";
class dashboard extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Fragment>
        <Layout {...this.props}>
          <PageHeader title={`Dashboard`} />
          <section className="box box--width-header">
            {/* box--no-shadow */}
            <div className="box__header box__header--shadow">
              <div className="row justify-content-between align-items-center mb-2">
                <div className="col">
                  <h4>Search: </h4>
                </div>
                <div className="col text-right">
                  <a
                    className="btn btn--transparent btn-clear mr-2"
                    href="javascript:;"
                  >
                    <i className="icon icon-x" /> Clear
                  </a>
                  <button className="btn" type="submit">
                    <i className="icon icon-search" /> Search
                  </button>
                </div>
              </div>
              <div className="row justify-content-between align-items-center ml--2 mr--2">
                <div className="col-4 col-md-2 pl-2 pr-2 pb-2 pb-md-0">
                  <div className="form-group">
                    <div className="form-label-group">
                      <input
                        type="text"
                        id="inputDefault"
                        className="form-control"
                        placeholder="PO. No."
                      />
                      <label htmlFor="inputDefault">PO. No.</label>
                    </div>
                  </div>
                </div>
                <div className="col-4 col-md-2 pl-2 pr-2 pb-2 pb-md-0">
                  <div className="form-group">
                    <div className="form-label-group">
                      <input
                        type="text"
                        id="inputDefault2"
                        className="form-control"
                        placeholder="Company Code"
                      />
                      <label htmlFor="inputDefault2">Company Code</label>
                    </div>
                  </div>
                </div>
                <div className="col-4 col-md-2 pl-2 pr-2 pb-2 pb-md-0">
                  <div className="form-group">
                    <div className="form-label-group">
                      <input
                        type="text"
                        id="inputDefault3"
                        className="form-control"
                        placeholder="Vendor Code"
                      />
                      <label htmlFor="inputDefault3">Vendor Code</label>
                    </div>
                  </div>
                </div>
                <div className="col-4 col-md-2 pl-2 pr-2 pb-2 pb-md-0">
                  <div className="form-group">
                    <div className="form-label-group">
                      <input
                        type="text"
                        id="inputDefault4"
                        className="form-control"
                        placeholder="Status"
                      />
                      <label htmlFor="inputDefault4">Status</label>
                    </div>
                  </div>
                </div>
                <div className="col-4 col-md-2 pl-2 pr-2 pb-2 pb-md-0">
                  <div className="form-group">
                    <div className="form-label-group">
                      <input
                        type="text"
                        id="inputDefault5"
                        className="form-control"
                        placeholder="Delivery Date"
                      />
                      <label htmlFor="inputDefault5">Delivery Date</label>
                    </div>
                  </div>
                </div>
                <div className="col-4 col-md-2 pl-2 pr-2 pb-2 pb-md-0 text-center">
                  <div className="purple">
                    {" "}
                    More Search <i className="icon icon-arrow_small_down" />
                  </div>
                </div>
              </div>
            </div>
            {/* box__header */}
            <div className="box__inner">
              <div className="table__wrapper">
                <table className="table datatable">
                  <thead>
                    <tr>
                      <th>PO. No.</th>
                      <th>Company Code</th>
                      <th>Vendor Code</th>
                      <th>Status</th>
                      <th>Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Row 1 Data 1</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                    </tr>
                    <tr>
                      <td>Row 2 Data 1</td>
                      <td>Row 2 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                    </tr>
                    <tr>
                      <td>Row 2 Data 1</td>
                      <td>Row 2 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                    </tr>
                    <tr>
                      <td>Row 2 Data 1</td>
                      <td>Row 2 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                    </tr>
                    <tr>
                      <td>Row 2 Data 1</td>
                      <td>Row 2 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                      <td>Row 1 Data 2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* box__inner */}
          </section>
          <section className="box">
            <div className="box__header"> Entry Date : 07/03/2018 </div>
            {/* box__header */}
          </section>
        </Layout>
      </Fragment>
    );
  }
}

export default withAuth(dashboard);
