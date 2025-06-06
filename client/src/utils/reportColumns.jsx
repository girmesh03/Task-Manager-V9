import dayjs from "dayjs";
import Chip from "@mui/material/Chip";

export const TasksColumns = [
  // {
  //   field: "id", // Corresponds to "_id" or "id" from backend
  //   headerName: "ID",
  //   flex: 0.7,
  //   minWidth: 180, // To ensure UUID is somewhat visible if not hidden
  //   hide: true, // Usually, raw IDs are not displayed to end-users
  //   filterable: false, // Typically don't filter by raw ID
  // },
  {
    field: "date",
    headerName: "Date",
    type: "date",
    flex: 1,
    minWidth: 120,
    valueGetter: (value) => (value ? dayjs(value).toDate() : null),
    valueFormatter: (value) => (value ? dayjs(value).format("YYYY-MM-DD") : ""),
  },
  {
    field: "taskType",
    headerName: "Task Type",
    // flex: 0.8,
    // minWidth: 130,
    type: "singleSelect",
    valueOptions: ["AssignedTask", "ProjectTask"],
  },
  {
    field: "title",
    headerName: "Title",
    // flex: 1.5,
    // minWidth: 200,
    renderCell: (params) => (
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={params.value || ""}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    // flex: 0.8,
    // minWidth: 130,
    type: "singleSelect",
    valueOptions: ["To Do", "In Progress", "Completed", "Pending"],
    renderCell: (params) => {
      const status = params.value;
      let color = "default";

      switch (status) {
        case "Completed":
          color = "success";
          break;
        case "Pending":
          color = "warning";
          break;
        case "In Progress":
          color = "info";
          break;
        case "To Do":
          color = "primary";
          break;
        default:
          color = "default";
      }

      return (
        <Chip label={status} color={color} variant="filled" size="small" />
      );
    },
  },
  {
    field: "location",
    headerName: "Location",
    // flex: 1,
    // minWidth: 150,
  },
  {
    field: "assignedUsers",
    headerName: "Assigned Users",
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => (
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={params.value || ""}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "companyName",
    headerName: "Company Name",
    // flex: 1,
    // minWidth: 150,
  },
  {
    field: "phoneNumber",
    headerName: "Phone Number",
    // flex: 1,
    // minWidth: 140,
  },
  {
    field: "description",
    headerName: "Description",
    // flex: 2,
    // minWidth: 250,
    renderCell: (params) => (
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={params.value || ""}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "activities",
    headerName: "Activities",
    // flex: 2,
    // minWidth: 250,
    renderCell: (params) => (
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={params.value || ""}
      >
        {params.value}
      </div>
    ),
  },
];

export const RoutineColumns = [
  // {
  //   field: "id",
  //   headerName: "ID",
  //   flex: 0.7,
  //   minWidth: 180,
  //   hide: true,
  //   filterable: false,
  // },
  {
    field: "date",
    headerName: "Date",
    type: "date",
    // flex: 0.8,
    // minWidth: 90,
    headerAlign: "left",
    align: "left",
    valueGetter: (params) => {
      return params ? new Date(params) : null;
    },
    valueFormatter: (params) => {
      if (!params) return "N/A";
      return new Date(params).toLocaleDateString("en-US");
    },
  },
  {
    field: "location", // Department name
    headerName: "Location",
    // flex: 1,
    // minWidth: 150,
  },
  {
    field: "assignedUsers", // Performed by
    headerName: "Performed By",
    // flex: 1.5,
    // minWidth: 180,
  },
  {
    field: "description", // Tasks performed
    headerName: "Tasks Performed",
    // flex: 2.5,
    // minWidth: 300,
    renderCell: (params) => (
      // Allow wrapping for this potentially very long field
      <div
        style={{
          width: "100%",
          whiteSpace: "normal",
          wordBreak: "break-word",
        }}
        title={params.value || ""}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    // flex: 0.8,
    // minWidth: 130,
    type: "singleSelect",
    valueOptions: ["Completed", "Uncompleted", "Pending"],
    renderCell: (params) => {
      const status = params.value;
      let color = "default";

      switch (status) {
        case "Completed":
          color = "success";
          break;
        case "Uncompleted":
          color = "error";
          break;
        case "Pending":
          color = "warning";
          break;
        default:
          color = "default";
      }

      return (
        <Chip label={status} color={color} variant="filled" size="small" />
      );
    },
  },
];
