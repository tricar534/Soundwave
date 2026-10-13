import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

function ApiStatus() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function checkBackend() {
      try {
        const data = await getHealth();

        if (data.status === "ok") {
          setStatus("connected");
        } else {
          setStatus("unavailable");
        }
      } catch (error) {
        console.error("Backend connection failed:", error);
        setStatus("unavailable");
      }
    }

    checkBackend();
  }, []);

  if (status === "loading") {
    return <span className="api-status">Backend: Checking...</span>;
  }

  if (status === "connected") {
    return <span className="api-status">Backend: Connected</span>;
  }

  return <span className="api-status">Backend: Unavailable</span>;
}

export default ApiStatus;