// react
import { useLocation } from "react-router";

// components
import NotFound from "./NotFound";

const ErrorPage = () => {
  const location = useLocation();
  const error = location.state?.error || "An unknown error occurred";
  console.log(error);

  if (error?.status === 403) {
    return <NotFound />;
  }

  return <div>ErrorPage</div>;
};

export default ErrorPage;
