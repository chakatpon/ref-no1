import { Fragment } from "react";
import _ from "lodash";
import { withTranslation } from "~/i18n";

const RenderUploadAttachment = ({
  classColumn,
  title,
  attachment,
  state,
  handleDropAttachment,
  handleDragAttachmentOver,
  handleSelectedAttachment,
  lang,
  t
}) => (
  <div className={classColumn}>
    <h5>
      {t(`${lang}:${title}`)}
      {state[`is${attachment}AttachmentRequired`] === true ? "*" : ""}
    </h5>
    <div
      className="uploadArea custom-fileUpload"
      onDrop={() => handleDropAttachment(event, attachment)}
      onDragOver={handleDragAttachmentOver}
    >
      <p className="text-center">{t(`${lang}:${"Drag & Drop files here"}`)}</p>
      <p className="text-center">{t(`${lang}:${"or"}`)}</p>
      <div className="upload-btn-wrapper">
        <button type="button" className="btn btn--transparent btnUpload">
          {t(`${lang}:${"Browse Files"}`)}
        </button>
        <input
          type="file"
          name={attachment}
          onChange={handleSelectedAttachment}
        />
      </div>
    </div>
    <p id={`${attachment}-label-format`} className="small mb-0">
      {t(`${lang}:${"File type"}`)}: {state[`${attachment}AttachmentFormats`]}
    </p>
    <p
      id={`${attachment}-label-count`}
      className="small mb-0 countUploadedFile"
    >
      {t(`${lang}:Number of Files`)}:{" "}
      <span className="number">
        {state[`${attachment}AttachmentRequiredTooltip`]}
      </span>
    </p>
  </div>
);

/**
 * Component for render part of upload attachment and list of upload attachment
 *
 * @param [uploadId] is a id of section upload (required)
 * @param [uploadListSectionId] is a id of section upload list (required)
 * @param [uploadListId] is a id of upload in section upload list (required)
 * @param [state] is a state from parent component (required)
 * @param [model] is a model field (required)
 * @param [handleDropAttachment] is a event when drop attachment (required)
 * @param [handleDragAttachmentOver] is a event when drag attachment (required)
 * @param [handleSelectedAttachment] is a event when select browse attachment (required)
 * @param [handleSliceAttachmentName] is a function for slice attachment name (required)
 * @param [handleDeselectedAttachment] is a event when deselected attachment (required)
 */
const SectionUploadAttachment = ({
  uploadId,
  uploadListSectionId,
  uploadListId,
  state,
  model,
  handleDropAttachment,
  handleDragAttachmentOver,
  handleSelectedAttachment,
  handleSliceAttachmentName,
  handleDeselectedAttachment,
  lang,
  t
}) => (
  <Fragment>
    <div id={uploadId} className="col-6">
      {model.map((item, itemIndex) =>
        item.attachments.length % 2 === 0 ? (
          <div key={item.attachments + itemIndex} className="d-flex">
            {item.attachments.map((attachment, attachmentIndex) => (
              <RenderUploadAttachment
                key={attachment.name + attachmentIndex}
                classColumn="col-6"
                title={!!attachment.title ? attachment.title : attachment.type}
                attachment={attachment.type}
                state={state}
                handleDropAttachment={handleDropAttachment}
                handleDragAttachmentOver={handleDragAttachmentOver}
                handleSelectedAttachment={handleSelectedAttachment}
                lang={lang}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div key={item.attachment + itemIndex} className="d-flex flex-wrap">
            {item.attachments.map((attachment, attachmentIndex) => (
              <RenderUploadAttachment
                key={attachment.name + attachmentIndex}
                classColumn="col-12"
                title={!!attachment.title ? attachment.title : attachment.type}
                attachment={attachment.type}
                state={state}
                handleDropAttachment={handleDropAttachment}
                handleDragAttachmentOver={handleDragAttachmentOver}
                handleSelectedAttachment={handleSelectedAttachment}
                lang={lang}
                t={t}
              />
            ))}
          </div>
        )
      )}
    </div>
    <div id={uploadListSectionId} className="col-3">
      <h5>{t(`${lang}:${t("Selected Files")}`)}</h5>
      <div id={uploadListId} className="bg-grey rounded">
        <ul>
          {model.map((item, itemIndex) =>
            item.attachments.map((attachment, attachmentIndex) => (
              <li key={attachment.name + attachmentIndex}>
                <h5 className="medium">
                  {!!attachment.title
                    ? t(`${lang}:${attachment.title}`)
                    : t(`${lang}:${attachment.type}`)}
                </h5>
                <div className="border-top border-bottom border-1px border-grey">
                  {_.map(
                    state[`${attachment.type}Attachments`],
                    ({ name, size }, stateAttachmentIndex) => (
                      <p
                        key={name + stateAttachmentIndex}
                        className="form-inline"
                      >
                        <span>
                          <i className="fa fa-file" aria-hidden="true" />
                          {handleSliceAttachmentName(name)}
                        </span>
                        <span className="text-right">
                          {(size * 0.01).toFixed(2)}K
                        </span>
                        <a href="#" className="btnRemove">
                          <i
                            onClick={() =>
                              handleDeselectedAttachment(
                                attachment.type,
                                stateAttachmentIndex
                              )
                            }
                            className="fa fa-times"
                          />
                        </a>
                      </p>
                    )
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  </Fragment>
);

export default withTranslation(["debit-create", "request-create"])(
  SectionUploadAttachment
);
