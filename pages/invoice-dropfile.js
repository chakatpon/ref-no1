import React from "react";

import BlockUi from "react-block-ui";
import Layout from "../components/Layout";
import ApiService from "../libs/ApiService";
import withAuth from "../libs/withAuth";
import "../libs/mycools";
import api from "../libs/api";

import Dropzone from "react-dropzone";
import { formatBytes } from "../components/modalDropFile";
import ModalAlert from "../components/modalAlert";
import Router from "next/router";
import { withTranslation } from "~/i18n";

const Api = new ApiService();

const style = {
  textConfig: {
    height: "500px",
    overflowX: "hidden",
    overflowY: "auto",
    padding: "15px"
  },
  textBox: {
    border: "2px solid #cccccc",
    padding: "20px"
  },
  fileHeader: {
    textAlign: "left"
  },
  fileResultBox: {
    paddingTop: "10px",
    paddingBottom: "10px",
    backgroundColor: "#f1f3f6",
    paddingLeft: "20px",
    paddingRight: "20px"
  },
  fileItemGroup: {
    paddingTop: "5px",
    paddingBottom: "5px",
    borderTop: "1px solid #cccccc",
    borderBottom: "1px solid #cccccc"
  },
  fileResultItem: {
    height: "220px",
    overflowX: "hidden",
    overflowY: "auto"
  },
  fileResultColumn: {
    width: "50%",
    paddingLeft: "50px",
    paddingRight: "50px"
  },
  fileTitle: {
    marginBottom: "10px"
  },
  fileName: {
    textAlign: "left",
    width: "200px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  },
  fileCancel: {
    color: "af3694",
    fontWeight: "bold",
    marginRight: "10px"
  },
  fileIcon: {
    color: "rgb(175, 54, 148)",
    marginLeft: "10px",
    marginRight: "10px"
  }
};

class InvoiceDropfile extends React.Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("uploadInvoice");
    this.state = {
      blocking: false,
      // CSV: [],
      // taxInvoiceFile: [],
      // receiptFile: [],
      // delivaryNoteFile: [],
      // otherFile: [],
      attachmentfiles: {
        CSV: []
      },
      vendor: "",
      buttonAlert: [],
      isAlertVisible: false,
      errorMsg: "",
      isTextOnly: true,
      attachmentConfiguration: [
        {
          companyTaxId: "0105556176239",
          documentType: "Invoice",
          attachmentType: "TaxInvoice",
          minimumNumberOfFiles: 1,
          maximumNumberOfFiles: 1,
          fileType: "JPG,PDF,TIF"
        },
        {
          companyTaxId: "0105556176239",
          documentType: "Invoice",
          attachmentType: "Receipt",
          minimumNumberOfFiles: 1,
          maximumNumberOfFiles: 1,
          fileType: "JPG,PDF,TIF"
        },
        {
          companyTaxId: "0105556176239",
          documentType: "Invoice",
          attachmentType: "DeliveryNote",
          minimumNumberOfFiles: 1,
          maximumNumberOfFiles: 1,
          fileType: "PDF,JPG,JPEG,EML,MSG,PNG,XML,CSV,XLS,XLSX"
        },
        {
          companyTaxId: "0105556176239",
          documentType: "Invoice",
          attachmentType: "Others",
          minimumNumberOfFiles: 0,
          maximumNumberOfFiles: 5,
          fileType: "PDF,JPG,JPEG,EML,MSG,PNG,XML,CSV,XLS,XLSX"
        }
      ]
    };

    this.layout = React.createRef();
  }
  componentDidMount() {
    const { attachmentfiles, attachmentConfiguration } = this.state;

    attachmentConfiguration.forEach(config => {
      attachmentfiles[config.attachmentType] = [];
    });

    this.setState({
      buttonAlert: [
        {
          label: "Close",
          attachmentfiles,
          attribute: {
            className: "btn btn-wide btn--transparent",
            onClick: this.toggleAlertModal
          }
        }
      ]
    });
  }

  goToMonitoring = () => {
    Router.push("/upload-invoice-monitoring");
  };

  uploadFileApi = async (files, vendor) => {
    try {
      const uploadPromise = await files.map(async file => {
        const data = new FormData();
        data.append("file", file);
        if (file.name.toLowerCase().includes(".csv")) {
          const res = await this.apis.call(
            "upload",
            { isAttachment: false, vendor: vendor },
            { data }
          );
          return true;
          // return Api.postInvoiceUpload(data, vendor, false);
        }
        const res = await this.apis.call(
          "upload",
          { isAttachment: true, vendor: vendor },
          { data }
        );
        return true;
        // return Api.postInvoiceUpload(data, vendor, true);
      });
      const result = await Promise.all(uploadPromise);
      return result;
    } catch (e) {
      console.log(e.response.data.message);
      if (e.response) {
        if (e.response.data) {
          if (e.response.data.message) {
            this.setState({
              errorMsg: e.response.data.message
            });
            this.toggleAlertModal();
          }
        }
      }
      return false;
    }
  };

  uploadButton = async () => {
    const { attachmentConfiguration, attachmentfiles, vendor } = this.state;
    this.setState({
      blocking: true
    });
    const uploadFilesPromise = attachmentConfiguration.map(config => {
      return this.uploadFileApi(attachmentfiles[config.attachmentType], vendor);
    });
    uploadFilesPromise.push(this.uploadFileApi(attachmentfiles.CSV, vendor));
    const result = await Promise.all(uploadFilesPromise);
    if (!result.includes(false)) {
      this.goToMonitoring();
    }
    this.setState({
      blocking: false
    });
  };

  onDrop = files => {
    let isMatchFile = false;
    const { attachmentConfiguration, attachmentfiles, CSV } = this.state;
    let attachmentfilesNew = { ...attachmentfiles };
    let vendor = this.state.vendor;
    let errorMsg = "";
    files.forEach(file => {
      const fileName = file.name;
      const fileType = fileName.split(".")[1];
      const filePrefix = fileName.split("-")[1];
      if (fileType === "csv") {
        vendor = fileName.split("_")[0];
        attachmentfilesNew.CSV = [...attachmentfilesNew.CSV, file];
        isMatchFile = true;
      } else {
        attachmentConfiguration.forEach(config => {
          if (
            filePrefix === config.attachmentType &&
            config.fileType.includes(fileType.toUpperCase())
          ) {
            attachmentfilesNew[config.attachmentType].push(file);
            isMatchFile = true;
          }
        });
      }
      if (file.size >= 3145728) {
        errorMsg = "Don't upload fire more than 3MB";
      }
    });

    if (errorMsg) {
      this.setState({
        errorMsg
      });
    } else if (attachmentfilesNew.CSV.length > 1) {
      this.setState({
        errorMsg: "Unable to upload multiple CSV files."
      });
      this.toggleAlertModal();
    } else if (!isMatchFile) {
      this.setState({
        errorMsg:
          "Please prepare files according to file’s name and format instruction."
      });
      this.toggleAlertModal();
    } else {
      this.setState({
        attachmentfiles: attachmentfilesNew,
        vendor
      });
    }
  };

  onCancel = (index, fileType) => {
    const oldFile = this.state.attachmentfiles[fileType];
    oldFile.splice(index, 1);
    this.setState({
      [fileType]: oldFile
    });
  };

  toggleAlertModal = () => {
    this.setState({
      isAlertVisible: !this.state.isAlertVisible
    });
  };

  haveCSVFile = () => {
    return this.state.attachmentfiles.CSV.length ? false : true;
  };
  renderResultFile = fileType => {
    const { t } = this.props;
    return (
      <li>
        <h5 className="medium">{t(fileType)}</h5>
        <div className="border-top border-bottom border-1px border-grey">
          {this.state.attachmentfiles[fileType] &&
            this.state.attachmentfiles[fileType].map((file, index) => (
              <p className="form-inline">
                <span>
                  <i className="fa fa-file" aria-hidden="true" /> {file.name}
                </span>
                <span className="text-right">{formatBytes(file.size)}</span>
                <a
                  href="javascript:void(0);"
                  className="btnRemove"
                  onClick={() => this.onCancel(index, fileType)}
                >
                  <i className="fa fa-times" />
                </a>
              </p>
            ))}
        </div>
      </li>
    );
  };

  render() {
    const { t } = this.props;
    const {
      blocking,
      attachmentConfiguration,
      isAlertVisible,
      buttonAlert,
      isTextOnly,
      errorMsg
    } = this.state;

    return (
      <Layout hideNavBar={true} ref={this.layout} {...this.props}>
        <BlockUi tag="div" blocking={blocking}>
          <div id="cn_create" className="upload_monitoring row step-3">
            <div className="page__header col-12">
              <h2>{t("Please Upload Files")}</h2>
            </div>
            <div className="box col-12 d-flex flex-wrap">
              <div id="upload-section" className="col-9">
                <div className="d-flex flex-wrap">
                  <div id="box-1" className="col-12">
                    <p className="mb-0">
                      <strong>{t("Invoice and other attachments")}</strong>
                    </p>
                    <Dropzone
                      style={{
                        position: "relative",
                        width: "100%"
                      }}
                      onDrop={files => this.onDrop(files)}
                    >
                      <div className="uploadArea custom-fileUpload">
                        <p className="text-center">
                          {t("Drag Drop files here")}
                        </p>
                        <p className="text-center">{t("or")}</p>
                        <div className="upload-btn-wrapper">
                          <button
                            type="button"
                            className="btn btn--transparent btnUpload"
                          >
                            {t("Browse Files")}
                          </button>
                        </div>
                      </div>
                    </Dropzone>
                    <p className="small mb-0">
                      {t("File type")}: CSV, PDF, JPG
                    </p>
                  </div>
                  <div
                    id="box-2"
                    className="col-12 mt-3 nopadding d-flex flex-wrap"
                  >
                    <div
                      id="uploaded-list-section"
                      className="col-6 border-right border-2px border-lightgray"
                    >
                      <h5>{t("Selected CSV Files")}</h5>
                      <div
                        id="uploadedLists"
                        className="bg-grey rounded"
                        style={style.fileResultItem}
                      >
                        <ul>{this.renderResultFile("CSV")}</ul>
                      </div>
                    </div>
                    <div id="uploaded-list-section" className="col-6">
                      <h5>{t("Uploaded Files")}</h5>
                      <div
                        id="uploadedLists"
                        className="bg-grey rounded"
                        style={style.fileResultItem}
                      >
                        <ul>
                          {attachmentConfiguration.map(config =>
                            this.renderResultFile(config.attachmentType)
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="upload-instruction" className="col-3 nopadding">
                <p className="mb-0">
                  <strong>{t("Files Name and Format Instruction")}</strong>
                </p>
                <div
                  className="border border-2px border-lightgray rounded"
                  style={style.textConfig}
                >
                  <p className="underline">{t("File Name Format")}</p>
                  <p>
                    {t(
                      "CSV File Name should be in the following format [vendorTaxid]"
                    )}
                  </p>
                  <p>&nbsp;</p>
                  <p>{t("eg 0125552003888_CSV001")}</p>
                  <p>&nbsp;</p>
                  <p>
                    {t(
                      "Attachment file should be in the following format [Invoice No]-[AttachmentType]-[Running No][File Extension]"
                    )}
                  </p>
                  <p>&nbsp;</p>
                  <p>
                    {t(
                      "eg INV001-Taxinvoice-001pdf, INV001-Receipt-002pdf, INV001-DeliveryNote-003pdf, INV001-Others-004pdf"
                    )}
                  </p>
                  <p>&nbsp;</p>
                  <p className="underline">{t("Tax Invoice")}</p>
                  <p>{t("File type")}: PDF, JPG</p>
                  <p>
                    {t("Required")}: 1 {t("file")}
                  </p>
                  <p>&nbsp;</p>
                  <p>{t("Receipt")}</p>
                  <p>{t("File type")}: PDF, JPG, JPGE</p>
                  <p>
                    {t("Required")}: 1 {t("file")}
                  </p>
                  <p>&nbsp;</p>
                  <p>{t("Delivery Note")}</p>
                </div>
              </div>
            </div>
            <div className="row col-12" id="dropFileBtn">
              <div className="col-12 text-center">
                <button
                  type="button"
                  name="btnCancel"
                  id="btnCancel"
                  className="btn btn--transparent"
                  onClick={this.goToMonitoring}
                >
                  {t("Cancel")}
                </button>
                <button
                  disabled={this.haveCSVFile()}
                  type="button"
                  name="btnNext"
                  id="btnNext"
                  className="btn"
                  onClick={this.uploadButton}
                >
                  {t("Upload")}
                </button>
              </div>
            </div>
          </div>
        </BlockUi>
        <ModalAlert
          title={"error"}
          visible={isAlertVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          <div className="text-center">{errorMsg}</div>
        </ModalAlert>
      </Layout>
    );
  }
}

export default withAuth(withTranslation(["invoice-upload"])(InvoiceDropfile));
