// mui status icon imports
import DoneIcon from "@mui/icons-material/Done";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PendingIcon from "@mui/icons-material/Pending";
import ListIcon from "@mui/icons-material/List";

// mui priority icon imports
import HighPriorityIcon from "@mui/icons-material/PriorityHigh";
import MediumPriorityIcon from "@mui/icons-material/ImportExport";
import LowPriorityIcon from "@mui/icons-material/ArrowDownward";

// mui category icon imports
import ElectricalServicesIcon from "@mui/icons-material/ElectricalServices";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import PlumbingIcon from "@mui/icons-material/Plumbing";
import FormatPaintIcon from "@mui/icons-material/FormatPaint";
import BuildIcon from "@mui/icons-material/Build";
import CarpenterIcon from "@mui/icons-material/Carpenter";
import EngineeringIcon from "@mui/icons-material/Engineering";
import CategoryIcon from "@mui/icons-material/Category";

export const drawerWidth = 240;

// statusTypes
export const statusTypes = [
  { id: 1, label: "Completed", icon: DoneIcon },
  { id: 2, label: "In Progress", icon: HourglassEmptyIcon },
  { id: 3, label: "Pending", icon: PendingIcon },
  { id: 4, label: "To Do", icon: ListIcon },
];

// priorityTypes
export const priorityTypes = [
  { id: 1, label: "High", icon: HighPriorityIcon },
  { id: 2, label: "Medium", icon: MediumPriorityIcon },
  { id: 3, label: "Low", icon: LowPriorityIcon },
];

// categoryTypes
export const categoryTypes = [
  { id: 1, label: "Electrical", icon: ElectricalServicesIcon },
  { id: 2, label: "HVAC", icon: AcUnitIcon },
  { id: 3, label: "Plumbing", icon: PlumbingIcon },
  { id: 4, label: "Painting", icon: FormatPaintIcon },
  { id: 5, label: "Mechanical", icon: BuildIcon },
  { id: 6, label: "Carpentry", icon: CarpenterIcon },
  { id: 7, label: "Civil", icon: EngineeringIcon },
  { id: 8, label: "Other", icon: CategoryIcon },
];
