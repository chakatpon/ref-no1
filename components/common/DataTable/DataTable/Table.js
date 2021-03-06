import styled, { css } from "styled-components";

const disabled = css`
  pointer-events: none;
  opacity: 0.4;
`;

const TableStyle = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  max-width: 100%;
  ${props => props.disabled && disabled};
`;

export default TableStyle;
