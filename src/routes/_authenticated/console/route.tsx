import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/console")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/console" || location.pathname === "/console/") {
      throw redirect({ to: "/console/timeline" });
    }
  },
  component: () => <Outlet />,
});