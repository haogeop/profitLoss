"use client";
import React from "react";
import ProfitLoss from "../components/ProfitLoss"

export default function Home() {
  return (
    <div style={{ backgroundColor: '#ffff', height: '100vh', margin: 0 }}>
      {/* <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <ProfitLoss></ProfitLoss>
      </main> */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', backgroundColor: '#fffff'}}>
        <ProfitLoss></ProfitLoss>
      </div>
    </div>
  );
}
