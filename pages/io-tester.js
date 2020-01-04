import React from "react";
import Router from "next/router";
import io from "socket.io-client";
import withAuth from "../libs/withAuth";

class IOTester extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { permisions } = this.props;
    // if (!permisions.includes("io-tester")) {
    //   Router.push("/dashboard");
    // }
    const username = "testadm1";
    // this.socket = io.connect("/tester");
    // this.emit(username, "this message from io-tester");
  }

  emitMessage = () => {
    // this.socket.emit("success", "Hello B2P");
  };

  render() {
    return (
      <div className="container">
        <h1>IO - Tester - Page </h1>
        <button onClick={this.emitMessage} className="btn">
          Notifition after 10 second
        </button>
      </div>
    );
  }
}

export default withAuth(IOTester);
