import TextField from "./TextField";
import DateField from "./DateField";
import AmountField from "./AmountField";
import NumberField from "./NumberField";
import TextAreaField from "./TextAreaField";
import DetailField from "./DetailField";
import SelectField from "./SelectField";
import AutoCompleteField from "./AutoCompleteField";
import AttachmentsField from "./AttachmentsField";
import LinkField from "./LinkField";
import DueDateField from "./DueDateField";
import DayPickerField from "./DayPickerField";
import { withTranslation } from "~/i18n";

const RenderField = ({ inputProps, datas, lang }) => {
  return (
    <div className="field-font-basic">
      {inputProps.type === "text" ? (
        <TextField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "date" ? (
        <DateField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "amount" ? (
        <AmountField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "number" ? (
        <NumberField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "textArea" ? (
        <TextAreaField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "select" ? (
        <SelectField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "autoComplete" ? (
        <AutoCompleteField {...inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "files" ? (
        <AttachmentsField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "link" ? (
        <LinkField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "dueDate" ? (
        <DueDateField field={inputProps} datas={datas} lang={lang} />
      ) : inputProps.type === "dayPicker" ? (
        <DayPickerField field={inputProps} datas={datas} lang={lang} />
      ) : (
        <DetailField field={inputProps} datas={datas} lang={lang} />
      )}
      {inputProps.validation && (
        <span
          className={`form-group remark text-danger ${inputProps.classInput}`}
        >
          {datas[`${inputProps.key}IsValid`] === false ? (
            <span className="message error">{inputProps.messageError}</span>
          ) : (
            ""
          )}
        </span>
      )}
      {inputProps.message && (
        <small
          key={`${inputProps.key}Message`}
          className={inputProps.classMessage ? inputProps.classMessage : ""}
          style={inputProps.styleMessage ? inputProps.styleMessage : null}
        >
          {inputProps.message}
        </small>
      )}
    </div>
  );
};

/**
 * Component for render field by type
 *
 * @param [model] is a field (required)
 * @param [datas] is a data of field (required)
 * @param [classField] is a css style
 * @param [inputProps] is a props input (without model)
 */
const Fields = ({ model, datas, classField, inputProps, t }) => {
  return inputProps ? (
    <RenderField inputProps={inputProps} datas={datas} lang={model.lang} />
  ) : (
    model.fields.map((field, index) => [
      <div key={field.key + index} className={classField}>
        <p className="col-6 text-right">
          {`${
            field.title
              ? t(
                  `${model.lang}:${field.title.replace(
                    /[|&;$%@"<>()+,.-]/g,
                    ""
                  )}`
                )
              : ""
          }${field.required && field.canEdit ? "*" : ""} ${
            !field.title ? "" : ":"
          }`}{" "}
        </p>
        <div className={`col-6 ${field.type === "date" ? "form-group" : ""}`}>
          <RenderField inputProps={field} datas={datas} lang={model.lang} />
        </div>
      </div>
    ])
  );
};

export default withTranslation([
  "debit-detail",
  "request-detail",
  "detail",
  "request-edit",
  "request-create"
])(Fields);
