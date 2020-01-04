import { Fragment } from "react";
import _ from "lodash";
import TextAreaField from "../components/Fields/TextAreaField";
import TextField from "../components/Fields/TextField";
import DateField from "../components/Fields/DateField";
import SelectField from "../components/Fields/SelectField";
import { withTranslation } from "~/i18n";

/**
 * Component for render field in one column
 *
 * @param [id] is a component id (required)
 * @param [datas] is a data of field (required)
 * @param [model] is a model field (required)
 */
const ColumnField = ({ id, datas, model, t }) => {
  return (
    <Fragment>
      <div id={id} className="col-3 border-right border-1px border-lightgrey">
        {_.isArray(model) ? (
          model.map((field, index) => (
            <AddField
              key={index.toString()}
              model={field}
              datas={datas}
              t={t}
            />
          ))
        ) : (
          <AddField model={model} datas={datas} t={t} />
        )}
      </div>
    </Fragment>
  );
};
const AddField = ({ model, datas, t }) => {
  return (
    <Fragment>
      <h5>{t(`${model.lang}:${model.header}`)}</h5>
      {!_.isEmpty(model.fields) &&
        model.fields.map((field, index) => (
          <div key={field.key + index}>
            <div
              className={`form-group ${
                field.type === "select" ? "" : "has-float-label"
              }`}
            >
              {field.type === "textArea" ? (
                <TextAreaField
                  field={field}
                  datas={datas}
                  className="border border-1px border-lightgrey"
                  style={field.style}
                  lang={model.lang}
                />
              ) : field.type === "date" ? (
                <DateField
                  field={field}
                  datas={datas}
                  className="border border-1px border-lightgrey"
                  lang={model.lang}
                />
              ) : field.type === "select" ? (
                <SelectField
                  field={field}
                  datas={datas}
                  className="border border-1px border-lightgrey"
                  lang={model.lang}
                />
              ) : (
                <TextField
                  field={field}
                  datas={datas}
                  className="border border-1px border-lightgrey"
                  lang={model.lang}
                />
              )}
            </div>
            {field.validation && (
              <div className="form-group remark">
                {field.condition ? (
                  <span className="message error">{field.messageError}</span>
                ) : (
                  ""
                )}
              </div>
            )}
          </div>
        ))}
      <br />
    </Fragment>
  );
};
export default withTranslation(["debit-create", "request-create"])(ColumnField);
