import { useState } from "react";
import { Link } from "react-router";
import PropTypes from "prop-types";

import { DataGrid } from "@mui/x-data-grid";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

import ConfirmDialog from "./ConfirmDialog";

const MuiDataGrid = ({
  rows,
  columns,
  loading,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  selectionModel,
  onRowSelectionModelChange,
  components,
  componentsProps,
  onUpdate,
  onDelete,
  slug,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const isActionColumnRequired = [
    "task",
    "routine task",
    "leaderboard",
  ].includes(slug);

  const actionColumns = {
    field: "actions",
    headerName: "Actions",
    flex: 1,
    minWidth: 140,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => (
      <>
        {slug !== "department" && (
          <Tooltip title={`View ${slug}`} placement="top" arrow>
            <IconButton
              size="small"
              component={Link}
              to={`/${slug}s/${params.row._id}/${
                slug === "user" ? "profile" : "details"
              }`}
              sx={{ border: "none", color: "primary.main" }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={`Update ${slug}`} placement="top" arrow>
          <IconButton
            size="small"
            onClick={() => onUpdate(params.row)}
            sx={{ border: "none", color: "secondary.main", mx: 0.5 }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Delete ${slug}`} placement="top" arrow>
          <IconButton
            size="small"
            onClick={() => {
              setIsConfirmOpen(true);
              setSelectedItem(params.row);
            }}
            sx={{ border: "none", color: "error.main" }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </>
    ),
  };

  return (
    <>
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          loading={loading}
          rows={rows || []}
          columns={
            isActionColumnRequired ? columns : [...columns, actionColumns]
          }
          getRowId={(row) => row.id || row._id}
          rowCount={rowCount || 0}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          paginationMode="server"
          pageSize={paginationModel.pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          selectionModel={selectionModel}
          onRowSelectionModelChange={onRowSelectionModelChange}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
          }
          disableColumnResize
          checkboxSelection
          disableRowSelectionOnClick
          keepNonExistentRowsSelected
          density="compact"
          showToolbar
          slots={components}
          slotProps={{
            ...componentsProps,
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

      <ConfirmDialog
        open={isConfirmOpen}
        title={`Delete ${slug}`}
        description={`Are you sure you want to delete this ${slug}?. This action cannot be undone.`}
        onClose={() => {
          setSelectedItem(null);
          setIsConfirmOpen(false);
        }}
        onConfirm={() => {
          onDelete(selectedItem);
          setIsConfirmOpen(false);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

MuiDataGrid.propTypes = {
  rows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  rowCount: PropTypes.number.isRequired,
  paginationModel: PropTypes.shape({
    page: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
  }).isRequired,
  onPaginationModelChange: PropTypes.func.isRequired,
  selectionModel: PropTypes.object.isRequired,
  onRowSelectionModelChange: PropTypes.func.isRequired,
  components: PropTypes.object,
  componentsProps: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  slug: PropTypes.string.isRequired,
};

export default MuiDataGrid;
