import React from "react";

import ModalAlert from "./modalAlert";
import Dropzone from "react-dropzone";

const style = {
  textInDropfile: {
    fontSize: "16px",
    fontFamily: "kanitlight",
    color: "#c3c3c3"
  },
  blankFileBox: {
    minHeight: "40px"
  }
};

export const formatBytes = (a, b) => {
  if (0 == a) return "0 Bytes";
  var c = 1024,
    d = b || 2,
    e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    f = Math.floor(Math.log(a) / Math.log(c));
  return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f];
};

export default class ModalDropFile extends React.Component {
  state = {
    files: [],
    noReason: false,
    isReasonRequire: this.props.isReasonRequire || false,
    disabledButton: true,
    buttonAlert: [
      {
        label: "Back",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: this.props.onCancelButton
        }
      },
      {
        label: "Submit",
        attribute: {
          className: "btn btn-wide",
          onClick: this.onApprove
        }
      }
    ],
    reasonText: "",
    fileError: ""
  };

  componentWillReceiveProps(props) {
    if (this.props.isVisible != props.isVisible) {
      this.initState(props);
    }
  }

  initState = props => {
    this.setState({
      files: [],
      noReason: false,
      isReasonRequire: props.isReasonRequire || false,
      disabledButton: true,
      reasonText: "",
      fileError: "",
      buttonAlert: [
        {
          label: "Back",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: props.onCancelButton
          }
        },
        {
          label: "Submit",
          attribute: {
            className: "btn btn-wide",
            onClick: this.onApprove
          }
        }
      ]
    });
  };

  onApprove = async () => {
    if (this.state.isReasonRequire && !this.state.reasonText) {
      this.setState({
        noReason: true
      });
    } else {
      await this.props.onCancelButton();
      await this.props.onSubmitButton();
    }
  };

  onReasonChange = e => {
    this.setState({
      reasonText: e.target.value
    });

    this.props.onReasonChange(e);
  };

  onDrop = files => {
    let fileError = "";
    const configFile = this.props.configFile;
    const oldFile = this.state.files;
    const newfiles = oldFile.concat(files);
    if (configFile) {
      files.forEach(file => {
        const typeFile = file.name.split(".")[file.name.split(".").length - 1];
        if (!configFile.fileType.includes(typeFile.toUpperCase())) {
          fileError = "File type not allow";
        }
        if (file.size >= 3145728) {
          fileError = "Don't upload fire more than 3MB";
        }
      });
      if (newfiles.length > configFile.maximumNumberOfFiles) {
        fileError = `Please Don't upload more than ${
          configFile.maximumNumberOfFiles
        } file`;
      }
    }
    if (fileError) {
      this.setState({
        fileError
      });
    } else {
      if (this.props.onFileChange) this.props.onFileChange(newfiles);
      this.setState({
        files: newfiles,
        fileError: ""
      });
    }
  };

  onCancel = index => {
    const oldFile = this.state.files;
    oldFile.splice(index, 1);
    if (this.props.onFileChange) this.props.onFileChange(oldFile);
    this.setState({
      files: oldFile
    });
  };

  render() {
    const { title, isVisible, configFile } = this.props;
    const {
      files,
      buttonAlert,
      noReason,
      fileError,
      reasonText,
      isReasonRequire
    } = this.state;

    const minimumNumberOfFiles = configFile
      ? configFile.minimumNumberOfFiles
      : 0;
    const maximumNumberOfFiles = configFile
      ? configFile.maximumNumberOfFiles
      : 0;

    if (
      ((isReasonRequire && !reasonText) ||
        files.length < minimumNumberOfFiles ||
        files.length > maximumNumberOfFiles) &&
      buttonAlert[1]
    ) {
      buttonAlert[1].attribute.disabled = true;
    } else if (buttonAlert[1]) {
      buttonAlert[1].attribute.disabled = false;
    }

    return (
      <ModalAlert title={title} visible={isVisible} button={buttonAlert}>
        <div>
          <div className="col-12">
            <div className="form-group">
              <div className="form-label-group">
                <textarea
                  name="reject_reason"
                  className={`${
                    !noReason ? "border" : "required"
                  } box-error rounded border-1px border-lightgray`}
                  placeholder={`Reason ${isReasonRequire ? "*" : ""}`}
                  rows="5"
                  style={{
                    width: "100%",
                    resize: "none",
                    padding: "15px",
                    outline: 0
                  }}
                  onChange={this.onReasonChange}
                  value={reasonText}
                />
              </div>
              <div className="text-danger" hidden={!noReason}>
                This field is required
              </div>
            </div>
          </div>
          <div id="upload-section" className="col-12">
            <h5>Attachments</h5>
            <Dropzone
              style={{
                position: "relative",
                width: "100%",
                textAlign: "center"
              }}
              className="uploadArea custom-fileUpload"
              onDrop={files => this.onDrop(files)}
            >
              <div
                style={{
                  backgroundImage: "url(../static/img/dragdrop_bg.png)",
                  backgroundPosition: "center center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                  padding: "60px 30px"
                }}
              >
                <p style={style.textInDropfile}>Drag & Drop files here</p>
                <p style={style.textInDropfile}>or</p>
                <button className="btn btn--transparent btn-wide" type="button">
                  Browse files
                </button>
              </div>
            </Dropzone>

            <p className="small">
              File type: {configFile ? configFile.fileType : ""}, Required:{" "}
              {minimumNumberOfFiles}-{maximumNumberOfFiles} files
            </p>
            {fileError && <div className="text-danger">{fileError}</div>}

            <h5>Selected files</h5>

            <div className="with-100" style={{ backgroundColor: "#c3c3c3" }}>
              {files.map((file, index) => {
                return (
                  <div
                    key={file.name + index}
                    className="d-flex justify-content-between "
                    style={{
                      paddingTop: "10px",
                      paddingBottom: "10px"
                    }}
                  >
                    <div
                      style={{
                        width: "300px"
                      }}
                    >
                      <i
                        className="fa fa-file"
                        style={{
                          color: "rgb(175, 54, 148)",
                          marginLeft: "10px",
                          marginRight: "10px"
                        }}
                      />
                      {`${file.name} `}
                    </div>
                    <div>{formatBytes(file.size)}</div>
                    <span
                      style={{
                        color: "#AF3694",
                        fontWeight: "bold",
                        marginRight: "10px"
                      }}
                      onClick={() => this.onCancel(index)}
                    >
                      X
                    </span>
                  </div>
                );
              })}
              {files.length === 0 && (
                <div
                  id="box-2"
                  className="col-12 px-0 bg-gray rounded"
                  style={style.blankFileBox}
                />
              )}
            </div>
          </div>
        </div>
      </ModalAlert>
    );
  }
}
