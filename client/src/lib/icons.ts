import React from "react";
import {
  ShoppingCart,
  Car,
  Utensils,
  Home,
  Zap,
  HeartPulse,
  Tv,
  Gift,
  Coffee,
  GraduationCap,
  Plane,
  Dumbbell,
  Smartphone,
  Fuel,
  Briefcase,
  FileText,
  Smile,
  Sparkles,
  Music,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface IconOption {
  value: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

export const CATEGORY_ICONS: IconOption[] = [
  { value: "shopping-cart", label: "Groceries & Shopping", icon: ShoppingCart, category: "Everyday" },
  { value: "fuel", label: "Fuel & Gas", icon: Fuel, category: "Transport" },
  { value: "car", label: "Transport & Transit", icon: Car, category: "Transport" },
  { value: "utensils", label: "Dining & Food", icon: Utensils, category: "Food" },
  { value: "coffee", label: "Coffee & Drinks", icon: Coffee, category: "Food" },
  { value: "home", label: "Housing & Rent", icon: Home, category: "Bills" },
  { value: "zap", label: "Electricity & Utilities", icon: Zap, category: "Bills" },
  { value: "heart-pulse", label: "Health & Medical", icon: HeartPulse, category: "Health" },
  { value: "tv", label: "Entertainment & Subs", icon: Tv, category: "Leisure" },
  { value: "gift", label: "Gifts & Shopping", icon: Gift, category: "Leisure" },
  { value: "music", label: "Music & Streaming", icon: Music, category: "Leisure" },
  { value: "graduation-cap", label: "Education & Learning", icon: GraduationCap, category: "Personal" },
  { value: "plane", label: "Travel & Vacations", icon: Plane, category: "Personal" },
  { value: "dumbbell", label: "Fitness & Gym", icon: Dumbbell, category: "Health" },
  { value: "smartphone", label: "Phone & Internet", icon: Smartphone, category: "Bills" },
  { value: "briefcase", label: "Work & Business", icon: Briefcase, category: "Work" },
  { value: "file-text", label: "Bills & Documents", icon: FileText, category: "Bills" },
  { value: "shield", label: "Insurance & Security", icon: Shield, category: "Bills" },
  { value: "sparkles", label: "Personal Care", icon: Sparkles, category: "Personal" },
  { value: "smile", label: "General & Lifestyle", icon: Smile, category: "General" },
];

export const iconMap: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  "car": Car,
  "utensils": Utensils,
  "home": Home,
  "zap": Zap,
  "heart-pulse": HeartPulse,
  "tv": Tv,
  "gift": Gift,
  "coffee": Coffee,
  "graduation-cap": GraduationCap,
  "plane": Plane,
  "dumbbell": Dumbbell,
  "smartphone": Smartphone,
  "fuel": Fuel,
  "briefcase": Briefcase,
  "file-text": FileText,
  "shield": Shield,
  "sparkles": Sparkles,
  "music": Music,
  "smile": Smile,
};

export function getCategoryIcon(iconKey?: string): LucideIcon {
  if (!iconKey) return Smile;
  return iconMap[iconKey] || Smile;
}

export interface CategoryPreset {
  name: string;
  icon: string;
  color: string;
  suggestedAlloc?: number;
  emoji: string;
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { name: "Fuel & Petrol", icon: "fuel", color: "#3B82F6", emoji: "⛽" },
  { name: "Groceries", icon: "shopping-cart", color: "#10B981", emoji: "🛒" },
  { name: "Dining & Food", icon: "utensils", color: "#F59E0B", emoji: "🍔" },
  { name: "House Rent", icon: "home", color: "#8B5CF6", emoji: "🏠" },
  { name: "Electricity & Bills", icon: "zap", color: "#EF4444", emoji: "⚡" },
  { name: "Health & Medicines", icon: "heart-pulse", color: "#EC4899", emoji: "💊" },
  { name: "Entertainment", icon: "tv", color: "#6366F1", emoji: "🎬" },
  { name: "Shopping", icon: "gift", color: "#F97316", emoji: "🛍️" },
  { name: "Coffee & Snacks", icon: "coffee", color: "#84CC16", emoji: "☕" },
  { name: "Education", icon: "graduation-cap", color: "#06B6D4", emoji: "📚" },
  { name: "Mobile & Wifi", icon: "smartphone", color: "#14B8A6", emoji: "📱" },
  { name: "Fitness & Sports", icon: "dumbbell", color: "#A855F7", emoji: "🏋️" },
];

export const CATEGORY_COLORS = [
  { value: "#10B981", label: "Emerald" },
  { value: "#3B82F6", label: "Ocean Blue" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#EF4444", label: "Coral Red" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#F97316", label: "Orange" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#84CC16", label: "Lime" },
  { value: "#64748B", label: "Slate" },
];
