import React from "react";
import Router from "next/router";
import io from "socket.io-client";

class IOTest extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { permisions } = this.props;
    this.socket = io.connect("/tester");
  }

  successMessage = () => {
    const username = this.props.authority.name;
    this.socket.emit("success", username);
    Router.push("/invoice");
  };

  errorMessage = () => {
    const username = this.props.authority.name;
    this.socket.emit("failed", `${username} is error`);
    Router.push("/invoice");
  };

  componentWillUnmount() {
    this.socket.disconnect();
  }

  render() {
    return (
      <div>
        <button onClick={this.successMessage} className="btn">
          IO Message
        </button>
        <button onClick={this.errorMessage} className="btn">
          Error Message
        </button>
      </div>
    );
  }
}

export default IOTest;
