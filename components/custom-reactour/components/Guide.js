import styled from "styled-components";
import * as hx from "../helpers";

const Guide = styled.div`
  --reactour-accent: ${props => props.accentColor};
  ${props =>
    props.defaultStyles
      ? `
  max-width: 360px;
  min-width: 150px;
  padding-right: 40px;
  border-radius: ${props.rounded}px;
  border: 1px solid transparent;
  background-color: #fff;
  padding: 24px 30px;
  box-shadow: 0 0.5em 3em rgba(0, 0, 0, 0.3);
  color: inherit;
  `
      : ""}
  position: fixed;
  transition: transform 0.3s;
  top: 0;
  left: 0;
  z-index: 1000000;
  transform: ${props => {
    const {
      targetTop,
      targetRight,
      targetBottom,
      targetLeft,
      windowWidth,
      windowHeight,
      helperWidth,
      helperHeight,
      helperPosition,
      padding
    } = props;

    const available = {
      left: targetLeft,
      right: windowWidth - targetRight,
      top: targetTop,
      bottom: windowHeight - targetBottom
    };

    const couldPositionAt = position => {
      return (
        available[position] >
        (hx.isHoriz(position)
          ? helperWidth + padding * 2
          : helperHeight + padding * 2)
      );
    };

    const autoPosition = coords => {
      const positionsOrder = hx.bestPositionOf(available);
      for (let j = 0; j < positionsOrder.length; j++) {
        if (couldPositionAt(positionsOrder[j])) {
          return coords[positionsOrder[j]];
        }
      }
      return coords.center;
    };

    const pos = helperPosition => {
      if (Array.isArray(helperPosition)) {
        const isOutX = hx.isOutsideX(helperPosition[0], windowWidth);
        const isOutY = hx.isOutsideY(helperPosition[1], windowHeight);
        const warn = (axis, num) => {
          console.warn(
            `${axis}:${num} is outside window, falling back to center`
          );
        };
        if (isOutX) warn("x", helperPosition[0]);
        if (isOutY) warn("y", helperPosition[1]);
        return [
          isOutX ? windowWidth / 2 - helperWidth / 2 : helperPosition[0],
          isOutY ? windowHeight / 2 - helperHeight / 2 : helperPosition[1]
        ];
      }

      const hX = hx.isOutsideX(targetLeft + helperWidth, windowWidth)
        ? hx.isOutsideX(targetRight + padding, windowWidth)
          ? targetRight - helperWidth
          : targetRight - helperWidth + padding
        : targetLeft - padding;
      const x = hX > padding ? hX : padding;
      const hY = hx.isOutsideY(targetTop + helperHeight, windowHeight)
        ? hx.isOutsideY(targetBottom + padding, windowHeight)
          ? targetBottom - helperHeight
          : targetBottom - helperHeight + padding
        : targetTop - padding;
      const y = hY > padding ? hY : padding;
      const coords = {
        top: [x, targetTop - helperHeight - padding * 2],
        right: [targetRight + padding * 2, y],
        bottom: [x, targetBottom + padding * 2],
        left: [targetLeft - helperWidth - padding * 2, y],
        center: [
          windowWidth / 2 - helperWidth / 2,
          windowHeight / 2 - helperHeight / 2
        ]
      };
      if (helperPosition === "center" || couldPositionAt(helperPosition)) {
        return coords[helperPosition];
      }
      return autoPosition(coords);
    };

    const p = pos(helperPosition);
    return `translate(${p[0]}px, ${p[1]}px)`;
  }};
  :after${props => {
    const {
      targetTop,
      targetRight,
      targetBottom,
      targetLeft,
      windowWidth,
      windowHeight,
      helperWidth,
      helperHeight,
      helperPosition,
      padding,
      enableArrow,
      arrowPosition
    } = props;
    const available = {
      left: targetLeft,
      right: windowWidth - targetRight,
      top: targetTop,
      bottom: windowHeight - targetBottom
    };
    let finalArrowPosition = arrowPosition || hx.bestPositionOf(available)[0];
    let arrow = `{
      content: " ";
      width: 0px;
      height: 0px;
      border-top: 10px solid transparent;
      border-left: 10px solid #fff;
      border-bottom: 10px solid transparent;
      border-right: 10px solid transparent;
      position: absolute;
      left: 100%;
      top: 50%;
      margin-top: -10px;
    }`;

    const generateArrowPosition = () => {
      if (enableArrow) {
        switch (finalArrowPosition) {
          case "right":
            arrow = `{
                content: " ";
                width: 0px;
                height: 0px;
                border-top: 10px solid transparent;
                border-left: 10px solid transparent;
                border-bottom: 10px solid transparent;
                border-right: 10px solid #fff;
                position: absolute;
                right: 100%;
                top: 50%;
                margin-top: -10px;
              }`;
            break;
          case "left":
            arrow = `{
                content: " ";
                width: 0px;
                height: 0px;
                border-top: 10px solid transparent;
                border-left: 10px solid #fff;
                border-bottom: 10px solid transparent;
                border-right: 10px solid transparent;
                position: absolute;
                left: 100%;
                top: 50%;
                margin-top: -10px;
              }`;
            break;
          case "top":
            arrow = `{
                  content: " ";
                  width: 0px;
                  height: 0px;
                  border-top: 10px solid #fff;
                  border-left: 10px solid transparent;
                  border-bottom: 10px solid transparent;
                  border-right: 10px solid transparent;
                  position: absolute;
                  left: 50%;
                  top: 100%;
                  margin-left: -10px;
                }`;
            break;
          case "bottom":
            arrow = `{
                  content: " ";
                  width: 0px;
                  height: 0px;
                  border-top: 10px solid transparent;
                  border-left: 10px solid transparent;
                  border-bottom: 10px solid #fff;
                  border-right: 10px solid transparent;
                  position: absolute;
                  left: 50%;
                  bottom: 100%;
                  margin-left: -10px;
                }`;
            break;
        }
      } else {
        arrow = ``;
      }
    };

    generateArrowPosition();
    return arrow;
  }} ;
`;

export default Guide;
