/**
 * Component for render popup modal
 *
 * @param [onClick] is a event when click button (required)
 * @param [message] is a message detail (required)
 */
const ModalCancelWarning = ({ onClick, message }) => (
  <div
    id="cancelWarning"
    className="modal hide fade"
    tabIndex="-1"
    role="dialog"
    aria-labelledby="cancel"
    aria-hidden="true"
  >
    <div className="modal-dialog modal-sm" role="document">
      <div className="modal-content">
        <div className="modal-header justify-content-center">
          <h3 className="text-center" id="myModalLabel ">
            Cancel
          </h3>
        </div>
        <div className="modal-body text-center">{message}</div>
        <div className="modal-footer justify-content-center">
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
          >
            No
          </button>
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn--transparent btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
            onClick={() => onClick()}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ModalCancelWarning;
