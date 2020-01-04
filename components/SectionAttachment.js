import _ from "lodash";

/**
 * Component for render section attachment
 *
 * @param [action] is a action, now we support action [edit] (required when need to edit attachment)
 * @param [model] is a model field (required)
 * @param [datas] is a data of attachment (required)
 * @param [handleSliceAttachmentName] is a function for slice attachment name (required)
 */
const SectionAttachment = ({
  action,
  model,
  datas,
  handleSliceAttachmentName
}) => (
  <div className="row box">
    <a
      href="#attachmentLists"
      data-toggle="collapse"
      role="button"
      aria-expanded={true}
      area-controls="attachmentLists"
      className="d-flex w-100 btnToggle"
    >
      <div className="col-12">
        <div className="row">
          <div className="col-6 border-bottom gray-1">
            <h3>Attachments</h3>
          </div>
          <div className="col-6 text-right border-bottom gray-1" />
        </div>
        <span>
          <i className="fa fa-chevron-up gray-1" aria-hidden={true} />
          <i className="fa fa-chevron-down gray-1" aria-hidden={true} />
        </span>
      </div>
    </a>
    <div id="attachmentLists" className="multi-collapse w-100 collapse show">
      <div className="card card-body noborder">
        <div className="row">
          {model.map((items, modelIndex) => (
            <div key={items + modelIndex + "model"} className="col-6">
              {items.attachments.map((attachment, attachmentIndex) =>
                action === "edit" ? (
                  <div key={attachment.name + attachmentIndex + "item"}>
                    <div className="row">
                      <p className="col-4 text-right pl-0">
                        Attach {attachment.name} :
                      </p>
                      <div className="col-6 nopadding form-group d-inline-flex custom-fileUpload">
                        <input
                          type="text"
                          name={`attach_${attachment.type}`}
                          disabled
                          className="form-control col-6"
                        />
                        {datas[`${attachment.type}AttachmentAllowActions`] &&
                          datas[
                            `${attachment.type}AttachmentAllowActions`
                          ].includes("Add") && (
                            <div className="upload-btn-wrapper">
                              <button
                                type="button"
                                className="btn btn--transparent btnUpload"
                              >
                                Browse
                              </button>
                              <input
                                type="file"
                                name={attachment.type}
                                onChange={event =>
                                  attachment.onChange.call(this, event)
                                }
                              />
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-8 offset-4 nopadding">
                        <small id={`${attachment.type}-label-format`}>
                          File type:{" "}
                          {datas[`${attachment.type}AttachmentFormats`]},{" "}
                        </small>
                        <small id={`${attachment.type}-label-count`}>
                          Required:{" "}
                          {datas[`${attachment.type}AttachmentRequiredTooltip`]}{" "}
                          files
                        </small>
                      </div>
                      <p className="col-4">&nbsp;</p>
                      <ul
                        id={`attach_${attachment.type}_list`}
                        className="uploadedList col-6 px-0"
                      >
                        {_.map(
                          datas[`${attachment.type}Attachments`],
                          (
                            { name, hash, attachmentName, attachmentHash },
                            index
                          ) => (
                            (name = name ? name : attachmentName),
                            (hash = hash ? hash : attachmentHash),
                            (
                              <li key={name + hash + index + "old"}>
                                <a
                                  href={`/download/${hash}/${name}`}
                                  className="gray-1"
                                  target="_blank"
                                >
                                  {name}
                                </a>
                                {datas[
                                  `${attachment.type}AttachmentAllowActions`
                                ] &&
                                  datas[
                                    `${attachment.type}AttachmentAllowActions`
                                  ].includes("Remove") && (
                                    <a href="javascript:void(0);">
                                      <i
                                        className="fa fa-times purple"
                                        onClick={() =>
                                          attachment.onClick.call(
                                            this,
                                            `${attachment.type}Attachments`,
                                            index
                                          )
                                        }
                                      />
                                    </a>
                                  )}
                              </li>
                            )
                          )
                        )}
                        {_.map(
                          datas[`${attachment.type}AttachmentsNew`],
                          ({ name, hash }, index) => (
                            <li key={name + hash + index + "new"}>
                              <a
                                href={`/download/${hash}/${name}`}
                                className="gray-1"
                                target="_blank"
                              >
                                {name}
                              </a>
                              <a href="javascript:void(0);">
                                <i
                                  className="fa fa-times purple"
                                  onClick={() =>
                                    attachment.onClick.call(
                                      this,
                                      `${attachment.type}AttachmentsNew`,
                                      index
                                    )
                                  }
                                />
                              </a>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div key={attachment.name + attachmentIndex} className="row">
                    <p className="col-4 text-right nopadding">
                      Attach {attachment.name} :
                    </p>
                    <p className="col-6">
                      {datas[`${attachment.type}Attachments`].length > 0
                        ? datas[`${attachment.type}Attachments`].map(
                            (file, index) => (
                              <div key={file + index + "file"}>
                                <span className="fileName">
                                  {handleSliceAttachmentName(file.name)}&nbsp;
                                  {attachment.download &&
                                    file.hash !== undefined &&
                                    file.hash !== null && (
                                      <a
                                        href={`/download/${file.hash}/${
                                          file.name
                                        }`}
                                        className="purple font-bold underline"
                                        target="_blank"
                                      >
                                        Download
                                      </a>
                                    )}
                                </span>
                              </div>
                            )
                          )
                        : "-"}
                    </p>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SectionAttachment;
