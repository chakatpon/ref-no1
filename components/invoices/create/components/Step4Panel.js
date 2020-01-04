import React, { Component } from "react";
import { i18n, withTranslation } from "~/i18n";

class Step4Panel extends Component {
  render() {
    const { t } = this.props;
    const {
      stepOneProp,
      stepTwoProp,
      stepThreeProp,
      stepFourProp,
      onChangeVendorBranch,
      vendorBranchList,
      selectedVendorBranch,
      isNotGetVendorBranchList
    } = this.props;
    return (
      <div className="col-12 box d-flex flex-wrap vendorAndCompany">
        {/* Vendor information - Start */}
        <div className="col-6 d-flex-inline flex-wrap">
          <h4 className="col-12 border-bottom border-1px pt-0 pb-2">
            {t("Vendor")}
          </h4>

          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Code")} : </div>
            <div className="col-7 text-left">
              {stepOneProp.mainPO.vendorNumber || "-"}
            </div>
          </div>

          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Name")} : </div>
            <div className="col-7 text-left text-uppercase">
              {stepOneProp.mainPO.vendorName || "-"}
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Tax ID")} : </div>
            <div className="col-7 text-left">
              {stepOneProp.mainPO.vendorTaxNumber || "-"}
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap vendor-branch">
            <div className="col-5 text-right">{t("Branch")} : </div>
            <div className="col-7 text-left">
              <select
                value={selectedVendorBranch}
                name="branch"
                onChange={e => onChangeVendorBranch(e)}
              >
                {console.log(
                  "---selectedVendorBranch---",
                  selectedVendorBranch
                )}
                {stepOneProp.settings &&
                stepOneProp.settings.INVOICE_CONFIG.defaultVendorBranch !=
                  "PO" ? (
                  <option value={-1} key="0">
                    Select branch
                  </option>
                ) : (
                  ""
                )}
                }
                {vendorBranchList.map((item, i) => {
                  {
                    console.log("ITEM ID : ", item.id);
                  }
                  return (
                    <option value={item.id} key={i}>{`${item.branchCode ||
                      ""} ${`(${item.name})` || ""} ${
                      item.def ? "(PO)" : ""
                    }`}</option>
                  );
                })}
              </select>
              <p
                className="mt-2 mb-0 ml-0 mr-0 p-0 remark small text-grey"
                hidden={!isNotGetVendorBranchList}
              >
                Only Vendor Branch from PO is available.
              </p>
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Address")} : </div>
            <div className="col-7 text-left" id="vendorAddress">
              {`${stepOneProp.mainPO.vendorAddress1 || ""} ${stepOneProp.mainPO
                .vendorDistrict || ""} ${stepOneProp.mainPO.vendorCity ||
                ""} ${stepOneProp.mainPO.vendorPostalCode || ""}`}
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Tel")} : </div>
            <div className="col-7 text-left">
              {stepOneProp.mainPO.vendorTelephone || "-"}
            </div>
          </div>
        </div>
        {/* Vendor information - End */}

        {/* Company information - Start */}
        <div className="col-6 d-flex-inline flex-wrap">
          <h4 className="col-12 border-bottom border-1px pt-0 pb-2">
            {t("Company")}
          </h4>

          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Code")} : </div>
            <div className="col-7 text-left">
              {stepOneProp.mainPO.companyCode || "-"}
            </div>
          </div>

          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Name")} : </div>
            <div className="col-7 text-left text-uppercase">
              {stepOneProp.mainPO.companyName || "-"}
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Tax ID")} : </div>
            <div className="col-7 text-left">
              {stepOneProp.mainPO.businessPlaceTaxNumber || "-"}
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Branch")} : </div>
            <div className="col-7 text-left">
              {`${stepOneProp.mainPO.companyBranchCode ||
                ""} ${`(${stepOneProp.mainPO.companyBranchName})` || ""}`}
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Address")} : </div>
            <div className="col-7 text-left">
              {`${stepOneProp.mainPO.businessPlaceAddress1 || ""} ${stepOneProp
                .mainPO.businessPlaceDistrict || ""} ${stepOneProp.mainPO
                .businessPlaceCity || ""} ${stepOneProp.mainPO
                .businessPlacePostalCode || ""}`}
            </div>
          </div>
          <div className="col-12 py-2 px-0 d-flex flex-wrap">
            <div className="col-5 text-right">{t("Tel")} : </div>
            <div className="col-7 text-left">
              {stepOneProp.mainPO.businessPlaceTelephone || "-"}
            </div>
          </div>
        </div>
        {/* Company information - End */}
      </div>
    );
  }
}

export default withTranslation(["detail"])(Step4Panel);
