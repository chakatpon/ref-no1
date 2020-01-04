import React from "react";
import Head from "next/head";
import moment from "moment";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import Router from "next/router";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    const { token: accessToken } = this.props;
    //Router.push("/purchase-order");
    //return;
  }
  render() {
    const { token, user, authority, permisions } = this.props;
    //const user = this.props.auth.getProfile()
    return (
      <div>
        <Head>
          <title>Dashboard</title>
        </Head>
        <Layout {...this.props}>
          <div id="dashboard">
            <div className="page__header d-flex flex-wrap">
              <h2 className="col-8">Dashboard</h2>
            </div>
            <section className="box box--width-header col-12">
              <div className="box__header">
                <div className="d-flex flex-wrap justify-content-between pt-3">
                  <div className="col">
                    <h5 className="gray-1">Hi, {authority.name}</h5>
                    <p>
                      {user.organisation}, {user.organisationUnit}
                    </p>
                    <p>
                      Token Expire On :{" "}
                      {moment(
                        authority.userAuthentication.details.exp * 1000
                      ).format("DD/MM/YYYY HH:mm:ss")}{" "}
                      (
                      {moment(
                        authority.userAuthentication.details.exp * 1000
                      ).fromNow()}
                      )
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Layout>
      </div>
    );
  }
}
export default withAuth(Dashboard);
