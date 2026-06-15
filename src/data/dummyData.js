// Dummy data for testing the Cargo Warehouse Inventory System

export const currentUser = {
  id: 1,
  name: 'Nemith',
  email: 'nemith@gmail.com',
  role: 'Admin',
  avatar: null,
  phone: '+971 50 123 4567',
  department: 'Operations',
  joinedDate: '2022-03-15',
  lastLogin: '2026-06-12 08:45:00',
};

export const cargoData = [
  { id: 'CW-2024-001', customerId: 1, customerName: 'Emirates Logistics LLC', customerPhone: '+971 4 234 5678', cargoType: 'Electronics', originAirport: 'DXB', destinationAirport: 'LHR', pickupCity: 'Dubai', packageCount: 12, weight: 450.5, length: 120, width: 80, height: 60, chargeableWeight: 512.0, storageLocation: 'A-01', warehouseZone: 'Zone A', arrivalDate: '2026-06-01', status: 'Stored', dispatchDate: null, deliveryDate: null },
  { id: 'CW-2024-002', customerId: 2, customerName: 'Gulf Air Freight', customerPhone: '+971 2 345 6789', cargoType: 'Perishables', originAirport: 'AUH', destinationAirport: 'CDG', pickupCity: 'Abu Dhabi', packageCount: 8, weight: 320.0, length: 100, width: 60, height: 50, chargeableWeight: 360.0, storageLocation: 'B-03', warehouseZone: 'Zone B', arrivalDate: '2026-06-02', status: 'Ready for Dispatch', dispatchDate: null, deliveryDate: null },
  { id: 'CW-2024-003', customerId: 3, customerName: 'Al Maktoum Exports', customerPhone: '+971 4 456 7890', cargoType: 'Machinery', originAirport: 'SHJ', destinationAirport: 'FRA', pickupCity: 'Sharjah', packageCount: 3, weight: 1200.0, length: 200, width: 150, height: 120, chargeableWeight: 1350.0, storageLocation: 'C-05', warehouseZone: 'Zone C', arrivalDate: '2026-06-03', status: 'Dispatched', dispatchDate: '2026-06-10', deliveryDate: null },
  { id: 'CW-2024-004', customerId: 4, customerName: 'Nile River Trading Co', customerPhone: '+20 2 234 5678', cargoType: 'Textiles', originAirport: 'CAI', destinationAirport: 'DXB', pickupCity: 'Cairo', packageCount: 25, weight: 780.0, length: 90, width: 70, height: 55, chargeableWeight: 840.0, storageLocation: 'A-04', warehouseZone: 'Zone A', arrivalDate: '2026-06-04', status: 'Received', dispatchDate: null, deliveryDate: null },
  { id: 'CW-2024-005', customerId: 5, customerName: 'Pacific Trade Hub', customerPhone: '+852 2 345 6789', cargoType: 'Electronics', originAirport: 'HKG', destinationAirport: 'DXB', pickupCity: 'Hong Kong', packageCount: 40, weight: 950.0, length: 110, width: 85, height: 70, chargeableWeight: 1020.0, storageLocation: 'B-07', warehouseZone: 'Zone B', arrivalDate: '2026-06-05', status: 'Delivered', dispatchDate: '2026-06-08', deliveryDate: '2026-06-12' },
  { id: 'CW-2024-006', customerId: 6, customerName: 'Sahara Gold Imports', customerPhone: '+212 5 234 5678', cargoType: 'Precious Metals', originAirport: 'CMN', destinationAirport: 'DXB', pickupCity: 'Casablanca', packageCount: 2, weight: 85.0, length: 50, width: 40, height: 30, chargeableWeight: 96.0, storageLocation: 'D-01', warehouseZone: 'Zone D', arrivalDate: '2026-06-05', status: 'Stored', dispatchDate: null, deliveryDate: null },
  { id: 'CW-2024-007', customerId: 7, customerName: 'SkyBridge Logistics', customerPhone: '+65 6 234 5678', cargoType: 'Pharmaceuticals', originAirport: 'SIN', destinationAirport: 'DXB', pickupCity: 'Singapore', packageCount: 15, weight: 280.0, length: 80, width: 60, height: 45, chargeableWeight: 300.0, storageLocation: 'E-02', warehouseZone: 'Zone E', arrivalDate: '2026-06-06', status: 'Ready for Dispatch', dispatchDate: null, deliveryDate: null },
  { id: 'CW-2024-008', customerId: 8, customerName: 'Nordic Import Group', customerPhone: '+46 8 234 5678', cargoType: 'Industrial Equipment', originAirport: 'ARN', destinationAirport: 'DXB', pickupCity: 'Stockholm', packageCount: 6, weight: 2100.0, length: 250, width: 180, height: 150, chargeableWeight: 2280.0, storageLocation: 'C-09', warehouseZone: 'Zone C', arrivalDate: '2026-06-07', status: 'Dispatched', dispatchDate: '2026-06-11', deliveryDate: null },
  { id: 'CW-2024-009', customerId: 9, customerName: 'Amazon MENA Fulfillment', customerPhone: '+971 4 567 8901', cargoType: 'Consumer Goods', originAirport: 'DXB', destinationAirport: 'JFK', pickupCity: 'Dubai', packageCount: 100, weight: 1560.0, length: 100, width: 80, height: 60, chargeableWeight: 1680.0, storageLocation: 'A-11', warehouseZone: 'Zone A', arrivalDate: '2026-06-08', status: 'Received', dispatchDate: null, deliveryDate: null },
  { id: 'CW-2024-010', customerId: 10, customerName: 'Desert Rose Cosmetics', customerPhone: '+971 6 234 5678', cargoType: 'Cosmetics', originAirport: 'DXB', destinationAirport: 'MXP', pickupCity: 'Dubai', packageCount: 30, weight: 420.0, length: 90, width: 70, height: 50, chargeableWeight: 450.0, storageLocation: 'B-05', warehouseZone: 'Zone B', arrivalDate: '2026-06-09', status: 'Stored', dispatchDate: null, deliveryDate: null },
  { id: 'CW-2024-011', customerId: 11, customerName: 'Atlas Mountain Traders', customerPhone: '+212 6 345 6789', cargoType: 'Handicrafts', originAirport: 'RAK', destinationAirport: 'DXB', pickupCity: 'Marrakech', packageCount: 18, weight: 190.0, length: 75, width: 55, height: 40, chargeableWeight: 210.0, storageLocation: 'A-15', warehouseZone: 'Zone A', arrivalDate: '2026-06-10', status: 'Delivered', dispatchDate: '2026-06-09', deliveryDate: '2026-06-11' },
  { id: 'CW-2024-012', customerId: 12, customerName: 'TechVision Corp', customerPhone: '+1 212 345 6789', cargoType: 'Electronics', originAirport: 'JFK', destinationAirport: 'DXB', pickupCity: 'New York', packageCount: 22, weight: 680.0, length: 110, width: 85, height: 65, chargeableWeight: 750.0, storageLocation: 'B-12', warehouseZone: 'Zone B', arrivalDate: '2026-06-10', status: 'Received', dispatchDate: null, deliveryDate: null },
];

export const warehouseZones = [
  { id: 1, name: 'Zone A', description: 'General Cargo - Dry Storage', totalLocations: 20, occupiedLocations: 8, maxCapacity: 5000, currentLoad: 2240, temperature: 'Ambient', color: '#3b82f6' },
  { id: 2, name: 'Zone B', description: 'Temperature Controlled', totalLocations: 15, occupiedLocations: 6, maxCapacity: 3000, currentLoad: 1920, temperature: '2-8°C', color: '#10b981' },
  { id: 3, name: 'Zone C', description: 'Heavy Cargo & Machinery', totalLocations: 10, occupiedLocations: 3, maxCapacity: 15000, currentLoad: 5550, temperature: 'Ambient', color: '#f59e0b' },
  { id: 4, name: 'Zone D', description: 'High Value & Secure Storage', totalLocations: 8, occupiedLocations: 1, maxCapacity: 2000, currentLoad: 85, temperature: 'Controlled', color: '#ef4444' },
  { id: 5, name: 'Zone E', description: 'Pharmaceuticals & Medical', totalLocations: 12, occupiedLocations: 2, maxCapacity: 2500, currentLoad: 300, temperature: '15-25°C', color: '#8b5cf6' },
];

export const storageLocations = [
  { id: 'A-01', zone: 'Zone A', row: 'A', column: 1, status: 'Occupied', cargoId: 'CW-2024-001', capacity: 500, currentLoad: 450 },
  { id: 'A-02', zone: 'Zone A', row: 'A', column: 2, status: 'Available', cargoId: null, capacity: 500, currentLoad: 0 },
  { id: 'A-03', zone: 'Zone A', row: 'A', column: 3, status: 'Available', cargoId: null, capacity: 500, currentLoad: 0 },
  { id: 'A-04', zone: 'Zone A', row: 'A', column: 4, status: 'Occupied', cargoId: 'CW-2024-004', capacity: 500, currentLoad: 780 },
  { id: 'A-05', zone: 'Zone A', row: 'A', column: 5, status: 'Maintenance', cargoId: null, capacity: 500, currentLoad: 0 },
  { id: 'A-06', zone: 'Zone A', row: 'A', column: 6, status: 'Available', cargoId: null, capacity: 500, currentLoad: 0 },
  { id: 'A-07', zone: 'Zone A', row: 'A', column: 7, status: 'Available', cargoId: null, capacity: 500, currentLoad: 0 },
  { id: 'A-08', zone: 'Zone A', row: 'A', column: 8, status: 'Available', cargoId: null, capacity: 500, currentLoad: 0 },
  { id: 'B-03', zone: 'Zone B', row: 'B', column: 3, status: 'Occupied', cargoId: 'CW-2024-002', capacity: 400, currentLoad: 320 },
  { id: 'B-05', zone: 'Zone B', row: 'B', column: 5, status: 'Occupied', cargoId: 'CW-2024-010', capacity: 400, currentLoad: 420 },
  { id: 'B-07', zone: 'Zone B', row: 'B', column: 7, status: 'Occupied', cargoId: 'CW-2024-005', capacity: 400, currentLoad: 0 },
  { id: 'B-12', zone: 'Zone B', row: 'B', column: 12, status: 'Occupied', cargoId: 'CW-2024-012', capacity: 400, currentLoad: 680 },
  { id: 'C-05', zone: 'Zone C', row: 'C', column: 5, status: 'Occupied', cargoId: 'CW-2024-003', capacity: 2000, currentLoad: 1200 },
  { id: 'C-09', zone: 'Zone C', row: 'C', column: 9, status: 'Occupied', cargoId: 'CW-2024-008', capacity: 2000, currentLoad: 2100 },
  { id: 'D-01', zone: 'Zone D', row: 'D', column: 1, status: 'Occupied', cargoId: 'CW-2024-006', capacity: 500, currentLoad: 85 },
  { id: 'E-02', zone: 'Zone E', row: 'E', column: 2, status: 'Occupied', cargoId: 'CW-2024-007', capacity: 600, currentLoad: 280 },
];

export const dispatchRecords = [
  { id: 'DIS-001', cargoId: 'CW-2024-003', customerName: 'Al Maktoum Exports', destination: 'Frankfurt (FRA)', vehicleNumber: 'DXB-T-45231', driverName: 'Mohammed Al-Hassan', dispatchDate: '2026-06-10', estimatedDelivery: '2026-06-13', status: 'In Transit', lastLocation: 'Dubai Airport Cargo Terminal' },
  { id: 'DIS-002', cargoId: 'CW-2024-005', customerName: 'Pacific Trade Hub', destination: 'Hong Kong (HKG)', vehicleNumber: 'AUH-T-12345', driverName: 'Khalid Ibrahim', dispatchDate: '2026-06-08', estimatedDelivery: '2026-06-12', status: 'Delivered', lastLocation: 'Hong Kong Airport' },
  { id: 'DIS-003', cargoId: 'CW-2024-008', customerName: 'Nordic Import Group', destination: 'Stockholm (ARN)', vehicleNumber: 'DXB-T-67890', driverName: 'Ali Raza', dispatchDate: '2026-06-11', estimatedDelivery: '2026-06-14', status: 'In Transit', lastLocation: 'DXB Customs Clearance' },
  { id: 'DIS-004', cargoId: 'CW-2024-011', customerName: 'Atlas Mountain Traders', destination: 'Marrakech (RAK)', vehicleNumber: 'SHJ-T-11223', driverName: 'Omar Abdullah', dispatchDate: '2026-06-09', estimatedDelivery: '2026-06-11', status: 'Delivered', lastLocation: 'RAK Airport' },
];

export const activityLogs = [
  { id: 1, user: 'Ahmed Al-Rashidi', action: 'Added new cargo', details: 'CW-2024-012 (TechVision Corp)', date: '2026-06-10', time: '08:32:14', statusChange: 'New → Received', type: 'create' },
  { id: 2, user: 'Fatima Al-Zahra', action: 'Updated cargo status', details: 'CW-2024-003 (Al Maktoum Exports)', date: '2026-06-10', time: '10:15:42', statusChange: 'Stored → Dispatched', type: 'update' },
  { id: 3, user: 'Ahmed Al-Rashidi', action: 'Generated dispatch record', details: 'DIS-003 for CW-2024-008', date: '2026-06-11', time: '09:04:22', statusChange: 'Ready → Dispatched', type: 'dispatch' },
  { id: 4, user: 'Hassan Mohammed', action: 'Updated delivery status', details: 'CW-2024-005 (Pacific Trade Hub)', date: '2026-06-12', time: '07:55:10', statusChange: 'In Transit → Delivered', type: 'update' },
  { id: 5, user: 'Mariam Khalid', action: 'Created storage location', details: 'A-16 in Zone A', date: '2026-06-11', time: '11:22:45', statusChange: 'N/A', type: 'create' },
  { id: 6, user: 'Ahmed Al-Rashidi', action: 'Login', details: 'Dashboard access', date: '2026-06-12', time: '08:45:01', statusChange: 'N/A', type: 'login' },
  { id: 7, user: 'Fatima Al-Zahra', action: 'Edited cargo details', details: 'CW-2024-009 (Amazon MENA)', date: '2026-06-11', time: '14:30:18', statusChange: 'N/A', type: 'update' },
  { id: 8, user: 'Hassan Mohammed', action: 'Downloaded PDF report', details: 'Monthly Cargo Report - June 2026', date: '2026-06-10', time: '15:48:33', statusChange: 'N/A', type: 'report' },
  { id: 9, user: 'Omar Abdullah', action: 'Deleted cargo record', details: 'Duplicate entry CW-2024-000', date: '2026-06-09', time: '13:12:07', statusChange: 'N/A', type: 'delete' },
  { id: 10, user: 'Mariam Khalid', action: 'Updated warehouse zone', details: 'Zone B capacity modified', date: '2026-06-09', time: '16:05:55', statusChange: 'N/A', type: 'update' },
];

export const dashboardStats = {
  totalCargo: 12,
  receivedCargo: 3,
  storedCargo: 3,
  readyForDispatch: 2,
  dispatchedCargo: 2,
  deliveredCargo: 2,
  totalWeight: 8995.5,
  monthlyGrowth: 18.4,
};

export const recentActivities = activityLogs.slice(0, 6);

export const cargoTypeDistribution = [
  { type: 'Electronics', count: 3, percentage: 25 },
  { type: 'Machinery', count: 2, percentage: 17 },
  { type: 'Perishables', count: 1, percentage: 8 },
  { type: 'Pharmaceuticals', count: 1, percentage: 8 },
  { type: 'Consumer Goods', count: 2, percentage: 17 },
  { type: 'Others', count: 3, percentage: 25 },
];

export const statusOptions = [
  'All', 'Received', 'Stored', 'Ready for Dispatch', 'Dispatched', 'Delivered'
];

export const zoneOptions = [
  'All', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'
];

export const cargoTypeOptions = [
  'Electronics', 'Perishables', 'Machinery', 'Textiles', 'Precious Metals',
  'Pharmaceuticals', 'Industrial Equipment', 'Consumer Goods', 'Cosmetics',
  'Handicrafts', 'Other'
];

export const airportOptions = [
  'DXB - Dubai International', 'AUH - Abu Dhabi International', 'SHJ - Sharjah International',
  'LHR - London Heathrow', 'CDG - Paris Charles de Gaulle', 'FRA - Frankfurt',
  'JFK - New York JFK', 'HKG - Hong Kong', 'SIN - Singapore Changi',
  'ARN - Stockholm Arlanda', 'CAI - Cairo International', 'CMN - Casablanca Mohammed V',
  'MXP - Milan Malpensa', 'RAK - Marrakech Menara'
];
