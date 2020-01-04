import styled from "styled-components";
import { withTranslation } from "react-i18next";

const Main = styled.h5`
  display: inline-block;
  display: -webkit-inline-box;
  padding-top: 9px;
  small {
    padding-left: 26px;
  }
`;
const Title = styled.div``;
const HeaderInsertAndAttachFile = ({ title = "", lang, t }) => (
  <Main className="col-12">
    <Title>{title}</Title>
    <small> {t(`${lang}:Maximum file upload size 3 MB per file`)}</small>
  </Main>
);

export default withTranslation(["request-create"])(HeaderInsertAndAttachFile);
