"use client";

import dynamic from "next/dynamic";

const Calculator = dynamic(() => import("../nps-vs-aps-updated"), { ssr: false });

export default function Home() {
  return <Calculator />;
}
       
