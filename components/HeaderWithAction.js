import React, { Fragment } from "react";
import WithoutTitleField from "../components/Fields/WithoutTitleField";
import styled from "styled-components";

const Title = styled.h2`
  font-size: 28px;
`;
const ActionTitle = styled.div`
  margin: -20px 0px 25px 27px;
`;

const HeaderWithAction = ({
  title,
  field,
  model,
  datas,
  actionTitle,
  onClick
}) => {
  return (
    <Fragment>
      <div className="row" style={{ padding: 27 }}>
        <div className={field ? `col-3` : `col-12`}>
          <Title>
            {`${title} ${
              !!model &&
              !!model.fields &&
              model.fields[0].required &&
              model.fields[0].canEdit
                ? "*"
                : ""
            }
        `}
          </Title>
        </div>
        <div className="col-3">
          {field && <WithoutTitleField model={model} datas={datas} />}
        </div>
      </div>
      <ActionTitle>
        <b>
          <a href="#" onClick={onClick}>
            {actionTitle}
          </a>
        </b>
      </ActionTitle>
    </Fragment>
  );
};

export default HeaderWithAction;
