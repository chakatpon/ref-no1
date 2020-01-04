import { Fragment } from "react";
import _ from "lodash";
import styled from "styled-components";
import { withTranslation } from "~/i18n";

const RemoveIcon = styled.span`
  position: absolute;
  right: 3px;
`;

const AttachMentList = styled.ul`
  position: relative;
`;

const handleSliceAttachmentName = attachmentName => {
  const ext = attachmentName.lastIndexOf(".");
  const attachmentNameWithoutExt = attachmentName.substr(0, ext);

  if (attachmentNameWithoutExt.length > 15) {
    const charArray = [...attachmentNameWithoutExt];
    const newattachmentName =
      charArray[0] +
      charArray[1] +
      charArray[2] +
      charArray[3] +
      "...." +
      charArray[charArray.length - 4] +
      charArray[charArray.length - 3] +
      charArray[charArray.length - 2] +
      charArray[charArray.length - 1];

    return newattachmentName + attachmentName.substr(ext);
  } else {
    return attachmentName;
  }
};

/**
 * Component for render detail field
 *
 * @param [field] is a field, we need property
 * {
 *    condition: is condition for display value
 *    defaultValue: is value for display when condition is true
 * }
 * @param [datas] is a data of field (required)
 */
const AttachmentsField = ({ field, datas, lang, t }) => (
  <Fragment>
    {field.canEdit ? (
      <Fragment>
        <div className="nopadding form-group d-inline-flex custom-fileUpload">
          <input
            type="text"
            name={`attach_${field.key}`}
            disabled
            className="form-control"
          />
          {/* {datas[`${field.key}AllowAction`] &&
            datas[`${field.key}AllowAction`].includes("Add") && ( */}
          <div className="upload-btn-wrapper">
            <button type="button" className="btn btn--transparent btnUpload">
              {t(`${lang}:${"Browse"}`)}
            </button>
            <input
              type="file"
              name={field.key}
              onChange={event => field.onFileAdded.call(this, event)}
            />
          </div>
          {/* )} */}
        </div>
        <div className="nopadding">
          <small id={`${field.key}-label-format`}>
            {t(`${lang}:${"File type"}`)}: {datas[`${field.key}Format`]},{" "}
          </small>
          <small id={`${field.key}-label-count`}>
            {t(`${lang}:${"Required"}`)}: {datas[`${field.key}RequiredTooltip`]}{" "}
            {t(`${lang}:${"files"}`)}
          </small>
        </div>
        <AttachMentList
          id={`attach_${field.key}_list`}
          className="uploadedList px-0"
        >
          {_.map(
            datas[field.key],
            ({ name, hash, attachmentName, attachmentHash, owner }, index) => (
              (name = name ? name : attachmentName),
              (hash = hash ? hash : attachmentHash),
              (owner = owner ? owner : ""),
              (
                <li key={index}>
                  {hash !== undefined && hash !== null ? (
                    <a
                      href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                      className="gray-1"
                      target="_blank"
                    >
                      {handleSliceAttachmentName(name)}
                    </a>
                  ) : (
                    handleSliceAttachmentName(name)
                  )}
                  <RemoveIcon>
                    {/* {datas[`${field.key}AllowAction`] &&
                      datas[`${field.key}AllowAction`].includes("Remove") && ( */}
                    <a href="javascript:void(0);">
                      <i
                        className="fa fa-times purple"
                        onClick={() =>
                          field.onRemove.call(this, `${field.key}`, index)
                        }
                      />
                    </a>
                    {/* )} */}
                  </RemoveIcon>
                </li>
              )
            )
          )}
        </AttachMentList>
      </Fragment>
    ) : (
      <div id={`attach_${field.key}_list`} className="uploadedList px-0">
        {datas[field.key] && datas[field.key].length > 0
          ? _.map(
              datas[field.key],
              (
                { name, hash, attachmentName, attachmentHash, owner },
                index
              ) => (
                (name = name ? name : attachmentName),
                (hash = hash ? hash : attachmentHash),
                (owner = owner ? owner : ""),
                (
                  <div key={hash + index}>
                    {handleSliceAttachmentName(name)}{" "}
                    <span>
                      {field.download && hash !== undefined && hash !== null && (
                        <a
                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                          target="_blank"
                        >
                          {t(`${lang}:${"Download"}`)}
                        </a>
                      )}
                    </span>
                  </div>
                )
              )
            )
          : field.defaultValue || ""}
      </div>
    )}
  </Fragment>
);

export default withTranslation(["request-create"])(AttachmentsField);
