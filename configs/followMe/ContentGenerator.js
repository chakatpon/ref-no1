import React from "react";
import { i18n, withTranslation } from "~/i18n";

class ContentGenerator extends React.Component {
  render() {
    const { t, content, className } = this.props;
    return <span className={className}>{t(content)}</span>;
  }
}

export default withTranslation(["reactour"])(ContentGenerator);
