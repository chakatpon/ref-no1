import { withTranslation } from "~/i18n";
const SectionSelectedInvoice = ({ title, children, t }) => (
  <div className="box col-12">
    <div className="col-8 offset-2">
      <div className="form-group d-flex flex-wrap align-items-center">
        <label className="form-label col-6 text-right mb-0">{t(title)}:</label>
        {children}
      </div>
    </div>
  </div>
);

export default withTranslation(["debit-create"])(SectionSelectedInvoice);
