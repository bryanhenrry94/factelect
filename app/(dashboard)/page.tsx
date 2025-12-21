"use client";

import PageContainer from "@/components/container/PageContainer";

// components
import SalesOverview from "@/components/dashboard/SalesOverview";
import YearlyBreakup from "@/components/dashboard/YearlyBreakup";
import MonthlyEarnings from "@/components/dashboard/MonthlyEarnings";
import MonthlySalesTrend from "@/components/dashboard/MonthlySalesTrend";

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <div className="w-full">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Izquierda: 8/12 */}
          <div className="lg:col-span-8">
            <SalesOverview />
          </div>

          {/* Derecha: 4/12 */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 gap-6">
              <YearlyBreakup />
              <MonthlyEarnings />
            </div>
          </div>

          {/* Abajo: 12/12 */}
          <div className="lg:col-span-12">
            <MonthlySalesTrend />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
