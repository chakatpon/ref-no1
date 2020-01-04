import React from "react";
import styled from "styled-components";
import * as hx from "../helpers";
import PropTypes from "prop-types";

const SvgMaskWrapper = styled.div`
  width: 100%;
  left: 0;
  top: 0;
  height: 100%;
  position: fixed;
  z-index: 99999;
  pointer-events: none;
  color: #000;
`;

export default function SvgMask({
  windowWidth,
  windowHeight,
  targetWidth,
  targetHeight,
  targetTop,
  targetLeft,
  padding,
  rounded,
  disableInteraction,
  disableInteractionClassName,
  className,
  onClick,
  accentColor,
  current,
  shadowClass,
  showMaskNumber
}) {
  const width = hx.safe(targetWidth + padding * 2);
  const height = hx.safe(targetHeight + padding * 2);
  const top = hx.safe(targetTop - padding);
  const left = hx.safe(targetLeft - padding);

  return (
    <SvgMaskWrapper onClick={onClick}>
      <svg
        width={windowWidth}
        height={windowHeight}
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} ${shadowClass}`}
      >
        <defs>
          <linearGradient id="Gradient2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#951d9d" />
            <stop offset="100%" stop-color="#5d148c" />
          </linearGradient>
          <mask id="mask-main">
            <rect
              x={0}
              y={0}
              width={windowWidth}
              height={windowHeight}
              fill="white"
            />
            <rect x={left} y={top} width={width} height={height} fill="black" />
            {/* top left rounded corner */}
            <rect
              x={left - 1}
              y={top - 1}
              width={rounded}
              height={rounded}
              fill="white"
            />
            <circle
              cx={left + rounded}
              cy={top + rounded}
              r={rounded}
              fill="black"
            />
            {/* top right rounded corner */}
            <rect
              x={left + width - rounded + 1}
              y={top - 1}
              width={rounded}
              height={rounded}
              fill="white"
            />
            <circle
              cx={left + width - rounded}
              cy={top + rounded}
              r={rounded}
              fill="black"
            />
            {/* bottom left rounded corner */}
            <rect
              x={left - 1}
              y={top + height - rounded + 1}
              width={rounded}
              height={rounded}
              fill="white"
            />
            <circle
              cx={left + rounded}
              cy={top + height - rounded}
              r={rounded}
              fill="black"
            />
            {/* bottom right rounded corner */}
            <rect
              x={left + width - rounded + 1}
              y={top + height - rounded + 1}
              width={rounded}
              height={rounded}
              fill="white"
            />
            <circle
              cx={left + width - rounded}
              cy={top + height - rounded}
              r={rounded}
              fill="black"
            />
          </mask>
          <clipPath id="clip-path">
            {/* top */}
            <rect x={0} y={0} width={windowWidth} height={top} />
            {/* left */}
            <rect x={0} y={top} width={left} height={height} />
            {/* right */}
            <rect
              x={targetLeft + targetWidth + padding}
              y={top}
              width={hx.safe(windowWidth - targetWidth - left)}
              height={height}
            />
            {/* bottom */}
            <rect
              x={0}
              y={targetTop + targetHeight + padding}
              width={windowWidth}
              height={hx.safe(windowHeight - targetHeight - top)}
            />
          </clipPath>
        </defs>
        <rect
          x={0}
          y={0}
          width={windowWidth}
          height={windowHeight}
          fill="currentColor"
          fill-opacity="0.4"
          mask="url(#mask-main)"
        />
        {showMaskNumber ? (
          <>
            <circle
              cx={left + rounded}
              cy={top + rounded}
              id="stepNumber"
              r="15px"
              // fill={accentColor}
              fill-opacity="1"
              fill="url(#Gradient2)"
              stroke="#FFFFFF"
              strokeWidth="4"
            ></circle>
            <text
              x={left + rounded}
              y={top + rounded + 1}
              fill="#FFF"
              dominant-baseline="middle"
              text-anchor="middle"
            >
              {current + 1}
            </text>
          </>
        ) : null}

        {/* <rect
          x={0}
          y={0}
          width={windowWidth}
          height={windowHeight}
          fill="currentColor"
          clipPath="url(#clip-path)"
          pointerEvents="auto"
        /> */}
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          pointerEvents="auto"
          fill="transparent"
          display={disableInteraction ? "block" : "none"}
          className={disableInteractionClassName}
        />
      </svg>
    </SvgMaskWrapper>
  );
}

SvgMask.propTypes = {
  windowWidth: PropTypes.number.isRequired,
  windowHeight: PropTypes.number.isRequired,
  targetWidth: PropTypes.number.isRequired,
  targetHeight: PropTypes.number.isRequired,
  targetTop: PropTypes.number.isRequired,
  targetLeft: PropTypes.number.isRequired,
  padding: PropTypes.number.isRequired,
  rounded: PropTypes.number.isRequired,
  disableInteraction: PropTypes.bool.isRequired,
  disableInteractionClassName: PropTypes.string.isRequired
};
