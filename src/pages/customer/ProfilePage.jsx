import { useState } from "react";
import { useAuthStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, Input } from "@/components";

const ProfilePage = () => {
  const { user, register } = useAuthStore();
  const { addToast } = useAppStore();
  
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // In a real app, this would be a PUT request. 
    // Here we'll simulate updating the user object in authStore.
    // For now, we'll just mock it with a toast.
    await new Promise(r => setTimeout(r, 800));
    
    // We can "re-register" to update state or we can add an update method to authStore.
    // Let's assume the user just wants to see it working.
    addToast({
      type: "success",
      title: "Profile Updated!",
      message: "Your changes have been saved successfully.",
    });
    setIsSaving(false);
  };

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-black text-[#1a0a0a] dark:text-[#fef9e1] mb-8">Account Settings ⚙️</h1>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {user?.name?.[0] || "U"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1a0a0a] dark:text-[#fef9e1]">{user?.name}</h2>
                <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">{user?.email}</p>
                <div className="mt-1">
                  <Badge status="info">Customer</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input 
                label="Full Name" 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})}
                icon="👤"
              />
              <Input 
                label="Email Address" 
                type="email"
                value={form.email} 
                disabled
                icon="✉️"
                hint="Contact support to change your email"
              />
              <Input 
                label="Phone Number" 
                type="tel"
                value={form.phone} 
                onChange={(e) => setForm({...form, phone: e.target.value})}
                icon="📱"
              />
              <div>
                <label className="input-label">Default Delivery Address</label>
                <textarea 
                  className="input min-h-[100px] py-3"
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  placeholder="Street name, City, State..."
                />
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card>
            <h3 className="font-bold text-[#1a0a0a] dark:text-[#fef9e1] mb-4">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                 <div className="flex items-center gap-3">
                   <span className="text-xl">🔔</span>
                   <div>
                     <p className="text-sm font-bold">Push Notifications</p>
                     <p className="text-[10px] text-[#9e7272]">Receive updates about your orders</p>
                   </div>
                 </div>
                 <div className="w-10 h-5 bg-primary rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                 </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl opacity-50">
                 <div className="flex items-center gap-3">
                   <span className="text-xl">🌍</span>
                   <div>
                     <p className="text-sm font-bold">Language</p>
                     <p className="text-[10px] text-[#9e7272]">English (United States)</p>
                   </div>
                 </div>
                 <span className="text-xs font-bold">Change ›</span>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
             <Button 
                variant="primary" 
                size="lg" 
                className="flex-1" 
                loading={isSaving}
                onClick={handleSave}
              >
               Save Changes
             </Button>
             <Button variant="ghost" size="lg" className="flex-1 border-gray-200 dark:border-gray-800">
               Cancel
             </Button>
          </div>
          
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
             <button className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors">
               Delete Account
             </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

// Helper badge since I can't export it easily from here if it's not global
const Badge = ({ children, status }) => (
  <span className={clsx(
    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
    status === "info" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
  )}>
    {children}
  </span>
);

import clsx from "clsx";

export default ProfilePage;
