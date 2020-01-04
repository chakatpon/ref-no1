import React, { Component } from "react";
import { i18n, withTranslation } from "~/i18n";
import {
  PageHeader,
  Collapse,
  CollapseItem,
  CollapseItemText,
  CollapseItemExternalLink,
  CollapseItemLink2,
  CollapseItemLink,
  ModalDefault
} from "~/components/page";
class VendorCompany extends Component {
  render() {
    const { t } = this.props;
    const {
      data,
      settings,
      onChangeVendorBranch,
      vendorBranchList,
      isNotGetVendorBranchList,
      previewMode
    } = this.props;
    return (
      <Collapse
        id="vendorInfo"
        expanded="true"
        collapseHeader={[t("Vendor"), t("Company")]}
        className="vendorInfo"
      >
        <div className="row">
          <div className="col-6">
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Code")}
              value={data.vendorNumber}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Name")}
              value={data.vendorName}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Tax ID")}
              value={data.vendorTaxNumber}
            />
            {previewMode ? (
              <CollapseItemText t={t}
                colLabel={4}
                label={t("Branch")}
                value={
                  data.vendorBranchName
                    ? `${data.vendorBranchCode} (${data.vendorBranchName})`
                    : data.vendorBranchCode
                }
              />
            ) : (
              <CollapseItem colLabel={4} label={t("Branch")}>
                <select
                  name={t("branch")}
                  onChange={e => onChangeVendorBranch(e)}
                >
                  {vendorBranchList.map((item, i) => {
                    return (
                      <option value={item.id} key={i}>
                        {`${item.branchCode || ""} ${
                          item.name ? `(${item.name})` : ""
                        } ${item.flag ? `(${item.flag})` : ""}`}
                      </option>
                    );
                  })}
                </select>
                <div
                  className="mt-2 mb-0 ml-0 mr-0 p-0 remark small text-grey"
                  hidden={!isNotGetVendorBranchList}
                >
                  Only Vendor Branch from PO is available.
                </div>
              </CollapseItem>
            )}

            <CollapseItemText t={t}
              colLabel={4}
              id="vendorAddress"
              label={t("Address")}
              value={data.vendorAddress}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Tel")}
              value={data.vendorTelephone}
            />
          </div>
          <div className="col-6">
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Code")}
              value={data.companyCode}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Name")}
              value={data.companyName}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Tax ID")}
              value={data.companyTaxNumber}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Branch")}
              value={`${data.companyBranchCode || "-"}
                        ${
                          data.companyBranchName
                            ? `(${data.companyBranchName})`
                            : ""
                        }`}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Address")}
              value={data.companyAddress}
            />
            <CollapseItemText t={t}
              colLabel={4}
              label={t("Tel")}
              value={data.companyTelephone}
            />
          </div>
        </div>
      </Collapse>
    );
  }
}
export default withTranslation(["detail"])(VendorCompany);
