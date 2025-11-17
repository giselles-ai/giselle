import { giselle } from "@/app/giselle";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

export const { GET, POST } = giselle.handlers;
