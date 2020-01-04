import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import Layout from "../components/Layout";
import List from "../components/List";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import Link from "next/link";
import {
  PageHeader,
  Collapse,
  CollapseItemText,
  CollapseItemLink,
  CollapseItemDatatable,
  CollapseItemRevised,
  CollapseNoExpand
} from "../components/page";

export class PurchaseOrderCondition extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("po");
    this.api = new ApiService();
    this.state = {
      title: "Condition",
      data: {}
    };
  }
  async componentDidMount() {
    const res = await this.apis.call("detail", {
      linearId: this.props.url.query.linearId
    });
    this.setState({
      data: res.rows[0]
    });
  }
  render() {
    const { linearId, purchaseOrderNumber } = this.props.url.query;
    let breadcrumbs = [
      { title: "Purchase Order", url: "/purchase-order" },
      {
        title: `Purchase Order No. ${purchaseOrderNumber}`,
        url: `/purchase-order-detail?linearId=${linearId}`
      },
      {
        title: "Condition",
        active: true
      }
    ];
    return (
      <Layout {...this.props} {...this.state}>
        <PageHeader
          title="Condition"
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <div>
          <CollapseNoExpand
            id="condition"
            expanded="true"
            collapseHeader={["Condition"]}
          >
            {this.state.data.customisedFields &&
            this.state.data.customisedFields.condition !== ""
              ? this.state.data.customisedFields.condition
              : "No Data"}
            {/* Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ullam, ea,
            nostrum sint a tenetur magni consectetur id maiores, voluptatibus
            quae quis aliquid officia doloribus velit repellendus explicabo amet
            suscipit non? Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Facilis non, earum expedita inventore vitae nobis tempora fuga
            voluptatibus sint quasi, provident ipsa consequatur explicabo
            voluptates tempore sequi temporibus dolores. Neque. Lorem ipsum
            dolor sit amet consectetur adipisicing elit. Ullam corrupti laborum
            voluptatum, sapiente voluptate porro? Sapiente dolor eveniet
            repellendus maxime obcaecati, at quia quod eos nisi fugit ipsa
            doloremque! Dolorum! Lorem ipsum dolor, sit amet consectetur
            adipisicing elit. Sequi nihil magnam earum minus suscipit inventore
            eligendi eveniet cupiditate laudantium, aut labore amet, distinctio,
            ipsum beatae enim. Praesentium omnis officia placeat.
            <br />
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem
            suscipit dolor quod reiciendis ullam magni in consectetur commodi a
            ducimus. Exercitationem adipisci vel iusto possimus deleniti error
            eius earum ullam?Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Voluptatem suscipit dolor quod reiciendis ullam magni in
            consectetur commodi a ducimus. Exercitationem adipisci vel iusto
            possimus deleniti error eius earum ullam?
            <br />
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem
            suscipit dolor quod reiciendis ullam magni in consectetur commodi a
            ducimus. Exercitationem adipisci vel iusto possimus deleniti error
            eius earum ullam?Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Voluptatem suscipit dolor quod reiciendis ullam magni in
            consectetur commodi a ducimus. Exercitationem adipisci vel iusto
            possimus deleniti error eius earum ullam?Lorem ipsum dolor sit amet
            consectetur adipisicing elit. Voluptatem suscipit dolor quod
            reiciendis ullam magni in consectetur commodi a ducimus.
            Exercitationem adipisci vel iusto possimus deleniti error eius earum
            ullam?
            <br />
            <br />
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem
            suscipit dolor quod reiciendis ullam magni in consectetur commodi a
            ducimus. Exercitationem adipisci vel iusto possimus deleniti error
            eius earum ullam?Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Voluptatem suscipit dolor quod reiciendis ullam magni in
            consectetur commodi a ducimus. Exercitationem adipisci vel iusto
            possimus deleniti error eius earum ullam?Lorem ipsum dolor sit amet
            consectetur adipisicing elit. Voluptatem suscipit dolor quod
            reiciendis ullam magni in consectetur commodi a ducimus.
            Exercitationem adipisci vel iusto possimus deleniti error eius earum
            ullam?Lorem ipsum dolor sit amet consectetur adipisicing elit.
            Voluptatem suscipit dolor quod reiciendis ullam magni in consectetur
            commodi a ducimus. Exercitationem adipisci vel iusto possimus
            deleniti error eius earum ullam?Lorem ipsum dolor sit amet
            consectetur adipisicing elit. Voluptatem suscipit dolor quod
            reiciendis ullam magni in consectetur commodi a ducimus.
            Exercitationem adipisci vel iusto possimus deleniti error eius earum
            ullam?
            <br />
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem
            suscipit dolor quod reiciendis ullam magni in consectetur commodi a
            ducimus. Exercitationem adipisci vel iusto possimus deleniti error
            eius earum ullam? */}
          </CollapseNoExpand>
          <div className="row">
            <div className="col-12 d-flex justify-content-center">
              <Link href={`/purchase-order-detail?linearId=${linearId}`}>
                <a className="btn btn-wide mr-5 mb-30">
                  <i className="fa fa-chevron-left" /> Back
                </a>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default withAuth(PurchaseOrderCondition);
