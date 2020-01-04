import { withTranslation } from "~/i18n";
/**
 * Component for render button [Cancel, Back, Next, Submit]
 *
 * @param [handleClickBackButton] is a event when click back button (required when use back button)
 * @param [handleClickNextButton] is a event when click next button (required when use next button)
 * @param [handleClickSubmitButton] is a event when click submit button (required when use submit button)
 * @param [disabled] is a disabled for the button
 * @param [backButton] is a condition for show back button
 * @param [nextButton] is a condition for show next button
 * @param [submitButton] is a condition for show submit button
 * @param [submitText] is a text to show on the submit button
 */
const SectionCancelAndNext = ({
  handleClickBackButton,
  handleClickNextButton,
  handleClickSubmitButton,
  disabled,
  backButton,
  nextButton,
  submitButton,
  submitText,
  customButtons,
  lang,
  t
}) => (
  <div>
    <div className="row">
      <div className="col-12 text-center">
        <button
          type="button"
          name="btnCancel"
          id="btnCancel"
          className="btn btn--transparent btn-wide"
          data-toggle="modal"
          data-target="#cancelWarning"
        >
          {t(`${lang}:${"Cancel"}`)}
        </button>
        {backButton && (
          <button
            type="button"
            name="btnBack"
            id="btnBack"
            onClick={() => handleClickBackButton()}
            className="btn btn--transparent btn-wide"
          >
            <i className="fa fa-chevron-left" /> {t(`${lang}:${"Back"}`)}
          </button>
        )}
        {customButtons &&
          customButtons.map((customButtons, index) => (
            <button
              key={customButtons.text + index}
              disabled={!customButtons.disabled}
              type="button"
              name="btnCustom"
              id="btnCustom"
              onClick={e => customButtons.onClick(e)}
              className={customButtons.className}
            >
              {t(`${lang}:${customButtons.text}`)}
            </button>
          ))}
        {submitButton && (
          <button
            disabled={!disabled}
            type="button"
            name="btnNext"
            id="btnNext"
            className="btn btn-wide"
            onClick={() => handleClickSubmitButton()}
          >
            {submitText ? t(`${lang}:${submitText}`) : t(`${lang}:${"Submit"}`)}
          </button>
        )}
        {nextButton && (
          <button
            disabled={!disabled}
            type="button"
            name="btnNext"
            id="btnNext"
            onClick={() => handleClickNextButton()}
            className="btn btn-wide"
          >
            {t(`${lang}:${"Next"}`)} <i className="fa fa-chevron-right" />
          </button>
        )}
      </div>
    </div>
    <div className="row">&nbsp;</div>
  </div>
);

export default withTranslation(["debit-create", "request-edit"])(
  SectionCancelAndNext
);
