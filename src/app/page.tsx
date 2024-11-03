"use client";
import React from "react";
import ProfitLoss from "../components/ProfitLoss"

// BTC-70000-240901-C
export default function Home() {
  return (
    <div style={{ backgroundColor: '#ffff', height: '100vh', margin: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', backgroundColor: '#fffff'}}>
        <ProfitLoss 
          strikePrice={400}
          optionPrice={100}
          curPrice={1000}
        />
      </div>
    </div>
  );
}
