import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL, WS_BASE_URL } from '../config';
import { supabase } from '../supabaseClient';

// --- Helper: read current authenticated user from localStorage ---
const getAuthUser = () => {
  try {
    const raw = localStorage.getItem('erp_user') || localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
};

// --- Helper: resolve tenantId from auth user, fallback to 1 ---
const getAuthTenantId = () => {
  const u = getAuthUser();
  return (u?.tenantId || u?.tenant?.id || 1);
};

// --- Helper: resolve userId from auth user, fallback to 1 ---
const getAuthUserId = () => {
  const u = getAuthUser();
  return (u?.id || 1);
};

// --- Helper: build request headers with JWT Authorization ---
const getAuthHeaders = () => {
  const user = getAuthUser();
  const token = user?.token || localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// --- Payment method normalizer ---
const mapPaymentMethod = (method) => {
  if (!method) return 'CASH';
  const m = String(method).toUpperCase().trim();
  if (['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT'].includes(m)) return m;
  if (m.includes('UPI') || m.includes('ONLINE') || m.includes('QR')) return 'UPI';
  if (m.includes('CARD') || m.includes('POS')) return 'CARD';
  if (m.includes('BANK') || m.includes('TRANSFER') || m.includes('NET')) return 'NET_BANKING';
  if (m.includes('CREDIT')) return 'CREDIT';
  return 'CASH';
};

const DataContext = createContext();

export const INITIAL_COMPANY_DETAILS = {
  name: 'YASHAS EV SERVICE',
  tagline: 'EV SERVICE & BILLING',
  phone: '7676424061',
  altPhone: '8792383779',
  email: 'yrtmotos@gmail.com',
  gstin: '29EVHUB1234F1Z5',
  address: '1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073',
  upiId: '8105979580-of5a-2@ybl',
  accountHolderName: 'M/S YASHAS EV SERVICES',
  bankName: 'Karnataka Bank',
  accountNo: '0894202500006001',
  ifscCode: 'KARB0000894',
  branch: 'Bengaluru - Thippenahalli',
  accountType: 'Current Account (C/A)',
  micrCode: '560052135',
  termsAndConditions: 'Warranty applies as per manufacturer terms. Physical and water damage are not covered under warranty. Thank you for choosing Yashas EV Service!'
};

const INITIAL_PRODUCTS = [
  // 1. General Service & Consumables
  { id: 1, name: 'Grease / Lubricant', barcode: '890123456001', hsnCode: '27101980', category: 'Service Consumable', brand: 'Yashas Care', purchasePrice: 120, sellingPrice: 250, taxRate: 18, stockQuantity: 25, minStockThreshold: 5, unit: 'Bottle' },
  { id: 2, name: 'Multipurpose Grease', barcode: '890123456002', hsnCode: '27101980', category: 'Service Consumable', brand: 'Yashas Care', purchasePrice: 150, sellingPrice: 300, taxRate: 18, stockQuantity: 30, minStockThreshold: 5, unit: 'Pcs' },
  { id: 3, name: 'Chain Lubricant', barcode: '890123456003', hsnCode: '34031900', category: 'Service Consumable', brand: 'Yashas Care', purchasePrice: 180, sellingPrice: 350, taxRate: 18, stockQuantity: 30, minStockThreshold: 5, unit: 'Bottle' },
  { id: 4, name: 'Contact Cleaner', barcode: '890123456004', hsnCode: '38140010', category: 'Electrical Cleaning', brand: 'ElectraClean', purchasePrice: 220, sellingPrice: 450, taxRate: 18, stockQuantity: 20, minStockThreshold: 4, unit: 'Bottle' },
  { id: 5, name: 'Electrical Insulation Tape', barcode: '890123456005', hsnCode: '39191000', category: 'Electrical Work', brand: 'GripTape', purchasePrice: 20, sellingPrice: 50, taxRate: 18, stockQuantity: 100, minStockThreshold: 20, unit: 'Nos' },
  { id: 6, name: 'Heat Shrink Sleeve', barcode: '890123456006', hsnCode: '39173290', category: 'Electrical Work', brand: 'SleevePro', purchasePrice: 40, sellingPrice: 100, taxRate: 18, stockQuantity: 50, minStockThreshold: 10, unit: 'Set' },
  { id: 7, name: 'Cable Ties', barcode: '890123456007', hsnCode: '39269099', category: 'Electrical Work', brand: 'TieMaster', purchasePrice: 30, sellingPrice: 80, taxRate: 18, stockQuantity: 100, minStockThreshold: 20, unit: 'Set' },
  { id: 8, name: 'Cleaning Spray / Degreaser', barcode: '890123456008', hsnCode: '34029099', category: 'Cleaning', brand: 'EcoClean', purchasePrice: 160, sellingPrice: 320, taxRate: 18, stockQuantity: 25, minStockThreshold: 5, unit: 'Bottle' },
  { id: 9, name: 'Microfiber Cloth', barcode: '890123456009', hsnCode: '63071010', category: 'Cleaning', brand: 'SoftWipe', purchasePrice: 40, sellingPrice: 100, taxRate: 12, stockQuantity: 50, minStockThreshold: 10, unit: 'Nos' },
  { id: 10, name: 'Brake Cleaner', barcode: '890123456010', hsnCode: '38140010', category: 'Brake Service', brand: 'BrakeClean', purchasePrice: 190, sellingPrice: 380, taxRate: 18, stockQuantity: 25, minStockThreshold: 5, unit: 'Bottle' },

  // 2. Brakes & Wheels
  { id: 11, name: 'Front Brake Pad Set', barcode: '890123456011', hsnCode: '87141090', category: 'Brake Component', brand: 'E-Brake', purchasePrice: 180, sellingPrice: 380, taxRate: 18, stockQuantity: 40, minStockThreshold: 10, unit: 'Pair/set' },
  { id: 12, name: 'Rear Brake Pad Set', barcode: '890123456012', hsnCode: '87141090', category: 'Brake Component', brand: 'E-Brake', purchasePrice: 180, sellingPrice: 380, taxRate: 18, stockQuantity: 40, minStockThreshold: 10, unit: 'Pair/set' },
  { id: 13, name: 'Brake Shoe Set', barcode: '890123456013', hsnCode: '87141090', category: 'Brake Component', brand: 'E-Brake', purchasePrice: 220, sellingPrice: 450, taxRate: 18, stockQuantity: 30, minStockThreshold: 8, unit: 'Set' },
  { id: 14, name: 'Brake Disc / Rotor', barcode: '890123456014', hsnCode: '87141090', category: 'Brake Component', brand: 'RotorTech', purchasePrice: 450, sellingPrice: 850, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Nos' },
  { id: 15, name: 'Brake Lever', barcode: '890123456015', hsnCode: '87141090', category: 'Brake Component', brand: 'AlloyGrip', purchasePrice: 120, sellingPrice: 250, taxRate: 18, stockQuantity: 35, minStockThreshold: 8, unit: 'Nos' },
  { id: 16, name: 'Brake Cable', barcode: '890123456016', hsnCode: '87141090', category: 'Brake Component', brand: 'FlexiCore', purchasePrice: 110, sellingPrice: 220, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },
  { id: 17, name: 'Brake Caliper', barcode: '890123456017', hsnCode: '87141090', category: 'Brake Component', brand: 'HydroStop', purchasePrice: 650, sellingPrice: 1250, taxRate: 18, stockQuantity: 15, minStockThreshold: 4, unit: 'Nos' },
  { id: 18, name: 'Brake Fluid', barcode: '890123456018', hsnCode: '38190010', category: 'Brake Consumable', brand: 'DOT4 Fluid', purchasePrice: 90, sellingPrice: 180, taxRate: 18, stockQuantity: 40, minStockThreshold: 10, unit: 'Bottle' },
  { id: 19, name: 'Wheel Bearing', barcode: '890123456019', hsnCode: '84821011', category: 'Wheel Component', brand: 'SKF / NBC', purchasePrice: 80, sellingPrice: 180, taxRate: 18, stockQuantity: 50, minStockThreshold: 15, unit: 'Nos' },
  { id: 20, name: 'Tyre', barcode: '890123456020', hsnCode: '40114000', category: 'Wheel Component', brand: 'MRF / CEAT', purchasePrice: 950, sellingPrice: 1550, taxRate: 28, stockQuantity: 25, minStockThreshold: 6, unit: 'Nos' },
  { id: 21, name: 'Inner Tube', barcode: '890123456021', hsnCode: '40139049', category: 'Wheel Component', brand: 'CEAT / MRF', purchasePrice: 180, sellingPrice: 320, taxRate: 18, stockQuantity: 30, minStockThreshold: 8, unit: 'Nos' },
  { id: 22, name: 'Tubeless Valve', barcode: '890123456022', hsnCode: '84818090', category: 'Wheel Component', brand: 'BrassCore', purchasePrice: 30, sellingPrice: 80, taxRate: 18, stockQuantity: 60, minStockThreshold: 15, unit: 'Nos' },
  { id: 23, name: 'Wheel Rim', barcode: '890123456023', hsnCode: '87141090', category: 'Wheel Component', brand: 'AlloyWheel', purchasePrice: 1200, sellingPrice: 2100, taxRate: 18, stockQuantity: 12, minStockThreshold: 3, unit: 'Nos' },
  { id: 24, name: 'Puncture Repair Kit', barcode: '890123456024', hsnCode: '82055900', category: 'Repair Consumable', brand: 'QuickFix', purchasePrice: 150, sellingPrice: 300, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Kit' },

  // 3. EV Electrical & Control Components
  { id: 25, name: 'BLDC Motor Controller', barcode: '890123456025', hsnCode: '85371000', category: 'EV Electrical', brand: 'BLDC Power', purchasePrice: 2200, sellingPrice: 3800, taxRate: 18, stockQuantity: 15, minStockThreshold: 3, unit: 'Nos' },
  { id: 26, name: 'DC-DC Converter', barcode: '890123456026', hsnCode: '85044090', category: 'EV Electrical', brand: 'VoltStep', purchasePrice: 350, sellingPrice: 750, taxRate: 18, stockQuantity: 25, minStockThreshold: 5, unit: 'Nos' },
  { id: 27, name: 'DC Fuse', barcode: '890123456027', hsnCode: '85361010', category: 'Protection', brand: 'SafeFuse', purchasePrice: 20, sellingPrice: 60, taxRate: 18, stockQuantity: 100, minStockThreshold: 20, unit: 'Nos' },
  { id: 28, name: 'Fuse Holder', barcode: '890123456028', hsnCode: '85369090', category: 'Protection', brand: 'SafeFuse', purchasePrice: 30, sellingPrice: 80, taxRate: 18, stockQuantity: 60, minStockThreshold: 15, unit: 'Nos' },
  { id: 29, name: 'Main Wiring Harness', barcode: '890123456029', hsnCode: '85443000', category: 'Electrical', brand: 'WireTech', purchasePrice: 850, sellingPrice: 1650, taxRate: 18, stockQuantity: 15, minStockThreshold: 4, unit: 'Nos' },
  { id: 30, name: 'Charging Port / Socket', barcode: '890123456030', hsnCode: '85366990', category: 'Charging', brand: 'EV Port', purchasePrice: 250, sellingPrice: 550, taxRate: 18, stockQuantity: 25, minStockThreshold: 6, unit: 'Nos' },
  { id: 31, name: 'Ignition / Key Switch', barcode: '890123456031', hsnCode: '85365020', category: 'Control', brand: 'KeyLock', purchasePrice: 220, sellingPrice: 450, taxRate: 18, stockQuantity: 25, minStockThreshold: 5, unit: 'Nos' },
  { id: 32, name: 'Power / Mode Switch', barcode: '890123456032', hsnCode: '85365020', category: 'Control', brand: 'SwitchMaster', purchasePrice: 150, sellingPrice: 320, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },
  { id: 33, name: 'Horn', barcode: '890123456033', hsnCode: '85123010', category: 'Electrical', brand: 'SoundWave', purchasePrice: 140, sellingPrice: 280, taxRate: 18, stockQuantity: 35, minStockThreshold: 8, unit: 'Nos' },
  { id: 34, name: 'LED Headlight', barcode: '890123456034', hsnCode: '85122010', category: 'Lighting', brand: 'BrightBeam', purchasePrice: 450, sellingPrice: 950, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Nos' },
  { id: 35, name: 'Tail Light', barcode: '890123456035', hsnCode: '85122010', category: 'Lighting', brand: 'BrightBeam', purchasePrice: 280, sellingPrice: 580, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Nos' },
  { id: 36, name: 'Indicator Set', barcode: '890123456036', hsnCode: '85122010', category: 'Lighting', brand: 'BrightBeam', purchasePrice: 220, sellingPrice: 480, taxRate: 18, stockQuantity: 25, minStockThreshold: 6, unit: 'Set' },
  { id: 37, name: 'Brake Light Switch', barcode: '890123456037', hsnCode: '85365020', category: 'Electrical', brand: 'SensorTech', purchasePrice: 60, sellingPrice: 140, taxRate: 18, stockQuantity: 40, minStockThreshold: 10, unit: 'Nos' },
  { id: 38, name: 'Side-Stand Switch', barcode: '890123456038', hsnCode: '85365020', category: 'Safety switch', brand: 'SensorTech', purchasePrice: 120, sellingPrice: 260, taxRate: 18, stockQuantity: 25, minStockThreshold: 5, unit: 'Nos' },
  { id: 39, name: 'Throttle Assembly', barcode: '890123456039', hsnCode: '87141090', category: 'Control', brand: 'SpeedGrip', purchasePrice: 350, sellingPrice: 700, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },
  { id: 40, name: 'DC Relay', barcode: '890123456040', hsnCode: '85364100', category: 'Electrical', brand: 'PowerRelay', purchasePrice: 90, sellingPrice: 200, taxRate: 18, stockQuantity: 40, minStockThreshold: 10, unit: 'Nos' },
  { id: 41, name: 'Display / Instrument Cluster', barcode: '890123456041', hsnCode: '90292090', category: 'Control/display', brand: 'DigiDash', purchasePrice: 1400, sellingPrice: 2600, taxRate: 18, stockQuantity: 10, minStockThreshold: 3, unit: 'Nos' },
  { id: 42, name: 'DC Motor Cable Set', barcode: '890123456042', hsnCode: '85443000', category: 'Motor electrical', brand: 'HeavyWire', purchasePrice: 300, sellingPrice: 650, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Set' },

  // 4. Motor, Drivetrain & Suspension
  { id: 43, name: 'BLDC Hub Motor', barcode: '890123456043', hsnCode: '85013119', category: 'Motor', brand: 'HubDrive', purchasePrice: 4500, sellingPrice: 7500, taxRate: 18, stockQuantity: 8, minStockThreshold: 2, unit: 'Nos' },
  { id: 44, name: 'Motor Hall Sensor', barcode: '890123456044', hsnCode: '85414011', category: 'Motor electrical', brand: 'HallPCB', purchasePrice: 150, sellingPrice: 350, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },
  { id: 45, name: 'Hall Sensor Cable', barcode: '890123456045', hsnCode: '85444299', category: 'Motor electrical', brand: 'FlexCore', purchasePrice: 80, sellingPrice: 180, taxRate: 18, stockQuantity: 35, minStockThreshold: 8, unit: 'Nos' },
  { id: 46, name: 'Motor Connector', barcode: '890123456046', hsnCode: '85366990', category: 'Motor electrical', brand: 'PlugPro', purchasePrice: 90, sellingPrice: 220, taxRate: 18, stockQuantity: 40, minStockThreshold: 10, unit: 'Nos' },
  { id: 47, name: 'Motor Axle Nut', barcode: '890123456047', hsnCode: '73181600', category: 'Motor hardware', brand: 'SteelNut', purchasePrice: 30, sellingPrice: 80, taxRate: 18, stockQuantity: 50, minStockThreshold: 15, unit: 'Nos' },
  { id: 48, name: 'Drive Belt', barcode: '890123456048', hsnCode: '40103999', category: 'Drivetrain', brand: 'BeltPro', purchasePrice: 450, sellingPrice: 950, taxRate: 18, stockQuantity: 18, minStockThreshold: 4, unit: 'Nos' },
  { id: 49, name: 'Drive Chain', barcode: '890123456049', hsnCode: '73151100', category: 'Drivetrain', brand: 'RollChain', purchasePrice: 380, sellingPrice: 750, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Nos' },
  { id: 50, name: 'Sprocket', barcode: '890123456050', hsnCode: '87141090', category: 'Drivetrain', brand: 'GearWheel', purchasePrice: 220, sellingPrice: 480, taxRate: 18, stockQuantity: 22, minStockThreshold: 5, unit: 'Nos' },
  { id: 51, name: 'Chain Tensioner', barcode: '890123456051', hsnCode: '87141090', category: 'Drivetrain', brand: 'ChainGuide', purchasePrice: 180, sellingPrice: 380, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Nos' },
  { id: 52, name: 'Rear Shock Absorber', barcode: '890123456052', hsnCode: '87141090', category: 'Suspension', brand: 'ShockPro', purchasePrice: 650, sellingPrice: 1350, taxRate: 18, stockQuantity: 15, minStockThreshold: 4, unit: 'Nos' },
  { id: 53, name: 'Front Fork Oil Seal', barcode: '890123456053', hsnCode: '84842000', category: 'Suspension', brand: 'OilSeal Pro', purchasePrice: 120, sellingPrice: 280, taxRate: 18, stockQuantity: 30, minStockThreshold: 8, unit: 'Set' },
  { id: 54, name: 'Front Fork Seal', barcode: '890123456054', hsnCode: '84842000', category: 'Suspension', brand: 'DustSeal', purchasePrice: 110, sellingPrice: 260, taxRate: 18, stockQuantity: 30, minStockThreshold: 8, unit: 'Set' },
  { id: 55, name: 'Front Fork Assembly', barcode: '890123456055', hsnCode: '87141090', category: 'Suspension', brand: 'ForkMaster', purchasePrice: 1800, sellingPrice: 3200, taxRate: 18, stockQuantity: 8, minStockThreshold: 2, unit: 'Set' },

  // 5. Body, Controls & Accessories
  { id: 56, name: 'Rear View Mirror', barcode: '890123456056', hsnCode: '87141090', category: 'Body/control', brand: 'VisionGrip', purchasePrice: 140, sellingPrice: 300, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },
  { id: 57, name: 'Handlebar Grip', barcode: '890123456057', hsnCode: '87141090', category: 'Control', brand: 'ComfortGrip', purchasePrice: 90, sellingPrice: 200, taxRate: 18, stockQuantity: 35, minStockThreshold: 8, unit: 'Pair' },
  { id: 58, name: 'Throttle Grip', barcode: '890123456058', hsnCode: '87141090', category: 'Control', brand: 'ComfortGrip', purchasePrice: 110, sellingPrice: 240, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },
  { id: 59, name: 'Footrest', barcode: '890123456059', hsnCode: '87141090', category: 'Body', brand: 'AlloyStep', purchasePrice: 150, sellingPrice: 320, taxRate: 18, stockQuantity: 25, minStockThreshold: 6, unit: 'Pair' },
  { id: 60, name: 'Side Stand', barcode: '890123456060', hsnCode: '87141090', category: 'Body', brand: 'SteelStand', purchasePrice: 160, sellingPrice: 350, taxRate: 18, stockQuantity: 25, minStockThreshold: 6, unit: 'Nos' },
  { id: 61, name: 'Main Stand', barcode: '890123456061', hsnCode: '87141090', category: 'Body', brand: 'SteelStand', purchasePrice: 320, sellingPrice: 680, taxRate: 18, stockQuantity: 15, minStockThreshold: 4, unit: 'Nos' },
  { id: 62, name: 'Number Plate Holder', barcode: '890123456062', hsnCode: '87141090', category: 'Body', brand: 'PlateFit', purchasePrice: 60, sellingPrice: 150, taxRate: 18, stockQuantity: 40, minStockThreshold: 10, unit: 'Nos' },
  { id: 63, name: 'Mudguard', barcode: '890123456063', hsnCode: '87141090', category: 'Body', brand: 'FiberGuard', purchasePrice: 350, sellingPrice: 750, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Nos' },
  { id: 64, name: 'Body Panel', barcode: '890123456064', hsnCode: '87141090', category: 'Body', brand: 'ABS Panel', purchasePrice: 800, sellingPrice: 1600, taxRate: 18, stockQuantity: 12, minStockThreshold: 3, unit: 'Nos' },
  { id: 65, name: 'Seat Cover', barcode: '890123456065', hsnCode: '87141090', category: 'Body', brand: 'LeatherFit', purchasePrice: 180, sellingPrice: 380, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },
  { id: 66, name: 'Key Set', barcode: '890123456066', hsnCode: '83012000', category: 'Security/control', brand: 'SecureLock', purchasePrice: 280, sellingPrice: 580, taxRate: 18, stockQuantity: 20, minStockThreshold: 5, unit: 'Set' },
  { id: 67, name: 'USB Charging Port', barcode: '890123456067', hsnCode: '85044090', category: 'Accessory', brand: 'FastCharge', purchasePrice: 160, sellingPrice: 350, taxRate: 18, stockQuantity: 25, minStockThreshold: 5, unit: 'Nos' },
  { id: 68, name: 'Mobile Holder', barcode: '890123456068', hsnCode: '87141090', category: 'Accessory', brand: 'RideMount', purchasePrice: 150, sellingPrice: 350, taxRate: 18, stockQuantity: 30, minStockThreshold: 6, unit: 'Nos' },

  // 6. Fasteners & Workshop Small Parts
  { id: 69, name: 'Nut & Bolt Set', barcode: '890123456069', hsnCode: '73181500', category: 'Hardware', brand: 'SteelFast', purchasePrice: 40, sellingPrice: 100, taxRate: 18, stockQuantity: 80, minStockThreshold: 20, unit: 'Set' },
  { id: 70, name: 'Washer Set', barcode: '890123456070', hsnCode: '73182100', category: 'Hardware', brand: 'SteelFast', purchasePrice: 25, sellingPrice: 60, taxRate: 18, stockQuantity: 80, minStockThreshold: 20, unit: 'Set' },
  { id: 71, name: 'Screw Set', barcode: '890123456071', hsnCode: '73181400', category: 'Hardware', brand: 'SteelFast', purchasePrice: 30, sellingPrice: 75, taxRate: 18, stockQuantity: 80, minStockThreshold: 20, unit: 'Set' },
  { id: 72, name: 'Cable Lug / Terminal', barcode: '890123456072', hsnCode: '85369090', category: 'Electrical hardware', brand: 'CopperLug', purchasePrice: 10, sellingPrice: 30, taxRate: 18, stockQuantity: 150, minStockThreshold: 30, unit: 'Nos' },
  { id: 73, name: 'Crimp Terminal Set', barcode: '890123456073', hsnCode: '85369090', category: 'Electrical hardware', brand: 'CopperLug', purchasePrice: 50, sellingPrice: 120, taxRate: 18, stockQuantity: 60, minStockThreshold: 15, unit: 'Set' },
  { id: 74, name: 'Wire Connector Set', barcode: '890123456074', hsnCode: '85366990', category: 'Electrical hardware', brand: 'QuickSnap', purchasePrice: 60, sellingPrice: 150, taxRate: 18, stockQuantity: 60, minStockThreshold: 15, unit: 'Set' },
  { id: 75, name: 'Rubber Grommet', barcode: '890123456075', hsnCode: '40169990', category: 'Hardware', brand: 'FlexRubber', purchasePrice: 15, sellingPrice: 40, taxRate: 18, stockQuantity: 100, minStockThreshold: 25, unit: 'Nos' },
  { id: 76, name: 'O-Ring Set', barcode: '890123456076', hsnCode: '40169320', category: 'Sealing', brand: 'SealRing', purchasePrice: 45, sellingPrice: 110, taxRate: 18, stockQuantity: 70, minStockThreshold: 20, unit: 'Set' },

  // 7. Workshop Services
  { id: 77, name: 'EV Full General Service & Diagnostics', barcode: '890123456077', hsnCode: '998729', category: 'Services', brand: 'In-House EV Lab', purchasePrice: 0, sellingPrice: 850, taxRate: 18, stockQuantity: 999, minStockThreshold: 1, unit: 'Nos' },
  { id: 78, name: 'Brake Service & Overhaul', barcode: '890123456078', hsnCode: '998729', category: 'Services', brand: 'In-House EV Lab', purchasePrice: 0, sellingPrice: 350, taxRate: 18, stockQuantity: 999, minStockThreshold: 1, unit: 'Nos' },
  { id: 79, name: 'Wiring Inspection & Electrical Diagnostics', barcode: '890123456079', hsnCode: '998729', category: 'Services', brand: 'In-House EV Lab', purchasePrice: 0, sellingPrice: 450, taxRate: 18, stockQuantity: 999, minStockThreshold: 1, unit: 'Nos' },
  { id: 80, name: 'Fork Oil Seal Replacement Labour', barcode: '890123456080', hsnCode: '998729', category: 'Services', brand: 'In-House EV Lab', purchasePrice: 0, sellingPrice: 300, taxRate: 18, stockQuantity: 999, minStockThreshold: 1, unit: 'Nos' }
];

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.s@gmail.com',
    gstin: '',
    address: 'Indiranagar, Bengaluru',
    shippingAddress: 'Indiranagar, Bengaluru',
    regNo: 'KA 05 EV 1234',
    creditLimit: 15000,
    pendingBalance: 0
  },
  {
    id: 2,
    name: 'Suresh Kumar',
    phone: '9123456789',
    email: 'suresh.k@gmail.com',
    gstin: '',
    address: 'Koramangala, Bengaluru',
    shippingAddress: 'Koramangala, Bengaluru',
    regNo: 'KA 01 EV 5678',
    creditLimit: 10000,
    pendingBalance: 0
  }
];

const DATA_VERSION = 'v5';

export const DataProvider = ({ children }) => {
  if (localStorage.getItem('erp_data_version') !== DATA_VERSION) {
    ['erp_invoices', 'erp_expenses', 'erp_audit_logs', 'erp_products'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('erp_data_version', DATA_VERSION);
  }

  const [shopDetails, setShopDetails] = useState(() => {
    const saved = localStorage.getItem('erp_shop_details');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_DETAILS;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('erp_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('erp_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // FIX 1: invoices NEVER initialized from localStorage.
  // The database is the single source of truth.
  // Invoices start empty and are populated exclusively from the backend.
  const [invoices, setInvoices] = useState([]);

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('erp_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('erp_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // FIX 2: Only non-invoice shared data is persisted to localStorage.
  // Invoices are NOT saved to localStorage — they come exclusively from the backend.
  useEffect(() => { localStorage.setItem('erp_shop_details', JSON.stringify(shopDetails)); }, [shopDetails]);
  useEffect(() => { localStorage.setItem('erp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('erp_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('erp_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('erp_expenses', JSON.stringify(expenses)); }, [expenses]);

  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wsConnected, setWsConnected] = useState(true);

  // FIX 6: Concurrent fetch guard — prevents overlapping polling requests from racing
  const isFetchingRef = useRef(false);

  // FIX 3: fetchFromBackend ALWAYS replaces invoice state with authoritative DB state.
  // It NEVER merges local-only invoices. Database wins unconditionally.
  const fetchFromBackend = useCallback(async () => {
    if (isFetchingRef.current) return; // skip if fetch already in flight
    isFetchingRef.current = true;
    try {
      // FIX 8: use tenantId from authenticated user — never hardcode 1
      const tenantId = getAuthTenantId();
      const headers = getAuthHeaders();
      const [prodRes, invRes, custRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/products?tenantId=${tenantId}`, { headers }),
        fetch(`${API_BASE_URL}/api/invoices?tenantId=${tenantId}`, { headers }),
        fetch(`${API_BASE_URL}/api/customers?tenantId=${tenantId}`, { headers })
      ]);

      const isConnected = [prodRes, invRes, custRes].some(r => r.status === 'fulfilled' && r.value.ok);
      setIsOnline(isConnected);
      setWsConnected(isConnected);

      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
        const prodData = await prodRes.value.json();
        if (Array.isArray(prodData) && prodData.length > 0) {
          const mapped = prodData.map(p => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode || '',
            hsnCode: p.hsnCode || '',
            category: typeof p.category === 'object' ? p.category?.name : (p.category || 'General'),
            brand: typeof p.brand === 'object' ? p.brand?.name : (p.brand || ''),
            purchasePrice: p.purchasePrice || 0,
            sellingPrice: p.sellingPrice || 0,
            taxRate: p.taxRate || 18,
            stockQuantity: p.stockQuantity ?? 0,
            minStockThreshold: p.minStockThreshold ?? 5,
            unit: p.unit || 'Pcs'
          }));
          setProducts(mapped);
        }
      }

      if (invRes.status === 'fulfilled' && invRes.value.ok) {
        const invData = await invRes.value.json();
        if (Array.isArray(invData)) {
          const mapped = invData.map(inv => {
            const customerObj = typeof inv.customer === 'object' ? inv.customer : null;
            const createdByObj = typeof inv.createdBy === 'object' ? inv.createdBy : null;

            const customerName = inv.customerName || customerObj?.name || 'Walk-in Customer';
            const customerPhone = inv.customerPhone || customerObj?.phone || '';
            const billingAddress = inv.billingAddress || customerObj?.address || '';
            const shippingAddress = inv.shippingAddress || customerObj?.shippingAddress || customerObj?.address || '';
            const regNo = inv.regNo || customerObj?.regNo || '';
            const createdByName = inv.createdByName || createdByObj?.fullName || createdByObj?.username || (typeof inv.createdBy === 'string' ? inv.createdBy : 'Staff');
            const date = inv.date || (inv.createdAt ? inv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);

            const mappedItems = Array.isArray(inv.items) ? inv.items.map((item, idx) => {
              const prodObj = typeof item.product === 'object' ? item.product : null;
              return {
                id: item.id || idx + 1,
                name: item.productName || item.name || prodObj?.name || 'Item',
                productName: item.productName || item.name || prodObj?.name || 'Item',
                batchNo: item.batchNo || '',
                modelNo: item.modelNo || '',
                quantity: Number(item.quantity || 1),
                unit: item.unit || prodObj?.unit || 'Nos',
                pricePerUnit: Number(item.unitPrice || item.pricePerUnit || prodObj?.sellingPrice || 0),
                unitPrice: Number(item.unitPrice || item.pricePerUnit || prodObj?.sellingPrice || 0),
                discountType: item.discountType || 'NONE',
                discountVal: Number(item.discountVal || 0),
                taxType: item.taxType || 'NONE',
                amount: Number(item.totalPrice || item.amount || 0),
                totalPrice: Number(item.totalPrice || item.amount || 0)
              };
            }) : [];

            return {
              ...inv,
              customerName,
              customerPhone,
              billingAddress,
              shippingAddress,
              regNo,
              createdByName,
              date,
              items: mappedItems,
              grandTotal: Number(inv.grandTotal || inv.subtotal || 0),
              subtotal: Number(inv.subtotal || inv.grandTotal || 0),
              paidAmount: Number(inv.paidAmount || 0),
              balanceAmount: Number(inv.balanceAmount || 0),
              paymentStatus: inv.paymentStatus || 'PAID',
              paymentMethod: inv.paymentMethod || 'CASH',
              type: inv.type || 'TAX_INVOICE'
            };
          });
          // FIX 3: Unconditionally replace state with DB state. Never merge stale local invoices.
          setInvoices(mapped);
        }
      }

      if (custRes.status === 'fulfilled' && custRes.value.ok) {
        const custData = await custRes.value.json();
        if (Array.isArray(custData)) {
          setCustomers(custData);
        }
      }
    } catch (e) {
      // FIX 9: Log actual errors — never silently swallow
      console.error('Backend sync failed:', e.message);
      setIsOnline(false);
      setWsConnected(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Monitor online/offline network status
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); fetchFromBackend(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchFromBackend]);

  // Supabase Realtime Subscription on PostgreSQL database tables
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('public-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          fetchFromBackend();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoice_items' },
        () => {
          fetchFromBackend();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchFromBackend();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          fetchFromBackend();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [fetchFromBackend]);

  // Realtime WebSocket STOMP Connection to Spring Boot Backend
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      try {
        const wsUrl = `${WS_BASE_URL}/ws-billing-native`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          // Send STOMP CONNECT frame
          const connectFrame = `CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\0`;
          ws.send(connectFrame);
        };

        ws.onmessage = (event) => {
          const data = typeof event.data === 'string' ? event.data : '';
          if (data.startsWith('CONNECTED')) {
            // Subscribe to /topic/sync-events for instant notifications
            const subFrame = `SUBSCRIBE\nid:sub-0\ndestination:/topic/sync-events\n\n\0`;
            ws.send(subFrame);
          } else if (data.startsWith('MESSAGE')) {
            // Realtime push received from server — immediately refresh all devices
            fetchFromBackend();
          }
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 4000);
        };
      } catch (e) {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWS, 4000);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, [fetchFromBackend]);

  // Realtime Cross-Tab BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('erp_realtime_sync');
      channel.onmessage = () => {
        fetchFromBackend();
      };
      return () => {
        channel.close();
      };
    }
  }, [fetchFromBackend]);

  // Refresh when device wakes up or tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchFromBackend();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchFromBackend]);

  // Fast background polling (every 2.5 seconds) as ultra-reliable fallback
  useEffect(() => {
    fetchFromBackend();
    const interval = setInterval(fetchFromBackend, 2500);
    const handleFocus = () => fetchFromBackend();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchFromBackend]);

  const updateShopDetails = (newDetails) => {
    setShopDetails(prev => ({ ...prev, ...newDetails }));
  };

  const createNewCompany = (companyData) => {
    const created = {
      ...INITIAL_COMPANY_DETAILS,
      ...companyData
    };
    setShopDetails(created);
    return created;
  };

  const addAuditLog = (action, username, role, details) => {
    const newLog = {
      id: Date.now(),
      action,
      username: username || 'system',
      role: role || 'USER',
      details,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addProduct = async (product, user = {}) => {
    const newProd = { id: Date.now(), ...product };
    setProducts(prev => [...prev, newProd]);
    addAuditLog('PRODUCT_CREATED', user?.username, user?.role, `Added EV part ${newProd.name}`);

    try {
      const tenantId = getAuthTenantId();
      await fetch(`${API_BASE_URL}/api/products?tenantId=${tenantId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      });
      fetchFromBackend();
    } catch (e) {
      console.error('Product save failed:', e.message);
    }

    return newProd;
  };

  const deleteProduct = async (productId, user = {}) => {
    const target = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    addAuditLog('PRODUCT_DELETED', user?.username || 'owner', user?.role || 'OWNER', `Deleted inventory item ${target?.name || productId}`);

    try {
      await fetch(`${API_BASE_URL}/api/products/${productId}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchFromBackend();
    } catch (e) {
      console.error('Product delete failed:', e.message);
    }
  };

  const adjustStock = async (productId, delta, mode, user = {}) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newQty = mode === 'IN' ? p.stockQuantity + delta : Math.max(0, p.stockQuantity - delta);
        return { ...p, stockQuantity: newQty };
      }
      return p;
    }));
    addAuditLog('STOCK_ADJUSTED', user?.username, user?.role, `Stock ${mode} by ${delta} for part #${productId}`);

    try {
      await fetch(`${API_BASE_URL}/api/products/${productId}/stock?quantity=${delta}&mode=${mode}`, { method: 'PUT', headers: getAuthHeaders() });
      fetchFromBackend();
    } catch (e) {
      console.error('Stock adjustment failed:', e.message);
    }
  };

  const mapPaymentMethod = (method) => {
    if (!method) return 'CASH';
    const m = String(method).toUpperCase();
    if (['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT', 'ONLINE', 'ACCOUNT_TRANSFER'].includes(m)) {
      return m;
    }
    if (m.includes('UPI') || m.includes('ONLINE')) return 'UPI';
    if (m.includes('CARD')) return 'CARD';
    if (m.includes('BANK') || m.includes('TRANSFER')) return 'NET_BANKING';
    return 'CASH';
  };

  // FIX 4, 5, 9: addInvoice — DATABASE FIRST
  // 1. Build payload (no client-side id)
  // 2. POST to backend
  // 3. Await confirmed HTTP 200 with real DB id
  // 4. Only then refresh state from DB via fetchFromBackend
  // 5. On failure — throw so the UI shows a clear error to the user
  const addInvoice = async (invoice, user = {}) => {
    // FIX 8: use tenantId/userId from authenticated user
    const tenantId = getAuthTenantId();
    const uId = user?.id || getAuthUserId();

    const backendPayload = {
      // Do NOT send a client-generated ID — let the database generate it
      invoiceNumber: invoice.invoiceNumber || null,
      type: invoice.type || 'TAX_INVOICE',
      subtotal: Number(invoice.subtotal || invoice.grandTotal || 0),
      cgstAmount: Number(invoice.cgstAmount || 0),
      sgstAmount: Number(invoice.sgstAmount || 0),
      igstAmount: Number(invoice.igstAmount || 0),
      discountAmount: Number(invoice.discountAmount || 0),
      grandTotal: Number(invoice.grandTotal || 0),
      paidAmount: Number(invoice.paidAmount || 0),
      balanceAmount: Number(invoice.balanceAmount || 0),
      paymentStatus: invoice.paymentStatus || 'PAID',
      paymentMethod: mapPaymentMethod(invoice.paymentMethod || invoice.paymentType),
      notes: invoice.notes || '',
      customer: {
        name: invoice.customerName || invoice.customer?.name || 'Walk-in Customer',
        phone: invoice.customerPhone || invoice.customer?.phone || '',
        address: invoice.billingAddress || invoice.customer?.address || ''
      },
      items: (invoice.items || []).map(item => ({
        productName: item.productName || item.name || 'Item',
        hsnCode: item.hsnCode || '',
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.pricePerUnit || 0),
        taxRate: Number(item.taxRate || 18),
        taxAmount: Number(item.taxAmount || 0),
        totalPrice: Number(item.totalPrice || item.amount || 0)
      }))
    };

    // POST to backend first — do NOT optimistically add to state before confirmation
    const res = await fetch(`${API_BASE_URL}/api/invoices?tenantId=${tenantId}&userId=${uId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload)
    });

    // Surface server errors — never silently swallow
    if (!res.ok) {
      let errMsg = `Invoice could not be saved to the server (${res.status}). Please try again.`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) {
          errMsg = errJson.message;
        }
      } catch (_) {}
      throw new Error(errMsg);
    }

    // FIX 5: use the real database-generated ID from the backend response
    const savedFromBackend = await res.json();

    // Enrich response with frontend fields so WhatsApp modal and print template get the real customer name/phone
    const enriched = {
      ...savedFromBackend,
      customerName: invoice.customerName || invoice.customer?.name || savedFromBackend.customer?.name || 'Walk-in Customer',
      customerPhone: invoice.customerPhone || invoice.customer?.phone || savedFromBackend.customer?.phone || '',
      billingAddress: invoice.billingAddress || savedFromBackend.customer?.address || '',
      date: invoice.date || (savedFromBackend.createdAt ? savedFromBackend.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      items: Array.isArray(savedFromBackend.items) && savedFromBackend.items.length > 0
        ? savedFromBackend.items
        : (invoice.items || []),
      grandTotal: Number(savedFromBackend.grandTotal || invoice.grandTotal || 0),
      paymentMethod: savedFromBackend.paymentMethod || invoice.paymentMethod || 'CASH',
      paymentStatus: savedFromBackend.paymentStatus || invoice.paymentStatus || 'PAID'
    };

    addAuditLog(
      'INVOICE_CREATED',
      user?.username || 'owner',
      user?.role || 'OWNER',
      `Created EV Invoice #${enriched.invoiceNumber} for ₹${Number(enriched.grandTotal || 0).toLocaleString()}`
    );

    // Broadcast realtime event to other local tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('erp_realtime_sync');
        bc.postMessage('INVOICE_CREATED');
        bc.close();
      } catch (_) {}
    }

    // Refresh invoice list from DB — all devices get authoritative state
    await fetchFromBackend();
    return enriched;
  };

  const updateInvoice = (updatedInvoice, user = {}) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv));
    addAuditLog('INVOICE_UPDATED', user?.username || 'owner', user?.role || 'OWNER', `Updated Invoice #${updatedInvoice.invoiceNumber}`);
    return updatedInvoice;
  };

  // FIX 7: deleteInvoice — backend FIRST, then refresh from DB
  const deleteInvoice = async (invoiceId, user = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error(`Delete failed: server returned ${res.status}`);
      }
      addAuditLog('INVOICE_DELETED', user?.username || 'owner', user?.role || 'OWNER', `Deleted Invoice #${invoiceId}`);
      // Refresh from DB after confirmed delete
      await fetchFromBackend();
    } catch (e) {
      console.error('Invoice delete failed:', e.message);
      throw e;
    }
  };

  const addCustomer = async (customer) => {
    const newCust = { id: Date.now(), pendingBalance: 0, ...customer };
    setCustomers(prev => [...prev, newCust]);
    try {
      const tenantId = getAuthTenantId();
      await fetch(`${API_BASE_URL}/api/customers?tenantId=${tenantId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCust)
      });
      fetchFromBackend();
    } catch (e) {
      console.error('Customer save failed:', e.message);
    }
  };

  const deleteCustomer = async (customerId, user = {}) => {
    const target = customers.find(c => c.id === customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    addAuditLog('CUSTOMER_DELETED', user?.username || 'owner', user?.role || 'OWNER', `Deleted customer profile ${target?.name || customerId}`);
    try {
      await fetch(`${API_BASE_URL}/api/customers/${customerId}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchFromBackend();
    } catch (e) {
      console.error('Customer delete failed:', e.message);
    }
  };

  const recordCustomerPayment = (customerId, amount) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, pendingBalance: Math.max(0, (c.pendingBalance || 0) - amount) };
      }
      return c;
    }));
  };

  const addExpense = (expense, user = {}) => {
    const newExp = { id: Date.now(), date: new Date().toISOString().split('T')[0], ...expense };
    setExpenses(prev => [...prev, newExp]);
    addAuditLog('EXPENSE_RECORDED', user?.username, user?.role, `Recorded expense ₹${expense.amount} under ${expense.category}`);
  };

  return (
    <DataContext.Provider value={{
      shopDetails,
      updateShopDetails,
      createNewCompany,
      products,
      customers,
      invoices,
      auditLogs,
      expenses,
      addProduct,
      deleteProduct,
      adjustStock,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addCustomer,
      deleteCustomer,
      recordCustomerPayment,
      addExpense,
      addAuditLog,
      isOnline,
      wsConnected,
      refreshData: fetchFromBackend
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
