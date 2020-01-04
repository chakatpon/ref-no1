/**
 * Component for render popup modal
 *
 * @param [onClick] is a event when click button (required)
 * @param [label] is a label of modal (required)
 * @param [message] is a message detail (required)
 */
const ModalWarning = ({ onClick, label, message }) => (
  <div
    id="configWarning"
    className="modal hide fade"
    tabIndex="-1"
    role="dialog"
    aria-labelledby="alertBox"
    aria-hidden="true"
  >
    <div className="modal-dialog modal-lg" role="document">
      <div className="modal-content">
        <div className="modal-header justify-content-center">
          <h3 id="myModalLabel">{label}</h3>
        </div>
        <div className="modal-body d-flex justify-content-center">
          <p>{message}</p>
        </div>
        <div className="modal-footer justify-content-center">
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
            onClick={() => onClick()}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ModalWarning;
