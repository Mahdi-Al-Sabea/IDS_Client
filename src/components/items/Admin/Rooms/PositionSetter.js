import { useEffect } from "react";
import { useFormikContext } from "formik";

const PositionSetter = ({ floorPlanPosition }) => {
  const { setFieldValue } = useFormikContext();

  useEffect(() => {
    if (floorPlanPosition) {
      setFieldValue("position", floorPlanPosition);
    }
  }, [floorPlanPosition]);

  return null;
};

export default PositionSetter;