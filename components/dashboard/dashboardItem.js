import React from "react";

import { Draggable } from "react-beautiful-dnd";

const DashboardItem = ({ draggableId, index, children }) => {
  return (
    <Draggable draggableId={draggableId} index={index}>
      {provided => (
        <section
          className="box box--width-header px-0"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {children}
        </section>
      )}
    </Draggable>
  );
};

export default DashboardItem;
