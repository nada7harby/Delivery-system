import { useOrderStore, useAuthStore } from "@/store";
import { DashboardLayout } from "@/layouts";
import { Card, Button, CustomSelect } from "@/components";
import { ORDER_STATUS } from "@/constants";
import { useState, useMemo } from "react";

const DriverEarningsPage = () => {
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const [period, setPeriod] = useState("this-week");

  // Get filtered orders for this driver
  const myOrders = useMemo(() => orders.filter((o) => 
    (o.driver?.id === user?.id || o.driver?.name === user?.name) && 
    o.status === ORDER_STATUS.DELIVERED
  ), [orders, user]);

  // Aggregate stats based on period
  const stats = useMemo(() => {
    const today = new Date();
    const startOfCurrentWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    startOfCurrentWeek.setHours(0,0,0,0);
    
    const startOfLastWeek = new Date(startOfCurrentWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    
    const periodOrders = myOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (period === "this-week") return orderDate >= startOfCurrentWeek;
      if (period === "last-week") return orderDate >= startOfLastWeek && orderDate < startOfCurrentWeek;
      return true;
    });

    const earnings = periodOrders.reduce((sum, o) => sum + (o.total * 0.15), 0);
    const deliveries = periodOrders.length;
    
    return { earnings, deliveries, orders: periodOrders };
  }, [myOrders, period]);

  // Dynamic Weekly Activity Logic
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const weeklyData = useMemo(() => days.map((dayName, index) => {
    const dayOrders = stats.orders.filter(o => new Date(o.createdAt).getDay() === index);
    const amount = dayOrders.reduce((sum, o) => sum + (o.total * 0.15), 0);
    
    // For demo, we show some random data if no actual data exists (but only for "this week")
    const displayAmount = amount || (period === "this-week" ? (Math.random() * 25 + 5) : 0); 
    
    return {
      day: dayName,
      amount: parseFloat(displayAmount.toFixed(2)),
      actual: amount > 0
    };
  }), [stats.orders, period]);

  const maxAmount = Math.max(...weeklyData.map(d => d.amount), 50);

  return (
    <DashboardLayout role="driver">
      <div className="max-w-4xl mx-auto pb-10">
        <h1 className="font-display text-3xl font-black text-[#1a0a0a] dark:text-[#f8f8f8] mb-8">
          Earnings Summary 💰
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-emerald-500 text-white border-none shadow-xl shadow-emerald-500/20">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total {period === "this-week" ? "Week" : "Last Week"}</p>
             <p className="text-4xl font-black">${stats.earnings.toFixed(2)}</p>
             <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs">Status: <span className="font-bold">Payout Ready</span></p>
             </div>
          </Card>

          <Card className="border-none shadow-lg">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliveries</p>
             <p className="text-3xl font-black text-[#1a0a0a] dark:text-[#f8f8f8]">{stats.deliveries}</p>
             <p className={stats.deliveries > 0 ? "text-xs text-emerald-500 font-bold mt-1" : "text-xs text-gray-400 font-bold mt-1"}>
               {stats.deliveries > 0 ? "↑ Active period" : "No orders this period"}
             </p>
          </Card>

          <Card className="border-none shadow-lg">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Tips</p>
             <p className="text-3xl font-black text-[#1a0a0a] dark:text-[#f8f8f8]">${(stats.deliveries * 2.5).toFixed(2)}</p>
             <p className="text-xs text-amber-500 font-bold mt-1">⭐ 5.0 Rating</p>
          </Card>
        </div>

        {/* Weekly Chart */}
        <Card className="mb-8 p-6 border-none shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-black text-xl text-[#1a0a0a] dark:text-[#f8f8f8]">Weekly Activity</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
                {period === "this-week" ? "Current Week Trends" : "Last Week Performance"}
              </p>
            </div>
            <div className="flex items-center gap-2">
               <div className="items-center gap-1.5 mr-4 hidden sm:flex">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Earnings</span>
               </div>
               <CustomSelect
                  value={period}
                  onChange={setPeriod}
                  className="w-40"
                  options={[
                    { value: "this-week", label: "This Week", icon: "📅" },
                    { value: "last-week", label: "Last Week", icon: "⏪" },
                    { value: "all", label: "All Time", icon: "🌎" },
                  ]}
               />
            </div>
          </div>
          
          <div className="flex items-end justify-between h-64 gap-2 sm:gap-4 px-2">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col justify-end h-full group">
                <div className="relative flex-1 flex flex-col justify-end items-center mb-4">
                   <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gray-900 text-white text-[10px] font-black px-2 py-1.5 rounded-lg shadow-xl z-20 pointer-events-none -translate-y-2 group-hover:translate-y-0 whitespace-nowrap">
                      ${d.amount}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                   </div>

                   <div 
                      className={`w-full max-w-[42px] transition-all duration-1000 rounded-t-xl group-hover:filter group-hover:brightness-110 shadow-lg relative z-10 ${
                        d.actual 
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-emerald-500/20" 
                          : "bg-gray-200/50 dark:bg-gray-800"
                      }`}
                      style={{ height: `${(d.amount / maxAmount) * 100}%`, minHeight: d.amount > 0 ? '4px' : '0px' }}
                   />
                </div>
                
                <div className="text-center h-4">
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${
                    d.actual ? "text-emerald-600" : "text-gray-400"
                  }`}>
                    {d.day}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-none shadow-xl overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
              <h2 className="font-black text-[#1a0a0a] dark:text-[#f8f8f8]">Delivery History</h2>
              <button className="text-[10px] font-black text-primary uppercase hover:underline">View Full Details</button>
           </div>
           <div className="p-0">
              {stats.orders.length > 0 ? (
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {stats.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center text-xl overflow-hidden">
                              <img src={order.items?.[0]?.image} alt="Dish" className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <p className="text-sm font-black text-[#1a0a0a] dark:text-[#f8f8f8]">Order #{order.id.slice(-6).toUpperCase()}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[10px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                                 <div className="w-1 h-1 rounded-full bg-gray-300" />
                                 <span className="text-[10px] text-gray-400 font-bold">{order.items?.length} items</span>
                              </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-emerald-600">+${(order.total * 0.15).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">EARNED</p>
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                   <div className="text-5xl mb-4">📫</div>
                   <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No deliveries for this period</p>
                   <p className="text-xs text-gray-400 mt-2">Check another time range or get back on the road!</p>
                </div>
              )}
           </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DriverEarningsPage;
