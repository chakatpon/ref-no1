import React from "react";
import { Droppable } from "react-beautiful-dnd";

const DashBoardColumn = ({ droppableId, index, children }) => {
    return (
        <Droppable droppableId={droppableId} index={index}>
            {provided => (
                <div className="column-wrap col-12 col-lg-6 px-0 px-lg-3" ref={provided.innerRef}>
                    {children}
                </div>
            )}
        </Droppable>
    );
};

export default DashBoardColumn;
