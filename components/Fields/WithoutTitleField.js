import TextField from "./TextField";
import DateField from "./DateField";
import AmountField from "./AmountField";
import TextAreaField from "./TextAreaField";
import DetailField from "./DetailField";
import SelectField from "./SelectField";

/**
 * Component for render field by type without title
 *
 * @param [model] is a field (required)
 * @param [datas] is a data of field (required)
 * @param [classField] is a css style
 */
const WithoutTitleField = ({ model, datas, classField }) =>
  model.fields.map((field, index) => (
    <div key={field.key + index} className={classField}>
      {field.type === "text" ? (
        <TextField field={field} datas={datas} />
      ) : field.type === "date" ? (
        <DateField field={field} datas={datas} />
      ) : field.type === "amount" ? (
        <AmountField field={field} datas={datas} />
      ) : field.type === "textArea" ? (
        <TextAreaField field={field} datas={datas} />
      ) : field.type === "select" ? (
        <SelectField field={field} datas={datas} />
      ) : (
        <DetailField field={field} datas={datas} />
      )}
    </div>
  ));

export default WithoutTitleField;
