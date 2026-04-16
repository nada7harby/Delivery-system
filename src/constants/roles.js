// User roles
export const ROLES = {
  CUSTOMER: "customer",
  DRIVER: "driver",
  ADMIN: "admin",
};

// Mock users for auth simulation
export const MOCK_USERS = [
  {
    id: "u1",
    name: "Alice Johnson",
    email: "customer@demo.com",
    password: "demo123",
    role: ROLES.CUSTOMER,
    avatar: null,
    phone: "+1 555-0101",
    address: "123 Main St, Springfield",
  },
  {
    id: "u2",
    name: "Bob Smith",
    email: "driver@demo.com",
    password: "demo123",
    role: ROLES.DRIVER,
    avatar: null,
    phone: "+1 555-0102",
    vehicleType: "Motorcycle",
    licensePlate: "DRV-2024",
    rating: 4.8,
    deliveries: 342,
  },
  {
    id: "u3",
    name: "Carol Admin",
    email: "admin@demo.com",
    password: "demo123",
    role: ROLES.ADMIN,
    avatar: null,
    phone: "+1 555-0103",
  },
];
