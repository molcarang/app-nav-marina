import * as React from "react";
import Svg, { Path } from "react-native-svg";

const SailIcon = ({ color, size, style }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    style={style}
  >
    <Path
      d="M4.6,30S-6.108,12.967,15.925,2V30H4.6"
      fill={color}
    />
    <Path
      d="M19.337,30V12.645S22.853,18.381,30,30H19.337"
      fill={color}
    />
  </Svg>
);

export default SailIcon;