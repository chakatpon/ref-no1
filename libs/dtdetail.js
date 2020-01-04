const dLocalTable = (e, _this, res, columns, dData) => {
  return $(_this.el)
    .DataTable({
      dom:
        '<<"d-none d-sm-flex flex-wrap row justify-content-between align-items-center mb-3"<"col-12 col-lg-4 pr-lg-0 d-none d-lg-flex align-items-center justify-content-center justify-content-lg-start"lp><"col-12 col-lg-8 d-none d-sm-flex flex-wrap justify-content-center justify-content-lg-end"<"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><"table--responsive"t><"row"<"col-12 row-bottom d-flex d-lg-none"p>>>',
      language: {
        lengthMenu: "Show _MENU_ Per Page",
        paginate: {
          previous: "<i class='icon icon-arrow_small_left'></i> Previous",
          next: "Next <i class='icon icon-arrow_small_right'></i>",
          decimal: ",",
          thousands: "."
        }
      },
      responsive: {
        details: {
          type: "column",
          target: "td:last-child"
        }
      },
      buttons: ["copyHtml5", "excelHtml5", "pdfHtml5", "csvHtml5"],
      paging: false,
      data: dData,
      fixedHeader: false,
      fixedColumns: false,
      autoWidth: false,
      stateSave: false,
      colReorder: true,
      scrollX: false,
      width: "100%",
      columns,
      scrollCollapse: true
    })
    .on("error", function(e, settings, techNote, message) {
      console.warn("An error has been reported by DataTables: ", message);
    });
};
export default dLocalTable;
