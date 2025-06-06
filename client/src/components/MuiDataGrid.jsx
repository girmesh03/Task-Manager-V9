import { useState } from "react"; // Added useEffect
import PropTypes from "prop-types";
import { DataGrid } from "@mui/x-data-grid";
import CustomDataGridToolbar from "./CustomDataGridToolbar"; // Assuming this component exists

const MuiDataGrid = ({
  rows,
  columns,
  loading,
  rowCount, // New prop for total number of rows from server
  paginationModel, // New prop for controlled pagination: { page: number, pageSize: number }
  onPaginationModelChange, // New prop: callback for when page or pageSize changes
  // You might also want to add props for server-side sorting and filtering
  // sortModel,
  // onSortModelChange,
  // filterModel,
  // onFilterModelChange,
}) => {
  // selectionModel state remains for client-side row selection logic
  const [selectionModel, setSelectionModel] = useState({
    type: "include",
    ids: [],
  }); // Changed to simple array of IDs for selectionModel

  // If you want to manage selectedItemIds for toolbar separately, keep it.
  // Otherwise, DataGrid's selectionModel can directly be used if CustomDataGridToolbar expects an array of IDs.
  // For simplicity, let's assume CustomDataGridToolbar can work with the 'selectionModel' directly.
  // If it specifically needs the { type: 'include', ids: Set } structure,
  // you'd need to manage that separately and update it based on `onRowSelectionModelChange`.

  // The DataGrid's internal pagination state is now controlled by `paginationModel` prop.
  // No need for local `page` or `pageSize` state here if controlled from parent.

  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        loading={loading}
        rows={rows || []}
        columns={columns}
        // getRowHeight={() => "auto"}
        // getEstimatedRowHeight={() => 200}
        getRowId={(row) => row.id || row._id}
        rowCount={rowCount || 0}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        paginationMode="server"
        pageSize={paginationModel.pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        selectionModel={selectionModel}
        onRowSelectionModelChange={(newSelectionModel) => {
          setSelectionModel(newSelectionModel);
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        disableColumnResize
        checkboxSelection
        disableRowSelectionOnClick
        keepNonExistentRowsSelected
        density="compact"
        showToolbar
        slots={{
          toolbar: CustomDataGridToolbar,
        }}
        slotProps={{
          toolbar: {
            items: rows || [],
            selectedItemIds: selectionModel,
          },
          filterPanel: {
            filterFormProps: {
              logicOperatorInputProps: {
                variant: "outlined",
                size: "small",
              },
              columnInputProps: {
                variant: "outlined",
                size: "small",
                sx: { mt: "auto" },
              },
              operatorInputProps: {
                variant: "outlined",
                size: "small",
                sx: { mt: "auto" },
              },
              valueInputProps: {
                InputComponentProps: {
                  variant: "outlined",
                  size: "small",
                },
              },
            },
          },
        }}
      />
    </div>
  );
};

MuiDataGrid.propTypes = {
  rows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  rowCount: PropTypes.number.isRequired, // Total rows for server-side pagination
  paginationModel: PropTypes.shape({
    // Controlled pagination state
    page: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
  }).isRequired,
  // onPaginationModelChange: PropTypes.func.isRequired, // Callback for pagination changes
  // --- Optional Props for Server-Side Sorting/Filtering ---
  // sortModel: PropTypes.array,
  // onSortModelChange: PropTypes.func,
  // filterModel: PropTypes.object,
  // onFilterModelChange: PropTypes.func,
};

export default MuiDataGrid;
