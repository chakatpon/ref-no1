const HelpButton = ({ url }) => (
  <a
    href={url}
    id="btnHelp"
    target="_blank"
    data-toggle="popover"
    data-placement="bottom"
    data-content="Help"
  >
    <i className="icon icon-icon_help" />
  </a>
);

export default HelpButton;
