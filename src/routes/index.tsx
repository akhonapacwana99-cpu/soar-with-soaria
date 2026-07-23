import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => {
    // Redirect to marketing index via a client refresh
    if (typeof window !== "undefined") window.location.replace("/");
    return null;
  },
});
