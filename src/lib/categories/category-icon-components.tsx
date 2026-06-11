'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Baby,
  Banknote,
  Bus,
  Car,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HandHeart,
  HeartPulse,
  House,
  Landmark,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Repeat,
  Shield,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  Ticket,
  Utensils,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';

import {
  isCategoryIconName,
  type CategoryIconName,
} from '@/lib/categories/category-icon-names';

const CATEGORY_ICON_COMPONENTS: Record<CategoryIconName, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  fuel: Fuel,
  car: Car,
  bus: Bus,
  'heart-pulse': HeartPulse,
  pill: Pill,
  'graduation-cap': GraduationCap,
  zap: Zap,
  house: House,
  ticket: Ticket,
  repeat: Repeat,
  shirt: Shirt,
  'paw-print': PawPrint,
  plane: Plane,
  gift: Gift,
  shield: Shield,
  landmark: Landmark,
  wallet: Wallet,
  'arrow-left-right': ArrowLeftRight,
  'piggy-bank': PiggyBank,
  receipt: Receipt,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
  baby: Baby,
  wrench: Wrench,
  'hand-heart': HandHeart,
  banknote: Banknote,
  tag: Tag,
};

export function getCategoryIconComponent(name: string): LucideIcon {
  return isCategoryIconName(name) ? CATEGORY_ICON_COMPONENTS[name] : Tag;
}
