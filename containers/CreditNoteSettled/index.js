import React, { PureComponent } from "react";

import CordaService from "~/services/CordaService";
import { Collapse } from "~/components/page";
import { toBigNumber } from "~/helpers/app";

class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();

    this.state = {
      creditNoteSettled: [],
      creditNoteSettledItemLength: 0
    };
  }

  async componentDidMount() {
    await this.getSettledCreditNote();
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.taggedCreditNotes !== this.props.taggedCreditNotes) {
      await this.getSettledCreditNote();
    }
  }

  formatCurrency(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  }

  generateRowTableForCreditNoteSettled(creditnoteSettled) {
    const { taggedCreditNotes } = this.props;
    const { creditNoteSettledItemLength } = this.state;

    if (creditNoteSettledItemLength > 0) {
      return _.map(
        creditnoteSettled,
        (
          {
            externalId,
            linearId,
            adjustmentType,
            reason,
            creditNoteDate,
            total,
            status,
            currency,
            invoiceExternalId,
            invoiceLinearId
          },
          index
        ) =>
          <React.Fragment>
            {/* Desktop Version - Start */}
            <tr className="d-none d-lg-table-row">
              <td>
                {index + 1}
              </td>
              <td>
                {externalId && linearId
                  ? <a
                      href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                      data-href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                      className="link list-link"
                    >
                      {externalId}
                    </a>
                  : externalId}
              </td>
              <td>
                {adjustmentType
                  ? adjustmentType === "Goods Return"
                    ? "Qty Adjustment"
                    : adjustmentType
                  : "-"}
              </td>
              <td>
                {reason ? reason : "-"}
              </td>
              <td>
                {creditNoteDate
                  ? moment(creditNoteDate).format("DD/MM/YYYY").toString()
                  : "-"}
              </td>
              <td>
                {total
                  ? this.formatCurrency(toBigNumber(total).toNumber(), 2)
                  : "-"}
              </td>
              <td>
                {taggedCreditNotes
                  ? taggedCreditNotes.map(taggedCreditNote => {
                      if (taggedCreditNote.linearId === linearId) {
                        return this.formatCurrency(
                          toBigNumber(
                            taggedCreditNote.knockedAmount
                          ).toNumber(),
                          2
                        );
                      }
                    })
                  : "-"}
              </td>
              <td>
                {status ? status : "-"}
              </td>
              <td>
                {currency ? currency : "-"}
              </td>
            </tr>
            {/* Desktop Version - End */}

            {/* Mobile Version - Start */}
            <tr className="d-table-row d-lg-none">
              <td>
                {externalId && linearId
                  ? <a
                      href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                      data-href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                      className="link list-link"
                    >
                      {externalId}
                    </a>
                  : externalId}
              </td>
              <td>
                {adjustmentType
                  ? adjustmentType === "Goods Return"
                    ? "Qty Adjustment"
                    : adjustmentType
                  : "-"}
              </td>
              <td>
                {status ? status : "-"}
              </td>
              <td className="control">
                <a
                  href={`#cn-detail-${index}`}
                  data-toggle="collapse"
                  role="button"
                  aria-expanded="false"
                  area-controls={`#cn-detail-${index}`}
                  className="d-flex w-100 purple btnTableToggle"
                >
                  <strong className="textOnHide">
                    <i className="fa fa-ellipsis-h purple mx-auto" />
                  </strong>
                  <strong className="textOnShow">
                    <i className="fa fa-times purple mx-auto" />
                  </strong>
                </a>
              </td>
            </tr>
            <tr id={`cn-detail-${index}`} className="collapse multi-collapse">
              <td colSpan="4">
                <div className="d-flex flex-wrap w-100">
                  <div className="col-6 px-0 text-right">CN Reason: </div>
                  <div className="col-6 text-left">
                    {reason ? reason : "-"}
                  </div>
                  <div className="col-6 px-0 pt-3 text-right">CN Date: </div>
                  <div className="col-6 pt-3 text-left">
                    {creditNoteDate
                      ? moment(creditNoteDate).format("DD/MM/YYYY").toString()
                      : "-"}
                  </div>
                  <div className="col-6 px-0 pt-3 text-right">
                    CN Amount (Inc. VAT):{" "}
                  </div>
                  <div className="col-6 pt-3 text-left">
                    {total
                      ? this.formatCurrency(toBigNumber(total).toNumber(), 2)
                      : "-"}
                  </div>
                  <div className="col-6 px-0 py-3 text-right">Currency: </div>
                  <div className="col-6 py-3 text-left">
                    {currency ? currency : "-"}
                  </div>
                </div>
              </td>
            </tr>
            {/* Mobile Version - End */}
          </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          {/* Desktop Version - Start */}
          <tr className="d-none d-lg-table-row">
            <td colSpan="9" className="text-center">
              No Item Found
            </td>
          </tr>
          {/* Desktop Version - End */}

          {/* Mobile Version - Start */}
          <tr className="d-table-row d-md-none d-lg-none d-xl-none">
            <td colSpan="4" className="text-center">
              No Item Found
            </td>
          </tr>
          {/* Mobile Version - End */}
        </React.Fragment>
      );
    }
  }

  getSettledCreditNote = async () => {
    const { taggedCreditNotes } = this.props;

    if (taggedCreditNotes && taggedCreditNotes.length > 0) {
      const linearIds = taggedCreditNotes
        .map(taggedCreditNote => taggedCreditNote.linearId)
        .join(",");
      const requestParams = {
        linearIds: linearIds
      };
      const { status, data } = await this.cordaService.callApi({
        group: "credit",
        action: "getCreditNotes",
        requestParams: requestParams
      });

      if (status) {
        const results = data.rows ? data.rows : data;

        this.setState({
          creditNoteSettledItemLength: results.length,
          creditNoteSettled: results
        });
      }
    } else {
      this.setState({
        creditNoteSettledItemLength: 0,
        creditNoteSettled: []
      });
    }
  };

  render() {
    const { creditNoteSettledItemLength, creditNoteSettled } = this.state;

    return (
      <Collapse
        id="creditnoteSettled"
        key="creditnoteSettled"
        expanded="true"
        collapseHeader={[
          `Credit Note Settled to this Debit Note ( ${creditNoteSettledItemLength} Item${creditNoteSettledItemLength >
          1
            ? "s"
            : ""} )`
        ]}
      >
        {/* Desktop Version - Start */}
        <div className="table_warpper d-none d-lg-inline-block">
          <table className="table table-1 dataTable">
            <thead>
              <tr>
                <th>No.</th>
                <th>
                  CN
                  <br /> No.
                </th>
                <th>
                  Type of
                  <br /> CN
                </th>
                <th>
                  CN
                  <br /> Reason
                </th>
                <th>
                  CN
                  <br /> Date
                </th>
                <th>
                  CN Amount
                  <br /> (Inc. VAT)
                </th>
                <th>Settle Value</th>
                <th>
                  CN
                  <br /> Status
                </th>
                <th>Currency</th>
              </tr>
            </thead>

            <tbody>
              {this.generateRowTableForCreditNoteSettled(creditNoteSettled)}
            </tbody>
          </table>
        </div>
        {/* Desktop Version - End */}

        {/* Mobile Version - Start */}
        <div className="table_warpper d-inline-block d-lg-none">
          <table className="table table-1 dataTable mobile_dataTable">
            <thead>
              <tr>
                <th>CN No.</th>
                <th>Type of CN</th>
                <th>CN Status</th>
                <th className="control">More</th>
              </tr>
            </thead>
            <tbody>
              {this.generateRowTableForCreditNoteSettled(creditNoteSettled)}
            </tbody>
          </table>
        </div>
        {/* Mobile Version - End */}
      </Collapse>
    );
  }
}
export default Index;
