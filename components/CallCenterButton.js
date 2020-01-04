const CallCenterButton = ({ url }) => (
  <a
    href={url}
    id="btnCallcenter"
    target="_blank"
    data-toggle="popover"
    data-placement="bottom"
    data-content="myRequests"
  >
    <i className="icon icon-icon_callcenter" />
  </a>
);

export default CallCenterButton;
