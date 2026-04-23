import AddStockForm from "@/components/portfolio/AddStockForm";
import SummaryDashboard from "@/components/portfolio/SummaryDashboard";
import SummaryTable from "@/components/portfolio/SummaryTable";

export default async function PortfolioPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 py-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Portfolio</h1>

        {/* ****************************** 1. Summary Dashboard Cards ***************************** */}

        <SummaryDashboard />

        {/* ****************************** 2. BUY/SELL Transaction Section ******************************* */}
        <div className="mb-10">
          <h2 className="text-xl mb-4 text-slate-400 font-semibold">
            Add New Transaction
          </h2>
          <AddStockForm />
        </div>

        {/* ****************************** 3. Combined Holdings Table ******************************* */}
        <SummaryTable />
      </div>
    </main>
  );
}
