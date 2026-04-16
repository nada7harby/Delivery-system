import { useOrderStore, useAuthStore, useCartStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, Badge, EmptyState } from "@/components";
import { Link, useNavigate } from "react-router-dom";
import { ORDER_STATUS } from "@/constants";

const OrderCard = ({ order }) => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { addToast } = useAppStore();

  const handleReorder = (e) => {
    e.stopPropagation();
    order.items.forEach((item) => {
      addItem(item);
    });
    addToast({
      type: "success",
      title: "Reordered! 🛒",
      message: "Items from this order added to your cart",
    });
    navigate("/cart");
  };

  return (
    <Card 
      hover 
      className="cursor-pointer group" 
      onClick={() => navigate(`/order/${order.id}`)}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status icon/bg area */}
        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900/50 items-center justify-center text-3xl group-hover:bg-primary/10 transition-colors">
          {order.status === ORDER_STATUS.DELIVERED ? "🎉" : "📦"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] flex items-center gap-2">
                Order #{order.id}
                <Badge status={order.status} size="sm" />
              </h3>
              <p className="text-xs text-[#9e7272]">
                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-black text-primary text-lg">${order.total?.toFixed(2)}</p>
              <p className="text-[10px] text-[#6b4040] dark:text-[#c9a97a] uppercase font-bold tracking-widest">{order.items?.length} items</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
             {order.items.slice(0, 4).map((item, i) => (
                <div key={i} className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-800" title={item.name}>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
             ))}
             {order.items.length > 4 && (
                <span className="text-xs text-[#9e7272] font-bold">+{order.items.length - 4} more</span>
             )}
          </div>

          <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-initial"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                Track Order
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 sm:flex-initial"
                onClick={handleReorder}
              >
                Reorder 🔁
              </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const CustomerOrdersPage = () => {
  const { user } = useAuthStore();
  const { getOrdersByCustomer } = useOrderStore();
  
  const orders = getOrdersByCustomer(user?.id).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto py-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-[#1a0a0a] dark:text-[#f8f8f8]">My Orders 📦</h1>
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">Review and track your recent activity</p>
          </div>
          {orders.length > 0 && (
            <div className="hidden sm:block px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold text-sm">
               Total {orders.length} orders
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No orders yet"
            description="Looks like you haven't placed any orders yet. Start exploring our delicious menu!"
            action={
              <Link to="/">
                <Button variant="primary" size="lg" icon="🍔">
                  Start Ordering
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center gap-4 mb-2 overflow-x-auto pb-2">
                <Badge status="info" className="cursor-pointer">All</Badge>
                <Badge status="pending" className="cursor-pointer opacity-50 hover:opacity-100">Pending</Badge>
                <Badge status="ontheway" className="cursor-pointer opacity-50 hover:opacity-100">Active</Badge>
                <Badge status="delivered" className="cursor-pointer opacity-50 hover:opacity-100">Delivered</Badge>
            </div>
            
            <div className="grid gap-5">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerOrdersPage;
